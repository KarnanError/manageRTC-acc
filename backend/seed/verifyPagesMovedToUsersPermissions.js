/**
 * Verify Pages Moved to Users & Permissions
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

  console.log('=== VERIFYING PAGES MOVED TO USERS & PERMISSIONS ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get categories
  const categoryI = await PageCategory.findOne({ identifier: 'I' }).lean();
  const categoryII = await PageCategory.findOne({ identifier: 'II' }).lean();

  console.log('--- CATEGORIES ---');
  console.log('Category I (Main Menu):', categoryI.displayName);
  console.log('Category II (Users & Permissions):', categoryII.displayName);
  console.log('');

  // Category I (Main Menu) pages - should now have 5 pages (without Pages)
  const categoryIPages = await Page.find({
    category: categoryI._id,
    isActive: true,
    isMenuGroup: false,
  }).sort({ sortOrder: 1 }).lean();

  console.log('--- CATEGORY I (Main Menu) PAGES ---');
  console.log(`Total: ${categoryIPages.length} pages`);
  categoryIPages.forEach(p => {
    console.log(`  ✓ ${p.displayName} (${p.name})`);
  });
  console.log('');

  // Category II (Users & Permissions) pages - should now have 4 pages (with Pages)
  const categoryIIPages = await Page.find({
    category: categoryII._id,
    isActive: true,
    isMenuGroup: false,
  }).sort({ sortOrder: 1 }).lean();

  console.log('--- CATEGORY II (Users & Permissions) PAGES ---');
  console.log(`Total: ${categoryIIPages.length} pages`);
  categoryIIPages.forEach(p => {
    console.log(`  ✓ ${p.displayName} (${p.name})`);
  });
  console.log('');

  // Verify specific pages
  console.log('--- VERIFICATION ---');

  const pagesPage = await Page.findOne({ name: 'super-admin.pages' }).lean();
  const pagesCategory = pagesPage?.category?.toString();
  const isInCategoryI = pagesCategory === categoryI._id.toString();
  const isInCategoryII = pagesCategory === categoryII._id.toString();

  console.log(`Pages (/super-admin/pages):`);
  console.log(`  → In Main Menu (I)? ${isInCategoryI ? '❌ WRONG - Should be in Users & Permissions' : '✓ NO (Correct)'}`);
  console.log(`  → In Users & Permissions (II)? ${isInCategoryII ? '✓ YES (Correct)' : '❌ NOT FOUND'}`);
  console.log('');

  // Expected structure
  console.log('--- EXPECTED STRUCTURE ---');
  console.log('Main Menu (I): 5 pages');
  console.log('  1. Dashboard');
  console.log('  2. Companies');
  console.log('  3. Subscriptions');
  console.log('  4. Packages');
  console.log('  5. Modules');
  console.log('');
  console.log('Users & Permissions (II): 4 pages');
  console.log('  1. Users');
  console.log('  2. Roles & Permissions');
  console.log('  3. Permission');
  console.log('  4. Pages ← Moved here');
  console.log('');

  // Final result
  const allCorrect = isInCategoryII &&
                     categoryIIPages.some(p => p.name === 'super-admin.pages') &&
                     !categoryIPages.some(p => p.name === 'super-admin.pages') &&
                     categoryIPages.length === 5 &&
                     categoryIIPages.length === 4;

  if (allCorrect) {
    console.log('✅ ALL CHECKS PASSED - Structure is correct!');
  } else {
    console.log('❌ SOME CHECKS FAILED - Please review');
    if (categoryIPages.length !== 5) {
      console.log(`   - Main Menu has ${categoryIPages.length} pages (expected 5)`);
    }
    if (categoryIIPages.length !== 4) {
      console.log(`   - Users & Permissions has ${categoryIIPages.length} pages (expected 4)`);
    }
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
