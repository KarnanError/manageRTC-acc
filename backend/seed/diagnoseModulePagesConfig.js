/**
 * Diagnose Module Pages Configuration for New Leave Pages
 *
 * This script checks if the new leave pages are properly configured
 * in the HRM module's pages array with the correct structure.
 *
 * Run: node seed/diagnoseModulePagesConfig.js
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
    console.log('DIAGNOSIS: Module Pages Configuration for New Leave Pages');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get the HRM module
    console.log('1️⃣  Fetching HRM Module');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const hrmModule = await db.collection('modules').findOne({ name: 'hrm' });

    if (!hrmModule) {
      console.log('   ❌ HRM Module NOT FOUND');
      return;
    }

    console.log(`   ✅ HRM Module Found`);
    console.log(`      ID: ${hrmModule._id.toString()}`);
    console.log(`      Name: ${hrmModule.name}`);
    console.log(`      Pages in module: ${hrmModule.pages?.length || 0}`);
    console.log('');

    // Check if new pages are in the module
    console.log('2️⃣  Checking New Leave Pages in Module');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const newPage of NEW_LEAVE_PAGES) {
      // Check if page exists in module pages array
      const pageInModule = hrmModule.pages?.find(p => p.name === newPage.name);

      if (pageInModule) {
        console.log(`   ✅ ${newPage.displayName}`);
        console.log(`      In module: YES`);
        console.log(`      pageId: ${pageInModule.pageId?.toString() || 'MISSING!'}`);
        console.log(`      isActive: ${pageInModule.isActive !== undefined ? pageInModule.isActive : 'NOT SET (defaults to true)'}`);

        // Verify the pageId references the actual page
        if (pageInModule.pageId) {
          const actualPage = await db.collection('pages').findOne({ _id: pageInModule.pageId });
          if (actualPage) {
            console.log(`      Page exists in DB: YES`);
            console.log(`      Page route: ${actualPage.route || 'none'}`);
          } else {
            console.log(`      Page exists in DB: ❌ NO (dangling reference!)`);
          }
        } else {
          console.log(`      ⚠️  WARNING: pageId is missing!`);
        }
      } else {
        console.log(`   ❌ ${newPage.displayName}`);
        console.log(`      In module: NO`);
        console.log(`      ⚠️  This page won't show in the sidebar!`);
      }
      console.log('');
    }

    // Show all HRM pages in the module for reference
    console.log('3️⃣  All HRM Module Pages');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (hrmModule.pages && hrmModule.pages.length > 0) {
      const leavePages = hrmModule.pages.filter(p =>
        p.name?.includes('leave') || p.displayName?.toLowerCase().includes('leave')
      );

      console.log(`   Leave-related pages (${leavePages.length}):\n`);

      for (const pageRef of leavePages.sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''))) {
        const hasPageId = pageRef.pageId ? '✅' : '❌';
        console.log(`   ${hasPageId} ${pageRef.displayName || pageRef.name || '(unnamed)'}`);
        if (pageRef.pageId) {
          console.log(`      pageId: ${pageRef.pageId.toString()}`);
        }
        if (pageRef.isActive === false) {
          console.log(`      ⚠️  INACTIVE (isActive=false)`);
        }
        console.log('');
      }
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const missing = [];
    for (const newPage of NEW_LEAVE_PAGES) {
      const pageInModule = hrmModule.pages?.find(p => p.name === newPage.name);
      if (!pageInModule || !pageInModule.pageId) {
        missing.push(newPage.displayName);
      }
    }

    if (missing.length > 0) {
      console.log('⚠️ ISSUE FOUND:');
      console.log(`   The following new leave pages are missing or incomplete in the HRM module:`);
      for (const name of missing) {
        console.log(`   - ${name}`);
      }
      console.log('\nRun the fix script to add/update these pages in the module.');
    } else {
      console.log('✅ All new leave pages are properly configured in the HRM module.');
      console.log('\nIf sidebar still doesn\'t show them, check:');
      console.log('  1. Company plan includes HRM module');
      console.log('  2. Module is active (isActive=true)');
      console.log('  3. Page refs are active (isActive=true)');
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
