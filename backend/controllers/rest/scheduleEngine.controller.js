/**
 * Schedule Engine REST Controller
 * Handles automated shift scheduling operations
 */

import {
  asyncHandler,
  buildNotFoundError,
  buildValidationError
} from '../../middleware/errorHandler.js';
import {
  sendSuccess,
  extractUser
} from '../../utils/apiResponse.js';
import * as scheduleEngineService from '../../services/shift/scheduleEngine.service.js';

/**
 * @desc    Get shift schedule for a date range
 * @route   GET /api/schedule/schedule
 * @access  Private (Admin, HR, Superadmin)
 */
export const getShiftSchedule = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const user = extractUser(req);

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

  const result = await scheduleEngineService.getShiftSchedule(user.companyId, start, end);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch shift schedule');
  }

  return sendSuccess(res, result.data, 'Shift schedule retrieved successfully');
});

/**
 * @desc    Auto-assign default shift to employees without shifts
 * @route   POST /api/schedule/auto-assign-default
 * @access  Private (Admin, HR, Superadmin)
 */
export const autoAssignDefaultShift = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  const result = await scheduleEngineService.autoAssignDefaultShift(user.companyId, user.userId);

  if (!result.done) {
    throw new Error(result.error || 'Failed to auto-assign default shift');
  }

  return sendSuccess(res, result.data, result.message || 'Default shift assigned successfully');
});

/**
 * @desc    Apply rotation pattern to employees
 * @route   POST /api/schedule/apply-rotation
 * @access  Private (Admin, HR, Superadmin)
 */
export const applyRotationPattern = asyncHandler(async (req, res) => {
  const { employeeIds, shiftIds, rotateAfterDays, startDate } = req.body;
  const user = extractUser(req);

  // Validate required fields
  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw buildValidationError('employeeIds', 'Employee IDs array is required');
  }
  if (!shiftIds || !Array.isArray(shiftIds) || shiftIds.length === 0) {
    throw buildValidationError('shiftIds', 'Shift IDs array is required');
  }
  if (!rotateAfterDays || rotateAfterDays < 1) {
    throw buildValidationError('rotateAfterDays', 'Valid rotation period (days) is required');
  }

  const result = await scheduleEngineService.applyRotationPattern(
    user.companyId,
    employeeIds,
    shiftIds,
    rotateAfterDays,
    startDate ? new Date(startDate) : new Date(),
    user.userId
  );

  if (!result.done) {
    throw new Error(result.error || 'Failed to apply rotation pattern');
  }

  return sendSuccess(res, result.data, result.message || 'Rotation pattern applied successfully');
});

/**
 * @desc    Get shift coverage report
 * @route   GET /api/schedule/coverage-report
 * @access  Private (Admin, HR, Superadmin)
 */
export const getShiftCoverageReport = asyncHandler(async (req, res) => {
  const { department, date } = req.query;
  const user = extractUser(req);

  const filters = {};
  if (department) filters.department = department;
  if (date) filters.date = new Date(date);

  const result = await scheduleEngineService.getShiftCoverageReport(user.companyId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch coverage report');
  }

  return sendSuccess(res, result.data, 'Coverage report retrieved successfully');
});

/**
 * @desc    Preview auto-schedule without applying
 * @route   POST /api/schedule/preview
 * @access  Private (Admin, HR, Superadmin)
 */
export const previewAutoSchedule = asyncHandler(async (req, res) => {
  const { employeeIds, shiftId, effectiveDate, pattern } = req.body;
  const user = extractUser(req);

  // Validate required fields
  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw buildValidationError('employeeIds', 'Employee IDs array is required');
  }
  if (!shiftId) {
    throw buildValidationError('shiftId', 'Shift ID is required');
  }

  const options = {
    employeeIds,
    shiftId,
    effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
    pattern: pattern || 'uniform'
  };

  const result = await scheduleEngineService.previewAutoSchedule(user.companyId, options);

  if (!result.done) {
    throw new Error(result.error || 'Failed to preview auto-schedule');
  }

  return sendSuccess(res, result.data, 'Auto-schedule preview generated successfully');
});

export default {
  getShiftSchedule,
  autoAssignDefaultShift,
  applyRotationPattern,
  getShiftCoverageReport,
  previewAutoSchedule
};
