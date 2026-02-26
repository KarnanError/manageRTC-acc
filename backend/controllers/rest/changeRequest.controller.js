/**
 * Change Request REST Controller
 * Handles employee-submitted change requests for sensitive profile fields.
 * Critical fields (bank details, name) go through HR approval before being applied.
 *
 * Routes:
 *   POST   /api/change-requests             → createChangeRequest      (employee)
 *   GET    /api/change-requests/my          → getMyChangeRequests      (employee)
 *   GET    /api/change-requests             → getAllChangeRequests      (HR/admin)
 *   PATCH  /api/change-requests/:id/approve → approveChangeRequest     (HR/admin)
 *   PATCH  /api/change-requests/:id/reject  → rejectChangeRequest      (HR/admin)
 */

import { ObjectId } from 'mongodb';
import { getTenantCollections } from '../../config/db.js';
import {
  asyncHandler,
  buildForbiddenError,
  buildNotFoundError,
  buildValidationError,
} from '../../middleware/errorHandler.js';
import {
  buildPagination,
  extractUser,
  sendCreated,
  sendSuccess,
} from '../../utils/apiResponse.js';
import logger from '../../utils/logger.js';
import {
  buildChangeRequestDocument,
  CHANGE_REQUEST_TYPES,
} from '../../models/changeRequest/changeRequest.schema.js';

// Fields that are allowed to be changed via change request
const ALLOWED_CHANGE_FIELDS = {
  bankDetails: [
    'bankDetails.bankName',
    'bankDetails.accountNumber',
    'bankDetails.ifscCode',
    'bankDetails.branch',
    'bankDetails.accountType',
  ],
  name: ['firstName', 'lastName'],
  phone: ['phone'],
  address: [
    'address.street',
    'address.city',
    'address.state',
    'address.country',
    'address.postalCode',
  ],
  emergencyContact: [
    'emergencyContact.name',
    'emergencyContact.phone',
    'emergencyContact.relationship',
  ],
  other: [], // wildcard — allow anything for HR-initiated requests
};

// Flatten all allowed fields for validation
const ALL_ALLOWED_FIELDS = Object.values(ALLOWED_CHANGE_FIELDS).flat();

/**
 * Check if a user has HR-level access
 */
function isHROrAdmin(role) {
  const normalised = role?.toLowerCase();
  return ['hr', 'admin', 'superadmin'].includes(normalised);
}

/**
 * Get the nested value from an object using a dot-notation path.
 * e.g. get({ bankDetails: { accountNumber: '123' } }, 'bankDetails.accountNumber') → '123'
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE CHANGE REQUEST (Employee submits a request)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Employee submits a change request for a sensitive profile field
 * @route   POST /api/change-requests
 * @access  Private (All authenticated users)
 */
