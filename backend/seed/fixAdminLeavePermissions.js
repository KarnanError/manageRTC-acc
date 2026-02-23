/**
 * Fix: Add New Leave Permissions to Admin Role
 *
 * This script adds the new leave page permissions to the admin role
 * so that admin users can see the new leave pages in the sidebar.
 *
 * Run: node seed/fixAdminLeavePermissions.js
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const NEW_LEAVE_PAGES = [
  { name: 'hrm.team-leaves', displayName: 'Team Leaves' },
  { name: 'hrm.leave-calendar', displayName: 'Leave Calendar' },
  { name: 'hrm.leave-ledger', displayName: 'Leave Balance History' }
];

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FIX: Add New Leave Permissions to Admin Role');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Find the admin role
    console.log('1️⃣  Finding Admin Role');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const adminRole = await db.collection('roles').findOne({
      $or: [
        { name: 'admin' },
        { name: 'Admin' },
        { code: 'admin' }
      ]
    });

    if (!adminRole) {
      console.log('   ❌ Admin role NOT FOUND');
      console.log('   Trying to find any role with admin in the name...');

      const anyAdminRole = await db.collection('roles').findOne({
        name: { $regex: 'admin', $options: 'i' }
      });

      if (!anyAdminRole) {
        console.log('   ❌ No admin role found at all!');
        return;
      }

      console.log(`   Found: ${anyAdminRole.name}`);
    }

    console.log(`   ✅ Admin Role Found: ${adminRole.name}`);
    console.log(`      ID: ${adminRole._id.toString()}`);
    console.log('');

    // Step 2: Get the permission IDs for new leave pages
    console.log('2️⃣  Getting Permission IDs for New Leave Pages');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const permissionsToAdd = [];
    for (const pageData of NEW_LEAVE_PAGES) {
      const page = await db.collection('pages').findOne({ name: pageData.name });
      if (page) {
        const permission = await db.collection('permissions').findOne({ pageId: page._id });
        if (permission) {
          console.log(`   ✅ ${pageData.displayName}`);
          console.log(`      Page ID: ${page._id.toString()}`);
          console.log(`      Permission ID: ${permission._id.toString()}`);
          permissionsToAdd.push({
            pageId: page._id,
            permissionId: permission._id,
            displayName: pageData.displayName
          });
        }
      }
    }
    console.log('');

    // Step 3: Add permissions to role_permissions junction table
    console.log('3️⃣  Adding Permissions to role_permissions Junction Table');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let junctionAdded = 0;
    for (const perm of permissionsToAdd) {
      // Check if already exists
      const existing = await db.collection('role_permissions').findOne({
        roleId: adminRole._id,
        pageId: perm.pageId
      });

      if (!existing) {
        await db.collection('role_permissions').insertOne({
          roleId: adminRole._id,
          pageId: perm.pageId,
          permissionId: perm.permissionId,
          createdAt: new Date()
        });
        console.log(`   ✅ Added: ${perm.displayName}`);
        junctionAdded++;
      } else {
        console.log(`   ⏭️  Already exists: ${perm.displayName}`);
      }
    }
    console.log('');

    // Step 4: Also update the role's permissionIds array (if it exists)
    console.log('4️⃣  Updating Role Document permissionIds Array');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (adminRole.permissionIds && Array.isArray(adminRole.permissionIds)) {
      const currentIds = adminRole.permissionIds.map(id => id.toString());
      const newPermissionIds = permissionsToAdd
        .map(p => p.permissionId)
        .filter(id => !currentIds.includes(id.toString()));

      if (newPermissionIds.length > 0) {
        await db.collection('roles').updateOne(
          { _id: adminRole._id },
          {
            $push: {
              permissionIds: { $each: newPermissionIds }
            },
            $set: {
              updatedAt: new Date()
            }
          }
        );
        console.log(`   ✅ Added ${newPermissionIds.length} permissions to permissionIds array`);
      } else {
        console.log(`   ℹ️ All permissions already in permissionIds array`);
      }
    } else {
      console.log(`   ℹ️ Role does not have permissionIds array (using junction table only)`);
    }
    console.log('');

    // Step 5: Verify
    console.log('5️⃣  Verification');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const updatedRolePermissions = await db.collection('role_permissions').find({
      roleId: adminRole._id
    }).toArray();

    console.log(`   Admin role now has ${updatedRolePermissions.length} permissions in junction table\n`);

    const verified = [];
    for (const pageData of NEW_LEAVE_PAGES) {
      const page = await db.collection('pages').findOne({ name: pageData.name });
      if (page) {
        const hasPermission = await db.collection('role_permissions').findOne({
          roleId: adminRole._id,
          pageId: page._id
        });
        verified.push({
          name: pageData.displayName,
          has: !!hasPermission
        });
      }
    }

    for (const v of verified) {
      console.log(`   ${v.has ? '✅' : '❌'} ${v.name}`);
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Added ${junctionAdded} new leave permissions to admin role`);
    console.log(`\nThe admin users should now see the new leave pages in the sidebar.`);
    console.log(`\nIf pages still don't show, try:`);
    console.log(`  1. Refreshing the browser (Ctrl+Shift+R for hard refresh)`);
    console.log(`  2. Logging out and logging back in`);
    console.log(`  3. Clearing browser cache`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Disconnected from MongoDB');
  }
};

main();
