/**
 * Budget REST Controller
 * Handles all Budget CRUD operations via REST API
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
import { getSocketIO, broadcastMilestoneEvents } from '../../utils/socketBroadcaster.js';
import * as budgetService from '../../services/budget/budget.service.js';

/**
 * @desc    Get all budgets with pagination and filtering
 * @route   GET /api/budgets
 * @access  Private (Admin, HR, Superadmin)
 */
export const getBudgets = asyncHandler(async (req, res) => {
  const { page, limit, search, status, budgetType, projectId, fiscalYear, sortBy, order } = req.query;
  const user = extractUser(req);

  // Build filters object
  const filters = {};
  if (status) filters.status = status;
  if (budgetType) filters.budgetType = budgetType;
  if (projectId) filters.projectId = projectId;
  if (fiscalYear) filters.fiscalYear = fiscalYear;
  if (search) filters.search = search;
  if (sortBy) {
    filters.sortBy = sortBy;
    filters.sortOrder = order || 'desc';
  }

  const result = await budgetService.getBudgets(user.companyId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch budgets');
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

  return sendSuccess(res, data, 'Budgets retrieved successfully', 200, pagination);
});

/**
 * @desc    Get single budget by ID
 * @route   GET /api/budgets/:id
 * @access  Private (All authenticated users)
 */
export const getBudgetById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid budget ID format');
  }

  const result = await budgetService.getBudgetById(user.companyId, id);

  if (!result.done) {
    throw buildNotFoundError('Budget', id);
  }

  // Add calculated fields
  const budget = result.data;
  budget.utilizationPercentage = budget.totalBudget > 0
    ? Math.round((budget.spentAmount / budget.totalBudget) * 100)
    : 0;
  budget.isOverBudget = budget.spentAmount > budget.totalBudget;
  budget.isNearLimit = budget.totalBudget > 0 && (budget.spentAmount / budget.totalBudget) >= 0.8;

  return sendSuccess(res, budget, 'Budget retrieved successfully');
});

/**
 * @desc    Get budgets by project
 * @route   GET /api/budgets/project/:projectId
 * @access  Private (All authenticated users)
 */
export const getBudgetsByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, budgetType } = req.query;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw buildValidationError('projectId', 'Invalid project ID format');
  }

  // Build filters
  const filters = {};
  if (status) filters.status = status;
  if (budgetType) filters.budgetType = budgetType;

  const result = await budgetService.getBudgetsByProject(user.companyId, projectId, filters);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch project budgets');
  }

  // Add calculated fields to each budget
  const budgets = result.data.map(budget => ({
    ...budget,
    utilizationPercentage: budget.totalBudget > 0
      ? Math.round((budget.spentAmount / budget.totalBudget) * 100)
      : 0,
    isOverBudget: budget.spentAmount > budget.totalBudget,
    isNearLimit: budget.totalBudget > 0 && (budget.spentAmount / budget.totalBudget) >= 0.8
  }));

  return sendSuccess(res, budgets, 'Project budgets retrieved successfully');
});

/**
 * @desc    Create new budget
 * @route   POST /api/budgets
 * @access  Private (Admin, HR, Superadmin)
 */
export const createBudget = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const budgetData = req.body;

  // Add audit fields
  budgetData.createdBy = user.userId;
  budgetData.updatedBy = user.userId;

  const result = await budgetService.createBudget(user.companyId, budgetData);

  if (!result.done) {
    throw new Error(result.error || 'Failed to create budget');
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io && result.data.projectId) {
    broadcastMilestoneEvents.updated(io, user.companyId, {
      _id: result.data.projectId,
      name: result.data.name
    });
  }

  return sendCreated(res, result.data, 'Budget created successfully');
});

/**
 * @desc    Update budget
 * @route   PUT /api/budgets/:id
 * @access  Private (Admin, HR, Superadmin)
 */
export const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid budget ID format');
  }

  // Update audit fields
  updateData.updatedBy = user.userId;

  const result = await budgetService.updateBudget(user.companyId, id, updateData);

  if (!result.done) {
    throw buildNotFoundError('Budget', id);
  }

  // Broadcast Socket.IO event
  const io = getSocketIO(req);
  if (io && result.data.projectId) {
    broadcastMilestoneEvents.updated(io, user.companyId, {
      _id: result.data.projectId,
      name: result.data.name
    });
  }

  return sendSuccess(res, result.data, 'Budget updated successfully');
});

/**
 * @desc    Delete budget (soft delete)
 * @route   DELETE /api/budgets/:id
 * @access  Private (Admin, Superadmin only)
 */
export const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid budget ID format');
  }

  const result = await budgetService.deleteBudget(user.companyId, id);

  if (!result.done) {
    throw buildNotFoundError('Budget', id);
  }

  return sendSuccess(res, {
    _id: result.data._id,
    budgetId: result.data.budgetId,
    isDeleted: true
  }, 'Budget deleted successfully');
});

/**
 * @desc    Get budget tracking
 * @route   GET /api/budgets/:id/tracking
 * @access  Private (All authenticated users)
 */
export const getBudgetTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid budget ID format');
  }

  const result = await budgetService.getBudgetTracking(user.companyId, id);

  if (!result.done) {
    throw buildNotFoundError('Budget', id);
  }

  return sendSuccess(res, result.data, 'Budget tracking retrieved successfully');
});

/**
 * @desc    Add expense to budget
 * @route   POST /api/budgets/:id/expense
 * @access  Private (Admin, HR, Superadmin)
 */
export const addExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, category } = req.body;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid budget ID format');
  }

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    throw buildValidationError('amount', 'Amount must be a positive number');
  }

  const result = await budgetService.addExpense(user.companyId, id, amount, category);

  if (!result.done) {
    throw new Error(result.error || 'Failed to add expense');
  }

  // Broadcast Socket.IO event if budget exceeded
  const io = getSocketIO(req);
  if (io && result.data.spentAmount > result.data.totalBudget) {
    broadcastMilestoneEvents.updated(io, user.companyId, {
      _id: result.data.projectId,
      name: 'Budget exceeded for project'
    });
  }

  return sendSuccess(res, result.data, 'Expense added successfully');
});

/**
 * @desc    Approve budget
 * @route   POST /api/budgets/:id/approve
 * @access  Private (Admin, HR, Superadmin)
 */
export const approveBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const user = extractUser(req);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid budget ID format');
  }

  const result = await budgetService.approveBudget(user.companyId, id, user.userId, comment);

  if (!result.done) {
    throw buildNotFoundError('Budget', id);
  }

  return sendSuccess(res, result.data, 'Budget approved successfully');
});

/**
 * @desc    Get budget statistics
 * @route   GET /api/budgets/stats
 * @access  Private (Admin, HR, Superadmin)
 */
export const getBudgetStats = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  const result = await budgetService.getBudgetStats(user.companyId);

  if (!result.done) {
    throw new Error(result.error || 'Failed to fetch budget statistics');
  }

  return sendSuccess(res, result.data, 'Budget statistics retrieved successfully');
});

export default {
  getBudgets,
  getBudgetById,
  getBudgetsByProject,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetTracking,
  addExpense,
  approveBudget,
  getBudgetStats
};
