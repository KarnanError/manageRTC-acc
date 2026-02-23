/**
 * Fix Custom Policy Employee ID
 * Changes invalid MongoDB _id to valid employeeId in custom policies
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9'; // amasQIS.ai

// Mapping of MongoDB _id to employeeId
const ID_MAPPING = {
  '6982c7cca0ceeb38da48ba58': 'EMP-7884', // Sudhakar M
};

async function fixCustomPolicies() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(COMPANY_ID);
    const customPolicies = db.collection('custom_leave_policies');

    // Get all policies
    const policies = await customPolicies.find({
      companyId: COMPANY_ID,
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`Found ${policies.length} custom policies\n`);

    let updated = 0;

    for (const policy of policies) {
      console.log(`Policy: "${policy.name}"`);
      console.log(`  Employee IDs: ${policy.employeeIds?.join(', ') || 'none'}`);

      const needsUpdate = policy.employeeIds?.some(id => ID_MAPPING[id]);

      if (needsUpdate) {
        const newEmployeeIds = policy.employeeIds.map(id => ID_MAPPING[id] || id);

        await customPolicies.updateOne(
          { _id: policy._id },
          { $set: { employeeIds: newEmployeeIds, updatedAt: new Date() } }
        );

        console.log(`  ✅ Updated: ${newEmployeeIds.join(', ')}`);
        updated++;
      } else {
        console.log(`  ✅ Already correct`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    if (updated > 0) {
      console.log(`✅ Updated ${updated} policies`);
    } else {
      console.log('✅ All policies already have correct employee IDs');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixCustomPolicies();
