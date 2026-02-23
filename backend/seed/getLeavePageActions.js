/**
 * Get Leave Pages Available Actions
 *
 * Run: node seed/getLeavePageActions.js
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

    // Get all leave pages
    const leavePages = await db.collection('pages').find({
      $or: [
        { route: { $in: ['leaves', 'leaves-employee', 'leave-settings'] } },
        { name: { $regex: 'leave', $options: 'i' } }
      ]
    }).toArray();

    console.log('Leave pages with available actions:\n');

    for (const page of leavePages) {
      console.log(`Name: ${page.name}`);
      console.log(`Route: ${page.route}`);
      console.log(`Display Name: ${page.displayName || page.name}`);
      console.log(`Available Actions: ${JSON.stringify(page.availableActions || [])}`);
      console.log('---');
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
