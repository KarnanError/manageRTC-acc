/**
 * Quick end-to-end test of the companyPages controller logic
 */
import { config } from 'dotenv';
config();
import mongoose from 'mongoose';
import { Company } from '../models/superadmin/package.schema.js';
import '../models/rbac/module.schema.js';
import '../models/rbac/page.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

async function run() {
  await mongoose.connect(uri, { dbName });

  const company = await Company.findOne({ name: 'manageRTC' }).populate({
    path: 'planId',
    populate: {
      path: 'planModules.moduleId',
      populate: { path: 'pages.pageId', select: 'name route isActive' }
    }
  });

  const plan = company?.planId;
  console.log('Company:', company?.name, '| Plan:', plan?.planName);

  if (!plan) {
    console.log('❌ No plan found!');
    await mongoose.disconnect();
    return;
  }

  const routes = new Set();
  const names = new Set();

  for (const pm of plan.planModules || []) {
    if (pm.isActive === false) continue;
    const mod = pm.moduleId;
    if (!mod || mod.isActive === false) continue;
    console.log(`  ✅ Module "${mod.name}" — ${mod.pages?.length} pages`);
    for (const pr of mod.pages || []) {
      if (pr.isActive === false) continue;
      const page = pr.pageId;
      if (!page || page.isActive === false) continue;
      if (page.route) routes.add(page.route);
      if (page.name) names.add(page.name);
    }
  }

  console.log(`\n✅ ${routes.size} routes enabled:`);
  console.log([...routes].join(', '));

  await mongoose.disconnect();
}

run().catch(console.error);
