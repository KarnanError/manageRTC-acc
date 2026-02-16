import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';

async function diagnose() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== Diagnosis Script ===');
  console.log('MONGO_URI:', uri);
  console.log('MONGODB_DATABASE:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });

  console.log('Connection State:');
  console.log('  readyState:', mongoose.connection.readyState);
  console.log('  name:', mongoose.connection.name);
  console.log('  host:', mongoose.connection.host);
  console.log('  db:', mongoose.connection.db?.databaseName);
  console.log('');

  // Test Page model
  const pageCount1 = await Page.countDocuments();
  console.log('Page.countDocuments():', pageCount1);

  // Test raw collection
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const pagesCollection = collections.find(c => c.name === 'pages');

  if (pagesCollection) {
    const rawCount = await db.collection('pages').countDocuments();
    console.log('Raw collection count:', rawCount);
  } else {
    console.log('pages collection NOT FOUND!');
  }

  console.log('\nAll collection names:');
  collections.forEach(c => console.log('  -', c.name));

  await mongoose.disconnect();
}

diagnose().catch(console.error);
