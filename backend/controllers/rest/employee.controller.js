/**
 * Employee REST Controller
 * Handles all Employee CRUD operations via REST API
 * Uses multi-tenant database architecture with getTenantCollections()
 */

import { ObjectId } from 'mongodb';
import {
  buildNotFoundError,
  buildConflictError,
  buildValidationError,
  asyncHandler
} from '../../middleware/errorHandler.js';
import {
  sendSuccess,
  sendCreated,
  buildPagination,
  buildSearchFilter,
  extractUser,
  buildAuditFields,
  getRequestId
} from '../../utils/apiResponse.js';
import { getSocketIO, broadcastEmployeeEvents } from '../../utils/socketBroadcaster.js';
import { getTenantCollections } from '../../config/db.js';

/**
 * @desc    Get all employees with pagination and filtering
 * @route   GET /api/employees
 * @access  Private (Admin, HR, Superadmin)
 */
export const getEmployees = asyncHandler(async (req, res) => {
  // Use validated query if available, otherwise use original query (for non-validated routes)
  const query = req.validatedQuery || req.query;
  const { page, limit, search, department, designation, status, sortBy, order } = query;
  const user = extractUser(req);

  console.log('[Employee Controller] getEmployees - companyId:', user.companyId, 'filters:', { page, limit, search, department, designation, status });

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Build filter
  let filter = {};

  // Apply status filter
  if (status) {
    filter.status = status;
  }

  // Apply department filter
  if (department) {
    filter.departmentId = department;
  }

  // Apply designation filter
  if (designation) {
    filter.designationId = designation;
  }

  // Apply search filter
  if (search && search.trim()) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }

  console.log('[Employee Controller] MongoDB filter:', filter);

  // Get total count
  const total = await collections.employees.countDocuments(filter);

  // Build sort option
  const sortObj = {};
  if (sortBy) {
    sortObj[sortBy] = order === 'asc' ? 1 : -1;
  } else {
    sortObj.createdAt = -1;
  }

  // Get paginated results with aggregation for department/designation lookup
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        departmentObjId: {
          $cond: {
            if: { $and: [{ $ne: ['$departmentId', null] }, { $ne: ['$departmentId', ''] }] },
            then: { $toObjectId: '$departmentId' },
            else: null
          }
        },
        designationObjId: {
          $cond: {
            if: { $and: [{ $ne: ['$designationId', null] }, { $ne: ['$designationId', ''] }] },
            then: { $toObjectId: '$designationId' },
            else: null
          }
        }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentObjId',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    },
    {
      $lookup: {
        from: 'designations',
        localField: 'designationObjId',
        foreignField: '_id',
        as: 'designationInfo'
      }
    },
    {
      $addFields: {
        department: { $arrayElemAt: ['$departmentInfo', 0] },
        designation: { $arrayElemAt: ['$designationInfo', 0] }
      }
    },
    {
      $project: {
        departmentObjId: 0,
        designationObjId: 0,
        departmentInfo: 0,
        designationInfo: 0,
        salary: 0,
        bank: 0,
        emergencyContacts: 0,
        'account.password': 0
      }
    },
    { $sort: sortObj },
    { $skip: skip },
    { $limit: limitNum }
  ];

  const employees = await collections.employees.aggregate(pipeline).toArray();

  // Build pagination metadata
  const pagination = buildPagination(pageNum, limitNum, total);

  return sendSuccess(res, employees, 'Employees retrieved successfully', 200, pagination);
});

/**
 * @desc    Get single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private (All roles can view their own profile)
 */
