/**
 * Time Tracking REST Controller
 * Handles all Time Entry CRUD operations via REST API
 */

import mongoose from 'mongoose';
import {
  buildNotFoundError,
  buildValidationError,
  asyncHandler
} from '../../middleware/errorHandler.js';
import {
  sendSuccess,
  sendCreated,
  extractUser
} from '../../utils/apiResponse.js';
import { getSocketIO, broadcastTimeTrackingEvents } from '../../utils/socketBroadcaster.js';
import * as timeTrackingService from '../../services/timeTracking/timeTracking.service.js';

/**
 * @desc    Get all time entries with pagination and filtering
 * @route   GET /api/timetracking
 * @access  Private (Admin, HR, Superadmin)
 */
export const getTimeEntries = asyncHandler(async (req, res) => {
  const { page, limit, userId, projectId, taskId, status, billable, search, sortBy, order, startDate, endDate } = req.query;
  const user = extractUser(req);

  // Build filters object
  const filters = {};
  if (userId) filters.userId = userId;
  if (projectId) filters.projectId = projectId;
  if (taskId) filters.taskId = taskId;
  if (status) filters.status = status;
  if (billable !== undefined) filters.billable = billable;
  if (search) filters.search = search;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (sortBy) {
    filters.sortBy = sortBy;
    filters.sortOrder = order || 'desc';
  }

  const result = await timeTrackingService.getTimeEntries(user.companyId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch time entries');
  }

  // Apply pagination if specified
  let data = result.data;
  let pagination = null;

  if (page || limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedData = data.slice(startIndex, endIndex);

    pagination = {
      page: pageNum,
      limit: limitNum,
      total: data.length,
      totalPages: Math.ceil(data.length / limitNum)
    };

    data = paginatedData;
  }

  return sendSuccess(res, data, 'Time entries retrieved successfully', 200, pagination);
});

/**
 * @desc    Get single time entry by ID
 * @route   GET /api/timetracking/:id
 * @access  Private (All authenticated users)
 */
export const getTimeEntryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid time entry ID format');
  }

  const result = await timeTrackingService.getTimeEntryById(user.companyId, id);

  if (!result.done) {
    throw buildNotFoundError('Time entry', id);
  }

  return sendSuccess(res, result.data, 'Time entry retrieved successfully');
});

/**
 * @desc    Get time entries by user
 * @route   GET /api/timetracking/user/:userId
 * @access  Private (Admin, HR, Superadmin, or own user)
 */
export const getTimeEntriesByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, projectId, taskId, startDate, endDate, sortBy, order } = req.query;
  const user = extractUser(req);

  // Build filters
  const filters = {};
  if (status) filters.status = status;
  if (projectId) filters.projectId = projectId;
  if (taskId) filters.taskId = taskId;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (sortBy) {
    filters.sortBy = sortBy;
    filters.sortOrder = order || 'desc';
  }

  const result = await timeTrackingService.getTimeEntriesByUser(user.companyId, userId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch user time entries');
  }

  return sendSuccess(res, result.data, 'User time entries retrieved successfully');
});

/**
 * @desc    Get time entries by project
 * @route   GET /api/timetracking/project/:projectId
 * @access  Private (All authenticated users)
 */
export const getTimeEntriesByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, userId, startDate, endDate } = req.query;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw buildValidationError('projectId', 'Invalid project ID format');
  }

  // Build filters
  const filters = {};
  if (status) filters.status = status;
  if (userId) filters.userId = userId;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const result = await timeTrackingService.getTimeEntriesByProject(user.companyId, projectId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch project time entries');
  }

  return sendSuccess(res, result.data, 'Project time entries retrieved successfully');
});

/**
 * @desc    Get time entries by task
 * @route   GET /api/timetracking/task/:taskId
 * @access  Private (All authenticated users)
 */
export const getTimeEntriesByTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.query;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw buildValidationError('taskId', 'Invalid task ID format');
  }

  // Build filters
  const filters = {};
  if (status) filters.status = status;

  const result = await timeTrackingService.getTimeEntriesByTask(user.companyId, taskId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch task time entries');
  }

  return sendSuccess(res, result.data, 'Task time entries retrieved successfully');
});

/**
 * @desc    Get timesheet for a user
 * @route   GET /api/timetracking/timesheet/:userId
 * @access  Private (Admin, HR, Superadmin, or own user)
 */
export const getTimesheet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;
  const user = extractUser(req);

  const result = await timeTrackingService.getTimesheet(user.companyId, userId, startDate, endDate);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch timesheet');
  }

  return sendSuccess(res, result.data, 'Timesheet retrieved successfully');
});

/**
 * @desc    Create new time entry
 * @route   POST /api/timetracking
 * @access  Private (All authenticated users)
 */
