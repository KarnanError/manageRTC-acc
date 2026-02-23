/**
 * Find all leave-related pages in the database
 * Run: node backend/seed/findLeavePageNames.js
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FINDING ALL LEAVE-RELATED PAGES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get HR role
    const hrRole = await db.collection('roles').findOne({ name: 'hr' });
    console.log(`HR Role ID: ${hrRole?._id.toString()}\n`);

    // Find all pages with 'leave' in name or displayName
    const pages = await db.collection('pages').find({
      $or: [
        { name: { $regex: 'leave', $options: 'i' } },
        { displayName: { $regex: 'leave', $options: 'i' } }
      ]
    }).toArray();

    console.log(`Found ${pages.length} leave-related pages:\n`);

    for (const page of pages) {
      const permission = await db.collection('permissions').findOne({ pageId: page._id });
      const rolePermission = permission ? await db.collection('role_permissions').findOne({
        roleId: hrRole._id,
        permissionId: permission._id
      }) : null;

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 ${page.displayName || page.name}`);
      console.log(`   name: "${page.name}"`);
      console.log(`   route: "${page.route || 'N/A'}"`);
      console.log(`   Page ID: ${page._id.toString()}`);
      console.log(`   Permission ID: ${permission?._id.toString() || 'NOT FOUND'}`);
      console.log(`   HR Access: ${rolePermission ? '✅ YES' : '❌ NO'}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Disconnected from MongoDB');
  }
};

main();
