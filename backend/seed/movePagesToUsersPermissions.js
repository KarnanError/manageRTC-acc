/**
 * Move Pages Management to Users & Permissions
 * Moves: /super-admin/pages from Category I (Main Menu) to Category II (Users & Permissions)
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== MOVING PAGES TO USERS & PERMISSIONS ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get Category I (Main Menu) and Category II (Users & Permissions)
  const categoryI = await PageCategory.findOne({ identifier: 'I' }).lean();
  const categoryII = await PageCategory.findOne({ identifier: 'II' }).lean();

  if (!categoryI || !categoryII) {
    console.log('❌ Categories not found');
    await mongoose.disconnect();
    return;
  }

  console.log('--- CATEGORIES ---');
  console.log('From: Category I (Main Menu) -', categoryI.displayName);
  console.log('To:   Category II (Users & Permissions) -', categoryII.displayName);
  console.log('');

  // Find /super-admin/pages
  const pagesPage = await Page.findOne({ name: 'super-admin.pages' }).lean();

  if (!pagesPage) {
    console.log('❌ Pages page not found');
    await mongoose.disconnect();
    return;
  }

  const currentCategoryId = pagesPage.category?.toString();
  const currentCategoryName = currentCategoryId === categoryI._id.toString() ? 'Main Menu (I)' :
                             currentCategoryId === categoryII._id.toString() ? 'Users & Permissions (II)' :
                             'Unknown';

  console.log('--- PAGE DETAILS ---');
  console.log('Name:', pagesPage.name);
  console.log('Display Name:', pagesPage.displayName);
  console.log('Route:', pagesPage.route);
  console.log('Current Category:', currentCategoryName);
  console.log('');

  if (currentCategoryId === categoryII._id.toString()) {
    console.log('✓ Already in Users & Permissions, no change needed');
  } else {
    // Update page to Category II
    await Page.findByIdAndUpdate(pagesPage._id, {
      category: categoryII._id
    });
    console.log('✓ Moved to Users & Permissions category');
  }

  console.log('');
  console.log('=== SUMMARY ===');
  console.log('Pages Management page is now in: Users & Permissions (Category II)');
  console.log('');
  console.log('Expected structure after move:');
  console.log('Main Menu (I): 5 pages (Dashboard, Companies, Subscriptions, Packages, Modules)');
  console.log('Users & Permissions (II): 4 pages (Users, Roles & Permissions, Permission, Pages)');

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
