/**
 * Admin Dashboard API Routes
 * REST API endpoints for Admin Dashboard statistics and data
 */

import express from 'express';
import {
  getAdminDashboardAll,
  getAdminDashboardSummary,
  getEmployeesByDepartment,
  getEmployeeStatus,
  getAttendanceOverview,
  getClockInOutData,
  getSalesOverview,
  getRecentInvoices,
  getProjectsData,
  getTaskStatistics,
  getTodos,
  getBirthdays,
  getPendingItems,
  getEmployeeGrowth,
} from '../../controllers/rest/adminDashboard.controller.js';
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
 * Public Routes (Authenticated admins can access)
 */

// Get full Admin Dashboard data (all sections at once)
router.get(
  '/all',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getAdminDashboardAll
);

// Get Admin Dashboard summary (quick stats only)
router.get(
  '/summary',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getAdminDashboardSummary
);

// Get employees by department
router.get(
  '/employees-by-department',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getEmployeesByDepartment
);

// Get employee status distribution
router.get(
  '/employee-status',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getEmployeeStatus
);

// Get attendance overview
router.get(
  '/attendance-overview',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getAttendanceOverview
);

// Get clock in/out data
router.get(
  '/clock-inout',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getClockInOutData
);

// Get sales overview
router.get(
  '/sales-overview',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getSalesOverview
);

// Get recent invoices
router.get(
  '/recent-invoices',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getRecentInvoices
);

// Get projects data
router.get(
  '/projects',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getProjectsData
);

// Get task statistics
router.get(
  '/task-statistics',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getTaskStatistics
);

// Get todos
router.get(
  '/todos',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getTodos
);

// Get birthdays
router.get(
  '/birthdays',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getBirthdays
);

// Get pending items
router.get(
  '/pending-items',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getPendingItems
);

// Get employee growth
router.get(
  '/employee-growth',
  authenticate,
  requireCompany,
  requireRole('admin', 'superadmin'),
  getEmployeeGrowth
);

export default router;
