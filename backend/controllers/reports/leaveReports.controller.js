/**
 * Leave Reports Controller
 *
 * Handles leave report generation with filtering and aggregation
 *
 * @module controllers/reports/leaveReports
 */

import Leave from '../../models/leave/leave.schema.js';
import LeaveType from '../../models/leave/leaveType.schema.js';
import Employee from '../../models/employee/employee.schema.js';
import logger from '../../utils/logger.js';

/**
 * Generate leave report
 * @route GET /api/reports/leaves
 */
export const generateLeaveReport = async (req, res) => {
  try {
    const { companyId } = req.user;
    const {
      employeeId,
      leaveType,
      status,
      startDate,
      endDate,
      department
    } = req.query;

    // Build filter
    const filter = { companyId };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;

    // Get employees to filter by department
    let employeeIds = [];
    if (employeeId) {
      employeeIds = [employeeId];
    } else if (department) {
      const employees = await Employee.find({
        companyId,
        departmentId: department,
        isDeleted: false
      }).select('_id');
      employeeIds = employees.map(e => e._id);
    }

    if (employeeIds.length > 0) {
      filter.employeeId = { $in: employeeIds };
    }

    // Get leave records
    const leaveRecords = await Leave.find(filter)
      .populate('employee', 'employeeId firstName lastName email departmentId')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const totalLeaves = leaveRecords.length;
    const pendingCount = leaveRecords.filter(l => l.status === 'pending').length;
    const approvedCount = leaveRecords.filter(l => l.status === 'approved').length;
    const rejectedCount = leaveRecords.filter(l => l.status === 'rejected').length;
    const cancelledCount = leaveRecords.filter(l => l.status === 'cancelled').length;

    const totalLeaveDays = leaveRecords.reduce((sum, l) => sum + (l.numberOfDays || 0), 0);
    const approvedLeaveDays = leaveRecords
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + (l.numberOfDays || 0), 0);

    // Group by leave type
    const byLeaveType = {};
    leaveRecords.forEach(leave => {
      const typeName = leave.leaveType || 'Unknown';
      if (!byLeaveType[typeName]) {
        byLeaveType[typeName] = {
          count: 0,
          totalDays: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }
      byLeaveType[typeName].count++;
      byLeaveType[typeName].totalDays += leave.numberOfDays || 0;
      byLeaveType[typeName][leave.status.toLowerCase()]++;
    });

    // Group by status
    const byStatus = {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      cancelled: cancelledCount
    };

    logger.info('Leave report generated', { companyId, totalLeaves });

    res.json({
      status: 'success',
      data: {
        summary: {
          totalLeaves,
          pendingCount,
          approvedCount,
          rejectedCount,
          cancelledCount,
          totalLeaveDays,
          approvedLeaveDays
        },
        byLeaveType,
        byStatus,
        leaveRecords
      }
    });
  } catch (error) {
    logger.error('Error generating leave report', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate leave report',
      error: error.message
    });
  }
};

/**
 * Generate employee leave balance report
 * @route GET /api/reports/leave-balance
 */
export const generateLeaveBalanceReport = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { department } = req.query;

    // Build employee filter
    const employeeFilter = { companyId, isDeleted: false };
    if (department) employeeFilter.departmentId = department;

    const employees = await Employee.find(employeeFilter)
      .populate('departmentId', 'name')
      .lean();

    // Get leave types for the company
    const leaveTypes = await LeaveType.find({ companyId, isDeleted: false }).lean();

    // Calculate leave balance for each employee
    const employeeBalances = await Promise.all(
      employees.map(async (employee) => {
        // Get approved leaves for this employee
        const approvedLeaves = await Leave.find({
          companyId,
          employeeId: employee._id,
          status: 'Approved'
        }).lean();

        // Calculate used leaves by type
        const usedLeaves = {};
        const currentYear = new Date().getFullYear();

        approvedLeaves.forEach(leave => {
          const leaveYear = new Date(leave.fromDate).getFullYear();
          if (leaveYear === currentYear) {
            const typeId = leave.leaveTypeId?.toString();
            if (!usedLeaves[typeId]) usedLeaves[typeId] = 0;
            usedLeaves[typeId] += leave.numberOfDays || 0;
          }
        });

        // Build balance report for each leave type
        const leaveBalances = leaveTypes.map(type => {
          const used = usedLeaves[type._id.toString()] || 0;
          const balance = (type.annualQuota || 0) - used;

          return {
            leaveType: type.name,
            code: type.code,
            annualQuota: type.annualQuota || 0,
            used,
            balance,
            isPaid: type.isPaid
          };
        });

        return {
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          department: employee.departmentId?.name || 'Unassigned',
          email: employee.email,
          leaveBalances
        };
      })
    );

    // Calculate company-wide leave statistics
    const leaveTypeStats = leaveTypes.map(type => {
      const totalQuota = employeeBalances.reduce(
        (sum, emp) => sum + (emp.leaveBalances.find(l => l.code === type.code)?.annualQuota || 0),
        0
      );
      const totalUsed = employeeBalances.reduce(
        (sum, emp) => sum + (emp.leaveBalances.find(l => l.code === type.code)?.used || 0),
        0
      );

      return {
        leaveType: type.name,
        code: type.code,
        totalQuota,
        totalUsed,
        totalBalance: totalQuota - totalUsed,
        avgUsedPerEmployee: employeeBalances.length > 0 ? (totalUsed / employeeBalances.length).toFixed(2) : 0
      };
    });

    logger.info('Leave balance report generated', { companyId, employeeCount: employees.length });

    res.json({
      status: 'success',
      data: {
        leaveTypeStats,
        employeeBalances
      }
    });
  } catch (error) {
    logger.error('Error generating leave balance report', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate leave balance report',
      error: error.message
    });
  }
};

