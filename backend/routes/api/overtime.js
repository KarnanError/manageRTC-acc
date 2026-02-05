/**
 * Overtime Request REST API Routes
 * All overtime request management endpoints
 */

import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import overtimeController from '../../controllers/rest/overtime.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/overtime
 * @desc    Get all overtime requests with pagination and filtering
 * @access  Private (Admin, HR, Superadmin)
 */
router.get('/', requireRole('admin', 'hr', 'superadmin'), overtimeController.getOvertimeRequests);

/**
 * @route   GET /api/overtime/my
 * @desc    Get current user's overtime requests
 * @access  Private (All authenticated users)
 */
router.get('/my', overtimeController.getMyOvertimeRequests);

/**
 * @route   GET /api/overtime/pending
 * @desc    Get pending overtime requests
 * @access  Private (Admin, HR, Manager)
 */
router.get('/pending', requireRole('admin', 'hr', 'manager', 'superadmin'), overtimeController.getPendingOvertimeRequests);

/**
 * @route   GET /api/overtime/stats
 * @desc    Get overtime statistics
 * @access  Private (Admin, HR, Superadmin)
 */
router.get('/stats', requireRole('admin', 'hr', 'superadmin'), overtimeController.getOvertimeStats);

/**
 * @route   GET /api/overtime/:id
 * @desc    Get single overtime request by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', overtimeController.getOvertimeRequestById);

/**
 * @route   POST /api/overtime
 * @desc    Create new overtime request
 * @access  Private (All authenticated users)
 */
router.post('/', overtimeController.createOvertimeRequest);

/**
 * @route   POST /api/overtime/:id/approve
 * @desc    Approve overtime request
 * @access  Private (Admin, HR, Manager)
 */
router.post('/:id/approve', requireRole('admin', 'hr', 'manager', 'superadmin'), overtimeController.approveOvertimeRequest);

/**
 * @route   POST /api/overtime/:id/reject
 * @desc    Reject overtime request
 * @access  Private (Admin, HR, Manager)
 */
router.post('/:id/reject', requireRole('admin', 'hr', 'manager', 'superadmin'), overtimeController.rejectOvertimeRequest);

/**
 * @route   POST /api/overtime/:id/cancel
 * @desc    Cancel overtime request
 * @access  Private (All authenticated users)
 */
router.post('/:id/cancel', overtimeController.cancelOvertimeRequest);

/**
 * @route   DELETE /api/overtime/:id
 * @desc    Delete overtime request (soft delete)
 * @access  Private (Admin, Superadmin)
 */
router.delete('/:id', requireRole('admin', 'superadmin'), overtimeController.deleteOvertimeRequest);

export default router;
