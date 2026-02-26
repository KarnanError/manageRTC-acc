/**
 * Change Request Schema
 * Tracks employee-submitted requests to change sensitive profile fields.
 * Changes to critical fields (bank details, name) require HR approval before being applied.
 * This is NOT a Mongoose schema — it's a plain JS object used as documentation/validation reference
 * for the native MongoDB driver (following the multi-tenant db.js pattern in this project).
 *
 * Collection: 'changeRequests' (stored in each company's tenant database)
 */

/**
 * Change Request document structure:
 *
 * {
 *   _id: ObjectId (auto-generated),
 *   companyId: String (required) - tenant identifier,
 *   employeeId: String (required) - e.g. "EMP-1234",
 *   employeeObjectId: ObjectId (required) - _id of the employee document,
 *   employeeName: String - display name at time of request,
 *
 *   requestType: String (required) - one of:
 *     'bankDetails' | 'name' | 'phone' | 'address' | 'emergencyContact' | 'other',
 *
 *   fieldChanged: String (required) - dot-notation path, e.g. "bankDetails.accountNumber",
 *   fieldLabel: String - human-readable label, e.g. "Account Number",
 *
 *   oldValue: Mixed - snapshot of current value at time of request,
 *   newValue: Mixed (required) - the requested new value,
 *   reason: String (required) - employee-provided reason for the change,
 *
 *   status: String (default: 'pending') - one of: 'pending' | 'approved' | 'rejected',
 *   requestedAt: Date (default: now),
 *
 *   reviewedBy: ObjectId - _id of HR/admin who reviewed,
 *   reviewerName: String - display name of reviewer,
 *   reviewedAt: Date,
 *   reviewNote: String - HR rejection or approval note,
 *
 *   isDeleted: Boolean (default: false),
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

export const CHANGE_REQUEST_TYPES = [
  'bankDetails',
  'name',
  'phone',
  'address',
  'emergencyContact',
  'other',
];

export const CHANGE_REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

/**
 * Build a new change request document for insertion into MongoDB.
 *
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} params.employeeId - employeeId string (e.g. "EMP-1234")
 * @param {import('mongodb').ObjectId} params.employeeObjectId
 * @param {string} params.employeeName
 * @param {string} params.requestType
 * @param {string} params.fieldChanged - dot-notation path of the changed field
 * @param {string} params.fieldLabel - human-readable field name
 * @param {*} params.oldValue - current value snapshot
 * @param {*} params.newValue - requested new value
 * @param {string} params.reason - employee reason for the change
 * @returns {object} MongoDB document ready to insert
 */
export function buildChangeRequestDocument({
  companyId,
  employeeId,
  employeeObjectId,
  employeeName,
  requestType,
  fieldChanged,
  fieldLabel,
  oldValue,
  newValue,
  reason,
}) {
  const now = new Date();
  return {
    companyId,
    employeeId,
    employeeObjectId,
    employeeName: employeeName || '',
    requestType,
    fieldChanged,
    fieldLabel: fieldLabel || fieldChanged,
    oldValue: oldValue ?? null,
    newValue,
    reason,
    status: 'pending',
    requestedAt: now,
    reviewedBy: null,
    reviewerName: null,
    reviewedAt: null,
    reviewNote: null,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
}
