/**
 * Leave REST Controller
 * Handles all Leave CRUD operations via REST API
 * Uses multi-tenant database architecture with getTenantCollections()
 */

import { ObjectId } from 'mongodb';
import { getTenantCollections } from '../../config/db.js';
import {
  asyncHandler,
  buildConflictError, buildForbiddenError, buildNotFoundError,
  buildValidationError,
  ConflictError
} from '../../middleware/errorHandler.js';
import {
  buildPagination,
  extractUser,
  sendCreated,
  sendSuccess
} from '../../utils/apiResponse.js';
import { generateId } from '../../utils/idGenerator.js';
import logger, { logLeaveEvent } from '../../utils/logger.js';
import { broadcastLeaveEvents, broadcastToCompany, getSocketIO } from '../../utils/socketBroadcaster.js';
import { withTransactionRetry } from '../../utils/transactionHelper.js';
import leaveLedgerService from '../../services/leaves/leaveLedger.service.js';
import customLeavePolicyService from '../../services/leaves/customLeavePolicy.service.js';

/**
 * Helper: Check for overlapping leave requests
 */
async function checkOverlap(collections, employeeId, startDate, endDate, excludeId = null) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const filter = {
    employeeId,
    status: { $in: ['pending', 'approved'] },
    isDeleted: { $ne: true },
    $or: [
      // Overlap cases
      {
        startDate: { $lte: start },
        endDate: { $gte: start }
      },
      {
        startDate: { $lte: end },
        endDate: { $gte: end }
      },
      {
        startDate: { $gte: start },
        endDate: { $lte: end }
      }
    ]
  };

  if (excludeId) {
    filter._id = { $ne: new ObjectId(excludeId) };
  }

  const overlapping = await collections.leaves.find(filter).toArray();
  return overlapping;
}

function buildLeaveIdFilter(id) {
  if (ObjectId.isValid(id)) {
    return { $or: [{ _id: new ObjectId(id) }, { leaveId: id }] };
  }
  return { leaveId: id };
}

// SIMPLIFIED STATUS NORMALIZATION
// The main status field is the single source of truth
// Deprecated fields are populated for backward compatibility with frontend
function normalizeLeaveStatuses(leave) {
  const mainStatus = leave.status || 'pending';

  return {
    ...leave,
    status: mainStatus,
    // ========== DEPRECATED FIELDS (kept for backward compatibility) ==========
    // All deprecated fields now mirror the main status
    finalStatus: mainStatus,
    managerStatus: leave.managerStatus || mainStatus,
    employeeStatus: leave.employeeStatus || mainStatus,
    hrStatus: leave.hrStatus || mainStatus,
  };
}

/**
 * Helper: Get leave balance for an employee
 * Checks for custom policies first, then falls back to default balance
 */
async function getEmployeeLeaveBalance(collections, employeeId, leaveType, companyId = null) {
  const employee = await collections.employees.findOne({ employeeId });

  // Check for custom policy first (before early return, so it can cover employees
  // whose leaveBalance.balances array may not yet include this leave type)
  let customPolicy = null;
  if (companyId) {
    try {
      customPolicy = await customLeavePolicyService.getEmployeePolicy(companyId, employeeId, leaveType);
    } catch (error) {
      logger.warn('[Leave Balance] Custom policy check failed:', error.message);
    }
  }

  if (!employee || !employee.leaveBalance?.balances) {
    // No embedded balance data — return custom policy quota if available, else zeros
    if (customPolicy) {
      // annualQuota is the canonical field; 'days' kept for legacy compatibility
      const totalDays = customPolicy.annualQuota ?? customPolicy.days ?? 0;
      return {
        type: leaveType,
        balance: totalDays,
        used: 0,
        total: totalDays,
        hasCustomPolicy: true,
        customPolicyId: customPolicy._id?.toString(),
        customPolicyName: customPolicy.name
      };
    }
    return { type: leaveType, balance: 0, used: 0, total: 0, hasCustomPolicy: false };
  }

  // Get the base balance from the embedded employee record
  const balanceInfo = employee.leaveBalance.balances.find(b => b.type === leaveType);
  let totalDays = balanceInfo?.total || 0;
  let usedDays = balanceInfo?.used || 0;
  let balanceDays = balanceInfo?.balance || 0;

  if (customPolicy) {
    // Override total with custom policy quota.
    // The MongoDB document stores this as 'annualQuota'; 'days' is kept for backward compatibility.
    totalDays = customPolicy.annualQuota ?? customPolicy.days ?? totalDays;
    balanceDays = Math.max(0, totalDays - usedDays);

    return {
      type: leaveType,
      balance: balanceDays,
      used: usedDays,
      total: totalDays,
      hasCustomPolicy: true,
      customPolicyId: customPolicy._id?.toString(),
      customPolicyName: customPolicy.name
    };
  }

  return {
    type: leaveType,
    balance: balanceDays,
    used: usedDays,
    total: totalDays,
    hasCustomPolicy: false
  };
}

/**
 * Helper: Get employee by clerk user ID
 * Tries multiple lookup strategies for compatibility
 */
async function getEmployeeByClerkId(collections, clerkUserId) {
  // Try multiple lookup strategies in order of preference
  const employee = await collections.employees.findOne({
    $or: [
      { clerkUserId: clerkUserId },
      { userId: clerkUserId },
      { employeeId: clerkUserId }  // In case metadata has employeeId
    ],
    isDeleted: { $ne: true }
  });

  return employee;
}

/**
 * @desc    Get all leave requests with pagination and filtering
 * @route   GET /api/leaves
 * @access  Private (Employee, Manager, HR, Admin, Superadmin)
 */
