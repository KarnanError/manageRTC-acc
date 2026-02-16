/**
 * Revert Pages back to Main Menu Category
 * Moves: /super-admin/pages back to Category I (Main Menu)
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== REVERTING PAGES TO MAIN MENU CATEGORY ===');
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
  console.log('Category I (Main Menu):', categoryI.displayName, 'ID:', categoryI._id.toString());
  console.log('Category II (Users & Permissions):', categoryII.displayName, 'ID:', categoryII._id.toString());
  console.log('');

  // Revert /super-admin/pages back to Category I
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

  console.log('--- CURRENT STATE ---');
  console.log('Page:', pagesPage.displayName);
  console.log('Current category:', currentCategoryName);
  console.log('');

  if (currentCategoryId === categoryI._id.toString()) {
    console.log('✓ Already in Main Menu category, no change needed');
  } else {
    // Update page back to Category I
    await Page.findByIdAndUpdate(pagesPage._id, {
      category: categoryI._id
    });
    console.log('✓ Moved back to Main Menu category');
  }

  console.log('');
  console.log('=== SUMMARY ===');
  console.log('Pages page is now in: Main Menu (Category I)');

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
