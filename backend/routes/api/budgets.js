/**
 * Budget API Routes
 * REST API endpoints for Budget management
 */

import express from 'express';
import {
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
} from '../../controllers/rest/budget.controller.js';
import {
  authenticate,
  requireRole,
  requireCompany,
  attachRequestId
} from '../../middleware/auth.js';

const router = express.Router();

// Apply request ID middleware to all routes
router.use(attachRequestId);

/**
 * Public Routes (Authenticated users can access)
 */

// Get budget tracking
router.get(
  '/:id/tracking',
  authenticate,
  requireCompany,
  getBudgetTracking
);

// Get budgets by project
router.get(
  '/project/:projectId',
  authenticate,
  requireCompany,
  getBudgetsByProject
);

// Get single budget by ID
router.get(
  '/:id',
  authenticate,
  requireCompany,
  getBudgetById
);

/**
 * Admin/HR Routes (Restricted access)
 */

// List all budgets with pagination and filtering
router.get(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getBudgets
);

// Get budget statistics
router.get(
  '/stats',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getBudgetStats
);

// Create new budget
router.post(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  createBudget
);

/**
 * Individual Budget Routes
 */

// Update budget
router.put(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  updateBudget
);

// Delete budget (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  deleteBudget
);

// Add expense to budget
router.post(
  '/:id/expense',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  addExpense
);

// Approve budget
router.post(
  '/:id/approve',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  approveBudget
);

export default router;