export const getLeaves = asyncHandler(async (req, res) => {
  const { page, limit, search, status, leaveType, employee, startDate, endDate, sortBy, order } = req.query;
  const user = extractUser(req);
  const userRole = user.role?.toLowerCase();

  logger.debug('[Leave Controller] getLeaves', { companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Resolve current employee for scoped roles
  const scopedRoles = ['employee', 'manager', 'hr'];
  const needsEmployeeLookup = scopedRoles.includes(userRole || '');
  const currentEmployee = needsEmployeeLookup
    ? await getEmployeeByClerkId(collections, user.userId)
    : null;

  if (needsEmployeeLookup && !currentEmployee) {
    throw buildForbiddenError('Employee record not found for current user');
  }

  // Base filter with tenant isolation
  const baseFilter = {
    companyId: user.companyId,
    isDeleted: { $ne: true }
  };

  // Role-based visibility
  switch (userRole) {
    case 'employee':
      baseFilter.employeeId = currentEmployee?.employeeId;
      break;
    case 'manager':
      baseFilter.reportingManagerId = currentEmployee?.employeeId;
      break;
    case 'hr':
      // HR sees all leaves in the company that are routed to the HR pool (isHRFallback = true)
      // i.e. employees with no reporting manager — any HR user can approve/reject these
      baseFilter.isHRFallback = true;
      break;
    case 'admin':
    case 'superadmin':
      // Full visibility within company
      break;
    default:
      throw buildForbiddenError('Unauthorized to view leave requests');
  }

  // Optional filters
  if (status) {
    baseFilter.status = status;
  }

  if (leaveType) {
    baseFilter.leaveType = leaveType;
  }

  if (employee) {
    baseFilter.employeeId = employee;
  }

  const andClauses = [];

  if (startDate || endDate) {
    andClauses.push({
      $or: [
        {
          startDate: {
            $gte: new Date(startDate || '1900-01-01'),
            $lte: new Date(endDate || '2100-12-31')
          }
        },
        {
          endDate: {
            $gte: new Date(startDate || '1900-01-01'),
            $lte: new Date(endDate || '2100-12-31')
          }
        }
      ]
    });
  }

  if (search && search.trim()) {
    andClauses.push({
      $or: [
        { reason: { $regex: search, $options: 'i' } },
        { detailedReason: { $regex: search, $options: 'i' } }
      ]
    });
  }

  const filter = andClauses.length > 0 ? { ...baseFilter, $and: andClauses } : baseFilter;

  // Get total count
  const total = await collections.leaves.countDocuments(filter);

  // Build sort option
  const sort = {};
  if (sortBy) {
    sort[sortBy] = order === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const leaves = await collections.leaves
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const employeeIds = Array.from(
    new Set(leaves.map(leave => leave.employeeId).filter(Boolean))
  );
  let employeesById = new Map();
  if (employeeIds.length > 0) {
    const employees = await collections.employees.find({
      $or: [
        { employeeId: { $in: employeeIds } },
        { clerkUserId: { $in: employeeIds } }
      ],
      isDeleted: { $ne: true }
    }).toArray();

    employeesById = new Map(
      employees.flatMap(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        const designation = emp.designation || emp.jobTitle || emp.designationName || '';
        const record = { fullName, designation };
        const entries = [];
        if (emp.employeeId) entries.push([emp.employeeId, record]);
        if (emp.clerkUserId) entries.push([emp.clerkUserId, record]);
        return entries;
      })
    );
  }

  const managerIds = Array.from(
    new Set(leaves.map(leave => leave.reportingManagerId).filter(Boolean))
  );
  let managersById = new Map();
  if (managerIds.length > 0) {
    const managers = await collections.employees.find({
      $or: [
        { employeeId: { $in: managerIds } },
        { clerkUserId: { $in: managerIds } }
      ],
      isDeleted: { $ne: true }
    }).toArray();

    managersById = new Map(
      managers.flatMap(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        const entries = [];
        if (emp.employeeId) entries.push([emp.employeeId, { fullName }]);
        if (emp.clerkUserId) entries.push([emp.clerkUserId, { fullName }]);
        return entries;
      })
    );
  }

  const leavesWithEmployees = leaves.map(leave => {
    const employee = employeesById.get(leave.employeeId);
    const manager = managersById.get(leave.reportingManagerId);
    const employeeName = employee?.fullName || leave.employeeName || (leave.employeeId ? `User ${leave.employeeId}` : 'Unknown');
    const reportingManagerName = manager?.fullName || leave.reportingManagerName || '-';
    return {
      ...normalizeLeaveStatuses(leave),
      employeeName,
      employeeDesignation: employee?.designation || leave.employeeDesignation || '',
      reportingManagerName
    };
  });

  const pagination = buildPagination(pageNum, limitNum, total);

  return sendSuccess(res, leavesWithEmployees, 'Leave requests retrieved successfully', 200, pagination);
});

/**
 * @desc    Get single leave request by ID
 * @route   GET /api/leaves/:id
 * @access  Private (All authenticated users)
 */
export const getLeaveById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid leave ID format');
  }

  logger.debug('[Leave Controller] getLeaveById', { id, companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const leave = await collections.leaves.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!leave) {
    throw buildNotFoundError('Leave request', id);
  }

  const userRole = user.role?.toLowerCase();
  if (userRole === 'employee') {
    throw buildForbiddenError('Employees cannot edit leave requests after submission');
  }

  return sendSuccess(res, leave);
});

/**
 * @desc    Create new leave request
 * @route   POST /api/leaves
 * @access  Private (All authenticated users)
 */
