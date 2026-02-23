/**
 * Diagnose Leave Pages in Database
 *
 * Run: node seed/diagnoseLeavePages.js
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

    // Find all leave-related pages
    const leavePages = await db.collection('pages').find({
      $or: [
        { code: { $regex: 'leave', $options: 'i' } },
        { name: { $regex: 'leave', $options: 'i' } },
        { route: { $regex: 'leave', $options: 'i' } }
      ]
    }).toArray();

    console.log(`Existing leave pages in database (${leavePages.length} found):`);
    for (const page of leavePages) {
      console.log(`  - ${page.name} (${page.code}): ${page.route}`);
    }
    console.log('');

    // Find all attendance-related pages (since leave is under Attendance & Leave)
    const attendancePages = await db.collection('pages').find({
      category: { $regex: 'attendance', $options: 'i' }
    }).toArray();

    console.log(`Pages in Attendance & Leave category (${attendancePages.length} found):`);
    for (const page of attendancePages) {
      console.log(`  - ${page.name} (${page.code}): ${page.route}`);
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
