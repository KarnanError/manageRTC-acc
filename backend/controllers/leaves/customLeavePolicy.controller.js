/**
 * Custom Leave Policy Controller
 *
 * Handles HTTP requests for custom leave policy operations
 */

import * as service from '../../services/leaves/customLeavePolicy.service.js';

/**
 * Create a new custom leave policy
 * POST /api/leave/custom-policies
 */
export const createCustomPolicy = async (req, res) => {
  try {
    const { companyId } = req.user;
    const userId = req.user.userId;
    const employeeId = req.user.employeeId; // Use employeeId for ObjectId reference
    const policyData = req.body;

    const policy = await service.createCustomPolicy(companyId, policyData, employeeId || userId);

    res.status(201).json({
      success: true,
      message: 'Custom policy created successfully',
      data: policy
    });
  } catch (error) {
    console.error('Error creating custom policy:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create custom policy'
    });
  }
};

/**
 * Get all custom policies for a company
 * GET /api/leave/custom-policies
 * Query params: leaveTypeId, employeeId
 */
export const getCustomPolicies = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { leaveTypeId, employeeId } = req.query;

    const filters = {};
    if (leaveTypeId) filters.leaveTypeId = leaveTypeId;
    if (employeeId) filters.employeeId = employeeId;

    const policies = await service.getCustomPolicies(companyId, filters);

    res.status(200).json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    console.error('Error fetching custom policies:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch custom policies'
    });
  }
};

/**
 * Get a single custom policy by ID
 * GET /api/leave/custom-policies/:id
 */
export const getCustomPolicyById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const policy = await service.getCustomPolicyById(companyId, id);

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching custom policy:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Custom policy not found'
    });
  }
};

/**
 * Update a custom policy
 * PUT /api/leave/custom-policies/:id
 */
export const updateCustomPolicy = async (req, res) => {
  try {
    const { companyId } = req.user;
    const userId = req.user.userId;
    const employeeId = req.user.employeeId; // Use employeeId for ObjectId reference
    const { id } = req.params;
    const updateData = req.body;

    const policy = await service.updateCustomPolicy(companyId, id, updateData, employeeId || userId);

    res.status(200).json({
      success: true,
      message: 'Custom policy updated successfully',
      data: policy
    });
  } catch (error) {
    console.error('Error updating custom policy:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update custom policy'
    });
  }
};

/**
 * Delete a custom policy
 * DELETE /api/leave/custom-policies/:id
 */
export const deleteCustomPolicy = async (req, res) => {
  try {
    const { companyId } = req.user;
    const userId = req.user.userId;
    const employeeId = req.user.employeeId; // Use employeeId for ObjectId reference
    const { id } = req.params;

    const result = await service.deleteCustomPolicy(companyId, id, employeeId || userId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error deleting custom policy:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to delete custom policy'
    });
  }
};

/**
 * Get all custom policies for a specific employee
 * GET /api/leave/custom-policies/employee/:employeeId
 */
export const getEmployeePolicies = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { employeeId } = req.params;

    const policies = await service.getEmployeePolicies(companyId, employeeId);

    res.status(200).json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    console.error('Error fetching employee policies:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employee policies'
    });
  }
};

/**
 * Get custom policy for an employee and leave type
 * Used internally by leave balance calculation
 * GET /api/leave/custom-policies/employee/:employeeId/:leaveType
 * Note: leaveType is the leave type code (e.g., 'EARNED', 'SICK'), service converts to ObjectId
 */
export const getEmployeePolicyForLeaveType = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { employeeId, leaveType } = req.params;

    const policy = await service.getEmployeePolicy(companyId, employeeId, leaveType);

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching employee policy:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employee policy'
    });
  }
};

export default {
  createCustomPolicy,
  getCustomPolicies,
  getCustomPolicyById,
  updateCustomPolicy,
  deleteCustomPolicy,
  getEmployeePolicies,
  getEmployeePolicyForLeaveType
};
