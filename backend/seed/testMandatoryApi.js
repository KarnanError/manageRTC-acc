/**
 * Test Mandatory Permissions API Response
 * Simulates what the frontend receives from /api/rbac/roles/:roleId/permissions
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Role from '../models/rbac/role.schema.js';
import RolePermission from '../models/rbac/rolePermission.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== TESTING MANDATORY PERMISSIONS API RESPONSE ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get Super Admin role
  const role = await Role.findOne({ name: 'superadmin' }).lean();
  if (!role) {
    console.log('❌ Super Admin role not found');
    await mongoose.disconnect();
    return;
  }

  console.log('--- API RESPONSE SIMULATION ---');
  console.log('Role:', role.displayName);
  console.log('Role ID:', role._id.toString());
  console.log('');

  // Simulate what getRolePermissions returns
  const mandatoryPermissions = (role.mandatoryPermissions || []).map(m => ({
    pageId: m.pageId?.toString(),
    actions: m.actions || [],
  }));

  console.log('mandatoryPermissions array:');
  console.log('Count:', mandatoryPermissions.length);
  mandatoryPermissions.forEach(m => {
    console.log(`  { pageId: "${m.pageId}", actions: [${m.actions.map(a => `"${a}"`).join(', ')}] }`);
  });
  console.log('');

  // Simulate frontend Map creation
  console.log('--- FRONTEND MAP CREATION ---');
  const map = new Map();
  mandatoryPermissions.forEach(m => {
    console.log(`map.set("${m.pageId}", [${m.actions.map(a => `"${a}"`).join(', ')}])`);
    map.set(m.pageId, m.actions);
  });

  console.log('');
  console.log('Map keys:', Array.from(map.keys()));
  console.log('Map size:', map.size);
  console.log('');

  // Test lookups with exact keys
  console.log('--- MAP LOOKUP TESTS ---');
  for (const [key, value] of map.entries()) {
    const result = map.get(key);
    console.log(`map.get("${key}") =`, result ? `FOUND: [${result.join(', ')}]` : 'NOT FOUND');
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
