/**
 * Project API Routes
 * REST API endpoints for Project management
 */

import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getMyProjects,
  updateProjectProgress
} from '../../controllers/rest/project.controller.js';
import {
  authenticate,
  requireRole,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  attachRequestId
} from '../../middleware/auth.js';
import {
  validateBody,
  validateQuery,
  projectSchemas
} from '../../middleware/validate.js';

const router = express.Router();

// Apply request ID middleware to all routes
router.use(attachRequestId);

/**
 * Public Routes (Authenticated users can access)
 */

// Get current user's projects
router.get(
  '/my',
  authenticate,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  getMyProjects
);

// Get project statistics
router.get(
  '/stats',
  authenticate,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  requireRole('admin', 'hr', 'superadmin'),
  getProjectStats
);

/**
 * Admin/HR Routes (Restricted access)
 */

// List all projects with pagination and filtering
router.get(
  '/',
  authenticate,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  validateQuery(projectSchemas.list),
  getProjects
);

// Create new project
router.post(
  '/',
  authenticate,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  requireRole('admin', 'hr', 'superadmin'),
  validateBody(projectSchemas.create),
  createProject
);

/**
 * Individual Project Routes
 */

// Get single project by ID
router.get(
  '/:id',
  authenticate,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  getProjectById
);

// Update project
router.put(
  '/:id',
  authenticate,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  requireRole('admin', 'hr', 'superadmin'),
  validateBody(projectSchemas.update),
  updateProject
);

// Delete project (soft delete)
router.delete(
  '/:id',
  authenticate,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  requireRole('admin', 'superadmin'),
  deleteProject
);

// Update project progress
router.patch(
  '/:id/progress',
  authenticate,
  // requireCompany, // Temporarily disabled - Clerk auth not working properly
  requireRole('admin', 'hr', 'superadmin'),
  updateProjectProgress
);

export default router;
