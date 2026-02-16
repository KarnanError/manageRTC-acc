/**
 * Count permissions via Mongoose
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

async function run() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  await mongoose.connect(uri, { dbName });

  const count = await mongoose.connection.db.collection('permissions').countDocuments();
  console.log('Total permissions:', count);

  await mongoose.disconnect();
}

run().catch(console.error);
