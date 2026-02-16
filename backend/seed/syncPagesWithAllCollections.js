/**
 * Sync Pages with All Collections (Permissions, Modules, Roles) - FIXED VERSION
 *
 * This script:
 * 1. Analyzes current state of all collections
 * 2. Syncs Permissions from Pages (creates/updates permissions for all pages)
 * 3. Updates Modules to reference valid pages only
 * 4. Identifies and helps clean up orphaned documents
 * 5. Ensures hierarchy from page.md is used everywhere
 *
 * Usage:
 *   node backend/seed/syncPagesWithAllCollections.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';
import Permission from '../models/rbac/permission.schema.js';
import Module from '../models/rbac/module.schema.js';
import Role from '../models/rbac/role.schema.js';
import RolePermission from '../models/rbac/rolePermission.schema.js';

// Debug: Check if models loaded
console.log('[DEBUG] Page model:', Page.modelName, Page.collection.name);
console.log('[DEBUG] PageCategory model:', PageCategory.modelName);
console.log('[DEBUG] Permission model:', Permission.modelName);

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

function section(title) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(60));
  console.log(` ${title}`);
  console.log('='.repeat(60) + colors.reset + '\n');
}

// ============================================================================
// ANALYZE CURRENT STATE
// ============================================================================

async function analyzeCollections() {
  section('ANALYZING CURRENT COLLECTIONS');

  // Debug: Check mongoose connection state
  console.log('[DEBUG] mongoose.connection.name:', mongoose.connection.name);
  console.log('[DEBUG] mongoose.connection.readyState:', mongoose.connection.readyState);
  console.log('[DEBUG] mongoose.connection.db.databaseName:', mongoose.connection.db?.databaseName);

  // 1. Analyze Pages and Categories
  log(colors.blue, '📊 Pages & Categories...');

  // Use raw collection for count to avoid model issues
  const pagesCollection = mongoose.connection.db.collection('pages');
  const pageCategoriesCollection = mongoose.connection.db.collection('pagecategories');

  const pageStats = {
    total: await pagesCollection.countDocuments(),
    active: await pagesCollection.countDocuments({ isActive: true }),
    system: await pagesCollection.countDocuments({ isSystem: true }),
    custom: await pagesCollection.countDocuments({ isSystem: false }),
    menuGroups: await pagesCollection.countDocuments({ isMenuGroup: true }),
    withRoute: await pagesCollection.countDocuments({ route: { $ne: null, $ne: '' } }),
  };

  const categoryStats = {
    total: await pageCategoriesCollection.countDocuments(),
    active: await pageCategoriesCollection.countDocuments({ isActive: true }),
  };

  // Pages by hierarchy level
  const pagesByLevel = await Page.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$level', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  // Pages by category
  const pagesByCategory = await Page.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'pagecategories',
        localField: 'category',
        foreignField: '_id',
        as: 'catData'
      }
    },
    { $unwind: '$catData' },
    {
      $group: {
        _id: { label: '$catData.label', name: '$catData.displayName' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.label': 1 } }
  ]);

  log(colors.green, `  Total Pages: ${pageStats.total} (Active: ${pageStats.active})`);
  log(colors.green, `  System: ${pageStats.system} | Custom: ${pageStats.custom}`);
  log(colors.green, `  Menu Groups: ${pageStats.menuGroups} | With Routes: ${pageStats.withRoute}`);
  log(colors.green, `  Total Categories: ${categoryStats.total} (Active: ${categoryStats.active})`);

  console.log('\n  Pages by Level:');
  pagesByLevel.forEach(({ _id, count }) => {
    console.log(`    Level ${_id}: ${count} pages`);
  });

  console.log('\n  Pages by Category:');
  pagesByCategory.forEach(({ _id, count }) => {
    console.log(`    ${_id.label} (${_id.name}): ${count} pages`);
  });

  // 2. Analyze Permissions
  log(colors.blue, '\n📊 Permissions...');
  const permissionStats = {
    total: await Permission.countDocuments(),
    active: await Permission.countDocuments({ isActive: true }),
    withPageId: await Permission.countDocuments({ pageId: { $ne: null } }),
    withoutPageId: await Permission.countDocuments({ pageId: null }),
    migrated: await Permission.countDocuments({ isMigrated: true }),
  };

  // Permissions with invalid pageId
  const invalidPageIdPerms = await Permission.aggregate([
    { $match: { pageId: { $ne: null }, isActive: true } },
    {
      $lookup: {
        from: 'pages',
        localField: 'pageId',
        foreignField: '_id',
        as: 'pageData'
      }
    },
    { $unwind: '$pageData' },
    { $match: { 'pageData._id': { $exists: false } } },
    { $count: 'invalid' }
  ]).then(result => result[0]?.invalid || 0);

  // Active pages without permissions
  const pagesWithoutPermissions = await Page.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'permissions',
        localField: '_id',
        foreignField: 'pageId',
        as: 'permData'
      }
    },
    { $match: { 'permData.0': { $exists: false } } },
    { $count: 'missing' }
  ]).then(result => result[0]?.missing || 0);

  log(colors.green, `  Total Permissions: ${permissionStats.total} (Active: ${permissionStats.active})`);
  log(colors.green, `  With PageId: ${permissionStats.withPageId} | Without: ${permissionStats.withoutPageId}`);
  log(colors.yellow, `  ⚠️  Pages without Permissions: ${pagesWithoutPermissions}`);
  log(colors.yellow, `  ⚠️  Permissions with invalid PageId: ${invalidPageIdPerms}`);
  log(colors.green, `  Migrated: ${permissionStats.migrated}`);

  // 3. Analyze Modules
  log(colors.blue, '\n📊 Modules...');
  const moduleStats = {
    total: await Module.countDocuments(),
    active: await Module.countDocuments({ isActive: true }),
    system: await Module.countDocuments({ isSystem: true }),
  };

  // Total page references in modules
  const modulePages = await Module.aggregate([
    { $unwind: '$pages' },
    {
      $group: {
        _id: null,
        totalRefs: { $sum: 1 },
        uniquePages: { $addToSet: '$pages.pageId' },
        activeRefs: { $sum: { $cond: ['$pages.isActive', 1, 0] } }
      }
    }
  ]).then(result => result[0] || { totalRefs: 0, uniquePages: [], activeRefs: 0 });

  // Module page references with invalid pageId
  const invalidModulePageRefs = await Module.aggregate([
    { $unwind: '$pages' },
    {
      $lookup: {
        from: 'pages',
        localField: 'pages.pageId',
        foreignField: '_id',
        as: 'pageData'
      }
    },
    { $match: { 'pageData.0': { $exists: false } } },
    { $count: 'invalid' }
  ]).then(result => result[0]?.invalid || 0);

  log(colors.green, `  Total Modules: ${moduleStats.total} (Active: ${moduleStats.active})`);
  log(colors.green, `  System: ${moduleStats.system}`);
  log(colors.green, `  Total Page Refs: ${modulePages.totalRefs} (Active: ${modulePages.activeRefs})`);
  log(colors.green, `  Unique Pages: ${modulePages.uniquePages.length}`);
  log(colors.yellow, `  ⚠️  Invalid Page Refs: ${invalidModulePageRefs}`);

  // 4. Analyze Roles
  log(colors.blue, '\n📊 Roles...');
  const roleStats = {
    total: await Role.countDocuments({ isDeleted: false }),
    active: await Role.countDocuments({ isActive: true, isDeleted: false }),
    system: await Role.countDocuments({ type: 'system', isDeleted: false }),
  };

  // Role permissions from junction table
  const rolePermStats = await RolePermission.aggregate([
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        withPageId: { $sum: { $cond: [{ $ifNull: ['$pageId', false] }, 1, 0] } },
        uniqueRoles: { $addToSet: '$roleId' },
        uniquePages: { $addToSet: '$pageId' }
      }
    }
  ]).then(result => result[0] || { totalEntries: 0, withPageId: 0, uniqueRoles: [], uniquePages: [] });

  // Role permissions with invalid pageId
  const invalidRolePermPages = await RolePermission.aggregate([
    { $match: { pageId: { $ne: null } } },
    {
      $lookup: {
        from: 'pages',
        localField: 'pageId',
        foreignField: '_id',
        as: 'pageData'
      }
    },
    { $match: { 'pageData.0': { $exists: false } } },
    { $count: 'invalid' }
  ]).then(result => result[0]?.invalid || 0);

  log(colors.green, `  Total Roles: ${roleStats.total} (Active: ${roleStats.active})`);
  log(colors.green, `  System: ${roleStats.system}`);
  log(colors.green, `  Role Permissions (Junction): ${rolePermStats.totalEntries}`);
  log(colors.green, `  With PageId: ${rolePermStats.withPageId}`);
  log(colors.green, `  Unique Roles: ${rolePermStats.uniqueRoles.length}`);
  log(colors.green, `  Unique Pages: ${rolePermStats.uniquePages.length}`);
  log(colors.yellow, `  ⚠️  Invalid Page Refs: ${invalidRolePermPages}`);

  return {
    pageStats,
    permissionStats,
    moduleStats,
    roleStats,
    issues: {
      pagesWithoutPermissions,
      invalidPageIdPerms,
      invalidModulePageRefs,
      invalidRolePermPages,
    }
  };
}

// ============================================================================
// SYNC PERMISSIONS FROM PAGES
// ============================================================================

async function syncPermissionsFromPages() {
  section('SYNCING PERMISSIONS FROM PAGES');

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Debug: Use raw collections for accurate counts
  const pagesCollection = mongoose.connection.db.collection('pages');
  const categoriesCollection = mongoose.connection.db.collection('pagecategories');
  const permissionsCollection = mongoose.connection.db.collection('permissions');

  const pageCount = await pagesCollection.countDocuments();
  const categoryCount = await categoriesCollection.countDocuments();
  const permCount = await permissionsCollection.countDocuments();

  log(colors.blue, `Database stats: Pages=${pageCount}, Categories=${categoryCount}, Permissions=${permCount}`);

  // First, get all categories and build label map
  const categories = await PageCategory.find({}).lean();
  const categoryLabelMap = new Map();
  categories.forEach(cat => {
    categoryLabelMap.set(cat._id.toString(), cat.label);
  });

  log(colors.blue, `Found ${categories.length} categories in database`);

  // Get all active pages
  const pages = await Page.find({ isActive: true }).lean();

  log(colors.blue, `Processing ${pages.length} active pages...`);

  for (const page of pages) {
    try {
      // Get category label from map
      const categoryLabel = page.category ?
        (categoryLabelMap.get(page.category.toString()) || 'other') :
        'other';

      // Find or create permission for this page
      let permission = await Permission.findOne({ pageId: page._id });

      if (!permission) {
        // Check for legacy permission by module name
        permission = await Permission.findOne({ module: page.name });

        if (permission) {
          // Migrate existing permission
          permission.pageId = page._id;
          permission.displayName = page.displayName;
          permission.category = categoryLabel;
          permission.availableActions = page.availableActions || permission.availableActions;
          permission.isMigrated = true;
          await permission.save();
          results.updated++;
          log(colors.green, `  ✓ Migrated permission: ${page.displayName} (${page.name})`);
        } else {
          // Create new permission
          await Permission.create({
            pageId: page._id,
            module: page.name,
            displayName: page.displayName,
            category: categoryLabel,
            description: page.description || '',
            sortOrder: page.sortOrder || 0,
            availableActions: page.availableActions || ['read', 'create', 'write', 'delete'],
            isMigrated: true,
            isActive: true,
          });
          results.created++;
          log(colors.green, `  + Created permission: ${page.displayName} (${page.name}) [cat: ${categoryLabel}]`);
        }
      } else {
        // Update existing permission if needed
        const needsUpdate =
          permission.displayName !== page.displayName ||
          permission.category !== categoryLabel ||
          JSON.stringify(permission.availableActions) !== JSON.stringify(page.availableActions);

        if (needsUpdate) {
          permission.displayName = page.displayName;
          permission.category = categoryLabel;
          permission.availableActions = page.availableActions || permission.availableActions;
          permission.sortOrder = page.sortOrder || permission.sortOrder;
          await permission.save();
          results.updated++;
          log(colors.blue, `  ~ Updated permission: ${page.displayName} [cat: ${categoryLabel}]`);
        } else {
          results.skipped++;
        }
      }
    } catch (error) {
      results.errors.push({ page: page.name, error: error.message });
      log(colors.red, `  ✗ Error with ${page.name}: ${error.message}`);
    }
  }

  console.log('\n' + colors.bright + 'Results:');
  log(colors.green, `  Created: ${results.created}`);
  log(colors.blue, `  Updated: ${results.updated}`);
  log(colors.yellow, `  Skipped: ${results.skipped}`);
  if (results.errors.length > 0) {
    log(colors.red, `  Errors: ${results.errors.length}`);
  }

  return results;
}

// ============================================================================
// CLEAN UP ORPHANED PERMISSIONS
// ============================================================================

async function cleanupOrphanedPermissions() {
  section('CLEANING UP ORPHANED PERMISSIONS');

  // Find permissions with pageId that don't exist
  const orphaned = await Permission.aggregate([
    { $match: { pageId: { $ne: null } } },
    {
      $lookup: {
        from: 'pages',
        localField: 'pageId',
        foreignField: '_id',
        as: 'pageData'
      }
    },
    { $match: { 'pageData.0': { $exists: false } } }
  ]);

  if (orphaned.length === 0) {
    log(colors.green, '✓ No orphaned permissions found!');
    return { cleaned: 0 };
  }

  log(colors.yellow, `Found ${orphaned.length} orphaned permissions:`);
  orphaned.forEach(p => {
    console.log(`  - ${p.displayName} (${p.module}) - pageId: ${p.pageId}`);
  });

  // Deactivate orphaned permissions
  const deactivateResults = await Permission.updateMany(
    { _id: { $in: orphaned.map(p => p._id) } },
    { isActive: false }
  );

  log(colors.green, `  ✓ Deactivated ${deactivateResults.modified} orphaned permissions`);

  return { cleaned: deactivateResults.modified };
}

// ============================================================================
// VALIDATE MODULE PAGE REFERENCES
// ============================================================================

async function validateModulePageReferences() {
  section('VALIDATING MODULE PAGE REFERENCES');

  const modules = await Module.find({}).lean();
  const report = {
    totalModules: modules.length,
    modulesWithIssues: 0,
    invalidRefsRemoved: 0,
  };

  for (const mod of modules) {
    const originalPageCount = mod.pages?.length || 0;
    const validPages = [];

    for (const pageRef of mod.pages || []) {
      // Check if page exists
      const page = await Page.findById(pageRef.pageId);
      if (page && page.isActive) {
        validPages.push(pageRef);
      } else {
        log(colors.red, `  ✗ Removing invalid ref in ${mod.displayName}: ${pageRef.displayName || pageRef.pageId}`);
      }
    }

    if (validPages.length !== originalPageCount) {
      mod.pages = validPages;
      await Module.findByIdAndUpdate(mod._id, { pages: validPages });
      report.modulesWithIssues++;
      report.invalidRefsRemoved += (originalPageCount - validPages.length);
    }
  }

  if (report.modulesWithIssues > 0) {
    log(colors.green, `  ✓ Fixed ${report.modulesWithIssues} modules`);
    log(colors.green, `  ✓ Removed ${report.invalidRefsRemoved} invalid page refs`);
  } else {
    log(colors.green, '✓ All module page references are valid!');
  }

  return report;
}

// ============================================================================
// VALIDATE ROLE PERMISSION PAGE REFERENCES
// ============================================================================

async function validateRolePermissionPageReferences() {
  section('VALIDATING ROLE PERMISSION PAGE REFERENCES');

  // Get role permissions with invalid page references
  const invalidRefs = await RolePermission.aggregate([
    { $match: { pageId: { $ne: null } } },
    {
      $lookup: {
        from: 'pages',
        localField: 'pageId',
        foreignField: '_id',
        as: 'pageData'
      }
    },
    { $match: { 'pageData.0': { $exists: false } } }
  ]);

  if (invalidRefs.length === 0) {
    log(colors.green, '✓ All role permission page references are valid!');
    return { cleaned: 0 };
  }

  log(colors.yellow, `Found ${invalidRefs.length} invalid page references in role_permissions`);

  // Group by role to report
  const byRole = {};
  for (const ref of invalidRefs) {
    const key = ref.roleId.toString();
    if (!byRole[key]) byRole[key] = [];
    byRole[key].push(ref.pageId?.toString());
  }

  for (const [roleId, pageIds] of Object.entries(byRole)) {
    const role = await Role.findById(roleId);
    log(colors.red, `  Role: ${role?.displayName || roleId} - ${pageIds.length} invalid page refs`);
  }

  // Remove invalid references
  const deleteResult = await RolePermission.deleteMany({
    _id: { $in: invalidRefs.map(r => r._id) }
  });

  log(colors.green, `  ✓ Removed ${deleteResult.deleted} invalid role permission entries`);

  return { cleaned: deleteResult.deleted };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    // Connect to MongoDB
    log(colors.blue, 'Connecting to MongoDB...');
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      log(colors.yellow, 'Already connected, using existing connection');
      const currentDb = mongoose.connection.db?.databaseName || 'unknown';
      log(colors.green, `✓ Using existing connection to: ${currentDb}\n`);
    } else {
      await mongoose.connect(uri, { dbName });
      log(colors.green, `✓ Connected to database: ${dbName}\n`);
    }

    // 1. Analyze current state
    const analysis = await analyzeCollections();

    // 2. Sync permissions from pages
    const syncResults = await syncPermissionsFromPages();

    // 3. Clean up orphaned permissions
    const orphanCleanup = await cleanupOrphanedPermissions();

    // 4. Validate module page references
    const moduleValidation = await validateModulePageReferences();

    // 5. Validate role permission page references
    const rolePermValidation = await validateRolePermissionPageReferences();

    // Final summary
    section('FINAL SUMMARY');
    log(colors.bright, 'Collections Sync Status:');
    log(colors.green, `  ✓ Pages are the source of truth`);
    log(colors.green, `  ✓ Permissions synced from Pages (${syncResults.created} created, ${syncResults.updated} updated)`);
    log(colors.green, `  ✓ Modules validated (${moduleValidation.invalidRefsRemoved} invalid refs removed)`);
    log(colors.green, `  ✓ Role Permissions validated (${rolePermValidation.cleaned} invalid refs removed)`);

    const totalIssues = (analysis?.issues?.pagesWithoutPermissions || 0) +
                       orphanCleanup.cleaned +
                       moduleValidation.invalidRefsRemoved +
                       rolePermValidation.cleaned;

    if (totalIssues === 0) {
      log(colors.green, '\n✓ All collections are properly synced with Pages hierarchy!');
    } else {
      log(colors.yellow, `\n⚠️  Fixed ${totalIssues} issues during sync.`);
    }

  } catch (error) {
    log(colors.red, '\n✗ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log(colors.blue, '\nDisconnected from database');
  }
}

// Run the script
main();
