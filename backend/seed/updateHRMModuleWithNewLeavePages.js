/**
 * Update HRM Module with New Leave Pages
 *
 * This script adds the new leave-related pages to the HRM module:
 * - Team Leaves (hrm.team-leaves)
 * - Leave Calendar (hrm.leave-calendar)
 * - Leave Ledger (hrm.leave-ledger)
 *
 * Run: node seed/updateHRMModuleWithNewLeavePages.js
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

    // Get the HRM module
    const hrmModule = await db.collection('modules').findOne({ name: 'hrm' });

    if (!hrmModule) {
      console.log('❌ HRM module not found');
      return;
    }

    console.log(`HRM Module found with ${hrmModule.pages.length} pages\n`);

    // Get the new leave pages
    const newLeavePages = await db.collection('pages').find({
      name: {
        $in: ['hrm.team-leaves', 'hrm.leave-calendar', 'hrm.leave-ledger']
      }
    }).toArray();

    console.log(`Found ${newLeavePages.length} new leave pages to add:\n`);

    // Get current page IDs in module
    const currentPageIds = hrmModule.pages.map(p => p.pageId.toString());

    let addedCount = 0;
    const pagesToAdd = [];

    for (const page of newLeavePages) {
      const pageId = page._id.toString();
      if (currentPageIds.includes(pageId)) {
        console.log(`⏭️  ${page.displayName || page.name} - already in module`);
      } else {
        console.log(`➕ ${page.displayName || page.name} - will be added`);
        pagesToAdd.push({
          pageId: page._id,
          name: page.name,
          displayName: page.displayName || page.name
        });
        addedCount++;
      }
    }

    if (pagesToAdd.length > 0) {
      // Update the module with new pages
      await db.collection('modules').updateOne(
        { _id: hrmModule._id },
        {
          $push: {
            pages: { $each: pagesToAdd }
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      console.log(`\n✅ Added ${pagesToAdd.length} pages to HRM module`);

      // Verify
      const updatedModule = await db.collection('modules').findOne({ _id: hrmModule._id });
      console.log(`\nHRM module now has ${updatedModule.pages.length} pages`);
    } else {
      console.log(`\nℹ️ No new pages to add. All pages already in module.`);
    }

    // Show all leave-related pages in the module
    const updatedModule = await db.collection('modules').findOne({ _id: hrmModule._id });
    const leavePages = updatedModule.pages.filter(p =>
      p.name?.includes('leave') || p.displayName?.toLowerCase().includes('leave')
    );

    console.log(`\n📊 Leave-related pages in HRM module (${leavePages.length}):`);
    for (const page of leavePages.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))) {
      console.log(`  - ${page.displayName || page.name}`);
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
