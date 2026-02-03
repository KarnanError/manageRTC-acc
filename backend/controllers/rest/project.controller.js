/**
 * Project REST Controller
 * Handles all Project CRUD operations via REST API
 */

import mongoose from 'mongoose';
import {
  asyncHandler,
  buildNotFoundError,
  buildValidationError,
} from '../../middleware/errorHandler.js';
import Project from '../../models/project/project.schema.js';
import {
  buildDateRangeFilter,
  buildSearchFilter,
  extractUser,
  sendCreated,
  sendSuccess,
} from '../../utils/apiResponse.js';
import { generateProjectId } from '../../utils/idGenerator.js';
import { getTenantModel } from '../../utils/mongooseMultiTenant.js';
import { broadcastProjectEvents, getSocketIO } from '../../utils/socketBroadcaster.js';

/**
 * Helper function to get tenant-specific Project model
 */
const getProjectModel = (companyId) => {
  if (!companyId) {
    return Project;
  }
  return getTenantModel(companyId, 'Project', Project.schema);
};

/**
 * @desc    Get all projects with pagination and filtering
 * @route   GET /api/projects
 * @access  Private (Admin, HR, Superadmin, Employee)
 */
export const getProjects = asyncHandler(async (req, res) => {
  const { limit, search, status, priority, client, sortBy, order, dateFrom, dateTo } = req.query;
  const user = extractUser(req);

  // Get tenant-specific Project model
  const ProjectModel = user.companyId
    ? getTenantModel(user.companyId, 'Project', Project.schema)
    : Project;

  // Build filter - superadmins see all projects (case-insensitive)
  let filter = {
    isDeleted: false,
  };

  // Only filter by companyId for non-superadmin users (case-insensitive)
  if (user.role?.toLowerCase() !== 'superadmin') {
    filter.companyId = user.companyId;
  }

  // Debug logging - lightweight
  console.log('[getProjects] Filter:', JSON.stringify(filter));
  console.log('[getProjects] Using database:', user.companyId || 'default');

  // Apply status filter
  if (status) {
    filter.status = status;
  }

  // Apply priority filter
  if (priority) {
    filter.priority = priority;
  }

  // Apply client filter
  if (client) {
    filter.client = client;
  }

  // Apply search filter
  if (search && search.trim()) {
    const searchFilter = buildSearchFilter(search, ['name', 'description', 'client']);
    filter = { ...filter, ...searchFilter };
  }

  // Apply date range filter
  if (dateFrom || dateTo) {
    const dateFilter = buildDateRangeFilter(dateFrom, dateTo, 'startDate');
    filter = { ...filter, ...dateFilter };
  }

  // Build sort option
  const sort = {};
  if (sortBy) {
    sort[sortBy] = order === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  // Simplified query - bypass filterAndPaginate due to timeout issues
  console.log('[getProjects] Fetching projects with filter:', JSON.stringify(filter));

  const projects = await ProjectModel.find(filter)
    .sort(sort)
    .limit(parseInt(limit) || 50)
    .lean();

  console.log('[getProjects] Found', projects.length, 'projects');

  // Add overdue flag to each project
  const result = projects.map((project) => {
    const isOverdue =
      project.status !== 'Completed' && project.dueDate && new Date(project.dueDate) < new Date();
    return {
      ...project,
      isOverdue,
    };
  });

  return sendSuccess(res, result, 'Projects retrieved successfully');
});

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private (All authenticated users)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid project ID format');
  }

  // Build filter - superadmins can access any project
  const filter = {
    _id: id,
    isDeleted: false,
  };

  // Only filter by companyId for non-superadmin users (case-insensitive)
  if (user.role?.toLowerCase() !== 'superadmin') {
    filter.companyId = user.companyId;
  }

  // Get tenant-specific model
  const ProjectModel = getProjectModel(user.companyId);

  // Find project
  const project = await ProjectModel.findOne(filter)
    .populate('teamLeader', 'firstName lastName fullName employeeId')
    .populate('teamMembers', 'firstName lastName fullName employeeId')
    .populate('projectManager', 'firstName lastName fullName employeeId');

  if (!project) {
    throw buildNotFoundError('Project', id);
  }

  const result = project.toObject();
  result.isOverdue = project.isOverdue;

  return sendSuccess(res, result);
});

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private (Admin, HR, Superadmin)
 */
