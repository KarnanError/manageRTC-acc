/**
 * Add Permissions for New Leave Pages
 *
 * This script creates permissions for the new leave-related pages:
 * - Team Leaves (hrm.team-leaves)
 * - Leave Calendar (hrm.leave-calendar)
 * - Leave Ledger (hrm.leave-ledger)
 *
 * Run: node seed/addNewLeavePagePermissions.js
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    // Get the new leave pages
    const newLeavePages = await db.collection('pages').find({
      name: {
        $in: ['hrm.team-leaves', 'hrm.leave-calendar', 'hrm.leave-ledger']
      }
    }).toArray();

    if (newLeavePages.length === 0) {
      console.log('⚠️ No new leave pages found. They may have already been processed.');
      return;
    }

    console.log(`Found ${newLeavePages.length} new leave pages:\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const page of newLeavePages) {
      console.log(`Processing: ${page.displayName || page.name}`);

      // Check if permission already exists
      const existingPermission = await db.collection('permissions').findOne({
        pageId: page._id
      });

      if (existingPermission) {
        console.log(`  ⏭️  Permission already exists\n`);
        skippedCount++;
        continue;
      }

      // Create permission
      const permission = {
        pageId: page._id,
        pageName: page.name,
        displayName: page.displayName || page.name,
        description: page.description || `Permission for ${page.displayName || page.name}`,
        module: 'hrm',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('permissions').insertOne(permission);
      console.log(`  ✅ Permission created - ID: ${result.insertedId.toString()}\n`);
      addedCount++;
    }

    console.log(`✅ Summary: Created ${addedCount} permissions, Skipped ${skippedCount} permissions`);

    // Verify all HRM pages have permissions
    const allHrmPages = await db.collection('pages').find({
      category: new ObjectId('6990a1867368fc614b34519c'),
      isMenuGroup: false
    }).toArray();

    const pagesWithoutPermissions = [];
    for (const page of allHrmPages) {
      const permission = await db.collection('permissions').findOne({
        pageId: page._id
      });
      if (!permission) {
        pagesWithoutPermissions.push(page.name);
      }
    }

    if (pagesWithoutPermissions.length > 0) {
      console.log(`\n⚠️ HRM pages without permissions: ${pagesWithoutPermissions.length}`);
      for (const name of pagesWithoutPermissions) {
        console.log(`  - ${name}`);
      }
    } else {
      console.log(`\n✅ All ${allHrmPages.length} HRM pages have permissions`);
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
