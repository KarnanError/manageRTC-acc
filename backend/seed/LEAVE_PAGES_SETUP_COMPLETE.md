# New Leave Pages Setup - Complete Summary

## ✅ Configuration Status

All components have been successfully configured:

| Component | Status | Details |
|-----------|--------|---------|
| **Pages** | ✅ Complete | 3 new pages added to `pages` collection |
| **Permissions** | ✅ Complete | 3 permissions created and assigned |
| **HRM Module** | ✅ Complete | New pages added to HRM module |
| **Admin Role** | ✅ Complete | Has all 3 new permissions |
| **HR Role** | ✅ Complete | Has all 3 new permissions |
| **Superadmin Role** | ✅ Complete | Has all 3 new permissions |
| **Company Plan** | ✅ Complete | HRM module is in company's plan |

## 📄 New Pages Added

| Page Code | Display Name | Route | Page ID |
|-----------|--------------|-------|---------|
| `hrm.team-leaves` | Team Leaves | `team-leaves` | `6997e02acb32bd92179f0dbe` |
| `hrm.leave-calendar` | Leave Calendar | `leave-calendar` | `6997e02acb32bd92179f0dbf` |
| `hrm.leave-ledger` | Leave Balance History | `leave-ledger` | `6997e02acb32bd92179f0dc0` |

## 🔐 Permissions Created

| Permission ID | Page | Module |
|--------------|------|--------|
| `6997e040813cd153f5b7a00c` | Team Leaves | hrm |
| `6997e040813cd153f5b7a00a` | Leave Calendar | hrm |
| `6997e040813cd153f5b7a00b` | Leave Balance History | hrm |

## 📋 Role Permissions Summary

| Role | Permissions Count | Has New Leave Pages |
|------|-------------------|---------------------|
| admin | 32 | ✅ Yes |
| hr | 38 | ✅ Yes |
| superadmin | 141 | ✅ Yes (all pages) |

## 🔍 Troubleshooting Steps

If the new leave pages are NOT showing in the sidebar:

### 1. **Hard Refresh Browser**
- Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- This clears the cache and reloads fresh data

### 2. **Log Out and Log Back In**
- The permissions context is cached per session
- Sign out completely, then sign back in

### 3. **Check Browser Console**
- Open Developer Tools (F12)
- Check for any error messages in Console tab
- Look for failed API calls to `/api/company/enabled-pages`

### 4. **Verify User Role**
- Ensure you're logged in as `admin`, `hr`, or `superadmin`
- The `employee` role may have limited access
- Check: `user.publicMetadata.role` in browser console

### 5. **Test API Endpoint**
Run this to verify the API returns correct data:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/company/enabled-pages?debug=1
```

Look for the new routes in the response:
- `team-leaves`
- `leave-calendar`
- `leave-ledger`

### 6. **Clear Browser Storage**
- Open Developer Tools → Application → Storage
- Clear:
  - Local Storage
  - Session Storage
  - Cookies (for localhost)
- Then refresh

### 7. **Check Sidebar Component Logs**
- The sidebar component logs access checks to console
- Look for `[Sidebar hasAccess]` logs
- Verify the new leave routes are being checked

## 📝 Available Actions for New Pages

Each new page has these actions available:
- `read` - View page content
- `create` - Create new records
- `write` - Edit existing records
- `delete` - Delete records
- `import` - Import data
- `export` - Export data

These can be configured per role in the **Roles & Permissions** page.

## 🗂️ Hierarchy Structure

```
HRM (Category IV)
└── Attendance & Leave (L1 Menu Group)
    └── Leaves (L2 Menu Group)
        ├── Leaves (Admin) (/leaves)
        ├── Leaves (Employee) (/leaves-employee)
        ├── Leave Settings (/leave-settings)
        ├── Team Leaves (/team-leaves) ← NEW
        ├── Leave Calendar (/leave-calendar) ← NEW
        └── Leave Balance History (/leave-ledger) ← NEW
```

## 🛠️ Verification Scripts

Run these scripts to verify the setup:

```bash
# Verify all new leave pages
node backend/seed/verifyNewLeavePagesSetup.js

# Check admin role permissions
node backend/seed/diagnoseAdminLeavePermissions.js

# Check module configuration
node backend/seed/diagnoseModulePagesConfig.js

# Check company-plan-module chain
node backend/seed/diagnoseCompanyPlanModule.js [companyId]
```

## 📞 Support

If pages still don't show after following all troubleshooting steps:
1. Check the backend logs for any errors
2. Verify the MongoDB connection is working
3. Ensure the frontend is pointing to the correct backend API