export const createProject = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const projectData = req.body;

  // Generate project ID
  if (!projectData.projectId) {
    projectData.projectId = await generateProjectId(user.companyId);
  }

  // Add company and audit fields
  projectData.companyId = user.companyId;
  projectData.createdBy = user.userId;
  projectData.updatedBy = user.userId;

  // Get tenant-specific model
  const ProjectModel = getProjectModel(user.companyId);

  // Create project
  const project = await ProjectModel.create(projectData);

  // Populate references for response
  await project.populate('teamLeader', 'firstName lastName fullName employeeId');
  await project.populate('teamMembers', 'firstName lastName fullName employeeId');
  await project.populate('projectManager', 'firstName lastName fullName employeeId');

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastProjectEvents.created(io, user.companyId, project);
  }

  return sendCreated(res, project, 'Project created successfully');
});

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Admin, HR, Superadmin)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid project ID format');
  }

  // Build filter - superadmins can access any project
  const filter = {
    _id: id,
    isDeleted: false,
  };

  // Only filter by companyId for non-superadmin users (case-insensitive)
  if (user.role?.toLowerCase() !== 'superadmin') {
    filter.companyId = user.companyId;
  }

  // Get tenant-specific model
  const ProjectModel = getProjectModel(user.companyId);

  // Find project
  const project = await ProjectModel.findOne(filter);

  if (!project) {
    throw buildNotFoundError('Project', id);
  }

  // Update audit fields
  updateData.updatedBy = user.userId;
  updateData.updatedAt = new Date();

  // Update project
  Object.assign(project, updateData);
  await project.save();

  // Populate references for response
  await project.populate('teamLeader', 'firstName lastName fullName employeeId');
  await project.populate('teamMembers', 'firstName lastName fullName employeeId');
  await project.populate('projectManager', 'firstName lastName fullName employeeId');

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastProjectEvents.updated(io, user.companyId, project);
  }

  return sendSuccess(res, project, 'Project updated successfully');
});

/**
 * @desc    Delete project (soft delete)
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin, Superadmin only)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid project ID format');
  }

  // Build filter - superadmins can access any project
  const filter = {
    _id: id,
    isDeleted: false,
  };

  // Only filter by companyId for non-superadmin users (case-insensitive)
  if (user.role?.toLowerCase() !== 'superadmin') {
    filter.companyId = user.companyId;
  }

  // Get tenant-specific model
  const ProjectModel = getProjectModel(user.companyId);

  // Find project
  const project = await ProjectModel.findOne(filter);

  if (!project) {
    throw buildNotFoundError('Project', id);
  }

  // Check if project has active tasks
  const TaskModel = user.companyId
    ? getTenantModel(user.companyId, 'Task', mongoose.model('Task').schema)
    : mongoose.model('Task');

  const activeTaskCount = await TaskModel.countDocuments({
    projectId: id,
    status: { $in: ['Pending', 'Inprogress'] },
    isDeleted: false,
  });

  if (activeTaskCount > 0) {
    throw buildValidationError(
      'project',
      `Cannot delete project with ${activeTaskCount} active tasks`
    );
  }

  // Soft delete
  project.isDeleted = true;
  project.updatedBy = user.userId;
  await project.save();

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastProjectEvents.deleted(io, user.companyId, project.projectId, user.userId);
  }

  return sendSuccess(
    res,
    {
      _id: project._id,
      projectId: project.projectId,
      isDeleted: true,
    },
    'Project deleted successfully'
  );
});

/**
 * @desc    Get project statistics
 * @route   GET /api/projects/stats
 * @access  Private (Admin, HR, Superadmin)
 */
