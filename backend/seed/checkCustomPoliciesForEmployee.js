/**
 * Check for custom policies in the database where employee EMP-9251 exists
 */

import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

// Database with employee EMP-9251
const DB_NAME = '698195cc0afbe3284fd5aa60';
const TEST_EMPLOYEE_ID = 'EMP-9251';

async function checkCustomPolicies() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(DB_NAME);

    // Check for customleavepolicies collection
    const collections = await db.listCollections().toArray();
    const hasCustomPolicies = collections.some(c => c.name === 'customleavepolicies');

    console.log(`=== DATABASE: ${DB_NAME} ===`);
    console.log(`Collections: ${collections.length}`);
    console.log(`Has customleavepolicies: ${hasCustomPolicies ? 'YES' : 'NO'}`);
    console.log('');

    if (hasCustomPolicies) {
      const customPolicies = await db.collection('customleavepolicies').find({}).toArray();
      console.log(`Found ${customPolicies.length} custom policies:\n`);

      customPolicies.forEach(policy => {
        console.log(`📋 Policy: ${policy.name || 'Unnamed'}`);
        console.log(`   - ID: ${policy._id}`);
        console.log(`   - Leave Type: ${policy.leaveType}`);
        console.log(`   - Days: ${policy.days}`);
        console.log(`   - Active: ${policy.isActive}`);
        console.log(`   - Employees (${policy.employeeIds?.length || 0}):`);
        if (policy.employeeIds && policy.employeeIds.length > 0) {
          policy.employeeIds.forEach(empId => {
            const isTestEmployee = empId === TEST_EMPLOYEE_ID ? ' ⭐ TEST EMPLOYEE!' : '';
            console.log(`      • ${empId}${isTestEmployee}`);
          });
        } else {
          console.log(`      (No employees assigned)`);
        }
        console.log('');
      });

      // Check if test employee has custom policy
      const testEmployeePolicies = customPolicies.filter(p =>
        p.employeeIds && p.employeeIds.includes(TEST_EMPLOYEE_ID)
      );

      console.log('=== CUSTOM POLICIES FOR EMPLOYEE EMP-9251 ===');
      if (testEmployeePolicies.length > 0) {
        console.log(`Found ${testEmployeePolicies.length} custom policies:\n`);
        testEmployeePolicies.forEach(policy => {
          console.log(`   - ${policy.leaveType}: ${policy.days} days (${policy.name || 'Unnamed'})`);
        });
      } else {
        console.log('   ❌ No custom policies found for this employee.');
      }
    } else {
      console.log('❌ No customleavepolicies collection found in this database!');
    }

    // Get employee details
    console.log('\n=== EMPLOYEE DETAILS ===');
    const employee = await db.collection('employees').findOne({
      employeeId: TEST_EMPLOYEE_ID
    });

    if (employee) {
      console.log(`Name: ${employee.firstName} ${employee.lastName}`);
      console.log(`Employee ID: ${employee.employeeId}`);
      console.log(`Email: ${employee.email}`);

      if (employee.leaveBalance?.balances) {
        console.log('\nLeave Balances:');
        employee.leaveBalance.balances.forEach(b => {
          console.log(`   ${b.type}: total=${b.total}, used=${b.used}, balance=${b.balance}`);
        });
      }
    } else {
      console.log(`❌ Employee ${TEST_EMPLOYEE_ID} not found!`);
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkCustomPolicies();
