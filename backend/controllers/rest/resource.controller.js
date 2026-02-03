/**
 * Resource REST Controller
 * Handles all Resource Allocation CRUD operations via REST API
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
import { getSocketIO } from '../../utils/socketBroadcaster.js';
import * as resourceService from '../../services/resource/resource.service.js';

/**
 * @desc    Get all resource allocations with pagination and filtering
 * @route   GET /api/resources
 * @access  Private (Admin, HR, Superadmin)
 */
export const getResourceAllocations = asyncHandler(async (req, res) => {
  const { page, limit, projectId, taskId, resourceId, status, skills, sortBy, order } = req.query;
  const user = extractUser(req);

  // Build filters object
  const filters = {};
  if (projectId) filters.projectId = projectId;
  if (taskId) filters.taskId = taskId;
  if (resourceId) filters.resourceId = resourceId;
  if (status) filters.status = status;
  if (skills) {
    filters.skills = Array.isArray(skills) ? skills : [skills];
  }
  if (sortBy) {
    filters.sortBy = sortBy;
    filters.sortOrder = order || 'desc';
  }

  const result = await resourceService.getResourceAllocations(user.companyId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch resource allocations');
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

  return sendSuccess(res, data, 'Resource allocations retrieved successfully', 200, pagination);
});

/**
 * @desc    Get allocation by ID
 * @route   GET /api/resources/:id
 * @access  Private (All authenticated users)
 */
export const getAllocationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid allocation ID format');
  }

  const result = await resourceService.getAllocationById(user.companyId, id);

  if (!result.done) {
    throw buildNotFoundError('Resource allocation', id);
  }

  return sendSuccess(res, result.data, 'Resource allocation retrieved successfully');
});

/**
 * @desc    Get allocations by project
 * @route   GET /api/resources/project/:projectId
 * @access  Private (All authenticated users)
 */
export const getResourceByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status } = req.query;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw buildValidationError('projectId', 'Invalid project ID format');
  }

  // Build filters
  const filters = {};
  if (status) filters.status = status;

  const result = await resourceService.getResourceByProject(user.companyId, projectId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch project resources');
  }

  return sendSuccess(res, result.data, 'Project resources retrieved successfully');
});

/**
 * @desc    Allocate resource to project/task
 * @route   POST /api/resources/allocate
 * @access  Private (Admin, HR, Superadmin)
 */
export const allocateResource = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const allocationData = req.body;

  // Add audit fields
  allocationData.createdBy = user.userId;
  allocationData.updatedBy = user.userId;

  const result = await resourceService.allocateResource(user.companyId, allocationData);

  if (!result.done) {
    if (result.error && result.error.includes('conflict')) {
      throw buildValidationError('allocation', result.error);
    }
    throw new Error(result.error || 'Failed to allocate resource');
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io && result.data.projectId) {
    io.to(`project_${result.data.projectId}`).emit('resource:allocated', {
      allocationId: result.data.allocationId,
      resourceId: result.data.resourceId,
      projectId: result.data.projectId
    });
  }

  return sendCreated(res, result.data, 'Resource allocated successfully');
});

/**
 * @desc    Update allocation
 * @route   PUT /api/resources/:id
 * @access  Private (Admin, HR, Superadmin)
 */
export const updateAllocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid allocation ID format');
  }

  // Update audit fields
  updateData.updatedBy = user.userId;

  const result = await resourceService.updateAllocation(user.companyId, id, updateData);

  if (!result.done) {
    throw buildNotFoundError('Resource allocation', id);
  }

  return sendSuccess(res, result.data, 'Resource allocation updated successfully');
});

/**
 * @desc    Deallocate resource (cancel allocation)
 * @route   DELETE /api/resources/:id
 * @access  Private (Admin, Superadmin only)
 */
export const deallocateResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid allocation ID format');
  }

  const result = await resourceService.deallocateResource(user.companyId, id, reason);

  if (!result.done) {
    throw buildNotFoundError('Resource allocation', id);
  }

  return sendSuccess(res, {
    _id: result.data._id,
    allocationId: result.data.allocationId,
    isDeleted: true
  }, 'Resource deallocated successfully');
});

/**
 * @desc    Get available resources
 * @route   GET /api/resources/available
 * @access  Private (Admin, HR, Superadmin)
 */
export const getAvailableResources = asyncHandler(async (req, res) => {
  const { startDate, endDate, skills } = req.query;
  const user = extractUser(req);

  if (!startDate || !endDate) {
    throw buildValidationError('startDate', 'Start date and end date are required');
  }

  const skillsArray = skills ? (Array.isArray(skills) ? skills : [skills]) : [];

  const result = await resourceService.getAvailableResources(user.companyId, startDate, endDate, skillsArray);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch available resources');
  }

  return sendSuccess(res, result.data, 'Available resources retrieved successfully');
});

/**
 * @desc    Get resource utilization
 * @route   GET /api/resources/utilization
 * @access  Private (Admin, HR, Superadmin)
 */
export const getResourceUtilization = asyncHandler(async (req, res) => {
  const { resourceId, startDate, endDate } = req.query;
  const user = extractUser(req);

  if (!resourceId || !startDate || !endDate) {
    throw buildValidationError('', 'Resource ID, start date, and end date are required');
  }

  const result = await resourceService.getResourceUtilization(user.companyId, resourceId, startDate, endDate);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch resource utilization');
  }

  return sendSuccess(res, result.data, 'Resource utilization retrieved successfully');
});

/**
 * @desc    Check for resource conflicts
 * @route   GET /api/resources/conflicts
 * @access  Private (Admin, HR, Superadmin)
 */
export const checkConflicts = asyncHandler(async (req, res) => {
  const { resourceId, startDate, endDate } = req.query;
  const user = extractUser(req);

  if (!resourceId || !startDate || !endDate) {
    throw buildValidationError('', 'Resource ID, start date, and end date are required');
  }

  const result = await resourceService.checkResourceConflict(user.companyId, resourceId, startDate, endDate);

  if (!result.done) {
    throw new Error(result.error || 'Failed to check for conflicts');
  }

  return sendSuccess(res, result.data, 'Conflict check completed');
});

export default {
  getResourceAllocations,
  getAllocationById,
  getResourceByProject,
  allocateResource,
  updateAllocation,
  deallocateResource,
  getAvailableResources,
  getResourceUtilization,
  checkConflicts
};
