/**
 * Grant HR role delete access for Termination page
 * Updates role_permissions for page "hrm.termination" to include delete action
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';
config();

import Page from '../models/rbac/page.schema.js';
import Permission from '../models/rbac/permission.schema.js';
import Role from '../models/rbac/role.schema.js';
import RolePermission from '../models/rbac/rolePermission.schema.js';

const DEFAULT_ACTIONS = {
  all: false,
  read: false,
  create: false,
  write: false,
  delete: false,
  import: false,
  export: false,
  approve: false,
  assign: false,
};

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  if (!uri || !dbName) {
    throw new Error('Missing MONGO_URI or MONGODB_DATABASE in environment.');
  }

  console.log('=== GRANT HR TERMINATION DELETE ===');
  console.log('Database:', dbName);

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected');

  const role = await Role.findOne({ name: 'hr', isDeleted: false });
  if (!role) {
    throw new Error('HR role not found.');
  }

  const page = await Page.findOne({ name: 'hrm.termination', isActive: true });
  if (!page) {
    throw new Error('Page "hrm.termination" not found. Run page seeds first.');
  }

  const permission = await Permission.findOne({ pageId: page._id, isActive: true })
    || await Permission.findOrCreateFromPage(page);

  const existing = await RolePermission.findOne({ roleId: role._id, pageId: page._id });

  if (existing) {
    existing.actions = {
      ...DEFAULT_ACTIONS,
      ...(existing.actions || {}),
      delete: true,
    };
    await existing.save();
    console.log('✓ Updated existing role permission: delete=true');
  } else {
    const actions = {
      ...DEFAULT_ACTIONS,
      read: true,
      delete: true,
    };

    await RolePermission.create({
      roleId: role._id,
      pageId: page._id,
      permissionId: permission?._id || null,
      module: permission?.module || page.name,
      displayName: permission?.displayName || page.displayName,
      category: permission?.category || page.moduleCategory || 'hrm',
      route: page.route || null,
      actions,
    });

    console.log('✓ Created role permission with read/delete');
  }

  await mongoose.disconnect();
  console.log('✓ Done');
}

main().catch(async (error) => {
  console.error('❌ Error:', error.message);
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
  process.exit(1);
});