export const createLeave = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const leaveData = req.body;

  logger.info('[Leave Controller] createLeave', { companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Resolve employee for this leave (admin can create for another employee)
  const employeeLookupId = leaveData.employeeId || user.userId;
  const employee = await collections.employees.findOne({
    $or: [
      { employeeId: employeeLookupId },
      { clerkUserId: employeeLookupId }
    ],
    isDeleted: { $ne: true }
  });

  if (!employee) {
    throw buildNotFoundError('Employee', employeeLookupId);
  }

  // Resolve reporting manager (employeeId)
  let reportingManagerId = leaveData.reportingManagerId || null;

  if (!reportingManagerId && employee.reportingTo && ObjectId.isValid(employee.reportingTo)) {
    const manager = await collections.employees.findOne({
      _id: new ObjectId(employee.reportingTo),
      isDeleted: { $ne: true }
    });
    reportingManagerId = manager?.employeeId || null;
  }

  if (reportingManagerId) {
    const managerExists = await collections.employees.findOne({
      $or: [
        { employeeId: reportingManagerId },
        { clerkUserId: reportingManagerId }
      ],
      isDeleted: { $ne: true }
    });

    if (!managerExists) {
      throw buildValidationError('reportingManagerId', 'Reporting manager not found');
    }
  }

  const userRole = user.role?.toLowerCase();
  // Route to HR when no reporting manager exists (applies to ALL roles — employee, hr, manager, etc.)
  // Any HR user can then approve the request from their dashboard
  const isHRFallback = !reportingManagerId;

  if (isHRFallback) {
    logger.info('[Leave Controller] No reporting manager — routing to HR pool for approval', {
      employeeId: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      userRole,
    });
  }

  if (reportingManagerId && reportingManagerId === employee.employeeId) {
    throw buildValidationError('reportingManagerId', 'Reporting manager cannot be the employee');
  }

  // Validate dates
  const startDate = new Date(leaveData.startDate);
  const endDate = new Date(leaveData.endDate);

  if (endDate < startDate) {
    throw buildValidationError('endDate', 'End date must be after start date');
  }

  const shouldEnforceOverlap = user.role?.toLowerCase() === 'employee';
  if (shouldEnforceOverlap) {
    const overlappingLeaves = await checkOverlap(
      collections,
      employee.employeeId,
      leaveData.startDate,
      leaveData.endDate
    );

    if (overlappingLeaves && overlappingLeaves.length > 0) {
      throw new ConflictError('You have overlapping leave requests for the same period');
    }
  }

  // Get current leave balance
  const currentBalance = await getEmployeeLeaveBalance(collections, employee.employeeId, leaveData.leaveType, user.companyId);

  // Calculate duration based on session type
  const isHalfDay = leaveData.session === 'First Half' || leaveData.session === 'Second Half';
  let duration;
  if (isHalfDay) {
    // Half-day: same-day leave = 0.5; multi-day range = totalCalendarDays - 0.5 (min 0.5)
    const diffTimeMs = Math.abs(endDate - startDate);
    const totalCalendarDays = Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24)) + 1;
    duration = Math.max(0.5, totalCalendarDays - 0.5);
  } else {
    const diffTimeMs = Math.abs(endDate - startDate);
    duration = Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24)) + 1;
  }

  // Prepare leave data
  // SIMPLIFIED APPROVAL WORKFLOW: Single status + isHRFallback flag determines who can approve
  // - If isHRFallback = false: Reporting manager approves (HR only views)
  // - If isHRFallback = true: HR approves (no reporting manager assigned)
  const leaveToInsert = {
    leaveId: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    companyId: user.companyId,
    employeeId: employee.employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    departmentId: leaveData.departmentId || employee.departmentId || employee.department || null,
    leaveType: leaveData.leaveType,
    startDate: new Date(leaveData.startDate),
    endDate: new Date(leaveData.endDate),
    fromDate: new Date(leaveData.startDate),
    toDate: new Date(leaveData.endDate),
    session: leaveData.session || 'Full Day',
    isHalfDay,
    halfDayType: isHalfDay
      ? (leaveData.session === 'First Half' ? 'first-half' : 'second-half')
      : null,
    duration: duration,
    reason: leaveData.reason || '',
    detailedReason: leaveData.detailedReason || '',
    // Main status field (single source of truth)
    status: 'pending',
    // Determines who can approve this request
    isHRFallback,
    // Reporting manager (null if HR fallback)
    reportingManagerId: isHRFallback ? null : reportingManagerId,
    balanceAtRequest: currentBalance.balance,
    handoverToId: leaveData.handoverTo || null,
    attachments: leaveData.attachments || [],
    createdBy: user.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    // ========== DEPRECATED FIELDS (kept for backward compatibility) ==========
    employeeStatus: 'pending',
    managerStatus: 'pending',  // No longer set to 'approved' - use isHRFallback flag instead
    hrStatus: 'pending',
    finalStatus: 'pending',
  };

  const result = await collections.leaves.insertOne(leaveToInsert);

  if (!result.insertedId) {
    throw new Error('Failed to create leave request');
  }

  // Get created leave
  const leave = await collections.leaves.findOne({ _id: result.insertedId });

  if (leave) {
    logLeaveEvent('create', leave, user);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastLeaveEvents.created(io, user.companyId, leave);
  }

  return sendCreated(res, leave, 'Leave request created successfully');
});

/**
 * @desc    Update leave request
 * @route   PUT /api/leaves/:id
 * @access  Private (Admin, HR, Owner)
 */
export const updateLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid leave ID format');
  }

  logger.info('[Leave Controller] updateLeave', { id, companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const leave = await collections.leaves.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!leave) {
    throw buildNotFoundError('Leave request', id);
  }

  // Check if leave can be updated
  if (leave.status === 'approved' || leave.status === 'rejected') {
    throw buildConflictError('Cannot update ' + leave.status + ' leave request');
  }

  // Check for overlapping leaves if dates are being updated
  if (updateData.startDate || updateData.endDate) {
    const newStartDate = updateData.startDate || leave.startDate;
    const newEndDate = updateData.endDate || leave.endDate;
    const shouldEnforceOverlap = user.role?.toLowerCase() === 'employee';

    if (shouldEnforceOverlap) {
      const overlappingLeaves = await checkOverlap(
        collections,
        leave.employeeId,
        newStartDate,
        newEndDate,
        id
      );

      if (overlappingLeaves && overlappingLeaves.length > 0) {
        throw new ConflictError('Overlapping leave requests exist for the new dates');
      }
    }
  }

  // Build update object
  const updateObj = {
    ...updateData,
    updatedBy: user.userId,
    updatedAt: new Date()
  };

  if (updateData.startDate) {
    updateObj.fromDate = new Date(updateData.startDate);
  }
  if (updateData.endDate) {
    updateObj.toDate = new Date(updateData.endDate);
  }

  const result = await collections.leaves.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObj }
  );

  if (result.matchedCount === 0) {
    throw buildNotFoundError('Leave request', id);
  }

  // Get updated leave
  const updatedLeave = await collections.leaves.findOne({ _id: new ObjectId(id) });

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastLeaveEvents.updated(io, user.companyId, updatedLeave);
  }

  return sendSuccess(res, updatedLeave, 'Leave request updated successfully');
});

/**
 * @desc    Delete leave request (soft delete)
 * @route   DELETE /api/leaves/:id
 * @access  Private (Admin, Superadmin, Owner)
 */
export const deleteLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid leave ID format');
  }

  logger.info('[Leave Controller] deleteLeave', { id, companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const leave = await collections.leaves.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!leave) {
    throw buildNotFoundError('Leave request', id);
  }

  // Check if leave can be deleted
  if (leave.status === 'approved') {
    throw buildConflictError('Cannot delete approved leave request. Cancel it instead.');
  }

  // Soft delete
  const result = await collections.leaves.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.userId
      }
    }
  );

  if (result.matchedCount === 0) {
    throw buildNotFoundError('Leave request', id);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastLeaveEvents.deleted(io, user.companyId, leave.leaveId, user.userId);
  }

  return sendSuccess(res, {
    _id: leave._id,
    leaveId: leave.leaveId,
    isDeleted: true
  }, 'Leave request deleted successfully');
});

/**
 * @desc    Get my leave requests
 * @route   GET /api/leaves/my
 * @access  Private (All authenticated users)
 */
