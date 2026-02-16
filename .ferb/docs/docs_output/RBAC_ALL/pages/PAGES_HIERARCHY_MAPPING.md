# Complete Pages Hierarchy Mapping

**Source:** `.ferb/docs/page.md` (Updated 2026-02-14)
**Purpose:** Complete hierarchical mapping of all pages for seed data

---

## Category I: Main Menu

```
I. Main Menu (main-menu)
├─ Dashboard
│  └─ /super-admin/dashboard ✅
├─ Companies
│  └─ /super-admin/companies ✅
├─ Subscriptions
│  └─ /super-admin/subscription ✅
├─ Packages
│  └─ /super-admin/package ✅
├─ Modules
│  └─ /super-admin/modules ✅
└─ Pages
   └─ /super-admin/pages ✅
```

---

## Category II: Users & Permissions

```
II. Users & Permissions (users-permissions)
├─ Users
│  └─ /users ✅
├─ Roles & Permissions
│  └─ /roles-permissions ✅
└─ Permission
   └─ /permission ✅
```

---

## Category III: Dashboards

```
III. Dashboards (dashboards)
├─ Admin Dashboard
│  └─ ⚠️ (find route and update here)
├─ HR Dashboard
│  └─ /hr-dashboard ✅
├─ Employee Dashboard
│  └─ /employee-dashboard ✅
├─ Deals Dashboard
│  └─ /deals-dashboard ✅
└─ Leads Dashboard
   └─ /leads-dashboard ✅
```

---

## Category IV: HRM (Most Complex - 4 Levels)

```
IV. HRM (hrm)
│
├─ Employees (L1 Parent Menu - no route)
│  ├─ Employees List
│  │  └─ /employees ✅
│  ├─ Department
│  │  └─ /departments ✅
│  ├─ Designation
│  │  └─ /designations ✅
│  └─ Policies
│     └─ /policy ✅
│
├─ Tickets (L1 Parent Menu - no route)
│  └─ Ticket List
│     └─ /tickets/ticket-list ✅
│
├─ Holidays (L1 Parent Menu - no route)
│  └─ Holidays
│     └─ /hrm/holidays ✅
│
├─ Attendance & Leave (L1 Parent Menu - no route)
│  │
│  ├─ Leaves (L2 Parent Menu - no route) ⭐
│  │  ├─ Leaves (Admin)
│  │  │  └─ /leaves ✅
│  │  ├─ Leaves (Employee)
│  │  │  └─ /leaves-employee ✅
│  │  └─ Leave Settings
│  │     └─ /leave-settings ✅
│  │
│  ├─ Attendance (L2 Parent Menu - no route) ⭐
│  │  ├─ Attendance (Admin)
│  │  │  └─ /attendance-admin ✅
│  │  ├─ Attendance (Employee)
│  │  │  └─ /attendance-employee ✅
│  │  └─ Timesheet
│  │     └─ /timesheets ✅
│  │
│  └─ Shift & Schedule (L2 Parent Menu - no route) ⭐
│     ├─ Schedule Timing
│     │  └─ /schedule-timing ✅
│     ├─ Shift Management
│     │  └─ /shifts-management ✅
│     ├─ Shift Batches
│     │  └─ /batches-management ✅
│     └─ Overtime
│        └─ /overtime ✅
│
├─ Performance (L1 Parent Menu - no route)
│  ├─ Performance Indicator
│  │  └─ /performance/performance-indicator ✅
│  ├─ Performance Review
│  │  └─ /performance/performance-review ✅
│  ├─ Performance Appraisal
│  │  └─ /performance/performance-appraisal ✅
│  ├─ Goal List
│  │  └─ /performance/goal-tracking ✅
│  └─ Goal Type
│     └─ /performance/goal-type ✅
│
├─ Training (L1 Parent Menu - no route)
│  ├─ Training List
│  │  └─ ⚠️ (no route)
│  ├─ Trainers
│  │  └─ ⚠️ (no route)
│  └─ Training Type
│     └─ ⚠️ (no route)
│
└─ Employee Lifecycle (L1 Parent Menu - no route)
   ├─ Promotions
   │  └─ ⚠️ (no route)
   ├─ Resignation
   │  └─ ⚠️ (no route)
   └─ Termination
      └─ ⚠️ (no route)
```

⭐ = Second-level parent menu (NEW in page.md)

---

## Category V: Recruitment

```
V. Recruitment (recruitment)
├─ Jobs
│  └─ ⚠️ (no route)
├─ Candidates
│  └─ ⚠️ (no route)
└─ Referrals
   └─ ⚠️ (no route)
```

---

## Category VI: Projects

```
VI. Projects (projects)
│
├─ Clients (L1 Menu - no route)
│  └─ Clients Grid
│     └─ /clients-grid ✅
│
└─ Projects (L1 Menu - no route)
   ├─ Projects Grid
   │  └─ /projects-grid ✅
   ├─ Tasks
   │  └─ /tasks ✅
   └─ Task Board
      └─ /task-board ✅
```

---

## Category VII: CRM

