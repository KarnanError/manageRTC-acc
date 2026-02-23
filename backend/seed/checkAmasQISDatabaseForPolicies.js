/**
 * Check if custom policies were saved in the wrong database
 */

import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const DEFAULT_DB = 'AmasQIS';

async function checkWrongDatabase() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(DEFAULT_DB);

    // Check for custom_leave_policies collection
    const collections = await db.listCollections().toArray();
    const hasCustomPolicies = collections.some(c => c.name === 'custom_leave_policies');

    console.log(`=== DATABASE: ${DEFAULT_DB} (Default Mongoose DB) ===`);
    console.log(`Collections: ${collections.length}`);
    console.log(`Has custom_leave_policies: ${hasCustomPolicies ? 'YES' : 'NO'}`);
    console.log('');

    if (hasCustomPolicies) {
      const customPolicies = await db.collection('custom_leave_policies').find({}).toArray();
      console.log(`Found ${customPolicies.length} custom policies:\n`);

      customPolicies.forEach(policy => {
        console.log(`📋 Policy: ${policy.name || 'Unnamed'}`);
        console.log(`   - ID: ${policy._id}`);
        console.log(`   - Company ID: ${policy.companyId}`);
        console.log(`   - Leave Type: "${policy.leaveType}"`);
        console.log(`   - Days: ${policy.days}`);
        console.log(`   - Employees (${policy.employeeIds?.length || 0}):`);
        if (policy.employeeIds && policy.employeeIds.length > 0) {
          policy.employeeIds.forEach(empId => {
            console.log(`      • ${empId}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('❌ No custom_leave_policies collection found here either.');
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkWrongDatabase();
