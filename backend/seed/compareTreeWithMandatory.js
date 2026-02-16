/**
 * Compare Category Tree Page IDs with Mandatory Permission Page IDs
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Role from '../models/rbac/role.schema.js';
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== COMPARING CATEGORY TREE WITH MANDATORY PERMISSIONS ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get Super Admin role with mandatory permissions
  const role = await Role.findOne({ name: 'superadmin' }).lean();
  if (!role) {
    console.log('❌ Super Admin role not found');
    await mongoose.disconnect();
    return;
  }

  // Get mandatory page IDs (as strings)
  const mandatoryPageIds = (role.mandatoryPermissions || []).map(m => m.pageId?.toString());
  console.log('--- MANDATORY PERMISSION PAGE IDs ---');
  mandatoryPageIds.forEach(id => console.log('  ', id));
  console.log('');

  // Get category I (Main Menu)
  const categoryI = await PageCategory.findOne({ identifier: 'I' }).lean();
  if (!categoryI) {
    console.log('❌ Category I not found');
    await mongoose.disconnect();
    return;
  }

  console.log('--- CATEGORY I (Main Menu) PAGES ---');
  console.log('Category ID:', categoryI._id.toString());

  // Get all pages in Category I
  const categoryIPages = await Page.find({
    category: categoryI._id,
    isActive: true,
  }).lean();

  console.log(`Found ${categoryIPages.length} pages in Category I`);
  console.log('');

  // Check each mandatory page ID
  console.log('--- CHECKING IF MANDATORY PAGES EXIST IN CATEGORY I ---');
  for (const mandatoryId of mandatoryPageIds) {
    const page = await Page.findById(mandatoryId).lean();
    if (page) {
      const pageCategoryId = page.category?.toString();
      const isInCategoryI = pageCategoryId === categoryI._id.toString();

      console.log(`\nPage ID: ${mandatoryId}`);
      console.log(`  Name: ${page.name}`);
      console.log(`  Display: ${page.displayName}`);
      console.log(`  Category ID: ${pageCategoryId}`);
      console.log(`  In Category I? ${isInCategoryI ? '✓ YES' : '❌ NO'}`);

      // Check if this page would appear in the category tree
      const isDirectChild = page.parentPage === null;
      const hasL1Parent = page.parentPage !== null;

      console.log(`  Parent Page: ${page.parentPage?.toString() || 'none (direct child)'}`);

      if (isDirectChild) {
        console.log(`  → Would appear as: direct child of Category I`);
      } else {
        // Find the L1 parent
        const l1Parent = await Page.findById(page.parentPage).lean();
        if (l1Parent && l1Parent.menuGroupLevel === 1) {
          console.log(`  → Would appear as: child of L1 group "${l1Parent.displayName}"`);
        }
      }
    }
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