export const getProjectStats = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  // Get tenant-specific model
  const ProjectModel = getProjectModel(user.companyId);

  // Build match filter - superadmins see stats for all projects
  const matchFilter = {
    isDeleted: false,
  };

  // Only filter by companyId for non-superadmin users (case-insensitive)
  if (user.role?.toLowerCase() !== 'superadmin') {
    matchFilter.companyId = user.companyId;
  }

  const stats = await ProjectModel.aggregate([
    {
      $match: matchFilter,
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
        },
        onHold: {
          $sum: { $cond: [{ $eq: ['$status', 'On Hold'] }, 1, 0] },
        },
        totalValue: { $sum: '$projectValue' },
        highPriority: {
          $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] },
        },
      },
    },
  ]);

  // Build overdue filter - superadmins see all overdue projects
  const overdueFilter = {
    status: { $ne: 'Completed' },
    dueDate: { $lt: new Date() },
    isDeleted: false,
  };

  // Only filter by companyId for non-superadmin users (case-insensitive)
  if (user.role?.toLowerCase() !== 'superadmin') {
    overdueFilter.companyId = user.companyId;
  }

  const overdueProjects = await ProjectModel.countDocuments(overdueFilter);

  const result = stats[0] || {
    total: 0,
    active: 0,
    completed: 0,
    onHold: 0,
    totalValue: 0,
    highPriority: 0,
  };

  result.overdue = overdueProjects;

  return sendSuccess(res, result, 'Project statistics retrieved successfully');
});

/**
 * @desc    Get my projects (projects where user is a team member or leader)
 * @route   GET /api/projects/my
 * @access  Private (All authenticated users)
 */
export const getMyProjects = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const user = extractUser(req);

  // Get tenant-specific models
  const ProjectModel = getProjectModel(user.companyId);
  const EmployeeModel = user.companyId
    ? getTenantModel(user.companyId, 'Employee', mongoose.model('Employee').schema)
    : mongoose.model('Employee');

  // Find the Employee record for this user
  const employee = await EmployeeModel.findOne({ clerkUserId: user.userId });

  if (!employee) {
    return sendSuccess(res, [], 'No projects found');
  }

  // Build filter - projects where user is team member or leader
  let filter = {
    companyId: user.companyId,
    isDeleted: false,
    $or: [
      { teamMembers: employee._id },
      { teamLeader: employee._id },
      { projectManager: employee._id },
    ],
  };

  if (status) {
    filter.status = status;
  }

  const projects = await ProjectModel.find(filter)
    .populate('teamLeader', 'firstName lastName fullName employeeId')
    .populate('teamMembers', 'firstName lastName fullName employeeId')
    .populate('projectManager', 'firstName lastName fullName employeeId')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) || 50);

  const result = projects.map((project) => {
    const proj = project.toObject();
    proj.isOverdue = project.isOverdue;
    return proj;
  });

  return sendSuccess(res, result, 'My projects retrieved successfully');
});

/**
 * @desc    Update project progress
 * @route   PATCH /api/projects/:id/progress
 * @access  Private (Admin, HR, Superadmin, Team Leaders)
 */
export const updateProjectProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { progress } = req.body;
  const user = extractUser(req);

  // Validate progress
  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    throw buildValidationError('progress', 'Progress must be between 0 and 100');
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid project ID format');
  }

  // Get tenant-specific model
  const ProjectModel = getProjectModel(user.companyId);

  // Build filter - superadmins can access any project
  const filter = {
    _id: id,
    isDeleted: false,
  };

  // Only filter by companyId for non-superadmin users (case-insensitive)
  if (user.role?.toLowerCase() !== 'superadmin') {
    filter.companyId = user.companyId;
  }

  // Find project
  const project = await ProjectModel.findOne(filter);

  if (!project) {
    throw buildNotFoundError('Project', id);
  }

  // Update progress
  project.progress = progress;
  project.updatedBy = user.userId;

  // Auto-update status based on progress
  if (progress === 100) {
    project.status = 'Completed';
  } else if (project.status === 'Completed') {
    project.status = 'Active';
  }

  await project.save();

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io) {
    broadcastProjectEvents.progressUpdated(io, user.companyId, project);
  }

  return sendSuccess(
    res,
    {
      _id: project._id,
      projectId: project.projectId,
      progress: project.progress,
      status: project.status,
    },
    'Project progress updated successfully'
  );
});

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getMyProjects,
  updateProjectProgress,
};
