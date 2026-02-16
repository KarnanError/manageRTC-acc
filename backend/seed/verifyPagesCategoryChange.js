/**
 * Verify Pages Category Change
 * Confirms that /super-admin/pages is now in Users & Permissions category
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== VERIFYING PAGES CATEGORY CHANGE ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get categories
  const categoryI = await PageCategory.findOne({ identifier: 'I' }).lean();
  const categoryII = await PageCategory.findOne({ identifier: 'II' }).lean();

  console.log('--- CATEGORIES ---');
  console.log('Category I (Main Menu):', categoryI.displayName, 'ID:', categoryI._id.toString());
  console.log('Category II (Users & Permissions):', categoryII.displayName, 'ID:', categoryII._id.toString());
  console.log('');

  // Check /super-admin/pages
  const pagesPage = await Page.findOne({ name: 'super-admin.pages' }).lean();

  if (!pagesPage) {
    console.log('❌ Pages page not found');
    await mongoose.disconnect();
    return;
  }

  const pageCategoryId = pagesPage.category?.toString();
  const categoryName = pageCategoryId === categoryI._id.toString() ? 'Main Menu (I)' :
                       pageCategoryId === categoryII._id.toString() ? 'Users & Permissions (II)' :
                       'Unknown';

  console.log('--- /SUPER-ADMIN/PAGES PAGE ---');
  console.log('Name:', pagesPage.name);
  console.log('Display Name:', pagesPage.displayName);
  console.log('Route:', pagesPage.route);
  console.log('Current Category:', categoryName);
  console.log('Category ID:', pageCategoryId);
  console.log('');

  // Verify result
  if (pageCategoryId === categoryII._id.toString()) {
    console.log('✅ SUCCESS: Pages page is in Users & Permissions category');
  } else {
    console.log('❌ FAILED: Pages page is NOT in Users & Permissions category');
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
