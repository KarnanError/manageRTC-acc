/**
 * Initialize Leave Ledger for All Employees
 * Creates opening balance entries for all employees
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9'; // amasQIS.ai

async function initializeLeaveLedger() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(COMPANY_ID);

    // Get leave types
    const leaveTypes = await db.collection('leaveTypes').find({
      companyId: COMPANY_ID,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`Found ${leaveTypes.length} leave types`);

    // Get all employees
    const employees = await db.collection('employees').find({
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`Found ${employees.length} employees\n`);

    // Get custom policies
    const customPolicies = await db.collection('custom_leave_policies').find({
      companyId: COMPANY_ID,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    // Create map of employeeId -> custom policies
    const customPolicyMap = {};
    for (const policy of customPolicies) {
      if (policy.employeeIds) {
        for (const empId of policy.employeeIds) {
          if (!customPolicyMap[empId]) {
            customPolicyMap[empId] = {};
          }
          customPolicyMap[empId][policy.leaveType] = policy.days;
        }
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const financialYear = `FY${year}-${year + 1}`;

    let totalEntries = 0;
    let updatedEmployees = 0;

    // For each employee, create ledger entries and update employee balances
    for (const employee of employees) {
      const employeeId = employee.employeeId;

      console.log(`Processing ${employeeId} (${employee.firstName} ${employee.lastName})...`);

      // Initialize employee leave balance if not exists
      if (!employee.leaveBalance) {
        employee.leaveBalance = { balances: [] };
      }

      // Clear existing balances and rebuild
      employee.leaveBalance.balances = [];

      const entries = [];

      // Create opening balance for each leave type
      for (const lt of leaveTypes) {
        const leaveType = lt.code.toLowerCase(); // Ledger uses lowercase
        const leaveTypeName = lt.name;
        const annualQuota = lt.annualQuota || 0;

        // Check if employee has custom policy for this leave type
        const customDays = customPolicyMap[employeeId]?.[leaveType];
        const openingBalance = customDays !== undefined ? customDays : annualQuota;

        // Create ledger entry
        const entry = {
          employeeId,
          companyId: COMPANY_ID,
          leaveType,
          transactionType: 'opening',
          amount: 0,
          balanceBefore: 0,
          balanceAfter: openingBalance,
          transactionDate: new Date(year, month - 1, 1),
          financialYear,
          year,
          month,
          description: `Opening balance - ${leaveTypeName}`,
          isDeleted: false,
          createdAt: now,
          updatedAt: now
        };
        entries.push(entry);

        // Update employee balance
        employee.leaveBalance.balances.push({
          type: leaveType,
          total: openingBalance,
          used: 0,
          balance: openingBalance
        });

        console.log(`  - ${leaveTypeName}: ${openingBalance} days${customDays ? ' (custom policy)' : ''}`);
      }

      // Insert ledger entries
      if (entries.length > 0) {
        await db.collection('leaveLedger').insertMany(entries);
        totalEntries += entries.length;
      }

      // Update employee document
      await db.collection('employees').updateOne(
        { employeeId },
        {
          $set: {
            leaveBalance: employee.leaveBalance,
            updatedAt: now
          }
        }
      );

      updatedEmployees++;
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ Initialization complete!');
    console.log(`   - Employees updated: ${updatedEmployees}`);
    console.log(`   - Ledger entries created: ${totalEntries}`);
    console.log('='.repeat(60));

    // Verify
    const ledgerCount = await db.collection('leaveLedger').countDocuments({ companyId: COMPANY_ID });
    console.log(`\n📊 Total ledger entries in database: ${ledgerCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

initializeLeaveLedger();
