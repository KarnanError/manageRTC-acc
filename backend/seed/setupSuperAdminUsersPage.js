/**
 * Setup Super Admin Users Page in RBAC
 * Adds the Super Admin Users page to the Pages collection and sets up permissions
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';
import Permission from '../models/rbac/permission.schema.js';
import Role from '../models/rbac/role.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== SETUP SUPER ADMIN USERS PAGE ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  try {
    // Get Category II (Users & Permissions)
    const categoryII = await PageCategory.findOne({ identifier: 'II' }).lean();
    if (!categoryII) {
      console.log('❌ Category II (Users & Permissions) not found');
      await mongoose.disconnect();
      return;
    }
    console.log('✓ Found Category II:', categoryII.displayName);

    // Check if page already exists
    const existingPage = await Page.findOne({ name: 'admin.superadmins' }).lean();
    if (existingPage) {
      console.log('⚠️  Page already exists:', existingPage.displayName);
      console.log('   Skipping page creation. To re-create, delete it first.');
      await mongoose.disconnect();
      return;
    }

    // Create the Super Admin Users page
    const pageData = {
      name: 'admin.superadmins',
      displayName: 'Super Admins',
      description: 'Manage Super Admin users - Create, edit, delete, and manage superadmin accounts with full system access',
      route: 'super-admin/superadmins',
      icon: 'shield',
      moduleCategory: 'super-admin',
      parentPage: null, // Direct child of Users & Permissions category
      isMenuGroup: false,
      menuGroupLevel: null,
      sortOrder: 50,
      isSystem: true,
      isActive: true,
      availableActions: ['all', 'read', 'create', 'write', 'delete'],
      category: categoryII._id,
      meta: {
        keywords: ['superadmin', 'admin', 'users', 'management'],
        layout: 'default',
      },
    };

    const page = await Page.create(pageData);
    console.log('✓ Page created:', page.displayName);
    console.log('  Route:', page.route);
    console.log('  Page ID:', page._id.toString());

    // Create Permission for this page
    const existingPermission = await Permission.findOne({ pageId: page._id }).lean();
    if (!existingPermission) {
      const permissionData = {
        pageId: page._id,
        module: 'admin.superadmins',
        displayName: 'Super Admins',
        category: categoryII._id,
        description: 'Full access to manage Super Admin users',
        isActive: true,
      };

      await Permission.create(permissionData);
      console.log('✓ Permission created');
    } else {
      console.log('⚠️  Permission already exists, skipping');
    }

    // Get the superadmin role
    const superadminRole = await Role.findOne({ name: 'superadmin' }).lean();
    if (!superadminRole) {
      console.log('❌ Super Admin role not found');
      await mongoose.disconnect();
      return;
    }
    console.log('✓ Found Super Admin role:', superadminRole.displayName);

    // Add this page to superadmin's mandatory permissions
    const mandatoryPermissions = superadminRole.mandatoryPermissions || [];
    const alreadyMandatory = mandatoryPermissions.some((mp) => mp.pageId?.toString() === page._id.toString());

    if (!alreadyMandatory) {
      mandatoryPermissions.push({
        pageId: page._id,
        actions: ['all'], // All actions mandatory for superadmin
      });

      await Role.findByIdAndUpdate(superadminRole._id, {
        mandatoryPermissions: mandatoryPermissions,
      });
      console.log('✓ Added to Super Admin mandatory permissions');
    } else {
      console.log('⚠️  Already in Super Admin mandatory permissions');
    }

    // Verify the permission is set in the junction table
    const RolePermission = (await import('../models/rbac/rolePermission.schema.js')).default;
    const junctionEntry = await RolePermission.findOne({
      roleId: superadminRole._id,
      pageId: page._id,
    }).lean();

    if (!junctionEntry) {
      console.log('⚠️  Permission not in junction table. Run sync script to sync.');
    } else {
      // Check if all actions are enabled
      const allActions = ['all', 'read', 'create', 'write', 'delete'];
      const hasAllActions = allActions.every(action =>
        junctionEntry.actions?.[action] === true ||
        (action === 'all' && junctionEntry.actions?.all === true)
      );

      if (hasAllActions) {
        console.log('✓ Junction table has all actions enabled');
      } else {
        console.log('⚠️  Junction table missing some actions');
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log('✓ Super Admin Users page created successfully');
    console.log('✓ Route:', page.route);
    console.log('✓ Category:', categoryII.displayName);
    console.log('✓ Added to Super Admin mandatory permissions');
    console.log('\nNext steps:');
    console.log('1. Install Clerk Admin SDK: npm install @clerk/backend @clerk/clerk-sdk-node nodemailer');
    console.log('2. Configure environment variables (SMTP, Clerk keys)');
    console.log('3. Restart the backend server');
    console.log('4. Access the page at: /super-admin/superadmins');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
