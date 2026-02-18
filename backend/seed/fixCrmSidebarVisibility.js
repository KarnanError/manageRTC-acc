/**
 * Fix CRM Sidebar Visibility
 *
 * Root causes found by diagnoseSidebarFilter.js:
 *
 * ISSUE 1 — Route mismatch:
 *   The CRM module has GRID view pages (contact-grid, companies-grid, deals-grid)
 *   but the sidebar checks LIST view routes (contact-list, companies-list, deals-list).
 *   Fix: Add the list-view pages to the CRM module.
 *
 * ISSUE 2 — Legacy string moduleId in plan:
 *   The plan stores moduleId = "crm" (string), not an ObjectId.
 *   Mongoose populate() can't resolve a string — so CRM module pages are never collected.
 *   Fix: Replace the string "crm" in planModules with the actual CRM module ObjectId.
 *
 * ISSUE 3 — HRM module has wrong CRM pages:
 *   The user added crm.contacts (contact-grid), crm.companies (companies-grid), crm.deals (deals-grid)
 *   to the HRM module, but these are grid-view routes — sidebar uses list-view routes.
 *   Fix: Replace the grid CRM pages in the HRM module with the correct list-view pages.
 *
 * Run: node backend/seed/fixCrmSidebarVisibility.js [--apply]
 * Default: dry-run (shows what would change without modifying DB)
 * Pass --apply to actually apply the changes.
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';
const APPLY = process.argv.includes('--apply');

async function main() {
  await mongoose.connect(uri, { dbName });
  console.log(`✅ Connected to MongoDB: ${dbName}`);
  console.log(`🔧 Mode: ${APPLY ? '⚠️  APPLY (writing to DB)' : '🔍 DRY-RUN (no changes)'}\n`);

  const db = mongoose.connection.db;
  const modulesCol = db.collection('modules');
  const pagesCol = db.collection('pages');
  const packagesCol = db.collection('packages');

  // ── Step 1: Find the CRM module ────────────────────────────────────────────
  const crmModule = await modulesCol.findOne({ name: 'crm' });
  if (!crmModule) {
    console.error('❌ CRM module not found in modules collection');
    process.exit(1);
  }
  console.log(`📦 CRM Module found: _id=${crmModule._id}  pages=${crmModule.pages?.length}`);

  // ── Step 2: Find the list-view CRM pages in pages collection ───────────────
  // These are the routes the sidebar checks
  const listPageNames = ['crm.contact-list', 'crm.companies-list', 'crm.deals-list', 'crm.leads-list'];
  const listPages = await pagesCol.find({ name: { $in: listPageNames } }).toArray();
  console.log(`\n📋 Found ${listPages.length}/${listPageNames.length} list-view CRM pages:`);
  for (const p of listPages) {
    console.log(`   ✅ "${p.name}" → route="${p.route}"`);
  }
  const missingNames = listPageNames.filter(n => !listPages.find(p => p.name === n));
  if (missingNames.length) {
    console.log(`   ❌ Missing pages: ${missingNames.join(', ')}`);
  }

  // ── Step 3: Determine which list pages are already in CRM module ────────────
  const crmModulePageIds = (crmModule.pages || []).map(p => p.pageId?.toString());
  const listPagesToAdd = listPages.filter(p => !crmModulePageIds.includes(p._id.toString()));
  console.log(`\n➕ List-view pages to ADD to CRM module: ${listPagesToAdd.length}`);
  for (const p of listPagesToAdd) {
    console.log(`   + "${p.name}" route="${p.route}"`);
  }

  // ── Step 4: Fix CRM module — add list-view pages ───────────────────────────
  if (listPagesToAdd.length > 0) {
    if (APPLY) {
      const newPageEntries = listPagesToAdd.map((p, i) => ({
        pageId: p._id,
        name: p.name,
        displayName: p.displayName,
        route: p.route,
        icon: p.icon || 'ti ti-file',
        sortOrder: (crmModule.pages?.length || 0) + i,
        isActive: true,
      }));
      await modulesCol.updateOne(
        { _id: crmModule._id },
        { $push: { pages: { $each: newPageEntries } } }
      );
      console.log(`   ✅ Added ${listPagesToAdd.length} list-view pages to CRM module`);
    } else {
      console.log(`   [dry-run] Would add ${listPagesToAdd.length} pages to CRM module`);
    }
  } else {
    console.log(`   ✅ CRM module already has all list-view pages`);
  }

  // ── Step 5: Fix the plan — migrate "crm" string to ObjectId ────────────────
  const plans = await packagesCol.find({}).toArray();
  let fixedPlanCount = 0;

  for (const plan of plans) {
    const planModules = plan.planModules || [];
    let needsUpdate = false;
    const updatedModules = planModules.map(pm => {
      // Check if moduleId is the string "crm" (not an ObjectId)
      const isStringCrm = pm.moduleId && typeof pm.moduleId === 'string' &&
        !mongoose.Types.ObjectId.isValid(pm.moduleId) && pm.moduleId === 'crm';

      if (isStringCrm) {
        needsUpdate = true;
        console.log(`\n📝 Plan "${plan.planName}": Migrating "crm" string → ObjectId ${crmModule._id}`);
        return {
          ...pm,
          moduleId: crmModule._id,
          isActive: pm.isActive !== false, // preserve existing value, default true
        };
      }
      return pm;
    });

    if (needsUpdate) {
      if (APPLY) {
        await packagesCol.updateOne(
          { _id: plan._id },
          { $set: { planModules: updatedModules } }
        );
        console.log(`   ✅ Updated plan "${plan.planName}"`);
        fixedPlanCount++;
      } else {
        console.log(`   [dry-run] Would update plan "${plan.planName}"`);
        fixedPlanCount++;
      }
    }
  }

  if (fixedPlanCount === 0) {
    console.log(`\n   ✅ No plans have legacy "crm" string moduleId — plan already OK or CRM not in plan`);
  }

  // ── Step 6: Fix HRM module — replace grid-view CRM pages with list-view ────
  const hrmModule = await modulesCol.findOne({ name: 'hrm' });
  if (hrmModule) {
    const gridToListMap = {
      'crm.contacts':  'crm.contact-list',
      'crm.companies': 'crm.companies-list',
      'crm.deals':     'crm.deals-list',
      'crm.leads':     'crm.leads-list',
    };

    const hrmPageNames = (hrmModule.pages || []).map(p => p.name);
    const gridPagesInHrm = hrmModule.pages?.filter(p => gridToListMap[p.name]) || [];

    if (gridPagesInHrm.length > 0) {
      console.log(`\n🔄 HRM module has ${gridPagesInHrm.length} grid-view CRM pages to replace:`);
      for (const p of gridPagesInHrm) {
        console.log(`   ❌ "${p.name}" (route: ${p.route}) → will be replaced with "${gridToListMap[p.name]}"`);
      }

      // Build updated pages array: remove grid-view CRM pages, add list-view CRM pages
      const updatedHrmPages = (hrmModule.pages || []).filter(p => !gridToListMap[p.name]);

      // Add list-view CRM pages (if not already present)
      const hrmCurrentPageIds = updatedHrmPages.map(p => p.pageId?.toString());
      for (const gridPage of gridPagesInHrm) {
        const listPageName = gridToListMap[gridPage.name];
        const listPage = await pagesCol.findOne({ name: listPageName });
        if (!listPage) {
          console.log(`   ⚠️  List-view page "${listPageName}" not found in pages collection — skipping`);
          continue;
        }
        if (hrmCurrentPageIds.includes(listPage._id.toString())) {
          console.log(`   ✅ "${listPageName}" already in HRM module — skipping`);
          continue;
        }
        updatedHrmPages.push({
          pageId: listPage._id,
          name: listPage.name,
          displayName: listPage.displayName,
          route: listPage.route,
          icon: listPage.icon || gridPage.icon || 'ti ti-file',
          sortOrder: gridPage.sortOrder,
          isActive: true,
        });
        console.log(`   + Adding "${listPageName}" route="${listPage.route}"`);
      }

      if (APPLY) {
        await modulesCol.updateOne(
          { _id: hrmModule._id },
          { $set: { pages: updatedHrmPages } }
        );
        console.log(`   ✅ Updated HRM module (${hrmModule.pages?.length} → ${updatedHrmPages.length} pages)`);
      } else {
        console.log(`   [dry-run] Would update HRM module (${hrmModule.pages?.length} → ${updatedHrmPages.length} pages)`);
      }
    } else {
      console.log(`\n✅ HRM module has no grid-view CRM pages to replace`);
    }
  }

  // ── Step 7: Verify ──────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`CRM list-view pages to add to CRM module: ${listPagesToAdd.length}`);
  console.log(`Plans with "crm" legacy string to fix:    ${fixedPlanCount}`);
  console.log(`HRM module CRM pages to replace:         ${hrmModule ? (hrmModule.pages?.filter(p => ({ 'crm.contacts': 1, 'crm.companies': 1, 'crm.deals': 1, 'crm.leads': 1 })[p.name])?.length || 0) : 0}`);

  if (!APPLY) {
    console.log(`\n⚠️  DRY-RUN mode — no changes were made.`);
    console.log(`    Run with --apply to apply fixes:\n`);
    console.log(`    node backend/seed/fixCrmSidebarVisibility.js --apply`);
  } else {
    console.log(`\n✅ All fixes applied!`);
    console.log(`   Company users should now see CRM menu after refreshing their browser session.`);
    console.log(`   The sidebar will show: Contacts, Companies, Deals, Leads, Pipeline`);
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
