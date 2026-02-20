/**
 * Fix Package (Plan) Module References
 *
 * Converts string moduleId values in planModules[] to proper ObjectId refs
 * by matching against the modules collection by name.
 *
 * Usage:
 *   node backend/seed/fixPackageModuleRefs.js           -- report only
 *   node backend/seed/fixPackageModuleRefs.js --fix     -- apply fixes
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import Module from '../models/rbac/module.schema.js';
import { Plan } from '../models/superadmin/package.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

async function run() {
  const applyFix = process.argv.includes('--fix');
  await mongoose.connect(uri, { dbName });

  console.log('🔍 Auditing planModules[] in packages collection...\n');

  // Load all modules for name-to-ObjectId mapping
  const modules = await Module.find({}).lean();
  const moduleByName = new Map(modules.map(m => [m.name.toLowerCase(), m]));
  console.log(`📦 Found ${modules.length} Module documents: ${modules.map(m => m.name).join(', ')}\n`);

  const plans = await Plan.find({}).lean();
  console.log(`📋 Found ${plans.length} Plan (package) documents\n`);

  let totalFixed = 0;
  let totalBroken = 0;

  for (const plan of plans) {
    console.log(`── Plan: "${plan.planName}"`);
    const updates = [];

    for (let i = 0; i < (plan.planModules || []).length; i++) {
      const pm = plan.planModules[i];
      const isObjectId = mongoose.Types.ObjectId.isValid(pm.moduleId) && pm.moduleId?.toString().length === 24;
      // A valid ObjectId string will be 24 hex chars; short strings like "hrm" won't be
      const isRawString = !isObjectId || pm.moduleId?.length < 24;

      // Check if string can be resolved to a module by name
      const matchByName = moduleByName.get(pm.moduleName?.toLowerCase()) || moduleByName.get(pm.moduleId?.toLowerCase());

      if (isObjectId && !isRawString) {
        // Already an ObjectId — verify it resolves
        const mod = modules.find(m => m._id.toString() === pm.moduleId?.toString());
        if (mod) {
          console.log(`  ✅ "${pm.moduleName}" — ObjectId OK → resolves to module "${mod.name}"`);
        } else {
          console.log(`  ⚠️  "${pm.moduleName}" — ObjectId ${pm.moduleId} does NOT resolve to any module`);
          totalBroken++;
        }
        continue;
      }

      // String ID — needs conversion
      if (matchByName) {
        console.log(`  🔧 "${pm.moduleName}" — string "${pm.moduleId}" → will map to ObjectId ${matchByName._id} ("${matchByName.name}")`);
        updates.push({ index: i, newId: matchByName._id });
      } else {
        console.log(`  ❌ "${pm.moduleName}" — string "${pm.moduleId}" — NO matching module found (module not in DB)`);
        totalBroken++;
      }
    }

    if (updates.length > 0 && applyFix) {
      // Build $set operations for each planModule index
      const setOps = {};
      for (const { index, newId } of updates) {
        setOps[`planModules.${index}.moduleId`] = newId;
      }

      await Plan.updateOne({ _id: plan._id }, { $set: setOps });
      console.log(`  ✅ Applied ${updates.length} fix(es) to "${plan.planName}"`);
      totalFixed += updates.length;
    } else if (updates.length > 0) {
      console.log(`  💡 ${updates.length} fix(es) needed — run with --fix to apply`);
      totalFixed += updates.length;
    }
    console.log('');
  }

  if (!applyFix && totalFixed > 0) {
    console.log('─'.repeat(60));
    console.log(`\n💡 ${totalFixed} fix(es) available. Run with --fix to apply:\n`);
    console.log('   node backend/seed/fixPackageModuleRefs.js --fix\n');
  } else if (applyFix) {
    console.log(`\n🎉 Done! Applied ${totalFixed} fix(es).`);
    console.log('   Re-run without --fix to verify.\n');
  } else {
    console.log('\n✅ All planModule refs are already correct.\n');
  }

  if (totalBroken > 0) {
    console.log(`⚠️  ${totalBroken} entries reference modules that don't exist in the modules collection.`);
    console.log('   These modules need to be seeded first.\n');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