```
VII. CRM (crm)
├─ Contacts
│  └─ ⚠️ (no route)
├─ Companies
│  └─ ⚠️ (no route)
├─ Deals
│  └─ ⚠️ (no route)
├─ Leads
│  └─ ⚠️ (no route)
├─ Pipeline
│  └─ ⚠️ (no route)
├─ Analytics
│  └─ ⚠️ (no route)
└─ Activities
   └─ ⚠️ (no route)
```

---

## Category VIII: Applications

```
VIII. Applications (applications)
│
├─ Chat
│  └─ /application/chat ✅
│
├─ Call (L1 Parent Menu - no route)
│  ├─ Voice Call
│  │  └─ /application/voice-call ✅
│  ├─ Video Call
│  │  └─ /application/video-call ✅
│  ├─ Outgoing Call
│  │  └─ /application/outgoing-call ✅
│  ├─ Incoming Call
│  │  └─ /application/incoming-call ✅
│  └─ Call History
│     └─ /application/call-history ✅
│
├─ Calendar
│  └─ /calendar ✅
├─ Email
│  └─ /application/email ✅
├─ To Do
│  └─ /application/todo ✅
├─ Notes
│  └─ /notes ✅
├─ Social Feed
│  └─ /application/social-feed ✅
├─ File Manager
│  └─ /application/file-manager ✅
├─ Kanban
│  └─ /application/kanban-view ✅
└─ Invoices
   └─ /application/invoices ✅
```

---

## Category IX: Finance & Accounts

```
IX. Finance & Accounts (finance-accounts)
│
├─ Sales (L1 Parent Menu - no route)
│  ├─ Estimates
│  │  └─ ⚠️ (no route)
│  ├─ Invoices
│  │  └─ ⚠️ (no route)
│  ├─ Payments
│  │  └─ ⚠️ (no route)
│  ├─ Expenses
│  │  └─ ⚠️ (no route)
│  ├─ Provident Fund
│  │  └─ ⚠️ (no route)
│  └─ Taxes
│     └─ ⚠️ (no route)
│
├─ Accounting (L1 Parent Menu - no route)
│  ├─ Categories
│  │  └─ ⚠️ (no route)
│  ├─ Budgets
│  │  └─ ⚠️ (no route)
│  ├─ Budget Expenses
│  │  └─ ⚠️ (no route)
│  └─ Budget Revenues
│     └─ ⚠️ (no route)
│
└─ Payroll (L1 Parent Menu - no route)
   ├─ Employee Salary
   │  └─ ⚠️ (no route)
   ├─ Payslip
   │  └─ ⚠️ (no route)
   └─ Payroll Items
      └─ ⚠️ (no route)
```

---

## Category X: Administration

```
X. Administration (administration)
│
├─ Assets (L1 Parent Menu - no route)
│  ├─ Assets
│  │  └─ ⚠️ (no route)
│  └─ Asset Categories
│     └─ ⚠️ (no route)
│
├─ Help & Support (L1 Parent Menu - no route)
│  ├─ Knowledge Base
│  │  └─ ⚠️ (no route)
│  └─ Activities
│     └─ ⚠️ (no route)
│
├─ User Management (L1 Parent Menu - no route)
│  ├─ Users
│  │  └─ ⚠️ (no route)
│  └─ Roles & Permissions
│     └─ ⚠️ (no route)
│
├─ Reports (L1 Parent Menu - no route)
│  ├─ Expense Report
│  ├─ Invoice Report
│  ├─ Payment Report
│  ├─ Project Report
│  ├─ Task Report
│  ├─ User Report
│  ├─ Employee Report
│  ├─ Payslip Report
│  ├─ Attendance Report
│  ├─ Leave Report
│  └─ Daily Report
│
└─ Settings (L1 Parent Menu - no route)
   ├─ General Settings
   ├─ Website Settings
   ├─ App Settings
   ├─ System Settings
   ├─ Financial Settings
   └─ Other Settings
```

---

## Category XI: Pages

```
XI. Pages (pages) - L1 Parent Menu
├─ Starter
│  └─ ⚠️ (no route)
├─ Profile
│  └─ ⚠️ (no route)
├─ Gallery
│  └─ ⚠️ (no route)
├─ Search Results
│  └─ ⚠️ (no route)
├─ Timeline
│  └─ ⚠️ (no route)
├─ Pricing
│  └─ ⚠️ (no route)
├─ Coming Soon
│  └─ ⚠️ (no route)
├─ Under Maintenance
│  └─ ⚠️ (no route)
├─ Under Construction
│  └─ ⚠️ (no route)
├─ API Keys
│  └─ ⚠️ (no route)
├─ Privacy Policy
│  └─ ⚠️ (no route)
└─ Terms & Conditions
   └─ ⚠️ (no route)
```

---

## Category XII: Extras

```
XII. Extras (extras) - L1 Parent Menu
└─ Documentation
   └─ ⚠️ (no route)
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Categories (Level 0)** | 12 |
| **L1 Parent Menus** | 20 |
| **L2 Parent Menus** | 3 (all in HRM) |
| **Pages with Routes** | ~62 |
| **Pages without Routes** | ~48 |
| **Max Hierarchy Depth** | 4 levels |
| **Total Page Entries** | ~130+ |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Route provided and confirmed |
| ⚠️ | No route provided (needs update) |
| ⭐ | Second-level parent menu |

---

**Usage:** This mapping is the source of truth for creating hierarchical seed data.
