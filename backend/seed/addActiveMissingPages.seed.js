/**
 * Seed: Add All "Active" Missing Pages to the pages collection
 *
 * These are routes that exist in the codebase (router.link.tsx) with real components
 * but have no corresponding document in the DB pages collection.
 *
 * Usage:
 *   node backend/seed/addActiveMissingPages.seed.js           -- dry-run (report only)
 *   node backend/seed/addActiveMissingPages.seed.js --apply   -- insert to DB
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

const APPLY = process.argv.includes('--apply');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const id = (v) => (v ? v._id : null);

function def(name, displayName, route, catId, {
  parentId = null, icon = 'ti ti-file', actions = ['read', 'create', 'write', 'delete'],
  sortOrder = 50, isSystem = false, description = '', featureFlags = {},
} = {}) {
  return { name, displayName, description, route, category: catId, parentPage: parentId,
    icon, availableActions: actions, sortOrder, isActive: true, isSystem,
    isMenuGroup: false, menuGroupLevel: null,
    ...(Object.keys(featureFlags).length ? { featureFlags } : {}),
  };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function run() {
  await mongoose.connect(uri, { dbName });
  console.log(`\n🔌 Connected to ${dbName}\n`);

  // ── Load existing categories ──────────────────────────────
  const cats = await PageCategory.find({}).lean();
  const C = Object.fromEntries(cats.map(c => [c.identifier, c]));
  console.log(`📂 Categories loaded: ${cats.map(c => c.identifier).join(', ')}\n`);

  // ── Ensure XIII (Authentication) & XIV (Content Management) ──
  let catXIII = cats.find(c => c.identifier === 'XIII');
  let catXIV  = cats.find(c => c.identifier === 'XIV');

  if (!catXIII) {
    if (APPLY) {
      catXIII = await PageCategory.create({
        identifier: 'XIII', displayName: 'Authentication', label: 'authentication',
        description: 'Login, register, password reset and other auth flows',
        sortOrder: 130,
      });
      console.log('  ✅ Created category XIII — Authentication');
    } else {
      catXIII = { _id: new mongoose.Types.ObjectId(), identifier: 'XIII', displayName: 'Authentication', label: 'authentication' };
      console.log('  [DRY] Would create category XIII — Authentication');
    }
  }
  if (!catXIV) {
    if (APPLY) {
      catXIV = await PageCategory.create({
        identifier: 'XIV', displayName: 'Content Management', label: 'content-management',
        description: 'CMS pages — blogs, FAQs, testimonials, locations',
        sortOrder: 140,
      });
      console.log('  ✅ Created category XIV — Content Management');
    } else {
      catXIV = { _id: new mongoose.Types.ObjectId(), identifier: 'XIV', displayName: 'Content Management', label: 'content-management' };
      console.log('  [DRY] Would create category XIV — Content Management');
    }
  }

  // ── Load existing pages for parent lookups ────────────────
  const existingPages = await Page.find({}).lean();
  const P = Object.fromEntries(existingPages.map(p => [p.name, p]));
  console.log(`📄 Existing pages loaded: ${existingPages.length}\n`);

  // ─────────────────────────────────────────────────────────
  // Page definitions
  // ─────────────────────────────────────────────────────────
  const catII   = C['II'];
  const catIV   = C['IV'];
  const catV    = C['V'];
  const catVI   = C['VI'];
  const catVII  = C['VII'];
  const catVIII = C['VIII'];
  const catIX   = C['IX'];
  const catX    = C['X'];
  const catXI   = C['XI'];
  const catXII  = C['XII'];

  // Parent pages
  const pSettingsMenu     = P['admin.settings-menu'];
  const pGeneralSettings  = P['admin.general-settings'];
  const pWebsiteSettings  = P['admin.website-settings'];
  const pAppSettings      = P['admin.app-settings'];
  const pSystemSettings   = P['admin.system-settings'];
  const pFinancialSettings= P['admin.financial-settings'];
  const pOtherSettings    = P['admin.other-settings'];
  const pAssetsMenu       = P['admin.assets-menu'];
  const pSalesMenu        = P['finance.sales-menu'];
  const pPayrollMenu      = P['finance.payroll-menu'];
  const pEmpMenu          = P['hrm.employees-menu'];
  const pAtLvMenu         = P['hrm.attendance-leave-menu'];
  const pProjectsMenu     = P['projects.projects-menu'];

  const pages = [

    // ── Category II — Users & Permissions ───────────────────
    def('users.delete-request',          'Delete Request',
        'user-management/delete-request',  id(catII),
        { icon: 'ti ti-trash', sortOrder: 50, description: 'Account deletion request management' }),

    def('users.manage-users',            'Manage Users',
        'user-management/manage-users',    id(catII),
        { icon: 'ti ti-users-group', sortOrder: 60, description: 'Manage all users in the system' }),

    def('users.roles-permissions-alt',   'Roles & Permissions (User Mgmt)',
        'user-management/roles-permissions', id(catII),
        { icon: 'ti ti-shield-lock', sortOrder: 70, description: 'Alternative roles & permissions page' }),

    // ── Category IV — HRM ────────────────────────────────────
    def('hrm.ticket-grid',              'Ticket Grid',
        'tickets/ticket-grid',            id(catIV),
        { icon: 'ti ti-layout-grid', sortOrder: 62, description: 'Ticket list in grid view' }),

    def('hrm.ticket-details',           'Ticket Details',
        'tickets/ticket-details',         id(catIV),
        { icon: 'ti ti-ticket', sortOrder: 63, description: 'Individual ticket detail page',
          actions: ['read', 'write', 'delete'] }),

    def('hrm.employee-details',         'Employee Details',
        'employees/:employeeId',          id(catIV),
        { parentId: id(pEmpMenu), icon: 'ti ti-user', sortOrder: 55,
          description: 'Individual employee profile and details',
          actions: ['read', 'write'] }),

    def('hrm.employees-grid',           'Employees Grid',
        'employees-grid',                 id(catIV),
        { parentId: id(pEmpMenu), icon: 'ti ti-layout-grid', sortOrder: 52,
          description: 'Employees list in grid/card view' }),

    // ── Category V — Recruitment ─────────────────────────────
    def('recruitment.jobs-list',         'Jobs List',
        'job-list',                        id(catV),
        { icon: 'ti ti-list', sortOrder: 55, description: 'Job openings in list view' }),

    def('recruitment.candidates-list',   'Candidates List',
        'candidates',                      id(catV),
        { icon: 'ti ti-list', sortOrder: 65, description: 'Candidates in list view' }),

    def('recruitment.candidates-kanban', 'Candidates Kanban',
        'candidates-kanban',               id(catV),
        { icon: 'ti ti-layout-kanban', sortOrder: 66,
          description: 'Candidates in kanban/pipeline view' }),

    // ── Category VI — Projects ───────────────────────────────
    def('projects.clients-list',         'Clients List',
        'clients',                         id(catVI),
        { icon: 'ti ti-list', sortOrder: 52, description: 'Client list view' }),

    def('projects.client-details',       'Client Details',
        'clients-details/:clientId',       id(catVI),
        { icon: 'ti ti-building', sortOrder: 53, description: 'Individual client profile',
          actions: ['read', 'write', 'delete'] }),

    def('projects.projects-list',        'Projects List',
        'projects',                        id(catVI),
        { parentId: id(pProjectsMenu), icon: 'ti ti-list', sortOrder: 52,
          description: 'Projects in list view' }),

    def('projects.project-details',      'Project Details',
        'projects-details/:projectId',     id(catVI),
        { parentId: id(pProjectsMenu), icon: 'ti ti-file-description', sortOrder: 54,
          description: 'Individual project details',
          actions: ['read', 'write', 'delete'] }),

    def('projects.task-details',         'Task Details',
        'task-details/:taskId',            id(catVI),
        { parentId: id(pProjectsMenu), icon: 'ti ti-file-check', sortOrder: 55,
          description: 'Individual task detail page',
          actions: ['read', 'write', 'delete'] }),

    // ── Category VII — CRM ───────────────────────────────────
    def('crm.contact-list',             'Contacts List',
        'contact-list',                    id(catVII),
        { icon: 'ti ti-list', sortOrder: 52, description: 'Contacts in list view' }),

    def('crm.contact-details',          'Contact Details',
        'contact-details/:contactId',      id(catVII),
        { icon: 'ti ti-user-circle', sortOrder: 53, description: 'Individual contact profile',
          actions: ['read', 'write', 'delete'] }),

    def('crm.companies-list',           'Companies List',
        'companies-list',                  id(catVII),
        { icon: 'ti ti-list', sortOrder: 62, description: 'CRM companies in list view' }),

    def('crm.company-details',          'Company Details',
        'companies-details/:companyId',    id(catVII),
        { icon: 'ti ti-building-skyscraper', sortOrder: 63,
          description: 'Individual CRM company profile',
          actions: ['read', 'write', 'delete'] }),

    def('crm.deals-list',               'Deals List',
        'deals-list',                      id(catVII),
        { icon: 'ti ti-list', sortOrder: 72, description: 'Deals in list view' }),

    def('crm.deal-details',             'Deal Details',
        'deals-details',                   id(catVII),
        { icon: 'ti ti-report-money', sortOrder: 73, description: 'Individual deal detail page',
          actions: ['read', 'write', 'delete'] }),

    def('crm.leads-list',               'Leads List',
        'leads-list',                      id(catVII),
        { icon: 'ti ti-list', sortOrder: 82, description: 'Leads in list view' }),

    def('crm.lead-details',             'Lead Details',
        'leads-details',                   id(catVII),
        { icon: 'ti ti-target', sortOrder: 83, description: 'Individual lead profile',
          actions: ['read', 'write', 'delete'] }),

    def('crm.edit-pipeline',            'Edit Pipeline',
        'pipeline/edit/:pipelineId',       id(catVII),
        { icon: 'ti ti-edit', sortOrder: 92, description: 'Edit an existing pipeline stage',
          actions: ['read', 'write'] }),

    // ── Category VIII — Applications ─────────────────────────
    def('apps.todo-list',               'Todo List',
        'application/todo-list',           id(catVIII),
        { icon: 'ti ti-list-check', sortOrder: 55, description: 'Todo items in list view' }),

    def('apps.email-reply',             'Email Reply',
        'application/email-reply',         id(catVIII),
        { icon: 'ti ti-mail-forward', sortOrder: 63, description: 'Email reply / compose page',
          actions: ['read', 'write'] }),

    // ── Category IX — Finance & Accounts ─────────────────────
    def('finance.add-invoice',          'Add Invoice',
        'add-invoices',                    id(catIX),
        { parentId: id(pSalesMenu), icon: 'ti ti-file-plus', sortOrder: 62,
          description: 'Create a new invoice', actions: ['read', 'create', 'write'] }),

    def('finance.invoice-details',      'Invoice Details',
        'invoice-details',                 id(catIX),
        { parentId: id(pSalesMenu), icon: 'ti ti-file-description', sortOrder: 63,
          description: 'View individual invoice details', actions: ['read', 'write'] }),

    def('finance.payroll-overtime',     'Payroll Overtime',
        'payroll-overtime',                id(catIX),
        { parentId: id(pPayrollMenu), icon: 'ti ti-clock-overtime', sortOrder: 54,
          description: 'Overtime payroll management' }),

    def('finance.payroll-deduction',    'Payroll Deduction',
        'payroll-deduction',               id(catIX),
        { parentId: id(pPayrollMenu), icon: 'ti ti-minus', sortOrder: 55,
          description: 'Payroll deduction management' }),

    // ── Category X — Administration ───────────────────────────
    // Assets
    def('admin.employee-asset',         'Employee Asset',
        'asset/employee-asset',            id(catX),
        { parentId: id(pAssetsMenu), icon: 'ti ti-device-laptop', sortOrder: 53,
          description: 'Assets assigned to employees' }),

    // General Settings sub-pages
    def('admin.notification-settings',  'Notification Settings',
        'general-settings/notifications-settings', id(catX),
        { parentId: id(pGeneralSettings), icon: 'ti ti-bell', sortOrder: 52,
          description: 'Configure system notification preferences' }),

    def('admin.profile-settings',       'Profile Settings',
        'general-settings/profile-settings', id(catX),
        { parentId: id(pGeneralSettings), icon: 'ti ti-user-circle', sortOrder: 53,
          description: 'User profile configuration' }),

    def('admin.security-settings',      'Security Settings',
        'general-settings/security-settings', id(catX),
        { parentId: id(pGeneralSettings), icon: 'ti ti-shield', sortOrder: 54,
          description: 'Security and authentication settings' }),

    // Website Settings sub-pages
    def('admin.seo-settings',           'SEO Settings',
        'website-settings/seo-settings',   id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-search', sortOrder: 52,
          description: 'Search engine optimisation settings' }),

    def('admin.localization-settings',  'Localization Settings',
        'website-settings/localization-settings', id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-world', sortOrder: 53,
          description: 'Language and locale configuration' }),

    def('admin.prefixes',               'Prefixes',
        'website-settings/prefixes',       id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-tag', sortOrder: 54,
          description: 'Configure name and ID prefixes' }),

    def('admin.preferences',            'Preferences',
        'website-settings/preferences',    id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-settings-2', sortOrder: 55,
          description: 'General website preferences' }),

    def('admin.appearance',             'Appearance',
        'website-settings/appearance',     id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-palette', sortOrder: 56,
          description: 'Theme and appearance customization' }),

    def('admin.authentication-settings','Authentication Settings',
        'website-settings/authentication-settings', id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-lock', sortOrder: 57,
          description: 'Login and authentication method settings' }),

    def('admin.ai-settings',            'AI Settings',
        'website-settings/ai-settings',    id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-brain', sortOrder: 58,
          description: 'AI feature configuration' }),

    def('admin.company-settings',       'Company Settings',
        'website-settings/company-settings', id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-building', sortOrder: 59,
          description: 'Company profile and branding settings' }),

    def('admin.language-settings',      'Language',
        'website-settings/language',       id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-language', sortOrder: 60,
          description: 'Language management and selection' }),

    def('admin.add-language',           'Add Language',
        'website-settings/add-language',   id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-language-plus', sortOrder: 61,
          description: 'Add a new language to the system' }),

    def('admin.language-web',           'Language Web',
        'website-settings/language-web',   id(catX),
        { parentId: id(pWebsiteSettings), icon: 'ti ti-world-www', sortOrder: 62,
          description: 'Web-specific language settings' }),

    // App Settings sub-pages
    def('admin.invoice-settings',       'Invoice Settings',
        'app-settings/invoice-settings',   id(catX),
        { parentId: id(pAppSettings), icon: 'ti ti-receipt', sortOrder: 52,
          description: 'Invoice format and number settings' }),

    def('admin.salary-settings',        'Salary Settings',
        'app-settings/salary-settings',    id(catX),
        { parentId: id(pAppSettings), icon: 'ti ti-coin', sortOrder: 53,
          description: 'Salary and compensation settings' }),

    def('admin.approval-settings',      'Approval Settings',
        'app-settings/approval-settings',  id(catX),
        { parentId: id(pAppSettings), icon: 'ti ti-thumb-up', sortOrder: 54,
          description: 'Workflow approval chain configuration' }),

    def('admin.leave-type',             'Leave Type',
        'app-settings/leave-type',         id(catX),
        { parentId: id(pAppSettings), icon: 'ti ti-beach', sortOrder: 55,
          description: 'Define and manage leave types' }),

    // System Settings sub-pages
    def('admin.email-templates',        'Email Templates',
        'system-settings/email-templates', id(catX),
        { parentId: id(pSystemSettings), icon: 'ti ti-template', sortOrder: 52,
          description: 'Email notification template management' }),

    def('admin.gdpr-cookies',           'GDPR Cookies',
        'system-settings/gdpr-cookies',    id(catX),
        { parentId: id(pSystemSettings), icon: 'ti ti-cookie', sortOrder: 53,
          description: 'GDPR cookie consent settings' }),

    def('admin.sms-settings',           'SMS Settings',
        'system-settings/sms-settings',    id(catX),
        { parentId: id(pSystemSettings), icon: 'ti ti-message', sortOrder: 54,
          description: 'SMS gateway configuration' }),

    def('admin.sms-template',           'SMS Template',
        'system-settings/sms-template',    id(catX),
        { parentId: id(pSystemSettings), icon: 'ti ti-message-code', sortOrder: 55,
          description: 'SMS notification template management' }),

    def('admin.otp-settings',           'OTP Settings',
        'system-settings/otp-settings',    id(catX),
        { parentId: id(pSystemSettings), icon: 'ti ti-device-mobile-code', sortOrder: 56,
          description: 'One-time password configuration' }),

    def('admin.maintenance-mode',       'Maintenance Mode',
        'system-settings/maintenance-mode', id(catX),
        { parentId: id(pSystemSettings), icon: 'ti ti-tool', sortOrder: 57,
          description: 'Enable or disable maintenance mode' }),

    // Financial Settings sub-pages
    def('admin.payment-gateways',       'Payment Gateways',
        'financial-settings/payment-gateways', id(catX),
        { parentId: id(pFinancialSettings), icon: 'ti ti-credit-card', sortOrder: 52,
          description: 'Payment gateway integration settings' }),

    def('admin.tax-rates',              'Tax Rates',
        'financial-settings/tax-rates',    id(catX),
        { parentId: id(pFinancialSettings), icon: 'ti ti-percentage', sortOrder: 53,
          description: 'Tax rate configuration' }),

    // Other Settings sub-pages
    def('admin.custom-css',             'Custom CSS',
        'other-settings/custom-css',       id(catX),
        { parentId: id(pOtherSettings), icon: 'ti ti-brand-css3', sortOrder: 52,
          description: 'Add custom CSS styles to the application' }),

    def('admin.custom-js',              'Custom JS',
        'other-settings/custom-js',        id(catX),
        { parentId: id(pOtherSettings), icon: 'ti ti-brand-javascript', sortOrder: 53,
          description: 'Add custom JavaScript to the application' }),

    def('admin.cronjob',                'Cron Job',
        'other-settings/cronjob',          id(catX),
        { parentId: id(pOtherSettings), icon: 'ti ti-clock-play', sortOrder: 54,
          description: 'Scheduled task management' }),

    def('admin.cronjob-schedule',       'Cron Job Schedule',
        'other-settings/cronjob-schedule', id(catX),
        { parentId: id(pOtherSettings), icon: 'ti ti-calendar-clock', sortOrder: 55,
          description: 'Cron job schedule configuration' }),

    def('admin.storage-settings',       'Storage Settings',
        'other-settings/storage-settings', id(catX),
        { parentId: id(pOtherSettings), icon: 'ti ti-server', sortOrder: 56,
          description: 'File storage backend settings' }),

    def('admin.backup',                 'Backup',
        'other-settings/backup',           id(catX),
        { parentId: id(pOtherSettings), icon: 'ti ti-database-export', sortOrder: 57,
          description: 'Database and file backup management' }),

    def('admin.clear-cache',            'Clear Cache',
        'other-settings/clear-cache',      id(catX),
        { parentId: id(pOtherSettings), icon: 'ti ti-refresh', sortOrder: 58,
          description: 'Clear application caches',
          actions: ['read', 'delete'] }),

    // ── Category XI — Pages ───────────────────────────────────
    def('pages.admin-profile',          'Admin Profile',
        'admin/profile',                   id(catXI),
        { icon: 'ti ti-user-circle', sortOrder: 52, description: 'Admin user profile page',
          actions: ['read', 'write'] }),

    def('pages.error-404',              'Error 404',
        'error-404',                       id(catXI),
        { icon: 'ti ti-error-404', sortOrder: 90, isSystem: true,
          description: 'Page not found error screen',
          actions: ['read'] }),

    def('pages.error-500',              'Error 500',
        'error-500',                       id(catXI),
        { icon: 'ti ti-server-off', sortOrder: 91, isSystem: true,
          description: 'Internal server error screen',
          actions: ['read'] }),

    // ── Category XII — Extras ─────────────────────────────────
    def('extras.membership-plans',      'Membership Plans',
        'membership-plans',                id(catXII),
        { icon: 'ti ti-stars', sortOrder: 20, description: 'Subscription membership plan listings' }),

    def('extras.membership-addons',     'Membership Addons',
        'membership-addons',               id(catXII),
        { icon: 'ti ti-puzzle', sortOrder: 21, description: 'Membership plan addon management' }),

    def('extras.membership-transactions','Membership Transactions',
        'membership-transactions',         id(catXII),
        { icon: 'ti ti-receipt', sortOrder: 22, description: 'Membership payment transaction history',
          actions: ['read'] }),

    // ── Category XIII — Authentication ────────────────────────
    // Auth pages are always accessible (no company/plan needed) — featureFlags.enabledForAll: true
    def('auth.login',                   'Login',
        'login',                           id(catXIII),
        { icon: 'ti ti-login', sortOrder: 10, isSystem: true,
          description: 'User login page', actions: ['read'],
          featureFlags: { enabledForAll: true } }),

    def('auth.register',                'Register',
        'register',                        id(catXIII),
        { icon: 'ti ti-user-plus', sortOrder: 20, isSystem: true,
          description: 'New user registration page', actions: ['read'],
          featureFlags: { enabledForAll: true } }),

    def('auth.forgot-password',         'Forgot Password',
        'forgot-password',                 id(catXIII),
        { icon: 'ti ti-key', sortOrder: 30, isSystem: true,
          description: 'Password recovery request page', actions: ['read'],
          featureFlags: { enabledForAll: true } }),

    def('auth.two-step-verification',   'Two-Step Verification',
        'two-step-verification',           id(catXIII),
        { icon: 'ti ti-device-mobile', sortOrder: 40, isSystem: true,
          description: '2FA verification page', actions: ['read'],
          featureFlags: { enabledForAll: true } }),

    def('auth.email-verification',      'Email Verification',
        'email-verification',             id(catXIII),
        { icon: 'ti ti-mail-check', sortOrder: 50, isSystem: true,
          description: 'Email address verification page', actions: ['read'],
          featureFlags: { enabledForAll: true } }),

    def('auth.lock-screen',             'Lock Screen',
        'lock-screen',                     id(catXIII),
        { icon: 'ti ti-lock', sortOrder: 60, isSystem: true,
          description: 'Session lock screen', actions: ['read'],
          featureFlags: { enabledForAll: true } }),

    def('auth.reset-password',          'Reset Password',
        'reset-password',                  id(catXIII),
        { icon: 'ti ti-lock-cog', sortOrder: 70, isSystem: true,
          description: 'Password reset page', actions: ['read', 'write'],
          featureFlags: { enabledForAll: true } }),

    def('auth.reset-password-success',  'Reset Password Success',
        'success',                         id(catXIII),
        { icon: 'ti ti-check', sortOrder: 80, isSystem: true,
          description: 'Password reset success confirmation', actions: ['read'],
          featureFlags: { enabledForAll: true } }),

    // ── Category XIV — Content Management ────────────────────
    def('content.pages',                'Content Pages',
        'content/pages',                   id(catXIV),
        { icon: 'ti ti-files', sortOrder: 10, description: 'Static content page management' }),

    def('content.countries',            'Countries',
        'countries',                       id(catXIV),
        { icon: 'ti ti-flag', sortOrder: 20, description: 'Country list management' }),

    def('content.states',               'States',
        'content/states',                  id(catXIV),
        { icon: 'ti ti-map', sortOrder: 30, description: 'State / province list management' }),

    def('content.cities',               'Cities',
        'content/cities',                  id(catXIV),
        { icon: 'ti ti-map-pin', sortOrder: 40, description: 'City list management' }),

    def('content.testimonials',         'Testimonials',
        'testimonials',                    id(catXIV),
        { icon: 'ti ti-star', sortOrder: 50, description: 'Customer testimonial management' }),

    def('content.faq',                  'FAQ',
        'faq',                             id(catXIV),
        { icon: 'ti ti-help-circle', sortOrder: 60, description: 'Frequently asked questions management' }),

    def('content.blogs',                'Blogs',
        'blogs',                           id(catXIV),
        { icon: 'ti ti-news', sortOrder: 70, description: 'Blog post management' }),

    def('content.blog-categories',      'Blog Categories',
        'blog-categories',                 id(catXIV),
        { icon: 'ti ti-category', sortOrder: 71, description: 'Blog category management' }),

    def('content.blog-comments',        'Blog Comments',
        'blog-comments',                   id(catXIV),
        { icon: 'ti ti-message-circle', sortOrder: 72, description: 'Blog comment moderation' }),

    def('content.blog-tags',            'Blog Tags',
        'blog-tags',                       id(catXIV),
        { icon: 'ti ti-tags', sortOrder: 73, description: 'Blog tag management' }),
  ];

  // ── Filter out already-existing pages ─────────────────────
  const existingNames = new Set(existingPages.map(p => p.name));
  const toInsert = pages.filter(p => !existingNames.has(p.name));
  const alreadyExist = pages.filter(p => existingNames.has(p.name));

  console.log(`📊 Summary:`);
  console.log(`   Pages to insert : ${toInsert.length}`);
  console.log(`   Already in DB   : ${alreadyExist.length}`);
  if (alreadyExist.length > 0) {
    console.log(`   Skipping (exist): ${alreadyExist.map(p => p.name).join(', ')}\n`);
  }

  if (!APPLY) {
    console.log('\n📋 Pages that WOULD be inserted:\n');
    toInsert.forEach((p, i) => {
      console.log(`  ${String(i+1).padStart(3, ' ')}. ${p.name.padEnd(42)} → ${p.route || '(none)'}`);
    });
    console.log(`\n💡 Run with --apply to insert these ${toInsert.length} pages.\n`);
    await mongoose.disconnect();
    return;
  }

  // ── Insert pages one by one (so pre-save hook fires) ───────
  let inserted = 0;
  let failed = 0;
  const results = [];

  for (const pageData of toInsert) {
    try {
      const page = new Page(pageData);
      await page.save();
      inserted++;
      results.push({ status: '✅', name: page.name, route: page.route });
      process.stdout.write(`  ✅ ${page.name}\n`);
    } catch (err) {
      failed++;
      results.push({ status: '❌', name: pageData.name, error: err.message });
      console.error(`  ❌ ${pageData.name}: ${err.message}`);
    }
  }

  console.log(`\n── Result ──────────────────────────────────────`);
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Failed   : ${failed}`);
  console.log(`  Skipped  : ${alreadyExist.length}`);

  const totalNow = await Page.countDocuments();
  console.log(`  Total pages in DB now: ${totalNow}\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected.\n');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
