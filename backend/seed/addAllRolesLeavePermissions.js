/**
 * Add New Leave Permissions to All Relevant Roles
 *
 * This script adds the new leave page permissions to all relevant roles
 * (admin, hr, superadmin) so they can see the new leave pages in the sidebar.
 *
 * Run: node seed/addAllRolesLeavePermissions.js
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const NEW_LEAVE_PAGES = [
  { name: 'hrm.team-leaves', displayName: 'Team Leaves' },
  { name: 'hrm.leave-calendar', displayName: 'Leave Calendar' },
  { name: 'hrm.leave-ledger', displayName: 'Leave Balance History' }
];

const TARGET_ROLES = ['admin', 'hr', 'superadmin'];

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADD: New Leave Permissions to All Relevant Roles');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get permission IDs for new leave pages
    const permissionsToAdd = [];
    for (const pageData of NEW_LEAVE_PAGES) {
      const page = await db.collection('pages').findOne({ name: pageData.name });
      if (page) {
        const permission = await db.collection('permissions').findOne({ pageId: page._id });
        if (permission) {
          permissionsToAdd.push({
            pageId: page._id,
            permissionId: permission._id,
            displayName: pageData.displayName
          });
        }
      }
    }

    console.log(`Found ${permissionsToAdd.length} new leave permissions to add\n`);

    // Process each target role
    for (const targetRoleName of TARGET_ROLES) {
      console.log(`\n📋 Processing Role: ${targetRoleName.toUpperCase()}`);
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Find role (case-insensitive)
      const role = await db.collection('roles').findOne({
        name: { $regex: `^${targetRoleName}$`, $options: 'i' }
      });

      if (!role) {
        console.log(`   ⚠️  Role '${targetRoleName}' not found, skipping...`);
        continue;
      }

      console.log(`   ✅ Role Found: ${role.name} (ID: ${role._id.toString()})`);

      let addedCount = 0;
      let skippedCount = 0;

      for (const perm of permissionsToAdd) {
        // Check if already exists in junction table
        const existing = await db.collection('role_permissions').findOne({
          roleId: role._id,
          pageId: perm.pageId
        });

        if (!existing) {
          await db.collection('role_permissions').insertOne({
            roleId: role._id,
            pageId: perm.pageId,
            permissionId: perm.permissionId,
            createdAt: new Date()
          });
          console.log(`   ✅ Added: ${perm.displayName}`);
          addedCount++;
        } else {
          console.log(`   ⏭️  Already exists: ${perm.displayName}`);
          skippedCount++;
        }
      }

      console.log(`\n   Summary: Added ${addedCount}, Skipped ${skippedCount}`);
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify all roles have the permissions
    for (const targetRoleName of TARGET_ROLES) {
      const role = await db.collection('roles').findOne({
        name: { $regex: `^${targetRoleName}$`, $options: 'i' }
      });

      if (!role) continue;

      const rolePermissions = await db.collection('role_permissions').find({
        roleId: role._id
      }).toArray();

      const newPermissionIds = permissionsToAdd.map(p => p.pageId.toString());
      const hasAll = newPermissionIds.every(id =>
        rolePermissions.some(rp => rp.pageId.toString() === id)
      );

      console.log(`   ${hasAll ? '✅' : '❌'} ${role.name}: ${rolePermissions.length} total permissions`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ New leave permissions have been added to relevant roles');
    console.log('\nNext steps if pages still don\'t show in sidebar:');
    console.log('  1. Hard refresh browser (Ctrl+Shift+R)');
    console.log('  2. Log out and log back in');
    console.log('  3. Check sidebar menu configuration');
    console.log('  4. Verify frontend is fetching latest permissions');

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
