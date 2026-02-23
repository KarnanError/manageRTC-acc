/**
 * Cleanup Script: Remove leave types from AmasQIS database
 *
 * This script removes leave types that were incorrectly stored in the
 * AmasQIS superadmin database. Leave types should be stored in each
 * company's own database.
 *
 * Run: node seed/cleanupLeaveTypesFromAmasQIS.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const amasDb = client.db('AmasQIS');
    const companiesCollection = amasDb.collection('companies');
    const companies = await companiesCollection.find({}).toArray();

    console.log('\n🧹 Cleaning up leave types from AmasQIS database...');

    let totalDeleted = 0;

    for (const company of companies) {
      const companyId = company._id.toString();
      const count = await amasDb.collection('leaveTypes').countDocuments({ companyId });
      if (count > 0) {
        console.log(`  - Deleting ${count} leave types for company: ${companyId}`);
        await amasDb.collection('leaveTypes').deleteMany({ companyId });
        totalDeleted += count;
      }
    }

    const remaining = await amasDb.collection('leaveTypes').countDocuments();
    console.log(`\n✅ Cleanup complete. Deleted: ${totalDeleted} leave types from AmasQIS`);
    console.log(`   Remaining leave types in AmasQIS: ${remaining} (should be 0)`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
};

main();
