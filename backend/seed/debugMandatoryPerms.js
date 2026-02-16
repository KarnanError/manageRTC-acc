/**
 * Debug Mandatory Permissions
 * Check what's in the database and compare with API response
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Role from '../models/rbac/role.schema.js';
import Page from '../models/rbac/page.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== DEBUGGING MANDATORY PERMISSIONS ===');
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

  console.log('--- ROLE INFO ---');
  console.log('Role Name:', role.displayName);
  console.log('Role ID (type):', typeof role._id, role._id);
  console.log('Role ID (string):', role._id.toString());
  console.log('');

  console.log('--- MANDATORY PERMISSIONS IN ROLE ---');
  const mandatoryPerms = role.mandatoryPermissions || [];
  console.log('Count:', mandatoryPerms.length);
  console.log('');

  for (const m of mandatoryPerms) {
    console.log('PageID (type):', typeof m.pageId);
    console.log('PageID (value):', m.pageId);
    console.log('PageID (toString()):', m.pageId?.toString());
    console.log('Actions:', m.actions);

    // Find the corresponding page
    const page = await Page.findById(m.pageId).lean();
    if (page) {
      console.log('✓ Page found:', page.displayName);
      console.log('  Page route:', page.route);
      console.log('  Page _id (type):', typeof page._id);
      console.log('  Page _id (value):', page._id);
      console.log('  Page _id (toString()):', page._id.toString());
    } else {
      console.log('❌ Page NOT FOUND for this pageId');
    }
    console.log('');
  }

  console.log('--- TESTING MAP LOOKUP ---');
  // Simulate frontend map creation
  const map = new Map();
  mandatoryPerms.forEach(m => {
    const pageIdStr = m.pageId?.toString();
    console.log(`Adding to map: key="${pageIdStr}" (type: ${typeof pageIdStr})`);
    map.set(pageIdStr, m.actions);
  });

  console.log('');
  console.log('Map size:', map.size);
  console.log('Map keys:', Array.from(map.keys()));
  console.log('');

  // Test lookup with different formats
  console.log('--- TESTING LOOKUP ---');
  for (const m of mandatoryPerms) {
    const pageIdObj = m.pageId;  // ObjectId
    const pageIdStr = m.pageId?.toString();  // String

    console.log('\nLooking up page:', pageIdStr);

    // Lookup with ObjectId (will fail)
    const result1 = map.get(pageIdObj);
    console.log('  map.get(ObjectId):', result1 || 'NOT FOUND');

    // Lookup with string (will succeed)
    const result2 = map.get(pageIdStr);
    console.log('  map.get(string):', result2 ? 'FOUND ✓' : 'NOT FOUND');

    // Lookup with explicit toString()
    const result3 = map.get(pageIdObj?.toString());
    console.log('  map.get(ObjectId.toString()):', result3 ? 'FOUND ✓' : 'NOT FOUND');
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
