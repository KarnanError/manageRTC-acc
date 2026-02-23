/**
 * Diagnostic Script: Check Custom Policy Linkage on MongoDB Atlas
 * Run: node backend/seed/diagnoseAnuCustomPolicy.js
 */

import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

async function diagnoseAnuCustomPolicy() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('AmasQIS');

    console.log('============================================');
    console.log('CHECKING CUSTOM POLICY LINKAGE');
    console.log('Database: AmasQIS (MongoDB Atlas)');
    console.log('============================================\n');

    // Step 1: Find Anu Arun
    console.log('STEP 1: Finding Anu Arun employee...');
    const employee = await db.collection('employees').findOne({
      $or: [
        { firstName: { $regex: 'anu', $options: 'i' } },
        { lastName: { $regex: 'arun', $options: 'i' } },
        { email: { $regex: 'anu', $options: 'i' } }
      ],
      isDeleted: { $ne: true }
    });

    if (!employee) {
      console.log('❌ Employee NOT found!');
      // List all employees to help debug
      const allEmployees = await db.collection('employees').find({
        isDeleted: { $ne: true }
      }).project({ firstName: 1, lastName: 1, email: 1, employeeId: 1 }).limit(20).toArray();

      console.log('\nAll employees (first 20):');
      allEmployees.forEach(emp => {
        console.log(`  - ${emp.firstName || 'N/A'} ${emp.lastName || 'N/A'} (${emp.email || 'N/A'}) - ${emp.employeeId || 'N/A'}`);
      });
      return;
    }

    console.log('✅ Employee Found:');
    console.log('   - employeeId:', employee.employeeId);
    console.log('   - _id:', employee._id?.toString());
    console.log('   - firstName:', employee.firstName);
    console.log('   - lastName:', employee.lastName);
    console.log('   - email:', employee.email);
    console.log('   - clerkUserId:', employee.clerkUserId || 'N/A');
    console.log('');

    // Step 2: Check leave balance
    console.log('STEP 2: Checking current leave balance...');
    if (employee.leaveBalance?.balances) {
      const earnedBalance = employee.leaveBalance.balances.find(b => b.type === 'earned');
      console.log('✅ Current earned (Annual Leave) balance:');
      console.log('   - total:', earnedBalance?.total);
      console.log('   - used:', earnedBalance?.used);
      console.log('   - balance:', earnedBalance?.balance);
      console.log('');
    } else {
      console.log('❌ No leave balance found!');
      console.log('');
    }

    // Step 3: Check leave types
    console.log('STEP 3: Getting Annual Leave type...');
    const earnedLeaveType = await db.collection('leaveTypes').findOne({
      code: 'EARNED',
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (earnedLeaveType) {
      console.log('✅ Annual Leave type found:');
      console.log('   - _id:', earnedLeaveType._id?.toString());
      console.log('   - code:', earnedLeaveType.code);
      console.log('   - name:', earnedLeaveType.name);
      console.log('   - annualQuota:', earnedLeaveType.annualQuota);
      console.log('');
    } else {
      console.log('❌ Annual Leave type NOT found!');
      console.log('');
    }

    // Step 4: Check custom policies
    console.log('STEP 4: Checking custom_leave_policies...');
    const allCustomPolicies = await db.collection('custom_leave_policies').find({
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`✅ Found ${allCustomPolicies.length} active custom policies:\n`);

    for (const policy of allCustomPolicies) {
      const leaveType = await db.collection('leaveTypes').findOne({ _id: policy.leaveTypeId });

      console.log(`   Policy: ${policy.name}`);
      console.log('   - _id:', policy._id?.toString());
      console.log('   - leaveType:', leaveType?.name || 'N/A', `(${leaveType?.code || 'N/A'})`);
      console.log('   - leaveTypeId:', policy.leaveTypeId?.toString());
      console.log('   - annualQuota:', policy.annualQuota || policy.days);
      console.log('   - employeeIds:', JSON.stringify(policy.employeeIds));

      // Check if Anu is in this policy
      const isAnuInPolicy = policy.employeeIds?.some(id => {
        return id === employee.employeeId ||
               id === employee._id?.toString() ||
               id === employee.clerkUserId;
      });

      console.log('   - Anu Arun in policy?', isAnuInPolicy ? '✅ YES' : '❌ NO');

      if (isAnuInPolicy) {
        console.log('   → MATCHING ID:', policy.employeeIds.find(id => {
          return id === employee.employeeId ||
                 id === employee._id?.toString() ||
                 id === employee.clerkUserId;
        }));
      }
      console.log('');
    }

    // Step 5: Simulate backend lookup
    if (earnedLeaveType) {
      console.log('STEP 5: Simulating backend getEmployeePolicy lookup...');
      console.log('   Query: {');
      console.log('     leaveTypeId:', earnedLeaveType._id?.toString());
      console.log('     employeeIds:', employee.employeeId);
      console.log('     isActive: true');
      console.log('   }');

      const matchingPolicy = await db.collection('custom_leave_policies').findOne({
        leaveTypeId: earnedLeaveType._id,
        employeeIds: employee.employeeId,
        isActive: true,
        isDeleted: { $ne: true }
      });

      if (matchingPolicy) {
        console.log('\n✅ MATCHING POLICY FOUND!');
        console.log('   - name:', matchingPolicy.name);
        console.log('   - annualQuota:', matchingPolicy.annualQuota || matchingPolicy.days);
      } else {
        console.log('\n❌ NO MATCHING POLICY FOUND!');
        console.log('   → This is why the default 15 days is shown!');
        console.log('\n   TROUBLESHOOTING:');
        console.log('   The employeeId in the policy must match exactly:', employee.employeeId);

        // Try alternative lookups
        console.log('\n   Trying alternative lookups:');

        const byObjectId = await db.collection('custom_leave_policies').findOne({
          leaveTypeId: earnedLeaveType._id,
          employeeIds: employee._id?.toString(),
          isActive: true,
          isDeleted: { $ne: true }
        });
        if (byObjectId) {
          console.log('   ✅ Found by employee._id (ObjectId)!');
        }

        const byClerkUserId = await db.collection('custom_leave_policies').findOne({
          leaveTypeId: earnedLeaveType._id,
          employeeIds: employee.clerkUserId,
          isActive: true,
          isDeleted: { $ne: true }
        });
        if (byClerkUserId) {
          console.log('   ✅ Found by clerkUserId!');
        }
      }
    }

    // Step 6: Summary
    console.log('\n============================================');
    console.log('SUMMARY');
    console.log('============================================');
    console.log('Anu Arun:');
    console.log('  - employeeId:', employee.employeeId);
    console.log('  - _id (ObjectId):', employee._id?.toString());
    console.log('  - clerkUserId:', employee.clerkUserId || 'N/A');
    console.log('  - Current total:', employee.leaveBalance?.balances?.find(b => b.type === 'earned')?.total || 'N/A');
    console.log('');
    console.log('Fix:');
    console.log('  The custom policy employeeIds array must contain one of:');
    console.log('  - employeeId:', employee.employeeId);
    console.log('  - _id (ObjectId):', employee._id?.toString());
    console.log('  - clerkUserId:', employee.clerkUserId || 'N/A');

  } finally {
    await client.close();
  }
}

diagnoseAnuCustomPolicy().catch(console.error);
