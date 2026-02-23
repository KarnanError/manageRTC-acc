/**
 * Check the policy collection for custom leave policies
 */

import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const DB_NAME = '698195cc0afbe3284fd5aa60';
const TEST_EMPLOYEE_ID = 'EMP-9251';

async function checkPolicyCollection() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(DB_NAME);
    const policies = await db.collection('policy').find({}).toArray();

    console.log(`=== POLICY COLLECTION (${policies.length} documents) ===\n`);

    policies.forEach(policy => {
      console.log(`Policy ID: ${policy._id}`);
      console.log(`Name: ${policy.policyName || policy.name || 'Unnamed'}`);
      console.log(`Type: ${policy.policyType || policy.type || 'N/A'}`);
      console.log(`Description: ${policy.description || 'N/A'}`);
      console.log(`Full Data:`, JSON.stringify(policy, null, 2));
      console.log('---\n');
    });

    // Check if any policy is related to custom leave policies
    const customPolicies = policies.filter(p =>
      p.policyType?.toLowerCase().includes('leave') ||
      p.name?.toLowerCase().includes('leave') ||
      p.description?.toLowerCase().includes('leave')
    );

    if (customPolicies.length > 0) {
      console.log('=== LEAVE-RELATED POLICIES ===\n');
      customPolicies.forEach(p => {
        console.log(`- ${p.policyName || p.name}`);
      });
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkPolicyCollection();
