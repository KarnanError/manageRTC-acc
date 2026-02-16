/**
 * Cleanup Extra Pages from Database
 *
 * This script removes pages from the database that are NOT in the
 * .ferb/docs/docs_output/RBAC_ALL/pages/page.md specification.
 *
 * WARNING: This will DELETE pages. Make sure to backup before running!
 *
 * Run: node backend/seed/cleanupExtraPages.js
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

// ============================================================================
// EXPECTED PAGES FROM page.md (Same as validation script)
// ============================================================================

const EXPECTED_PAGES = [
  // I. Main Menu
  'super-admin.dashboard',
  'super-admin.companies',
  'super-admin.subscriptions',
  'super-admin.packages',
  'super-admin.modules',
  'super-admin.pages',

  // II. Users & Permissions
  'users',
  'roles-permissions',
  'permission',

  // III. Dashboards
  'admin.dashboard',
  'hr.dashboard',
  'employee.dashboard',
  'deals.dashboard',
  'leads.dashboard',

  // IV. HRM
  'hrm.employees-menu',
  'hrm.employees-list',
  'hrm.departments',
  'hrm.designations',
  'hrm.policies',
  'hrm.tickets',
  'hrm.holidays',
  'hrm.attendance-leave-menu',
  'hrm.leaves-menu',
  'hrm.leaves-admin',
  'hrm.leaves-employee',
  'hrm.leave-settings',
  'hrm.attendance-menu',
  'hrm.attendance-admin',
  'hrm.attendance-employee',
  'hrm.timesheet',
  'hrm.shift-schedule-menu',
  'hrm.schedule-timing',
  'hrm.shifts-management',
  'hrm.batches-management',
  'hrm.overtime',
  'hrm.performance-menu',
  'hrm.performance-indicator',
  'hrm.performance-review',
  'hrm.performance-appraisal',
  'hrm.goal-tracking',
  'hrm.goal-type',
  'hrm.training-menu',
  'hrm.training-list',
  'hrm.trainers',
  'hrm.training-type',
  'hrm.employee-lifecycle-menu',
  'hrm.promotions',
  'hrm.resignation',
  'hrm.termination',

  // V. Recruitment
  'recruitment.jobs',
  'recruitment.candidates',
  'recruitment.referrals',

  // VI. Projects
  'projects.clients',
  'projects.projects-menu',
  'projects.projects-grid',
  'projects.tasks',
  'projects.task-board',

  // VII. CRM
  'crm.contacts',
  'crm.companies',
  'crm.deals',
  'crm.leads',
  'crm.pipeline',
  'crm.analytics',
  'crm.activities',

  // VIII. Applications
  'apps.chat',
  'apps.call-menu',
  'apps.voice-call',
  'apps.video-call',
  'apps.outgoing-call',
  'apps.incoming-call',
  'apps.call-history',
  'apps.calendar',
  'apps.email',
  'apps.todo',
  'apps.notes',
  'apps.social-feed',
  'apps.file-manager',
  'apps.kanban',
  'apps.invoices',

  // IX. Finance & Accounts
  'finance.sales-menu',
  'finance.estimates',
  'finance.invoices',
  'finance.payments',
  'finance.expenses',
  'finance.provident-fund',
  'finance.taxes',
  'finance.accounting-menu',
  'finance.categories',
  'finance.budgets',
  'finance.budget-expenses',
  'finance.budget-revenues',
  'finance.payroll-menu',
  'finance.employee-salary',
  'finance.payslip',
  'finance.payroll-items',

  // X. Administration
  'admin.assets-menu',
  'admin.assets',
  'admin.asset-categories',
  'admin.help-support-menu',
  'admin.knowledge-base',
  'admin.activities',
  'admin.user-management-menu',
  'admin.users',
  'admin.roles-permissions',
  'admin.reports-menu',
  'admin.expense-report',
  'admin.invoice-report',
  'admin.payment-report',
  'admin.project-report',
  'admin.task-report',
  'admin.user-report',
  'admin.employee-report',
  'admin.payslip-report',
  'admin.attendance-report',
  'admin.leave-report',
  'admin.daily-report',
  'admin.settings-menu',
  'admin.general-settings',
  'admin.website-settings',
  'admin.app-settings',
  'admin.system-settings',
  'admin.financial-settings',
  'admin.other-settings',

  // XI. Pages
  'pages.starter',
  'pages.profile',
  'pages.gallery',
  'pages.search-results',
  'pages.timeline',
  'pages.pricing',
  'pages.coming-soon',
  'pages.under-maintenance',
  'pages.under-construction',
  'pages.api-keys',
  'pages.privacy-policy',
  'pages.terms-conditions',

  // XII. Extras
  'extras.documentation',
];

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

async function cleanupExtraPages() {
  await mongoose.connect(uri, { dbName });

  console.log('🧹 Cleaning up extra pages from database...\n');
  console.log('⚠️  WARNING: This will DELETE pages not in page.md specification!\n');

  // Get all pages from database
  const allDbPages = await Page.find({}).lean();
  const expectedPageSet = new Set(EXPECTED_PAGES);

  // Find pages to delete (not in expected list)
  const pagesToDelete = allDbPages.filter(page => !expectedPageSet.has(page.name));

  console.log(`📊 SUMMARY:`);
  console.log(`   Total pages in database: ${allDbPages.length}`);
  console.log(`   Expected pages (from page.md): ${EXPECTED_PAGES.length}`);
  console.log(`   Pages to delete: ${pagesToDelete.length}`);
  console.log('');

  if (pagesToDelete.length === 0) {
    console.log('✅ No extra pages found. Database is clean!');
    await mongoose.disconnect();
    return;
  }

  // Show first 20 pages that will be deleted
  console.log(`📋 Sample of pages to be deleted (first 20 of ${pagesToDelete.length}):`);
  console.log('');
  for (let i = 0; i < Math.min(20, pagesToDelete.length); i++) {
    const page = pagesToDelete[i];
    console.log(`   - ${page.name}`);
    console.log(`     DisplayName: "${page.displayName}"`);
    console.log(`     Route: "${page.route || 'none'}"`);
    console.log(`     IsSystem: ${page.isSystem}`);
    console.log('');
  }

  if (pagesToDelete.length > 20) {
    console.log(`   ... and ${pagesToDelete.length - 20} more pages.`);
    console.log('');
  }

  // Ask for confirmation
  console.log('⚠️  This action cannot be undone!');
  console.log('💡 Make sure you have a backup before proceeding.');
  console.log('');
  console.log('To proceed with deletion, run with --confirm flag:');
  console.log('   node backend/seed/cleanupExtraPages.js --confirm');
  console.log('');

  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');

  if (!confirm) {
    console.log('❌ Aborted. Run with --confirm to proceed.');
    await mongoose.disconnect();
    return;
  }

  // Delete the pages
  console.log('🗑️  Deleting extra pages...\n');

  const pageIdsToDelete = pagesToDelete.map(p => p._id);
  const deleteResult = await Page.deleteMany({ _id: { $in: pageIdsToDelete } });

  console.log(`✅ Deleted ${deleteResult.deletedCount} pages from database.`);
  console.log('');
  console.log('✨ Cleanup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run the seed script to ensure all expected pages exist:');
  console.log('   node backend/seed/completePagesHierarchical.seed.js');
  console.log('2. Verify the pages are correct:');
  console.log('   node backend/seed/validatePagesAgainstSpec.js');

  await mongoose.disconnect();
}

// Run the cleanup
cleanupExtraPages().catch(console.error);
