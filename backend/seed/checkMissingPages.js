/**
 * Check for Missing Pages in Users & Permissions Category
 * Analyzes why /users and /roles-permissions are missing
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

  console.log('=== CHECKING MISSING PAGES ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // 1. Get Users & Permissions category
  console.log('1. FINDING USERS & PERMISSIONS CATEGORY');
  const usersPermCategory = await PageCategory.findOne({
    $or: [
      { identifier: 'ii' },
      { label: 'users-permissions' },
      { displayName: 'Users & Permissions' }
    ]
  }).lean();

  if (!usersPermCategory) {
    console.log('   ❌ Users & Permissions category NOT FOUND!');
    console.log('   → Categories available:');
    const allCategories = await PageCategory.find({}).lean();
    allCategories.forEach(c => {
      console.log(`      - ${c.identifier}. ${c.displayName} (${c.label})`);
    });
    return;
  }

  console.log(`   ✓ Found: ${usersPermCategory.identifier}. ${usersPermCategory.displayName}`);
  console.log(`   Category ID: ${usersPermCategory._id}`);
  console.log('');

  // 2. Check for expected pages
  console.log('2. CHECKING FOR EXPECTED PAGES');
  const expectedPages = [
    { name: 'users', displayName: 'Users', route: 'users' },
    { name: 'roles-permissions', displayName: 'Roles & Permissions', route: 'roles-permissions' }
  ];

  for (const expected of expectedPages) {
    console.log(`\n   Checking: ${expected.displayName} (${expected.name})`);

    // Find by name or route
    const pageByName = await Page.findOne({ name: expected.name }).lean();
    const pageByRoute = await Page.findOne({ route: expected.route }).lean();

    if (pageByName) {
      console.log(`   ✓ Found by name: ${pageByName.name}`);
      console.log(`     Display: ${pageByName.displayName}`);
      console.log(`     Route: ${pageByName.route || 'none'}`);
      console.log(`     Category: ${pageByName.category || 'none'}`);
      console.log(`     Active: ${pageByName.isActive}`);
      console.log(`     Is Menu Group: ${pageByName.isMenuGroup}`);

      // Check if it's in the correct category
      if (pageByName.category && pageByName.category.toString() !== usersPermCategory._id.toString()) {
        console.log(`   ⚠️  WARNING: Page is in different category!`);
        console.log(`     Expected: ${usersPermCategory._id}`);
        console.log(`     Actual: ${pageByName.category}`);
      } else if (!pageByName.category) {
        console.log(`   ⚠️  WARNING: Page has no category assigned!`);
      }
    } else if (pageByRoute) {
      console.log(`   ✓ Found by route: ${pageByRoute.route}`);
      console.log(`     Name: ${pageByRoute.name}`);
      console.log(`     Display: ${pageByRoute.displayName}`);
      console.log(`     Category: ${pageByRoute.category || 'none'}`);
      console.log(`     Active: ${pageByRoute.isActive}`);
    } else {
      console.log(`   ❌ NOT FOUND in database!`);
    }

    // Check for permission
    const permission = await Permission.findOne({
      $or: [
        { module: expected.name },
        { module: `admin.${expected.name}` },
        { displayName: expected.displayName }
      ]
    }).lean();

    if (permission) {
      console.log(`   ✓ Permission exists: ${permission.module || permission.displayName}`);
      console.log(`     Page ID: ${permission.pageId || 'none'}`);
      console.log(`     Active: ${permission.isActive}`);
    } else {
      console.log(`   ❌ Permission NOT FOUND!`);
    }
  }

  // 3. List all pages in Users & Permissions category
  console.log('\n\n3. ALL PAGES IN USERS & PERMISSIONS CATEGORY');
  const categoryPages = await Page.find({
    category: usersPermCategory._id
  }).lean();

  if (categoryPages.length === 0) {
    console.log('   ❌ No pages found in this category!');
  } else {
    console.log(`   Found ${categoryPages.length} pages:`);
    categoryPages.forEach(page => {
      console.log(`      - ${page.displayName} (${page.name})`);
      console.log(`        Route: ${page.route || 'none'}`);
      console.log(`        Menu Group: ${page.isMenuGroup ? `Yes (L${page.menuGroupLevel})` : 'No'}`);
      console.log(`        Active: ${page.isActive}`);
    });
  }

  // 4. Summary and recommendations
  console.log('\n\n4. SUMMARY & RECOMMENDATIONS');

  const usersPage = await Page.findOne({ name: 'users' }).lean();
  const rolesPage = await Page.findOne({ name: 'roles-permissions' }).lean();

  if (!usersPage || !rolesPage) {
    console.log('   ❌ Missing pages detected!');
    console.log('   → Run: node backend/seed/addMissingUsersPermPages.js');
  } else if (!usersPage.category || !rolesPage.category) {
    console.log('   ⚠️  Pages exist but not assigned to category!');
    console.log('   → Run: node backend/seed/addMissingUsersPermPages.js');
  } else {
    console.log('   ✓ Pages exist and are assigned to category');
  }

  await mongoose.disconnect();
  console.log('\n✓ Check complete!');
}

main().catch(console.error);
