/**
 * Diagnose leaveTypes collection in company database
 * Run: node backend/seed/diagnoseLeaveTypes.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const checkCompany = async (companyId) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(`✅ Connected to MongoDB\n`);

    const db = client.db(companyId);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Collections in company database (${companyId}):`);
    const hasLeaveTypes = collections.some(c => c.name === 'leaveTypes');
    console.log(`   leaveTypes collection exists: ${hasLeaveTypes ? '✅ YES' : '❌ NO'}`);

    if (hasLeaveTypes) {
      // Count leave types
      const total = await db.collection('leaveTypes').countDocuments();
      console.log(`   Total leave types: ${total}`);

      // Get sample leave types
      const sample = await db.collection('leaveTypes').find({}).limit(3).toArray();
      console.log(`\n   Sample leave types:`);
      sample.forEach((lt, i) => {
        console.log(`   ${i + 1}. ${lt.name} (${lt.code}) - ${lt.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    console.log('');
    return hasLeaveTypes;

  } catch (error) {
    console.error(`❌ Error checking ${companyId}:`, error.message);
    return false;
  } finally {
    await client.close();
  }
};

const main = async () => {
  const companies = [
    '698195cc0afbe3284fd5aa60',
    '6982468548550225cc5585a9', // amasQIS.ai
    '6982d04e31086341a9788aed',
    '698856b731b9532153c96c3e',
  ];

  console.log('🔍 Diagnosing leaveTypes collection...\n');

  for (const companyId of companies) {
    await checkCompany(companyId);
  }

  console.log('✅ Diagnosis complete');
};

main();
