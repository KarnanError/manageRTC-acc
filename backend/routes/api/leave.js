/**
 * Leave REST API Routes
 * All leave management endpoints
 */

import express from 'express';
import { uploadSingleAttachment } from '../../config/multer.config.js';
import leaveCarryForwardController from '../../controllers/leaves/leaveCarryForward.controller.js';
import leaveEncashmentController from '../../controllers/leaves/leaveEncashment.controller.js';
import leaveLedgerController from '../../controllers/leaves/leaveLedger.controller.js';
import leaveController from '../../controllers/rest/leave.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/leaves
 * @desc    Get all leave requests with pagination and filtering
 * @access  Private (Admin, HR, Superadmin)
 */
router.get('/', leaveController.getLeaves);

/**
 * @route   GET /api/leaves/my
 * @desc    Get current user's leave requests
 * @access  Private (All authenticated users)
 */
router.get('/my', leaveController.getMyLeaves);

/**
 * @route   GET /api/leaves/status/:status
 * @desc    Get leave requests by status
 * @access  Private (Admin, HR, Superadmin)
 */
router.get('/status/:status', leaveController.getLeavesByStatus);

/**
 * @route   GET /api/leaves/balance
 * @desc    Get leave balance
 * @access  Private (All authenticated users)
 */
router.get('/balance', leaveController.getLeaveBalance);

/**
 * @route   GET /api/leaves/team
 * @desc    Get team leave requests (for managers)
 * @access  Private (Manager, Admin, HR, Superadmin)
 */
router.get('/team', leaveController.getTeamLeaves);

/**
 * @route   GET /api/leaves/stats
 * @desc    Get leave statistics for admin dashboard
 * @access  Private (Admin, HR, Superadmin)
 */
router.get('/stats', leaveController.getLeaveStats);

// ============================================
// LEAVE LEDGER / BALANCE HISTORY ROUTES
// (must be before /:id to avoid route conflicts)
// ============================================

/**
 * @route   GET /api/leaves/ledger/my
 * @desc    Get current user's balance history
 * @access  Private (All authenticated users)
 */
router.get('/ledger/my', leaveLedgerController.getMyBalanceHistory);

/**
 * @route   GET /api/leaves/ledger/my/summary
 * @desc    Get current user's balance summary
 * @access  Private (All authenticated users)
 */
router.get('/ledger/my/summary', leaveLedgerController.getMyBalanceSummary);

/**
 * @route   GET /api/leaves/ledger/employee/:employeeId
 * @desc    Get specific employee's balance history
 * @access  Private (HR, Admin, Superadmin, or own employee)
 */
router.get('/ledger/employee/:employeeId', leaveLedgerController.getEmployeeBalanceHistory);

/**
 * @route   GET /api/leaves/ledger/employee/:employeeId/summary
 * @desc    Get specific employee's balance summary
 * @access  Private (HR, Admin, Superadmin, or own employee)
 */
router.get('/ledger/employee/:employeeId/summary', leaveLedgerController.getEmployeeBalanceSummary);

/**
 * @route   GET /api/leaves/ledger/financial-year/:financialYear
 * @desc    Get balance history by financial year
 * @access  Private (All authenticated users)
 */
router.get('/ledger/financial-year/:financialYear', leaveLedgerController.getBalanceHistoryByFinancialYear);

/**
 * @route   GET /api/leaves/ledger/export
 * @route   GET /api/leaves/ledger/export/:employeeId
 * @desc    Export balance history
 * @access  Private (HR, Admin, Superadmin, or own data)
 */
router.get('/ledger/export', leaveLedgerController.exportBalanceHistory);
router.get('/ledger/export/:employeeId', leaveLedgerController.exportBalanceHistory);

/**
 * @route   POST /api/leaves/ledger/initialize/:employeeId
 * @desc    Initialize ledger for employee
 * @access  Private (HR, Admin, Superadmin)
 */
router.post('/ledger/initialize/:employeeId', leaveLedgerController.initializeEmployeeLedger);

// ============================================
// LEAVE CARRY FORWARD ROUTES
// (must be before /:id to avoid route conflicts)
// ============================================

/**
 * @route   GET /api/leaves/carry-forward/config
 * @desc    Get carry forward configuration
 * @access  Private (Admin, HR, Superadmin)
 */
router.get('/carry-forward/config', leaveCarryForwardController.getCarryForwardConfig);

/**
 * @route   PUT /api/leaves/carry-forward/config
 * @desc    Update carry forward configuration
 * @access  Private (Admin, HR, Superadmin)
 */
router.put('/carry-forward/config', leaveCarryForwardController.updateCarryForwardConfig);

/**
 * @route   GET /api/leaves/carry-forward/calculate/:employeeId
 * @desc    Calculate carry forward for employee
 * @access  Private (Admin, HR, Superadmin, or own employee)
 */
router.get('/carry-forward/calculate/:employeeId', leaveCarryForwardController.calculateEmployeeCarryForward);

/**
 * @route   POST /api/leaves/carry-forward/execute/:employeeId
 * @desc    Execute carry forward for employee
 * @access  Private (Admin, HR, Superadmin)
 */
router.post('/carry-forward/execute/:employeeId', leaveCarryForwardController.executeEmployeeCarryForward);

/**
 * @route   POST /api/leaves/carry-forward/execute-all
 * @desc    Execute carry forward for all employees
 * @access  Private (Admin, Superadmin)
 */
router.post('/carry-forward/execute-all', leaveCarryForwardController.executeCompanyCarryForward);

/**
 * @route   GET /api/leaves/carry-forward/history/:employeeId
 * @desc    Get carry forward history for employee
 * @access  Private (Admin, HR, Superadmin, or own employee)
 */
