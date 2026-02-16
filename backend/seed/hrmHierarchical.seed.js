/**
 * HRM Hierarchical Pages Seed Script
 * Seeds HRM pages with L1 and L2 parent menu structure
 *
 * Hierarchy:
 * IV. HRM (Category)
 *   └─ Employees (L1 Parent)
 *       └─ Employees List, Department, etc.
 *   └─ Attendance & Leave (L1 Parent)
 *       └─ Leaves (L2 Parent) ⭐
 *           └─ Leaves (Admin), Leaves (Employee), Leave Settings
 *       └─ Attendance (L2 Parent) ⭐
 *           └─ Attendance (Admin), Attendance (Employee), Timesheet
 *       └─ Shift & Schedule (L2 Parent) ⭐
 *           └─ Schedule Timing, Shift Management, Shift Batches, Overtime
 *
 * Usage: node backend/seed/hrmHierarchical.seed.js
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

// HRM hierarchical page structure
const hrmHierarchy = [
  // ==================================================
  // L1 PARENT: Employees
  // ==================================================
  {
    name: 'hrm.employees-menu',
    displayName: 'Employees',
    description: 'Employee Management',
    route: null, // L1 Parent menu - no route
    icon: 'ti ti-users',
    isMenuGroup: true,
    menuGroupLevel: 1, // L1 parent
    sortOrder: 10,
    children: [
      {
        name: 'hrm.employees-list',
        displayName: 'Employees List',
        description: 'Employees List',
        route: '/employees',
        icon: 'ti ti-users',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 10,
      },
      {
        name: 'hrm.departments',
        displayName: 'Department',
        description: 'Department Management',
        route: '/departments',
        icon: 'ti ti-building-arch',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 20,
      },
      {
        name: 'hrm.designations',
        displayName: 'Designation',
        description: 'Designation/Job Titles',
        route: '/designations',
        icon: 'ti ti-badge',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 30,
      },
      {
        name: 'hrm.policies',
        displayName: 'Policies',
        description: 'Company Policies',
        route: '/policy',
        icon: 'ti ti-file-description',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 40,
      },
    ],
  },

  // ==================================================
  // L1 PARENT: Tickets
  // ==================================================
  {
    name: 'hrm.tickets-menu',
    displayName: 'Tickets',
    description: 'Help Desk Tickets',
    route: null,
    icon: 'ti ti-ticket',
    isMenuGroup: true,
    menuGroupLevel: 1,
    sortOrder: 20,
    children: [
      {
        name: 'hrm.tickets-list',
        displayName: 'Ticket List',
        description: 'Ticket List',
        route: '/tickets/ticket-list',
        icon: 'ti ti-ticket',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 10,
      },
    ],
  },

  // ==================================================
  // L1 PARENT: Holidays
  // ==================================================
  {
    name: 'hrm.holidays-menu',
    displayName: 'Holidays',
    description: 'Holiday Management',
    route: null,
    icon: 'ti ti-calendar-event',
    isMenuGroup: true,
    menuGroupLevel: 1,
    sortOrder: 30,
    children: [
      {
        name: 'hrm.holidays-list',
        displayName: 'Holidays',
        description: 'Holidays',
        route: '/hrm/holidays',
        icon: 'ti ti-calendar-event',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 10,
      },
    ],
  },

  // ==================================================
  // L1 PARENT: Attendance & Leave
  // WITH L2 CHILDREN! ⭐
  // ==================================================
  {
    name: 'hrm.attendance-leave-menu',
    displayName: 'Attendance & Leave',
    description: 'Attendance and Leave Management',
    route: null,
    icon: 'ti ti-calendar-check',
    isMenuGroup: true,
    menuGroupLevel: 1,
    sortOrder: 40,
    l2Groups: [
      // L2 PARENT: Leaves
      {
        name: 'hrm.leaves-menu',
        displayName: 'Leaves',
        description: 'Leave Management',
        route: null,
        icon: 'ti ti-calendar-off',
        isMenuGroup: true,
        menuGroupLevel: 2, // L2 parent!
        sortOrder: 10,
        children: [
          {
            name: 'hrm.leaves-admin',
            displayName: 'Leaves (Admin)',
            description: 'Leave Management - Admin View',
            route: '/leaves',
            icon: 'ti ti-calendar-off',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 10,
          },
          {
            name: 'hrm.leaves-employee',
            displayName: 'Leaves (Employee)',
            description: 'Leave Management - Employee View',
            route: '/leaves-employee',
            icon: 'ti ti-calendar-off',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 20,
          },
          {
            name: 'hrm.leave-settings',
            displayName: 'Leave Settings',
            description: 'Leave Configuration',
            route: '/leave-settings',
            icon: 'ti ti-settings',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 30,
          },
        ],
      },
      // L2 PARENT: Attendance
      {
        name: 'hrm.attendance-menu',
        displayName: 'Attendance',
        description: 'Attendance Management',
        route: null,
        icon: 'ti ti-calendar-check',
        isMenuGroup: true,
        menuGroupLevel: 2, // L2 parent!
        sortOrder: 20,
        children: [
          {
            name: 'hrm.attendance-admin',
            displayName: 'Attendance (Admin)',
            description: 'Attendance Management - Admin View',
            route: '/attendance-admin',
            icon: 'ti ti-calendar-check',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 10,
          },
          {
            name: 'hrm.attendance-employee',
            displayName: 'Attendance (Employee)',
            description: 'Attendance Management - Employee View',
            route: '/attendance-employee',
            icon: 'ti ti-calendar-check',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 20,
          },
          {
            name: 'hrm.timesheet',
            displayName: 'Timesheet',
            description: 'Timesheet Management',
            route: '/timesheets',
            icon: 'ti ti-clock',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 30,
          },
        ],
      },
      // L2 PARENT: Shift & Schedule
      {
        name: 'hrm.shift-schedule-menu',
        displayName: 'Shift & Schedule',
        description: 'Shift and Schedule Management',
        route: null,
        icon: 'ti ti-calendar-time',
        isMenuGroup: true,
        menuGroupLevel: 2, // L2 parent!
        sortOrder: 30,
        children: [
          {
            name: 'hrm.schedule-timing',
            displayName: 'Schedule Timing',
            description: 'Schedule Timing',
            route: '/schedule-timing',
            icon: 'ti ti-calendar-time',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 10,
          },
          {
            name: 'hrm.shifts-management',
            displayName: 'Shift Management',
            description: 'Shift Configuration',
            route: '/shifts-management',
            icon: 'ti ti-clock-hour-4',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 20,
          },
          {
            name: 'hrm.batches-management',
            displayName: 'Shift Batches',
            description: 'Shift Batch Management',
            route: '/batches-management',
            icon: 'ti ti-stack',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 30,
          },
          {
            name: 'hrm.overtime',
            displayName: 'Overtime',
            description: 'Overtime Management',
            route: '/overtime',
            icon: 'ti ti-clock-hour-12',
            isMenuGroup: false,
            menuGroupLevel: null,
            sortOrder: 40,
          },
        ],
      },
    ],
  },

  // ==================================================
  // L1 PARENT: Performance
  // ==================================================
  {
    name: 'hrm.performance-menu',
    displayName: 'Performance',
    description: 'Performance Management',
    route: null,
    icon: 'ti ti-chart-bar',
    isMenuGroup: true,
    menuGroupLevel: 1,
    sortOrder: 50,
    children: [
      {
        name: 'hrm.performance-indicator',
        displayName: 'Performance Indicator',
        description: 'Performance Indicators',
        route: '/performance/performance-indicator',
        icon: 'ti ti-chart-bar',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 10,
      },
      {
        name: 'hrm.performance-review',
        displayName: 'Performance Review',
        description: 'Performance Reviews',
        route: '/performance/performance-review',
        icon: 'ti ti-star',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 20,
      },
      {
        name: 'hrm.performance-appraisal',
        displayName: 'Performance Appraisal',
        description: 'Performance Appraisals',
        route: '/performance/performance-appraisal',
        icon: 'ti me-1 ti-trophy',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 30,
      },
      {
        name: 'hrm.goal-tracking',
        displayName: 'Goal List',
        description: 'Goal Tracking',
        route: '/performance/goal-tracking',
        icon: 'ti ti-target',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 40,
      },
      {
        name: 'hrm.goal-type',
        displayName: 'Goal Type',
        description: 'Goal Types',
        route: '/performance/goal-type',
        icon: 'ti ti-flag',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 50,
      },
    ],
  },

  // ==================================================
  // L1 PARENT: Training
  // ==================================================
  {
    name: 'hrm.training-menu',
    displayName: 'Training',
    description: 'Training Management',
    route: null,
    icon: 'ti ti-graduation-cap',
    isMenuGroup: true,
    menuGroupLevel: 1,
    sortOrder: 60,
    children: [
      {
        name: 'hrm.training-list',
        displayName: 'Training List',
        description: 'Training Programs',
        route: null, // No route in page.md
        icon: 'ti ti-graduation-cap',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 10,
      },
      {
        name: 'hrm.trainers',
        displayName: 'Trainers',
        description: 'Trainer Management',
        route: null, // No route in page.md
        icon: 'ti ti-user-star',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 20,
      },
      {
        name: 'hrm.training-type',
        displayName: 'Training Type',
        description: 'Training Types',
        route: null, // No route in page.md
        icon: 'ti ti-tag',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 30,
      },
    ],
  },

  // ==================================================
  // L1 PARENT: Employee Lifecycle
  // ==================================================
  {
    name: 'hrm.lifecycle-menu',
    displayName: 'Employee Lifecycle',
    description: 'Employee Lifecycle Management',
    route: null,
    icon: 'ti ti-arrows-up-down',
    isMenuGroup: true,
    menuGroupLevel: 1,
    sortOrder: 70,
    children: [
      {
        name: 'hrm.promotions',
        displayName: 'Promotions',
        description: 'Employee Promotions',
        route: null, // No route in page.md
        icon: 'ti ti-arrow-up',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 10,
      },
      {
        name: 'hrm.resignation',
        displayName: 'Resignation',
        description: 'Resignation Management',
        route: null, // No route in page.md
        icon: 'ti ti-logout',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 20,
      },
      {
        name: 'hrm.termination',
        displayName: 'Termination',
        description: 'Termination Management',
        route: null, // No route in page.md
        icon: 'ti ti-user-x',
        isMenuGroup: false,
        menuGroupLevel: null,
        sortOrder: 30,
      },
    ],
  },
];

const stats = {
  l1Parents: 0,
  l2Parents: 0,
  children: 0,
  created: 0,
  updated: 0,
  errors: [],
};

async function seedHRMPages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   Database: ${dbName}`);
    await mongoose.connect(uri, { dbName });
    console.log('✅ Connected!\n');

    console.log('📦 Starting HRM Hierarchical Pages Seed...\n');
    console.log('='.repeat(70));

    // Get HRM category
    const hrmCategory = await PageCategory.findOne({ label: 'hrm' });
    if (!hrmCategory) {
      throw new Error('HRM category not found. Run pageCategories.seed.js first.');
    }
    console.log(`✅ Found HRM Category: ${hrmCategory.displayName}\n`);

    for (const l1Def of hrmHierarchy) {
      try {
        // Create or update L1 parent menu
        let l1Page = await Page.findOne({ name: l1Def.name });

        const l1Data = {
          name: l1Def.name,
          displayName: l1Def.displayName,
          description: l1Def.description,
          route: l1Def.route,
          icon: l1Def.icon,
          category: hrmCategory._id,
          parentPage: null, // L1 has no parent (direct child of category)
          level: 1, // Child of category
          depth: 2, // Category -> L1 = depth 2
          isMenuGroup: l1Def.isMenuGroup,
          menuGroupLevel: l1Def.menuGroupLevel,
          sortOrder: l1Def.sortOrder,
          availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
          isSystem: true,
        };

        if (l1Page) {
          Object.assign(l1Page, l1Data);
          await l1Page.save();
          stats.updated++;
          console.log(`✏️  Updated L1: ${l1Def.displayName} (${l1Def.name})`);
        } else {
          l1Page = new Page(l1Data);
          await l1Page.save();
          stats.created++;
          stats.l1Parents++;
          console.log(`✅ Created L1: ${l1Def.displayName} (${l1Def.name})`);
        }

        // Handle direct children (if no L2 groups)
        if (l1Def.children && !l1Def.l2Groups) {
          for (const childDef of l1Def.children) {
            try {
              let childPage = await Page.findOne({ name: childDef.name });

              const childData = {
                name: childDef.name,
                displayName: childDef.displayName,
                description: childDef.description,
                route: childDef.route,
                icon: childDef.icon,
                category: hrmCategory._id,
                parentPage: l1Page._id, // Child of L1
                level: 2, // Child of L1
                depth: 3, // Category -> L1 -> Child = depth 3
                isMenuGroup: childDef.isMenuGroup,
                menuGroupLevel: childDef.menuGroupLevel,
                sortOrder: childDef.sortOrder,
                availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
                isSystem: true,
              };

              if (childPage) {
                Object.assign(childPage, childData);
                await childPage.save();
                stats.updated++;
                console.log(`  ✏️  Updated child: ${childDef.displayName}`);
              } else {
                childPage = new Page(childData);
                await childPage.save();
                stats.created++;
                stats.children++;
                console.log(`  ✅ Created child: ${childDef.displayName}`);
              }
            } catch (error) {
              console.error(`  ❌ Error creating child ${childDef.name}: ${error.message}`);
              stats.errors.push({ page: childDef.name, error: error.message });
            }
          }
        }

        // Handle L2 groups (if present)
        if (l1Def.l2Groups) {
          for (const l2Def of l1Def.l2Groups) {
            try {
              // Create L2 parent menu
              let l2Page = await Page.findOne({ name: l2Def.name });

              const l2Data = {
                name: l2Def.name,
                displayName: l2Def.displayName,
                description: l2Def.description,
                route: l2Def.route,
                icon: l2Def.icon,
                category: hrmCategory._id,
                parentPage: l1Page._id, // Child of L1
                level: 2, // Child of L1
                depth: 3, // Category -> L1 -> L2 = depth 3
                isMenuGroup: l2Def.isMenuGroup,
                menuGroupLevel: l2Def.menuGroupLevel,
                sortOrder: l2Def.sortOrder,
                availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
                isSystem: true,
              };

              if (l2Page) {
                Object.assign(l2Page, l2Data);
                await l2Page.save();
                stats.updated++;
                console.log(`    ✏️  Updated L2: ${l2Def.displayName} (${l2Def.name})`);
              } else {
                l2Page = new Page(l2Data);
                await l2Page.save();
                stats.created++;
                stats.l2Parents++;
                console.log(`    ✅ Created L2: ${l2Def.displayName} (${l2Def.name})`);
              }

              // Handle L2's children
              if (l2Def.children) {
                for (const childDef of l2Def.children) {
                  try {
                    let childPage = await Page.findOne({ name: childDef.name });

                    const childData = {
                      name: childDef.name,
                      displayName: childDef.displayName,
                      description: childDef.description,
                      route: childDef.route,
                      icon: childDef.icon,
                      category: hrmCategory._id,
                      parentPage: l2Page._id, // Child of L2
                      level: 3, // Child of L2
                      depth: 4, // Category -> L1 -> L2 -> Child = depth 4
                      isMenuGroup: childDef.isMenuGroup,
                      menuGroupLevel: childDef.menuGroupLevel,
                      sortOrder: childDef.sortOrder,
                      availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
                      isSystem: true,
                    };

                    if (childPage) {
                      Object.assign(childPage, childData);
                      await childPage.save();
                      stats.updated++;
                      console.log(`      ✏️  Updated child: ${childDef.displayName}`);
                    } else {
                      childPage = new Page(childData);
                      await childPage.save();
                      stats.created++;
                      stats.children++;
                      console.log(`      ✅ Created child: ${childDef.displayName}`);
                    }
                  } catch (error) {
                    console.error(`      ❌ Error creating child ${childDef.name}: ${error.message}`);
                    stats.errors.push({ page: childDef.name, error: error.message });
                  }
                }
              }
            } catch (error) {
              console.error(`    ❌ Error creating L2 ${l2Def.name}: ${error.message}`);
              stats.errors.push({ page: l2Def.name, error: error.message });
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing L1 ${l1Def.name}: ${error.message}`);
        stats.errors.push({ page: l1Def.name, error: error.message });
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SEED SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Created: ${stats.created}`);
    console.log(`✏️  Updated: ${stats.updated}`);
    console.log(`   L1 Parents: ${stats.l1Parents}`);
    console.log(`   L2 Parents: ${stats.l2Parents}`);
    console.log(`   Children: ${stats.children}`);
    console.log(`❌ Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Error Details:');
      stats.errors.forEach(err => {
        console.log(`   - ${err.page}: ${err.error}`);
      });
    }

    // Verify HRM pages
    console.log('\n📋 HRM Pages in Database:');
    const hrmPages = await Page.find({ category: hrmCategory._id }).sort({ level: 1, sortOrder: 1 });
    console.log(`   Total: ${hrmPages.length}`);
    console.log(`   L1 Parents: ${hrmPages.filter(p => p.level === 1 && p.isMenuGroup).length}`);
    console.log(`   L2 Parents: ${hrmPages.filter(p => p.level === 2 && p.isMenuGroup).length}`);
    console.log(`   Children: ${hrmPages.filter(p => !p.isMenuGroup).length}`);

    console.log('\n✅ HRM Pages seed complete!');

    await mongoose.disconnect();

  } catch (error) {
    console.error('\n❌ Seed Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedHRMPages();
