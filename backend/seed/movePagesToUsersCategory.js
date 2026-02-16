/**
 * Move Pages from Main Menu to Users & Permissions Category
 * Moves: /super-admin/pages
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== MOVING PAGES TO USERS & PERMISSIONS CATEGORY ===');
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

  // Pages to move
  const pagesToMove = [
    { name: 'super-admin.pages', displayName: 'Pages' }
  ];

  let movedCount = 0;
  let notFoundCount = 0;

  for (const pageInfo of pagesToMove) {
    console.log(`--- Processing: ${pageInfo.displayName} (${pageInfo.name}) ---`);

    const page = await Page.findOne({ name: pageInfo.name }).lean();

    if (!page) {
      console.log(`  ❌ Page not found`);
      notFoundCount++;
      continue;
    }

    const currentCategoryId = page.category?.toString();
    const currentCategoryName = currentCategoryId === categoryI._id.toString() ? 'Main Menu (I)' :
                               currentCategoryId === categoryII._id.toString() ? 'Users & Permissions (II)' :
                               'Unknown';

    console.log(`  Current category: ${currentCategoryName}`);
    console.log(`  Current category ID: ${currentCategoryId}`);

    if (currentCategoryId === categoryII._id.toString()) {
      console.log(`  ✓ Already in Users & Permissions category`);
      continue;
    }

    // Update page to Category II
    await Page.findByIdAndUpdate(page._id, {
      category: categoryII._id
    });

    console.log(`  ✓ Moved to Users & Permissions category`);
    movedCount++;
    console.log('');
  }

  console.log('=== SUMMARY ===');
  console.log(`Pages moved: ${movedCount}`);
  console.log(`Pages not found: ${notFoundCount}`);

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
