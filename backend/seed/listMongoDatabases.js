/**
 * List all MongoDB databases and their collections
 */

import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb://localhost:27017';

async function listDatabases() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();

    console.log('=== ALL DATABASES ===\n');

    for (const dbInfo of databases.databases) {
      const dbName = dbInfo.name;
      console.log(`📁 ${dbName}`);

      // Skip admin databases
      if (['admin', 'local', 'config'].includes(dbName)) {
        console.log('   (System database - skipping)\n');
        continue;
      }

      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();

      if (collections.length > 0) {
        console.log(`   Collections (${collections.length}):`);
        for (const coll of collections) {
          // Get count for small collections
          const count = await db.collection(coll.name).countDocuments();

          console.log(`      - ${coll.name} (${count} documents)`);

          // If it's customleavepolicies, show one document as sample
          if (coll.name === 'customleavepolicies' && count > 0) {
            const sample = await db.collection(coll.name).findOne();
            console.log(`        Sample:`, JSON.stringify(sample, null, 10).split('\n').join('\n        '));
          }
        }
      } else {
        console.log('   (No collections)');
      }
      console.log('');
    }

    console.log('✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listDatabases();
