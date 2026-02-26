/**
 * Change Request REST API Routes
 * Employees submit requests to change sensitive profile fields (bank details, name, etc.)
 * HR reviews, approves, or rejects each request.
 */

import express from 'express';
import {
  approveChangeRequest,
  createChangeRequest,
  getAllChangeRequests,
  getMyChangeRequests,
  rejectChangeRequest,
} from '../../controllers/rest/changeRequest.controller.js';
import { attachRequestId, authenticate, requireCompany } from '../../middleware/auth.js';

const router = express.Router();

// Apply request ID tracking and authentication to all routes
router.use(attachRequestId);
router.use(authenticate);
router.use(requireCompany);

/**
 * @route   POST /api/change-requests
 * @desc    Employee submits a change request for a sensitive profile field
 * @access  Private (All authenticated employees)
 */
router.post('/', createChangeRequest);

/**
 * @route   GET /api/change-requests/my
 * @desc    Employee retrieves their own change request history
 * @access  Private (All authenticated employees)
 */
router.get('/my', getMyChangeRequests);

/**
 * @route   GET /api/change-requests
 * @desc    HR/Admin retrieves all change requests for the company
 * @access  Private (HR, Admin, Superadmin) — role check is inside the controller
 */
router.get('/', getAllChangeRequests);

/**
 * @route   PATCH /api/change-requests/:id/approve
 * @desc    HR approves a change request and applies the new value to the employee document
 * @access  Private (HR, Admin, Superadmin) — role check is inside the controller
 */
router.patch('/:id/approve', approveChangeRequest);

/**
 * @route   PATCH /api/change-requests/:id/reject
 * @desc    HR rejects a change request (requires a review note)
 * @access  Private (HR, Admin, Superadmin) — role check is inside the controller
 */
router.patch('/:id/reject', rejectChangeRequest);

export default router;
