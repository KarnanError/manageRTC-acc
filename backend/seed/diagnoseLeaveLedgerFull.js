/**
 * Comprehensive Leave Ledger Diagnostic Script
 * Tests the entire leave ledger flow to identify issues
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9'; // amasQIS.ai

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function diagnoseLeaveLedger() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    log('✅ Connected to MongoDB Atlas\n', 'green');

    const db = client.db(COMPANY_ID);

    // ============================================
    // 1. CHECK COLLECTIONS EXIST
    // ============================================
    logSection('1. CHECKING COLLECTIONS');

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const requiredCollections = ['employees', 'leaveTypes', 'leaveLedger', 'custom_leave_policies', 'leaves'];

    for (const colName of requiredCollections) {
      const exists = collectionNames.includes(colName);
      if (exists) {
        log(`  ✅ ${colName} - exists`, 'green');
      } else {
        log(`  ❌ ${colName} - MISSING!`, 'red');
      }
    }

    // ============================================
    // 2. CHECK EMPLOYEES
    // ============================================
    logSection('2. CHECKING EMPLOYEES');

    const employees = db.collection('employees');
    const allEmployees = await employees.find({ isDeleted: { $ne: true } }).toArray();

    log(`  Found ${allEmployees.length} employees\n`, 'blue');

    for (const emp of allEmployees.slice(0, 5)) {
      const hasLeaveBalance = !!emp.leaveBalance;
      const hasBalances = hasLeaveBalance && emp.leaveBalance.balances && emp.leaveBalance.balances.length > 0;
      log(`  📋 ${emp.employeeId}: ${emp.firstName} ${emp.lastName}`, 'yellow');
      log(`     - Email: ${emp.email}`);
      log(`     - Has leaveBalance: ${hasLeaveBalance ? '✅' : '❌'}`);
      if (hasLeaveBalance) {
        log(`     - Balance count: ${emp.leaveBalance.balances?.length || 0}`);
      }
      console.log('');
    }

    // ============================================
    // 3. CHECK LEAVE TYPES
    // ============================================
    logSection('3. CHECKING LEAVE TYPES');

    const leaveTypes = db.collection('leaveTypes');
    const allLeaveTypes = await leaveTypes.find({
      companyId: COMPANY_ID,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    log(`  Found ${allLeaveTypes.length} active leave types\n`, 'blue');

    for (const lt of allLeaveTypes) {
      log(`  📗 ${lt.code}: ${lt.name}`, 'yellow');
      log(`     - Annual Quota: ${lt.annualQuota}`);
      log(`     - Is Paid: ${lt.isPaid}`);
      log(`     - Color: ${lt.color}`);
      console.log('');
    }

    // ============================================
    // 4. CHECK LEAVE LEDGER
    // ============================================
    logSection('4. CHECKING LEAVE LEDGER');

    const leaveLedger = db.collection('leaveLedger');
    const ledgerCount = await leaveLedger.countDocuments({ companyId: COMPANY_ID });
    const ledgerEntries = await leaveLedger.find({ companyId: COMPANY_ID }).limit(10).toArray();

    log(`  Total ledger entries: ${ledgerCount}\n`, 'blue');

    if (ledgerCount === 0) {
      log('  ⚠️  No ledger entries found! This is why summary shows 0/0', 'yellow');
      log('  The summary relies on employee.leaveBalance.balances when ledger is empty\n', 'yellow');
    } else {
      log('  Sample ledger entries:', 'yellow');
      for (const entry of ledgerEntries.slice(0, 3)) {
        log(`    - ${entry.employeeId} | ${entry.leaveType} | ${entry.transactionType} | ${entry.amount} | Balance: ${entry.balanceAfter}`, 'cyan');
      }
      console.log('');
    }

    // ============================================
    // 5. CHECK CUSTOM POLICIES
    // ============================================
    logSection('5. CHECKING CUSTOM LEAVE POLICIES');

    const customPolicies = db.collection('custom_leave_policies');
    const policyCount = await customPolicies.countDocuments({
      companyId: COMPANY_ID,
      isDeleted: { $ne: true }
    });
    const allPolicies = await customPolicies.find({
      companyId: COMPANY_ID,
      isDeleted: { $ne: true }
    }).toArray();

    log(`  Found ${policyCount} custom policies\n`, 'blue');

    for (const policy of allPolicies) {
      log(`  📄 "${policy.name}"`, 'yellow');
      log(`     - Leave Type: ${policy.leaveType}`);
      log(`     - Days: ${policy.days}`);
      log(`     - Employees: ${policy.employeeIds?.length || 0} employees`);
      if (policy.employeeIds && policy.employeeIds.length > 0) {
        log(`     - Employee IDs: ${policy.employeeIds.join(', ')}`, 'cyan');
      }
      log(`     - Active: ${policy.isActive}`);
      console.log('');
    }

    // ============================================
    // 6. TEST BALANCE SUMMARY CALCULATION (SIMULATED)
    // ============================================
    logSection('6. TEST BALANCE SUMMARY CALCULATION');

    const testEmployee = allEmployees[0];
    if (testEmployee) {
      log(`  Testing for employee: ${testEmployee.employeeId} (${testEmployee.firstName} ${testEmployee.lastName})\n`, 'blue');

      const employeeId = testEmployee.employeeId;

      // Get employee balance
      const employee = await employees.findOne({ employeeId, isDeleted: { $ne: true } });
      const empBalances = employee?.leaveBalance?.balances || [];

      log(`  Employee has ${empBalances.length} balance entries:`, 'yellow');
      for (const bal of empBalances) {
        log(`    - ${bal.type}: ${bal.balance || 0} / ${bal.total || 0}`, 'cyan');
      }
      console.log('');

      // Check for custom policies
      const employeeCustomPolicies = await customPolicies.find({
        companyId: COMPANY_ID,
        isActive: true,
        employeeIds: { $in: [employeeId] },
        isDeleted: { $ne: true }
      }).toArray();

      log(`  Custom policies for this employee: ${employeeCustomPolicies.length}`, 'yellow');
      for (const policy of employeeCustomPolicies) {
        log(`    - ${policy.leaveType}: ${policy.days} days`, 'cyan');
      }
      console.log('');

      // Simulate summary calculation
      log('  Simulated balance summary:', 'yellow');
      for (const lt of allLeaveTypes) {
        const type = lt.code.toLowerCase();
        const employeeBalance = empBalances.find(b => b.type === type);
        const customPolicy = employeeCustomPolicies.find(p => p.leaveType === type);

        const hasCustomPolicy = !!customPolicy;
        const customDays = customPolicy?.days;
        const defaultQuota = lt.annualQuota || 0;

        const total = hasCustomPolicy ? customDays : (employeeBalance?.total || defaultQuota);
        const balance = hasCustomPolicy ? customDays : (employeeBalance?.balance || defaultQuota);

        log(`    - ${lt.name}:`, 'cyan');
        log(`       Default Quota: ${defaultQuota}`);
        log(`       Has Custom Policy: ${hasCustomPolicy ? '✅ (' + customDays + ' days)' : '❌'}`);
        log(`       Employee Balance: ${employeeBalance?.balance || 0} / ${employeeBalance?.total || 0}`);
        log(`       Final Display: ${balance} / ${total}`);
        console.log('');
      }
    }

    // ============================================
    // 7. CHECK FOR COMMON ISSUES
    // ============================================
    logSection('7. CHECKING FOR COMMON ISSUES');

    // Issue 1: employeeId format mismatch
    log('  Issue: employeeId format', 'yellow');
    const hasNonEmpId = allEmployees.some(e => !e.employeeId?.startsWith('EMP-'));
    if (hasNonEmpId) {
      log('    ❌ Some employees don\'t have EMP-xxxx format employeeId', 'red');
      for (const emp of allEmployees) {
        if (!emp.employeeId?.startsWith('EMP-')) {
          log(`       - ${emp.employeeId}: ${emp.firstName} ${emp.lastName}`, 'cyan');
        }
      }
    } else {
      log('    ✅ All employees have EMP-xxxx format', 'green');
    }
    console.log('');

    // Issue 2: Leave types mismatch
    log('  Issue: Leave type code format', 'yellow');
    const hasWrongFormat = allLeaveTypes.some(lt => lt.code !== lt.code.toLowerCase());
    if (hasWrongFormat) {
      log('    ⚠️  Some leave types have uppercase codes (ledger uses lowercase)', 'yellow');
      for (const lt of allLeaveTypes) {
        if (lt.code !== lt.code.toLowerCase()) {
          log(`       - ${lt.code} (${lt.name})`, 'cyan');
        }
      }
    } else {
      log('    ✅ All leave types use lowercase codes', 'green');
    }
    console.log('');

    // Issue 3: Empty leaveLedger collection
    if (ledgerCount === 0) {
      log('  Issue: Empty leaveLedger collection', 'yellow');
      log('    ⚠️  Ledger is empty. Summary relies on employee.leaveBalance.balances', 'yellow');
      log('    This means:', 'yellow');
      log('       - No transactions have been recorded', 'cyan');
      log('       - Opening balance entries haven\'t been created', 'cyan');
      log('       - The page may show limited information', 'cyan');
    } else {
      log('    ✅ Ledger has entries', 'green');
    }
    console.log('');

    // ============================================
    // 8. SUMMARY
    // ============================================
    logSection('8. SUMMARY & RECOMMENDATIONS');

    log('  System Status:', 'blue');
    log(`    - Employees: ${allEmployees.length}`, 'cyan');
    log(`    - Leave Types: ${allLeaveTypes.length}`, 'cyan');
    log(`    - Ledger Entries: ${ledgerCount}`, 'cyan');
    log(`    - Custom Policies: ${policyCount}`, 'cyan');
    console.log('');

    log('  Potential Issues:', 'blue');

    if (ledgerCount === 0) {
      log('    1. ⚠️  No ledger entries - balance history will show empty', 'yellow');
      log('       FIX: Run initialization script to create opening balances', 'yellow');
    }

    if (policyCount === 0) {
      log('    2. ℹ️  No custom policies - all employees use default quotas', 'yellow');
    }

    const empWithoutBalances = allEmployees.filter(e => !e.leaveBalance?.balances || e.leaveBalance.balances.length === 0);
    if (empWithoutBalances.length > 0) {
      log(`    3. ❌ ${empWithoutBalances.length} employees have no leave balances`, 'red');
    }

    console.log('');
    log('  ✅ Diagnostic complete!', 'green');

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await client.close();
  }
}

diagnoseLeaveLedger();
