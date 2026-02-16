/**
 * Fix Users & Permissions Pages Category
 * Updates admin.users and admin.roles-permissions to correct category
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import Permission from '../models/rbac/permission.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== FIXING USERS & PERMISSIONS PAGES CATEGORY ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // 1. Get the correct Users & Permissions category
  console.log('1. GETTING CORRECT CATEGORY');
  const correctCategory = await PageCategory.findOne({
    $or: [
      { identifier: 'ii' },
      { label: 'users-permissions' },
      { displayName: 'Users & Permissions' }
    ]
  }).lean();

  if (!correctCategory) {
    console.log('   ❌ Users & Permissions category NOT FOUND!');
    return;
  }

  console.log(`   ✓ Found: ${correctCategory.identifier}. ${correctCategory.displayName}`);
  console.log(`   Category ID: ${correctCategory._id}`);
  console.log('');

  // 2. Find the pages that need to be fixed
  console.log('2. FINDING PAGES TO FIX');
  const pagesToFix = [
    { name: 'admin.users', displayName: 'Users' },
    { name: 'admin.roles-permissions', displayName: 'Roles & Permissions' }
  ];

  let updatedCount = 0;

  for (const pageInfo of pagesToFix) {
    console.log(`\n   Checking: ${pageInfo.displayName} (${pageInfo.name})`);

    const page = await Page.findOne({ name: pageInfo.name }).lean();

    if (!page) {
      console.log(`   ❌ Page NOT FOUND!`);
      continue;
    }

    console.log(`   ✓ Found page: ${page._id}`);
    console.log(`     Current category: ${page.category || 'none'}`);

    // Check if category is wrong
    if (page.category && page.category.toString() !== correctCategory._id.toString()) {
      console.log(`   ⚠️  WRONG CATEGORY! Updating...`);

      // Update the page
      await Page.findByIdAndUpdate(page._id, {
        category: correctCategory._id
      });

      console.log(`   ✓ Updated to category: ${correctCategory._id}`);
      updatedCount++;
    } else if (!page.category) {
      console.log(`   ⚠️  NO CATEGORY! Updating...`);

      // Update the page
      await Page.findByIdAndUpdate(page._id, {
        category: correctCategory._id
      });

      console.log(`   ✓ Updated to category: ${correctCategory._id}`);
      updatedCount++;
    } else {
      console.log(`   ✓ Already in correct category`);
    }

    // Verify the permission
    const permission = await Permission.findOne({ pageId: page._id }).lean();
    if (permission) {
      console.log(`   ✓ Permission exists: ${permission.module}`);
    } else {
      console.log(`   ⚠️  No permission found for this page`);
    }
  }

  console.log(`\n\n3. SUMMARY`);
  console.log(`   Pages updated: ${updatedCount}`);

  if (updatedCount > 0) {
    console.log(`\n   ✓ Fix applied successfully!`);
    console.log(`   → Refresh your browser to see the changes`);
  } else {
    console.log(`\n   ℹ️  No changes needed - pages were already correct`);
  }

  await mongoose.disconnect();
  console.log('\n✓ Fix complete!');
}

main().catch(console.error);
