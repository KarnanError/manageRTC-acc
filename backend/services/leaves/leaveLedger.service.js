/**
 * Leave Ledger Service
 * Handles all leave balance ledger operations using native MongoDB driver
 * (multi-tenant architecture - data lives in company-specific databases)
 */

import { getTenantCollections } from '../../config/db.js';

// Hardcoded types as fallback - will be overridden by company's leaveTypes collection
const FALLBACK_LEAVE_TYPES = ['casual', 'sick', 'earned', 'compensatory', 'maternity', 'paternity', 'bereavement', 'unpaid', 'special'];

/**
 * Get active leave types for a company from the database
 * Returns lowercase codes to match ledger storage format
 */
const getActiveLeaveTypesForCompany = async (companyId) => {
  try {
    const { leaveTypes } = getTenantCollections(companyId);
    const activeTypes = await leaveTypes.find({
      companyId,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    // Return lowercase codes to match ledger format (ledger stores as 'casual', 'sick', etc.)
    return activeTypes.map(lt => lt.code.toLowerCase());
  } catch (error) {
    console.error('[LeaveLedger] Error fetching leave types from database, using fallback:', error);
    return FALLBACK_LEAVE_TYPES;
  }
};

/**
 * Get leave type details (name, annualQuota, etc.) for a company
 */
const getLeaveTypeDetailsMap = async (companyId) => {
  try {
    const { leaveTypes } = getTenantCollections(companyId);
    const activeTypes = await leaveTypes.find({
      companyId,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    const detailsMap = {};
    activeTypes.forEach(lt => {
      detailsMap[lt.code.toLowerCase()] = {
        name: lt.name,
        code: lt.code.toLowerCase(),
        annualQuota: lt.annualQuota || 0,
        isPaid: lt.isPaid,
        color: lt.color
      };
    });
    return detailsMap;
  } catch (error) {
    console.error('[LeaveLedger] Error fetching leave type details:', error);
    return {};
  }
};

/**
 * Get the latest ledger entry for an employee + leave type
 */
const getLatestEntry = async (leaveLedger, employeeId, leaveType) => {
  const entries = await leaveLedger.find(
    { employeeId, leaveType, isDeleted: { $ne: true } },
    { sort: { transactionDate: -1 }, limit: 1 }
  ).toArray();
  return entries[0] || null;
};

/**
 * Calculate financial year string
 */
const getFinancialYear = (year) => `FY${year}-${year + 1}`;

/**
 * Get balance history for an employee
 */
export const getBalanceHistory = async (companyId, employeeId, filters = {}) => {
  try {
    const { leaveType, startDate, endDate, year, limit = 100 } = filters;
    const { leaveLedger } = getTenantCollections(companyId);

    const query = { companyId, employeeId, isDeleted: { $ne: true } };

    if (leaveType) query.leaveType = leaveType;
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }
    if (year) query.year = parseInt(year);

    const transactions = await leaveLedger
      .find(query, { sort: { transactionDate: -1 }, limit: parseInt(limit) })
      .toArray();

    const summary = await calculateSummary(leaveLedger, companyId, employeeId, leaveType, year);

    return { success: true, data: { transactions, summary } };
  } catch (error) {
    console.error('Error fetching balance history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get balance summary for all leave types
 * Fetches active leave types from company's database dynamically
 * Also checks for custom policies that override default leave quotas
 */
export const getBalanceSummary = async (companyId, employeeId) => {
  try {
    const { leaveLedger, employees, customLeavePolicies } = getTenantCollections(companyId);

    const employee = await employees.findOne({ employeeId, isDeleted: { $ne: true } });

    // Fetch active leave types from company's database
    const leaveTypeCodes = await getActiveLeaveTypesForCompany(companyId);
    const leaveTypeDetailsMap = await getLeaveTypeDetailsMap(companyId);

    // Fetch active custom policies for this employee
    const employeeCustomPolicies = await customLeavePolicies.find({
      isActive: true,
      employeeIds: { $in: [employeeId] },
      isDeleted: { $ne: true }
    }).toArray();

    // Create a map of leave type code -> custom policy annualQuota for quick lookup
    const customPolicyQuotaMap = {};
    for (const policy of employeeCustomPolicies) {
      if (policy.leaveTypeId) {
        // Find leaveType by ObjectId to get the code
        const leaveType = await leaveTypes.findOne({
          _id: policy.leaveTypeId,
          isDeleted: { $ne: true }
        });
        if (leaveType && policy.annualQuota !== undefined) {
          customPolicyQuotaMap[leaveType.code] = policy.annualQuota;
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const summary = {};

    for (const type of leaveTypeCodes) {
      const latestEntry = await getLatestEntry(leaveLedger, employeeId, type);
      const leaveTypeDetails = leaveTypeDetailsMap[type];
      const employeeBalance = employee?.leaveBalance?.balances?.find(b => b.type === type);

      // Check if there's a custom policy for this leave type
      const hasCustomPolicy = customPolicyQuotaMap[type] !== undefined;
      const customQuota = customPolicyQuotaMap[type];

      // Use custom policy annualQuota if available, otherwise use company's annualQuota
      const defaultQuota = leaveTypeDetails?.annualQuota || 0;

      // PRIORITIZE LEDGER: Use ledger balance if available, otherwise fall back to employee balance
      // The ledger is the single source of truth for current balance
      const baseBalance = latestEntry ? latestEntry.balanceAfter : null;
      const total = hasCustomPolicy ? customQuota : (baseBalance ?? employeeBalance?.total ?? defaultQuota);
      const balance = hasCustomPolicy ? customQuota : (baseBalance ?? employeeBalance?.balance ?? defaultQuota);

      const [allocated, usedCount, restored] = await Promise.all([
        leaveLedger.countDocuments({ companyId, employeeId, leaveType: type, transactionType: 'allocated', transactionDate: { $gte: yearStart, $lte: yearEnd }, isDeleted: { $ne: true } }),
        leaveLedger.countDocuments({ companyId, employeeId, leaveType: type, transactionType: 'used', transactionDate: { $gte: yearStart, $lte: yearEnd }, isDeleted: { $ne: true } }),
        leaveLedger.countDocuments({ companyId, employeeId, leaveType: type, transactionType: 'restored', transactionDate: { $gte: yearStart, $lte: yearEnd }, isDeleted: { $ne: true } }),
      ]);

      summary[type] = {
        total,
        used: employeeBalance?.used || 0,
        balance,
        ledgerBalance: latestEntry?.balanceAfter || balance,
        lastTransaction: latestEntry?.transactionDate || null,
        yearlyStats: { allocated, used, restored },
        // Include leave type details for frontend display
        leaveTypeName: leaveTypeDetails?.name || type,
        isPaid: leaveTypeDetails?.isPaid !== false, // Default to paid
        annualQuota: leaveTypeDetails?.annualQuota || 0,
        // Include custom policy information
        hasCustomPolicy,
        customDays: hasCustomPolicy ? customDays : undefined,
      };
    }

    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching balance summary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate aggregate summary statistics
 */
const calculateSummary = async (leaveLedger, companyId, employeeId, leaveType, year) => {
  const matchQuery = { companyId, employeeId, isDeleted: { $ne: true } };
  if (leaveType) matchQuery.leaveType = leaveType;
  if (year) matchQuery.year = parseInt(year);

  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: '$leaveType',
        totalAllocated: { $sum: { $cond: [{ $eq: ['$transactionType', 'allocated'] }, '$amount', 0] } },
        totalUsed: { $sum: { $cond: [{ $eq: ['$transactionType', 'used'] }, { $abs: '$amount' }, 0] } },
        totalRestored: { $sum: { $cond: [{ $eq: ['$transactionType', 'restored'] }, '$amount', 0] } },
        totalEncashed: { $sum: { $cond: [{ $eq: ['$transactionType', 'encashed'] }, '$amount', 0] } },
        currentBalance: { $last: '$balanceAfter' },
        transactionCount: { $sum: 1 },
      },
    },
  ];

  const aggregateResult = await leaveLedger.aggregate(pipeline).toArray();
  const result = {};
  aggregateResult.forEach(item => {
    result[item._id] = {
      totalAllocated: item.totalAllocated,
      totalUsed: item.totalUsed,
      totalRestored: item.totalRestored,
      totalEncashed: item.totalEncashed,
      currentBalance: item.currentBalance,
      transactionCount: item.transactionCount,
    };
  });
  return result;
};

/**
 * Get balance history by financial year
 */
export const getBalanceHistoryByFinancialYear = async (companyId, employeeId, financialYear) => {
  try {
    const { leaveLedger } = getTenantCollections(companyId);

    const transactions = await leaveLedger
      .find(
        { companyId, employeeId, financialYear, isDeleted: { $ne: true } },
        { sort: { transactionDate: -1 } }
      )
      .toArray();

    const byLeaveType = transactions.reduce((acc, tx) => {
      if (!acc[tx.leaveType]) acc[tx.leaveType] = [];
      acc[tx.leaveType].push(tx);
      return acc;
    }, {});

    const yearNum = financialYear.replace('FY', '').split('-')[0];
    const summary = await calculateSummary(leaveLedger, companyId, employeeId, null, yearNum);

    return { success: true, data: { financialYear, transactions: byLeaveType, summary } };
  } catch (error) {
    console.error('Error fetching balance history by financial year:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record leave usage in ledger
 */
export const recordLeaveUsage = async (companyId, employeeId, leaveType, amount, leaveId, startDate, endDate, description) => {
  try {
    const { leaveLedger } = getTenantCollections(companyId);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const latestEntry = await getLatestEntry(leaveLedger, employeeId, leaveType);
    const balanceBefore = latestEntry ? latestEntry.balanceAfter : 0;
    const balanceAfter = balanceBefore - amount;

    const entry = {
      employeeId,
      companyId,
      leaveType,
      transactionType: 'used',
      amount: -amount,
      balanceBefore,
      balanceAfter,
      leaveRequestId: leaveId,
      transactionDate: now,
      financialYear: getFinancialYear(year),
      year,
      month,
      description: description || 'Leave used',
      details: { startDate, endDate, duration: amount },
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await leaveLedger.insertOne(entry);
    return { success: true, data: { ...entry, _id: result.insertedId } };
  } catch (error) {
    console.error('Error recording leave usage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record leave restoration in ledger
 */
export const recordLeaveRestoration = async (companyId, employeeId, leaveType, amount, leaveId, description) => {
  try {
    const { leaveLedger } = getTenantCollections(companyId);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const latestEntry = await getLatestEntry(leaveLedger, employeeId, leaveType);
    const balanceBefore = latestEntry ? latestEntry.balanceAfter : 0;
    const balanceAfter = balanceBefore + amount;

    const entry = {
      employeeId,
      companyId,
      leaveType,
      transactionType: 'restored',
      amount,
      balanceBefore,
      balanceAfter,
      leaveRequestId: leaveId,
      transactionDate: now,
      financialYear: getFinancialYear(year),
      year,
      month,
      description: description || 'Leave restored after cancellation',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await leaveLedger.insertOne(entry);
    return { success: true, data: { ...entry, _id: result.insertedId } };
  } catch (error) {
    console.error('Error recording leave restoration:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize ledger for new employee
 */
export const initializeEmployeeLedger = async (companyId, employeeId) => {
  try {
    const { leaveLedger, employees } = getTenantCollections(companyId);

    const employee = await employees.findOne({ employeeId, isDeleted: { $ne: true } });

    if (!employee || !employee.leaveBalance?.balances) {
      return { success: false, error: 'Employee not found or has no leave balances' };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const entries = [];

    for (const balance of employee.leaveBalance.balances) {
      const entry = {
        employeeId,
        companyId,
        leaveType: balance.type,
        transactionType: 'opening',
        amount: 0,
        balanceBefore: 0,
        balanceAfter: balance.balance || 0,
        transactionDate: new Date(year, month - 1, 1),
        financialYear: getFinancialYear(year),
        year,
        month,
        description: 'Opening balance',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };
      const result = await leaveLedger.insertOne(entry);
      entries.push({ ...entry, _id: result.insertedId });
    }

    return { success: true, data: entries };
  } catch (error) {
    console.error('Error initializing employee ledger:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export balance history for reports
 */
export const exportBalanceHistory = async (companyId, employeeId, filters = {}) => {
  try {
    const history = await getBalanceHistory(companyId, employeeId, filters);
    if (!history.success) return history;

    const exportData = history.data.transactions.map(tx => ({
      Date: new Date(tx.transactionDate).toLocaleDateString(),
      'Leave Type': tx.leaveType,
      'Transaction Type': tx.transactionType,
      Amount: tx.amount,
      'Balance Before': tx.balanceBefore,
      'Balance After': tx.balanceAfter,
      Description: tx.description,
      'Leave ID': tx.leaveRequestId || 'N/A',
    }));

    return { success: true, data: exportData };
  } catch (error) {
    console.error('Error exporting balance history:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getBalanceHistory,
  getBalanceSummary,
  getBalanceHistoryByFinancialYear,
  recordLeaveUsage,
  recordLeaveRestoration,
  initializeEmployeeLedger,
  exportBalanceHistory,
};
