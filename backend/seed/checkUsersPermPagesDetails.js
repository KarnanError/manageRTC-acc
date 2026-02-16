/**
 * Check Users & Permissions Pages Details
 * Verifies why pages might not appear in hierarchical structure
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== CHECKING USERS & PERMISSIONS PAGES DETAILS ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // 1. Get Users & Permissions category
  const usersPermCategory = await PageCategory.findOne({
    $or: [
      { identifier: 'ii' },
      { label: 'users-permissions' },
      { displayName: 'Users & Permissions' }
    ]
  }).lean();

  if (!usersPermCategory) {
    console.log('   ❌ Users & Permissions category NOT FOUND!');
    console.log('   Available categories:');
    const allCategories = await PageCategory.find({}).lean();
    allCategories.forEach(c => {
      console.log(`      - ${c.identifier}. ${c.displayName}`);
    });
    await mongoose.disconnect();
    return;
  }

  console.log('1. USERS & PERMISSIONS CATEGORY');
  console.log(`   Category ID: ${usersPermCategory._id}`);
  console.log(`   Identifier: ${usersPermCategory.identifier}`);
  console.log(`   Display Name: ${usersPermCategory.displayName}`);
  console.log('');

  // 2. Check admin.users page
  console.log('2. ADMIN.USERS PAGE DETAILS');
  const usersPage = await Page.findOne({ name: 'admin.users' }).lean();

  if (!usersPage) {
    console.log('   ❌ Page NOT FOUND!');
  } else {
    console.log(`   _id: ${usersPage._id}`);
    console.log(`   name: ${usersPage.name}`);
    console.log(`   displayName: ${usersPage.displayName}`);
    console.log(`   route: ${usersPage.route}`);
    console.log(`   category: ${usersPage.category}`);
    console.log(`   category (toString): ${usersPage.category?.toString()}`);
    console.log(`   parentPage: ${usersPage.parentPage}`);
    console.log(`   parentPage (toString): ${usersPage.parentPage?.toString()}`);
    console.log(`   isMenuGroup: ${usersPage.isMenuGroup}`);
    console.log(`   isActive: ${usersPage.isActive}`);
    console.log(`   sortOrder: ${usersPage.sortOrder}`);
  }
  console.log('');

  // 3. Check admin.roles-permissions page
  console.log('3. ADMIN.ROLES-PERMISSIONS PAGE DETAILS');
  const rolesPage = await Page.findOne({ name: 'admin.roles-permissions' }).lean();

  if (!rolesPage) {
    console.log('   ❌ Page NOT FOUND!');
  } else {
    console.log(`   _id: ${rolesPage._id}`);
    console.log(`   name: ${rolesPage.name}`);
    console.log(`   displayName: ${rolesPage.displayName}`);
    console.log(`   route: ${rolesPage.route}`);
    console.log(`   category: ${rolesPage.category}`);
    console.log(`   category (toString): ${rolesPage.category?.toString()}`);
    console.log(`   parentPage: ${rolesPage.parentPage}`);
    console.log(`   parentPage (toString): ${rolesPage.parentPage?.toString()}`);
    console.log(`   isMenuGroup: ${rolesPage.isMenuGroup}`);
    console.log(`   isActive: ${rolesPage.isActive}`);
    console.log(`   sortOrder: ${rolesPage.sortOrder}`);
  }
  console.log('');

  // 4. Check what the hierarchical query would return
  console.log('4. TESTING HIERARCHICAL QUERY');

  const directChildrenQuery = await Page.find({
    category: usersPermCategory._id,
    parentPage: null,
    isMenuGroup: false,
    isActive: true,
  }).lean();

  console.log(`   Query: category=${usersPermCategory._id}, parentPage=null, isMenuGroup=false, isActive=true`);
  console.log(`   Results: ${directChildrenQuery.length} pages`);

  directChildrenQuery.forEach(page => {
    console.log(`      - ${page.displayName} (${page.name})`);
    console.log(`        parentPage: ${page.parentPage || 'null'}`);
  });

  // 5. Check if pages match the criteria
  console.log('\n5. CRITERIA CHECK');

  if (!usersPage || !rolesPage) {
    console.log('   ❌ Cannot check criteria - pages not found');
    await mongoose.disconnect();
    return;
  }

  const usersMatches = usersPage.category?.toString() === usersPermCategory._id.toString() &&
                     usersPage.parentPage === null &&
                     usersPage.isMenuGroup === false &&
                     usersPage.isActive === true;

  console.log(`   admin.users matches criteria: ${usersMatches}`);
  if (!usersMatches) {
    console.log(`     Issues:`);
    if (usersPage.category?.toString() !== usersPermCategory._id.toString()) {
      console.log(`       - Category mismatch: ${usersPage.category} != ${usersPermCategory._id}`);
    }
    if (usersPage.parentPage !== null) {
      console.log(`       - parentPage is not null: ${usersPage.parentPage}`);
    }
    if (usersPage.isMenuGroup !== false) {
      console.log(`       - isMenuGroup is not false: ${usersPage.isMenuGroup}`);
    }
    if (usersPage.isActive !== true) {
      console.log(`       - isActive is not true: ${usersPage.isActive}`);
    }
  }

  const rolesMatches = rolesPage.category?.toString() === usersPermCategory._id.toString() &&
                     rolesPage.parentPage === null &&
                     rolesPage.isMenuGroup === false &&
                     rolesPage.isActive === true;

  console.log(`   admin.roles-permissions matches criteria: ${rolesMatches}`);
  if (!rolesMatches) {
    console.log(`     Issues:`);
    if (rolesPage.category?.toString() !== usersPermCategory._id.toString()) {
      console.log(`       - Category mismatch: ${rolesPage.category} != ${usersPermCategory._id}`);
    }
    if (rolesPage.parentPage !== null) {
      console.log(`       - parentPage is not null: ${rolesPage.parentPage}`);
    }
    if (rolesPage.isMenuGroup !== false) {
      console.log(`       - isMenuGroup is not false: ${rolesPage.isMenuGroup}`);
    }
    if (rolesPage.isActive !== true) {
      console.log(`       - isActive is not true: ${rolesPage.isActive}`);
    }
  }

  // 6. If issues found, provide fix
  if (!usersMatches || !rolesMatches) {
    console.log('\n6. FIX NEEDED');
    console.log('   → Run: node backend/seed/fixUsersPermPagesParentPage.js');
  }

  await mongoose.disconnect();
  console.log('\n✓ Check complete!');
}

main().catch(console.error);