export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  console.log('[Employee Controller] getEmployeeById - id:', id, 'companyId:', user.companyId);

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid employee ID format');
  }

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find employee with aggregation for lookups
  const pipeline = [
    { $match: { _id: new ObjectId(id) } },
    {
      $addFields: {
        departmentObjId: {
          $cond: {
            if: { $and: [{ $ne: ['$departmentId', null] }, { $ne: ['$departmentId', ''] }] },
            then: { $toObjectId: '$departmentId' },
            else: null
          }
        },
        designationObjId: {
          $cond: {
            if: { $and: [{ $ne: ['$designationId', null] }, { $ne: ['$designationId', ''] }] },
            then: { $toObjectId: '$designationId' },
            else: null
          }
        },
        reportingToObjId: {
          $cond: {
            if: { $and: [{ $ne: ['$reportingTo', null] }, { $ne: ['$reportingTo', ''] }] },
            then: { $toObjectId: '$reportingTo' },
            else: null
          }
        }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentObjId',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    },
    {
      $lookup: {
        from: 'designations',
        localField: 'designationObjId',
        foreignField: '_id',
        as: 'designationInfo'
      }
    },
    {
      $lookup: {
        from: 'employees',
        localField: 'reportingToObjId',
        foreignField: '_id',
        as: 'reportingToInfo'
      }
    },
    {
      $addFields: {
        department: { $arrayElemAt: ['$departmentInfo', 0] },
        designation: { $arrayElemAt: ['$designationInfo', 0] },
        reportingTo: { $arrayElemAt: ['$reportingToInfo', 0] }
      }
    },
    {
      $project: {
        departmentObjId: 0,
        designationObjId: 0,
        reportingToObjId: 0,
        departmentInfo: 0,
        designationInfo: 0,
        reportingToInfo: 0
      }
    }
  ];

  const results = await collections.employees.aggregate(pipeline).toArray();
  const employee = results[0];

  if (!employee) {
    throw buildNotFoundError('Employee', id);
  }

  // Remove sensitive fields for non-admin users
  if (user.role !== 'admin' && user.role !== 'hr' && user.role !== 'superadmin') {
    const { salary, bank, emergencyContacts, ...sanitizedEmployee } = employee;
    return sendSuccess(res, sanitizedEmployee);
  }

  return sendSuccess(res, employee);
});

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (Admin, HR, Superadmin)
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const employeeData = req.body;

  console.log('[Employee Controller] createEmployee - companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Check if email already exists
  const existingEmployee = await collections.employees.findOne({
    'contact.email': employeeData.email
  });

  if (existingEmployee) {
    throw buildConflictError('Employee', `email: ${employeeData.email}`);
  }

  // Check if employee code already exists (if provided)
  if (employeeData.employeeId) {
    const existingCode = await collections.employees.findOne({
      employeeId: employeeData.employeeId
    });

    if (existingCode) {
      throw buildConflictError('Employee', `employee code: ${employeeData.employeeId}`);
    }
  }

  // Add audit fields
  const employeeToInsert = {
    ...employeeData,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: user.userId,
    updatedBy: user.userId,
    status: employeeData.status || 'Active'
  };

  // Create employee
  const result = await collections.employees.insertOne(employeeToInsert);

  if (!result.insertedId) {
    throw new Error('Failed to create employee');
  }

  // Get the created employee
  const employee = await collections.employees.findOne({ _id: result.insertedId });

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastEmployeeEvents.created(io, user.companyId, employee);
  }

  return sendCreated(res, employee, 'Employee created successfully');
});

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (Admin, HR, Superadmin)
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  console.log('[Employee Controller] updateEmployee - id:', id, 'companyId:', user.companyId);

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid employee ID format');
  }

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find employee
  const employee = await collections.employees.findOne({ _id: new ObjectId(id) });

  if (!employee) {
    throw buildNotFoundError('Employee', id);
  }

  // Check email uniqueness if email is being updated
  if (updateData.contact?.email && updateData.contact.email !== employee.contact?.email) {
    const existingEmployee = await collections.employees.findOne({
      'contact.email': updateData.contact.email,
      _id: { $ne: new ObjectId(id) }
    });

    if (existingEmployee) {
      throw buildConflictError('Employee', `email: ${updateData.contact.email}`);
    }
  }

  // Check employee code uniqueness if being updated
  if (updateData.employeeId && updateData.employeeId !== employee.employeeId) {
    const existingCode = await collections.employees.findOne({
      employeeId: updateData.employeeId,
      _id: { $ne: new ObjectId(id) }
    });

    if (existingCode) {
      throw buildConflictError('Employee', `employee code: ${updateData.employeeId}`);
    }
  }

  // Update audit fields
  updateData.updatedAt = new Date();
  updateData.updatedBy = user.userId;

  // Update employee
  const result = await collections.employees.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    throw buildNotFoundError('Employee', id);
  }

  // Get updated employee
  const updatedEmployee = await collections.employees.findOne({ _id: new ObjectId(id) });

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastEmployeeEvents.updated(io, user.companyId, updatedEmployee);
  }

  return sendSuccess(res, updatedEmployee, 'Employee updated successfully');
});