export const getMyLeaves = asyncHandler(async (req, res) => {
  const { page, limit, status, leaveType } = req.query;
  const user = extractUser(req);

  logger.debug('[Leave Controller] getMyLeaves', { companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Get Employee record
  const employee = await getEmployeeByClerkId(collections, user.userId);

  if (!employee) {
    return sendSuccess(res, [], 'No leave requests found');
  }

  // Build filter
  const filter = {
    employeeId: employee.employeeId,
    isDeleted: { $ne: true }
  };

  // Apply status filter
  if (status) {
    filter.status = status;
  }

  // Apply leave type filter
  if (leaveType) {
    filter.leaveType = leaveType;
  }

  // Get total count
  const total = await collections.leaves.countDocuments(filter);

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const leaves = await collections.leaves
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const managerIds = Array.from(
    new Set(leaves.map(leave => leave.reportingManagerId).filter(Boolean))
  );
  let managersById = new Map();
  if (managerIds.length > 0) {
    const managers = await collections.employees.find({
      $or: [
        { employeeId: { $in: managerIds } },
        { clerkUserId: { $in: managerIds } }
      ],
      isDeleted: { $ne: true }
    }).toArray();

    managersById = new Map(
      managers.flatMap(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        const entries = [];
        if (emp.employeeId) entries.push([emp.employeeId, { fullName }]);
        if (emp.clerkUserId) entries.push([emp.clerkUserId, { fullName }]);
        return entries;
      })
    );
  }

  const leavesWithManagers = leaves.map(leave => {
    const manager = managersById.get(leave.reportingManagerId);
    return {
      ...normalizeLeaveStatuses(leave),
      reportingManagerName: manager?.fullName || leave.reportingManagerName || '-'
    };
  });

  const pagination = buildPagination(pageNum, limitNum, total);

  return sendSuccess(res, leavesWithManagers, 'My leave requests retrieved successfully', 200, pagination);
});

/**
 * @desc    Get leaves by status
 * @route   GET /api/leaves/status/:status
 * @access  Private (Employee, Manager, HR, Admin, Superadmin)
 */
export const getLeavesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page, limit } = req.query;
  const user = extractUser(req);
  const userRole = user.role?.toLowerCase();

  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'on-hold'];
  if (!validStatuses.includes(status)) {
    throw buildValidationError('status', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  logger.debug('[Leave Controller] getLeavesByStatus called', { status, companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const scopedRoles = ['employee', 'manager', 'hr'];
  const needsEmployeeLookup = scopedRoles.includes(userRole || '');
  const currentEmployee = needsEmployeeLookup
    ? await getEmployeeByClerkId(collections, user.userId)
    : null;

  if (needsEmployeeLookup && !currentEmployee) {
    throw buildForbiddenError('Employee record not found for current user');
  }

  const filter = {
    companyId: user.companyId,
    status,
    isDeleted: { $ne: true }
  };

  switch (userRole) {
    case 'employee':
      filter.employeeId = currentEmployee?.employeeId;
      break;
    case 'manager':
      filter.reportingManagerId = currentEmployee?.employeeId;
      break;
    case 'hr':
      // HR sees all leaves in the company that are routed to the HR pool (isHRFallback = true)
      filter.isHRFallback = true;
      break;
    case 'admin':
    case 'superadmin':
      break;
    default:
      throw buildForbiddenError('Unauthorized to view leave requests');
  }

  const total = await collections.leaves.countDocuments(filter);

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const leaves = await collections.leaves
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const pagination = buildPagination(pageNum, limitNum, total);

  return sendSuccess(res, leaves, `Leave requests with status '${status}' retrieved successfully`, 200, pagination);
});

/**
 * @desc    Approve leave request
 * @route   POST /api/leaves/:id/approve
 * @access  Private (Admin, HR, Manager)
 */
export const approveLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comments } = req.body;
  const user = extractUser(req);
  const userRole = user.role?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isManager = userRole === 'manager';
  const isHR = userRole === 'hr';

  if (!id) {
    throw buildValidationError('id', 'Leave ID is required');
  }

  logger.info('[Leave Controller] approveLeave', { id, companyId: user.companyId });

  // Use transaction for atomic leave approval and balance update
  const result = await withTransactionRetry(user.companyId, async (collections, session) => {
    // Find leave within transaction
    const leave = await collections.leaves.findOne(
      { ...buildLeaveIdFilter(id), isDeleted: { $ne: true } },
      { session }
    );

    if (!leave) {
      throw buildNotFoundError('Leave request', id);
    }

    const currentEmployee = await getEmployeeByClerkId(collections, user.userId);

    if (!isAdmin && !currentEmployee) {
      throw buildForbiddenError('Not authorized to approve this leave request');
    }

    const approverEmployeeId = currentEmployee?.employeeId;
    const approverDeptId = currentEmployee?.departmentId || user.departmentId;

    // Check authorization based on role
    // SIMPLIFIED APPROVAL WORKFLOW: Only ONE approval needed
    if (isManager) {
      // Managers can ONLY approve if they are the assigned reporting manager
      if (leave.isHRFallback) {
        throw buildForbiddenError('This leave request is routed to HR for approval (no reporting manager assigned)');
      }
      if (!leave.reportingManagerId || leave.reportingManagerId !== approverEmployeeId) {
        throw buildForbiddenError('Only the assigned reporting manager can approve this leave request');
      }
    } else if (isHR) {
      // Any HR user can approve leaves routed to the HR pool (isHRFallback = true)
      // HR cannot approve leaves that have an assigned reporting manager
      if (!leave.isHRFallback) {
        throw buildForbiddenError('This leave has an assigned reporting manager. Only they can approve it.');
      }
    } else if (!isAdmin) {
      throw buildForbiddenError('Not authorized to approve this leave request');
    }

    if (!isAdmin && leave.employeeId === approverEmployeeId) {
      throw buildForbiddenError('Employees cannot approve their own leave requests');
    }

    // Check if leave can be approved
    if (leave.status !== 'pending') {
      throw buildConflictError('Can only approve pending leave requests');
    }

    // Prepare update object (SIMPLIFIED: only update main status field)
    const updateObj = {
      status: 'approved',
      approvedBy: user.userId,
      approvedAt: new Date(),
      approvalComments: comments || '',
      updatedAt: new Date(),
      // ========== DEPRECATED FIELDS (kept for backward compatibility) ==========
      managerStatus: 'approved',
      finalStatus: 'approved',
    };

    // Update leave status within transaction
    await collections.leaves.updateOne(
      { _id: leave._id },
      { $set: updateObj },
      { session }
    );

    // Update employee leave balance within transaction
    const employee = await collections.employees.findOne(
      { employeeId: leave.employeeId },
      { session }
    );

    let updatedLeaveBalances = null;
    if (employee && employee.leaveBalance?.balances) {
      const balanceIndex = employee.leaveBalance.balances.findIndex(
        b => b.type === leave.leaveType
      );

      if (balanceIndex !== -1) {
        // Create a copy to avoid mutation
        updatedLeaveBalances = employee.leaveBalance.balances.map(b => ({ ...b }));
        updatedLeaveBalances[balanceIndex].used += leave.duration;
        updatedLeaveBalances[balanceIndex].balance -= leave.duration;

        // Update employee leave balance
        await collections.employees.updateOne(
          { employeeId: leave.employeeId },
          { $set: { 'leaveBalance.balances': updatedLeaveBalances } },
          { session }
        );

        // Create ledger entry for leave usage
        try {
          await leaveLedgerService.recordLeaveUsage(
            user.companyId,
            leave.employeeId,
            leave.leaveType,
            leave.duration,
            leave._id.toString(),
            leave.startDate,
            leave.endDate,
            `Leave approved by ${currentEmployee.firstName} ${currentEmployee.lastName}`
          );
          logger.info(`[Leave Approval] Ledger entry created for ${leave.employeeId}, ${leave.leaveType}, ${leave.duration} days`);
        } catch (ledgerError) {
          // Log error but don't fail the transaction
          logger.error('[Leave Approval] Failed to create ledger entry:', ledgerError);
        }
      }
    }

    // Get updated leave
    const updatedLeave = await collections.leaves.findOne(
      { _id: leave._id },
      { session }
    );

    return { leave: updatedLeave, employee, employeeLeaveBalances: updatedLeaveBalances };
  });

  // Broadcast events outside transaction (after commit)
  const io = getSocketIO(req);
  if (io) {
    // Broadcast leave approval
    broadcastLeaveEvents.approved(io, user.companyId, result.leave, user.userId);

    // Broadcast balance update if changed
    if (result.employeeLeaveBalances) {
      broadcastLeaveEvents.balanceUpdated(io, user.companyId, result.employee._id, result.employeeLeaveBalances);
    }
  }

  if (result?.leave) {
    logLeaveEvent('approve', result.leave, user);
  }

  return sendSuccess(res, result.leave, 'Leave request approved successfully');
});

