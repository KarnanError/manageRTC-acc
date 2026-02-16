/**
 * Validate Pages Routes
 *
 * This script checks which pages still have null routes
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

async function validateRoutes() {
  await mongoose.connect(uri, { dbName });

  console.log('🔍 Validating page routes...\n');

  // Find all pages with null or empty routes
  const pagesWithoutRoutes = await Page.find({
    $or: [
      { route: null },
      { route: '' }
    ]
  }).select('name displayName route isMenuGroup menuGroupLevel').lean();

  if (pagesWithoutRoutes.length === 0) {
    console.log('✅ All pages have routes!\n');
  } else {
    console.log(`⚠️  Found ${pagesWithoutRoutes.length} pages without routes:\n`);
    pagesWithoutRoutes.forEach(page => {
      const menuInfo = page.isMenuGroup
        ? `(L${page.menuGroupLevel} menu group)`
        : '(regular page)';
      console.log(`  - ${page.displayName} (${page.name}) ${menuInfo}`);
    });
  }

  // Count total pages
  const totalPages = await Page.countDocuments();
  const pagesWithRoutes = await Page.countDocuments({
    route: { $ne: null },
    route: { $ne: '' }
  });

  console.log('\n📊 SUMMARY:');
  console.log(`  Total Pages: ${totalPages}`);
  console.log(`  Pages with Routes: ${pagesWithRoutes}`);
  console.log(`  Pages without Routes: ${pagesWithoutRoutes.length}`);
  console.log(`  Coverage: ${((pagesWithRoutes / totalPages) * 100).toFixed(1)}%`);

  await mongoose.disconnect();
}

validateRoutes().catch(console.error);
