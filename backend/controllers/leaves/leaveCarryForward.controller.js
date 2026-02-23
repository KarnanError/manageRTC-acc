/**
 * Leave Carry Forward Controller
 * Handles HTTP requests for leave carry forward operations
 */

import carryForwardService from '../../services/leaves/leaveCarryForward.service.js';

/**
 * Get carry forward configuration
 */
export const getCarryForwardConfig = async (req, res) => {
  try {
    const { user } = req;

    const result = await carryForwardService.getCarryForwardConfig(user.companyId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getCarryForwardConfig:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update carry forward configuration (admin only)
 */
export const updateCarryForwardConfig = async (req, res) => {
  try {
    const { user } = req;
    const { config } = req.body;

    // Only admin/hr/superadmin can update config
    if (user.role === 'employee') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update carry forward configuration'
      });
    }

    const result = await carryForwardService.updateCarryForwardConfig(
      user.companyId,
      config
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in updateCarryForwardConfig:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Calculate carry forward for an employee
 */
export const calculateEmployeeCarryForward = async (req, res) => {
  try {
    const { user } = req;
    const { employeeId } = req.params;
    const { year } = req.query;

    const fromYear = year ? parseInt(year) : new Date().getFullYear();

    // Verify access - use employeeId instead of userId for comparison
    const currentUserEmployeeId = user.employeeId || user.userId;
    if (user.role === 'employee' && currentUserEmployeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this employee\'s carry forward'
      });
    }

    const result = await carryForwardService.calculateEmployeeCarryForward(
      user.companyId,
      employeeId,
      fromYear
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in calculateEmployeeCarryForward:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Execute carry forward for an employee
 */
export const executeEmployeeCarryForward = async (req, res) => {
  try {
    const { user } = req;
    const { employeeId } = req.params;
    const { year } = req.body;

    const fromYear = year || new Date().getFullYear();

    // Only admin/hr/superadmin can execute carry forward
    if (user.role === 'employee') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to execute carry forward'
      });
    }

    // Use userId for tracking who executed the action (audit trail)
    const executedBy = user.userId;

    const result = await carryForwardService.executeEmployeeCarryForward(
      user.companyId,
      employeeId,
      fromYear,
      executedBy
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in executeEmployeeCarryForward:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Execute carry forward for all employees (admin only)
 */
export const executeCompanyCarryForward = async (req, res) => {
  try {
    const { user } = req;
    const { year } = req.body;

    const fromYear = year || new Date().getFullYear();

    // Only admin/superadmin can execute company-wide carry forward
    if (user.role === 'employee' || user.role === 'hr' || user.role === 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Only Admin and Superadmin can execute company-wide carry forward'
      });
    }

    // Use userId for tracking who executed the action (audit trail)
    const executedBy = user.userId;

    const result = await carryForwardService.executeCompanyCarryForward(
      user.companyId,
      fromYear,
      executedBy
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in executeCompanyCarryForward:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get carry forward history
 */
export const getCarryForwardHistory = async (req, res) => {
  try {
    const { user } = req;
    const { employeeId } = req.params;

    // Verify access - use employeeId instead of userId for comparison
    const currentUserEmployeeId = user.employeeId || user.userId;
    if (user.role === 'employee' && currentUserEmployeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this employee\'s carry forward history'
      });
    }

    const result = await carryForwardService.getCarryForwardHistory(
      user.companyId,
      employeeId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getCarryForwardHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get carry forward summary
 */
export const getCarryForwardSummary = async (req, res) => {
  try {
    const { user } = req;
    const { financialYear } = req.params;

    const result = await carryForwardService.getCarryForwardSummary(
      user.companyId,
      financialYear
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getCarryForwardSummary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getCarryForwardConfig,
  updateCarryForwardConfig,
  calculateEmployeeCarryForward,
  executeEmployeeCarryForward,
  executeCompanyCarryForward,
  getCarryForwardHistory,
  getCarryForwardSummary,
};