router.get('/carry-forward/history/:employeeId', leaveCarryForwardController.getCarryForwardHistory);

/**
 * @route   GET /api/leaves/carry-forward/summary/:financialYear
 * @desc    Get carry forward summary for financial year
 * @access  Private (Admin, HR, Superadmin)
 */
router.get('/carry-forward/summary/:financialYear', leaveCarryForwardController.getCarryForwardSummary);

// ============================================
// LEAVE ENCASHMENT ROUTES
// (must be before /:id to avoid route conflicts)
// ============================================

/**
 * @route   GET /api/leaves/encashment/config
 * @desc    Get encashment configuration
 * @access  Private (All authenticated users)
 */
router.get('/encashment/config', leaveEncashmentController.getEncashmentConfig);

/**
 * @route   GET /api/leaves/encashment/calculate/:leaveType/:employeeId?
 * @desc    Calculate encashment for employee
 * @access  Private (All authenticated users)
 */
router.get('/encashment/calculate/:leaveType', leaveEncashmentController.calculateEncashment);
router.get('/encashment/calculate/:leaveType/:employeeId', leaveEncashmentController.calculateEncashment);

/**
 * @route   POST /api/leaves/encashment/execute/:leaveType
 * @desc    Execute leave encashment
 * @access  Private (All authenticated users)
 */
router.post('/encashment/execute/:leaveType', leaveEncashmentController.executeEncashment);

/**
 * @route   GET /api/leaves/encashment/history/:employeeId
 * @desc    Get encashment history for employee
 * @access  Private (Admin, HR, Superadmin, or own employee)
 */
router.get('/encashment/history/:employeeId', leaveEncashmentController.getEncashmentHistory);

/**
 * @route   GET /api/leaves/encashment/summary
 * @desc    Get encashment summary for all employees
 * @access  Private (Admin, HR, Superadmin)
 */
router.get('/encashment/summary', leaveEncashmentController.getEncashmentSummary);

// ============================================
// CUSTOM POLICY ROUTES
// (must be before /:id to avoid route conflicts)
// ============================================

/**
 * @route   POST /api/leaves/custom-policies
 * @desc    Create a new custom leave policy
 * @access  Private (HR, Admin, Superadmin)
 */
/**
 * @route   GET /api/leaves/custom-policies
 * @desc    Get all custom policies for the company
 * @access  Private (HR, Admin, Superadmin)
 */
/**
 * @route   GET /api/leaves/custom-policies/:id
 * @desc    Get a single custom policy
 * @access  Private (HR, Admin, Superadmin)
 */
/**
 * @route   PUT /api/leaves/custom-policies/:id
 * @desc    Update a custom policy
 * @access  Private (HR, Admin, Superadmin)
 */
/**
 * @route   DELETE /api/leaves/custom-policies/:id
 * @desc    Delete a custom policy
 * @access  Private (HR, Admin, Superadmin)
 */
import customPolicyRoutes from './leave/customPolicies.js';
router.use('/custom-policies', customPolicyRoutes);

// ============================================
// INDIVIDUAL LEAVE ROUTES (dynamic :id must come after static multi-segment routes)
// ============================================

/**
 * @route   GET /api/leaves/:id
 * @desc    Get single leave request by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', leaveController.getLeaveById);

/**
 * @route   POST /api/leaves
 * @desc    Create new leave request
 * @access  Private (All authenticated users)
 */
router.post('/', leaveController.createLeave);

/**
 * @route   PUT /api/leaves/:id
 * @desc    Update leave request
 * @access  Private (Admin, HR, Owner)
 */
router.put('/:id', leaveController.updateLeave);

/**
 * @route   DELETE /api/leaves/:id
 * @desc    Delete leave request (soft delete)
 * @access  Private (Admin, Superadmin, Owner)
 */
router.delete('/:id', leaveController.deleteLeave);

/**
 * @route   POST /api/leaves/:id/approve
 * @desc    Approve leave request
 * @access  Private (Admin, HR, Manager)
 */
router.post('/:id/approve', leaveController.approveLeave);

/**
 * @route   POST /api/leaves/:id/reject
 * @desc    Reject leave request
 * @access  Private (Admin, HR, Manager)
 */
router.post('/:id/reject', leaveController.rejectLeave);

/**
 * @route   PATCH /api/leaves/:id/manager-action
 * @desc    Manager approval/rejection action
 * @access  Private (Manager, Admin, Superadmin)
 */
router.patch('/:id/manager-action', leaveController.managerActionLeave);

/**
 * @route   POST /api/leaves/:id/cancel
 * @desc    Cancel leave request (with balance restoration)
 * @access  Private (All authenticated users)
 */
router.post('/:id/cancel', leaveController.cancelLeave);

/**
 * @route   POST /api/leaves/:leaveId/attachments
 * @desc    Upload attachment for leave request
 * @access  Private (Owner, Admin, HR)
 */
router.post('/:leaveId/attachments',
  authenticate,
  uploadSingleAttachment,
  leaveController.uploadAttachment
);

/**
 * @route   GET /api/leaves/:leaveId/attachments
 * @desc    Get attachments for leave request
 * @access  Private (Owner, Admin, HR)
 */
router.get('/:leaveId/attachments',
  authenticate,
  leaveController.getAttachments
);

/**
 * @route   DELETE /api/leaves/:leaveId/attachments/:attachmentId
 * @desc    Delete attachment from leave request
 * @access  Private (Owner, Admin, HR)
 */
router.delete('/:leaveId/attachments/:attachmentId',
  authenticate,
  leaveController.deleteAttachment
);

export default router;
