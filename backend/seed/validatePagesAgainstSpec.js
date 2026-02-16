/**
 * Validate Pages Database Against page.md Specification
 *
 * This script compares the pages in the database with the expected
 * pages from .ferb/docs/docs_output/RBAC_ALL/pages/page.md
 *
 * Run: node backend/seed/validatePagesAgainstSpec.js
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

// ============================================================================
// EXPECTED PAGES FROM page.md
// ============================================================================

const EXPECTED_PAGES = {
  // I. Main Menu
  'super-admin.dashboard': { category: 'main-menu', route: 'super-admin/dashboard', displayName: 'Dashboard' },
  'super-admin.companies': { category: 'main-menu', route: 'super-admin/companies', displayName: 'Companies' },
  'super-admin.subscriptions': { category: 'main-menu', route: 'super-admin/subscription', displayName: 'Subscriptions' },
  'super-admin.packages': { category: 'main-menu', route: 'super-admin/package', displayName: 'Packages' },
  'super-admin.modules': { category: 'main-menu', route: 'super-admin/modules', displayName: 'Modules' },
  'super-admin.pages': { category: 'main-menu', route: 'super-admin/pages', displayName: 'Pages' },

  // II. Users & Permissions
  'users': { category: 'users-permissions', route: 'users', displayName: 'Users' },
  'roles-permissions': { category: 'users-permissions', route: 'roles-permissions', displayName: 'Roles & Permissions' },
  'permission': { category: 'users-permissions', route: 'permission', displayName: 'Permission' },

  // III. Dashboards
  'admin.dashboard': { category: 'dashboards', route: 'admin-dashboard', displayName: 'Admin Dashboard' },
  'hr.dashboard': { category: 'dashboards', route: 'hr-dashboard', displayName: 'HR Dashboard' },
  'employee.dashboard': { category: 'dashboards', route: 'employee-dashboard', displayName: 'Employee Dashboard' },
  'deals.dashboard': { category: 'dashboards', route: 'deals-dashboard', displayName: 'Deals Dashboard' },
  'leads.dashboard': { category: 'dashboards', route: 'leads-dashboard', displayName: 'Leads Dashboard' },

  // IV. HRM
  // L1: Employees (no route - parent menu)
  'hrm.employees-menu': { category: 'hrm', route: null, displayName: 'Employees', isMenuGroup: true, menuGroupLevel: 1 },
  'hrm.employees-list': { category: 'hrm', route: 'employees', displayName: 'Employees List', parent: 'hrm.employees-menu' },
  'hrm.departments': { category: 'hrm', route: 'departments', displayName: 'Department', parent: 'hrm.employees-menu' },
  'hrm.designations': { category: 'hrm', route: 'designations', displayName: 'Designation', parent: 'hrm.employees-menu' },
  'hrm.policies': { category: 'hrm', route: 'policy', displayName: 'Policies', parent: 'hrm.employees-menu' },
  // Direct page: Tickets
  'hrm.tickets': { category: 'hrm', route: 'tickets/ticket-list', displayName: 'Tickets' },
  // Direct page: Holidays
  'hrm.holidays': { category: 'hrm', route: 'hrm/holidays', displayName: 'Holidays' },
  // L1: Attendance & Leave (no route - parent menu)
  'hrm.attendance-leave-menu': { category: 'hrm', route: null, displayName: 'Attendance & Leave', isMenuGroup: true, menuGroupLevel: 1 },
  // L2: Leaves (no route - parent menu)
  'hrm.leaves-menu': { category: 'hrm', route: null, displayName: 'Leaves', isMenuGroup: true, menuGroupLevel: 2, parent: 'hrm.attendance-leave-menu' },
  'hrm.leaves-admin': { category: 'hrm', route: 'leaves', displayName: 'Leaves (Admin)', parent: 'hrm.leaves-menu' },
  'hrm.leaves-employee': { category: 'hrm', route: 'leaves-employee', displayName: 'Leaves (Employee)', parent: 'hrm.leaves-menu' },
  'hrm.leave-settings': { category: 'hrm', route: 'leave-settings', displayName: 'Leave Settings', parent: 'hrm.leaves-menu' },
  // L2: Attendance (no route - parent menu)
  'hrm.attendance-menu': { category: 'hrm', route: null, displayName: 'Attendance', isMenuGroup: true, menuGroupLevel: 2, parent: 'hrm.attendance-leave-menu' },
  'hrm.attendance-admin': { category: 'hrm', route: 'attendance-admin', displayName: 'Attendance (Admin)', parent: 'hrm.attendance-menu' },
  'hrm.attendance-employee': { category: 'hrm', route: 'attendance-employee', displayName: 'Attendance (Employee)', parent: 'hrm.attendance-menu' },
  'hrm.timesheet': { category: 'hrm', route: 'timesheets', displayName: 'Timesheet', parent: 'hrm.attendance-menu' },
  // L2: Shift & Schedule (no route - parent menu)
  'hrm.shift-schedule-menu': { category: 'hrm', route: null, displayName: 'Shift & Schedule', isMenuGroup: true, menuGroupLevel: 2, parent: 'hrm.attendance-leave-menu' },
  'hrm.schedule-timing': { category: 'hrm', route: 'schedule-timing', displayName: 'Schedule Timing', parent: 'hrm.shift-schedule-menu' },
  'hrm.shifts-management': { category: 'hrm', route: 'shifts-management', displayName: 'Shift Management', parent: 'hrm.shift-schedule-menu' },
  'hrm.batches-management': { category: 'hrm', route: 'batches-management', displayName: 'Shift Batches', parent: 'hrm.shift-schedule-menu' },
  'hrm.overtime': { category: 'hrm', route: 'overtime', displayName: 'Overtime', parent: 'hrm.shift-schedule-menu' },
  // L1: Performance (no route - parent menu)
  'hrm.performance-menu': { category: 'hrm', route: null, displayName: 'Performance', isMenuGroup: true, menuGroupLevel: 1 },
  'hrm.performance-indicator': { category: 'hrm', route: 'performance/performance-indicator', displayName: 'Performance Indicator', parent: 'hrm.performance-menu' },
  'hrm.performance-review': { category: 'hrm', route: 'performance/performance-review', displayName: 'Performance Review', parent: 'hrm.performance-menu' },
  'hrm.performance-appraisal': { category: 'hrm', route: 'performance/performance-appraisal', displayName: 'Performance Appraisal', parent: 'hrm.performance-menu' },
  'hrm.goal-tracking': { category: 'hrm', route: 'performance/goal-tracking', displayName: 'Goal List', parent: 'hrm.performance-menu' },
  'hrm.goal-type': { category: 'hrm', route: 'performance/goal-type', displayName: 'Goal Type', parent: 'hrm.performance-menu' },
  // L1: Training (no route - parent menu)
  'hrm.training-menu': { category: 'hrm', route: null, displayName: 'Training', isMenuGroup: true, menuGroupLevel: 1 },
  'hrm.training-list': { category: 'hrm', route: null, displayName: 'Training List', parent: 'hrm.training-menu' },
  'hrm.trainers': { category: 'hrm', route: null, displayName: 'Trainers', parent: 'hrm.training-menu' },
  'hrm.training-type': { category: 'hrm', route: null, displayName: 'Training Type', parent: 'hrm.training-menu' },
  // L1: Employee Lifecycle (no route - parent menu)
  'hrm.employee-lifecycle-menu': { category: 'hrm', route: null, displayName: 'Employee Lifecycle', isMenuGroup: true, menuGroupLevel: 1 },
  'hrm.promotions': { category: 'hrm', route: null, displayName: 'Promotions', parent: 'hrm.employee-lifecycle-menu' },
  'hrm.resignation': { category: 'hrm', route: null, displayName: 'Resignation', parent: 'hrm.employee-lifecycle-menu' },
  'hrm.termination': { category: 'hrm', route: null, displayName: 'Termination', parent: 'hrm.employee-lifecycle-menu' },

  // V. Recruitment
  'recruitment.jobs': { category: 'recruitment', route: null, displayName: 'Jobs' },
  'recruitment.candidates': { category: 'recruitment', route: null, displayName: 'Candidates' },
  'recruitment.referrals': { category: 'recruitment', route: null, displayName: 'Referrals' },

  // VI. Projects
  // Direct page: Clients
  'projects.clients': { category: 'projects', route: 'clients-grid', displayName: 'Clients' },
  // L1: Projects (no route - parent menu)
  'projects.projects-menu': { category: 'projects', route: null, displayName: 'Projects', isMenuGroup: true, menuGroupLevel: 1 },
  'projects.projects-grid': { category: 'projects', route: 'projects-grid', displayName: 'Projects Grid', parent: 'projects.projects-menu' },
  'projects.tasks': { category: 'projects', route: 'tasks', displayName: 'Tasks', parent: 'projects.projects-menu' },
  'projects.task-board': { category: 'projects', route: 'task-board', displayName: 'Task Board', parent: 'projects.projects-menu' },

  // VII. CRM
  'crm.contacts': { category: 'crm', route: null, displayName: 'Contacts' },
  'crm.companies': { category: 'crm', route: null, displayName: 'Companies' },
  'crm.deals': { category: 'crm', route: null, displayName: 'Deals' },
  'crm.leads': { category: 'crm', route: null, displayName: 'Leads' },
  'crm.pipeline': { category: 'crm', route: null, displayName: 'Pipeline' },
  'crm.analytics': { category: 'crm', route: null, displayName: 'Analytics' },
  'crm.activities': { category: 'crm', route: null, displayName: 'Activities' },

  // VIII. Applications
  'apps.chat': { category: 'applications', route: 'application/chat', displayName: 'Chat' },
  // L1: Call (no route - parent menu)
  'apps.call-menu': { category: 'applications', route: null, displayName: 'Call', isMenuGroup: true, menuGroupLevel: 1 },
  'apps.voice-call': { category: 'applications', route: 'application/voice-call', displayName: 'Voice Call', parent: 'apps.call-menu' },
  'apps.video-call': { category: 'applications', route: 'application/video-call', displayName: 'Video Call', parent: 'apps.call-menu' },
  'apps.outgoing-call': { category: 'applications', route: 'application/outgoing-call', displayName: 'Outgoing Call', parent: 'apps.call-menu' },
  'apps.incoming-call': { category: 'applications', route: 'application/incoming-call', displayName: 'Incoming Call', parent: 'apps.call-menu' },
  'apps.call-history': { category: 'applications', route: 'application/call-history', displayName: 'Call History', parent: 'apps.call-menu' },
  'apps.calendar': { category: 'applications', route: 'calendar', displayName: 'Calendar' },
  'apps.email': { category: 'applications', route: 'application/email', displayName: 'Email' },
  'apps.todo': { category: 'applications', route: 'application/todo', displayName: 'To Do' },
  'apps.notes': { category: 'applications', route: 'notes', displayName: 'Notes' },
  'apps.social-feed': { category: 'applications', route: 'application/social-feed', displayName: 'Social Feed' },
  'apps.file-manager': { category: 'applications', route: 'application/file-manager', displayName: 'File Manager' },
  'apps.kanban': { category: 'applications', route: 'application/kanban-view', displayName: 'Kanban' },
  'apps.invoices': { category: 'applications', route: 'application/invoices', displayName: 'Invoices' },

  // IX. Finance & Accounts
  // L1: Sales (no route - parent menu)
  'finance.sales-menu': { category: 'finance-accounts', route: null, displayName: 'Sales', isMenuGroup: true, menuGroupLevel: 1 },
  'finance.estimates': { category: 'finance-accounts', route: null, displayName: 'Estimates', parent: 'finance.sales-menu' },
  'finance.invoices': { category: 'finance-accounts', route: null, displayName: 'Invoices', parent: 'finance.sales-menu' },
  'finance.payments': { category: 'finance-accounts', route: null, displayName: 'Payments', parent: 'finance.sales-menu' },
  'finance.expenses': { category: 'finance-accounts', route: null, displayName: 'Expenses', parent: 'finance.sales-menu' },
  'finance.provident-fund': { category: 'finance-accounts', route: null, displayName: 'Provident Fund', parent: 'finance.sales-menu' },
  'finance.taxes': { category: 'finance-accounts', route: null, displayName: 'Taxes', parent: 'finance.sales-menu' },
  // L1: Accounting (no route - parent menu)
  'finance.accounting-menu': { category: 'finance-accounts', route: null, displayName: 'Accounting', isMenuGroup: true, menuGroupLevel: 1 },
  'finance.categories': { category: 'finance-accounts', route: null, displayName: 'Categories', parent: 'finance.accounting-menu' },
  'finance.budgets': { category: 'finance-accounts', route: null, displayName: 'Budgets', parent: 'finance.accounting-menu' },
  'finance.budget-expenses': { category: 'finance-accounts', route: null, displayName: 'Budget Expenses', parent: 'finance.accounting-menu' },
  'finance.budget-revenues': { category: 'finance-accounts', route: null, displayName: 'Budget Revenues', parent: 'finance.accounting-menu' },
  // L1: Payroll (no route - parent menu)
  'finance.payroll-menu': { category: 'finance-accounts', route: null, displayName: 'Payroll', isMenuGroup: true, menuGroupLevel: 1 },
  'finance.employee-salary': { category: 'finance-accounts', route: null, displayName: 'Employee Salary', parent: 'finance.payroll-menu' },
  'finance.payslip': { category: 'finance-accounts', route: null, displayName: 'Payslip', parent: 'finance.payroll-menu' },
  'finance.payroll-items': { category: 'finance-accounts', route: null, displayName: 'Payroll Items', parent: 'finance.payroll-menu' },

  // X. Administration
  // L1: Assets (no route - parent menu)
  'admin.assets-menu': { category: 'administration', route: null, displayName: 'Assets', isMenuGroup: true, menuGroupLevel: 1 },
  'admin.assets': { category: 'administration', route: null, displayName: 'Assets', parent: 'admin.assets-menu' },
  'admin.asset-categories': { category: 'administration', route: null, displayName: 'Asset Categories', parent: 'admin.assets-menu' },
  // L1: Help & Support (no route - parent menu)
  'admin.help-support-menu': { category: 'administration', route: null, displayName: 'Help & Support', isMenuGroup: true, menuGroupLevel: 1 },
  'admin.knowledge-base': { category: 'administration', route: null, displayName: 'Knowledge Base', parent: 'admin.help-support-menu' },
  'admin.activities': { category: 'administration', route: null, displayName: 'Activities', parent: 'admin.help-support-menu' },
  // L1: User Management (no route - parent menu)
  'admin.user-management-menu': { category: 'administration', route: null, displayName: 'User Management', isMenuGroup: true, menuGroupLevel: 1 },
  'admin.users': { category: 'administration', route: null, displayName: 'Users', parent: 'admin.user-management-menu' },
  'admin.roles-permissions': { category: 'administration', route: null, displayName: 'Roles & Permissions', parent: 'admin.user-management-menu' },
  // L1: Reports (no route - parent menu)
  'admin.reports-menu': { category: 'administration', route: null, displayName: 'Reports', isMenuGroup: true, menuGroupLevel: 1 },
  'admin.expense-report': { category: 'administration', route: null, displayName: 'Expense Report', parent: 'admin.reports-menu' },
  'admin.invoice-report': { category: 'administration', route: null, displayName: 'Invoice Report', parent: 'admin.reports-menu' },
  'admin.payment-report': { category: 'administration', route: null, displayName: 'Payment Report', parent: 'admin.reports-menu' },
  'admin.project-report': { category: 'administration', route: null, displayName: 'Project Report', parent: 'admin.reports-menu' },
  'admin.task-report': { category: 'administration', route: null, displayName: 'Task Report', parent: 'admin.reports-menu' },
  'admin.user-report': { category: 'administration', route: null, displayName: 'User Report', parent: 'admin.reports-menu' },
  'admin.employee-report': { category: 'administration', route: null, displayName: 'Employee Report', parent: 'admin.reports-menu' },
  'admin.payslip-report': { category: 'administration', route: null, displayName: 'Payslip Report', parent: 'admin.reports-menu' },
  'admin.attendance-report': { category: 'administration', route: null, displayName: 'Attendance Report', parent: 'admin.reports-menu' },
  'admin.leave-report': { category: 'administration', route: null, displayName: 'Leave Report', parent: 'admin.reports-menu' },
  'admin.daily-report': { category: 'administration', route: null, displayName: 'Daily Report', parent: 'admin.reports-menu' },
  // L1: Settings (no route - parent menu)
  'admin.settings-menu': { category: 'administration', route: null, displayName: 'Settings', isMenuGroup: true, menuGroupLevel: 1 },
  'admin.general-settings': { category: 'administration', route: null, displayName: 'General Settings', parent: 'admin.settings-menu' },
  'admin.website-settings': { category: 'administration', route: null, displayName: 'Website Settings', parent: 'admin.settings-menu' },
  'admin.app-settings': { category: 'administration', route: null, displayName: 'App Settings', parent: 'admin.settings-menu' },
  'admin.system-settings': { category: 'administration', route: null, displayName: 'System Settings', parent: 'admin.settings-menu' },
  'admin.financial-settings': { category: 'administration', route: null, displayName: 'Financial Settings', parent: 'admin.settings-menu' },
  'admin.other-settings': { category: 'administration', route: null, displayName: 'Other Settings', parent: 'admin.settings-menu' },

  // XI. Pages
  'pages.starter': { category: 'pages', route: 'starter', displayName: 'Starter' },
  'pages.profile': { category: 'pages', route: 'pages/profile', displayName: 'Profile' },
  'pages.gallery': { category: 'pages', route: 'gallery', displayName: 'Gallery' },
  'pages.search-results': { category: 'pages', route: 'search-result', displayName: 'Search Results' },
  'pages.timeline': { category: 'pages', route: 'timeline', displayName: 'Timeline' },
  'pages.pricing': { category: 'pages', route: 'pricing', displayName: 'Pricing' },
  'pages.coming-soon': { category: 'pages', route: 'coming-soon', displayName: 'Coming Soon' },
  'pages.under-maintenance': { category: 'pages', route: 'under-maintenance', displayName: 'Under Maintenance' },
  'pages.under-construction': { category: 'pages', route: 'under-construction', displayName: 'Under Construction' },
  'pages.api-keys': { category: 'pages', route: 'apikey', displayName: 'API Keys' },
  'pages.privacy-policy': { category: 'pages', route: 'privacy-policy', displayName: 'Privacy Policy' },
  'pages.terms-conditions': { category: 'pages', route: 'termscondition', displayName: 'Terms & Conditions' },

  // XII. Extras
  'extras.documentation': { category: 'extras', route: null, displayName: 'Documentation' },
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

async function validatePages() {
  await mongoose.connect(uri, { dbName });

  console.log('🔍 Validating Pages Database against page.md...\n');

  // Get all pages from database
  const dbPages = await Page.find({}).lean();
  const dbPageNames = new Set(dbPages.map(p => p.name));
  const expectedPageNames = new Set(Object.keys(EXPECTED_PAGES));

  // Find extra pages (in DB but not in spec)
  const extraPages = [...dbPageNames].filter(name => !expectedPageNames.has(name));

  // Find missing pages (in spec but not in DB)
  const missingPages = [...expectedPageNames].filter(name => !dbPageNames.has(name));

  // Find pages with incorrect structure
  const incorrectStructure = [];
  for (const [pageName, pageData] of Object.entries(EXPECTED_PAGES)) {
    const dbPage = dbPages.find(p => p.name === pageName);
    if (!dbPage) continue;

    const issues = [];

    // Check isMenuGroup
    if (pageData.isMenuGroup !== undefined && dbPage.isMenuGroup !== pageData.isMenuGroup) {
      issues.push(`isMenuGroup is ${dbPage.isMenuGroup}, expected ${pageData.isMenuGroup}`);
    }

    // Check menuGroupLevel
    if (pageData.menuGroupLevel !== undefined && dbPage.menuGroupLevel !== pageData.menuGroupLevel) {
      issues.push(`menuGroupLevel is ${dbPage.menuGroupLevel}, expected ${pageData.menuGroupLevel}`);
    }

    if (issues.length > 0) {
      incorrectStructure.push({ pageName, displayName: pageData.displayName, issues });
    }
  }

  // ============================================================================
  // GENERATE REPORT
  // ============================================================================

  console.log('='.repeat(80));
  console.log('PAGES VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log('');

  console.log(`📊 SUMMARY:`);
  console.log(`   Expected Pages (from page.md): ${expectedPageNames.size}`);
  console.log(`   Database Pages: ${dbPages.length}`);
  console.log(`   Extra Pages: ${extraPages.length}`);
  console.log(`   Missing Pages: ${missingPages.length}`);
  console.log(`   Incorrect Structure: ${incorrectStructure.length}`);
  console.log('');

  if (extraPages.length > 0) {
    console.log(`⚠️  EXTRA PAGES (${extraPages.length}):`);
    console.log('   The following pages exist in the database but are NOT in page.md:');
    console.log('');
    for (const pageName of extraPages) {
      const page = dbPages.find(p => p.name === pageName);
      console.log(`   - ${pageName}`);
      console.log(`     DisplayName: "${page?.displayName}"`);
      console.log(`     Route: "${page?.route || 'none'}"`);
      console.log(`     Category: ${page?.category || 'unknown'}`);
      console.log(`     IsMenuGroup: ${page?.isMenuGroup}`);
      console.log('');
    }
  }

  if (missingPages.length > 0) {
    console.log(`❌ MISSING PAGES (${missingPages.length}):`);
    console.log('   The following pages are in page.md but NOT in the database:');
    console.log('');
    for (const pageName of missingPages) {
      const pageData = EXPECTED_PAGES[pageName];
      console.log(`   - ${pageName}`);
      console.log(`     DisplayName: "${pageData.displayName}"`);
      console.log(`     Route: "${pageData.route || 'none'}"`);
      console.log(`     Category: ${pageData.category}`);
      console.log(`     IsMenuGroup: ${pageData.isMenuGroup || false}`);
      console.log('');
    }
  }

  if (incorrectStructure.length > 0) {
    console.log(`🔧 INCORRECT STRUCTURE (${incorrectStructure.length}):`);
    console.log('   The following pages have incorrect structure:');
    console.log('');
    for (const { pageName, displayName, issues } of incorrectStructure) {
      console.log(`   - ${pageName} (${displayName})`);
      for (const issue of issues) {
        console.log(`     ⚠️  ${issue}`);
      }
      console.log('');
    }
  }

  if (extraPages.length === 0 && missingPages.length === 0 && incorrectStructure.length === 0) {
    console.log('✅ SUCCESS: All pages match the page.md specification!');
  } else {
    console.log('⚠️  ISSUES FOUND: Please review the report above.');
  }

  console.log('');
  console.log('='.repeat(80));

  await mongoose.disconnect();
}

// Run the validation
validatePages().catch(console.error);
