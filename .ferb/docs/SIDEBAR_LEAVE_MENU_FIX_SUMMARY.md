# Sidebar Menu Leave Pages Fix - Summary

**Date:** 2026-02-20
**Issue:** HR, Admin, and Manager roles were not seeing all leave pages in the sidebar menu.

---

## Root Cause

The `sidebarMenu.jsx` file uses **hardcoded switch statements** for each role instead of dynamically filtering based on RBAC permissions. The leave submenus were incomplete for several roles.

---

## Issues Found & Fixed

### 1. HR Role (`case 'hr':`)

**Before (Incomplete):**
```javascript
submenuItems: [
  { label: 'Leaves', link: routes.leaveadmin },
  { label: 'Leaves (Employee)', link: routes.leaveemployee },
  { label: 'Leave Settings', link: routes.leavesettings },  // ❌ WRONG - HR shouldn't see this
]
```

**After (Fixed):**
```javascript
submenuItems: [
  { label: 'Leaves (Admin)', link: routes.leaveadmin },
  { label: 'Leaves (Employee)', link: routes.leaveemployee },
  { label: 'Team Leaves', link: routes.leavemanager },        // ✅ ADDED
  { label: 'Leave Calendar', link: routes.leaveCalendar },    // ✅ ADDED
  { label: 'Leave Balance History', link: routes.leaveLedger }, // ✅ ADDED
]
```

---

### 2. Admin Role (`case 'admin':`)

**Before (Incomplete):**
```javascript
submenuItems: [
  { label: 'Leaves', link: routes.leaveadmin },
  { label: 'Leave Settings', link: routes.leavesettings },
]
// Missing 4 pages!
```

**After (Fixed):**
```javascript
submenuItems: [
  { label: 'Leaves (Admin)', link: routes.leaveadmin },
  { label: 'Leaves (Employee)', link: routes.leaveemployee },
  { label: 'Team Leaves', link: routes.leavemanager },
  { label: 'Leave Calendar', link: routes.leaveCalendar },
  { label: 'Leave Balance History', link: routes.leaveLedger },
  { label: 'Leave Settings', link: routes.leavesettings },
]
```

---

### 3. Manager Role (`case 'manager':`)

**Before (Incorrect - had Leave Settings):**
```javascript
submenuItems: [
  { label: 'Leaves (Admin)', link: routes.leaveadmin },
  { label: 'Leaves (Employee)', link: routes.leaveemployee },
  { label: 'Team Leaves', link: routes.leavemanager },
  { label: 'Leave Calendar', link: routes.leaveCalendar },
  { label: 'Leave Balance History', link: routes.leaveLedger },
  { label: 'Leave Settings', link: routes.leavesettings },  // ❌ WRONG - removed
]
```

**After (Fixed):**
```javascript
submenuItems: [
  { label: 'Leaves (Admin)', link: routes.leaveadmin },
  { label: 'Leaves (Employee)', link: routes.leaveemployee },
  { label: 'Team Leaves', link: routes.leavemanager },
  { label: 'Leave Calendar', link: routes.leaveCalendar },
  { label: 'Leave Balance History', link: routes.leaveLedger },
]
```

---

### 4. Employee Role (`case 'employee':`)

**Status:** ✅ Already correct - only sees Leaves (Employee)

```javascript
submenuItems: [
  { label: 'Leaves', link: routes.leaveemployee },
]
```

---

### 5. Superadmin Role (`case 'superadmin':`)

**Status:** ✅ Already correct - has all 6 pages

---

## Final Access Matrix

| Page | employee | manager | hr | admin | superadmin |
|------|----------|---------|-----|-------|------------|
| **Leaves (Admin)** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Leaves (Employee)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Team Leaves** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Leave Calendar** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Leave Balance History** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Leave Settings** | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Files Modified

1. **`react/src/core/data/json/sidebarMenu.jsx`** (Line ~3297 - HR case)
   - Added Team Leaves, Leave Calendar, Leave Balance History
   - Removed Leave Settings

2. **`react/src/core/data/json/sidebarMenu.jsx`** (Line ~2535 - Admin case)
   - Added Leaves (Employee), Team Leaves, Leave Calendar, Leave Balance History
   - Changed "Leaves" to "Leaves (Admin)"

3. **`react/src/core/data/json/sidebarMenu.jsx`** (Line ~3923 - Manager case)
   - Removed Leave Settings

4. **Database:** `backend/seed/fixHRLeaveMenuAccess.js`
   - Added HR access to `hrm.leaves-menu` and `hrm.attendance-leave-menu` parent menu groups

---

## Testing Steps

1. **HR User:**
   - Sign out and sign back in (to refresh permissions cache)
   - Should see under "Attendance" → "Leaves":
     - ✅ Leaves (Admin)
     - ✅ Leaves (Employee)
     - ✅ Team Leaves
     - ✅ Leave Calendar
     - ✅ Leave Balance History
     - ❌ Leave Settings (should NOT appear)

2. **Admin User:**
   - Should see all 6 leave pages including Leave Settings

3. **Manager User:**
   - Should see 5 leave pages (NOT Leave Settings)

4. **Employee User:**
   - Should see only "Leave Management" → "Leaves"

---

## Database Scripts Created

- `backend/seed/fixHRLeaveMenuAccess.js` - Fixed HR menu group permissions
- `backend/seed/diagnoseHRLeavePermissions.js` - Diagnostic tool
- `backend/seed/findLeavePageNames.js` - Lists all leave pages
- `backend/seed/verifyHRLeaveAccess.js` - Quick verification tool

---

## Important Notes

1. **Frontend Cache:** After changes, users may need to:
   - Sign out and sign back in
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser cache

2. **RBAC Note:** The sidebar menu is currently **hardcoded** and not using the RBAC permission system for filtering. Future enhancement would be to make it fully dynamic based on permissions.

3. **Route Definitions:** All routes must exist in `all_routes.tsx` for the menu links to work.
