/**
 * Fix Users & Permissions Pages parentPage Reference
 * Removes parentPage reference so pages become direct children of category
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== FIXING USERS & PERMISSIONS PAGES PARENT PAGE ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // 1. Find the pages
  console.log('1. FINDING PAGES TO FIX');
  const usersPage = await Page.findOne({ name: 'admin.users' }).lean();
  const rolesPage = await Page.findOne({ name: 'admin.roles-permissions' }).lean();

  if (!usersPage || !rolesPage) {
    console.log('   ❌ One or both pages not found!');
    await mongoose.disconnect();
    return;
  }

  console.log(`   Found admin.users: ${usersPage._id}`);
  console.log(`     parentPage: ${usersPage.parentPage || 'none'}`);
  console.log(`   Found admin.roles-permissions: ${rolesPage._id}`);
  console.log(`     parentPage: ${rolesPage.parentPage || 'none'}`);

  // Check if they have the same parent
  if (usersPage.parentPage && usersPage.parentPage.toString() === rolesPage.parentPage?.toString()) {
    const parentPage = await Page.findById(usersPage.parentPage).lean();
    console.log(`\n   Both pages have same parent:`);
    console.log(`     Parent ID: ${parentPage._id}`);
    console.log(`     Parent Name: ${parentPage.name}`);
    console.log(`     Parent Display: ${parentPage.displayName}`);
    console.log(`     Parent Category: ${parentPage.category || 'none'}`);
  }

  // 2. Fix the pages
  console.log(`\n2. FIXING PAGES`);
  let fixedCount = 0;

  // Fix admin.users
  if (usersPage.parentPage) {
    console.log(`\n   Fixing admin.users...`);
    await Page.findByIdAndUpdate(usersPage._id, { parentPage: null });
    console.log(`   ✓ Removed parentPage reference`);
    fixedCount++;
  } else {
    console.log(`\n   admin.users already has no parentPage`);
  }

  // Fix admin.roles-permissions
  if (rolesPage.parentPage) {
    console.log(`\n   Fixing admin.roles-permissions...`);
    await Page.findByIdAndUpdate(rolesPage._id, { parentPage: null });
    console.log(`   ✓ Removed parentPage reference`);
    fixedCount++;
  } else {
    console.log(`\n   admin.roles-permissions already has no parentPage`);
  }

  // 3. Verify the fix
  console.log(`\n3. VERIFYING FIX`);

  const usersPageAfter = await Page.findOne({ name: 'admin.users' }).lean();
  const rolesPageAfter = await Page.findOne({ name: 'admin.roles-permissions' }).lean();

  console.log(`   admin.users parentPage: ${usersPageAfter.parentPage || 'null ✓'}`);
  console.log(`   admin.roles-permissions parentPage: ${rolesPageAfter.parentPage || 'null ✓'}`);

  // 4. Test query
  console.log(`\n4. TESTING HIERARCHICAL QUERY`);

  const usersPermCategory = await PageCategory.findOne({
    identifier: 'ii'
  }).lean();

  const directChildren = await Page.find({
    category: usersPermCategory._id,
    parentPage: null,
    isMenuGroup: false,
    isActive: true,
  }).lean();

  console.log(`   Direct children of Users & Permissions: ${directChildren.length}`);
  directChildren.forEach(page => {
    console.log(`      - ${page.displayName} (${page.name})`);
  });

  // 5. Summary
  console.log(`\n5. SUMMARY`);
  console.log(`   Pages fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log(`\n   ✓ Fix applied successfully!`);
    console.log(`   → Refresh your browser to see the changes`);
  } else {
    console.log(`\n   ℹ️  No changes needed`);
  }

  await mongoose.disconnect();
  console.log('\n✓ Fix complete!');
}

main().catch(console.error);