export const createTimeEntry = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const timeEntryData = req.body;

  // Add audit fields
  timeEntryData.createdBy = user.userId;
  timeEntryData.userId = user.userId;
  timeEntryData.updatedBy = user.userId;

  const result = await timeTrackingService.createTimeEntry(user.companyId, timeEntryData);

  if (!result.done) {
    throw new Error(result.error || 'Failed to create time entry');
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastTimeTrackingEvents.created(io, user.companyId, result.data);
  }

  return sendCreated(res, result.data, 'Time entry created successfully');
});

/**
 * @desc    Update time entry
 * @route   PUT /api/timetracking/:id
 * @access  Private (All authenticated users - own entries only)
 */
export const updateTimeEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid time entry ID format');
  }

  // Update audit fields
  updateData.updatedBy = user.userId;

  const result = await timeTrackingService.updateTimeEntry(user.companyId, id, updateData);

  if (!result.done) {
    if (result.error && result.error.includes('Cannot edit')) {
      throw buildValidationError('timeEntry', result.error);
    }
    throw buildNotFoundError('Time entry', id);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastTimeTrackingEvents.updated(io, user.companyId, result.data);
  }

  return sendSuccess(res, result.data, 'Time entry updated successfully');
});

/**
 * @desc    Delete time entry (soft delete)
 * @route   DELETE /api/timetracking/:id
 * @access  Private (All authenticated users - own entries only)
 */
export const deleteTimeEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid time entry ID format');
  }

  const result = await timeTrackingService.deleteTimeEntry(user.companyId, id);

  if (!result.done) {
    if (result.error && result.error.includes('Cannot delete')) {
      throw buildValidationError('timeEntry', result.error);
    }
    throw buildNotFoundError('Time entry', id);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io && result.data) {
    broadcastTimeTrackingEvents.deleted(io, user.companyId, result.data.timeEntryId, result.data.userId, result.data.projectId);
  }

  return sendSuccess(res, {
    _id: result.data._id,
    timeEntryId: result.data.timeEntryId,
    isDeleted: true
  }, 'Time entry deleted successfully');
});

/**
 * @desc    Submit timesheet for approval
 * @route   POST /api/timetracking/submit
 * @access  Private (All authenticated users)
 */
export const submitTimesheet = asyncHandler(async (req, res) => {
  const { timeEntryIds } = req.body;
  const user = extractUser(req);

  const result = await timeTrackingService.submitTimesheet(user.companyId, user.userId, timeEntryIds);

  if (!result.done) {
    throw new Error(result.error || 'Failed to submit timesheet');
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastTimeTrackingEvents.timesheetSubmitted(io, user.companyId, user.userId, result.data.submittedCount);
  }

  return sendSuccess(res, result.data, result.message || 'Timesheet submitted successfully');
});

/**
 * @desc    Approve timesheet
 * @route   POST /api/timetracking/approve
 * @access  Private (Admin, HR, Superadmin)
 */
export const approveTimesheet = asyncHandler(async (req, res) => {
  const { userId, timeEntryIds } = req.body;
  const user = extractUser(req);

  if (!userId) {
    throw buildValidationError('userId', 'User ID is required');
  }

  const result = await timeTrackingService.approveTimesheet(user.companyId, userId, timeEntryIds, user.userId);

  if (!result.done) {
    throw new Error(result.error || 'Failed to approve timesheet');
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastTimeTrackingEvents.timesheetApproved(io, user.companyId, userId, result.data.approvedCount);
  }

  return sendSuccess(res, result.data, result.message || 'Timesheet approved successfully');
});

/**
 * @desc    Reject timesheet
 * @route   POST /api/timetracking/reject
 * @access  Private (Admin, HR, Superadmin)
 */
export const rejectTimesheet = asyncHandler(async (req, res) => {
  const { userId, timeEntryIds, reason } = req.body;
  const user = extractUser(req);

  if (!userId) {
    throw buildValidationError('userId', 'User ID is required');
  }

  const result = await timeTrackingService.rejectTimesheet(user.companyId, userId, timeEntryIds, user.userId, reason);

  if (!result.done) {
    throw new Error(result.error || 'Failed to reject timesheet');
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastTimeTrackingEvents.timesheetRejected(io, user.companyId, userId, result.data.rejectedCount, reason);
  }

  return sendSuccess(res, result.data, result.message || 'Timesheet rejected successfully');
});

/**
 * @desc    Get time tracking statistics
 * @route   GET /api/timetracking/stats
 * @access  Private (Admin, HR, Superadmin)
 */
export const getTimeTrackingStats = asyncHandler(async (req, res) => {
  const { userId, projectId, startDate, endDate } = req.query;
  const user = extractUser(req);

  // Build filters
  const filters = {};
  if (userId) filters.userId = userId;
  if (projectId) filters.projectId = projectId;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const result = await timeTrackingService.getTimeTrackingStats(user.companyId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch time tracking statistics');
  }

  return sendSuccess(res, result.data, 'Time tracking statistics retrieved successfully');
});

export default {
  getTimeEntries,
  getTimeEntryById,
  getTimeEntriesByUser,
  getTimeEntriesByProject,
  getTimeEntriesByTask,
  getTimesheet,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
  getTimeTrackingStats
};
