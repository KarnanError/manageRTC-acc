# Pages Directory

> **Total Pages in DB:** 226 | **Categories:** 14
> Last updated: 2026-02-17

All pages listed here exist in the `pages` collection in the database.
Organized by category, with parent → child hierarchy.

## Table of Contents

- [I. Main Menu](#i-main-menu) — 6 pages
- [II. Users & Permissions](#ii-users-permissions) — 8 pages
- [III. Dashboards](#iii-dashboards) — 5 pages
- [IV. HRM](#iv-hrm) — 39 pages
- [V. Recruitment](#v-recruitment) — 6 pages
- [VI. Projects](#vi-projects) — 10 pages
- [VII. CRM](#vii-crm) — 16 pages
- [VIII. Applications](#viii-applications) — 17 pages
- [IX. Finance & Accounts](#ix-finance-accounts) — 20 pages
- [X. Administration](#x-administration) — 62 pages
- [XI. Pages](#xi-pages) — 15 pages
- [XII. Extras](#xii-extras) — 4 pages
- [XIII. Authentication](#xiii-authentication) — 8 pages
- [XIV. Content Management](#xiv-content-management) — 10 pages

---

## I. Main Menu

> Super Admin main menu items

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Dashboard** | `super-admin/dashboard` | `super-admin.dashboard` | System |
| **Companies** | `super-admin/companies` | `super-admin.companies` | System |
| **Subscriptions** | `super-admin/subscription` | `super-admin.subscriptions` | System |
| **Packages** | `super-admin/package` | `super-admin.packages` | System |
| **Modules** | `super-admin/modules` | `super-admin.modules` | System |
| **Pages** | `super-admin/pages` | `super-admin.pages` | System |

*6 pages in this category*

---

## II. Users & Permissions

> User management and role-based access control

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Users** | `users` | `users` | System |
| **Roles & Permissions** | `roles-permissions` | `roles-permissions` | System |
| **Permission** | `permission` | `permission` | System |
| **Mandatory Permissions** | `mandatory-permissions` | `mandatory-permissions` | System |
| **Delete Request** | `user-management/delete-request` | `users.delete-request` | Active |
| **Super Admins** | `super-admin/superadmins` | `admin.superadmins` | System |
| **Manage Users** | `user-management/manage-users` | `users.manage-users` | Active |
| **Roles & Permissions (User Mgmt)** | `user-management/roles-permissions` | `users.roles-permissions-alt` | Active |

*8 pages in this category*

---

## III. Dashboards

> Analytics and reporting dashboards

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Admin Dashboard** | `admin-dashboard` | `admin.dashboard` | System |
| **HR Dashboard** | `hr-dashboard` | `hr.dashboard` | System |
| **Employee Dashboard** | `employee-dashboard` | `employee.dashboard` | System |
| **Deals Dashboard** | `deals-dashboard` | `deals.dashboard` | System |
| **Leads Dashboard** | `leads-dashboard` | `leads.dashboard` | System |

*5 pages in this category*

---

## IV. HRM

> Human Resource Management

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Employees** | `—` | `hrm.employees-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Employees List** | `employees` | `hrm.employees-list` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Department** | `departments` | `hrm.departments` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Designation** | `designations` | `hrm.designations` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Policies** | `policy` | `hrm.policies` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Employees Grid** | `employees-grid` | `hrm.employees-grid` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **Employee Details** | `employees/:employeeId` | `hrm.employee-details` | Active |
| **Attendance & Leave** | `—` | `hrm.attendance-leave-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Leaves** | `—` | `hrm.leaves-menu` | L2 Group |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Leaves (Admin)** | `leaves` | `hrm.leaves-admin` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Leaves (Employee)** | `leaves-employee` | `hrm.leaves-employee` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Leave Settings** | `leave-settings` | `hrm.leave-settings` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Attendance** | `—` | `hrm.attendance-menu` | L2 Group |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Attendance (Admin)** | `attendance-admin` | `hrm.attendance-admin` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Attendance (Employee)** | `attendance-employee` | `hrm.attendance-employee` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Timesheet** | `timesheets` | `hrm.timesheet` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Shift & Schedule** | `—` | `hrm.shift-schedule-menu` | L2 Group |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Schedule Timing** | `schedule-timing` | `hrm.schedule-timing` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Shift Management** | `shifts-management` | `hrm.shifts-management` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Shift Batches** | `batches-management` | `hrm.batches-management` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Overtime** | `overtime` | `hrm.overtime` | System |
| **Performance** | `—` | `hrm.performance-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Performance Indicator** | `performance/performance-indicator` | `hrm.performance-indicator` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Performance Review** | `performance/performance-review` | `hrm.performance-review` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Performance Appraisal** | `preformance/performance-appraisal` | `hrm.performance-appraisal` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Goal List** | `performance/goal-tracking` | `hrm.goal-tracking` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Goal Type** | `performance/goal-type` | `hrm.goal-type` | System |
| **Training** | `—` | `hrm.training-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Training List** | `training/training-list` | `hrm.training-list` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Trainers** | `training/trainers` | `hrm.trainers` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Training Type** | `training/training-type` | `hrm.training-type` | System |
| **Employee Lifecycle** | `—` | `hrm.employee-lifecycle-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Promotions** | `promotion` | `hrm.promotions` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Resignation** | `resignation` | `hrm.resignation` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Termination** | `termination` | `hrm.termination` | System |
| **Tickets** | `tickets/ticket-list` | `hrm.tickets` | System |
| **Holidays** | `hrm/holidays` | `hrm.holidays` | System |
| **Ticket Grid** | `tickets/ticket-grid` | `hrm.ticket-grid` | Active |
| **Ticket Details** | `tickets/ticket-details` | `hrm.ticket-details` | Active |

*39 pages in this category*

---

## V. Recruitment

> Talent acquisition and hiring

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Jobs** | `job-grid` | `recruitment.jobs` | System |
| **Candidates** | `candidates-grid` | `recruitment.candidates` | System |
| **Referrals** | `refferals` | `recruitment.referrals` | System |
| **Jobs List** | `job-list` | `recruitment.jobs-list` | Active |
| **Candidates List** | `candidates` | `recruitment.candidates-list` | Active |
| **Candidates Kanban** | `candidates-kanban` | `recruitment.candidates-kanban` | Active |

*6 pages in this category*

---

## VI. Projects

> Project and task management

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Projects** | `—` | `projects.projects-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Projects Grid** | `projects-grid` | `projects.projects-grid` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Tasks** | `tasks` | `projects.tasks` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Task Board** | `task-board` | `projects.task-board` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Projects List** | `projects` | `projects.projects-list` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **Project Details** | `projects-details/:projectId` | `projects.project-details` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **Task Details** | `task-details/:taskId` | `projects.task-details` | Active |
| **Clients** | `clients-grid` | `projects.clients` | System |
| **Clients List** | `clients` | `projects.clients-list` | Active |
| **Client Details** | `clients-details/:clientId` | `projects.client-details` | Active |

*10 pages in this category*

---

## VII. CRM

> Customer Relationship Management

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Contacts** | `contact-grid` | `crm.contacts` | System |
| **Companies** | `companies-grid` | `crm.companies` | System |
| **Deals** | `deals-grid` | `crm.deals` | System |
| **Leads** | `leads-grid` | `crm.leads` | System |
| **Pipeline** | `pipeline` | `crm.pipeline` | System |
| **Contacts List** | `contact-list` | `crm.contact-list` | Active |
| **Contact Details** | `contact-details/:contactId` | `crm.contact-details` | Active |
| **Analytics** | `analytics` | `crm.analytics` | System |
| **Companies List** | `companies-list` | `crm.companies-list` | Active |
| **Company Details** | `companies-details/:companyId` | `crm.company-details` | Active |
| **Activities** | `/` | `crm.activities` | System |
| **Deals List** | `deals-list` | `crm.deals-list` | Active |
| **Deal Details** | `deals-details` | `crm.deal-details` | Active |
| **Leads List** | `leads-list` | `crm.leads-list` | Active |
| **Lead Details** | `leads-details` | `crm.lead-details` | Active |
| **Edit Pipeline** | `pipeline/edit/:pipelineId` | `crm.edit-pipeline` | Active |

*16 pages in this category*

---

## VIII. Applications

> Internal applications and tools

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Call** | `—` | `apps.call-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Voice Call** | `application/voice-call` | `apps.voice-call` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Video Call** | `application/video-call` | `apps.video-call` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Outgoing Call** | `application/outgoing-call` | `apps.outgoing-call` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Incoming Call** | `application/incoming-call` | `apps.incoming-call` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Call History** | `application/call-history` | `apps.call-history` | System |
| **Chat** | `application/chat` | `apps.chat` | System |
| **Calendar** | `calendar` | `apps.calendar` | System |
| **Email** | `application/email` | `apps.email` | System |
| **To Do** | `application/todo` | `apps.todo` | System |
| **Todo List** | `application/todo-list` | `apps.todo-list` | Active |
| **Notes** | `notes` | `apps.notes` | System |
| **Email Reply** | `application/email-reply` | `apps.email-reply` | Active |
| **Social Feed** | `application/social-feed` | `apps.social-feed` | System |
| **File Manager** | `application/file-manager` | `apps.file-manager` | System |
| **Kanban** | `application/kanban-view` | `apps.kanban` | System |
| **Invoices** | `application/invoices` | `apps.invoices` | System |

*17 pages in this category*

---

## IX. Finance & Accounts

> Financial management and accounting

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Sales** | `—` | `finance.sales-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Estimates** | `estimates` | `finance.estimates` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Invoices** | `invoices` | `finance.invoices` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Payments** | `payments` | `finance.payments` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Expenses** | `expenses` | `finance.expenses` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Provident Fund** | `provident-fund` | `finance.provident-fund` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Taxes** | `taxes` | `finance.taxes` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Add Invoice** | `add-invoices` | `finance.add-invoice` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **Invoice Details** | `invoice-details` | `finance.invoice-details` | Active |
| **Accounting** | `—` | `finance.accounting-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Categories** | `accounting/categories` | `finance.categories` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Budgets** | `accounting/budgets` | `finance.budgets` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Budget Expenses** | `accounting/budgets-expenses` | `finance.budget-expenses` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Budget Revenues** | `accounting/budget-revenues` | `finance.budget-revenues` | System |
| **Payroll** | `—` | `finance.payroll-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Employee Salary** | `employee-salary` | `finance.employee-salary` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Payslip** | `payslip` | `finance.payslip` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Payroll Items** | `payroll` | `finance.payroll-items` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Payroll Overtime** | `payroll-overtime` | `finance.payroll-overtime` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **Payroll Deduction** | `payroll-deduction` | `finance.payroll-deduction` | Active |

*20 pages in this category*

---

## X. Administration

> System administration and settings

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Assets** | `—` | `admin.assets-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Assets** | `assets` | `admin.assets` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Asset Categories** | `asset-categories` | `admin.asset-categories` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Employee Asset** | `asset/employee-asset` | `admin.employee-asset` | Active |
| **Help & Support** | `—` | `admin.help-support-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Knowledge Base** | `knowledgebase` | `admin.knowledge-base` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Activities** | `activity` | `admin.activities` | System |
| **User Management** | `—` | `admin.user-management-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Users** | `users` | `admin.users` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Roles & Permissions** | `roles-permissions` | `admin.roles-permissions` | System |
| **Reports** | `—` | `admin.reports-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **Expense Report** | `expenses-report` | `admin.expense-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Invoice Report** | `invoice-report` | `admin.invoice-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Payment Report** | `payment-report` | `admin.payment-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Project Report** | `project-report` | `admin.project-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Task Report** | `task-report` | `admin.task-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **User Report** | `user-report` | `admin.user-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Employee Report** | `employee-report` | `admin.employee-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Payslip Report** | `payslip-report` | `admin.payslip-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Attendance Report** | `attendance-report` | `admin.attendance-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Leave Report** | `leave-report` | `admin.leave-report` | System |
| &nbsp;&nbsp;&nbsp;&nbsp; **Daily Report** | `daily-report` | `admin.daily-report` | System |
| **Settings** | `—` | `admin.settings-menu` | L1 Group |
| &nbsp;&nbsp;&nbsp;&nbsp; **General Settings** | `general-settings/connected-apps` | `admin.general-settings` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Notification Settings** | `general-settings/notifications-settings` | `admin.notification-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Profile Settings** | `general-settings/profile-settings` | `admin.profile-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Security Settings** | `general-settings/security-settings` | `admin.security-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **Website Settings** | `website-settings/bussiness-settings` | `admin.website-settings` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **SEO Settings** | `website-settings/seo-settings` | `admin.seo-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Localization Settings** | `website-settings/localization-settings` | `admin.localization-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Prefixes** | `website-settings/prefixes` | `admin.prefixes` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Preferences** | `website-settings/preferences` | `admin.preferences` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Appearance** | `website-settings/appearance` | `admin.appearance` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Authentication Settings** | `website-settings/authentication-settings` | `admin.authentication-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **AI Settings** | `website-settings/ai-settings` | `admin.ai-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Company Settings** | `website-settings/company-settings` | `admin.company-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Language** | `website-settings/language` | `admin.language-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Add Language** | `website-settings/add-language` | `admin.add-language` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Language Web** | `website-settings/language-web` | `admin.language-web` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **App Settings** | `app-settings/custom-fields` | `admin.app-settings` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Invoice Settings** | `app-settings/invoice-settings` | `admin.invoice-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Salary Settings** | `app-settings/salary-settings` | `admin.salary-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Approval Settings** | `app-settings/approval-settings` | `admin.approval-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Leave Type** | `app-settings/leave-type` | `admin.leave-type` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **System Settings** | `system-settings/email-settings` | `admin.system-settings` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Email Templates** | `system-settings/email-templates` | `admin.email-templates` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **GDPR Cookies** | `system-settings/gdpr-cookies` | `admin.gdpr-cookies` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **SMS Settings** | `system-settings/sms-settings` | `admin.sms-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **SMS Template** | `system-settings/sms-template` | `admin.sms-template` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **OTP Settings** | `system-settings/otp-settings` | `admin.otp-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Maintenance Mode** | `system-settings/maintenance-mode` | `admin.maintenance-mode` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **Financial Settings** | `financial-settings/currencies` | `admin.financial-settings` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Payment Gateways** | `financial-settings/payment-gateways` | `admin.payment-gateways` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Tax Rates** | `financial-settings/tax-rates` | `admin.tax-rates` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp; **Other Settings** | `other-settings/ban-ip-address` | `admin.other-settings` | System |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Custom CSS** | `other-settings/custom-css` | `admin.custom-css` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Custom JS** | `other-settings/custom-js` | `admin.custom-js` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Cron Job** | `other-settings/cronjob` | `admin.cronjob` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Cron Job Schedule** | `other-settings/cronjob-schedule` | `admin.cronjob-schedule` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Storage Settings** | `other-settings/storage-settings` | `admin.storage-settings` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Backup** | `other-settings/backup` | `admin.backup` | Active |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Clear Cache** | `other-settings/clear-cache` | `admin.clear-cache` | Active |

*62 pages in this category*

---

## XI. Pages

> Content and static pages

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Starter** | `starter` | `pages.starter` | System |
| **Profile** | `pages/profile` | `pages.profile` | System |
| **Gallery** | `gallery` | `pages.gallery` | System |
| **Search Results** | `search-result` | `pages.search-results` | System |
| **Timeline** | `timeline` | `pages.timeline` | System |
| **Admin Profile** | `admin/profile` | `pages.admin-profile` | Active |
| **Pricing** | `pricing` | `pages.pricing` | System |
| **Coming Soon** | `coming-soon` | `pages.coming-soon` | System |
| **Under Maintenance** | `under-maintenance` | `pages.under-maintenance` | System |
| **Error 404** | `error-404` | `pages.error-404` | System |
| **Under Construction** | `under-construction` | `pages.under-construction` | System |
| **Error 500** | `error-500` | `pages.error-500` | System |
| **API Keys** | `api-keys` | `pages.api-keys` | System |
| **Privacy Policy** | `privacy-policy` | `pages.privacy-policy` | System |
| **Terms & Conditions** | `terms-condition` | `pages.terms-conditions` | System |

*15 pages in this category*

---

## XII. Extras

> Additional features and extras

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Documentation** | `—` | `extras.documentation` | System |
| **Membership Plans** | `membership-plans` | `extras.membership-plans` | Active |
| **Membership Addons** | `membership-addons` | `extras.membership-addons` | Active |
| **Membership Transactions** | `membership-transactions` | `extras.membership-transactions` | Active |

*4 pages in this category*

---

## XIII. Authentication

> Login, register, password reset and other auth flows

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Login** | `login` | `auth.login` | System |
| **Register** | `register` | `auth.register` | System |
| **Forgot Password** | `forgot-password` | `auth.forgot-password` | System |
| **Two-Step Verification** | `two-step-verification` | `auth.two-step-verification` | System |
| **Email Verification** | `email-verification` | `auth.email-verification` | System |
| **Lock Screen** | `lock-screen` | `auth.lock-screen` | System |
| **Reset Password** | `reset-password` | `auth.reset-password` | System |
| **Reset Password Success** | `success` | `auth.reset-password-success` | System |

*8 pages in this category*

---

## XIV. Content Management

> CMS pages — blogs, FAQs, testimonials, locations

| Display Name | Route | Name (code) | Usage |
|---|---|---|---|
| **Content Pages** | `content/pages` | `content.pages` | Active |
| **Countries** | `countries` | `content.countries` | Active |
| **States** | `content/states` | `content.states` | Active |
| **Cities** | `content/cities` | `content.cities` | Active |
| **Testimonials** | `testimonials` | `content.testimonials` | Active |
| **FAQ** | `faq` | `content.faq` | Active |
| **Blogs** | `blogs` | `content.blogs` | Active |
| **Blog Categories** | `blog-categories` | `content.blog-categories` | Active |
| **Blog Comments** | `blog-comments` | `content.blog-comments` | Active |
| **Blog Tags** | `blog-tags` | `content.blog-tags` | Active |

*10 pages in this category*

---

## Legend

| Usage | Meaning |
|---|---|
| Active | Real working page in the application |
| System | Internal utility page (validate, clerk, etc.) |
| L1 Group | Top-level navigation menu group (no route) |
| L2 Group | Second-level navigation menu group (no route) |

> All pages in this document are present in the `pages` MongoDB collection.
> Demo, Alias, Disabled, Not Routed, and Bug routes are excluded.
