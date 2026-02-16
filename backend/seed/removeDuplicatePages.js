/**
 * Find and Remove Duplicate Pages
 * Analyzes pages with both flat and prefixed naming conventions
 * Removes duplicates (keeps prefixed versions)
 * Generates cleanup report
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import Permission from '../models/rbac/permission.schema.js';
import RolePermission from '../models/rbac/rolePermission.schema.js';

// Prefix patterns used in database
const PREFIX_PATTERNS = [
  'hrm.',
  'crm.',
  'projects.',
  'recruitment.',
  'apps.',
  'admin.',
  'finance.',
  'pages.',
  'extras.',
];

// Flat names that should match prefixed versions
const FLAT_TO_PREFIXED = {
  // HRM
  'departments': 'hrm.departments',
  'designations': 'hrm.designations',
  'policies': 'hrm.policies',
  'leaves': 'hrm.leaves-admin',
  'attendance': 'hrm.attendance-admin',
  'attendance-admin': 'hrm.attendance-admin',
  'leaves-employee': 'hrm.leaves-employee',
  'leave-settings': 'hrm.leave-settings',
  'attendance-employee': 'hrm.attendance-employee',
  'timesheets': 'hrm.timesheet',
  'schedule-timing': 'hrm.schedule-timing',
  'shifts-management': 'hrm.shifts-management',
  'batches-management': 'hrm.batches-management',
  'overtime': 'hrm.overtime',
  'performance/performance-indicator': 'hrm.performance-indicator',
  'performance/performance-review': 'hrm.performance-review',
  'performance/performance-appraisal': 'hrm.performance-appraisal',
  'performance/goal-tracking': 'hrm.goal-tracking',
  'performance/goal-type': 'hrm.goal-type',
  'training/training-list': 'hrm.training-list',
  'training/trainers': 'hrm.trainers',
  'training/training-type': 'hrm.training-type',
  'promotion': 'hrm.promotions',
  'resignation': 'hrm.resignation',
  'termination': 'hrm.termination',
  'tickets/ticket-list': 'hrm.tickets',
  'hrm/holidays': 'hrm.holidays',

  // Projects
  'clients-grid': 'crm.clients',  // Note: Different module
  'projects-grid': 'projects.projects-grid',
  'tasks': 'projects.tasks',
  'task-board': 'projects.task-board',

  // CRM
  'contact-grid': 'crm.contacts',
  'companies-grid': 'crm.companies',
  'deals-grid': 'crm.deals',
  'leads-grid': 'crm.leads',
  'pipeline': 'crm.pipeline',
  'analytics': 'crm.analytics',
  'activities': 'crm.activities',

  // Recruitment
  'job-grid': 'recruitment.jobs',
  'candidates-grid': 'recruitment.candidates',
  'referrals': 'recruitment.referrals',

  // Applications
  'application/chat': 'apps.chat',
  'application/voice-call': 'apps.voice-call',
  'application/video-call': 'apps.video-call',
  'application/outgoing-call': 'apps.outgoing-call',
  'application/incoming-call': 'apps.incoming-call',
  'application/call-history': 'apps.call-history',
  'application/email': 'apps.email',
  'application/todo': 'apps.todo',
  'application/social-feed': 'apps.social-feed',
  'application/file-manager': 'apps.file-manager',
  'application/kanban-view': 'apps.kanban',
  'application/invoices': 'apps.invoices',

  // Finance
  'estimates': 'finance.estimates',
  'invoices': 'finance.invoices',
  'payments': 'finance.payments',
  'expenses': 'finance.expenses',
  'provident-fund': 'finance.provident-fund',
  'taxes': 'finance.taxes',
  'accounting/categories': 'finance.categories',
  'accounting/budgets': 'finance.budgets',
  'accounting/budgets-expenses': 'finance.budget-expenses',
  'accounting/budget-revenues': 'finance.budget-revenues',
  'employee-salary': 'finance.employee-salary',
  'payslip': 'finance.payslip',
  'payroll': 'finance.payroll-items',

  // Administration
  'assets': 'admin.assets',
  'asset-categories': 'admin.asset-categories',
  'knowledgebase': 'admin.knowledge-base',
  'users': 'admin.users',
  'roles-permissions': 'admin.roles-permissions',
  'expenses-report': 'admin.expense-report',
  'invoice-report': 'admin.invoice-report',
  'payment-report': 'admin.payment-report',
  'project-report': 'admin.project-report',
  'task-report': 'admin.task-report',
  'user-report': 'admin.user-report',
  'employee-report': 'admin.employee-report',
  'payslip-report': 'admin.payslip-report',
  'attendance-report': 'admin.attendance-report',
  'leave-report': 'admin.leave-report',
  'daily-report': 'admin.daily-report',
  'general-settings/connected-apps': 'admin.general-settings',
  'website-settings/business-settings': 'admin.website-settings',
  'app-settings/custom-fields': 'admin.app-settings',
  'system-settings/email-settings': 'admin.system-settings',
  'financial-settings/currencies': 'admin.financial-settings',
  'other-settings/ban-ip-address': 'admin.other-settings',

  // Pages
  'starter': 'pages.starter',
  'pages/profile': 'pages.profile',
  'gallery': 'pages.gallery',
  'search-result': 'pages.search-results',
  'timeline': 'pages.timeline',
  'pricing': 'pages.pricing',
  'coming-soon': 'pages.coming-soon',
  'under-maintenance': 'pages.under-maintenance',
  'under-construction': 'pages.under-construction',
  'api-keys': 'pages.api-keys',
  'apikey': 'pages.api-keys',
  'privacy-policy': 'pages.privacy-policy',
  'termscondition': 'pages.terms-conditions',

  // Dashboards
  'admin-dashboard': 'admin.dashboard',
  'hr-dashboard': 'hr.dashboard',
  'employee-dashboard': 'employee.dashboard',
  'deals-dashboard': 'deals.dashboard',
  'leads-dashboard': 'leads.dashboard',
};

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== DUPLICATE PAGE CLEANUP ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get all pages
  const allPages = await Page.find({}).lean();
  const pageNames = new Set(allPages.map(p => p.name));

  console.log(`Total pages in database: ${allPages.length}`);

  // Find duplicates
  const duplicates = [];
  const toRemove = [];
  const toKeep = [];

  for (const [flatName, prefixedName] of Object.entries(FLAT_TO_PREFIXED)) {
    const flatExists = pageNames.has(flatName);
    const prefixedExists = pageNames.has(prefixedName);

    if (flatExists && prefixedExists) {
      duplicates.push({
        flat: allPages.find(p => p.name === flatName),
        prefixed: allPages.find(p => p.name === prefixedName)
      });
      toRemove.push(flatName);
      toKeep.push(prefixedName);
    }
  }

  console.log(`\nFound ${duplicates.length} duplicate page pairs\n`);

  // Generate report before cleanup
  let report = `# Duplicate Pages Cleanup Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Database:** ${dbName}\n\n`;

  report += `## 📊 Summary\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| **Total Pages Before** | ${allPages.length} |\n`;
  report += `| **Duplicate Pairs Found** | ${duplicates.length} |\n`;
  report += `| **Pages to Remove** | ${toRemove.length} |\n`;
  report += `| **Pages to Keep** | ${toKeep.length} |\n`;
  report += `| **Total Pages After** | ${allPages.length - toRemove.length} |\n\n`;

  if (duplicates.length > 0) {
    report += `## 🔄 Duplicate Page Pairs\n\n`;
    report += `These pages exist with BOTH flat and prefixed names. `;
    report += `The flat versions will be REMOVED and the prefixed versions will be KEPT.\n\n`;

    duplicates.forEach((dup, index) => {
      report += `### ${index + 1}. ${dup.flat?.displayName || dup.flat?.name}\n\n`;

      report += `**❌ TO REMOVE (Flat Name):**\n`;
      report += `- **Name:** \`${dup.flat?.name}\`\n`;
      report += `- **Display:** ${dup.flat?.displayName}\n`;
      report += `- **Route:** \`${dup.flat?.route || 'none'}\`\n`;
      report += `- **Category:** ${dup.flat?.moduleCategory || 'none'}\n`;
      report += `- **Menu Group:** ${dup.flat?.isMenuGroup ? 'Yes' : 'No'}\n\n`;

      report += `**✅ TO KEEP (Prefixed Name):**\n`;
      report += `- **Name:** \`${dup.prefixed?.name}\`\n`;
      report += `- **Display:** ${dup.prefixed?.displayName}\n`;
      report += `- **Route:** \`${dup.prefixed?.route || 'none'}\`\n`;
      report += `- **Category:** ${dup.prefixed?.moduleCategory || 'none'}\n`;
      report += `- **Menu Group:** ${dup.prefixed?.isMenuGroup ? 'Yes' : 'No'}\n\n`;

      report += `**Reason for Removal:**\n`;
      report += `Flat naming convention is inconsistent. Prefixed naming (${dup.prefixed?.name?.split('.')[0]}.*) `;
      report += `provides better organization and follows the established pattern.\n\n`;
    });
  }

  // Perform cleanup
  console.log('=== CLEANING UP DUPLICATE PAGES ===\n');

  let pagesRemoved = 0;
  let permissionsRemoved = 0;
  let rolePermissionsRemoved = 0;

  for (const flatName of toRemove) {
    try {
      const pageToRemove = allPages.find(p => p.name === flatName);
      if (!pageToRemove) continue;

      // Check if referenced in permissions
      const perms = await Permission.find({ pageId: pageToRemove._id });
      const permIds = perms.map(p => p._id);

      // Check if referenced in role_permissions
      const rolePerms = await RolePermission.find({ pageId: pageToRemove._id });

      // Remove role_permissions first
      if (rolePerms.length > 0) {
        const rpResult = await RolePermission.deleteMany({ pageId: pageToRemove._id });
        rolePermissionsRemoved += rpResult.deletedCount;
        console.log(`✗ Removed ${rpResult.deletedCount} role_permissions for: ${flatName}`);
      }

      // Remove permissions
      if (perms.length > 0) {
        const pResult = await Permission.deleteMany({ pageId: pageToRemove._id });
        permissionsRemoved += pResult.deletedCount;
        console.log(`✗ Removed ${pResult.deletedCount} permissions for: ${flatName}`);
      }

      // Remove page
      await Page.deleteOne({ _id: pageToRemove._id });
      pagesRemoved++;
      console.log(`✗ Removed page: ${flatName}`);

    } catch (error) {
      console.error(`✗ Error removing ${flatName}:`, error.message);
    }
  }

  // Final counts
  const finalPageCount = await Page.countDocuments();
  const finalPermCount = await Permission.countDocuments();
  const finalRolePermCount = await RolePermission.countDocuments();

  console.log(`\n=== CLEANUP RESULTS ===`);
  console.log(`Pages removed: ${pagesRemoved}`);
  console.log(`Permissions removed: ${permissionsRemoved}`);
  console.log(`Role permissions removed: ${rolePermissionsRemoved}`);
  console.log(`\nFinal page count: ${finalPageCount}`);
  console.log(`Final permission count: ${finalPermCount}`);
  console.log(`Final role permissions count: ${finalRolePermCount}`);

  // Update report with cleanup results
  report += `## 🧹 Cleanup Results\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| **Pages Removed** | ${pagesRemoved} |\n`;
  report += `| **Permissions Removed** | ${permissionsRemoved} |\n`;
  report += `| **Role Permissions Removed** | ${rolePermissionsRemoved} |\n\n`;

  report += `### Final State:\n`;
  report += `- **Total Pages:** ${finalPageCount}\n`;
  report += `- **Total Permissions:** ${finalPermCount}\n`;
  report += `- **Total Role Permissions:** ${finalRolePermCount}\n\n`;

  // List of removed pages
  if (toRemove.length > 0) {
    report += `## 🗑️ Pages Removed\n\n`;
    toRemove.forEach(name => {
      const page = allPages.find(p => p.name === name);
      report += `- \`${name}\` (${page?.displayName})\n`;
    });
  }

  // List of pages kept
  if (toKeep.length > 0) {
    report += `\n## ✅ Pages Kept (Prefixed Versions)\n\n`;
    toKeep.forEach(name => {
      const page = allPages.find(p => p.name === name);
      report += `- \`${name}\` (${page?.displayName})\n`;
    });
  }

  // Write report to file
  const fs = await import('fs');
  const path = await import('path');
  const reportPath = path.join(process.cwd(), 'seed', 'DUPLICATE_PAGES_CLEANUP_REPORT.md');

  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`\n✓ Report generated: ${reportPath}`);

  await mongoose.disconnect();
  console.log('\n✓ Cleanup complete!');
}

main().catch(console.error);
