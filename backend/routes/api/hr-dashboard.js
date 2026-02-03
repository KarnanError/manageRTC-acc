/**
 * HR Dashboard API Routes
 * REST API endpoints for HR Dashboard statistics and data
 */

import express from 'express';
import {
  getHRDashboardStats,
  getHRDashboardSummary,
  getUpcomingHolidays,
  getEmployeeBirthdays,
  getEmployeeAnniversaries,
  getCalendarEvents
} from '../../controllers/rest/hrDashboard.controller.js';
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
 * Public Routes (Authenticated users can access if they belong to a company)
 */

// Get full HR Dashboard statistics
router.get(
  '/stats',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getHRDashboardStats
);

// Get HR Dashboard summary (quick stats)
router.get(
  '/summary',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getHRDashboardSummary
);

// Get upcoming holidays
router.get(
  '/holidays/upcoming',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getUpcomingHolidays
);

// Get employee birthdays
router.get(
  '/birthdays',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getEmployeeBirthdays
);

// Get employee work anniversaries
router.get(
  '/anniversaries',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getEmployeeAnniversaries
);

// Get all calendar events (holidays, birthdays, anniversaries)
router.get(
  '/calendar-events',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  getCalendarEvents
);

export default router;