export const createChangeRequest = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  if (!user.companyId) {
    throw buildValidationError('companyId', 'Company ID is required');
  }

  const { requestType, fieldChanged, fieldLabel, newValue, reason } = req.body;

  // Validate required fields
  if (!requestType) throw buildValidationError('requestType', 'Request type is required');
  if (!CHANGE_REQUEST_TYPES.includes(requestType)) {
    throw buildValidationError('requestType', `Invalid request type. Must be one of: ${CHANGE_REQUEST_TYPES.join(', ')}`);
  }
  if (!fieldChanged) throw buildValidationError('fieldChanged', 'fieldChanged is required');
  if (newValue === undefined || newValue === null) {
    throw buildValidationError('newValue', 'New value is required');
  }
  if (!reason || reason.trim().length < 5) {
    throw buildValidationError('reason', 'Reason is required (minimum 5 characters)');
  }

  // Validate that the field is in the allowed list (unless requestType is 'other')
  if (requestType !== 'other' && !ALL_ALLOWED_FIELDS.includes(fieldChanged)) {
    throw buildValidationError('fieldChanged', `Field '${fieldChanged}' is not allowed for change requests`);
  }

  const collections = getTenantCollections(user.companyId);

  // Find the employee record to get current value + ObjectId
  const employee = await collections.employees.findOne(
    { clerkUserId: user.userId, isDeleted: { $ne: true } },
    { projection: { _id: 1, employeeId: 1, firstName: 1, lastName: 1, bankDetails: 1, phone: 1, address: 1, emergencyContact: 1 } }
  );

  if (!employee) {
    throw buildNotFoundError('Employee', user.userId);
  }

  // Check for duplicate pending request for the same field
  const existingPending = await collections.changeRequests.findOne({
    employeeObjectId: employee._id,
    fieldChanged,
    status: 'pending',
    isDeleted: { $ne: true },
  });

  if (existingPending) {
    throw buildValidationError(
      'fieldChanged',
      `A pending change request for '${fieldLabel || fieldChanged}' already exists. Please wait for HR to review it.`
    );
  }

  // Capture the current (old) value from the employee document
  const oldValue = getNestedValue(employee, fieldChanged);

  const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

  const doc = buildChangeRequestDocument({
    companyId: user.companyId,
    employeeId: employee.employeeId || user.employeeId,
    employeeObjectId: employee._id,
    employeeName,
    requestType,
    fieldChanged,
    fieldLabel: fieldLabel || fieldChanged,
    oldValue,
    newValue,
    reason: reason.trim(),
  });

  const result = await collections.changeRequests.insertOne(doc);

  logger.info('[ChangeRequest] Created change request', {
    id: result.insertedId,
    employeeId: doc.employeeId,
    field: fieldChanged,
    status: 'pending',
  });

  return sendCreated(res, { ...doc, _id: result.insertedId }, 'Change request submitted successfully. HR will review it shortly.');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET MY CHANGE REQUESTS (Employee sees their own)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get current employee's own change requests
 * @route   GET /api/change-requests/my
 * @access  Private (All authenticated users)
 */
export const getMyChangeRequests = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  if (!user.companyId) {
    throw buildValidationError('companyId', 'Company ID is required');
  }

  const { status, page = 1, limit = 20 } = req.query;

  const collections = getTenantCollections(user.companyId);

  // Find employee by clerkUserId
  const employee = await collections.employees.findOne(
    { clerkUserId: user.userId, isDeleted: { $ne: true } },
    { projection: { _id: 1, employeeId: 1 } }
  );

  if (!employee) {
    throw buildNotFoundError('Employee', user.userId);
  }

  const filter = {
    employeeObjectId: employee._id,
    isDeleted: { $ne: true },
  };

  if (status) {
    filter.status = status;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [requests, total] = await Promise.all([
    collections.changeRequests
      .find(filter)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray(),
    collections.changeRequests.countDocuments(filter),
  ]);

  const pagination = buildPagination(pageNum, limitNum, total);

  return sendSuccess(res, requests, 'Change requests retrieved successfully', pagination);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET ALL CHANGE REQUESTS (HR sees all)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all change requests in the company (HR/Admin only)
 * @route   GET /api/change-requests
 * @access  Private (HR, Admin, Superadmin)
 */
export const getAllChangeRequests = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  if (!isHROrAdmin(user.role)) {
    throw buildForbiddenError('Only HR or Admin can view all change requests');
  }

  if (!user.companyId) {
    throw buildValidationError('companyId', 'Company ID is required');
  }

  const { status, requestType, employeeId, page = 1, limit = 20 } = req.query;

  const collections = getTenantCollections(user.companyId);

  const filter = { isDeleted: { $ne: true } };

  if (status) filter.status = status;
  if (requestType) filter.requestType = requestType;
  if (employeeId) filter.employeeId = employeeId;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [requests, total] = await Promise.all([
    collections.changeRequests
      .find(filter)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray(),
    collections.changeRequests.countDocuments(filter),
  ]);

  const pagination = buildPagination(pageNum, limitNum, total);

  return sendSuccess(res, requests, 'Change requests retrieved successfully', pagination);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. APPROVE CHANGE REQUEST (HR applies the change to the employee document)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Approve a change request — applies newValue to the employee document
 * @route   PATCH /api/change-requests/:id/approve
 * @access  Private (HR, Admin, Superadmin)
 */
export const approveChangeRequest = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  if (!isHROrAdmin(user.role)) {
    throw buildForbiddenError('Only HR or Admin can approve change requests');
  }

  if (!user.companyId) {
    throw buildValidationError('companyId', 'Company ID is required');
  }

  const { id } = req.params;
  const { reviewNote } = req.body;

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid change request ID');
  }

  const collections = getTenantCollections(user.companyId);

  // Find the change request
  const changeRequest = await collections.changeRequests.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true },
  });

  if (!changeRequest) {
    throw buildNotFoundError('Change Request', id);
  }

  if (changeRequest.status !== 'pending') {
    throw buildValidationError('status', `This change request is already ${changeRequest.status}`);
  }

  // Get the reviewer's employee record for their name
  const reviewer = await collections.employees.findOne(
    { clerkUserId: user.userId, isDeleted: { $ne: true } },
    { projection: { _id: 1, firstName: 1, lastName: 1 } }
  );
  const reviewerName = reviewer
    ? `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim()
    : user.email || 'HR';

  // Apply the newValue to the employee document using dot-notation field path
  const updateSet = {
    [changeRequest.fieldChanged]: changeRequest.newValue,
    updatedAt: new Date(),
  };

  const employeeUpdateResult = await collections.employees.updateOne(
    { _id: changeRequest.employeeObjectId, isDeleted: { $ne: true } },
    { $set: updateSet }
  );

  if (employeeUpdateResult.matchedCount === 0) {
    throw buildNotFoundError('Employee', changeRequest.employeeId);
  }

  // Mark the change request as approved
  const now = new Date();
  await collections.changeRequests.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: 'approved',
        reviewedBy: reviewer?._id || null,
        reviewerName,
        reviewedAt: now,
        reviewNote: reviewNote?.trim() || null,
        updatedAt: now,
      },
    }
  );

  logger.info('[ChangeRequest] Approved change request', {
    id,
    field: changeRequest.fieldChanged,
    employeeId: changeRequest.employeeId,
    reviewedBy: user.userId,
  });

  return sendSuccess(res, { id, status: 'approved' }, `Change request approved. Employee's ${changeRequest.fieldLabel || changeRequest.fieldChanged} has been updated.`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. REJECT CHANGE REQUEST (HR declines the change)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Reject a change request — no change applied to employee document
 * @route   PATCH /api/change-requests/:id/reject
 * @access  Private (HR, Admin, Superadmin)
 */
