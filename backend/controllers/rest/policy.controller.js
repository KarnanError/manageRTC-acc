/**
 * Policy REST Controller
 * Handles all policy-related CRUD operations
 */

import Policy from '../../models/policy/policy.schema.js';
import Department from '../../models/department/department.schema.js';
import { logger } from '../../utils/logger.js';

/**
 * Get all policies with optional filtering
 * REST API: GET /api/policies
 */
export const getAllPolicies = async (req, res) => {
  try {
    const {
      department,
      startDate,
      endDate,
      sortBy = 'effectiveDate',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Company ID is required' }
      });
    }

    // Build query
    const query = {
      companyId,
      isDeleted: false
    };

    // Filter by department if specified
    if (department) {
      query['assignTo.departmentId'] = department;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.effectiveDate = {};
      if (startDate) {
        query.effectiveDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.effectiveDate.$lte = new Date(endDate);
      }
    }

    // Execute query with sorting and pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const policies = await Policy.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Policy.countDocuments(query);

    res.json({
      success: true,
      data: policies,
      count: policies.length,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    });
  } catch (error) {
    logger.error('Error fetching policies:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch policies' }
    });
  }
};

/**
 * Get policy stats
 * REST API: GET /api/policies/stats
 */
export const getPolicyStats = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Company ID is required' }
      });
    }

    const stats = await Policy.getStats(companyId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching policy stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch policy stats' }
    });
  }
};

/**
 * Get policy by ID
 * REST API: GET /api/policies/:id
 */
export const getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const policy = await Policy.findOne({
      _id: id,
      companyId,
      isDeleted: false
    }).lean();

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: { message: 'Policy not found' }
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    logger.error('Error fetching policy:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch policy' }
    });
  }
};

/**
 * Create new policy
 * REST API: POST /api/policies
 */
export const createPolicy = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Company ID is required' }
      });
    }

    const { policyName, policyDescription, effectiveDate, applyToAll, assignTo } = req.body;

    // Validation
    if (!policyName || !policyName.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Policy Name is required' }
      });
    }

    if (!policyDescription || !policyDescription.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Policy Description is required' }
      });
    }

    if (!effectiveDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Effective Date is required' }
      });
    }

    // Validate applyToAll and assignTo combination
    if (!applyToAll && (!assignTo || assignTo.length === 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Either apply to all employees or assign to specific departments/designations' }
      });
    }

    // Verify department assignments exist
    if (assignTo && assignTo.length > 0) {
      const departmentIds = assignTo.map(a => a.departmentId);
      const departments = await Department.find({
        _id: { $in: departmentIds },
        companyId
      });

      if (departments.length !== departmentIds.length) {
        return res.status(400).json({
          success: false,
          error: { message: 'One or more departments not found' }
        });
      }
    }

    // Create policy
    const policy = await Policy.create({
      companyId,
      policyName: policyName.trim(),
      policyDescription: policyDescription.trim(),
      effectiveDate: new Date(effectiveDate),
      applyToAll: applyToAll || false,
      assignTo: assignTo || [],
      createdBy: req.user?.userId
    });

    // Emit socket event for real-time updates
    if (req.socket) {
      req.socket.emit('policy:created', policy);
    }

    res.status(201).json({
      success: true,
      data: policy,
      message: 'Policy created successfully'
    });
  } catch (error) {
    logger.error('Error creating policy:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create policy' }
    });
  }
};

/**
 * Update policy
 * REST API: PUT /api/policies/:id
 */
export const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const { policyName, policyDescription, effectiveDate, applyToAll, assignTo } = req.body;

    // Find existing policy
    const policy = await Policy.findOne({
      _id: id,
      companyId,
      isDeleted: false
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: { message: 'Policy not found' }
      });
    }

    // Validation
    if (policyName !== undefined && !policyName.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Policy Name is required' }
      });
    }

    if (policyDescription !== undefined && !policyDescription.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Policy Description is required' }
      });
    }

    // Validate applyToAll and assignTo combination
    const newApplyToAll = applyToAll !== undefined ? applyToAll : policy.applyToAll;
    const newAssignTo = assignTo !== undefined ? assignTo : policy.assignTo;

    if (!newApplyToAll && (!newAssignTo || newAssignTo.length === 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Either apply to all employees or assign to specific departments/designations' }
      });
    }

    // Verify department assignments exist if provided
    if (newAssignTo && newAssignTo.length > 0) {
      const departmentIds = newAssignTo.map(a => a.departmentId);
      const departments = await Department.find({
        _id: { $in: departmentIds },
        companyId
      });

      if (departments.length !== departmentIds.length) {
        return res.status(400).json({
          success: false,
          error: { message: 'One or more departments not found' }
        });
      }
    }

    // Update policy
    if (policyName !== undefined) policy.policyName = policyName.trim();
    if (policyDescription !== undefined) policy.policyDescription = policyDescription.trim();
    if (effectiveDate !== undefined) policy.effectiveDate = new Date(effectiveDate);
    if (applyToAll !== undefined) policy.applyToAll = applyToAll;
    if (assignTo !== undefined) policy.assignTo = assignTo;
    policy.updatedBy = req.user?.userId;

    await policy.save();

    // Emit socket event for real-time updates
    if (req.socket) {
      req.socket.emit('policy:updated', policy);
    }

    res.json({
      success: true,
      data: policy,
      message: 'Policy updated successfully'
    });
  } catch (error) {
    logger.error('Error updating policy:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update policy' }
    });
  }
};

/**
 * Delete policy (soft delete)
 * REST API: DELETE /api/policies/:id
 */
export const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const policy = await Policy.findOne({
      _id: id,
      companyId,
      isDeleted: false
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: { message: 'Policy not found' }
      });
    }

    // Soft delete
    policy.isDeleted = true;
    await policy.save();

    // Emit socket event for real-time updates
    if (req.socket) {
      req.socket.emit('policy:deleted', { _id: id });
    }

    res.json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting policy:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete policy' }
    });
  }
};

/**
 * Search policies
 * REST API: GET /api/policies/search
 */
export const searchPolicies = async (req, res) => {
  try {
    const { q } = req.query;
    const companyId = req.user?.companyId;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' }
      });
    }

    const policies = await Policy.find({
      companyId,
      isDeleted: false,
      $or: [
        { policyName: { $regex: q, $options: 'i' } },
        { policyDescription: { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ effectiveDate: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    logger.error('Error searching policies:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to search policies' }
    });
  }
};
