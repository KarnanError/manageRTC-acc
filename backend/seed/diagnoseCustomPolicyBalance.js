/**
 * Diagnostic Script: Verify Custom Policy Integration in Leave Balance
 *
 * This script checks:
 * 1. All custom policies in the company
 * 2. Leave types from company database
 * 3. Employees with custom policies
 * 4. Balance summary calculation with custom policies
 */

import { MongoClient, ObjectId } from 'mongodb';

const COMPANY_DB_URI = 'mongodb://localhost:27017';
const COMPANY_ID = '6982468548550225cc5585a9'; // amasQIS.ai company ID

async function diagnose() {
  const client = new MongoClient(COMPANY_DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('company_6982468548550225cc5585a9');
    const customLeavePolicies = db.collection('customleavepolicies');
    const leaveTypes = db.collection('leavetypes');
    const employees = db.collection('employees');
    const leaveLedger = db.collection('leaveledger');

    // 1. Check all custom policies in the company
    console.log('=== 1. ALL CUSTOM POLICIES IN COMPANY ===');
    const allCustomPolicies = await customLeavePolicies.find({
      companyId: COMPANY_ID,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`Found ${allCustomPolicies.length} active custom policies:\n`);

    if (allCustomPolicies.length === 0) {
      console.log('❌ No custom policies found in this company!');
      console.log('   Create a custom policy first via Leave Settings page.\n');
    }

    for (const policy of allCustomPolicies) {
      console.log(`📋 Policy: ${policy.name || 'Unnamed'}`);
      console.log(`   - ID: ${policy._id}`);
      console.log(`   - Leave Type: ${policy.leaveType}`);
      console.log(`   - Days: ${policy.days}`);
      console.log(`   - Employees (${policy.employeeIds?.length || 0}):`);
      if (policy.employeeIds && policy.employeeIds.length > 0) {
        policy.employeeIds.forEach(empId => {
          console.log(`      • ${empId}`);
        });
      } else {
        console.log(`      (No employees assigned)`);
      }
      console.log(`   - Description: ${policy.description || 'N/A'}`);
      console.log(`   - Created: ${new Date(policy.createdAt).toLocaleString()}`);
      console.log('');
    }

    // 2. Check leave types from database
    console.log('=== 2. LEAVE TYPES IN COMPANY ===');
    const activeLeaveTypes = await leaveTypes.find({
      companyId: COMPANY_ID,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`Found ${activeLeaveTypes.length} active leave types:\n`);
    activeLeaveTypes.forEach(lt => {
      console.log(`   - ${lt.name} (${lt.code}): ${lt.annualQuota} days (paid: ${lt.isPaid})`);
    });

    if (activeLeaveTypes.length === 0) {
      console.log('   ❌ No leave types found! Run seedLeaveTypes.js to create default leave types.\n');
    }

    // 3. Get all employees who have custom policies
    console.log('\n=== 3. EMPLOYEES WITH CUSTOM POLICIES ===');
    const allEmployeesWithCustomPolicy = new Set();

    for (const policy of allCustomPolicies) {
      if (policy.employeeIds) {
        policy.employeeIds.forEach(empId => allEmployeesWithCustomPolicy.add(empId));
      }
    }

    console.log(`Found ${allEmployeesWithCustomPolicy.size} unique employees with custom policies:\n`);

    if (allEmployeesWithCustomPolicy.size === 0) {
      console.log('   ❌ No employees have custom policies assigned.\n');
    }

    // 4. For each employee with custom policy, calculate expected balance
    console.log('\n=== 4. EXPECTED LEAVE BALANCE DISPLAY FOR EACH EMPLOYEE ===\n');

    for (const employeeId of allEmployeesWithCustomPolicy) {
      const employee = await employees.findOne({
        employeeId: employeeId,
        isDeleted: { $ne: true }
      });

      if (!employee) {
        console.log(`⚠️  Employee ${employeeId} not found in database!`);
        continue;
      }

      console.log(`👤 ${employee.firstName} ${employee.lastName} (${employeeId})`);
      console.log(`   Email: ${employee.email}`);

      // Get custom policies for this specific employee
      const employeeCustomPolicies = allCustomPolicies.filter(policy =>
        policy.employeeIds && policy.employeeIds.includes(employeeId)
      );

      const customPolicyDaysMap = {};
      employeeCustomPolicies.forEach(policy => {
        if (policy.leaveType && policy.days !== undefined) {
          customPolicyDaysMap[policy.leaveType] = policy.days;
        }
      });

      console.log(`   Custom Policies: ${Object.keys(customPolicyDaysMap).length} leave types`);

      // Build leave type details map
      const leaveTypeDetailsMap = {};
      activeLeaveTypes.forEach(lt => {
        leaveTypeDetailsMap[lt.code.toLowerCase()] = {
          name: lt.name,
          code: lt.code.toLowerCase(),
          annualQuota: lt.annualQuota || 0,
          isPaid: lt.isPaid,
          color: lt.color
        };
      });

      console.log('\n   Expected Leave Balance Display:');
      console.log('   ────────────────────────────────────────────');

      for (const [leaveType, leaveTypeDetails] of Object.entries(leaveTypeDetailsMap)) {
        const latestEntry = await leaveLedger.findOne({
          companyId: COMPANY_ID,
          employeeId: employeeId,
          leaveType: leaveType,
          isDeleted: { $ne: true }
        }, { sort: { transactionDate: -1 } });

        const employeeBalance = employee?.leaveBalance?.balances?.find(b => b.type === leaveType);

        // Check if there's a custom policy for this leave type
        const hasCustomPolicy = customPolicyDaysMap[leaveType] !== undefined;
        const customDays = customPolicyDaysMap[leaveType];

        // Use custom policy days if available, otherwise use company's annualQuota
        const defaultQuota = leaveTypeDetails?.annualQuota || 0;
        const total = hasCustomPolicy ? customDays : (employeeBalance?.total || defaultQuota);
        const balance = hasCustomPolicy ? customDays : (employeeBalance?.balance || defaultQuota);

        const customIndicator = hasCustomPolicy ? ' 🎯 CUSTOM' : '';
        console.log(`   ${leaveTypeDetails.name.padEnd(25)}: ${balance} / ${total}${customIndicator}`);

        if (hasCustomPolicy) {
          console.log(`      (Default: ${defaultQuota}, Custom: ${customDays})`);
        }
      }
      console.log('');
    }

    console.log('✅ Diagnosis complete!');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await client.close();
  }
}

diagnose();
