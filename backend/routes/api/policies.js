/**
 * Policy REST API Routes
 * All policy-related endpoints
 */

import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPolicyStats,
  searchPolicies
} from '../../controllers/rest/policy.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/policies
 * @desc    Get all policies with optional filtering
 * @query   department - Filter by department ID
 * @query   startDate - Filter by start date
 * @query   endDate - Filter by end date
 * @query   sortBy - Sort field (default: effectiveDate)
 * @query   sortOrder - Sort order: asc/desc (default: desc)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 50)
 */
router.get('/', getAllPolicies);

/**
 * @route   GET /api/policies/stats
 * @desc    Get policy statistics
 */
router.get('/stats', getPolicyStats);

/**
 * @route   GET /api/policies/search
 * @desc    Search policies by name or description
 * @query   q - Search query
 */
router.get('/search', searchPolicies);

/**
 * @route   GET /api/policies/:id
 * @desc    Get policy by ID
 */
router.get('/:id', getPolicyById);

/**
 * @route   POST /api/policies
 * @desc    Create new policy
 * @body    policyName - Policy name (required)
 * @body    policyDescription - Policy description (required)
 * @body    effectiveDate - Effective date (required)
 * @body    applyToAll - Apply to all employees (default: false)
 * @body    assignTo - Array of department/designation assignments
 */
router.post('/', createPolicy);

/**
 * @route   PUT /api/policies/:id
 * @desc    Update policy
 * @body    policyName - Policy name
 * @body    policyDescription - Policy description
 * @body    effectiveDate - Effective date
 * @body    applyToAll - Apply to all employees
 * @body    assignTo - Array of department/designation assignments
 */
router.put('/:id', updatePolicy);

/**
 * @route   DELETE /api/policies/:id
 * @desc    Delete policy (soft delete)
 */
router.delete('/:id', deletePolicy);

export default router;
