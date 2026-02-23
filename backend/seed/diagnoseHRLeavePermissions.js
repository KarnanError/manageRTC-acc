/**
 * Diagnose HR Role Permissions for Leave Pages
 * Run: node backend/seed/diagnoseHRLeavePermissions.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const LEAVE_PAGES = [
  'hrm.leaves',          // Leaves (Admin)
  'hrm.my-leaves',       // Leaves (Employee)
  'hrm.team-leaves',     // Team Leaves
  'hrm.leave-calendar',  // Leave Calendar
  'hrm.leave-ledger',    // Leave Ledger
  'hrm.leave-settings'   // Leave Settings
];

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DIAGNOSIS: HR Role Leave Page Permissions');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get HR role
    const hrRole = await db.collection('roles').findOne({ name: 'hr' });

    if (!hrRole) {
      console.log('❌ HR Role NOT FOUND in database');
      return;
    }

    console.log(`✅ HR Role ID: ${hrRole._id.toString()}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECKING LEAVE PAGE PERMISSIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results = [];

    for (const pageName of LEAVE_PAGES) {
      const page = await db.collection('pages').findOne({ name: pageName });
      const permission = page ? await db.collection('permissions').findOne({ pageId: page._id }) : null;
      const rolePermission = permission ? await db.collection('role_permissions').findOne({
        roleId: hrRole._id,
        permissionId: permission._id
      }) : null;

      const hasAccess = !!rolePermission;

      results.push({
        page: pageName,
        pageExists: !!page,
        displayName: page?.displayName || pageName,
        permissionExists: !!permission,
        hrHasAccess: hasAccess,
        rolePermissionId: rolePermission?._id.toString()
      });

      console.log(`📄 ${page?.displayName || pageName}`);
      console.log(`   Page: ${page ? '✅ Found' : '❌ NOT FOUND'}`);
      console.log(`   Permission: ${permission ? '✅ Found' : '❌ NOT FOUND'}`);
      console.log(`   HR Access: ${hasAccess ? '✅ YES' : '❌ NO'}`);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const missingAccess = results.filter(r => r.pageExists && !r.hrHasAccess);

    if (missingAccess.length > 0) {
      console.log('❌ PAGES HR CANNOT ACCESS (but should):');
      missingAccess.forEach(r => {
        console.log(`   - ${r.page} (${r.displayName})`);
      });
    } else {
      console.log('✅ All existing leave pages have correct HR permissions');
    }

    const missingPages = results.filter(r => !r.pageExists);
    if (missingPages.length > 0) {
      console.log('\n⚠️  PAGES NOT FOUND IN DATABASE:');
      missingPages.forEach(r => {
        console.log(`   - ${r.page}`);
      });
    }

    const unexpectedAccess = results.filter(r => r.page === 'hrm.leave-settings' && r.hrHasAccess);
    if (unexpectedAccess.length > 0) {
      console.log('\n⚠️  WARNING: HR has access to Leave Settings (should NOT have access)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Disconnected from MongoDB');
  }
};

main();
