/**
 * Analyze Current Permissions
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

import Page from '../models/rbac/page.schema.js';
import Permission from '../models/rbac/permission.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function analyze() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE
  });

  // Get pages without routes (menu groups)
  const pagesWithoutRoute = await Page.find({ route: null }).lean();
  console.log('Pages without routes (menu groups):', pagesWithoutRoute.length);
  pagesWithoutRoute.forEach(p => {
    console.log('  - ' + p.displayName);
  });

  // Get all permissions
  const perms = await Permission.find({}).lean();
  console.log('\nTotal permissions:', perms.length);

  // Get permissions with null pageId
  const withNullPageId = perms.filter(p => !p.pageId);
  console.log('Permissions with null pageId:', withNullPageId.length);

  // Get duplicate permissions by module name
  const moduleCounts = {};
  perms.forEach(p => {
    if (p.module) {
      moduleCounts[p.module] = (moduleCounts[p.module] || 0) + 1;
    }
  });
  });
  console.log('\nPermissions by module:');
  Object.entries(moduleCounts).sort((a, b) => b[1] - a[1]).forEach(([module, count]) => console.log(`  ${module}: ${count}`));

  // Get permissions by category
  const byCategory = {};
  perms.forEach(p => {
    if (!byCategory[p.category]) {
      byCategory[p.category] = [];
    }
    byCategory[p.category].push(p);
  });
  });

  console.log('\nPermissions by category:');
  Object.entries(byCategory).sort((a, b) => a[0].localeCompare(a[0], b[0)).forEach(([cat, perms]) => {
    console.log(`  ${cat}: ${perms.length}`);
    if (perms.length <= 5) {
      perms.forEach(p => console.log('   -', p.displayName));
    }
  });

  await mongoose.disconnect();
}

analyze().catch(console.error);
