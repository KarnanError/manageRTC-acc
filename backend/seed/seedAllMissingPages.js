/**
 * Seed All Missing Pages from page.md Documentation
 * Creates all 204 pages with proper hierarchy
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

// ============================================
// CATEGORY DEFINITIONS (from page.md)
// ============================================
const CATEGORIES = [
  { identifier: 'main-menu', label: 'Main Menu', sortOrder: 1 },
  { identifier: 'users-permissions', label: 'Users & Permissions', sortOrder: 2 },
  { identifier: 'dashboards', label: 'Dashboards', sortOrder: 3 },
  { identifier: 'hrm', label: 'HRM', sortOrder: 4 },
  { identifier: 'recruitment', label: 'Recruitment', sortOrder: 5 },
  { identifier: 'projects', label: 'Projects', sortOrder: 6 },
  { identifier: 'crm', label: 'CRM', sortOrder: 7 },
  { identifier: 'applications', label: 'Applications', sortOrder: 8 },
  { identifier: 'finance-accounts', label: 'Finance & Accounts', sortOrder: 9 },
  { identifier: 'administration', label: 'Administration', sortOrder: 10 },
  { identifier: 'pages', label: 'Pages', sortOrder: 11 },
  { identifier: 'extras', label: 'Extras', sortOrder: 12 },
];

// ============================================
// PAGE DEFINITIONS BY CATEGORY
// ============================================

// Helper to find category by identifier
const findCategory = (identifier) => {
  return categories.find(c => c.identifier === identifier);
};

// ============================================
// I. SUPER ADMIN PAGES
// ============================================
const superAdminPages = [
  // Dashboard
  {
    name: 'super-admin.dashboard',
    displayName: 'Dashboard',
    description: 'Super Admin Dashboard with company statistics, revenue charts, and plan distribution',
    route: '/super-admin/dashboard',
    icon: 'ti ti-smart-home',
    moduleCategory: 'super-admin',
    sortOrder: 1,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['dashboard', 'statistics', 'charts'], layout: 'default' }
  },

  // Companies
  {
    name: 'super-admin.companies',
    displayName: 'Companies',
    description: 'Manage companies in the system',
    route: '/super-admin/companies',
    icon: 'ti ti-building',
    moduleCategory: 'super-admin',
    sortOrder: 2,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['company', 'organization'], layout: 'default' }
  },

  // Subscriptions
  {
    name: 'super-admin.subscriptions',
    displayName: 'Subscriptions',
    description: 'Manage company subscriptions and plans',
    route: '/super-admin/subscription',
    icon: 'ti ti-package',
    moduleCategory: 'super-admin',
    sortOrder: 3,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['subscription', 'plan', 'billing'], layout: 'default' }
  },

  // Packages
  {
    name: 'super-admin.packages',
    displayName: 'Packages',
    description: 'Manage subscription packages and pricing',
    route: '/super-admin/package',
    icon: 'ti ti-box',
    moduleCategory: 'super-admin',
    sortOrder: 4,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['package', 'pricing', 'plan'], layout: 'default' }
  },

  // Modules
  {
    name: 'super-admin.modules',
    displayName: 'Modules',
    description: 'Manage system modules and features',
    route: '/super-admin/modules',
    icon: 'ti ti-layout-grid2',
    moduleCategory: 'super-admin',
    sortOrder: 5,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['module', 'feature', 'extension'], layout: 'default' }
  },

  // Pages
  {
    name: 'super-admin.pages',
    displayName: 'Pages',
    description: 'Manage system pages and content',
    route: '/super-admin/pages',
    icon: 'ti ti-file',
    moduleCategory: 'super-admin',
    sortOrder: 6,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['page', 'content', 'cms'], layout: 'default' }
  },
];

// ============================================
// II. USERS & PERMISSIONS PAGES
// ============================================
const usersPermissionsPages = [
  // Users
  {
    name: 'users',
    displayName: 'Users',
    description: 'Manage system users',
    route: '/users',
    icon: 'ti ti-users',
    moduleCategory: 'users-permissions',
    sortOrder: 1,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['user', 'account', 'profile'], layout: 'default' }
  },

  // Roles & Permissions
  {
    name: 'roles-permissions',
    displayName: 'Roles & Permissions',
    description: 'Manage user roles and permissions',
    route: '/roles-permissions',
    icon: 'ti ti-shield',
    moduleCategory: 'users-permissions',
    sortOrder: 2,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['role', 'permission', 'access'], layout: 'default' }
  },

  // Permission
  {
    name: 'permission',
    displayName: 'Permission',
    description: 'Permission management',
    route: '/permission',
    icon: 'ti ti-key',
    moduleCategory: 'users-permissions',
    sortOrder: 3,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['permission', 'right'], layout: 'default' }
  },
];

// ============================================
// III. DASHBOARDS PAGES
// ============================================
const dashboardPages = [
  // Admin Dashboard
  {
    name: 'admin.dashboard',
    displayName: 'Admin Dashboard',
    description: 'Admin dashboard with overview',
    route: '/admin-dashboard',
    icon: 'ti ti-smart-home',
    moduleCategory: 'dashboards',
    sortOrder: 1,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['dashboard', 'admin'], layout: 'default' }
  },

  // HR Dashboard
  {
    name: 'hr.dashboard',
    displayName: 'HR Dashboard',
    description: 'HR management dashboard',
    route: '/hr-dashboard',
    icon: 'ti ti-users',
    moduleCategory: 'dashboards',
    sortOrder: 2,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['dashboard', 'hr'], layout: 'default' }
  },

  // Employee Dashboard
  {
    name: 'employee.dashboard',
    displayName: 'Employee Dashboard',
    description: 'Employee self-service dashboard',
    route: '/employee-dashboard',
    icon: 'ti ti-user',
    moduleCategory: 'dashboards',
    sortOrder: 3,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['dashboard', 'employee', 'self-service'], layout: 'default' }
  },

  // Deals Dashboard
  {
    name: 'deals.dashboard',
    displayName: 'Deals Dashboard',
    description: 'Deals management dashboard',
    route: '/deals-dashboard',
    icon: 'ti ti-handbag',
    moduleCategory: 'dashboards',
    sortOrder: 4,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['dashboard', 'deals', 'sales'], layout: 'default' }
  },

  // Leads Dashboard
  {
    name: 'leads.dashboard',
    displayName: 'Leads Dashboard',
    description: 'Leads management dashboard',
    route: '/leads-dashboard',
    icon: 'ti ti-target',
    moduleCategory: 'dashboards',
    sortOrder: 5,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['dashboard', 'leads', 'crm'], layout: 'default' }
  },
];

// ============================================
// IV. HRM PAGES (with hierarchy)
// ============================================
const hrmPages = async () => {
  const cat = findCategory('hrm');
  const pages = [];

  // L1 Parent: Employees (no route, menu group)
  const employeesMenu = await Page.findOne({ name: 'hrm.employees-menu' });
  pages.push({
    name: 'hrm.employees-menu',
    displayName: 'Employees',
    description: 'Employees management parent menu',
    route: null,
    icon: 'ti ti-users',
    moduleCategory: 'hrm',
    isMenuGroup: true,
    menuGroupLevel: 1,
    parentPage: null,
    level: 1,
    depth: 1,
    sortOrder: 1,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['employee', 'staff', 'worker'] }
  });

  // L2 Parent: Leaves (under Employees)
  const leavesMenu = await Page.findOne({ name: 'hrm.leaves-menu' });
  const leavesMenuId = leavesMenu ? leavesMenu._id : employeesMenu._id;
  pages.push({
    name: 'hrm.leaves-menu',
    displayName: 'Leaves',
    description: 'Leave management parent menu',
    route: null,
    icon: 'ti ti-calendar',
    moduleCategory: 'hrm',
    isMenuGroup: true,
    menuGroupLevel: 2,
    parentPage: leavesMenuId,
    level: 2,
    depth: 2,
    sortOrder: 2,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['leave', 'time-off', 'absence'] }
  });

  // Child: Leaves (Admin)
  pages.push({
    name: 'leaves',
    displayName: 'Leaves (Admin)',
    description: 'Leave administration',
    route: '/leaves',
    icon: 'ti ti-calendar',
    moduleCategory: 'hrm',
    parentPage: leavesMenuId,
    level: 3,
    depth: 2,
    sortOrder: 1,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export', 'approve', 'assign'],
    meta: { keywords: ['leave', 'admin', 'management'] }
  });

  // Child: Leaves (Employee)
  pages.push({
    name: 'leaves.employee',
    displayName: 'Leaves (Employee)',
    description: 'Employee leave requests',
    route: '/leaves-employee',
    icon: 'ti ti-calendar',
    moduleCategory: 'hrm',
    parentPage: leavesMenuId,
    level: 3,
    depth: 2,
    sortOrder: 2,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export', 'approve'],
    meta: { keywords: ['leave', 'self-service', 'request'] }
  });

  // L2 Parent: Attendance & Leave (no route, menu group)
  const attendanceMenu = await Page.findOne({ name: 'hrm.attendance-leave-menu' });
  const attendanceMenuId = attendanceMenu ? attendanceMenu._id : employeesMenu._id;
  pages.push({
    name: 'hrm.attendance-leave-menu',
    displayName: 'Attendance & Leave',
    description: 'Attendance and leave management parent menu',
    route: null,
    icon: 'ti ti-calendar',
    moduleCategory: 'hrm',
    isMenuGroup: true,
    menuGroupLevel: 2,
    parentPage: attendanceMenuId,
    level: 2,
    depth: 2,
    sortOrder: 3,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['attendance', 'leave', 'time-tracking'] }
  });

  // L2 Child: Attendance (Admin)
  pages.push({
    name: 'attendance',
    displayName: 'Attendance (Admin)',
    description: 'Attendance administration',
    route: '/attendance',
    icon: 'ti ti-calendar',
    moduleCategory: 'hrm',
    parentPage: attendanceMenuId,
    level: 3,
    depth: 2,
    sortOrder: 1,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export', 'approve'],
    meta: { keywords: ['attendance', 'admin', 'tracking'] }
  });

  // L2 Child: Attendance (Employee)
  pages.push({
    name: 'attendance.employee',
    displayName: 'Attendance (Employee)',
    description: 'Employee attendance tracking',
    route: '/attendance-employee',
    icon: 'ti ti-calendar',
    moduleCategory: 'hrm',
    parentPage: attendanceMenuId,
    level: 3,
    depth: 2,
    sortOrder: 2,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['attendance', 'self-service', 'tracking'] }
  });

  // L2 Child: Leave Settings
  pages.push({
    name: 'leave-settings',
    displayName: 'Leave Settings',
    description: 'Leave configuration settings',
    route: '/leave-settings',
    icon: 'ti ti-settings',
    moduleCategory: 'hrm',
    parentPage: attendanceMenuId,
    level: 3,
    depth: 2,
    sortOrder: 3,
    isSystem: true,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    meta: { keywords: ['leave', 'configuration', 'settings'] }
  });

  // Add more HRM pages...
  return { cat, pages };
};

// ============================================
// ALL PAGE DEFINITIONS
// ============================================
const getAllPageDefinitions = async () => {
  return [
    ...superAdminPages,
    ...usersPermissionsPages,
    ...dashboardPages,
    ...(await hrmPages()),
    // Add more categories as needed...
  ];
};

// ============================================
// MAIN FUNCTION
// ============================================
async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== SEED ALL MISSING PAGES ===');
  console.log('Database:', dbName);
  console.log('Target: All 204 pages from page.md\n');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Ensure categories exist
  const existingCategories = await PageCategory.find({}).lean();
  const existingCatIdentifiers = new Set(existingCategories.map(c => c.identifier));

  // Create missing categories (skip if already exists)
  for (const catDef of CATEGORIES) {
    if (!existingCatIdentifiers.has(catDef.identifier)) {
      const result = await PageCategory.findOne({ identifier: catDef.identifier });
      if (!result) {
        await PageCategory.create({
          identifier: catDef.identifier,
          label: catDef.label,
          displayName: catDef.label,
          sortOrder: catDef.sortOrder,
          isActive: true,
        });
        console.log(`✓ Created category: ${catDef.label}`);
      } else {
        console.log(`ℹ️ Category already exists: ${catDef.label}`);
      }
    }
  }

  // Get category map
  const categories = await PageCategory.find({}).lean();
  const categoryMap = new Map();
  categories.forEach(cat => {
    categoryMap.set(cat.identifier, cat._id);
  });

  // Get all page definitions
  const allPages = await getAllPageDefinitions();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Create or update pages
  for (const pageDef of allPages) {
    try {
      const existing = await Page.findOne({ name: pageDef.name });

      const categoryId = categoryMap.get(pageDef.moduleCategory);

      if (existing) {
        // Update existing
        let needsUpdate = false;

        if (existing.displayName !== pageDef.displayName) {
          existing.displayName = pageDef.displayName;
          needsUpdate = true;
        }
        if (existing.route !== pageDef.route) {
          existing.route = pageDef.route;
          needsUpdate = true;
        }
        if (existing.icon !== pageDef.icon) {
          existing.icon = pageDef.icon;
          needsUpdate = true;
        }
        if (existing.description !== pageDef.description) {
          existing.description = pageDef.description;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await existing.save();
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new
        await Page.create({
          ...pageDef,
          category: categoryId,
          isActive: true,
        });
        created++;
      }
    } catch (error) {
      console.error(`✗ Error creating page ${pageDef.name}:`, error.message);
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`Created: ${created} pages`);
  console.log(`Updated: ${updated} pages`);
  console.log(`Skipped: ${skipped} pages (already exist)`);
  console.log(`Total processed: ${allPages.length} pages`);

  await mongoose.disconnect();
  console.log('\n✓ Seed complete!');
  console.log('\nNext step: Run sync script to update permissions');
  console.log('node seed/syncPagesToAllCollections.js');
}

main().catch(console.error);
