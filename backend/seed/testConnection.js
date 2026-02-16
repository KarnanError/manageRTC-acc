import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

import Page from '../models/rbac/page.schema.js';

async function test() {
  const uri = process.env.MONGO_URI || '';
  const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

  console.log('MONGO_URI:', uri);
  console.log('MONGODB_DATABASE:', dbName);

  await mongoose.connect(uri, { dbName });

  // List all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\nCollections in database:');
  collections.forEach(c => {
    console.log(`  - ${c.name}`);
  });

  // Check pages collection specifically
  const count = await Page.countDocuments();
  console.log(`\nPage count: ${count}`);

  await mongoose.disconnect();
}

test().catch(console.error);