/**
 * @desc    Reject leave request
 * @route   POST /api/leaves/:id/reject
 * @access  Private (Admin, HR, Manager)
 */
export const rejectLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = extractUser(req);
  const userRole = user.role?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isManager = userRole === 'manager';
  const isHR = userRole === 'hr';

  if (!reason || !reason.trim()) {
    throw buildValidationError('reason', 'Rejection reason is required');
  }

  if (!id) {
    throw buildValidationError('id', 'Leave ID is required');
  }

  logger.info('[Leave Controller] rejectLeave', { id, companyId: user.companyId });

  // Use transaction for consistent leave rejection
  const updatedLeave = await withTransactionRetry(user.companyId, async (collections, session) => {
    // Find leave within transaction
    const leave = await collections.leaves.findOne(
      { ...buildLeaveIdFilter(id), isDeleted: { $ne: true } },
      { session }
    );

    if (!leave) {
      throw buildNotFoundError('Leave request', id);
    }

    const currentEmployee = await getEmployeeByClerkId(collections, user.userId);

    if (!isAdmin && !currentEmployee) {
      throw buildForbiddenError('Not authorized to reject this leave request');
    }

    const rejectorEmployeeId = currentEmployee?.employeeId;

    // Check authorization based on role
    // SIMPLIFIED APPROVAL WORKFLOW: Only ONE approval/rejection needed
    if (isManager) {
      // Managers can ONLY reject if they are the assigned reporting manager
      if (leave.isHRFallback) {
        throw buildForbiddenError('This leave request is routed to HR for rejection (no reporting manager assigned)');
      }
      if (!leave.reportingManagerId || leave.reportingManagerId !== rejectorEmployeeId) {
        throw buildForbiddenError('Only the assigned reporting manager can reject this leave request');
      }
    } else if (isHR) {
      // Any HR user can reject leaves routed to the HR pool (isHRFallback = true)
      // HR cannot reject leaves that have an assigned reporting manager
      if (!leave.isHRFallback) {
        throw buildForbiddenError('This leave has an assigned reporting manager. Only they can reject it.');
      }
    } else if (!isAdmin) {
      throw buildForbiddenError('Not authorized to reject this leave request');
    }

    if (!isAdmin && leave.employeeId === rejectorEmployeeId) {
      throw buildForbiddenError('Employees cannot reject their own leave requests');
    }

    // Check if leave can be rejected
    if (leave.status !== 'pending') {
      throw buildConflictError('Can only reject pending leave requests');
    }

    // Prepare update object (SIMPLIFIED: only update main status field)
    const updateObj = {
      status: 'rejected',
      rejectedBy: user.userId,
      rejectedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date(),
      // ========== DEPRECATED FIELDS (kept for backward compatibility) ==========
      managerStatus: 'rejected',
      finalStatus: 'rejected',
    };

    // Update leave status within transaction
    await collections.leaves.updateOne(
      { _id: leave._id },
      { $set: updateObj },
      { session }
    );

    // Get updated leave
    return await collections.leaves.findOne(
      { _id: leave._id },
      { session }
    );
  });

  // Broadcast event outside transaction (after commit)
  const io = getSocketIO(req);
  if (io) {
    broadcastLeaveEvents.rejected(io, user.companyId, updatedLeave, user.userId, reason);
  }

  if (updatedLeave) {
    logLeaveEvent('reject', updatedLeave, user);
  }

  return sendSuccess(res, updatedLeave, 'Leave request rejected successfully');
});

/**
 * @desc    Manager approval/rejection action
 * @route   PATCH /api/leaves/:id/manager-action
 * @access  Private (Manager, Admin, Superadmin)
 */
