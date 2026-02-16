/**
 * Analyze Pages Collection Issues
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGODB_DATABASE });

  const pages = await mongoose.connection.db.collection('pages').find({}).toArray();
  const categories = await mongoose.connection.db.collection('pagecategories').find({}).toArray();

  console.log('=== PAGES ANALYSIS ===');
  console.log('Total pages:', pages.length);
  console.log('Total categories:', categories.length);

  // Find pages without moduleCategory (not categorized)
  const uncategorizedPages = pages.filter(p => !p.moduleCategory);
  console.log('\n1. Pages without moduleCategory (uncategorized):', uncategorizedPages.length);
  uncategorizedPages.slice(0, 10).forEach(p => {
    console.log('   -', p.displayName, '| name:', p.name, '| route:', p.route || 'none');
  });
  if (uncategorizedPages.length > 10) {
    console.log('   ... and', uncategorizedPages.length - 10, 'more');
  }

  // Find pages with invalid category
  const validCategories = new Set(categories.map(c => c.identifier));
  const invalidCatPages = pages.filter(p => p.moduleCategory && !validCategories.has(p.moduleCategory));
  console.log('\n2. Pages with invalid moduleCategory:', invalidCatPages.length);
  invalidCatPages.slice(0, 10).forEach(p => {
    console.log('   -', p.displayName, '| category:', p.moduleCategory, '| route:', p.route || 'none');
  });
  if (invalidCatPages.length > 10) {
    console.log('   ... and', invalidCatPages.length - 10, 'more');
  }

  // Analyze parent-child relationships
  const pagesWithoutParent = pages.filter(p => !p.parentPage && p.level === 1);

  // Find orphaned children (parent not found)
  const orphanedChildren = pages.filter(p => {
    if (!p.parentPage) return false;
    const parentId = p.parentPage.toString();
    const parentExists = pages.some(parent => parent._id.toString() === parentId);
    return !parentExists;
  });

  console.log('\n3. HIERARCHY ISSUES:');
  console.log('   Pages without parent (level 1):', pagesWithoutParent.length);
  pagesWithoutParent.slice(0, 5).forEach(p => {
    console.log('    -', p.displayName, '| route:', p.route || 'none');
  });
  if (pagesWithoutParent.length > 5) {
    console.log('    ... and', pagesWithoutParent.length - 5, 'more');
  }

  console.log('   Orphaned children (parent reference invalid):', orphanedChildren.length);
  orphanedChildren.slice(0, 10).forEach(p => {
    console.log('    -', p.displayName, '| parentPage:', p.parentPage);
  });
  if (orphanedChildren.length > 10) {
    console.log('    ... and', orphanedChildren.length - 10, 'more');
  }

  // Check for menu groups without children
  const menuGroups = pages.filter(p => p.isMenuGroup === true);
  console.log('\n4. MENU GROUPS ANALYSIS:');
  console.log('   Total menu groups:', menuGroups.length);
  menuGroups.forEach(mg => {
    const children = pages.filter(p => p.parentPage && p.parentPage.toString() === mg._id.toString());
    console.log('    -', mg.displayName, '| children:', children.length, '| parentPage:', mg.parentPage || 'none');
  });

  // Check for pages without routes
  const pagesWithoutRoutes = pages.filter(p => !p.route && p.isMenuGroup !== true);
  console.log('\n5. PAGES WITHOUT ROUTES (non-menu-groups):', pagesWithoutRoutes.length);
  pagesWithoutRoutes.slice(0, 10).forEach(p => {
    console.log('   -', p.displayName, '| name:', p.name);
  });
  if (pagesWithoutRoutes.length > 10) {
    console.log('   ... and', pagesWithoutRoutes.length - 10, 'more');
  }

  // Check for duplicate names
  const nameCounts = {};
  pages.forEach(p => {
    nameCounts[p.name] = (nameCounts[p.name] || 0) + 1;
  });
  const duplicateNames = Object.entries(nameCounts).filter(([name, count]) => count > 1);
  console.log('\n6. DUPLICATE PAGE NAMES:');
  console.log('   Found', duplicateNames.length, 'duplicate names');
  duplicateNames.slice(0, 5).forEach(([name, count]) => {
    console.log('    -', name, 'used', count, 'times');
  });
  if (duplicateNames.length > 5) {
    console.log('    ... and', duplicateNames.length - 5, 'more');
  }

  // Category distribution
  console.log('\n7. CATEGORY DISTRIBUTION:');
  const catDistribution = {};
  pages.forEach(p => {
    const cat = p.moduleCategory || 'uncategorized';
    catDistribution[cat] = (catDistribution[cat] || 0) + 1;
  });
  Object.entries(catDistribution).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log('   -', cat || 'NONE', ':', count);
  });

  await mongoose.disconnect();
  console.log('\n✓ Analysis complete!');
}

main().catch(console.error);
