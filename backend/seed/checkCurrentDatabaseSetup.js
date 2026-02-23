/**
 * Check current database setup and find where employee data is
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Use the Atlas URI from .env file
const DB_URI = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const DEFAULT_DB = process.env.MONGODB_DATABASE || 'AmasQIS';
const DEV_COMPANY_ID = process.env.DEV_COMPANY_ID || '';

async function checkDatabaseSetup() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('Environment Variables:');
    console.log(`   MONGODB_URI: ${DB_URI?.substring(0, 30)}...`);
    console.log(`   MONGODB_DATABASE: ${DEFAULT_DB}`);
    console.log(`   DEV_COMPANY_ID: ${DEV_COMPANY_ID || '(not set)'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log('');

    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();

    console.log('=== ALL DATABASES ===\n');

    for (const dbInfo of databases.databases) {
      const dbName = dbInfo.name;

      // Skip admin databases
      if (['admin', 'local', 'config'].includes(dbName)) {
        continue;
      }

      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();

      // Check if this database has employees or leave-related collections
      const hasEmployees = collections.some(c => c.name === 'employees');
      const hasLeaveTypes = collections.some(c => c.name === 'leavetypes' || c.name === 'leaveTypes');
      const hasCustomPolicies = collections.some(c => c.name === 'customleavepolicies' || c.name === 'customLeavePolicies');

      if (hasEmployees || hasLeaveTypes || hasCustomPolicies) {
        console.log(`📁 ${dbName}`);
        console.log(`   Collections: ${collections.length}`);

        if (hasEmployees) {
          const empCount = await db.collection('employees').countDocuments({});
          console.log(`   👥 employees: ${empCount} documents`);

          // Show one employee sample
          if (empCount > 0) {
            const sample = await db.collection('employees').findOne({});
            console.log(`      Sample: ${sample.firstName} ${sample.lastName} (${sample.employeeId})`);
          }
        }

        if (hasLeaveTypes) {
          const collectionName = collections.find(c => c.name === 'leavetypes' || c.name === 'leaveTypes')?.name;
          const ltCount = await db.collection(collectionName).countDocuments({});
          console.log(`   📋 ${collectionName}: ${ltCount} documents`);

          // Show leave types
          if (ltCount > 0) {
            const leaveTypes = await db.collection(collectionName).find({}).toArray();
            leaveTypes.forEach(lt => {
              console.log(`      - ${lt.name} (${lt.code}): ${lt.annualQuota} days`);
            });
          }
        }

        if (hasCustomPolicies) {
          const collectionName = collections.find(c => c.name === 'customleavepolicies' || c.name === 'customLeavePolicies')?.name;
          const cpCount = await db.collection(collectionName).countDocuments({});
          console.log(`   ⚙️  ${collectionName}: ${cpCount} documents`);

          // Show custom policies
          if (cpCount > 0) {
            const policies = await db.collection(collectionName).find({}).toArray();
            policies.forEach(p => {
              console.log(`      - ${p.name || 'Unnamed'}: ${p.leaveType} = ${p.days} days for ${p.employeeIds?.length || 0} employees`);
            });
          }
        }

        console.log('');
      }
    }

    console.log('✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabaseSetup();