export const managerActionLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason, comments } = req.body || {};
  const user = extractUser(req);
  const userRole = user.role?.toLowerCase();

  if (!id) {
    throw buildValidationError('id', 'Leave ID is required');
  }

  const normalizedAction = (action || '').toString().toLowerCase();
  if (!['approved', 'rejected'].includes(normalizedAction)) {
    throw buildValidationError('action', 'Action must be approved or rejected');
  }

  if (normalizedAction === 'rejected' && (!reason || !reason.trim())) {
    throw buildValidationError('reason', 'Rejection reason is required');
  }

  const collections = getTenantCollections(user.companyId);
  const currentEmployee = await getEmployeeByClerkId(collections, user.userId);

  if (!currentEmployee) {
    throw buildNotFoundError('Employee', user.userId);
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isManager = userRole === 'manager';

  const result = await withTransactionRetry(user.companyId, async (tenantCollections, session) => {
    const leave = await tenantCollections.leaves.findOne(
      { ...buildLeaveIdFilter(id), isDeleted: { $ne: true } },
      { session }
    );

    if (!leave) {
      throw buildNotFoundError('Leave request', id);
    }

    if (leave.status && leave.status !== 'pending') {
      throw buildConflictError('This leave has already been processed');
    }

    if (!isAdmin) {
      if (!isManager) {
        throw buildForbiddenError('Not authorized to approve or reject this leave request');
      }

      // For HR fallback leaves, managers cannot take action (only HR can)
      if (leave.isHRFallback) {
        throw buildForbiddenError('This leave request is routed to HR for approval');
      }

      if (leave.reportingManagerId && leave.reportingManagerId !== currentEmployee.employeeId) {
        throw buildForbiddenError('Only the reporting manager can approve or reject this leave request');
      }

      if (leave.employeeId === currentEmployee.employeeId) {
        throw buildForbiddenError('Employees cannot approve their own leave requests');
      }
    }

    // Update object (SIMPLIFIED: only update main status field)
    const updateObj = {
      status: normalizedAction,
      updatedAt: new Date(),
      // ========== DEPRECATED FIELDS (kept for backward compatibility) ==========
      managerStatus: normalizedAction,
      finalStatus: normalizedAction,
    };

    if (normalizedAction === 'approved') {
      updateObj.approvedBy = user.userId;
      updateObj.approvedAt = new Date();
      updateObj.approvalComments = comments || '';
    } else {
      updateObj.rejectedBy = user.userId;
      updateObj.rejectedAt = new Date();
      updateObj.rejectionReason = reason;
    }

    await tenantCollections.leaves.updateOne(
      { _id: leave._id },
      { $set: updateObj },
      { session }
    );

    let updatedLeaveBalances = null;
    let employee = null;

    if (normalizedAction === 'approved') {
      employee = await tenantCollections.employees.findOne(
        { employeeId: leave.employeeId },
        { session }
      );

      if (employee && employee.leaveBalance?.balances) {
        const balanceIndex = employee.leaveBalance.balances.findIndex(
          b => b.type === leave.leaveType
        );

        if (balanceIndex !== -1) {
          updatedLeaveBalances = employee.leaveBalance.balances.map(b => ({ ...b }));
          updatedLeaveBalances[balanceIndex].used += leave.duration;
          updatedLeaveBalances[balanceIndex].balance -= leave.duration;

          await tenantCollections.employees.updateOne(
            { employeeId: leave.employeeId },
            { $set: { 'leaveBalance.balances': updatedLeaveBalances } },
            { session }
          );
        }
      }
    }

    const updatedLeave = await tenantCollections.leaves.findOne(
      { _id: leave._id },
      { session }
    );

    return { leave: updatedLeave, employee, employeeLeaveBalances: updatedLeaveBalances };
  });

  const io = getSocketIO(req);
  if (io) {
    if (normalizedAction === 'approved') {
      broadcastLeaveEvents.approved(io, user.companyId, result.leave, user.userId);
    } else {
      broadcastLeaveEvents.rejected(io, user.companyId, result.leave, user.userId, reason);
    }

    if (result.employeeLeaveBalances) {
      broadcastLeaveEvents.balanceUpdated(io, user.companyId, result.employee._id, result.employeeLeaveBalances);
    }
  }

  if (result?.leave) {
    logLeaveEvent(normalizedAction, result.leave, user);
  }

  return sendSuccess(res, result.leave, `Leave request ${normalizedAction} successfully`);
});

/**
 * @desc    Cancel leave request
 * @route   POST /api/leaves/:id/cancel
 * @access  Private (All authenticated users)
 */
export const cancelLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = extractUser(req);

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid leave ID format');
  }

  logger.debug('[Leave Controller] cancelLeave called', { id, companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const leave = await collections.leaves.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!leave) {
    throw buildNotFoundError('Leave request', id);
  }

  // Get Employee record to verify ownership
  const employee = await getEmployeeByClerkId(collections, user.userId);

  if (!employee || employee.employeeId !== leave.employeeId) {
    // Allow admins to cancel any leave (case-insensitive)
    const userRole = user.role?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'hr' || userRole === 'superadmin';
    if (!isAdmin) {
      throw buildConflictError('You can only cancel your own leave requests');
    }
  }

  // Check if leave can be cancelled
  if (leave.status === 'cancelled') {
    throw buildConflictError('Leave is already cancelled');
  }

  if (leave.status === 'rejected') {
    throw buildConflictError('Cannot cancel a rejected leave request');
  }

  // Check if leave has already started
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const leaveStartDate = new Date(leave.startDate);
  leaveStartDate.setHours(0, 0, 0, 0);

  if (leaveStartDate <= today && leave.status === 'approved') {
    throw buildConflictError('Cannot cancel leave that has already started. Please contact HR.');
  }

  // Cancel leave
  const updateObj = {
    status: 'cancelled',
    cancelledBy: user.userId,
    cancelledAt: new Date(),
    cancellationReason: reason || 'Cancelled by employee',
    updatedAt: new Date()
  };

  await collections.leaves.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObj }
  );

  // Restore balance if leave was previously approved
  if (leave.status === 'approved') {
    const employee = await collections.employees.findOne({
      employeeId: leave.employeeId
    });

    if (employee && employee.leaveBalance?.balances) {
      const balanceIndex = employee.leaveBalance.balances.findIndex(
        b => b.type === leave.leaveType
      );

      if (balanceIndex !== -1) {
        // Restore the deducted balance
        employee.leaveBalance.balances[balanceIndex].used -= leave.duration;
        employee.leaveBalance.balances[balanceIndex].balance += leave.duration;

        await collections.employees.updateOne(
          { employeeId: leave.employeeId },
          { $set: { 'leaveBalance.balances': employee.leaveBalance.balances } }
        );

        // Create ledger entry for balance restoration
        try {
          await leaveLedgerService.recordLeaveRestoration(
            user.companyId,
            leave.employeeId,
            leave.leaveType,
            leave.duration,
            leave._id.toString(),
            'Leave cancelled - balance restored'
          );
          logger.info(`[Leave Cancellation] Ledger entry created for ${leave.employeeId}, ${leave.leaveType}, ${leave.duration} days restored`);
        } catch (ledgerError) {
          // Log error but don't fail the cancellation
          logger.error('[Leave Cancellation] Failed to create ledger entry:', ledgerError);
        }

        // Broadcast balance update
        const io = getSocketIO(req);
        if (io) {
          broadcastLeaveEvents.balanceUpdated(io, user.companyId, employee._id, employee.leaveBalance.balances);
        }
      }
    }
  }

  // Get updated leave
  const updatedLeave = await collections.leaves.findOne({ _id: new ObjectId(id) });

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastLeaveEvents.cancelled(io, user.companyId, updatedLeave, user.userId);
  }

  return sendSuccess(res, updatedLeave, 'Leave request cancelled successfully');
});

