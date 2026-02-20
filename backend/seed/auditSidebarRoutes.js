/**
 * Audit & Fix Sidebar Route Mismatches
 *
 * Cross-references Page.route values in MongoDB against all_routes.tsx values.
 * The normalization in CompanyPagesContext handles the missing-slash issue,
 * but a handful of pages have genuine name/path mismatches that need DB fixes.
 *
 * Usage:
 *   node backend/seed/auditSidebarRoutes.js           -- report only
 *   node backend/seed/auditSidebarRoutes.js --fix     -- apply fixes
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

// ─────────────────────────────────────────────
// KNOWN MISMATCHES  (DB route  →  correct route matching all_routes.tsx)
// Source: cross-reference of completePagesHierarchical.seed.js vs all_routes.tsx
// ─────────────────────────────────────────────
const ROUTE_FIXES = [
  {
    pageName: 'crm.activities',
    currentRoute: 'activities',
    correctRoute: '/',               // all_routes.activities = '/'
    reason: "CRM Activities is the root '/' page in all_routes.tsx",
  },
  {
    pageName: 'admin.activities',
    currentRoute: 'activities',
    correctRoute: 'activity',        // all_routes.activity = '/activity'
    reason: "Admin Activities uses '/activity' in all_routes.tsx",
  },
  {
    pageName: 'hrm.performance-appraisal',
    currentRoute: 'performance/performance-appraisal',
    correctRoute: 'preformance/performance-appraisal',  // deliberate typo kept from all_routes
    reason: "all_routes.performanceAppraisal has a typo: '/preformance/' not '/performance/'",
  },
  {
    pageName: 'recruitment.referrals',
    currentRoute: 'referrals',
    correctRoute: 'refferals',       // all_routes.refferal = '/refferals'
    reason: "all_routes.tsx uses '/refferals' (double-f) not '/referrals'",
  },
  {
    pageName: 'pages.terms-conditions',
    currentRoute: 'termscondition',
    correctRoute: 'terms-condition', // all_routes.termscondition = '/terms-condition'
    reason: "all_routes uses '/terms-condition' (with hyphen) not 'termscondition'",
  },
];

// ─────────────────────────────────────────────
// NORMALIZE helper (same logic as CompanyPagesContext)
// ─────────────────────────────────────────────
const normalize = (route) =>
  route && !route.startsWith('/') ? `/${route}` : route;

async function run() {
  const applyFix = process.argv.includes('--fix');

  await mongoose.connect(uri, { dbName });
  console.log('🔍 Auditing sidebar route mismatches...\n');

  // ─── 1. Report leading-slash state ──────────────────────────────────────
  const total = await Page.countDocuments({ isActive: true, route: { $ne: null } });
  const missingSlash = await Page.countDocuments({
    isActive: true,
    route: { $exists: true, $ne: null },
    $expr: { $ne: [{ $substrCP: ['$route', 0, 1] }, '/'] },
  });

  console.log(`📊 Route slash audit:`);
  console.log(`   Total pages with routes : ${total}`);
  console.log(`   Without leading '/'     : ${missingSlash}`);
  console.log(`   (The CompanyPagesContext normalizes these automatically)\n`);

  // ─── 2. Check known name mismatches ─────────────────────────────────────
  console.log('─'.repeat(70));
  console.log('🚨 KNOWN ROUTE MISMATCHES (require DB update to fix)\n');

  let fixable = 0;
  for (const fix of ROUTE_FIXES) {
    const page = await Page.findOne({ name: fix.pageName }).lean();

    if (!page) {
      console.log(`  ⚠️  ${fix.pageName} — page NOT FOUND in DB (may not be seeded)`);
      continue;
    }

    const currentNorm = normalize(page.route);
    const correctNorm = normalize(fix.correctRoute);
    const alreadyFixed = page.route === fix.correctRoute || currentNorm === correctNorm;

    if (alreadyFixed) {
      console.log(`  ✅ ${fix.pageName} — already correct (${page.route})`);
    } else {
      fixable++;
      console.log(`  ❌ ${fix.pageName}`);
      console.log(`       DB route    : "${page.route}" → normalized "${currentNorm}"`);
      console.log(`       Correct     : "${fix.correctRoute}" → normalized "${correctNorm}"`);
      console.log(`       Why         : ${fix.reason}`);
      console.log('');
    }
  }

  // ─── 3. Apply fixes if --fix flag provided ───────────────────────────────
  if (applyFix) {
    if (fixable === 0) {
      console.log('\n✅ No fixes needed — all routes are already correct.');
    } else {
      console.log('\n─'.repeat(70));
      console.log('🔧 Applying route fixes...\n');

      for (const fix of ROUTE_FIXES) {
        const page = await Page.findOne({ name: fix.pageName });
        if (!page) continue;

        const currentNorm = normalize(page.route);
        const correctNorm = normalize(fix.correctRoute);
        if (page.route === fix.correctRoute || currentNorm === correctNorm) continue;

        const oldRoute = page.route;
        page.route = fix.correctRoute;
        await page.save();
        console.log(`  ✅ Fixed ${fix.pageName}: "${oldRoute}" → "${fix.correctRoute}"`);
      }

      console.log('\n🎉 Done! Re-run without --fix to verify.');
    }
  } else if (fixable > 0) {
    console.log('\n─'.repeat(70));
    console.log(`\n💡 ${fixable} mismatch(es) found.`);
    console.log('   Run with --fix to apply corrections:');
    console.log('   node backend/seed/auditSidebarRoutes.js --fix\n');
    console.log('   NOTE: The CompanyPagesContext already normalizes leading slashes,');
    console.log('   so only the items above (genuine name/path differences) need fixing.');
  } else {
    console.log('\n✅ All known mismatches are already resolved!');
  }

  // ─── 4. Dump all DB routes for manual inspection ────────────────────────
  const allPages = await Page.find(
    { isActive: true, route: { $ne: null } },
    'name route isMenuGroup'
  ).lean();

  console.log('\n─'.repeat(70));
  console.log(`\n📋 All ${allPages.length} active pages with routes:\n`);
  for (const p of allPages.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`   ${p.name.padEnd(45)} ${p.route}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
