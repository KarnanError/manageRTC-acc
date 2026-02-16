/**
 * Diagnose Permissions Hierarchy Issue
 * Analyzes pages and permissions to understand why Permissions page shows no data
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

  console.log('=== PERMISSIONS HIERARCHY DIAGNOSTIC ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // 1. Check categories
  console.log('1. CHECKING CATEGORIES');
  const categories = await PageCategory.find({ isActive: true }).lean();
  console.log(`   Found ${categories.length} active categories`);

  if (categories.length === 0) {
    console.log('   ❌ NO ACTIVE CATEGORIES FOUND!');
    console.log('   → Run: node backend/seed/pageCategories.seed.js');
    return;
  }
  console.log('   Categories:', categories.map(c => `${c.identifier} (${c.displayName})`).join(', '));
  console.log('');

  // 2. Check pages
  console.log('2. CHECKING PAGES');
  const pages = await Page.find({ isActive: true }).lean();
  console.log(`   Total active pages: ${pages.length}`);

  if (pages.length === 0) {
    console.log('   ❌ NO ACTIVE PAGES FOUND!');
    console.log('   → Run: node backend/seed/completePagesHierarchical.seed.js');
    return;
  }

  // Breakdown by hierarchy
  const menuL1 = pages.filter(p => p.isMenuGroup && p.menuGroupLevel === 1);
  const menuL2 = pages.filter(p => p.isMenuGroup && p.menuGroupLevel === 2);
  const regular = pages.filter(p => !p.isMenuGroup);

  console.log(`   - L1 Menu Groups: ${menuL1.length}`);
  console.log(`   - L2 Menu Groups: ${menuL2.length}`);
  console.log(`   - Regular Pages: ${regular.length}`);

  // Check pages with parentPage set
  const withParent = pages.filter(p => p.parentPage);
  console.log(`   - Pages with parent: ${withParent.length}`);

  // Check pages without category
  const withoutCategory = pages.filter(p => !p.category);
  if (withoutCategory.length > 0) {
    console.log(`   ⚠️  ${withoutCategory.length} pages without category`);
  }
  console.log('');

  // 3. Check permissions
  console.log('3. CHECKING PERMISSIONS');
  const permissions = await Permission.find({ isActive: true }).lean();
  console.log(`   Total active permissions: ${permissions.length}`);

  if (permissions.length === 0) {
    console.log('   ❌ NO ACTIVE PERMISSIONS FOUND!');
    console.log('   → Run: node backend/seed/syncPagesWithAllCollections.js');
    return;
  }

  // Check permissions with pageId
  const withPageId = permissions.filter(p => p.pageId);
  console.log(`   - Permissions with pageId: ${withPageId.length}`);

  const withoutPageId = permissions.filter(p => !p.pageId);
  if (withoutPageId.length > 0) {
    console.log(`   ⚠️  ${withoutPageId.length} permissions WITHOUT pageId`);
  }
  console.log('');

  // 4. Check pages without permissions
  console.log('4. CHECKING PAGES WITHOUT PERMISSIONS');
  const pagesWithoutPerms = [];
  for (const page of regular) {
    const perm = await Permission.findOne({ pageId: page._id, isActive: true });
    if (!perm) {
      pagesWithoutPerms.push(page);
    }
  }

  if (pagesWithoutPerms.length > 0) {
    console.log(`   ⚠️  ${pagesWithoutPerms.length} pages WITHOUT permissions:`);
    pagesWithoutPerms.slice(0, 10).forEach(p => {
      console.log(`      - ${p.displayName} (${p.name}) [${p.moduleCategory || 'no category'}]`);
    });
    if (pagesWithoutPerms.length > 10) {
      console.log(`      ... and ${pagesWithoutPerms.length - 10} more`);
    }
    console.log('');
    console.log('   → Run: node backend/seed/syncPagesWithAllCollections.js');
  } else {
    console.log('   ✅ All pages have permissions');
  }
  console.log('');

  // 5. Simulate hierarchical structure build
  console.log('5. SIMULATING HIERARCHICAL STRUCTURE');
  let totalItems = 0;

  for (const cat of categories) {
    // Get L1 groups
    const l1Groups = await Page.find({
      category: cat._id,
      isMenuGroup: true,
      menuGroupLevel: 1,
      isActive: true,
    }).lean();

    // Get direct children
    const directChildren = await Page.find({
      category: cat._id,
      parentPage: null,
      isMenuGroup: false,
      isActive: true,
    }).lean();

    let l1ItemCount = 0;

    for (const l1 of l1Groups) {
      const l2Groups = await Page.find({
        parentPage: l1._id,
        isMenuGroup: true,
        menuGroupLevel: 2,
        isActive: true,
      }).lean();

      const l1DirectChildren = await Page.find({
        parentPage: l1._id,
        isMenuGroup: false,
        isActive: true,
      }).lean();

      let l2ChildCount = 0;
      for (const l2 of l2Groups) {
        const l2Children = await Page.find({
          parentPage: l2._id,
          isMenuGroup: false,
          isActive: true,
        }).lean();
        l2ChildCount += l2Children.length;
      }

      l1ItemCount += l2Groups.length + l1DirectChildren.length + l2ChildCount;
    }

    totalItems += l1Groups.length + directChildren.length + l1ItemCount;

    console.log(`   ${cat.identifier}. ${cat.displayName}:`);
    console.log(`      - L1 Groups: ${l1Groups.length}`);
    console.log(`      - Direct Children: ${directChildren.length}`);
    console.log(`      - Total items: ${l1Groups.length + directChildren.length + l1ItemCount}`);
  }

  console.log(`\n   Total hierarchical items: ${totalItems}`);
  console.log('');

  // 6. Summary
  console.log('6. SUMMARY');
  if (categories.length > 0 && pages.length > 0 && permissions.length > 0) {
    console.log('   ✅ Basic data exists');
    if (withPageId.length < permissions.length) {
      console.log('   ⚠️  Some permissions missing pageId - needs sync');
    }
    if (pagesWithoutPerms.length > 0) {
      console.log('   ⚠️  Some pages missing permissions - needs sync');
    }
    if (totalItems === 0) {
      console.log('   ❌ Hierarchical structure is empty - pages may not be properly linked to categories/parents');
    } else {
      console.log(`   ✅ Hierarchical structure has ${totalItems} items`);
    }
  } else {
    console.log('   ❌ Critical data missing - run seed scripts');
  }
  console.log('');

  // 7. Recommendations
  console.log('7. RECOMMENDATIONS');
  if (totalItems === 0 || pagesWithoutPerms.length > 0) {
    console.log('   → Run sync: node backend/seed/syncPagesWithAllCollections.js');
  }
  if (withoutPageId.length > 0) {
    console.log('   → Permissions exist without pageId - may need manual cleanup');
  }
  if (categories.length === 0) {
    console.log('   → Seed categories: node backend/seed/pageCategories.seed.js');
  }
  if (pages.length === 0) {
    console.log('   → Seed pages: node backend/seed/completePagesHierarchical.seed.js');
  }

  await mongoose.disconnect();
  console.log('\n✓ Diagnostic complete!');
}

main().catch(console.error);
