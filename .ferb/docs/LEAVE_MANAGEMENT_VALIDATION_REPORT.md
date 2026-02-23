# LEAVE MANAGEMENT SYSTEM - BRUTAL VALIDATION REPORT

**Date:** 2026-02-19
**Status:** 🔴 CRITICAL ISSUES FOUND
**Analyzed By:** Claude Code Analysis

---

## EXECUTIVE SUMMARY

The Leave Management System has been thoroughly analyzed. While the backend infrastructure is solid, **CRITICAL ISSUES** were found in the frontend implementation, particularly with:

1. **Leave Settings Page** - Uses completely hardcoded data with no database integration
2. **Leave Balance Display** - Shows hardcoded values instead of real-time employee data
3. **Leave Application Workflow** - Missing proper reporting manager notification
4. **Admin Stats** - Using fake values instead of real calculations

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Leave-Related Pages Analysis](#2-leave-related-pages-analysis)
3. [Critical Issues Found](#3-critical-issues-found)
4. [Real-World vs Implementation Comparison](#4-real-world-vs-implementation-comparison)
5. [Detailed Page Analysis](#5-detailed-page-analysis)
6. [Backend Analysis](#6-backend-analysis)
7. [Recommendations & Implementation Plan](#7-recommendations--implementation-plan)

---

## 1. SYSTEM OVERVIEW

### 1.1 Leave Pages Identified

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Leaves (Admin/HR) | `/leaves` | View all company leave requests | ✅ Works but fake stats |
| Leaves (Employee) | `/leaves-employee` | View own leaves and apply | ⚠️ Fake balances |
| Leave Settings | `/leave-settings` | Configure leave types and policies | 🔴 Hardcoded data |
| Leave Type Settings | `/settings/app-settings/leave-type` | Manage leave types | ✅ Works |

### 1.2 Leave Type Mapping

| Display Name | Backend Value | Found In |
|--------------|---------------|----------|
| Annual Leave | `earned` | ✅ leaveTypeDisplayMap |
| Medical Leave | `sick` | ✅ leaveTypeDisplayMap |
| Casual Leave | `casual` | ✅ leaveTypeDisplayMap |
| Maternity Leave | `maternity` | ✅ Schema |
| Paternity Leave | `paternity` | ✅ Schema |
| Other | Various | ⚠️ Inconsistent |

---

## 2. LEAVE-RELATED PAGES ANALYSIS

### 2.1 Page Connectivity Matrix

```
                    ┌─────────────────┐
                    │  Leave Settings │
                    │  (/leave-settings)│
                    └────────┬─────────┘
                             │ (should configure)
                             ▼
    ┌────────────┐    ┌─────────────┐    ┌─────────────────┐
    │ Leave Type │◄───┤   Employee  │───►│ Leave Employee  │
    │ Master Data│    │  (balances) │    │ (/leaves-employee)│
    └────────────┘    └─────────────┘    └────────┬─────────┘
                                                  │ (submits to)
                                                  ▼
                                          ┌───────────────┐
                                          │ Leave Admin   │
                                          │ (/leaves)     │
                                          └───────┬───────┘
                                                  │ (approves/rejects)
                                                  ▼
                                          ┌───────────────┐
                                          │ Update Balance│
                                          │ (auto)        │
                                          └───────────────┘
```

**Current Status:** ❌ Page connections are NOT properly implemented. Leave Settings doesn't save to DB, and balances are hardcoded.

---

## 3. CRITICAL ISSUES FOUND

### 3.1 🔴 CRITICAL: Leave Settings Page Uses Hardcoded Data

**File:** `react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx`

**Issue:** The Leave Settings page has:
- Hardcoded leave types array (lines 12-17)
- Hardcoded employee list (lines 18-23)
- Hardcoded source/target lists for employee assignment (lines 28-50)
- No API calls to fetch real leave type data
- No save functionality to update database

```typescript
// ❌ HARDCODED DATA
const leavetype = [
  { value: "Select", label: "Select" },
  { value: "Medical Leave", label: "Medical Leave" },
  { value: "Casual Leave", label: "Casual Leave" },
  { value: "Annual Leave", label: "Annual Leave" },
];

const addemployee = [
  { value: "Select", label: "Select" },
  { value: "Sophie", label: "Sophie" },
  { value: "Cameron", label: "Cameron" },
  { value: "Doris", label: "Doris" },
];
```

**Expected Behavior:**
- Fetch leave types from `/api/leave-types/active`
- Fetch employees from `/api/employees`
- Save leave policies to database
- Update employee leave balances when settings change

**Impact:** Users cannot configure leave policies. Any changes made in the UI are not persisted.

### 3.2 🔴 CRITICAL: Leave Balances Display Hardcoded Values

**File:** `react/src/feature-module/hrm/attendance/leaves/leaveEmployee.tsx`

**Issue:** The leave balances are hardcoded in the initial state (lines 102-107):

```typescript
// ❌ HARDCODED BALANCES
const [balances, setBalances] = useState<Record<string, { total: number; used: number; balance: number }>>({
  annual: { total: 12, used: 5, balance: 7 },
  medical: { total: 12, used: 1, balance: 11 },
  casual: { total: 12, used: 2, balance: 10 },
  other: { total: 5, used: 0, balance: 5 },
});
```

**Issue:** Even though there's a `fetchBalanceData()` function that calls `getLeaveBalance()`, it:
1. Transforms data incorrectly (lines 170-186)
2. Doesn't properly map backend leave types to UI types
3. Uses wrong key names (`annual`, `medical`, `casual`, `other`) instead of backend types (`earned`, `sick`, `casual`)

**Expected Behavior:**
- Fetch real balances from `/api/leaves/balance`
- Map backend types to frontend display correctly
- Show actual used/remaining leaves for current user

### 3.3 🔴 CRITICAL: Admin Stats Are Fake Values

**File:** `react/src/feature-module/hrm/attendance/leaves/leaveAdmin.tsx`

**Issue:** Stats calculations use fake logic (lines 671-677):

```typescript
// ❌ FAKE STATS CALCULATION
const stats = {
  totalPresent: leaves.length > 0 ? leaves.length + 165 : 180,  // Magic number 165!
  plannedLeaves: leaves.filter(l => l.leaveType === 'casual' || l.leaveType === 'earned').length,
  unplannedLeaves: leaves.filter(l => l.leaveType === 'sick').length,
  pendingRequests: leaves.filter(l => l.status === 'pending').length,
};
```

**Issues:**
- `totalPresent` adds a magic number 165 - completely fake
- `plannedLeaves` only counts casual/earned (should be configured)
- `unplannedLeaves` only counts sick (incomplete logic)
- No real calculation of present employees vs total employees

**Expected Behavior:**
- Calculate actual present employees from attendance data
- Fetch real employee count from company
- Calculate planned/unplanned based on leave type settings

### 3.4 ⚠️ HIGH: "Add Leave" Button Should Be "Apply Leave"

**File:** `react/src/feature-module/hrm/attendance/leaves/leaveEmployee.tsx`

**Issue:** Line 542 shows "Add Leave" button which should be "Apply Leave" for employee perspective:

```typescript
<Link
  to="#"
  data-bs-toggle="modal"
  data-inert={true}
  data-bs-target="#add_leaves"
  className="btn btn-primary d-flex align-items-center"
>
  <i className="ti ti-circle-plus me-2" />
  Add Leave  {/* ❌ Should be "Apply Leave" */}
</Link>
```

### 3.5 ⚠️ HIGH: Reporting Manager Notification Flow

**Issue Analysis:** The leave approval workflow EXISTS in backend but has gaps:

**Backend Implementation (✅ WORKS):**
- `createLeave()` stores `reportingManagerId` in leave document
- `approveLeave()` allows manager to approve leaves
- `managerActionLeave()` handles manager approval/rejection
- Socket.IO events broadcast updates

**Frontend Issues (❌ INCOMPLETE):**
1. No validation that reporting manager is assigned
2. No fallback to HR when no reporting manager exists
3. No visible notification that request was sent to manager
4. No "Apply Leave" terminology change

**Current Flow:**
```
Employee ──► Creates Leave ──► reportingManagerId stored ──► Manager approves
                              │
                              └──► No HR fallback implemented
```

**Expected Flow:**
```
Employee ──► Apply Leave ──► Has Reporting Manager?
                              │
                    YES ──────┴─────── NO
                      │                │
                      ▼                ▼
               Notify Manager      Notify HR
                      │                │
                      └────────┬───────┘
                               ▼
                         Manager/HR Approves
                               │
                               ▼
                         Update Balance
```

---

## 4. REAL-WORLD VS IMPLEMENTATION COMPARISON

### 4.1 Leave Balance Calculation

| Aspect | Real-World Standard | Current Implementation | Gap |
|--------|-------------------|----------------------|-----|
| Balance Storage | Per employee per leave type | ✅ In Employee.leaveBalances | None |
| Balance Updates | On approval, automatic | ✅ Works in approveLeave() | None |
| Balance Display | Real-time from DB | ❌ Hardcoded UI values | CRITICAL |
| Carry Forward | Configurable per type | ✅ In LeaveType schema | UI missing |
| Accrual | Monthly/Yearly | ✅ In LeaveType schema | UI missing |

### 4.2 Leave Application Workflow

| Step | Real-World | Current | Status |
|------|-----------|---------|--------|
| 1. Employee selects dates | ✅ | ✅ | Works |
| 2. Select leave type | ✅ | ✅ | Works |
| 3. Select manager (or auto-assign) | ✅ | ⚠️ Manual only | Partial |
| 4. Check balance availability | ✅ | ❌ Not validated | Missing |
| 5. Submit request | ✅ | ✅ | Works |
| 6. Notify manager | ✅ | ❌ Socket only | Partial |
| 7. Manager approves/rejects | ✅ | ✅ | Works |
| 8. Update balance | ✅ | ✅ | Works |
| 9. Notify employee | ✅ | ✅ | Works (Socket) |

### 4.3 Leave Settings Management

| Feature | Real-World | Current | Status |
|---------|-----------|---------|--------|
| Define leave types | ✅ | ✅ | Works (separate page) |
| Set annual quota | ✅ | ✅ | Works |
| Configure carry forward | ✅ | ❌ | Not in UI |
| Assign to departments | ✅ | ❌ | Not implemented |
| Set approval workflow | ✅ | ❌ | Not implemented |
| View employee balances | ✅ | ❌ | Not in settings page |

---

## 5. DETAILED PAGE ANALYSIS

### 5.1 Leave Settings Page (`/leave-settings`)

**File:** `react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx`

**Current State:**
- ❌ Completely static/hardcoded
- ❌ No API integration
- ❌ No state management for leave types
- ❌ No save functionality
- ❌ PickList for employee assignment is non-functional

**Issues:**
1. Leave types are hardcoded (should fetch from API)
2. Employee lists are hardcoded (should fetch from API)
3. No form submission handler
4. No state synchronization with database

**Required Changes:**
1. Create `useLeaveSettings.ts` hook for data management
2. Fetch active leave types from `/api/leave-types/active`
3. Fetch employees from `/api/employees`
4. Implement save handler to update leave type configurations
5. Replace hardcoded PickList with functional component

### 5.2 Leave Employee Page (`/leaves-employee`)

**File:** `react/src/feature-module/hrm/attendance/leaves/leaveEmployee.tsx`

**Current State:**
- ✅ Fetches user's own leaves correctly
- ✅ Cancel leave works
- ✅ Edit modal exists (though disabled for pending)
- ❌ Balance display is hardcoded
- ❌ Wrong mapping between backend and frontend types
- ❌ "Add Leave" button instead of "Apply Leave"

**Type Mapping Issue:**
```typescript
// Backend types:      sick, casual, earned, maternity, paternity, ...
// Frontend displays:  medical, casual, annual, ...
// Frontend keys:      medical, casual, annual, other  ← WRONG!

// Should be:
const balances = {
  sick: { total: ..., used: ..., balance: ... },
  casual: { total: ..., used: ..., balance: ... },
  earned: { total: ..., used: ..., balance: ... },
  // etc.
};
```

### 5.3 Leave Admin Page (`/leaves`)

**File:** `react/src/feature-module/hrm/attendance/leaves/leaveAdmin.tsx`

**Current State:**
- ✅ Fetches all leaves with pagination
- ✅ Filter by status and leave type
- ✅ Approve/Reject functionality works
- ❌ Stats use magic numbers
- ❌ No actual employee count integration

**Stats Calculation Issues:**
```typescript
// Current (WRONG):
totalPresent: leaves.length > 0 ? leaves.length + 165 : 180

// Should be:
totalPresent: totalEmployees - (onLeaveToday + approvedLeavesToday)
```

### 5.4 Leave Type Management (`/settings/app-settings/leave-type`)

**File:** `react/src/feature-module/settings/appSettings/leave-type.tsx`

**Current State:** (Not fully analyzed but based on controller)
- ✅ CRUD operations available
- ✅ Leave type schema is comprehensive
- ⚠️ Need to verify UI integration

---

## 6. BACKEND ANALYSIS

### 6.1 Leave Schema (`backend/models/leave/leave.schema.js`)

**Strengths:**
- ✅ Comprehensive field set
- ✅ Multi-status workflow (employeeStatus, managerStatus, hrStatus, finalStatus)
- ✅ Attachment support
- ✅ Handover functionality
- ✅ Audit trail (createdBy, updatedBy, etc.)
- ✅ Soft delete support
- ✅ Compound indexes for performance

**Leave Status Flow:**
```
pending ──► approved ──► (balance deducted)
   │
   ├──► rejected ────► (no balance change)
   │
   └──► cancelled ───► (balance restored if approved)
```

### 6.2 Leave Controller (`backend/controllers/rest/leave.controller.js`)

**Strengths:**
- ✅ Multi-tenant architecture with `getTenantCollections()`
- ✅ Role-based visibility (employee, manager, hr, admin, superadmin)
- ✅ Proper error handling
- ✅ Transaction support for atomic operations
- ✅ Overlap checking for leave requests
- ✅ Balance updates on approval
- ✅ Balance restoration on cancellation
- ✅ Socket.IO broadcasting for real-time updates

**API Endpoints:**
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/leaves` | Get all leaves (admin/hr) | ✅ |
| GET | `/api/leaves/my` | Get current user leaves | ✅ |
| GET | `/api/leaves/balance` | Get leave balance | ✅ |
| POST | `/api/leaves` | Create leave request | ✅ |
| PUT | `/api/leaves/:id` | Update leave | ✅ |
| DELETE | `/api/leaves/:id` | Delete leave (soft) | ✅ |
| POST | `/api/leaves/:id/approve` | Approve leave | ✅ |
| POST | `/api/leaves/:id/reject` | Reject leave | ✅ |
| PATCH | `/api/leaves/:id/manager-action` | Manager action | ✅ |
| POST | `/api/leaves/:id/cancel` | Cancel leave | ✅ |

### 6.3 Leave Type Schema (`backend/models/leave/leaveType.schema.js`)

**Strengths:**
- ✅ Comprehensive configuration options
- ✅ Annual quota configuration
- ✅ Carry forward settings
- ✅ Encashment configuration
- ✅ Accrual rules
- ✅ Restriction configuration
- ✅ Display settings (color, icon)

**Available Configuration:**
```javascript
{
  name: "Casual Leave",
  code: "CASUAL",
  annualQuota: 10,
  isPaid: true,
  requiresApproval: true,
  carryForwardAllowed: true,
  maxCarryForwardDays: 3,
  encashmentAllowed: false,
  minNoticeDays: 1,
  maxConsecutiveDays: 5,
  requiresDocument: false
}
```

### 6.4 Employee Schema Leave Balances

**Location:** `backend/models/employee/employee.schema.js` (lines 152-188)

**Structure:**
```javascript
leaveBalances: [
  {
    type: 'casual',    // Leave type code
    total: 10,         // Total allocated
    used: 2,           // Already used
    balance: 8         // Remaining (total - used)
  },
  // ... more types
]
```

**Default Initialization:**
```javascript
// Default balances when new employee is created
[
  { type: 'casual', total: 10, used: 0, balance: 10 },
  { type: 'sick', total: 10, used: 0, balance: 10 },
  { type: 'earned', total: 15, used: 0, balance: 15 },
  { type: 'compensatory', total: 2, used: 0, balance: 2 }
]
```

---

## 7. RECOMMENDATIONS & IMPLEMENTATION PLAN

### 7.1 Priority 1: Fix Leave Balance Display (CRITICAL)

**Files to Modify:**
1. `react/src/feature-module/hrm/attendance/leaves/leaveEmployee.tsx`

**Changes Required:**
```typescript
// BEFORE (hardcoded):
const [balances, setBalances] = useState({
  annual: { total: 12, used: 5, balance: 7 },
  medical: { total: 12, used: 1, balance: 11 },
  casual: { total: 12, used: 2, balance: 10 },
  other: { total: 5, used: 0, balance: 5 },
});

// AFTER (from API):
const [balances, setBalances] = useState({
  sick: { total: 0, used: 0, balance: 0 },
  casual: { total: 0, used: 0, balance: 0 },
  earned: { total: 0, used: 0, balance: 0 },
  maternity: { total: 0, used: 0, balance: 0 },
  paternity: { total: 0, used: 0, balance: 0 },
  bereavement: { total: 0, used: 0, balance: 0 },
  compensatory: { total: 0, used: 0, balance: 0 },
  unpaid: { total: 0, used: 0, balance: 0 },
  special: { total: 0, used: 0, balance: 0 },
});

// Update fetchBalanceData to properly map API response:
const fetchBalanceData = async () => {
  const balanceData = await getLeaveBalance();
  if (balanceData && typeof balanceData === 'object') {
    setBalances(balanceData); // Direct assignment
  }
};
```

**Update UI to use correct display names:**
```typescript
// Map backend types to display names
const balanceDisplayConfig = [
  { key: 'earned', label: 'Annual Leaves', icon: 'ti ti-calendar-event', color: 'black' },
  { key: 'sick', label: 'Medical Leaves', icon: 'ti ti-vaccine', color: 'blue' },
  { key: 'casual', label: 'Casual Leaves', icon: 'ti ti-hexagon-letter-c', color: 'purple' },
  { key: 'maternity', label: 'Maternity Leaves', icon: 'ti ti-baby-carriage', color: 'pink' },
  { key: 'paternity', label: 'Paternity Leaves', icon: 'ti ti-user', color: 'info' },
  { key: 'bereavement', label: 'Bereavement Leaves', icon: 'ti ti-heart-broken', color: 'secondary' },
  { key: 'compensatory', label: 'Compensatory Off', icon: 'ti ti-calendar-time', color: 'warning' },
  { key: 'unpaid', label: 'Unpaid Leaves', icon: 'ti ti-money-off', color: 'danger' },
  { key: 'special', label: 'Special Leaves', icon: 'ti ti-star', color: 'info' },
];

// Render dynamically:
{balanceDisplayConfig.map(config => {
  const balance = balances[config.key];
  return balance ? (
    <div className="col-xl-3 col-md-6">
      <div className={`card bg-${config.color}-le`}>
        {/* ... display balance.total, balance.used, balance.balance ... */}
      </div>
    </div>
  ) : null;
})}
```

### 7.2 Priority 2: Implement Leave Settings Page

**New File:** `react/src/hooks/useLeaveSettings.ts`

```typescript
import { useState, useEffect } from 'react';
import { get, post, put, del } from '../services/api';

export interface LeaveSettings {
  leaveTypes: LeaveType[];
  employeeAssignments: EmployeeAssignment[];
}

export const useLeaveSettings = () => {
  const [settings, setSettings] = useState<LeaveSettings>({
    leaveTypes: [],
    employeeAssignments: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    // Fetch active leave types
    const leaveTypesResponse = await get('/leave-types/active');
    // Fetch employees with their leave balances
    const employeesResponse = await get('/employees');

    setSettings({
      leaveTypes: leaveTypesResponse.data,
      employeeAssignments: employeesResponse.data,
    });
    setLoading(false);
  };

  const updateLeaveType = async (leaveTypeId: string, updates: any) => {
    await put(`/leave-types/${leaveTypeId}`, updates);
    await fetchSettings(); // Refresh
  };

  const updateEmployeeBalances = async (employeeId: string, balances: any[]) => {
    await put(`/employees/${employeeId}`, { leaveBalances: balances });
    await fetchSettings(); // Refresh
  };

  return { settings, loading, fetchSettings, updateLeaveType, updateEmployeeBalances };
};
```

**Update:** `react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx`

- Replace hardcoded data with API calls
- Implement save handlers
- Add form validation
- Connect to real database

### 7.3 Priority 3: Fix Admin Stats Calculation

**File:** `react/src/feature-module/hrm/attendance/leaves/leaveAdmin.tsx`

**Current (lines 671-677):**
```typescript
const stats = {
  totalPresent: leaves.length > 0 ? leaves.length + 165 : 180,
  plannedLeaves: leaves.filter(l => l.leaveType === 'casual' || l.leaveType === 'earned').length,
  unplannedLeaves: leaves.filter(l => l.leaveType === 'sick').length,
  pendingRequests: leaves.filter(l => l.status === 'pending').length,
};
```

**Should Be:**
```typescript
// Fetch from stats endpoint or calculate properly
const stats = {
  totalPresent: await fetchTotalPresentEmployees(),  // New API or calculate
  plannedLeaves: await fetchPlannedLeavesCount(),    // Based on leave type settings
  unplannedLeaves: await fetchUnplannedLeavesCount(), // Based on leave type settings
  pendingRequests: leaves.filter(l => l.status === 'pending').length,
};

// OR create a new stats endpoint:
// GET /api/leaves/stats?period=today
// Returns: { totalPresent, plannedLeaves, unplannedLeaves, pendingRequests }
```

### 7.4 Priority 4: Update Button Text & Notifications

1. **Change "Add Leave" to "Apply Leave"**
   - File: `leaveEmployee.tsx`, line 542
   - Also update modal title from "Add Leave" to "Apply Leave"

2. **Add Notification When Leave Submitted**
   - Show success message indicating who received the request
   - Example: "Leave request sent to [Manager Name] for approval"

3. **Add Fallback to HR**
   - Check if employee has reporting manager
   - If no reporting manager, route to HR automatically
   - Update notification accordingly

### 7.5 Priority 5: Backend Enhancements (Optional)

**New Endpoint:** `GET /api/leaves/stats`

```javascript
/**
 * @desc    Get leave statistics for dashboard
 * @route   GET /api/leaves/stats
 * @query   period: 'today' | 'week' | 'month' | 'year'
 * @access  Private (Admin, HR, Superadmin)
 */
export const getLeaveStats = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const user = extractUser(req);

  // Calculate date range based on period
  const startDate = getPeriodStart(period);
  const endDate = new Date();

  // Get total employees in company
  const totalEmployees = await collections.employees.countDocuments({
    companyId: user.companyId,
    employmentStatus: 'Active'
  });

  // Get leaves in period
  const leavesInPeriod = await collections.leaves.find({
    companyId: user.companyId,
    startDate: { $gte: startDate, $lte: endDate },
    status: 'approved'
  }).toArray();

  // Calculate stats
  const stats = {
    totalEmployees,
    totalPresent: totalEmployees - countOnLeave(leavesInPeriod, new Date()),
    plannedLeaves: countByLeaveTypes(leavesInPeriod, plannedTypes),
    unplannedLeaves: countByLeaveTypes(leavesInPeriod, unplannedTypes),
    pendingRequests: await countPendingLeaves(collections, user.companyId),
  };

  return sendSuccess(res, stats);
});
```

---

## 8. TESTING CHECKLIST

### 8.1 Frontend Tests
- [ ] Leave balance displays correct values from API
- [ ] "Apply Leave" button shows correct text
- [ ] Leave application shows proper manager/HR notification
- [ ] Leave Settings page loads real leave types
- [ ] Leave Settings can save changes to database
- [ ] Admin stats show real calculated values

### 8.2 Backend Tests
- [ ] Leave balance API returns correct employee balances
- [ ] Leave approval correctly deducts balance
- [ ] Leave rejection does NOT deduct balance
- [ ] Leave cancellation restores balance
- [ ] Manager can only approve their reportees
- [ ] HR can approve any department leave
- [ ] Admin can approve any leave

### 8.3 Integration Tests
- [ ] Leave applied → Balance checked → Request created
- [ ] Manager approves → Balance updated → Employee notified
- [ ] No manager → Routes to HR → HR approves
- [ ] Settings updated → Employee balances reflected

---

## 9. SUMMARY OF FILES TO MODIFY

### Priority 1 (Critical)
1. **`react/src/feature-module/hrm/attendance/leaves/leaveEmployee.tsx`**
   - Fix hardcoded balance initialization
   - Update balance fetching and mapping
   - Change "Add Leave" to "Apply Leave"
   - Fix balance display mapping

2. **`react/src/feature-module/hrm/attendance/leaves/leaveAdmin.tsx`**
   - Remove fake stats calculation
   - Add real stats API call

3. **`react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx`**
   - Replace all hardcoded data
   - Add API integration
   - Implement save functionality

### Priority 2 (High)
4. **`react/src/hooks/useLeaveREST.ts`**
   - Fix balance transformation in `getLeaveBalance()`

5. **`backend/controllers/rest/leave.controller.js`**
   - Add `/stats` endpoint for dashboard data

### Priority 3 (Medium)
6. **`react/src/core/data/json/sidebarMenu.jsx`**
   - Ensure leave pages are properly linked for all roles

---

## 10. CONCLUSION

### Critical Issues Summary:
1. 🔴 Leave Settings page is completely non-functional (hardcoded data)
2. 🔴 Leave balances show hardcoded values instead of real data
3. 🔴 Admin dashboard stats use fake values
4. ⚠️ "Add Leave" should be "Apply Leave"
5. ⚠️ No HR fallback when no reporting manager exists

### Backend Status: ✅ **GOOD**
- Solid architecture
- Proper leave workflow
- Balance management works
- Multi-tenant support

### Frontend Status: ⚠️ **NEEDS WORK**
- Leave requests work
- Approval workflow works
- Data display needs fixing
- Settings page needs complete rewrite

### Estimated Fix Time:
- Priority 1: 4-6 hours
- Priority 2: 2-3 hours
- Priority 3: 1-2 hours
- **Total: 7-11 hours**

---

*End of Report*