/**
 * Generate monthly leave summary
 * @route GET /api/reports/leaves/monthly-summary
 */
export const generateMonthlyLeaveSummary = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { month, year } = req.query;

    const reportMonth = parseInt(month) || new Date().getMonth() + 1;
    const reportYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59);

    // Get leaves for the month based on fromDate
    const leaves = await Leave.find({
      companyId,
      fromDate: { $gte: startDate, $lte: endDate }
    })
      .populate('employee', 'employeeId firstName lastName departmentId')
      .lean();

    // Group by leave type
    const byLeaveType = {};
    leaves.forEach(leave => {
      const typeName = leave.leaveType || 'Unknown';
      if (!byLeaveType[typeName]) {
        byLeaveType[typeName] = {
          count: 0,
          totalDays: 0,
          approved: 0,
          pending: 0
        };
      }
      byLeaveType[typeName].count++;
      byLeaveType[typeName].totalDays += leave.numberOfDays || 0;
      if (leave.status === 'approved') byLeaveType[typeName].approved++;
      if (leave.status === 'pending') byLeaveType[typeName].pending++;
    });

    // Group by department
    const byDepartment = {};
    leaves.forEach(leave => {
      const deptName = leave.employee?.departmentId?.toString() || 'Unassigned';
      if (!byDepartment[deptName]) {
        byDepartment[deptName] = {
          department: deptName,
          totalLeaves: 0,
          totalDays: 0,
          approved: 0
        };
      }
      byDepartment[deptName].totalLeaves++;
      byDepartment[deptName].totalDays += leave.numberOfDays || 0;
      if (leave.status === 'approved') byDepartment[deptName].approved++;
    });

    // Overall statistics
    const summary = {
      totalLeaves: leaves.length,
      totalDays: leaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0),
      approved: leaves.filter(l => l.status === 'approved').length,
      pending: leaves.filter(l => l.status === 'pending').length,
      rejected: leaves.filter(l => l.status === 'rejected').length
    };

    logger.info('Monthly leave summary generated', { companyId, month: reportMonth, year: reportYear });

    res.json({
      status: 'success',
      data: {
        period: { month: reportMonth, year: reportYear },
        summary,
        byLeaveType: Object.values(byLeaveType),
        byDepartment: Object.values(byDepartment)
      }
    });
  } catch (error) {
    logger.error('Error generating monthly leave summary', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate monthly leave summary',
      error: error.message
    });
  }
};

/**
 * Export leave report to CSV
 * @route GET /api/reports/leaves/export
 */
export const exportLeaveReport = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { startDate, endDate } = req.query;

    const filter = { companyId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'employeeId firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV
    const headers = [
      'Leave ID',
      'Employee ID',
      'Employee Name',
      'Leave Type',
      'From Date',
      'To Date',
      'Number of Days',
      'Reason',
      'Status',
      'Applied On'
    ];

    const rows = leaves.map(leave => [
      leave.leaveId,
      leave.employee?.employeeId || 'N/A',
      leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Unknown',
      leave.leaveType || 'N/A',
      leave.fromDate?.toISOString().split('T')[0],
      leave.toDate?.toISOString().split('T')[0],
      leave.numberOfDays,
      leave.reason,
      leave.status,
      leave.createdAt?.toISOString().split('T')[0]
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leaves-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting leave report', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to export leave report',
      error: error.message
    });
  }
};

export default {
  generateLeaveReport,
  generateLeaveBalanceReport,
  generateMonthlyLeaveSummary,
  exportLeaveReport
};
