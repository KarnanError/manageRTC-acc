/**
 * Milestone REST Controller
 * Handles all Milestone CRUD operations via REST API
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
  extractUser,
  getRequestId
} from '../../utils/apiResponse.js';
import { getSocketIO, broadcastMilestoneEvents } from '../../utils/socketBroadcaster.js';
import * as milestoneService from '../../services/milestone/milestone.service.js';

/**
 * @desc    Get all milestones with pagination and filtering
 * @route   GET /api/milestones
 * @access  Private (Admin, HR, Superadmin, Employee)
 */
export const getMilestones = asyncHandler(async (req, res) => {
  const { page, limit, search, status, priority, projectId, sortBy, order, startDate, endDate } = req.query;
  const user = extractUser(req);

  // Build filters object
  const filters = {};
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (projectId) filters.projectId = projectId;
  if (search) filters.search = search;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (sortBy) {
    filters.sortBy = sortBy;
    filters.sortOrder = order || 'desc';
  }

  const result = await milestoneService.getMilestones(user.companyId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch milestones');
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

  return sendSuccess(res, data, 'Milestones retrieved successfully', 200, pagination);
});

/**
 * @desc    Get single milestone by ID
 * @route   GET /api/milestones/:id
 * @access  Private (All authenticated users)
 */
export const getMilestoneById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid milestone ID format');
  }

  const result = await milestoneService.getMilestoneById(user.companyId, id);

  if (!result.done) {
    throw buildNotFoundError('Milestone', id);
  }

  // Add isOverdue flag
  const milestone = result.data;
  if (milestone.dueDate && milestone.status !== 'Completed' && milestone.status !== 'Cancelled') {
    milestone.isOverdue = new Date() > milestone.dueDate;
  }

  // Add days until due
  if (milestone.dueDate) {
    const diff = milestone.dueDate.getTime() - new Date().getTime();
    milestone.daysUntilDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return sendSuccess(res, milestone, 'Milestone retrieved successfully');
});

/**
 * @desc    Get milestones by project
 * @route   GET /api/milestones/project/:projectId
 * @access  Private (All authenticated users)
 */
export const getMilestonesByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority } = req.query;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw buildValidationError('projectId', 'Invalid project ID format');
  }

  // Build filters
  const filters = {};
  if (status) filters.status = status;
  if (priority) filters.priority = priority;

  const result = await milestoneService.getMilestonesByProject(user.companyId, projectId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch project milestones');
  }

  // Add isOverdue flag to each milestone
  const milestones = result.data.map(milestone => {
    const m = milestone;
    if (m.dueDate && m.status !== 'Completed' && m.status !== 'Cancelled') {
      m.isOverdue = new Date() > m.dueDate;
    }
    if (m.dueDate) {
      const diff = m.dueDate.getTime() - new Date().getTime();
      m.daysUntilDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return m;
  });

  return sendSuccess(res, milestones, 'Project milestones retrieved successfully');
});

/**
 * @desc    Create new milestone
 * @route   POST /api/milestones
 * @access  Private (Admin, HR, Superadmin, Team Leaders)
 */
export const createMilestone = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const milestoneData = req.body;

  // Add audit fields
  milestoneData.createdBy = user.userId;
  milestoneData.updatedBy = user.userId;

  // Check for circular dependencies if dependencies provided
  if (milestoneData.dependencies && milestoneData.dependencies.length > 0) {
    const depCheck = await milestoneService.checkMilestoneDependencies(
      user.companyId,
      null,
      milestoneData.dependencies
    );

    if (depCheck.hasCircular) {
      throw buildValidationError('dependencies', depCheck.error || 'Circular dependency detected');
    }
  }

  const result = await milestoneService.createMilestone(user.companyId, milestoneData);

  if (!result.done) {
    throw new Error(result.error || 'Failed to create milestone');
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastMilestoneEvents.created(io, user.companyId, result.data);
  }

  return sendCreated(res, result.data, 'Milestone created successfully');
});

