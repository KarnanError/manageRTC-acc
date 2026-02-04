/**
 * User Profile API Routes
 * REST API endpoints for current user profile
 */

import express from 'express';
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
} from '../../controllers/rest/userProfile.controller.js';
import {
  authenticate,
  attachRequestId
} from '../../middleware/auth.js';

const router = express.Router();

// Apply request ID middleware to all routes
router.use(attachRequestId);

/**
 * @route   GET /api/user-profile/current
 * @desc    Get current user profile (role-based data)
 * @access  Private (All authenticated users)
 */
router.get(
  '/current',
  authenticate,
  getCurrentUserProfile
);

/**
 * @route   PUT /api/user-profile/current
 * @desc    Update current user profile
 * @access  Private (HR, Employee)
 */
router.put(
  '/current',
  authenticate,
  updateCurrentUserProfile
);

export default router;
