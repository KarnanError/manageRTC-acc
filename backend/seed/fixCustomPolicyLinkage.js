/**
 * Fix Custom Policy: Move from AmasQIS to Company Database and Fix Employee Linkage
 * Run: node backend/seed/fixCustomPolicyLinkage.js
 */

import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

async function fixCustomPolicyLinkage() {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const amasQIS = client.db('AmasQIS');

    console.log('============================================');
    console.log('FIXING CUSTOM POLICY LINKAGE');
    console.log('============================================\n');

    // Step 1: Find Anu Arun first to get the company database
    console.log('STEP 1: Finding Anu Arun to get company database...');
    const employeeIdInPolicy = '6982c7cca0ceeb38da48ba58'; // From the custom policy

    let anuEmployee = null;
    let companyDb = null;
    let companyId = null;

    // Get list of databases
    const adminDb = client.db('admin');
    const databases = await adminDb.admin().listDatabases();
    const dbNames = databases.databases.map(d => d.name).filter(n => n.match(/^[0-9a-f]{24}$/i));

    for (const dbName of dbNames) {
      const db = client.db(dbName);
      const colls = await db.listCollections().toArray();

      if (colls.some(c => c.name === 'employees')) {
        const employee = await db.collection('employees').findOne({
          _id: new ObjectId(employeeIdInPolicy)
        });

        if (employee) {
          anuEmployee = employee;
          companyDb = db;
          companyId = dbName;
          break;
        }
      }
    }

    if (!anuEmployee) {
      console.log('❌ Anu Arun not found!');
      return;
    }

    console.log('✅ Found Anu Arun:');
    console.log('   - Company DB:', companyId);
    console.log('   - employeeId:', anuEmployee.employeeId);
    console.log('   - _id:', anuEmployee._id?.toString());
    console.log('   - firstName:', anuEmployee.firstName);
    console.log('   - lastName:', anuEmployee.lastName);
    console.log('');

    // Step 2: Get Annual Leave type from company database
    console.log('STEP 2: Getting Annual Leave type from company database...');
    const earnedLeaveType = await companyDb.collection('leaveTypes').findOne({
      code: 'EARNED',
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (!earnedLeaveType) {
      console.log('❌ Annual Leave type not found!');
      return;
    }

    console.log('✅ Found Annual Leave type:');
    console.log('   - _id:', earnedLeaveType._id?.toString());
    console.log('   - code:', earnedLeaveType.code);
    console.log('   - name:', earnedLeaveType.name);
    console.log('   - annualQuota:', earnedLeaveType.annualQuota);
    console.log('');

    // Step 3: Get the custom policy from AmasQIS
    console.log('STEP 3: Getting custom policy from AmasQIS...');
    const customPolicy = await amasQIS.collection('custom_leave_policies').findOne({
      name: 'For HR Only'
    });

    if (!customPolicy) {
      console.log('❌ Custom policy not found!');
      return;
    }

    console.log('✅ Found custom policy:');
    console.log('   - _id:', customPolicy._id?.toString());
    console.log('   - name:', customPolicy.name);
    console.log('   - leaveTypeId:', customPolicy.leaveTypeId?.toString() || 'UNDEFINED');
    console.log('   - annualQuota:', customPolicy.annualQuota || customPolicy.days);
    console.log('   - employeeIds:', customPolicy.employeeIds);
    console.log('');

    // Step 4: Check if company DB has custom_leave_policies collection
    console.log('STEP 4: Setting up custom_leave_policies in company database...');
    const companyColls = await companyDb.listCollections().toArray();
    const hasCustomPolicies = companyColls.some(c => c.name === 'custom_leave_policies');

    if (!hasCustomPolicies) {
      console.log('   → Creating custom_leave_policies collection in company database');
      await companyDb.createCollection('custom_leave_policies');
    } else {
      console.log('   → custom_leave_policies collection exists');
    }
    console.log('');

    // Step 5: Check if policy exists in company DB
    console.log('STEP 5: Checking for existing policy in company database...');
    const existingPolicy = await companyDb.collection('custom_leave_policies').findOne({
      name: 'For HR Only'
    });

    // Step 6: Create or update policy in company database
    console.log('STEP 6: Creating/updating policy in company database...');

    const policyData = {
      name: customPolicy.name,
      leaveTypeId: earnedLeaveType._id, // Use the correct leaveTypeId from company DB
      annualQuota: customPolicy.annualQuota || customPolicy.days,
      employeeIds: [anuEmployee.employeeId], // Use employeeId string (EMP-2865) instead of ObjectId
      settings: customPolicy.settings || {},
      isActive: true,
      isDeleted: false,
      createdAt: customPolicy.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (existingPolicy) {
      console.log('   → Policy exists, updating...');
      await companyDb.collection('custom_leave_policies').updateOne(
        { _id: existingPolicy._id },
        { $set: { ...policyData, updatedBy: customPolicy.updatedBy } }
      );
    } else {
      console.log('   → Inserting new policy...');
      await companyDb.collection('custom_leave_policies').insertOne(policyData);
    }
    console.log('');

    // Step 7: Verify the fix
    console.log('STEP 7: Verifying the fix...');
    console.log('   Looking for policy with:');
    console.log('     - leaveTypeId:', earnedLeaveType._id?.toString());
    console.log('     - employeeIds:', anuEmployee.employeeId);

    const verifyPolicy = await companyDb.collection('custom_leave_policies').findOne({
      leaveTypeId: earnedLeaveType._id,
      employeeIds: anuEmployee.employeeId,
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (verifyPolicy) {
      console.log('\n✅✅✅ MATCHING POLICY FOUND!');
      console.log('   - name:', verifyPolicy.name);
      console.log('   - leaveTypeId:', verifyPolicy.leaveTypeId?.toString());
      console.log('   - annualQuota:', verifyPolicy.annualQuota);
      console.log('   - employeeIds:', verifyPolicy.employeeIds);
      console.log('\n   Anu Arun should now see 20 days instead of 15!');
    } else {
      console.log('\n❌ Still not matching - this should not happen!');
    }

    // Step 8: Test backend getEmployeePolicy lookup simulation
    console.log('\nSTEP 8: Testing backend getEmployeePolicy simulation...');

    // This simulates what the backend does:
    // 1. Find leaveTypes where code = leaveType (EARNED)
    const matchingLeaveTypes = await companyDb.collection('leaveTypes').find({
      code: 'EARNED',
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    console.log('   - Matching leaveTypes found:', matchingLeaveTypes.length);
    if (matchingLeaveTypes.length > 0) {
      console.log('   - Using leaveTypeId:', matchingLeaveTypes[0]._id?.toString());

      // 2. Find policy with leaveTypeId and employeeIds
      const finalPolicy = await companyDb.collection('custom_leave_policies').findOne({
        leaveTypeId: matchingLeaveTypes[0]._id,
        employeeIds: anuEmployee.employeeId,
        isActive: true,
        isDeleted: { $ne: true }
      });

      if (finalPolicy) {
        console.log('   ✅ Policy found via getEmployeePolicy simulation!');
        console.log('     - name:', finalPolicy.name);
        console.log('     - annualQuota:', finalPolicy.annualQuota);
      }
    }

    console.log('\n============================================');
    console.log('SUMMARY');
    console.log('============================================');
    console.log('Company Database:', companyId);
    console.log('Employee:', anuEmployee.employeeId);
    console.log('');
    console.log('Fixes Applied:');
    console.log('  1. ✅ Created policy in company database');
    console.log('  2. ✅ Set correct leaveTypeId:', earnedLeaveType._id?.toString());
    console.log('  3. ✅ Set employeeIds to employeeId string:', anuEmployee.employeeId);
    console.log('');
    console.log('Expected Result:');
    console.log('  - Anu Arun should see 20 days (custom policy)');
    console.log('  - Instead of 15 days (default)');
    console.log('');
    console.log('Note: Please restart the backend server to ensure changes take effect.');

  } finally {
    await client.close();
  }
}

fixCustomPolicyLinkage().catch(console.error);
