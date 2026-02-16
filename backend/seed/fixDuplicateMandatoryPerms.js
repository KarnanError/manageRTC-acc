/**
 * Fix Duplicate Mandatory Permissions
 * Removes duplicate page entries in mandatory permissions
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Role from '../models/rbac/role.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== FIXING DUPLICATE MANDATORY PERMISSIONS ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  const roles = await Role.find({}).lean();

  let totalDuplicates = 0;

  for (const role of roles) {
    if (!role.mandatoryPermissions || role.mandatoryPermissions.length === 0) {
      continue;
    }

    console.log(`Checking role: ${role.displayName}`);

    // Find duplicates by pageId
    const pageMap = new Map();
    const duplicates = [];

    role.mandatoryPermissions.forEach((perm, index) => {
      const pageId = perm.pageId?.toString();
      if (!pageId) return;

      if (pageMap.has(pageId)) {
        // Duplicate found
        const existing = pageMap.get(pageId);
        duplicates.push({ index, pageId, existing, new: perm });
      } else {
        pageMap.set(pageId, { index, perm });
      }
    });

    if (duplicates.length > 0) {
      console.log(`  Found ${duplicates.length} duplicates:`);
      duplicates.forEach(d => {
        console.log(`    PageID: ${d.pageId}`);
        console.log(`      Entry 1 (index ${d.existing.index}):`, d.existing.perm.actions);
        console.log(`      Entry 2 (index ${d.index}):`, d.new.actions);
      });

      // Remove duplicates by keeping only unique pageIds
      // When there are duplicates, keep the one with 'all' if it exists, otherwise merge the actions
      const uniquePerms = [];
      const processedPageIds = new Set();

      for (const perm of role.mandatoryPermissions) {
        const pageId = perm.pageId?.toString();
        if (!pageId || processedPageIds.has(pageId)) continue;

        // Check if there's another entry for this page with 'all'
        const allEntry = role.mandatoryPermissions.find(p =>
          p.pageId?.toString() === pageId && p.actions.includes('all')
        );

        if (allEntry) {
          // Use the entry with 'all'
          if (perm.actions.includes('all')) {
            uniquePerms.push(perm);
            processedPageIds.add(pageId);
          }
          // Skip entries that don't have 'all' when there's one that does
        } else {
          // No 'all' entry, merge actions from all entries for this page
          const allEntriesForPage = role.mandatoryPermissions.filter(p =>
            p.pageId?.toString() === pageId
          );
          const mergedActions = new Set();
          allEntriesForPage.forEach(e => e.actions.forEach(a => mergedActions.add(a)));

          uniquePerms.push({
            pageId: perm.pageId,
            actions: Array.from(mergedActions),
          });
          processedPageIds.add(pageId);
        }
      }

      console.log(`  Fixed: ${role.mandatoryPermissions.length} → ${uniquePerms.length} entries`);

      // Update role
      await Role.findByIdAndUpdate(role._id, {
        mandatoryPermissions: uniquePerms,
      });

      totalDuplicates += duplicates.length;
    } else {
      console.log(`  ✓ No duplicates found`);
    }

    console.log('');
  }

  console.log('=== SUMMARY ===');
  console.log(`Total duplicates removed: ${totalDuplicates}`);

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
