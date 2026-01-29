/**
 * Department REST Controller
 * REST API endpoints for department management
 */

import Department from '../../models/department.model.js';
import { logger } from '../../utils/logger.js';

/**
 * Get all departments with optional filters
 * @route GET /api/departments
 */
export const getAllDepartments = async (req, res) => {
  try {
    const { status, search, sortBy = 'department', sortOrder = 'asc' } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const departments = await Department.find(query).sort(sort).lean();

    // Get stats
    const stats = {
      totalDepartments: departments.length,
      activeCount: departments.filter(d => d.status === 'Active').length,
      inactiveCount: departments.filter(d => d.status === 'Inactive').length,
      recentCount: departments.filter(d => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(d.createdAt) >= thirtyDaysAgo;
      }).length
    };

    // Add employee counts if requested
    const departmentsWithCounts = departments.map(dept => ({
      ...dept,
      employeeCount: dept.employeeCount || 0,
      designationCount: dept.designationCount || 0,
      policyCount: dept.policyCount || 0
    }));

    res.json({
      success: true,
      data: departmentsWithCounts,
      stats,
      count: departmentsWithCounts.length
    });

  } catch (error) {
    logger.error('[Department] Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch departments' }
    });
  }
};

/**
 * Get department by ID
 * @route GET /api/departments/:id
 */
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id).lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        error: { message: 'Department not found' }
      });
    }

    res.json({
      success: true,
      data: department
    });

  } catch (error) {
    logger.error('[Department] Error fetching department:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch department' }
    });
  }
};

/**
 * Create new department
 * @route POST /api/departments
 */
export const createDepartment = async (req, res) => {
  try {
    const departmentData = req.body;

    // Validate required fields
    if (!departmentData.department || typeof departmentData.department !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Department name is required and must be a string' }
      });
    }

    // Check if department with same name already exists for this company
    const existingDept = await Department.findOne({
      department: departmentData.department,
      companyId: req.user?.companyId
    });

    if (existingDept) {
      return res.status(409).json({
        success: false,
        error: { message: 'Department with this name already exists' }
      });
    }

    // Set defaults
    departmentData.status = departmentData.status || 'Active';
    departmentData.companyId = departmentData.companyId || req.user?.companyId;

    // Create department
    const department = await Department.create(departmentData);

    // Emit socket event for real-time updates
    if (req.socket) {
      req.socket.emit('department:created', department);
    }

    res.status(201).json({
      success: true,
      data: department,
      message: 'Department created successfully'
    });

  } catch (error) {
    logger.error('[Department] Error creating department:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create department' }
    });
  }
};

/**
 * Update department
 * @route PUT /api/departments/:id
 */
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if department exists
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: { message: 'Department not found' }
      });
    }

    // Check if updating name and if new name already exists
    if (updateData.department && updateData.department !== department.department) {
      const existingDept = await Department.findOne({
        department: updateData.department,
        companyId: department.companyId,
        _id: { $ne: id }
      });

      if (existingDept) {
        return res.status(409).json({
          success: false,
          error: { message: 'Department with this name already exists' }
        });
      }
    }

    // Update department
    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    // Emit socket event for real-time updates
    if (req.socket) {
      req.socket.emit('department:updated', updatedDepartment);
    }

    res.json({
      success: true,
      data: updatedDepartment,
      message: 'Department updated successfully'
    });

  } catch (error) {
    logger.error('[Department] Error updating department:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update department' }
    });
  }
};

/**
 * Delete department
 * @route DELETE /api/departments/:id
 */
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: { message: 'Department not found' }
      });
    }

    // Check if department has employees
    if (department.employeeCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete department with assigned employees',
          field: 'general'
        }
      });
    }

    // Delete department
    await Department.findByIdAndDelete(id);

    // Emit socket event for real-time updates
    if (req.socket) {
      req.socket.emit('department:deleted', { _id: id });
    }

    res.json({
      success: true,
      data: { _id: id },
      message: 'Department deleted successfully'
    });

  } catch (error) {
    logger.error('[Department] Error deleting department:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete department' }
    });
  }
};

/**
 * Update department status
 * @route PUT /api/departments/:id/status
 */
export const updateDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status value. Must be Active or Inactive' }
      });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        error: { message: 'Department not found' }
      });
    }

    // Emit socket event for real-time updates
    if (req.socket) {
      req.socket.emit('department:updated', department);
    }

    res.json({
      success: true,
      data: department,
      message: `Department status updated to ${status}`
    });

  } catch (error) {
    logger.error('[Department] Error updating department status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update department status' }
    });
  }
};

/**
 * Search departments
 * @route GET /api/departments/search
 */
export const searchDepartments = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' }
      });
    }

    const departments = await Department.find({
      $or: [
        { department: { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ department: 1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: departments,
      count: departments.length
    });

  } catch (error) {
    logger.error('[Department] Error searching departments:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to search departments' }
    });
  }
};

/**
 * Get departments statistics
 * @route GET /api/departments/stats
 */
export const getDepartmentStats = async (req, res) => {
  try {
    const allDepartments = await Department.find({}).lean();

    const stats = {
      totalDepartments: allDepartments.length,
      activeCount: allDepartments.filter(d => d.status === 'Active').length,
      inactiveCount: allDepartments.filter(d => d.status === 'Inactive').length,
      recentCount: allDepartments.filter(d => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(d.createdAt) >= thirtyDaysAgo;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('[Department] Error fetching department stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch department statistics' }
    });
  }
};

export default {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  updateDepartmentStatus,
  searchDepartments,
  getDepartmentStats
};
