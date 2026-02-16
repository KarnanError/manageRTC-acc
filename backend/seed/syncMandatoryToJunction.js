/**
 * Sync Mandatory Permissions to Junction Table
 * Reads mandatory permissions from roles and applies them to the junction table
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Role from '../models/rbac/role.schema.js';
import RolePermission from '../models/rbac/rolePermission.schema.js';
import Permission from '../models/rbac/permission.schema.js';
import Page from '../models/rbac/page.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== SYNCING MANDATORY PERMISSIONS TO JUNCTION TABLE ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  const roles = await Role.find({});
  console.log(`Found ${roles.length} roles\n`);

  for (const role of roles) {
    if (!role.mandatoryPermissions || role.mandatoryPermissions.length === 0) {
      console.log(`Role: ${role.displayName} - No mandatory permissions, skipping`);
      console.log('');
      continue;
    }

    console.log(`=== Role: ${role.displayName} ===`);
    console.log(`Mandatory permissions: ${role.mandatoryPermissions.length}`);

    // Get current permissions from junction table
    const currentPerms = await RolePermission.find({ roleId: role._id }).lean();
    console.log(`Current junction table entries: ${currentPerms.length}`);

    // Create a map of current permissions by pageId
    const permsMap = new Map();
    for (const perm of currentPerms) {
      const pageIdStr = perm.pageId?.toString();
      if (pageIdStr) {
        permsMap.set(pageIdStr, perm);
      }
    }

    let updatedCount = 0;
    const allActionKeys = ['all', 'read', 'create', 'write', 'delete', 'import', 'export', 'approve', 'assign'];

    // Process each mandatory permission
    for (const mandatory of role.mandatoryPermissions) {
      const pageIdStr = mandatory.pageId?.toString();
      const mandatoryActions = mandatory.actions || [];

      if (!pageIdStr) {
        console.log(`  ⚠️  Skipping mandatory permission with no pageId`);
        continue;
      }

      console.log(`\n  Processing: ${pageIdStr}`);
      console.log(`    Mandatory actions: [${mandatoryActions.join(', ')}]`);

      // Check if page exists
      const page = await Page.findById(mandatory.pageId).lean();
      if (!page) {
        console.log(`    ❌ Page not found in database`);
        continue;
      }
      console.log(`    ✓ Page: ${page.displayName}`);

      // Check if permission exists
      const permission = await Permission.findOne({ pageId: page._id, isActive: true }).lean();
      if (!permission) {
        console.log(`    ❌ Permission not found for page`);
        continue;
      }
      console.log(`    ✓ Permission: ${permission.displayName}`);

      // Get or create entry in junction table
      let permEntry = permsMap.get(pageIdStr);

      if (!permEntry) {
        console.log(`    → Creating new junction entry...`);
        // Create new entry
        permEntry = {
          roleId: role._id,
          pageId: page._id,
          permissionId: permission._id,
          module: permission.module,
          displayName: permission.displayName,
          category: permission.category,
          route: page.route,
          actions: { all: false, read: false, create: false, write: false, delete: false, import: false, export: false, approve: false, assign: false }
        };
      } else {
        console.log(`    → Updating existing entry...`);
      }

      // Apply mandatory actions
      if (mandatoryActions.includes('all')) {
        console.log(`    → Enforcing ALL actions`);
        allActionKeys.forEach(action => {
          permEntry.actions[action] = true;
        });
      } else {
        console.log(`    → Enforcing specific actions: [${mandatoryActions.filter(a => a !== 'all').join(', ')}]`);
        mandatoryActions.forEach(action => {
          if (action !== 'all') {
            permEntry.actions[action] = true;
          }
        });
        // Check if all individual mandatory actions are enabled
        const individualActions = allActionKeys.filter(a => a !== 'all');
        const allIndividualEnabled = individualActions.every(a => permEntry.actions[a] === true);
        if (allIndividualEnabled) {
          permEntry.actions.all = true;
        }
      }

      // Save to junction table
      if (permEntry._id) {
        // Update existing
        await RolePermission.findByIdAndUpdate(permEntry._id, {
          actions: permEntry.actions
        });
        console.log(`    ✓ Updated junction entry`);
      } else {
        // Create new
        const newEntry = new RolePermission(permEntry);
        await newEntry.save();
        console.log(`    ✓ Created new junction entry`);
      }

      updatedCount++;
    }

    console.log(`\n  ✓ Updated ${updatedCount} mandatory permissions in junction table`);
    console.log('');
  }

  console.log('=== SUMMARY ===');
  console.log('✓ Mandatory permissions synced to junction table');

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
