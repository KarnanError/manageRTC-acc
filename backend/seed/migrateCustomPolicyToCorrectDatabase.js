/**
 * Migrate custom policies from default AmasQIS database to company-specific databases
 */

import { MongoClient, ObjectId } from 'mongodb';

const DB_URI = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

async function migrateCustomPolicies() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const defaultDb = client.db('AmasQIS');
    const sourceCollection = defaultDb.collection('custom_leave_policies');

    // Find all custom policies
    const policies = await sourceCollection.find({}).toArray();

    console.log(`=== MIGRATING CUSTOM POLICIES ===`);
    console.log(`Found ${policies.length} policies in default AmasQIS database\n`);

    if (policies.length === 0) {
      console.log('No policies to migrate.');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const policy of policies) {
      // Convert companyId ObjectId to string for database name
      const targetDbName = policy.companyId?.toString();

      if (!targetDbName) {
        console.log(`⚠️  Skipping policy "${policy.name}" - no companyId`);
        skipped++;
        continue;
      }

      try {
        const targetDb = client.db(targetDbName);
        const targetCollection = targetDb.collection('custom_leave_policies');

        // Check if policy already exists in target database
        const existing = await targetCollection.findOne({ _id: policy._id });

        if (existing) {
          console.log(`⏭️  Policy "${policy.name}" already exists in ${targetDbName}`);
          skipped++;
          continue;
        }

        // Insert policy into target database
        await targetCollection.insertOne(policy);

        console.log(`✅ Migrated "${policy.name}" to ${targetDbName}`);
        console.log(`   Leave Type: ${policy.leaveType}, Days: ${policy.days}`);
        console.log(`   Employees: ${policy.employeeIds?.length || 0}`);
        console.log('');

        migrated++;

        // Optional: Delete from source after successful migration
        // await sourceCollection.deleteOne({ _id: policy._id });

      } catch (error) {
        console.error(`❌ Error migrating policy "${policy.name}":`, error.message);
      }
    }

    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`\nNote: Policies were NOT deleted from the source database.`);
    console.log(`You can verify the migration and then delete them manually if needed.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

migrateCustomPolicies();
