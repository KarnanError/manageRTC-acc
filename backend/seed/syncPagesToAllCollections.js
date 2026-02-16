/**
 * Complete Pages to All Collections Sync
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';
import Permission from '../models/rbac/permission.schema.js';
import RolePermission from '../models/rbac/rolePermission.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== PAGES SYNC ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get all categories for mapping
  const categories = await PageCategory.find({}).lean();
  const categoryLabelMap = new Map();
  categories.forEach(cat => {
    categoryLabelMap.set(cat._id.toString(), cat.label);
  });

  console.log(`Loaded ${categories.length} categories`);
  console.log('Categories:', Array.from(categoryLabelMap.entries()));
  console.log('');

  // Get all pages
  const pages = await Page.find({}).lean();
  console.log(`Total pages: ${pages.length}`);

  // Sync permissions
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const page of pages) {
    try {
      // Use page.moduleCategory directly (not page.category ObjectId)
      // This ensures permissions use same categories as pages
      const categoryLabel = page.moduleCategory || 'other';

      const existing = await Permission.findOne({ pageId: page._id });

      if (existing) {
        // Update existing
        if (existing.displayName !== page.displayName ||
            existing.category !== categoryLabel) {
          existing.displayName = page.displayName;
          existing.category = categoryLabel;
          await existing.save();
          updated++;
        }
      } else {
        // Check for legacy by module name
        const legacy = await Permission.findOne({ module: page.name });

        if (legacy) {
          // Migrate
          legacy.pageId = page._id;
          legacy.displayName = page.displayName;
          legacy.category = categoryLabel;
          legacy.availableActions = page.availableActions || legacy.availableActions;
          legacy.isMigrated = true;
          await legacy.save();
          updated++;
        } else {
          // Create new
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
          created++;
        }
      }
    } catch (error) {
      errors++;
      console.error(`  ✗ ${page.name}: ${error.message}`);
    }
  }

  // Clean up orphaned permissions
  console.log('\n=== CLEANUP ORPHANED PERMISSIONS ===');
  const validPageIds = new Set(pages.map(p => p._id.toString()));
  const orphaned = await Permission.find({
    $or: [
      { pageId: { $exists: false } },
      { pageId: null },
      { pageId: { $nin: Array.from(validPageIds).map(id => mongoose.Types.ObjectId.createFromHexString(id)) } }
    ]
  });

  console.log(`Found ${orphaned.length} orphaned permissions (no valid pageId)`);

  if (orphaned.length > 0) {
    const orphanedIds = orphaned.map(o => o._id.toString());
    const deletedResult = await Permission.deleteMany({
      _id: { $in: orphaned.map(o => o._id) }
    });
    console.log(`Deleted ${deletedResult.deletedCount} orphaned permissions`);
  }

  // Final count
  const finalCount = await Permission.countDocuments();
  console.log(`\nFinal permission count: ${finalCount}`);

  console.log('\n=== SYNC RESULTS ===');
  console.log(`Created: ${created} permissions`);
  console.log(`Updated: ${updated} permissions`);
  console.log(`Errors: ${errors}`);

  // ===========================================
  // CLEANUP ROLE_PERMISSIONS COLLECTION
  // ===========================================
  console.log('\n=== ROLE_PERMISSIONS CLEANUP ===');

  // Get all valid permissionIds (those linked to pages)
  const validPermissions = await Permission.find({}).lean();
  const validPermissionIds = new Set(validPermissions.map(p => p._id.toString()));

  // Get all valid pageIds (use existing variable)
  // const validPageIds already defined above at line 97

  // Check role_permissions for orphaned entries
  const allRolePerms = await RolePermission.find({}).lean();
  console.log(`Total role_permissions: ${allRolePerms.length}`);

  const orphanedRolePerms = allRolePerms.filter(rp => {
    // Orphaned if permissionId exists but not in valid permissions
    if (rp.permissionId && !validPermissionIds.has(rp.permissionId.toString())) {
      return true;
    }
    // Orphaned if pageId exists but not in valid pages (use validPageIds from line 97)
    if (rp.pageId && !validPageIds.has(rp.pageId.toString())) {
      return true;
    }
    return false;
  });

  console.log(`Found ${orphanedRolePerms.length} orphaned role_permissions`);

  if (orphanedRolePerms.length > 0) {
    const orphanedRolePermIds = orphanedRolePerms.map(rp => rp._id);
    const deletedRolePerms = await RolePermission.deleteMany({
      _id: { $in: orphanedRolePermIds }
    });
    console.log(`Deleted ${deletedRolePerms.deletedCount} orphaned role_permissions`);
  }

  // Final role_permissions count
  const finalRolePermCount = await RolePermission.countDocuments();
  console.log(`Final role_permissions count: ${finalRolePermCount}`);

  await mongoose.disconnect();
  console.log('\n✓ Sync complete!');
}

main().catch(console.error);