/**
 * @desc    Delete employee (soft delete)
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin, Superadmin only)
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  console.log('[Employee Controller] deleteEmployee - id:', id, 'companyId:', user.companyId);

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid employee ID format');
  }

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find employee
  const employee = await collections.employees.findOne({ _id: new ObjectId(id) });

  if (!employee) {
    throw buildNotFoundError('Employee', id);
  }

  // Soft delete - set isDeleted flag
  const result = await collections.employees.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.userId,
        updatedAt: new Date()
      }
    }
  );

  if (result.matchedCount === 0) {
    throw buildNotFoundError('Employee', id);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastEmployeeEvents.deleted(io, user.companyId, employee.employeeId, user.userId);
  }

  return sendSuccess(res, {
    _id: employee._id,
    employeeId: employee.employeeId,
    isDeleted: true,
    deletedAt: new Date()
  }, 'Employee deleted successfully');
});

/**
 * @desc    Get employee profile (current user)
 * @route   GET /api/employees/me
 * @access  Private (All authenticated users)
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  console.log('[Employee Controller] getMyProfile - userId:', user.userId, 'companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find employee by clerk user ID (stored in account.userId or userId field)
  const employee = await collections.employees.findOne({
    'account.userId': user.userId
  });

  if (!employee) {
    throw buildNotFoundError('Employee profile');
  }

  // Remove sensitive fields
  const { salary, bank, emergencyContacts, ...sanitizedEmployee } = employee;

  return sendSuccess(res, sanitizedEmployee);
});

/**
 * @desc    Update my profile
 * @route   PUT /api/employees/me
 * @access  Private (All authenticated users)
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const updateData = req.body;

  console.log('[Employee Controller] updateMyProfile - userId:', user.userId, 'companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find employee by clerk user ID
  const employee = await collections.employees.findOne({
    'account.userId': user.userId
  });

  if (!employee) {
    throw buildNotFoundError('Employee profile');
  }

  // Restrict what fields can be updated by users themselves
  const allowedFields = [
    'phone',
    'dateOfBirth',
    'gender',
    'address',
    'emergencyContact',
    'socialProfiles',
    'profileImage'
  ];

  const sanitizedUpdate = {};
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      sanitizedUpdate[field] = updateData[field];
    }
  });

  // Update audit fields
  sanitizedUpdate.updatedAt = new Date();
  sanitizedUpdate.updatedBy = user.userId;

  // Update employee
  const result = await collections.employees.updateOne(
    { _id: employee._id },
    { $set: sanitizedUpdate }
  );

  if (result.matchedCount === 0) {
    throw buildNotFoundError('Employee profile');
  }

  // Get updated employee
  const updatedEmployee = await collections.employees.findOne({ _id: employee._id });

  return sendSuccess(res, updatedEmployee, 'Profile updated successfully');
});

/**
 * @desc    Get employee reportees (subordinates)
 * @route   GET /api/employees/:id/reportees
 * @access  Private (Admin, HR, Superadmin, or the manager themselves)
 */
