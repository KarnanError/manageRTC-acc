/**
 * Verify the balance calculation fix for EMP-2865 (Anu Arun)
 * Simulates what getEmployeeLeaveBalance() now does after the fix
 */
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9';
const EMPLOYEE_ID = 'EMP-2865';

async function verify() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(COMPANY_ID);

    // Step 1: Get employee
    const employee = await db.collection('employees').findOne({ employeeId: EMPLOYEE_ID });
    console.log('Employee found:', !!employee);
    console.log('Has leaveBalance.balances:', !!employee?.leaveBalance?.balances);

    // Step 2: Get custom policy for earned leave type
    const matchingLeaveTypes = await db.collection('leaveTypes').find({
      code: 'EARNED', isActive: true, isDeleted: { $ne: true }
    }).toArray();
    console.log('Matching leaveTypes for EARNED:', matchingLeaveTypes.length);

    const leaveTypeId = matchingLeaveTypes[0]?._id;
    const policy = await db.collection('custom_leave_policies').findOne({
      leaveTypeId,
      employeeIds: EMPLOYEE_ID,
      isActive: true,
      isDeleted: { $ne: true }
    });
    console.log('Custom policy found:', !!policy);
    console.log('Policy annualQuota:', policy?.annualQuota);
    console.log('Policy days:', policy?.days);

    // Step 3: Simulate the fixed calculation
    const balanceInfo = employee?.leaveBalance?.balances?.find(b => b.type === 'earned');
    let usedDays = balanceInfo?.used || 0;

    let totalDays, balanceDays;
    if (policy) {
      totalDays = policy.annualQuota ?? policy.days ?? 0;  // THE FIX
      balanceDays = Math.max(0, totalDays - usedDays);
    } else {
      totalDays = balanceInfo?.total || 0;
      balanceDays = balanceInfo?.balance || 0;
    }

    console.log('\n=== RESULT (after fix) ===');
    console.log({ type: 'earned', balance: balanceDays, used: usedDays, total: totalDays, hasCustomPolicy: !!policy });
    console.log('\nExpected: total=20, balance=20, used=0');
    console.log('Correct?', totalDays === 20 && balanceDays === 20 && usedDays === 0 ? '✅ YES' : '❌ NO');
  } finally {
    await client.close();
  }
}
verify().catch(console.error);