/**
 * @desc    Get leave balance
 * @route   GET /api/leaves/balance
 * @access  Private (All authenticated users)
 */
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const { leaveType } = req.query;
  const user = extractUser(req);

  logger.debug('[Leave Controller] getLeaveBalance called', { companyId: user.companyId, userId: user.userId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Get Employee record
  const employee = await getEmployeeByClerkId(collections, user.userId);

  if (!employee) {
    // Return zero balances gracefully instead of throwing an error
    const leaveTypes = ['sick', 'casual', 'earned', 'maternity', 'paternity', 'bereavement', 'compensatory', 'unpaid', 'special'];
    const emptyBalances = {};
    for (const type of leaveTypes) {
      emptyBalances[type] = { type, balance: 0, used: 0, total: 0 };
    }
    if (leaveType) {
      return sendSuccess(res, { type: leaveType, balance: 0, used: 0, total: 0 }, 'Leave balance retrieved successfully');
    }
    return sendSuccess(res, emptyBalances, 'Leave balance retrieved successfully');
  }

  // Get balance for specific type or all types
  if (leaveType) {
    const balance = await getEmployeeLeaveBalance(collections, employee.employeeId, leaveType, user.companyId);
    return sendSuccess(res, balance, 'Leave balance retrieved successfully');
  }

  // Get all leave balances
  const balances = {};
  const leaveTypes = ['sick', 'casual', 'earned', 'maternity', 'paternity', 'bereavement', 'compensatory', 'unpaid', 'special'];

  for (const type of leaveTypes) {
    balances[type] = await getEmployeeLeaveBalance(collections, employee.employeeId, type, user.companyId);
  }

  return sendSuccess(res, balances, 'All leave balances retrieved successfully');
});

/**
 * @desc    Get team leave requests (for managers)
 * @route   GET /api/leaves/team
 * @access  Private (Manager, Admin, HR, Superadmin)
 */
