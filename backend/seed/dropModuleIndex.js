/**
 * Drop problematic index from permissions collection
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE || 'AmasQIS'
  });

  const db = mongoose.connection.db;

  // Drop the problematic index
  try {
    await db.collection('permissions').dropIndex('module_1');
    console.log('✓ Dropped module_1 index');
  } catch (e) {
    console.log('Index may not exist or already dropped:', e.message);
  }

  // List remaining indexes
  const indexes = await db.collection('permissions').indexes();
  console.log('\nRemaining indexes on permissions:');
  indexes.forEach(idx => console.log('  -', idx.name));

  await mongoose.disconnect();
}

main().catch(console.error);
