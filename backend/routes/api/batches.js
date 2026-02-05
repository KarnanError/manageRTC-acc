/**
 * Batch API Routes
 * REST API endpoints for batch management
 */

import express from 'express';
import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchEmployees,
  getBatchSchedule,
  getBatchHistory,
  setAsDefault,
  getDefaultBatch
} from '../../controllers/rest/batch.controller.js';
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
 * Public Routes (For getting available batches)
 */

// Get all batches (accessible by authenticated users)
router.get(
  '/',
  authenticate,
  requireCompany,
  getBatches
);

// Get default batch for company
router.get(
  '/default',
  authenticate,
  requireCompany,
  getDefaultBatch
);

// Get single batch
router.get(
  '/:id',
  authenticate,
  requireCompany,
  getBatchById
);

/**
 * Admin/HR Routes (Restricted access)
 */

// Create new batch
router.post(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  createBatch
);

// Update batch
router.put(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  updateBatch
);

// Delete batch
router.delete(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  deleteBatch
);

// Get employees in batch
router.get(
  '/:id/employees',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getBatchEmployees
);

// Get batch rotation schedule
router.get(
  '/:id/schedule',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getBatchSchedule
);

// Get batch assignment history
router.get(
  '/:id/history',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getBatchHistory
);

// Set batch as default
router.post(
  '/:id/set-default',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  setAsDefault
);

export default router;
