/**
 * Test Balance API Endpoint
 * Tests the /api/leaves/balance endpoint to see what it returns
 */

import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

async function testBalanceApi() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const companyDb = client.db('6982468548550225cc5585a9'); // Anu Arun's company database

    console.log('============================================');
    console.log('TESTING BALANCE API DATA');
    console.log('============================================\n');

    // Get Anu Arun's employee record
    const anu = await companyDb.collection('employees').findOne({
      employeeId: 'EMP-2865'
    });

    if (!anu) {
      console.log('❌ Employee EMP-2865 not found!');
      return;
    }

    console.log('✅ Employee Found:');
    console.log('   - employeeId:', anu.employeeId);
    console.log('   - _id:', anu._id?.toString());
    console.log('   - firstName:', anu.firstName);
    console.log('   - lastName:', anu.lastName);
    console.log('   - clerkUserId:', anu.clerkUserId || 'NOT SET');
    console.log('   - userId:', anu.userId || 'NOT SET');
    console.log('');

    // Check leave balance
    console.log('STEP 1: Checking leaveBalance in employee record...');
    if (anu.leaveBalance?.balances) {
      const earnedBalance = anu.leaveBalance.balances.find(b => b.type === 'earned');
      console.log('✅ leaveBalance.balances exists:');
      console.log('   - earned:', earnedBalance);
    } else {
      console.log('❌ leaveBalance.balances does NOT exist!');
    }
    console.log('');

    // Check custom policy
    console.log('STEP 2: Checking custom policy in company database...');
    const earnedLeaveType = await companyDb.collection('leaveTypes').findOne({
      code: 'EARNED'
    });

    if (earnedLeaveType) {
      console.log('✅ Annual Leave type found: _id =', earnedLeaveType._id?.toString());

      const customPolicy = await companyDb.collection('custom_leave_policies').findOne({
        leaveTypeId: earnedLeaveType._id,
        employeeIds: 'EMP-2865',
        isActive: true,
        isDeleted: { $ne: true }
      });

      if (customPolicy) {
        console.log('✅ Custom policy found!');
        console.log('   - name:', customPolicy.name);
        console.log('   - annualQuota:', customPolicy.annualQuota);
      } else {
        console.log('❌ Custom policy NOT found!');
        console.log('   → Policy was created but may not be accessible');
        console.log('   → Checking all policies in database...');

        const allPolicies = await companyDb.collection('custom_leave_policies').find({}).toArray();
        console.log('   - Total policies:', allPolicies.length);
        allPolicies.forEach(p => {
          console.log('     -', p.name, 'leaveTypeId:', p.leaveTypeId?.toString(), 'employeeIds:', p.employeeIds);
        });
      }
    }
    console.log('');

    // Simulate backend getEmployeeLeaveBalance calculation
    console.log('STEP 3: Simulating backend calculation...');
    let totalDays = 15; // Default from leaveType
    let usedDays = 0;
    let hasCustomPolicy = false;
    let customPolicyName = '';

    // Check for custom policy
    if (earnedLeaveType && anu.leaveBalance?.balances) {
      const balanceInfo = anu.leaveBalance.balances.find(b => b.type === 'earned');

      if (balanceInfo) {
        // Check if custom policy exists
        const policy = await companyDb.collection('custom_leave_policies').findOne({
          leaveTypeId: earnedLeaveType._id,
          employeeIds: anu.employeeId,
          isActive: true,
          isDeleted: { $ne: true }
        });

        if (policy) {
          hasCustomPolicy = true;
          customPolicyName = policy.name;
          totalDays = policy.annualQuota || policy.days;
          usedDays = balanceInfo.used || 0;
        } else {
          totalDays = balanceInfo.total || earnedLeaveType.annualQuota || 15;
          usedDays = balanceInfo.used || 0;
        }
      }
    }

    const balanceDays = Math.max(0, totalDays - usedDays);

    console.log('✅ Calculated Balance:');
    console.log('   - total:', totalDays);
    console.log('   - used:', usedDays);
    console.log('   - balance:', balanceDays);
    console.log('   - hasCustomPolicy:', hasCustomPolicy);
    console.log('   - customPolicyName:', customPolicyName);

    console.log('\n============================================');
    console.log('API EXPECTED RESPONSE');
    console.log('============================================');
    console.log('GET /api/leaves/balance should return:');
    console.log(JSON.stringify({
      earned: {
        type: 'earned',
        balance: balanceDays,
        used: usedDays,
        total: totalDays,
        hasCustomPolicy,
        customPolicyName
      }
    }, null, 2));

  } finally {
    await client.close();
  }
}

testBalanceApi().catch(console.error);
