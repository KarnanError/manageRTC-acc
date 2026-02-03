/**
 * Resource API Routes
 * REST API endpoints for Resource Allocation management
 */

import express from 'express';
import {
  getResourceAllocations,
  getAllocationById,
  getResourceByProject,
  allocateResource,
  updateAllocation,
  deallocateResource,
  getAvailableResources,
  getResourceUtilization,
  checkConflicts
} from '../../controllers/rest/resource.controller.js';
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

// Get resources by project
router.get(
  '/project/:projectId',
  authenticate,
  requireCompany,
  getResourceByProject
);

// Get single resource allocation by ID
router.get(
  '/:id',
  authenticate,
  requireCompany,
  getAllocationById
);

/**
 * Admin/HR Routes (Restricted access)
 */

// List all resource allocations with pagination and filtering
router.get(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getResourceAllocations
);

// Get available resources
router.get(
  '/available',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getAvailableResources
);

// Get resource utilization
router.get(
  '/utilization',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getResourceUtilization
);

// Check for resource conflicts
router.get(
  '/conflicts',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  checkConflicts
);

/**
 * Resource Management Routes
 */

// Allocate resource to project/task
router.post(
  '/allocate',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  allocateResource
);

// Update allocation
router.put(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  updateAllocation
);

// Deallocate resource (cancel allocation)
router.delete(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  deallocateResource
);

export default router;
