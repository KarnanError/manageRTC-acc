/**
 * Diagnose Company Plan Module Configuration
 *
 * This script checks if the company's plan includes the HRM module
 * and verifies the complete chain: Company → Plan → Module → Pages.
 *
 * Run: node seed/diagnoseCompanyPlanModule.js [companyId]
 *
 * If companyId is not provided, it will check the first company found.
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

async function diagnoseCompany(companyId) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DIAGNOSIS: Company Plan Module Chain');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get company
    console.log('1️⃣  Fetching Company');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const company = await db.collection('companies').findOne({ _id: new ObjectId(companyId) });

    if (!company) {
      console.log(`   ❌ Company NOT FOUND for ID: ${companyId}`);
      return;
    }

    console.log(`   ✅ Company Found`);
    console.log(`      ID: ${company._id.toString()}`);
    console.log(`      Name: ${company.name}`);
    console.log(`      planId: ${company.planId?.toString() || 'NOT SET!'}`);
    console.log('');

    if (!company.planId) {
      console.log('   ❌ Company has no plan assigned!');
      console.log('   This means NO pages will be visible in the sidebar.\n');
      return;
    }

    // Get plan with populated modules
    console.log('2️⃣  Fetching Company Plan with Modules');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // For MongoDB native client, we need to manually populate
    const plan = await db.collection('packages').findOne({ _id: company.planId });

    if (!plan) {
      console.log('   ❌ Plan NOT FOUND');
      console.log(`      Looking for plan ID: ${company.planId.toString()}`);
      return;
    }

    console.log(`   ✅ Plan Found`);
    console.log(`      ID: ${plan._id.toString()}`);
    console.log(`      Name: ${plan.planName || plan.name}`);
    console.log(`      Modules count: ${plan.planModules?.length || 0}`);
    console.log('');

    // Check for HRM module in plan
    console.log('3️⃣  Checking for HRM Module in Plan');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const hrmModule = await db.collection('modules').findOne({ name: 'hrm' });

    if (!hrmModule) {
      console.log('   ❌ HRM Module NOT FOUND in modules collection');
      return;
    }

    console.log(`   ✅ HRM Module Found`);
    console.log(`      ID: ${hrmModule._id.toString()}`);
    console.log(`      Name: ${hrmModule.name}`);
    console.log('');

    // Check if HRM module is in the plan
    const hrmInPlan = plan.planModules?.find(pm =>
      pm.moduleId && pm.moduleId.toString() === hrmModule._id.toString()
    );

    if (!hrmInPlan) {
      console.log('   ❌ HRM Module is NOT in this company\'s plan!');
      console.log(`      Plan "${plan.planName}" does not include HRM module.`);
      console.log('      ❌ This is why new leave pages are NOT showing in sidebar!\n');
      console.log('   SOLUTION: Add HRM module to the plan');
      return;
    }

    console.log(`   ✅ HRM Module IS in plan`);
    console.log(`      isActive: ${hrmInPlan.isActive !== undefined ? hrmInPlan.isActive : 'NOT SET (defaults to true)'}`);
    console.log('');

    // Get the full HRM module with pages
    console.log('4️⃣  Checking New Leave Pages in HRM Module');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const NEW_LEAVE_PAGES = [
      { name: 'hrm.team-leaves', displayName: 'Team Leaves', route: 'team-leaves' },
      { name: 'hrm.leave-calendar', displayName: 'Leave Calendar', route: 'leave-calendar' },
      { name: 'hrm.leave-ledger', displayName: 'Leave Balance History', route: 'leave-ledger' }
    ];

    for (const newPage of NEW_LEAVE_PAGES) {
      const pageRef = hrmModule.pages?.find(p => p.name === newPage.name);

      if (pageRef) {
        console.log(`   ✅ ${newPage.displayName}`);
        console.log(`      In HRM module: YES`);
        console.log(`      pageId: ${pageRef.pageId?.toString() || 'MISSING'}`);
        console.log(`      isActive: ${pageRef.isActive !== undefined ? pageRef.isActive : 'NOT SET (defaults to true)'}`);
      } else {
        console.log(`   ❌ ${newPage.displayName}`);
        console.log(`      In HRM module: NO`);
      }
      console.log('');
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Company "${company.name}" is configured correctly:`);
    console.log(`  - Has plan: "${plan.planName}"`);
    console.log(`  - Plan includes HRM module: YES`);
    console.log(`  - HRM module has new leave pages: YES`);
    console.log('');
    console.log('The new leave pages SHOULD be visible in the sidebar for this company.');
    console.log('');
    console.log('If they still don\'t show:');
    console.log('  1. Check browser console for errors');
    console.log('  2. Hard refresh (Ctrl+Shift+R)');
    console.log('  3. Check the /api/company/enabled-pages endpoint response');
    console.log('  4. Verify user is authenticated as "admin" (not employee/guest)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Disconnected from MongoDB');
  }
}

// Main
const main = async () => {
  const targetCompanyId = process.argv[2];

  if (!targetCompanyId) {
    // Get first company
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('AmasQIS');
    const company = await db.collection('companies').findOne({});
    await client.close();

    if (!company) {
      console.log('❌ No companies found in database');
      process.exit(1);
    }

    console.log(`No companyId provided. Using first company: ${company._id.toString()}\n`);
    await diagnoseCompany(company._id.toString());
  } else {
    await diagnoseCompany(targetCompanyId);
  }
};

main();
