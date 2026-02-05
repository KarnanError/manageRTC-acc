/**
 * Schedule Engine API Routes
 * REST API endpoints for automated shift scheduling
 */

import express from 'express';
import {
  getShiftSchedule,
  autoAssignDefaultShift,
  applyRotationPattern,
  getShiftCoverageReport,
  previewAutoSchedule
} from '../../controllers/rest/scheduleEngine.controller.js';
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
 * Admin/HR Routes (Restricted access)
 */

// Get shift schedule for date range
router.get(
  '/schedule',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getShiftSchedule
);

// Auto-assign default shift to unassigned employees
router.post(
  '/auto-assign-default',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  autoAssignDefaultShift
);

// Apply rotation pattern to employees
router.post(
  '/apply-rotation',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  applyRotationPattern
);

// Get shift coverage report
router.get(
  '/coverage-report',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getShiftCoverageReport
);

// Preview auto-schedule
router.post(
  '/preview',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  previewAutoSchedule
);

export default router;
