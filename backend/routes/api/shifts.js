/**
 * Shift API Routes
 * REST API endpoints for Shift management
 */

import express from 'express';
import {
  assignShiftToEmployee,
  bulkAssignShifts,
  createShift,
  deleteShift,
  getActiveShifts,
  getDefaultShift,
  getEmployeeShift,
  getShiftById,
  getShifts,
  removeShiftAssignment,
  setDefaultShift,
  updateShift
} from '../../controllers/rest/shift.controller.js';
import {
  attachRequestId,
  authenticate,
  requireCompany,
  requireRole
} from '../../middleware/auth.js';

const router = express.Router();

// Apply request ID middleware to all routes
router.use(attachRequestId);

/**
 * Public Routes (Authenticated users can access)
 */

// Get default shift for company
router.get(
  '/default',
  authenticate,
  requireCompany,
  getDefaultShift
);

// Get all active shifts
router.get(
  '/active',
  authenticate,
  requireCompany,
  getActiveShifts
);

// Get single shift by ID
router.get(
  '/:id',
  authenticate,
  requireCompany,
  getShiftById
);

// Get employee's current shift assignment
router.get(
  '/employee/:employeeId',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getEmployeeShift
);

/**
 * Admin/HR Routes (Restricted access)
 */

// List all shifts with pagination and filtering
router.get(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getShifts
);

// Create new shift
router.post(
  '/',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  createShift
);

// Update shift
router.put(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  updateShift
);

// Set shift as default
router.put(
  '/:id/set-default',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  setDefaultShift
);

// Assign shift to employee
router.post(
  '/assign',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  assignShiftToEmployee
);

// Bulk assign shifts to employees
router.post(
  '/bulk-assign',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  bulkAssignShifts
);

// Remove shift assignment from employee
router.delete(
  '/employee/:employeeId',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  removeShiftAssignment
);

// Delete shift (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  deleteShift
);

export default router;
