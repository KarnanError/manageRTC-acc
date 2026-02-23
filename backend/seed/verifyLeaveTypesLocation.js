/**
 * Verification Script: Verify leave types are in company databases
 *
 * Run: node seed/verifyLeaveTypesLocation.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const amasDb = client.db('AmasQIS');
    const companies = await amasDb.collection('companies').find({}).toArray();

    console.log('Verifying leave types are in company databases:\n');

    let totalLeaveTypes = 0;

    for (const company of companies) {
      const companyId = company._id.toString();
      const companyDb = client.db(companyId);
      const count = await companyDb.collection('leaveTypes').countDocuments();

      // Get sample leave types
      const sample = await companyDb.collection('leaveTypes')
        .find({})
        .project({ name: 1, code: 1, annualQuota: 1 })
        .limit(3)
        .toArray();

      console.log(`Company: ${company.name || companyId}`);
      console.log(`  Database: ${companyId}`);
      console.log(`  Leave types: ${count}`);

      if (sample.length > 0) {
        console.log('  Sample:');
        for (const lt of sample) {
          console.log(`    - ${lt.name} (${lt.code}): ${lt.annualQuota} days`);
        }
      }
      console.log('');

      totalLeaveTypes += count;
    }

    // Verify AmasQIS is clean
    const amasCount = await amasDb.collection('leaveTypes').countDocuments();
    console.log(`Summary:`);
    console.log(`  Total leave types in company databases: ${totalLeaveTypes}`);
    console.log(`  Leave types in AmasQIS: ${amasCount} (should be 0)`);

    if (amasCount === 0 && totalLeaveTypes > 0) {
      console.log(`\n✅ Verification passed! Leave types are correctly stored in company databases.`);
    } else if (amasCount > 0) {
      console.log(`\n⚠️ Warning: AmasQIS still has leave types. Run cleanup script.`);
    } else {
      console.log(`\n⚠️ Warning: No leave types found in any company database.`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
};

main();
