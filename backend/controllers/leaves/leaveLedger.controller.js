/**
 * Leave Ledger Controller
 * Handles HTTP requests for leave balance ledger
 */

import leaveLedgerService from '../../services/leaves/leaveLedger.service.js';

/**
 * Get balance history for logged-in employee
 */
export const getMyBalanceHistory = async (req, res) => {
  try {
    const { user } = req;
    const { leaveType, startDate, endDate, year, limit } = req.query;

    // Use employeeId instead of userId for database queries
    const employeeId = user.employeeId || user.userId;

    const result = await leaveLedgerService.getBalanceHistory(
      user.companyId,
      employeeId,
      { leaveType, startDate, endDate, year, limit }
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getMyBalanceHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get balance history for a specific employee (for HR/Admin)
 */
export const getEmployeeBalanceHistory = async (req, res) => {
  try {
    const { user } = req;
    const { employeeId } = req.params;
    const { leaveType, startDate, endDate, year, limit } = req.query;

    // Verify access - only HR, Admin, Superadmin can view other employees' history
    const currentUserEmployeeId = user.employeeId || user.userId;
    if (user.role === 'employee' && currentUserEmployeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this employee\'s balance history'
      });
    }

    const result = await leaveLedgerService.getBalanceHistory(
      user.companyId,
      employeeId,
      { leaveType, startDate, endDate, year, limit }
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getEmployeeBalanceHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get balance summary for logged-in employee
 */
export const getMyBalanceSummary = async (req, res) => {
  try {
    const { user } = req;

    // Use employeeId instead of userId for database queries
    const employeeId = user.employeeId || user.userId;

    const result = await leaveLedgerService.getBalanceSummary(
      user.companyId,
      employeeId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getMyBalanceSummary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get balance summary for a specific employee (for HR/Admin)
 */
export const getEmployeeBalanceSummary = async (req, res) => {
  try {
    const { user } = req;
    const { employeeId } = req.params;

    // Verify access
    const currentUserEmployeeId = user.employeeId || user.userId;
    if (user.role === 'employee' && currentUserEmployeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this employee\'s balance summary'
      });
    }

    const result = await leaveLedgerService.getBalanceSummary(
      user.companyId,
      employeeId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getEmployeeBalanceSummary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get balance history by financial year
 */
export const getBalanceHistoryByFinancialYear = async (req, res) => {
  try {
    const { user } = req;
    const { financialYear } = req.params;

    // Use employeeId instead of userId for database queries
    const employeeId = user.employeeId || user.userId;

    const result = await leaveLedgerService.getBalanceHistoryByFinancialYear(
      user.companyId,
      employeeId,
      financialYear
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getBalanceHistoryByFinancialYear:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Export balance history
 */
export const exportBalanceHistory = async (req, res) => {
  try {
    const { user } = req;
    const { employeeId } = req.params;
    const { leaveType, startDate, endDate, year } = req.query;

    // Use employeeId instead of userId for database queries
    const currentUserEmployeeId = user.employeeId || user.userId;
    const targetEmployeeId = employeeId || currentUserEmployeeId;

    // Verify access if viewing another employee's data
    if (user.role === 'employee' && targetEmployeeId !== currentUserEmployeeId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to export this data'
      });
    }

    const result = await leaveLedgerService.exportBalanceHistory(
      user.companyId,
      targetEmployeeId,
      { leaveType, startDate, endDate, year }
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in exportBalanceHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Initialize ledger for employee (admin only)
 */
export const initializeEmployeeLedger = async (req, res) => {
  try {
    const { user } = req;
    const { employeeId } = req.params;

    // Only admin/hr/superadmin can initialize ledger
    if (user.role === 'employee') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to initialize ledger'
      });
    }

    const result = await leaveLedgerService.initializeEmployeeLedger(
      user.companyId,
      employeeId
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Employee ledger initialized successfully',
        data: result.data
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in initializeEmployeeLedger:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getMyBalanceHistory,
  getEmployeeBalanceHistory,
  getMyBalanceSummary,
  getEmployeeBalanceSummary,
  getBalanceHistoryByFinancialYear,
  exportBalanceHistory,
  initializeEmployeeLedger
};