/**
 * @desc    Update milestone
 * @route   PUT /api/milestones/:id
 * @access  Private (Admin, HR, Superadmin, Team Leaders)
 */
export const updateMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid milestone ID format');
  }

  // Check for circular dependencies if dependencies are being updated
  if (updateData.dependencies && updateData.dependencies.length > 0) {
    const depCheck = await milestoneService.checkMilestoneDependencies(
      user.companyId,
      id,
      updateData.dependencies
    );

    if (depCheck.hasCircular) {
      throw buildValidationError('dependencies', depCheck.error || 'Circular dependency detected');
    }
  }

  // Update audit fields
  updateData.updatedBy = user.userId;

  const result = await milestoneService.updateMilestone(user.companyId, id, updateData);

  if (!result.done) {
    throw buildNotFoundError('Milestone', id);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastMilestoneEvents.updated(io, user.companyId, result.data);
  }

  return sendSuccess(res, result.data, 'Milestone updated successfully');
});

/**
 * @desc    Delete milestone (soft delete)
 * @route   DELETE /api/milestones/:id
 * @access  Private (Admin, Superadmin only)
 */
export const deleteMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid milestone ID format');
  }

  const result = await milestoneService.deleteMilestone(user.companyId, id);

  if (!result.done) {
    throw buildNotFoundError('Milestone', id);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io && result.data) {
    broadcastMilestoneEvents.deleted(io, user.companyId, result.data.milestoneId, result.data.projectId);
  }

  return sendSuccess(res, {
    _id: result.data._id,
    milestoneId: result.data.milestoneId,
    isDeleted: true
  }, 'Milestone deleted successfully');
});

/**
 * @desc    Mark milestone as complete
 * @route   PATCH /api/milestones/:id/complete
 * @access  Private (Admin, HR, Superadmin, Team Leaders)
 */
export const markMilestoneComplete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid milestone ID format');
  }

  const result = await milestoneService.markMilestoneComplete(user.companyId, id);

  if (!result.done) {
    throw buildValidationError('milestone', result.error || 'Failed to mark milestone as complete');
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastMilestoneEvents.completed(io, user.companyId, result.data);
  }

  return sendSuccess(res, {
    _id: result.data._id,
    milestoneId: result.data.milestoneId,
    status: result.data.status,
    progress: result.data.progress,
    completedDate: result.data.completedDate
  }, 'Milestone marked as complete');
});

/**
 * @desc    Update milestone progress
 * @route   PATCH /api/milestones/:id/progress
 * @access  Private (Admin, HR, Superadmin, Team Leaders)
 */
export const updateMilestoneProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { progress } = req.body;
  const user = extractUser(req);

  // Validate progress
  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    throw buildValidationError('progress', 'Progress must be between 0 and 100');
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid milestone ID format');
  }

  // Auto-update status based on progress
  let status = undefined;
  if (progress === 100) {
    status = 'Completed';
  }

  const result = await milestoneService.updateMilestone(user.companyId, id, {
    progress,
    status,
    updatedBy: user.userId
  });

  if (!result.done) {
    throw buildNotFoundError('Milestone', id);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastMilestoneEvents.progressUpdated(io, user.companyId, result.data);
  }

  return sendSuccess(res, {
    _id: result.data._id,
    milestoneId: result.data.milestoneId,
    progress: result.data.progress,
    status: result.data.status
  }, 'Milestone progress updated successfully');
});

/**
 * @desc    Get milestone statistics
 * @route   GET /api/milestones/stats
 * @access  Private (Admin, HR, Superadmin)
 */
export const getMilestoneStats = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  const result = await milestoneService.getMilestoneStats(user.companyId);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch milestone statistics');
  }

  return sendSuccess(res, result.data, 'Milestone statistics retrieved successfully');
});

export default {
  getMilestones,
  getMilestoneById,
  getMilestonesByProject,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  markMilestoneComplete,
  updateMilestoneProgress,
  getMilestoneStats
};
