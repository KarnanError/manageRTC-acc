/**
 * Leave Encashment Controller
 * Handles HTTP requests for leave encashment operations
 */

import encashmentService from '../../services/leaves/leaveEncashment.service.js';

/**
 * Get encashment configuration
 */
export const getEncashmentConfig = async (req, res) => {
  try {
    const { user } = req;

    const result = await encashmentService.getEncashmentConfig(user.companyId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getEncashmentConfig:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Calculate encashment for an employee
 */
export const calculateEncashment = async (req, res) => {
  try {
    const { user } = req;
    const { leaveType } = req.params;
    const { days } = req.query;

    const daysRequested = days ? parseInt(days) : 0;
    // Use employeeId instead of userId for database queries
    const currentUserEmployeeId = user.employeeId || user.userId;
    const targetEmployeeId = user.role === 'employee' ? currentUserEmployeeId : (req.params.employeeId || currentUserEmployeeId);

    // Verify access - use employeeId for comparison
    if (user.role === 'employee' && targetEmployeeId !== currentUserEmployeeId) {
      return res.status(403).json({
        success: false,
        error: 'You can only calculate your own encashment'
      });
    }

    const result = await encashmentService.calculateEncashment(
      user.companyId,
      targetEmployeeId,
      leaveType,
      daysRequested
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in calculateEncashment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Execute leave encashment
 */
export const executeEncashment = async (req, res) => {
  try {
    const { user } = req;
    const { leaveType } = req.params;
    const { days, remarks, employeeId } = req.body;

    const daysRequested = parseInt(days);
    // Use employeeId instead of userId for database queries
    const currentUserEmployeeId = user.employeeId || user.userId;
    const targetEmployeeId = user.role === 'employee' ? currentUserEmployeeId : (employeeId || currentUserEmployeeId);

    if (!daysRequested || daysRequested <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid number of days requested'
      });
    }

    // Verify access - employees can only encash their own leave
    if (user.role === 'employee' && targetEmployeeId !== currentUserEmployeeId) {
      return res.status(403).json({
        success: false,
        error: 'You can only encash your own leave'
      });
    }

    // Use userId for tracking who requested (audit trail)
    const requestedBy = user.userId;

    const result = await encashmentService.executeEncashment(
      user.companyId,
      targetEmployeeId,
      leaveType,
      daysRequested,
      requestedBy,
      remarks
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in executeEncashment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get encashment history for an employee
 */
export const getEncashmentHistory = async (req, res) => {
  try {
    const { user } = req;
    const { employeeId } = req.params;
    const { year } = req.query;

    // Verify access - use employeeId for comparison
    const currentUserEmployeeId = user.employeeId || user.userId;
    if (user.role === 'employee' && currentUserEmployeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own encashment history'
      });
    }

    const result = await encashmentService.getEncashmentHistory(
      user.companyId,
      employeeId,
      year
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getEncashmentHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get encashment summary for all employees (admin view)
 */
export const getEncashmentSummary = async (req, res) => {
  try {
    const { user } = req;
    const { year } = req.query;

    // Only admin/hr/superadmin can view summary
    if (user.role === 'employee') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view encashment summary'
      });
    }

    const result = await encashmentService.getEncashmentSummary(
      user.companyId,
      year
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getEncashmentSummary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getEncashmentConfig,
  calculateEncashment,
  executeEncashment,
  getEncashmentHistory,
  getEncashmentSummary,
};
