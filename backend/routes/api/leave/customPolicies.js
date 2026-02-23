/**
 * Custom Leave Policy Routes
 *
 * REST API endpoints for custom leave policy management
 */

import express from 'express';
import * as controller from '../../../controllers/leaves/customLeavePolicy.controller.js';
import { authenticate } from '../../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/leave/custom-policies
 * @desc    Create a new custom leave policy
 * @access  HR, Admin, Superadmin
 */
router.post('/', controller.createCustomPolicy);

/**
 * @route   GET /api/leave/custom-policies
 * @desc    Get all custom policies for the company
 * @query   leaveTypeId - Filter by leave type ObjectId (optional)
 * @query   employeeId - Filter by employee (optional)
 * @access  HR, Admin, Superadmin
 */
router.get('/', controller.getCustomPolicies);

/**
 * @route   GET /api/leave/custom-policies/stats
 * @desc    Get statistics about custom policies
 * @access  HR, Admin, Superadmin
 */
router.get('/stats', async (req, res) => {
  try {
    const { companyId } = req.user;
    const { getTenantCollections } = await import('../../../config/db.js');
    const { ObjectId } = await import('mongodb');

    const { customLeavePolicies, leaveTypes } = getTenantCollections(companyId);

    // Count total active policies
    const totalPolicies = await customLeavePolicies.countDocuments({
      isActive: true,
      isDeleted: { $ne: true }
    });

    // Aggregate policies by leave type (join with leaveTypes for names)
    const policiesByType = await customLeavePolicies.aggregate([
      { $match: { isActive: true, isDeleted: { $ne: true } } },
      { $group: { _id: '$leaveTypeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Enrich with leave type names
    const enrichedPoliciesByType = await Promise.all(
      policiesByType.map(async (item) => {
        const leaveType = await leaveTypes.findOne({
          _id: item._id,
          isDeleted: { $ne: true }
        });
        return {
          _id: item._id,
          leaveTypeName: leaveType?.name || 'Unknown',
          leaveTypeCode: leaveType?.code || 'UNKNOWN',
          count: item.count
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalPolicies,
        policiesByType: enrichedPoliciesByType
      }
    });
  } catch (error) {
    console.error('Error fetching policy stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * @route   GET /api/leave/custom-policies/:id
 * @desc    Get a single custom policy by ID
 * @access  HR, Admin, Superadmin
 */
router.get('/:id', controller.getCustomPolicyById);

/**
 * @route   PUT /api/leave/custom-policies/:id
 * @desc    Update a custom policy
 * @access  HR, Admin, Superadmin
 */
router.put('/:id', controller.updateCustomPolicy);

/**
 * @route   DELETE /api/leave/custom-policies/:id
 * @desc    Delete a custom policy
 * @access  HR, Admin, Superadmin
 */
router.delete('/:id', controller.deleteCustomPolicy);

/**
 * @route   GET /api/leave/custom-policies/employee/:employeeId
 * @desc    Get all custom policies for a specific employee
 * @access  HR, Admin, Superadmin, Employee (own policies)
 */
router.get('/employee/:employeeId', controller.getEmployeePolicies);

/**
 * @route   GET /api/leave/custom-policies/employee/:employeeId/:leaveType
 * @desc    Get custom policy for an employee and leave type
 * @access  Internal use
 */
router.get('/employee/:employeeId/:leaveType', controller.getEmployeePolicyForLeaveType);

export default router;