export const getTeamLeaves = asyncHandler(async (req, res) => {
  const { page, limit, status, leaveType, department } = req.query;
  const user = extractUser(req);

  logger.debug('[Leave Controller] getTeamLeaves called', { companyId: user.companyId, userId: user.userId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Get current employee (manager)
  const currentEmployee = await getEmployeeByClerkId(collections, user.userId);

  if (!currentEmployee) {
    throw buildNotFoundError('Employee', user.userId);
  }

  // Build filter for team leaves
  const filter = {
    companyId: user.companyId,
    isDeleted: { $ne: true }
  };

  // Apply status filter
  if (status) {
    filter.status = status;
  }

  // Apply leave type filter
  if (leaveType) {
    filter.leaveType = leaveType;
  }

  // Get team members based on role (case-insensitive)
  let teamEmployeeIds = [];
  const userRole = user.role?.toLowerCase();

  if (userRole === 'admin' || userRole === 'hr' || userRole === 'superadmin') {
    // Admins/HR can see all employees
    const allEmployees = await collections.employees.find({
      companyId: user.companyId,
      isDeleted: { $ne: true }
    }).toArray();
    teamEmployeeIds = allEmployees.map(emp => emp.employeeId);
  } else if (userRole === 'manager') {
    // Managers can see their department employees
    const deptFilter = {
      companyId: user.companyId,
      isDeleted: { $ne: true }
    };

    // Filter by department if specified, or use manager's department
    if (department) {
      deptFilter.departmentId = department;
    } else if (currentEmployee.departmentId) {
      deptFilter.departmentId = currentEmployee.departmentId;
    }

    const teamEmployees = await collections.employees.find(deptFilter).toArray();
    teamEmployeeIds = teamEmployees.map(emp => emp.employeeId);
  } else {
    // Other roles can only see their own leaves
    teamEmployeeIds = [currentEmployee.employeeId];
  }

  if (teamEmployeeIds.length === 0) {
    return sendSuccess(res, [], 'No team members found');
  }

  filter.employeeId = { $in: teamEmployeeIds };

  // Get total count
  const total = await collections.leaves.countDocuments(filter);

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Get leave records
  const leaves = await collections.leaves
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const pagination = buildPagination(pageNum, limitNum, total);

  return sendSuccess(res, leaves, 'Team leave requests retrieved successfully', 200, pagination);
});

/**
 * @desc    Upload attachment for leave request
 * @route   POST /api/leaves/:leaveId/attachments
 * @access  Private
 */
export const uploadAttachment = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;
  const user = extractUser(req);

  logger.debug('[Leave Controller] uploadAttachment called', { leaveId, companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find leave request
  const leave = await collections.leaves.findOne({
    leaveId: leaveId,
    companyId: user.companyId,
    isDeleted: false
  });

  if (!leave) {
    throw buildNotFoundError('Leave request', leaveId);
  }

  // Get Employee record
  const employee = await getEmployeeByClerkId(collections, user.userId);

  // Check authorization - employee can only upload to their own leaves, admins can upload to any (case-insensitive)
  const userRole = user.role?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'hr' || userRole === 'superadmin';
  if (leave.employeeId !== employee?.employeeId && !isAdmin) {
    throw buildForbiddenError('Not authorized to upload attachments for this leave');
  }

  if (!req.file) {
    throw buildValidationError('file', 'No file uploaded');
  }

  // Phase 2.3: Add file size and type validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  // Check file size
  if (req.file.size > MAX_FILE_SIZE) {
    throw buildValidationError('file', `File size exceeds maximum allowed size of 5MB. Your file is ${(req.file.size / (1024 * 1024)).toFixed(2)}MB`);
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    throw buildValidationError('file', `File type not allowed. Allowed types: PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX`);
  }

  const attachment = {
    attachmentId: generateId('ATT', user.companyId),
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/leave-attachments/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date(),
    uploadedBy: user.userId
  };

  // Initialize attachments array if it doesn't exist
  const currentAttachments = leave.attachments || [];
  const maxAttachments = 5;

  if (currentAttachments.length >= maxAttachments) {
    throw buildValidationError(`Maximum ${maxAttachments} attachments allowed per leave request`);
  }

  // Add attachment
  await collections.leaves.updateOne(
    { _id: leave._id },
    {
      $push: { attachments: attachment },
      $set: { updatedAt: new Date() }
    }
  );

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastToCompany(io, user.companyId, 'leave:attachment_uploaded', {
      leaveId: leave.leaveId,
      attachment,
      uploadedBy: user.userId
    });
  }

  return sendSuccess(res, attachment, 'Attachment uploaded successfully');
});

/**
 * @desc    Delete attachment from leave request
 * @route   DELETE /api/leaves/:leaveId/attachments/:attachmentId
 * @access  Private
 */
export const deleteAttachment = asyncHandler(async (req, res) => {
  const { leaveId, attachmentId } = req.params;
  const user = extractUser(req);

  logger.debug('[Leave Controller] deleteAttachment called', { leaveId, attachmentId, companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find leave request
  const leave = await collections.leaves.findOne({
    leaveId: leaveId,
    companyId: user.companyId,
    isDeleted: false
  });

  if (!leave) {
    throw buildNotFoundError('Leave request', leaveId);
  }

  // Get Employee record
  const employee = await getEmployeeByClerkId(collections, user.userId);

  // Check authorization (case-insensitive)
  const userRole = user.role?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'hr' || userRole === 'superadmin';
  if (leave.employeeId !== employee?.employeeId && !isAdmin) {
    throw buildForbiddenError('Not authorized to delete attachments from this leave');
  }

  // Find the attachment
  const attachments = leave.attachments || [];
  const attachmentIndex = attachments.findIndex(a => a.attachmentId === attachmentId);

  if (attachmentIndex === -1) {
    throw buildNotFoundError('Attachment', attachmentId);
  }

  const attachment = attachments[attachmentIndex];

  // Delete file from filesystem
  const fs = await import('fs');
  const path = await import('path');
  const filePath = path.join(process.cwd(), 'public', 'uploads', 'leave-attachments', attachment.filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logger.info('[Leave Controller] File deleted', { filePath });
  }

  // Remove attachment from database
  await collections.leaves.updateOne(
    { _id: leave._id },
    {
      $pull: { attachments: { attachmentId: attachmentId } },
      $set: { updatedAt: new Date() }
    }
  );

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastToCompany(io, user.companyId, 'leave:attachment_deleted', {
      leaveId: leave.leaveId,
      attachmentId,
      deletedBy: user.userId
    });
  }

  return sendSuccess(res, { attachmentId }, 'Attachment deleted successfully');
});

/**
 * @desc    Get attachments for leave request
 * @route   GET /api/leaves/:leaveId/attachments
 * @access  Private
 */
export const getAttachments = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;
  const user = extractUser(req);

  logger.debug('[Leave Controller] getAttachments called', { leaveId, companyId: user.companyId });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find leave request
  const leave = await collections.leaves.findOne({
    leaveId: leaveId,
    companyId: user.companyId,
    isDeleted: false
  });

  if (!leave) {
    throw buildNotFoundError('Leave request', leaveId);
  }

  return sendSuccess(res, leave.attachments || [], 'Attachments retrieved successfully');
});

/**
 * @desc    Get leave statistics for admin dashboard
 * @route   GET /api/leaves/stats
 * @access  Private (Admin, HR, Superadmin)
 */
export const getLeaveStats = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  logger.debug('[Leave Controller] getLeaveStats called', { companyId: user.companyId });

  if (!user.companyId) {
    throw buildValidationError('companyId', 'Company ID is required. Please ensure your account is linked to a company.');
  }

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Get today's date range (start and end of today)
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Get total active employees
  const totalEmployees = await collections.employees.countDocuments({
    companyId: user.companyId,
    isActive: true,
    isDeleted: { $ne: true }
  });

  // Get approved leaves for today
  const approvedLeavesToday = await collections.leaves.find({
    companyId: user.companyId,
    status: 'approved',
    isDeleted: { $ne: true },
    $or: [
      // Leave starts today
      { startDate: { $gte: startOfToday, $lt: endOfToday } },
      // Leave spans today (started before, ends after)
      { startDate: { $lt: startOfToday }, endDate: { $gt: startOfToday } }
    ]
  }).toArray();

  // Count unique employees on leave today
  const employeesOnLeaveToday = new Set(approvedLeavesToday.map(l => l.employeeId)).size;

  // Calculate total present
  const totalPresent = Math.max(0, totalEmployees - employeesOnLeaveToday);

  // Define planned and unplanned leave types
  const plannedLeaveTypes = ['casual', 'earned', 'maternity', 'paternity', 'bereavement', 'special'];
  const unplannedLeaveTypes = ['sick', 'compensatory', 'unpaid'];

  // Count planned and unplanned leaves for today
  let plannedLeaves = 0;
  let unplannedLeaves = 0;

  approvedLeavesToday.forEach(leave => {
    if (plannedLeaveTypes.includes(leave.leaveType)) {
      plannedLeaves++;
    } else if (unplannedLeaveTypes.includes(leave.leaveType)) {
      unplannedLeaves++;
    }
  });

  // Get pending requests count
  const pendingRequests = await collections.leaves.countDocuments({
    companyId: user.companyId,
    status: 'pending',
    isDeleted: { $ne: true }
  });

  const stats = {
    totalPresent,
    plannedLeaves,
    unplannedLeaves,
    pendingRequests,
    totalEmployees,
    employeesOnLeaveToday,
    approvedLeavesToday: approvedLeavesToday.length,
    asOfDate: startOfToday
  };

  logger.debug('[Leave Controller] getLeaveStats result', stats);

  return sendSuccess(res, stats, 'Leave statistics retrieved successfully');
});

export default {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  getMyLeaves,
  getLeavesByStatus,
  approveLeave,
  rejectLeave,
  managerActionLeave,
  cancelLeave,
  getLeaveBalance,
  getTeamLeaves,
  uploadAttachment,
  deleteAttachment,
  getAttachments,
  getLeaveStats
};
