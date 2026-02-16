/**
 * Seed Mandatory Permissions for Roles
 * Adds mandatoryPermissions to roles based on configuration
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Role from '../models/rbac/role.schema.js';
import Page from '../models/rbac/page.schema.js';

// Mandatory permissions configuration
const MANDATORY_PERMISSIONS_CONFIG = {
  superadmin: {
    description: 'Super Admin has access to Main Menu and Users & Permissions management',
    pages: [
      // Category I: Main Menu (6 pages)
      { pageName: 'super-admin.dashboard', actions: ['all'] },
      { pageName: 'super-admin.companies', actions: ['all'] },
      { pageName: 'super-admin.subscriptions', actions: ['all'] },
      { pageName: 'super-admin.packages', actions: ['all'] },
      { pageName: 'super-admin.modules', actions: ['all'] },
      { pageName: 'super-admin.pages', actions: ['all'] },
      // Category II: Users & Permissions (3 pages)
      { pageName: 'admin.users', actions: ['all'] },
      { pageName: 'admin.roles-permissions', actions: ['all'] },
      { pageName: 'permission', actions: ['all'] },
    ],
  },
  // Add more roles here as needed
};

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== SEEDING MANDATORY PERMISSIONS ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  let totalUpdated = 0;
  let totalErrors = 0;

  for (const [roleName, config] of Object.entries(MANDATORY_PERMISSIONS_CONFIG)) {
    console.log(`Processing role: ${roleName}`);

    try {
      // Find the role
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        console.log(`  ❌ Role not found: ${roleName}`);
        totalErrors++;
        continue;
      }

      console.log(`  ✓ Found role: ${role.displayName} (${role._id})`);

      // Build mandatory permissions array
      const mandatoryPermissions = [];
      const pagesNotFound = [];

      for (const permConfig of config.pages) {
        const page = await Page.findOne({ name: permConfig.pageName }).lean();

        if (!page) {
          pagesNotFound.push(permConfig.pageName);
          console.log(`  ⚠️  Page not found: ${permConfig.pageName}`);
          continue;
        }

        mandatoryPermissions.push({
          pageId: page._id,
          actions: permConfig.actions,
        });

        console.log(`    → ${page.displayName}: [${permConfig.actions.join(', ')}]`);
      }

      if (pagesNotFound.length > 0) {
        console.log(`  ⚠️  Skipped ${pagesNotFound.length} pages not found`);
      }

      // Update role with mandatory permissions
      await Role.findByIdAndUpdate(role._id, {
        mandatoryPermissions: mandatoryPermissions,
      });

      console.log(`  ✓ Updated role with ${mandatoryPermissions.length} mandatory permissions`);
      totalUpdated++;

    } catch (error) {
      console.error(`  ❌ Error processing role ${roleName}:`, error.message);
      totalErrors++;
    }

    console.log('');
  }

  // Summary
  console.log('=== SUMMARY ===');
  console.log(`Roles updated: ${totalUpdated}`);
  console.log(`Errors: ${totalErrors}`);

  if (totalUpdated > 0) {
    console.log('\n✓ Mandatory permissions seeded successfully!');
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
