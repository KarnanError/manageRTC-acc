/**
 * List all collections in the database and check for policy-related collections
 */

import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const DB_NAME = '698195cc0afbe3284fd5aa60'; // manageRTC database

async function listAllCollections() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();

    console.log(`=== ALL COLLECTIONS IN ${DB_NAME} ===`);
    console.log(`Total: ${collections.length} collections\n`);

    // Group by category
    const leaveRelated = [];
    const employeeRelated = [];
    const policyRelated = [];
    const other = [];

    for (const coll of collections) {
      const name = coll.name;

      if (name.toLowerCase().includes('leave')) {
        const count = await db.collection(name).countDocuments({});
        leaveRelated.push({ name, count });
      } else if (name.toLowerCase().includes('employee')) {
        const count = await db.collection(name).countDocuments({});
        employeeRelated.push({ name, count });
      } else if (name.toLowerCase().includes('policy') || name.toLowerCase().includes('custom')) {
        const count = await db.collection(name).countDocuments({});
        policyRelated.push({ name, count });
      } else {
        other.push({ name });
      }
    }

    console.log('📋 LEAVE-RELATED COLLECTIONS:');
    if (leaveRelated.length > 0) {
      leaveRelated.forEach(c => {
        console.log(`   ${c.name.padEnd(30)} (${c.count} documents)`);
      });
    } else {
      console.log('   (None found)');
    }

    console.log('\n👥 EMPLOYEE-RELATED COLLECTIONS:');
    if (employeeRelated.length > 0) {
      employeeRelated.forEach(c => {
        console.log(`   ${c.name.padEnd(30)} (${c.count} documents)`);
      });
    } else {
      console.log('   (None found)');
    }

    console.log('\n⚙️  POLICY/CUSTOM-RELATED COLLECTIONS:');
    if (policyRelated.length > 0) {
      policyRelated.forEach(c => {
        console.log(`   ${c.name.padEnd(30)} (${c.count} documents)`);
      });
    } else {
      console.log('   (None found)');
    }

    console.log('\n📁 OTHER COLLECTIONS:');
    other.forEach(c => {
      console.log(`   ${c.name}`);
    });

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listAllCollections();
