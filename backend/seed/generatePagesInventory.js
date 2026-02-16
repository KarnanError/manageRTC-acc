/**
 * Compare Pages Collection vs Documentation (page.md)
 * Generate report of current vs missing pages
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';

// Page documentation structure (from page.md)
const documentedPages = [
  // I. MAIN MENU
  { name: 'super-admin.dashboard', displayName: 'Dashboard', route: '/super-admin/dashboard', category: 'super-admin' },
  { name: 'super-admin.companies', displayName: 'Companies', route: '/super-admin/companies', category: 'super-admin' },
  { name: 'super-admin.subscriptions', displayName: 'Subscriptions', route: '/super-admin/subscription', category: 'super-admin' },
  { name: 'super-admin.packages', displayName: 'Packages', route: '/super-admin/package', category: 'super-admin' },
  { name: 'super-admin.modules', displayName: 'Modules', route: '/super-admin/modules', category: 'super-admin' },
  { name: 'super-admin.pages', displayName: 'Pages', route: '/super-admin/pages', category: 'super-admin' },

  // II. USERS & PERMISSIONS
  { name: 'users', displayName: 'Users', route: '/users', category: 'users-permissions' },
  { name: 'roles-permissions', displayName: 'Roles & Permissions', route: '/roles-permissions', category: 'users-permissions' },
  { name: 'permission', displayName: 'Permission', route: '/permission', category: 'users-permissions' },

  // III. DASHBOARDS
  { name: 'admin-dashboard', displayName: 'Admin Dashboard', route: '/admin-dashboard', category: 'dashboards' },
  { name: 'hr.dashboard', displayName: 'HR Dashboard', route: '/hr-dashboard', category: 'dashboards' },
  { name: 'employee-dashboard', displayName: 'Employee Dashboard', route: '/employee-dashboard', category: 'dashboards' },
  { name: 'deals-dashboard', displayName: 'Deals Dashboard', route: '/deals-dashboard', category: 'dashboards' },
  { name: 'leads-dashboard', displayName: 'Leads Dashboard', route: '/leads-dashboard', category: 'dashboards' },

  // IV. HRM - EMPLOYEES
  { name: 'hrm.employees-menu', displayName: 'Employees', route: null, category: 'hrm', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'hrm.employees-list', displayName: 'Employees List', route: '/employees', category: 'hrm' },
  { name: 'departments', displayName: 'Department', route: '/departments', category: 'hrm' },
  { name: 'designations', displayName: 'Designation', route: '/designations', category: 'hrm' },
  { name: 'policy', displayName: 'Policies', route: '/policy', category: 'hrm' },

  // IV. HRM - TICKETS
  { name: 'tickets.ticket-list', displayName: 'Tickets', route: '/tickets/ticket-list', category: 'hrm' },

  // IV. HRM - HOLIDAYS
  { name: 'hrm.holidays', displayName: 'Holidays', route: '/hrm/holidays', category: 'hrm' },

  // IV. HRM - ATTENDANCE & LEAVE
  { name: 'hrm.attendance-leave-menu', displayName: 'Attendance & Leave', route: null, category: 'hrm', isMenuGroup: true, menuGroupLevel: 2 },
  { name: 'leaves', displayName: 'Leaves (Admin)', route: '/leaves', category: 'hrm' },
  { name: 'leaves.employee', displayName: 'Leaves (Employee)', route: '/leaves-employee', category: 'hrm' },
  { name: 'leave-settings', displayName: 'Leave Settings', route: '/leave-settings', category: 'hrm' },

  // IV. HRM - ATTENDANCE
  { name: 'hrm.attendance-menu', displayName: 'Attendance', route: null, category: 'hrm', isMenuGroup: true, menuGroupLevel: 2 },
  { name: 'attendance', displayName: 'Attendance (Admin)', route: '/attendance', category: 'hrm' },
  { name: 'attendance.employee', displayName: 'Attendance (Employee)', route: '/attendance-employee', category: 'hrm' },
  { name: 'timesheets', displayName: 'Timesheet', route: '/timesheets', category: 'hrm' },

  // IV. HRM - SHIFT & SCHEDULE
  { name: 'hrm.shift-schedule-menu', displayName: 'Shift & Schedule', route: null, category: 'hrm', isMenuGroup: true, menuGroupLevel: 2 },
  { name: 'schedule-timing', displayName: 'Schedule Timing', route: '/schedule-timing', category: 'hrm' },
  { name: 'shifts-management', displayName: 'Shift Management', route: '/shifts-management', category: 'hrm' },
  { name: 'batches-management', displayName: 'Shift Batches', route: '/batches-management', category: 'hrm' },
  { name: 'overtime', displayName: 'Overtime', route: '/overtime', category: 'hrm' },

  // IV. HRM - PERFORMANCE
  { name: 'hrm.performance-menu', displayName: 'Performance', route: null, category: 'hrm', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'performance.performance-indicator', displayName: 'Performance Indicator', route: '/performance/performance-indicator', category: 'hrm' },
  { name: 'performance.performance-review', displayName: 'Performance Review', route: '/performance/performance-review', category: 'hrm' },
  { name: 'performance.performance-appraisal', displayName: 'Performance Appraisal', route: '/performance/performance-appraisal', category: 'hrm' },
  { name: 'performance.goal-tracking', displayName: 'Goal Tracking', route: '/performance/goal-tracking', category: 'hrm' },
  { name: 'performance.goal-type', displayName: 'Goal Type', route: '/performance/goal-type', category: 'hrm' },

  // IV. HRM - TRAINING
  { name: 'hrm.training-menu', displayName: 'Training', route: null, category: 'hrm', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'training.training-list', displayName: 'Training List', route: '/training/training-list', category: 'hrm' },
  { name: 'training.trainers', displayName: 'Trainers', route: '/training/trainers', category: 'hrm' },
  { name: 'training.training-type', displayName: 'Training Type', route: '/training/training-type', category: 'hrm' },

  // IV. HRM - EMPLOYEE LIFECYCLE
  { name: 'hrm.employee-lifecycle-menu', displayName: 'Employee Lifecycle', route: null, category: 'hrm', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'promotion', displayName: 'Promotion', route: '/promotion', category: 'hrm' },
  { name: 'resignation', displayName: 'Resignation', route: '/resignation', category: 'hrm' },
  { name: 'termination', displayName: 'Termination', route: '/termination', category: 'hrm' },

  // V. RECRUITMENT
  { name: 'job-grid', displayName: 'Jobs', route: '/job-grid', category: 'recruitment' },
  { name: 'candidates-grid', displayName: 'Candidates', route: '/candidates-grid', category: 'recruitment' },
  { name: 'referrals', displayName: 'Referrals', route: '/referrals', category: 'recruitment' },

  // VI. PROJECTS
  { name: 'crm.clients-grid', displayName: 'Clients', route: '/clients-grid', category: 'projects' },

  // VI. PROJECTS MENU
  { name: 'projects.projects-menu', displayName: 'Projects', route: null, category: 'projects', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'projects-grid', displayName: 'Projects Grid', route: '/projects-grid', category: 'projects' },
  { name: 'tasks', displayName: 'Tasks', route: '/tasks', category: 'projects' },
  { name: 'task-board', displayName: 'Task Board', route: '/task-board', category: 'projects' },

  // VII. CRM
  { name: 'contact-grid', displayName: 'Contacts', route: '/contact-grid', category: 'crm' },
  { name: 'companies-grid', displayName: 'Companies', route: '/companies-grid', category: 'crm' },
  { name: 'deals-grid', displayName: 'Deals', route: '/deals-grid', category: 'crm' },
  { name: 'leads-grid', displayName: 'Leads', route: '/leads-grid', category: 'crm' },
  { name: 'pipeline', displayName: 'Pipeline', route: '/pipeline', category: 'crm' },
  { name: 'analytics', displayName: 'Analytics', route: '/analytics', category: 'crm' },
  { name: 'activities', displayName: 'Activities', route: '/activities', category: 'crm' },

  // VIII. APPLICATIONS
  { name: 'application.chat', displayName: 'Chat', route: '/application/chat', category: 'applications' },

  // VIII. APPLICATIONS - CALL
  { name: 'application.call-menu', displayName: 'Call', route: null, category: 'applications', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'application.voice-call', displayName: 'Voice Call', route: '/application/voice-call', category: 'applications' },
  { name: 'application.video-call', displayName: 'Video Call', route: '/application/video-call', category: 'applications' },
  { name: 'application.outgoing-call', displayName: 'Outgoing Call', route: '/application/outgoing-call', category: 'applications' },
  { name: 'application.incoming-call', displayName: 'Incoming Call', route: '/application/incoming-call', category: 'applications' },
  { name: 'application.call-history', displayName: 'Call History', route: '/application/call-history', category: 'applications' },

  // VIII. APPLICATIONS - MORE
  { name: 'calendar', displayName: 'Calendar', route: '/calendar', category: 'applications' },
  { name: 'application.email', displayName: 'Email', route: '/application/email', category: 'applications' },
  { name: 'application.todo', displayName: 'To Do', route: '/application/todo', category: 'applications' },
  { name: 'notes', displayName: 'Notes', route: '/notes', category: 'applications' },
  { name: 'application.social-feed', displayName: 'Social Feed', route: '/application/social-feed', category: 'applications' },
  { name: 'application.file-manager', displayName: 'File Manager', route: '/application/file-manager', category: 'applications' },
  { name: 'application.kanban-view', displayName: 'Kanban', route: '/application/kanban-view', category: 'applications' },
  { name: 'application.invoices', displayName: 'Invoices', route: '/application/invoices', category: 'applications' },

  // IX. FINANCE & ACCOUNTS - SALES
  { name: 'finance.sales-menu', displayName: 'Sales', route: null, category: 'finance-accounts', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'estimates', displayName: 'Estimates', route: '/estimates', category: 'finance-accounts' },
  { name: 'invoices', displayName: 'Invoices', route: '/invoices', category: 'finance-accounts' },
  { name: 'payments', displayName: 'Payments', route: '/payments', category: 'finance-accounts' },
  { name: 'expenses', displayName: 'Expenses', route: '/expenses', category: 'finance-accounts' },
  { name: 'provident-fund', displayName: 'Provident Fund', route: '/provident-fund', category: 'finance-accounts' },
  { name: 'taxes', displayName: 'Taxes', route: '/taxes', category: 'finance-accounts' },

  // IX. FINANCE & ACCOUNTS - ACCOUNTING
  { name: 'finance.accounting-menu', displayName: 'Accounting', route: null, category: 'finance-accounts', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'accounting.categories', displayName: 'Categories', route: '/accounting/categories', category: 'finance-accounts' },
  { name: 'accounting.budgets', displayName: 'Budgets', route: '/accounting/budgets', category: 'finance-accounts' },
  { name: 'accounting.budget-expenses', displayName: 'Budget Expenses', route: '/accounting/budget-expenses', category: 'finance-accounts' },
  { name: 'accounting.budget-revenues', displayName: 'Budget Revenues', route: '/accounting/budget-revenues', category: 'finance-accounts' },

  // IX. FINANCE & ACCOUNTS - PAYROLL
  { name: 'finance.payroll-menu', displayName: 'Payroll', route: null, category: 'finance-accounts', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'employee-salary', displayName: 'Employee Salary', route: '/employee-salary', category: 'finance-accounts' },
  { name: 'payslip', displayName: 'Payslip', route: '/payslip', category: 'finance-accounts' },
  { name: 'payroll', displayName: 'Payroll Items', route: '/payroll', category: 'finance-accounts' },

  // X. ADMINISTRATION - ASSETS
  { name: 'administration.assets-menu', displayName: 'Assets', route: null, category: 'administration', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'assets', displayName: 'Assets', route: '/assets', category: 'administration' },
  { name: 'asset-categories', displayName: 'Asset Categories', route: '/asset-categories', category: 'administration' },

  // X. ADMINISTRATION - HELP & SUPPORT
  { name: 'administration.help-support-menu', displayName: 'Help & Support', route: null, category: 'administration', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'knowledgebase', displayName: 'Knowledge Base', route: '/knowledgebase', category: 'administration' },
  { name: 'activities', displayName: 'Activities', route: '/activities', category: 'administration' },

  // X. ADMINISTRATION - USER MANAGEMENT
  { name: 'administration.user-management-menu', displayName: 'User Management', route: null, category: 'administration', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'users', displayName: 'Users', route: '/users', category: 'administration' },
  { name: 'roles-permissions', displayName: 'Roles & Permissions', route: '/roles-permissions', category: 'administration' },

  // X. ADMINISTRATION - REPORTS
  { name: 'administration.reports-menu', displayName: 'Reports', route: null, category: 'administration', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'expenses-report', displayName: 'Expense Report', route: '/expenses-report', category: 'administration' },
  { name: 'invoice-report', displayName: 'Invoice Report', route: '/invoice-report', category: 'administration' },
  { name: 'payment-report', displayName: 'Payment Report', route: '/payment-report', category: 'administration' },
  { name: 'project-report', displayName: 'Project Report', route: '/project-report', category: 'administration' },
  { name: 'task-report', displayName: 'Task Report', route: '/task-report', category: 'administration' },
  { name: 'user-report', displayName: 'User Report', route: '/user-report', category: 'administration' },
  { name: 'employee-report', displayName: 'Employee Report', route: '/employee-report', category: 'administration' },
  { name: 'payslip-report', displayName: 'Payslip Report', route: '/payslip-report', category: 'administration' },
  { name: 'attendance-report', displayName: 'Attendance Report', route: '/attendance-report', category: 'administration' },
  { name: 'daily-report', displayName: 'Daily Report', route: '/daily-report', category: 'administration' },

  // X. ADMINISTRATION - SETTINGS
  { name: 'administration.settings-menu', displayName: 'Settings', route: null, category: 'administration', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'general-settings.connected-apps', displayName: 'General Settings', route: '/general-settings/connected-apps', category: 'administration' },
  { name: 'website-settings.business-settings', displayName: 'Website Settings', route: '/website-settings/business-settings', category: 'administration' },
  { name: 'app-settings.custom-fields', displayName: 'App Settings', route: '/app-settings/custom-fields', category: 'administration' },
  { name: 'system-settings.email-settings', displayName: 'System Settings', route: '/system-settings/email-settings', category: 'administration' },
  { name: 'financial-settings.currencies', displayName: 'Financial Settings', route: '/financial-settings/currencies', category: 'administration' },
  { name: 'other-settings.lan-ip-address', displayName: 'Other Settings', route: '/other-settings/lan-ip-address', category: 'administration' },

  // XI. PAGES
  { name: 'pages.menu', displayName: 'Pages', route: null, category: 'pages', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'starter', displayName: 'Starter', route: '/starter', category: 'pages' },
  { name: 'pages.profile', displayName: 'Profile', route: '/pages/profile', category: 'pages' },
  { name: 'gallery', displayName: 'Gallery', route: '/gallery', category: 'pages' },
  { name: 'search-result', displayName: 'Search Results', route: '/search-result', category: 'pages' },
  { name: 'timeline', displayName: 'Timeline', route: '/timeline', category: 'pages' },
  { name: 'pricing', displayName: 'Pricing', route: '/pricing', category: 'pages' },
  { name: 'coming-soon', displayName: 'Coming Soon', route: '/coming-soon', category: 'pages' },
  { name: 'under-maintenance', displayName: 'Under Maintenance', route: '/under-maintenance', category: 'pages' },
  { name: 'under-construction', displayName: 'Under Construction', route: '/under-construction', category: 'pages' },
  { name: 'apikey', displayName: 'API Keys', route: '/apikey', category: 'pages' },
  { name: 'privacy-policy', displayName: 'Privacy Policy', route: '/privacy-policy', category: 'pages' },
  { name: 'termscondition', displayName: 'Terms & Conditions', route: '/termscondition', category: 'pages' },

  // XII. EXTRAS
  { name: 'extras.menu', displayName: 'Extras', route: null, category: 'extras', isMenuGroup: true, menuGroupLevel: 1 },
  { name: 'documentation', displayName: 'Documentation', route: '/documentation', category: 'extras' },
];

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== PAGES INVENTORY ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get all pages from database
  const dbPages = await Page.find({}).lean();
  const dbPageNames = new Set(dbPages.map(p => p.name));

  console.log(`=== CURRENT STATE ===`);
  console.log(`Total pages in database: ${dbPages.length}`);

  // Compare with documentation
  const implemented = [];
  const missing = [];
  const extra = [];

  for (const docPage of documentedPages) {
    if (dbPageNames.has(docPage.name)) {
      implemented.push(docPage);
    } else {
      missing.push(docPage);
    }
  }

  // Find extra pages (in DB but not in docs)
  for (const dbPage of dbPages) {
    const docPage = documentedPages.find(dp => dp.name === dbPage.name);
    if (!docPage) {
      extra.push(dbPage);
    }
  }

  // Generate report
  let report = `# Pages Inventory Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Database:** ${dbName}\n`;
  report += `**Source:** .ferb/docs/docs_output/RBAC_ALL/pages/page.md\n\n`;

  // Summary
  report += `## 📊 Summary\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| **Documented Pages** | ${documentedPages.length} |\n`;
  report += `| **Implemented Pages** | ${implemented.length} ✅ |\n`;
  report += `| **Missing Pages** | ${missing.length} ❌ |\n`;
  report += `| **Extra Pages** | ${extra.length} ⚠️ |\n`;
  report += `| **Total in Database** | ${dbPages.length} |\n\n`;

  // Implementation percentage
  const implPercent = ((implemented.length / documentedPages.length) * 100).toFixed(1);
  report += `**Implementation Status:** ${implPercent}% Complete\n\n`;

  // Missing Pages by Category
  if (missing.length > 0) {
    report += `## ❌ Missing Pages (${missing.length})\n\n`;

    const missingByCategory = {};
    missing.forEach(page => {
      const cat = page.category || 'uncategorized';
      if (!missingByCategory[cat]) missingByCategory[cat] = [];
      missingByCategory[cat].push(page);
    });

    for (const [category, pages] of Object.entries(missingByCategory)) {
      report += `### ${category.toUpperCase()} (${pages.length})\n\n`;
      pages.forEach(page => {
        report += `- **${page.displayName}**\n`;
        report += `  - Name: \`${page.name}\`\n`;
        report += `  - Route: \`${page.route || 'none'}\`\n`;
        report += `  - Menu Group: ${page.isMenuGroup ? 'Yes' : 'No'}\n\n`;
      });
    }
  }

  // Extra Pages (in DB but not documented)
  if (extra.length > 0) {
    report += `\n## ⚠️ Extra Pages (${extra.length})\n\n`;
    report += `These pages exist in the database but are NOT in page.md documentation:\n\n`;

    extra.forEach(page => {
      report += `### ${page.displayName}\n`;
      report += `- **Name:** \`${page.name}\`\n`;
      report += `- **Category:** ${page.moduleCategory || 'none'}\n`;
      report += `- **Route:** \`${page.route || 'none'}\`\n`;
      report += `- **Menu Group:** ${page.isMenuGroup ? 'Yes' : 'No'}\n\n`;
    });
  }

  // Implemented Pages by Category
  report += `\n## ✅ Implemented Pages (${implemented.length})\n\n`;

  const implByCategory = {};
  implemented.forEach(page => {
    const cat = page.category || 'uncategorized';
    if (!implByCategory[cat]) implByCategory[cat] = [];
    implByCategory[cat].push(page);
  });

  for (const [category, pages] of Object.entries(implByCategory)) {
    report += `### ${category.toUpperCase()} (${pages.length})\n\n`;
    pages.forEach(page => {
      report += `- ✅ \`${page.displayName}\` (\`${page.name}\`)\n`;
    });
  }

  // Detailed Listing
  report += `\n## 📋 Detailed Page Listing\n\n`;

  report += `### Implemented Pages (Alphabetical)\n\n`;
  implemented.sort((a, b) => a.displayName.localeCompare(b.displayName)).forEach(page => {
    report += `1. ✅ **${page.displayName}** - \`${page.name}\` - ${page.category}\n`;
  });

  if (missing.length > 0) {
    report += `\n### Missing Pages (Alphabetical)\n\n`;
    missing.sort((a, b) => a.displayName.localeCompare(b.displayName)).forEach(page => {
      report += `${missing.length}. ❌ **${page.displayName}** - \`${page.name}\` - ${page.category}\n`;
    });
  }

  // Write report to file
  const fs = await import('fs');
  const path = await import('path');
  const reportPath = path.join(process.cwd(), 'seed', 'PAGES_INVENTORY_REPORT.md');

  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`✓ Report generated: ${reportPath}`);

  await mongoose.disconnect();
  console.log('\n✓ Analysis complete!');
}

main().catch(console.error);
