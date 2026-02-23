/**
 * Update custom policy with valid employee ID
 */

import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const DB_NAME = '6982468548550225cc5585a9';

async function updatePolicy() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(DB_NAME);
    const employees = db.collection('employees');
    const policies = db.collection('custom_leave_policies');

    // Find Sudhakar M with EMP-7884
    const employee = await employees.findOne({ employeeId: 'EMP-7884' });

    if (!employee) {
      console.log('❌ Employee EMP-7884 not found!');
      return;
    }

    console.log('=== FOUND EMPLOYEE ===');
    console.log(`Name: ${employee.firstName} ${employee.lastName}`);
    console.log(`Employee ID: ${employee.employeeId}`);
    console.log(`MongoDB _id: ${employee._id}`);
    console.log('');

    // Get the custom policy
    const policy = await policies.findOne({ leaveType: 'earned' });

    if (!policy) {
      console.log('❌ Custom policy not found!');
      return;
    }

    console.log('=== CURRENT POLICY ===');
    console.log(`Name: ${policy.name}`);
    console.log(`Leave Type: ${policy.leaveType}`);
    console.log(`Days: ${policy.days}`);
    console.log(`Current Employee IDs: ${policy.employeeIds.join(', ')}`);
    console.log('');

    // Update policy with valid employee ID
    const validEmployeeId = employee.employeeId; // Use employeeId string "EMP-7884"

    await policies.updateOne(
      { _id: policy._id },
      {
        $set: {
          employeeIds: [validEmployeeId],
          updatedAt: new Date()
        }
      }
    );

    console.log('=== POLICY UPDATED ===');
    console.log(`Updated employeeIds to: [${validEmployeeId}]`);
    console.log('');
    console.log('Now the employee can see the custom policy in their Leave Balance History!');

    // Verify the update
    const updatedPolicy = await policies.findOne({ _id: policy._id });
    console.log('\n=== VERIFIED POLICY ===');
    console.log(`Employee IDs: ${updatedPolicy.employeeIds.join(', ')}`);

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

updatePolicy();
