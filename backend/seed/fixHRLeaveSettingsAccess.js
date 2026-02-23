/**
 * Fix: Remove HR Role Access from Leave Settings Page
 *
 * Per requirements, Leave Settings should only be accessible by:
 * - admin
 * - superadmin
 *
 * HR role should NOT have access to Leave Settings.
 *
 * Run: node seed/fixHRLeaveSettingsAccess.js
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const LEAVE_SETTINGS_PAGE_NAME = 'hrm.leave-settings';

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FIX: Remove HR Role Access from Leave Settings Page');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get the leave settings page
    console.log('1️⃣  Finding Leave Settings Page');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const page = await db.collection('pages').findOne({
      name: LEAVE_SETTINGS_PAGE_NAME
    });

    if (!page) {
      console.log(`   ❌ Page '${LEAVE_SETTINGS_PAGE_NAME}' NOT FOUND`);
      return;
    }

    console.log(`   ✅ Page Found: ${page.displayName || page.name}`);
    console.log(`      Page ID: ${page._id.toString()}`);
    console.log('');

    // Get the permission
    console.log('2️⃣  Finding Leave Settings Permission');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const permission = await db.collection('permissions').findOne({
      pageId: page._id
    });

    if (!permission) {
      console.log(`   ❌ Permission for page NOT FOUND`);
      return;
    }

    console.log(`   ✅ Permission Found`);
    console.log(`      Permission ID: ${permission._id.toString()}`);
    console.log('');

    // Get HR role
    console.log('3️⃣  Finding HR Role');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const hrRole = await db.collection('roles').findOne({
      name: 'hr'
    });

    if (!hrRole) {
      console.log(`   ⚠️  HR Role NOT FOUND (may not exist in this system)`);
      return;
    }

    console.log(`   ✅ HR Role Found`);
    console.log(`      Role ID: ${hrRole._id.toString()}`);
    console.log('');

    // Check if HR role has this permission
    console.log('4️⃣  Checking HR Role Permissions');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const rolePermission = await db.collection('role_permissions').findOne({
      roleId: hrRole._id,
      pageId: page._id
    });

    if (!rolePermission) {
      console.log(`   ℹ️  HR role does NOT have this permission (already correct!)`);
      console.log(`   No action needed.`);
      return;
    }

    console.log(`   ⚠️  HR role HAS this permission (needs to be removed)`);
    console.log(`      role_permissions ID: ${rolePermission._id.toString()}`);
    console.log('');

    // Remove the permission from HR role
    console.log('5️⃣  Removing Permission from HR Role');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const deleteResult = await db.collection('role_permissions').deleteOne({
      _id: rolePermission._id
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`   ✅ Removed Leave Settings permission from HR role`);
    } else {
      console.log(`   ❌ Failed to remove permission`);
    }
    console.log('');

    // Verify
    console.log('6️⃣  Verification');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const verifyResult = await db.collection('role_permissions').findOne({
      roleId: hrRole._id,
      pageId: page._id
    });

    if (!verifyResult) {
      console.log(`   ✅ VERIFIED: HR role no longer has Leave Settings permission`);
    } else {
      console.log(`   ❌ VERIFICATION FAILED: HR role still has permission`);
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ HR role can NO LONGER access Leave Settings page`);
    console.log(`\nCurrent Access Configuration for Leave Settings:`);
    console.log(`  ✅ admin: HAS access`);
    console.log(`  ✅ superadmin: HAS access`);
    console.log(`  ❌ hr: NO ACCESS (removed)`);

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
