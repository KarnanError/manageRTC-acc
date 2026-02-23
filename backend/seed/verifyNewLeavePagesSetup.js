/**
 * Final Verification: New Leave Pages Setup
 *
 * This script verifies that all new leave-related pages, permissions, and modules
 * are properly configured in the AmasQIS database.
 *
 * Run: node seed/verifyNewLeavePagesSetup.js
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const NEW_LEAVE_PAGES = [
  { name: 'hrm.team-leaves', displayName: 'Team Leaves', route: 'team-leaves' },
  { name: 'hrm.leave-calendar', displayName: 'Leave Calendar', route: 'leave-calendar' },
  { name: 'hrm.leave-ledger', displayName: 'Leave Balance History', route: 'leave-ledger' }
];

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('VERIFICATION: New Leave Pages Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check 1: Pages exist
    console.log('1️⃣  Checking Pages Collection');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const pageData of NEW_LEAVE_PAGES) {
      const page = await db.collection('pages').findOne({ name: pageData.name });
      if (page) {
        console.log(`   ✅ ${pageData.displayName} (${pageData.route})`);
        console.log(`      ID: ${page._id.toString()}`);
        console.log(`      Parent: ${page.parentPage?.toString() || 'none'}`);
        console.log(`      Actions: ${page.availableActions?.join(', ') || 'none'}`);
      } else {
        console.log(`   ❌ ${pageData.displayName} - NOT FOUND`);
      }
      console.log('');
    }

    // Check 2: Permissions exist
    console.log('2️⃣  Checking Permissions Collection');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const pageData of NEW_LEAVE_PAGES) {
      const page = await db.collection('pages').findOne({ name: pageData.name });
      if (page) {
        const permission = await db.collection('permissions').findOne({ pageId: page._id });
        if (permission) {
          console.log(`   ✅ Permission for ${pageData.displayName}`);
          console.log(`      ID: ${permission._id.toString()}`);
          console.log(`      Module: ${permission.module || 'none'}`);
        } else {
          console.log(`   ❌ Permission for ${pageData.displayName} - NOT FOUND`);
        }
      }
      console.log('');
    }

    // Check 3: Module includes pages
    console.log('3️⃣  Checking HRM Module');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const hrmModule = await db.collection('modules').findOne({ name: 'hrm' });
    if (hrmModule) {
      console.log(`   ✅ HRM Module found (${hrmModule.pages.length} pages total)\n`);

      for (const pageData of NEW_LEAVE_PAGES) {
        const page = await db.collection('pages').findOne({ name: pageData.name });
        if (page) {
          const isInModule = hrmModule.pages.some(p => p.pageId.toString() === page._id.toString());
          if (isInModule) {
            console.log(`   ✅ ${pageData.displayName} - IN MODULE`);
          } else {
            console.log(`   ❌ ${pageData.displayName} - NOT IN MODULE`);
          }
        }
      }
    } else {
      console.log('   ❌ HRM Module NOT FOUND');
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let pagesOk = 0;
    let permissionsOk = 0;
    let moduleOk = 0;

    for (const pageData of NEW_LEAVE_PAGES) {
      const page = await db.collection('pages').findOne({ name: pageData.name });
      if (page) pagesOk++;
      const permission = await db.collection('permissions').findOne({ pageId: page?._id });
      if (permission) permissionsOk++;
      if (page && hrmModule?.pages.some(p => p.pageId.toString() === page._id.toString())) moduleOk++;
    }

    console.log(`Pages Created:      ${pagesOk}/${NEW_LEAVE_PAGES.length} ✅`);
    console.log(`Permissions Created: ${permissionsOk}/${NEW_LEAVE_PAGES.length} ✅`);
    console.log(`Module Updated:      ${moduleOk}/${NEW_LEAVE_PAGES.length} ✅`);

    if (pagesOk === NEW_LEAVE_PAGES.length && permissionsOk === NEW_LEAVE_PAGES.length && moduleOk === NEW_LEAVE_PAGES.length) {
      console.log('\n✅ ALL CHECKS PASSED! New leave pages are fully configured.');
    } else {
      console.log('\n⚠️ SOME CHECKS FAILED! Please review the output above.');
    }

    // Show all leave pages in hierarchy
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ALL LEAVE PAGES IN HIERARCHY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const allLeavePages = await db.collection('pages').find({
      $or: [
        { name: { $regex: 'leave', $options: 'i' } },
        { displayName: { $regex: 'leave', $options: 'i' } }
      ]
    }).sort({ sortOrder: 1 }).toArray();

    for (const page of allLeavePages) {
      const indent = '   '.repeat(page.level || 0);
      const icon = page.isMenuGroup ? '📁' : '📄';
      console.log(`${indent}${icon} ${page.displayName || page.name} (${page.route || 'no-route'})`);
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
