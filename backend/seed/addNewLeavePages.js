/**
 * Add New Leave Pages to AmasQIS Database
 *
 * This script adds the new leave-related pages that were created recently:
 * - Team Leaves (hrm.team-leaves) - /team-leaves
 * - Leave Calendar (hrm.leave-calendar) - /leave-calendar
 * - Leave Ledger (hrm.leave-ledger) - /leave-ledger
 *
 * Run: node seed/addNewLeavePages.js
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

// New leave pages to add
const NEW_LEAVE_PAGES = [
  {
    name: 'hrm.team-leaves',
    displayName: 'Team Leaves',
    route: 'team-leaves',
    icon: 'ti ti-users-group',
    description: 'Team leave management and approval',
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    sortOrder: 40
  },
  {
    name: 'hrm.leave-calendar',
    displayName: 'Leave Calendar',
    route: 'leave-calendar',
    icon: 'ti ti-calendar',
    description: 'Calendar view of team leaves',
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    sortOrder: 50
  },
  {
    name: 'hrm.leave-ledger',
    displayName: 'Leave Balance History',
    route: 'leave-ledger',
    icon: 'ti ti-book',
    description: 'Leave balance history and ledger',
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    sortOrder: 60
  }
];

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    // Get the leaves menu (parent page)
    const leavesMenu = await db.collection('pages').findOne({
      name: 'hrm.leaves-menu',
      isMenuGroup: true,
      menuGroupLevel: 2
    });

    if (!leavesMenu) {
      console.error('❌ Leaves menu not found. Please ensure the hierarchy is properly set up.');
      process.exit(1);
    }

    console.log(`Found parent menu: ${leavesMenu.name} (ID: ${leavesMenu._id.toString()})\n`);

    // Get the HRM category
    const hrmCategory = await db.collection('pagecategories').findOne({
      identifier: 'IV'
    });

    if (!hrmCategory) {
      console.error('❌ HRM category not found.');
      process.exit(1);
    }

    console.log(`Found category: ${hrmCategory.name} (ID: ${hrmCategory._id.toString()})\n`);

    // Add new pages
    let addedCount = 0;
    let skippedCount = 0;

    for (const pageData of NEW_LEAVE_PAGES) {
      // Check if page already exists
      const existing = await db.collection('pages').findOne({
        name: pageData.name
      });

      if (existing) {
        console.log(`⏭️  Skipping ${pageData.name} - already exists`);
        skippedCount++;
        continue;
      }

      // Create the page document
      const newPage = {
        name: pageData.name,
        displayName: pageData.displayName,
        route: pageData.route,
        icon: pageData.icon,
        description: pageData.description,
        availableActions: pageData.availableActions,
        category: hrmCategory._id,
        parentPage: leavesMenu._id,
        isMenuGroup: false,
        menuGroupLevel: null,
        level: 3, // Child of L2 menu = Level 3
        depth: 2,
        sortOrder: pageData.sortOrder,
        hierarchyPath: [leavesMenu._id],
        l2Groups: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('pages').insertOne(newPage);
      console.log(`✅ Added page: ${pageData.displayName} (${pageData.route}) - ID: ${result.insertedId.toString()}`);
      addedCount++;
    }

    console.log(`\n✅ Summary: Added ${addedCount} pages, Skipped ${skippedCount} pages`);

    // Update the leaves menu's children array
    const allChildren = await db.collection('pages').find({
      parentPage: leavesMenu._id,
      isMenuGroup: false
    }).toArray();

    console.log(`\n📊 Leaves menu now has ${allChildren.length} child pages:`);
    for (const child of allChildren.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))) {
      console.log(`  - ${child.displayName || child.name} (${child.route})`);
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
