/**
 * Diagnose exactly why leave balance shows 0 for Anu Arun (EMP-2865)
 */
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9';
const EMPLOYEE_ID = 'EMP-2865';

async function diagnose() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(COMPANY_ID);

    console.log('=== 1. EMPLOYEE RECORD ===');
    const emp = await db.collection('employees').findOne({ employeeId: EMPLOYEE_ID });
    if (!emp) { console.log('❌ Employee not found!'); return; }
    console.log('employeeId:', emp.employeeId);
    console.log('name:', emp.firstName, emp.lastName);
    console.log('clerkUserId:', emp.clerkUserId);
    console.log('leaveBalance exists:', !!emp.leaveBalance);
    console.log('leaveBalance.balances exists:', !!emp.leaveBalance?.balances);
    if (emp.leaveBalance?.balances) {
      console.log('leaveBalance.balances (earned type):');
      const earned = emp.leaveBalance.balances.find(b => b.type === 'earned');
      console.log(JSON.stringify(earned, null, 2));
      console.log('All balance types:', emp.leaveBalance.balances.map(b => b.type));
    } else {
      console.log('❌ No leaveBalance.balances found - this is a root cause!');
    }

    console.log('\n=== 2. LEAVE TYPES ===');
    const leaveTypes = await db.collection('leaveTypes').find({
      code: 'EARNED', isActive: true, isDeleted: { $ne: true }
    }).toArray();
    console.log(`Found ${leaveTypes.length} EARNED leaveTypes:`);
    leaveTypes.forEach(lt => {
      console.log(`  _id: ${lt._id}, code: ${lt.code}, name: ${lt.name}, annualQuota: ${lt.annualQuota}`);
    });

    console.log('\n=== 3. CUSTOM POLICIES FOR EMP-2865 ===');
    const policies = await db.collection('custom_leave_policies').find({
      employeeIds: EMPLOYEE_ID,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();
    console.log(`Found ${policies.length} custom policies:`);
    policies.forEach(p => {
      console.log('  Policy:', JSON.stringify({
        _id: p._id?.toString(),
        name: p.name,
        leaveTypeId: p.leaveTypeId?.toString(),
        annualQuota: p.annualQuota,
        days: p.days,       // check if days field exists
        employeeIds: p.employeeIds,
        isActive: p.isActive
      }, null, 2));
    });

    console.log('\n=== 4. ALL CUSTOM POLICIES IN COMPANY ===');
    const allPolicies = await db.collection('custom_leave_policies').find({}).toArray();
    console.log(`Total policies: ${allPolicies.length}`);
    allPolicies.forEach(p => {
      console.log(`  name: ${p.name}, employeeIds: ${JSON.stringify(p.employeeIds)}, annualQuota: ${p.annualQuota}, days: ${p.days}, isActive: ${p.isActive}, isDeleted: ${p.isDeleted}`);
    });

  } finally {
    await client.close();
  }
}
diagnose().catch(console.error);
