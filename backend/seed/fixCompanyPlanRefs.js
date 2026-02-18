/**
 * Fix Company planId References
 *
 * For every company that has plan_id (string) but no planId (ObjectId),
 * copies plan_id → planId so Mongoose populate works.
 *
 * Usage:
 *   node backend/seed/fixCompanyPlanRefs.js            -- report only
 *   node backend/seed/fixCompanyPlanRefs.js --fix      -- apply fixes
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import { Company } from '../models/superadmin/package.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

async function run() {
  const applyFix = process.argv.includes('--fix');
  await mongoose.connect(uri, { dbName });
  console.log('🔍 Auditing company → plan links...\n');

  const companies = await Company.find({}).lean();
  console.log(`🏢 Found ${companies.length} company documents\n`);

  let needsFix = 0;
  let alreadyOk = 0;

  for (const c of companies) {
    const hasPlanId = c.planId && mongoose.Types.ObjectId.isValid(c.planId);
    const hasPlanIdLegacy = c.plan_id && mongoose.Types.ObjectId.isValid(c.plan_id);

    if (hasPlanId) {
      console.log(`  ✅ "${c.name}" — planId already set: ${c.planId}`);
      alreadyOk++;
      continue;
    }

    if (!hasPlanIdLegacy) {
      console.log(`  ⚠️  "${c.name}" — no valid plan_id string to migrate from`);
      continue;
    }

    needsFix++;
    console.log(`  🔧 "${c.name}" — plan_id="${c.plan_id}" → will set planId`);

    if (applyFix) {
      await Company.updateOne(
        { _id: c._id },
        { $set: { planId: new mongoose.Types.ObjectId(c.plan_id) } }
      );
      console.log(`     ✅ Fixed`);
    }
  }

  console.log(`\n── Summary ──────────────────────────`);
  console.log(`  Already OK : ${alreadyOk}`);
  console.log(`  Need fix   : ${needsFix}`);

  if (!applyFix && needsFix > 0) {
    console.log(`\n💡 Run with --fix to apply:\n`);
    console.log('   node backend/seed/fixCompanyPlanRefs.js --fix\n');
  } else if (applyFix && needsFix > 0) {
    console.log(`\n🎉 Done! Applied ${needsFix} fix(es).\n`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
