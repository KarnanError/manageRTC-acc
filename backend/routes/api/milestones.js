/**
 * Milestone API Routes
 * REST API endpoints for Milestone management
 */

import express from 'express';
import {
  getMilestones,
  getMilestoneById,
  getMilestonesByProject,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  markMilestoneComplete,
  updateMilestoneProgress,
  getMilestoneStats
} from '../../controllers/rest/milestone.controller.js';
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

// Get milestone statistics
router.get(
  '/stats',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getMilestoneStats
);

// Get milestones by project
router.get(
  '/project/:projectId',
  authenticate,
  requireCompany,
  getMilestonesByProject
);

// Get single milestone by ID
router.get(
  '/:id',
  authenticate,
  requireCompany,
  getMilestoneById
);

/**
 * Admin/HR Routes (Restricted access)
 */

// List all milestones with pagination and filtering
router.get(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getMilestones
);

// Create new milestone
router.post(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  createMilestone
);

/**
 * Individual Milestone Routes
 */

// Update milestone
router.put(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  updateMilestone
);

// Delete milestone (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  deleteMilestone
);

// Mark milestone as complete
router.patch(
  '/:id/complete',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  markMilestoneComplete
);

// Update milestone progress
router.patch(
  '/:id/progress',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  updateMilestoneProgress
);

export default router;
