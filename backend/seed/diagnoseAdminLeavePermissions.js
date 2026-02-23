/**
 * Diagnose Admin Role Permissions for New Leave Pages
 *
 * This script checks if the admin role has the new leave page permissions assigned.
 *
 * Run: node seed/diagnoseAdminLeavePermissions.js
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
    console.log('DIAGNOSIS: Admin Role Permissions for New Leave Pages');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Find the admin role
    console.log('1️⃣  Finding Admin Role');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const adminRole = await db.collection('roles').findOne({
      $or: [
        { name: { $regex: 'admin', $options: 'i' } },
        { code: { $regex: 'admin', $options: 'i' } }
      ]
    });

    if (!adminRole) {
      console.log('   ❌ Admin role NOT FOUND');
      return;
    }

    console.log(`   ✅ Admin Role Found`);
    console.log(`      ID: ${adminRole._id.toString()}`);
    console.log(`      Name: ${adminRole.name}`);
    console.log(`      Code: ${adminRole.code || 'none'}`);
    console.log('');

    // Step 2: Get the permission IDs for new leave pages
    console.log('2️⃣  New Leave Page Permissions');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const newPagePermissionIds = [];
    for (const pageData of NEW_LEAVE_PAGES) {
      const page = await db.collection('pages').findOne({ name: pageData.name });
      if (page) {
        const permission = await db.collection('permissions').findOne({ pageId: page._id });
        if (permission) {
          console.log(`   ✅ ${pageData.displayName}`);
          console.log(`      Permission ID: ${permission._id.toString()}`);
          newPagePermissionIds.push(permission._id.toString());
        } else {
          console.log(`   ❌ ${pageData.displayName} - NO PERMISSION FOUND`);
        }
      } else {
        console.log(`   ❌ ${pageData.displayName} - PAGE NOT FOUND`);
      }
    }
    console.log('');

    // Step 3: Check admin role's permissions
    console.log('3️⃣  Checking Admin Role Permissions');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check both permissionIds array and role_permissions junction table
    const adminPermissionIds = adminRole.permissionIds?.map(id => id.toString()) || [];

    // Also check junction table
    const rolePermissions = await db.collection('role_permissions').find({
      roleId: adminRole._id
    }).toArray();

    const junctionPermissionIds = rolePermissions.map(rp => rp.pageId?.toString()).filter(Boolean);

    console.log(`   Admin Role Permissions (direct): ${adminPermissionIds.length}`);
    console.log(`   Admin Role Permissions (junction): ${junctionPermissionIds.length}\n`);

    // Check which new permissions are missing
    const missingDirect = [];
    const missingJunction = [];

    for (const permId of newPagePermissionIds) {
      if (!adminPermissionIds.includes(permId)) {
        missingDirect.push(permId);
      }
      if (!junctionPermissionIds.includes(permId)) {
        missingJunction.push(permId);
      }
    }

    if (missingDirect.length > 0) {
      console.log(`   ❌ Missing from permissionIds array: ${missingDirect.length}`);
      for (const id of missingDirect) {
        const perm = await db.collection('permissions').findOne({ _id: new ObjectId(id) });
        console.log(`      - ${perm?.displayName || perm?.pageName || id}`);
      }
    } else {
      console.log(`   ✅ All new permissions in permissionIds array`);
    }
    console.log('');

    if (missingJunction.length > 0) {
      console.log(`   ❌ Missing from role_permissions junction: ${missingJunction.length}`);
      for (const id of missingJunction) {
        const perm = await db.collection('permissions').findOne({ _id: new ObjectId(id) });
        console.log(`      - ${perm?.displayName || perm?.pageName || id}`);
      }
    } else {
      console.log(`   ✅ All new permissions in role_permissions junction`);
    }
    console.log('');

    // Step 4: Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (missingDirect.length > 0 || missingJunction.length > 0) {
      console.log('⚠️ ISSUE FOUND: Admin role is missing some new leave page permissions');
      console.log('\nThis is why the pages are not showing in the sidebar for admin users.');
      console.log('Run the fix script to add these permissions to the admin role.');
    } else {
      console.log('✅ All permissions are assigned to admin role');
      console.log('\nIf pages still don\'t show, the issue might be:');
      console.log('  - Frontend caching (try refreshing or clearing cache)');
      console.log('  - Sidebar menu configuration needs update');
      console.log('  - Role middleware issue');
    }

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
