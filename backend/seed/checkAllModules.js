/**
 * Check All Modules
 *
 * Run: node seed/checkAllModules.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    // Get all modules
    const modules = await db.collection('modules').find({}).toArray();

    console.log(`Found ${modules.length} modules:\n`);

    for (const module of modules) {
      console.log(`- ${module.name} (${module.code || 'no-code'})`);
      console.log(`  Pages: ${module.pages?.length || 0}`);
      console.log('');
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
