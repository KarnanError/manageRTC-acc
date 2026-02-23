/**
 * Fix: Add HR Role Access to Leave Menu Groups
 *
 * HR can't see leave subpages because they don't have access to the parent menu groups.
 * This script adds HR access to:
 * - hrm.leaves-menu (Leaves menu group)
 * - hrm.attendance-leave-menu (Attendance & Leave menu group)
 *
 * Run: node backend/seed/fixHRLeaveMenuAccess.js
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const MENU_PAGES_TO_FIX = [
  'hrm.leaves-menu',              // Leaves menu group (parent)
  'hrm.attendance-leave-menu'     // Attendance & Leave menu group (parent)
];

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FIX: Add HR Role Access to Leave Menu Groups');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get HR role
    const hrRole = await db.collection('roles').findOne({ name: 'hr' });

    if (!hrRole) {
      console.log('❌ HR Role NOT FOUND');
      return;
    }

    console.log(`✅ HR Role ID: ${hrRole._id.toString()}\n`);

    let fixedCount = 0;

    for (const pageName of MENU_PAGES_TO_FIX) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Processing: ${pageName}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Get the page
      const page = await db.collection('pages').findOne({ name: pageName });

      if (!page) {
        console.log(`   ⚠️  Page '${pageName}' NOT FOUND - skipping\n`);
        continue;
      }

      console.log(`   ✅ Page Found: ${page.displayName || page.name}`);
      console.log(`      Page ID: ${page._id.toString()}`);
      console.log(`      Route: ${page.route || 'N/A (menu group)'}`);

      // Get or create permission
      let permission = await db.collection('permissions').findOne({ pageId: page._id });

      if (!permission) {
        // Create permission
        const permissionResult = await db.collection('permissions').insertOne({
          pageId: page._id,
          name: page.name,
          displayName: page.displayName,
          description: `Access to ${page.displayName || page.name}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        permission = await db.collection('permissions').findOne({ _id: permissionResult.insertedId });
        console.log(`      ✅ Created Permission: ${permission._id.toString()}`);
      } else {
        console.log(`      ✅ Permission Exists: ${permission._id.toString()}`);
      }

      // Check if HR already has this permission
      const existingRolePermission = await db.collection('role_permissions').findOne({
        roleId: hrRole._id,
        permissionId: permission._id
      });

      if (existingRolePermission) {
        console.log(`      ℹ️  HR already has access - no change needed\n`);
        continue;
      }

      // Add permission to HR role
      const result = await db.collection('role_permissions').insertOne({
        roleId: hrRole._id,
        permissionId: permission._id,
        pageId: page._id,
        createdAt: new Date()
      });

      if (result.insertedId) {
        console.log(`      ✅ Added HR access to this menu group\n`);
        fixedCount++;
      } else {
        console.log(`      ❌ Failed to add HR access\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Fixed ${fixedCount} menu group(s)`);

    console.log('\nHR should now be able to see these pages in the sidebar:');
    console.log('  ✅ Leaves (Admin)');
    console.log('  ✅ Leaves (Employee)');
    console.log('  ✅ Team Leaves');
    console.log('  ✅ Leave Calendar');
    console.log('  ✅ Leave Balance History');
    console.log('  ❌ Leave Settings (correctly hidden)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Disconnected from MongoDB');
  }
};

main();
