/**
 * Final Verification of Sidebar Menu Structure
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== FINAL VERIFICATION ===');
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

  // Category I (Main Menu) pages - should have 6 pages including Pages
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

  // Category II (Users & Permissions) pages - should have 3 pages
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
  console.log(`  → In Main Menu (I)? ${isInCategoryI ? '✓ YES' : '❌ NO'}`);
  console.log(`  → In Users & Permissions (II)? ${isInCategoryII ? '❌ WRONG' : '✓ NO (Correct)'}`);
  console.log('');

  // Expected structure
  console.log('--- EXPECTED STRUCTURE ---');
  console.log('Main Menu (I):');
  console.log('  1. Dashboard');
  console.log('  2. Companies');
  console.log('  3. Subscriptions');
  console.log('  4. Packages');
  console.log('  5. Modules');
  console.log('  6. Pages ← Should be here');
  console.log('');
  console.log('Users & Permissions (II):');
  console.log('  1. Users');
  console.log('  2. Roles & Permissions');
  console.log('  3. Permission');
  console.log('');

  // Final result
  const allCorrect = isInCategoryI &&
                     categoryIPages.some(p => p.name === 'super-admin.pages') &&
                     !categoryIIPages.some(p => p.name === 'super-admin.pages');

  if (allCorrect) {
    console.log('✅ ALL CHECKS PASSED - Structure is correct!');
  } else {
    console.log('❌ SOME CHECKS FAILED - Please review');
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