export const getEmployeeReportees = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  console.log('[Employee Controller] getEmployeeReportees - id:', id, 'companyId:', user.companyId);

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid employee ID format');
  }

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Find employee
  const employee = await collections.employees.findOne({ _id: new ObjectId(id) });

  if (!employee) {
    throw buildNotFoundError('Employee', id);
  }

  // Get all reportees
  const reportees = await collections.employees.find({
    reportingTo: id,
    status: 'Active'
  }).toArray();

  return sendSuccess(res, reportees, 'Reportees retrieved successfully');
});

/**
 * @desc    Get employee count by department
 * @route   GET /api/employees/stats/by-department
 * @access  Private (Admin, HR, Superadmin)
 */
export const getEmployeeStatsByDepartment = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  console.log('[Employee Controller] getEmployeeStatsByDepartment - companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const stats = await collections.employees.aggregate([
    {
      $match: {
        status: 'Active'
      }
    },
    {
      $addFields: {
        departmentObjId: {
          $cond: {
            if: { $and: [{ $ne: ['$departmentId', null] }, { $ne: ['$departmentId', ''] }] },
            then: { $toObjectId: '$departmentId' },
            else: null
          }
        }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentObjId',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    },
    {
      $unwind: {
        path: '$departmentInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$departmentId',
        departmentName: { $first: '$departmentInfo.department' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray();

  return sendSuccess(res, stats, 'Employee statistics by department retrieved successfully');
});

/**
 * @desc    Search employees
 * @route   GET /api/employees/search
 * @access  Private (Admin, HR, Superadmin)
 */
export const searchEmployees = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const user = extractUser(req);

  console.log('[Employee Controller] searchEmployees - query:', q, 'companyId:', user.companyId);

  if (!q || q.trim().length < 2) {
    throw buildValidationError('q', 'Search query must be at least 2 characters');
  }

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const employees = await collections.employees.find({
    status: 'Active',
    $or: [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { fullName: { $regex: q, $options: 'i' } },
      { 'contact.email': { $regex: q, $options: 'i' } },
      { employeeId: { $regex: q, $options: 'i' } }
    ]
  })
    .limit(20)
    .project({
      salary: 0,
      bank: 0,
      emergencyContacts: 0,
      'account.password': 0
    })
    .toArray();

  return sendSuccess(res, employees, 'Search results retrieved successfully');
});

/**
 * @desc    Bulk upload employees
 * @route   POST /api/employees/bulk-upload
 * @access  Private (Admin, HR, Superadmin)
 */
export const bulkUploadEmployees = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const { employees } = req.body;

  console.log('[Employee Controller] bulkUploadEmployees - count:', employees?.length, 'companyId:', user.companyId);

  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    throw buildValidationError('employees', 'At least one employee is required');
  }

  if (employees.length > 100) {
    throw buildValidationError('employees', 'Maximum 100 employees can be uploaded at once');
  }

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const results = {
    success: [],
    failed: [],
    duplicate: []
  };

  for (const empData of employees) {
    try {
      // Check for duplicate email
      const existing = await collections.employees.findOne({
        'contact.email': empData.contact?.email
      });

      if (existing) {
        results.duplicate.push({
          email: empData.contact?.email,
          reason: 'Email already exists'
        });
        continue;
      }

      // Create employee
      const employeeToInsert = {
        ...empData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.userId,
        updatedBy: user.userId,
        status: empData.status || 'Active'
      };

      const result = await collections.employees.insertOne(employeeToInsert);

      results.success.push({
        _id: result.insertedId,
        email: empData.contact?.email,
        name: `${empData.firstName} ${empData.lastName}`
      });
    } catch (error) {
      results.failed.push({
        email: empData.contact?.email,
        reason: error.message
      });
    }
  }

  return sendSuccess(res, results, `Bulk upload completed: ${results.success.length} created, ${results.duplicate.length} duplicates, ${results.failed.length} failed`);
});

export default {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getMyProfile,
  updateMyProfile,
  getEmployeeReportees,
  getEmployeeStatsByDepartment,
  searchEmployees,
  bulkUploadEmployees
};
