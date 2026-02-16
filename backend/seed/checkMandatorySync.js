/**
 * Check Mandatory Permissions Sync
 * Verifies if mandatory permissions are synced with actual permissions
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== CHECKING MANDATORY PERMISSIONS SYNC ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  const Role = mongoose.model('Role', new mongoose.Schema({}, { strict: false }), 'roles');
  const RolePermission = mongoose.model('RolePermission', new mongoose.Schema({}, { strict: false }), 'role_permissions');

  // Get Super Admin role
  const role = await Role.findOne({ name: 'superadmin' }).lean();
  if (!role) {
    console.log('❌ Super Admin role not found');
    await mongoose.disconnect();
    return;
  }

  console.log('Role:', role.displayName);
  console.log('Role ID:', role._id);

  // Check mandatory permissions in role
  console.log('\n--- MANDATORY PERMISSIONS IN ROLE ---');
  const mandatoryPerms = role.mandatoryPermissions || [];
  console.log('Count:', mandatoryPerms.length);
  mandatoryPerms.forEach(m => {
    console.log('  PageID:', m.pageId?.toString());
    console.log('  Actions:', m.actions);
  });

  // Check actual permissions in junction table
  console.log('\n--- ACTUAL PERMISSIONS IN JUNCTION TABLE ---');
  const actualPerms = await RolePermission.find({ roleId: role._id }).lean();
  console.log('Count:', actualPerms.length);

  // Compare
  console.log('\n--- COMPARISON ---');
  const missingInActual = mandatoryPerms.filter(m => {
    return !actualPerms.some(p => p.pageId?.toString() === m.pageId?.toString());
  });

  if (missingInActual.length > 0) {
    console.log('Missing in actual permissions:', missingInActual.length);
    missingInActual.forEach(m => {
      console.log('  PageID:', m.pageId?.toString(), '- NOT FOUND in junction table');
    });
  } else {
    console.log('All mandatory permissions exist in junction table ✓');
  }

  // Check if mandatory actions are enabled in actual permissions
  console.log('\n--- CHECKING IF MANDATORY ACTIONS ARE ENABLED ---');
  let issuesFound = 0;

  for (const mandatory of mandatoryPerms) {
    const actualPerm = actualPerms.find(p => p.pageId?.toString() === mandatory.pageId?.toString());

    if (!actualPerm) {
      console.log('⚠️  PageID:', mandatory.pageId?.toString(), '- Missing from junction table');
      issuesFound++;
      continue;
    }

    const mandatoryActions = mandatory.actions || [];
    const actualActions = actualPerm.actions || {};

    for (const action of mandatoryActions) {
      if (action === 'all') {
        // Check if all actions are enabled
        const allKeys = ['read', 'create', 'write', 'delete', 'import', 'export', 'approve', 'assign'];
        const allEnabled = allKeys.every(k => actualActions[k] === true);
        if (!allEnabled) {
          console.log('❌ PageID:', mandatory.pageId?.toString(), '- Not all actions enabled despite "all" being mandatory');
          issuesFound++;
        }
      } else {
        if (actualActions[action] !== true) {
          console.log('❌ PageID:', mandatory.pageId?.toString(), '- Action', action, 'is not enabled (should be mandatory)');
          issuesFound++;
        }
      }
    }
  }

  if (issuesFound === 0) {
    console.log('✓ All mandatory actions are properly enabled');
  } else {
    console.log('\n❌ Found', issuesFound, 'issues with mandatory permissions sync');
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