export const rejectChangeRequest = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  if (!isHROrAdmin(user.role)) {
    throw buildForbiddenError('Only HR or Admin can reject change requests');
  }

  if (!user.companyId) {
    throw buildValidationError('companyId', 'Company ID is required');
  }

  const { id } = req.params;
  const { reviewNote } = req.body;

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid change request ID');
  }

  if (!reviewNote || reviewNote.trim().length < 5) {
    throw buildValidationError('reviewNote', 'Rejection reason is required (minimum 5 characters)');
  }

  const collections = getTenantCollections(user.companyId);

  const changeRequest = await collections.changeRequests.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true },
  });

  if (!changeRequest) {
    throw buildNotFoundError('Change Request', id);
  }

  if (changeRequest.status !== 'pending') {
    throw buildValidationError('status', `This change request is already ${changeRequest.status}`);
  }

  // Get the reviewer's name
  const reviewer = await collections.employees.findOne(
    { clerkUserId: user.userId, isDeleted: { $ne: true } },
    { projection: { _id: 1, firstName: 1, lastName: 1 } }
  );
  const reviewerName = reviewer
    ? `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim()
    : user.email || 'HR';

  const now = new Date();
  await collections.changeRequests.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: 'rejected',
        reviewedBy: reviewer?._id || null,
        reviewerName,
        reviewedAt: now,
        reviewNote: reviewNote.trim(),
        updatedAt: now,
      },
    }
  );

  logger.info('[ChangeRequest] Rejected change request', {
    id,
    field: changeRequest.fieldChanged,
    employeeId: changeRequest.employeeId,
    reviewedBy: user.userId,
    reviewNote: reviewNote.trim(),
  });

  return sendSuccess(res, { id, status: 'rejected' }, 'Change request rejected.');
});
