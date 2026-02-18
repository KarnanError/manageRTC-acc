/**
 * Diagnose Sidebar Filter Issues
 *
 * Walks the full chain: Companies → Plans → Modules → Pages
 * and reports exactly what is/isn't set at each step.
 *
 * Usage:
 *   node backend/seed/diagnoseSidebarFilter.js
 *   node backend/seed/diagnoseSidebarFilter.js --company <name-or-id>
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import { Company, Plan } from '../models/superadmin/package.schema.js';
import Module from '../models/rbac/module.schema.js';
import '../models/rbac/page.schema.js'; // register Page model for populate

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

const companyFilter = process.argv.includes('--company')
  ? process.argv[process.argv.indexOf('--company') + 1]
  : null;

async function run() {
  await mongoose.connect(uri, { dbName });
  console.log(`\n🔍 Diagnosing sidebar filter chain...\n`);

  // ── 1. Plans overview ─────────────────────────────────────────────────────
  const plans = await Plan.find({}).lean();
  console.log(`📦 PLANS (${plans.length} total)`);
  for (const p of plans) {
    const moduleCount = p.planModules?.length ?? 0;
    const activeCount = p.planModules?.filter(m => m.isActive).length ?? 0;
    const hasObjectId = p.planModules?.filter(m => m.moduleId && mongoose.Types.ObjectId.isValid(m.moduleId)).length ?? 0;
    console.log(`  ▸ "${p.planName}" (${p.status}) — ${moduleCount} planModules, ${activeCount} active, ${hasObjectId} with ObjectId`);
    for (const pm of p.planModules || []) {
      const idType = pm.moduleId ? (mongoose.Types.ObjectId.isValid(pm.moduleId) ? '✅ ObjectId' : '⚠️  string') : '❌ null';
      console.log(`      ${pm.isActive ? '✅' : '❌'} "${pm.moduleName}" — moduleId ${idType} (${pm.moduleId})`);
    }
  }

  // ── 2. Modules overview ───────────────────────────────────────────────────
  const modules = await Module.find({}).lean();
  console.log(`\n🧩 MODULES (${modules.length} total)`);
  for (const m of modules) {
    const pageCount = m.pages?.length ?? 0;
    const activePages = m.pages?.filter(p => p.isActive).length ?? 0;
    const hasPageId = m.pages?.filter(p => p.pageId && mongoose.Types.ObjectId.isValid(p.pageId)).length ?? 0;
    console.log(`  ▸ "${m.name}" (${m.isActive ? 'active' : 'INACTIVE'}) — ${pageCount} pages, ${activePages} active, ${hasPageId} with pageId ObjectId`);
    if (pageCount === 0) {
      console.log(`      ⚠️  NO PAGES assigned to this module!`);
    }
  }

  // ── 3. Companies overview ─────────────────────────────────────────────────
  const query = companyFilter
    ? { $or: [{ name: { $regex: companyFilter, $options: 'i' } }, { _id: mongoose.Types.ObjectId.isValid(companyFilter) ? companyFilter : undefined }].filter(Boolean) }
    : {};
  const companies = await Company.find(query).lean();
  console.log(`\n🏢 COMPANIES (${companies.length}${companyFilter ? ` matching "${companyFilter}"` : ' total'})`);

  for (const c of companies) {
    const hasPlanId = !!c.planId;
    const planIdValid = c.planId && mongoose.Types.ObjectId.isValid(c.planId);
    console.log(`\n  ▸ "${c.name}" (${c.status})`);
    console.log(`      planId   : ${hasPlanId ? (planIdValid ? `✅ ${c.planId}` : `⚠️  invalid: ${c.planId}`) : '❌ null — NO PLAN ASSIGNED'}`);
    if (c.plan_name) console.log(`      plan_name: ${c.plan_name} (legacy)`);

    if (!planIdValid) continue;

    // Load populated plan for this company
    const populated = await Company.findById(c._id).populate({
      path: 'planId',
      populate: {
        path: 'planModules.moduleId',
        populate: { path: 'pages.pageId', select: 'name route isActive' },
      },
    });

    const plan = populated?.planId;
    if (!plan) {
      console.log(`      ❌ planId=${c.planId} does NOT resolve to a Plan document (dangling ref)`);
      continue;
    }
    console.log(`      plan     : "${plan.planName}" (${plan.status})`);

    let totalRoutes = 0;
    for (const pm of plan.planModules || []) {
      const mod = pm.moduleId;
      const active = pm.isActive ? '✅' : '❌';
      if (!mod) {
        console.log(`        ${active} planModule moduleId=${pm.moduleId} — ❌ NOT POPULATED (dangling ref?)`);
        continue;
      }
      const pageCount = (mod.pages || []).filter(p => p.isActive && p.pageId?.isActive).length;
      console.log(`        ${active} "${mod.name}" (${mod.isActive ? 'active' : 'INACTIVE'}) — ${pageCount} enabled pages`);
      if (!pm.isActive) continue;
      if (!mod.isActive) continue;
      for (const pr of mod.pages || []) {
        if (!pr.isActive || !pr.pageId?.isActive) continue;
        console.log(`            📄 ${pr.pageId.name} → route: "${pr.pageId.route}"`);
        totalRoutes++;
      }
    }
    console.log(`      ✅ Total routes that would be enabled: ${totalRoutes}`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Diagnosis complete.\n');
}

run().catch(console.error);
