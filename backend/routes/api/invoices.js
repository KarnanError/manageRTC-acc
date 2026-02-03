/**
 * Invoice API Routes
 * REST API endpoints for Invoice management
 */

import express from 'express';
import {
  getAll,
  create,
  update,
  remove,
  stats,
} from '../../controllers/rest/invoice.controller.js';
import {
  authenticate,
  requireRole,
  requireCompany,
  attachRequestId,
} from '../../middleware/auth.js';

const router = express.Router();

// Apply request ID middleware to all routes
router.use(attachRequestId);

// Get invoice statistics (must be before /:id to avoid conflict)
router.get(
  '/stats',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  stats
);

// Get all invoices with optional filters
router.get(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getAll
);

// Create a new invoice
router.post(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  create
);

// Update an invoice
router.put(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  update
);

// Delete an invoice (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  remove
);

export default router;
