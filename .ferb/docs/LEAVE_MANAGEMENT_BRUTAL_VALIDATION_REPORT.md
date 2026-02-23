# Leave Management System - Brutal Validation Report

**Date:** 2026-02-22
**Status:** CRITICAL ISSUES FOUND
**Version:** Full System Analysis

---

## Executive Summary

A comprehensive validation of the entire Leave Management System was performed covering:
- Frontend Components & Hooks
- Backend REST Controllers & Services
- Socket.IO Architecture
- Database Schemas & Collections
- Security & Authentication
- Data Flow & Logic

**Key Finding:** The system has been **partially migrated** from Socket.IO to REST API, creating an **inconsistent architecture** with multiple critical issues.

---

## Table of Contents

1. [Architecture Issues](#1-architecture-issues)
2. [Frontend Issues](#2-frontend-issues)
3. [Backend Issues](#3-backend-issues)
4. [Database Issues](#4-database-issues)
5. [Security Issues](#5-security-issues)
6. [Logic & Data Flow Issues](#6-logic--data-flow-issues)
7. [Socket.IO vs REST Duplication](#7-socketio-vs-rest-duplication)
8. [Implementation Plan](#8-implementation-plan)

---

## 1. Architecture Issues

### 1.1 ⚠️ Mixed Socket.IO + REST Architecture (CRITICAL)

**Location:** Entire system

**Issue:** The leave management system is in a **partial migration state**:
- Frontend: Uses REST API via `useLeaveREST.ts` hook
- Backend: Has REST controllers + Socket.IO handlers
- Real-time updates: Uses Socket.IO broadcasts from REST controllers

**Impact:**
- Code duplication between Socket.IO and REST
- Confusing data flow
- Hard to maintain and debug
- Potential for inconsistent behavior

**Files Affected:**
- `react/src/hooks/useLeaveREST.ts` - Frontend REST hook
- `backend/controllers/rest/leave.controller.js` - REST controller (1840 lines)
- `backend/socket/router.js` - Socket router (NO leave handlers)

### 1.2 ⚠️ Socket Router Missing Leave Handlers

**Location:** [backend/socket/router.js](backend/socket/router.js)

**Issue:** The socket router has **NO leave-specific handlers** configured for any role:
- `superadmin` - No leave controller
- `admin` - No leave controller
- `hr` - No leave controller
- `manager` - No leave controller
- `employee` - No leave controller

**Impact:**
- Socket.IO leave events are broadcasted but NOT handled on the client side
- Real-time updates work only because frontend hooks listen to broadcasts from REST controllers

---

## 2. Frontend Issues

### 2.1 ❌ Hardcoded Leave Type Values

**Location:** `react/src/hooks/useLeaveREST.ts:92-102`

```typescript
export const leaveTypeDisplayMap: Record<string, string> = {
  sick: 'Medical Leave',
  casual: 'Casual Leave',
  earned: 'Annual Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  bereavement: 'Bereavement Leave',
  compensatory: 'Compensatory Off',
  unpaid: 'Unpaid Leave',
  special: 'Special Leave',
};
```

**Issue:** Leave types are hardcoded instead of being fetched from the database.

**Impact:**
- New leave types added to database won't appear in frontend
- Custom leave types not supported
- Display names don't match database

### 2.2 ❌ Inconsistent Leave Type Mapping

**Location:** `react/src/hooks/useLeaveREST.ts`

**Issue:** Multiple leave type mappings exist that might not align:
- `leaveTypeDisplayMap` - For display (lowercase keys)
- `leaveTypeToBackendMap` - For API calls (display name to code)
- Database stores: `EARNED`, `SICK`, `CASUAL` (UPPERCASE)
- Ledger stores: `earned`, `sick`, `casual` (lowercase)

**Impact:** Leave type mismatch between frontend and backend

### 2.3 ⚠️ Missing Employee ID in Frontend Auth Context

**Location:** `react/src/hooks/useAuth.ts`

**Issue:** The `useAuth` hook provides `userId` (Clerk ID) but NOT `employeeId` (database ID).

**Impact:**
- Components cannot access the employee's database ID directly
- Must make API calls to get employee ID for database operations

### 2.4 ⚠️ Cancel Leave Using Wrong API Method

**Location:** `react/src/hooks/useLeaveREST.ts:425-451`

```typescript
const cancelLeave = useCallback(async (leaveId: string, reason?: string): Promise<boolean> => {
  // ...
  const response: ApiResponse<Leave> = await put(`/leaves/${leaveId}`, {
    status: 'cancelled',
    cancellationReason: reason,
  });
```

**Issue:** Using `PUT /leaves/:id` to cancel, but backend has `POST /leaves/:id/cancel` with proper balance restoration logic.

**Impact:** Cancelled leaves don't restore balance properly!

---

## 3. Backend Issues

### 3.1 ⚠️ leaveBalances vs leaveBalance Naming Inconsistency

**Location:** Multiple files

**Issue:** Two different field names used for employee leave balance:
- `employee.leaveBalances` - Used in `leave.controller.js:116, 959, 970`
- `employee.leaveBalance` - Used in `leaveLedger.service.js:149, 348-352`

**Examples:**

```javascript
// leave.controller.js line 116
const balanceInfo = employee.leaveBalances.find(b => b.type === leaveType);

// leaveLedger.service.js line 149
const employeeBalance = employee?.leaveBalance?.balances?.find(b => b.type === type);
```

**Impact:**
- Code queries wrong field
- Returns undefined/empty results
- Balance calculations fail

### 3.2 ❌ Custom Policy Service Uses Wrong Database

**Location:** [backend/controllers/rest/leave.controller.js:100-113](backend/controllers/rest/leave.controller.js#L100-L113)

```javascript
// Check for custom policy if companyId is provided
let customPolicy = null;
if (companyId) {
  try {
    // Custom policy is in main database (AmasQIS), not company database
    const { db } = require('../../config/db.js');
    const CustomLeavePolicy = (await import('../../models/leave/customLeavePolicy.schema.js')).default;

    customPolicy = await CustomLeavePolicy.getEmployeePolicy(companyId, employeeId, leaveType);
```

**Issue:**
- Uses Mongoose model which connects to DEFAULT database
- Custom policies should be in company-specific database using native driver
- Already fixed in `customLeavePolicy.service.js` but NOT here

### 3.3 ❌ getEmployeeByClerkId Inefficient

**Location:** [backend/controllers/rest/leave.controller.js:152-157](backend/controllers/rest/leave.controller.js#L152-L157)

```javascript
async function getEmployeeByClerkId(collections, clerkUserId) {
  return await collections.employees.findOne({
    clerkUserId: clerkUserId,  // ❌ Clerk ID, not employeeId
    isDeleted: { $ne: true }
  });
}
```

**Issue:**
- Looks up employees by `clerkUserId` (Clerk's user ID)
- But employees are identified by `employeeId` (EMP-XXXX format) in business logic
- The `clerkUserId` field might not be populated on employee documents

**Impact:** Employee lookups fail, returning null

### 3.4 ⚠️ Cancel Leave Balance Restoration Issues

**Location:** [backend/controllers/rest/leave.controller.js:1343-1371](backend/controllers/rest/leave.controller.js#L1343-L1371)

```javascript
// Restore balance if leave was previously approved
if (leave.status === 'approved') {
  const employee = await collections.employees.findOne({
    employeeId: leave.employeeId
  });

  if (employee && employee.leaveBalances) {
    const balanceIndex = employee.leaveBalances.findIndex(
      b => b.type === leave.leaveType
    );

    if (balanceIndex !== -1) {
      // Restore the deducted balance
      employee.leaveBalances[balanceIndex].used -= leave.duration;
      employee.leaveBalances[balanceIndex].balance += leave.duration;

      await collections.employees.updateOne(
        { employeeId: leave.employeeId },
        { $set: { leaveBalances: employee.leaveBalances } }  // ❌ Uses leaveBalances
      );
```

**Issue:**
- Uses `leaveBalances` but rest of system uses `leaveBalance.balances`
- No ledger entry created for balance restoration
- No transaction record

### 3.5 ⚠️ Duplicate Transaction Logic

**Location:** Multiple controller functions

**Issue:** Same logic repeated across:
- `approveLeave` (lines 864-1004)
- `managerActionLeave` (lines 1127-1268) - duplicates approve/reject logic
- `rejectLeave` (lines 1011-1120)

**Impact:** Code duplication, maintenance burden, potential bugs

---

## 4. Database Issues

### 4.1 ⚠️ Field Name Inconsistencies in Schema

**Location:** [backend/models/leave/leave.schema.js](backend/models/leave/leave.schema.js)

**Issue:** Multiple date fields for same concept:
- `startDate` AND `fromDate` (lines 53-66)
- `endDate` AND `toDate` (lines 68-81)

Both fields stored, creating confusion about which to use.

### 4.2 ❌ Deprecated Fields Still in Schema

**Location:** [backend/models/leave/leave.schema.js:146-180](backend/models/leave/leave.schema.js#L146-L180)

```javascript
// ========== DEPRECATED FIELDS (kept for backward compatibility) ==========
// These fields are no longer used for approval logic
// All approval decisions now use only `status` + `isHRFallback`

employeeStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
managerStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
hrStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
finalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
```

**Issue:** Deprecated fields maintained in schema AND controller responses via `normalizeLeaveStatuses()`.

**Impact:** Schema bloat, confusion about which fields to use

### 4.3 ⚠️ Employee Schema Balance Field Naming

**Location:** `employees` collection (implied from usage)

**Issue:** Two different field names referenced:
- `leaveBalances` - Array in employee document
- `leaveBalance.balances` - Nested object in employee document

**Need to verify:** Which one actually exists in the database?

---

## 5. Security Issues

### 5.1 ✅ Authentication Properly Implemented

**Location:** [backend/middleware/auth.js](backend/middleware/auth.js)

**Status:** CORRECT

- JWT token verification using Clerk
- Role-based access control
- Multi-tenant isolation via `companyId`
- Rate limiting implemented (though disabled in dev mode)

### 5.2 ⚠️ Clerk Metadata Dependency

**Location:** Authentication middleware & socket handler

**Issue:** System depends on `employeeId` in Clerk `publicMetadata`:
- If missing from Clerk, database lookups fail
- No fallback mechanism to query employee by Clerk ID then get employeeId

**Impact:** Users with incomplete metadata cannot access their data

### 5.3 ✅ SQL Injection Protection

**Status:** CORRECT
- Uses MongoDB parameterized queries
- No raw SQL

### 5.4 ⚠️ Authorization Inconsistencies

**Location:** Multiple controller functions

**Issue:** Role checking logic varies:
- Some check `user.role === 'employee'` (case-sensitive)
- Some check `user.role?.toLowerCase() === 'employee'` (case-insensitive)
- Some check arrays: `['admin', 'hr', 'superadmin'].includes(user.role)`

**Impact:** Inconsistent behavior, potential authorization bypass

---

## 6. Logic & Data Flow Issues

### 6.1 ❌ Balance Calculation Not Using Ledger

**Location:** [backend/controllers/rest/leave.controller.js:477](backend/controllers/rest/leave.controller.js#L477)

```javascript
const currentBalance = await getEmployeeLeaveBalance(collections, employee.employeeId, leaveData.leaveType, user.companyId);
```

**Issue:** `getEmployeeLeaveBalance` checks `employee.leaveBalances` but doesn't check `leaveLedger` collection for accurate balance.

**Impact:** Balance might not reflect actual transaction history

### 6.2 ⚠️ Ledger Entries Not Created on Approval

**Location:** [backend/controllers/rest/leave.controller.js:950-976](backend/controllers/rest/leave.controller.js#L950-L976)

**Issue:** When leave is approved:
- Employee `leaveBalances` updated ✅
- No entry created in `leaveLedger` collection ❌

**Impact:**
- Ledger doesn't show approval transactions
- Balance history incomplete

### 6.3 ❌ Cancel Leave Doesn't Create Ledger Entry

**Location:** [backend/controllers/rest/leave.controller.js:1343-1371](backend/controllers/rest/leave.controller.js#L1343-L1371)

**Issue:** Balance restoration doesn't create ledger entry with `transactionType: 'restored'`

**Impact:** Audit trail incomplete

### 6.4 ⚠️ No Ledger Entry for Leave Creation

**Issue:** When leave is created, no ledger entry for "pending deduction"

**Impact:** Can't track pending leave impact on balance

---

## 7. Socket.IO vs REST Duplication

### 7.1 Architecture Comparison

| Aspect | Socket.IO | REST API |
|--------|-----------|----------|
| **Leave Creation** | Not implemented | ✅ POST /api/leaves |
| **Leave Approval** | Not implemented | ✅ POST /api/leaves/:id/approve |
| **Leave Rejection** | Not implemented | ✅ POST /api/leaves/:id/reject |
| **Leave Cancellation** | Not implemented | ✅ POST /api/leaves/:id/cancel |
| **Balance Query** | Not implemented | ✅ GET /api/leaves/balance |
| **Real-time Updates** | ✅ Broadcast events | ✅ From REST controllers |

### 7.2 Current Data Flow

```
Frontend Component
    ↓ (REST API call)
REST Controller (leave.controller.js)
    ↓ (business logic)
Database Update
    ↓ (broadcast event)
Socket.IO (io.emit)
    ↓ (real-time push)
Frontend Socket Listener (useLeaveREST.ts)
    ↓ (update state)
Component Re-render
```

**Analysis:** REST controllers emit Socket.IO events for real-time updates. This is actually a good pattern!

### 7.3 Socket Events Emitted

From REST controllers:
- `leave:created`
- `leave:updated`
- `leave:approved`
- `leave:rejected`
- `leave:cancelled`
- `leave:deleted`
- `leave:balance_updated`

**Status:** ✅ Correctly implemented

---

## 8. Implementation Plan

### Phase 1: CRITICAL FIXES (Immediate - Week 1)

#### 1.1 Fix Employee Balance Field Name
**Priority:** CRITICAL
**Files:**
- `backend/controllers/rest/leave.controller.js`
- `backend/services/leaves/leaveLedger.service.js`

**Action:** Standardize on ONE field name across entire system
- Audit database to confirm actual field name
- Update all code to use consistent field
- Add migration script if needed

#### 1.2 Fix Cancel Leave API Call
**Priority:** CRITICAL
**Files:**
- `react/src/hooks/useLeaveREST.ts`

**Action:** Change from PUT to POST:
```typescript
// FROM:
const response = await put(`/leaves/${leaveId}`, { status: 'cancelled' });

// TO:
const response = await post(`/leaves/${leaveId}/cancel`, { reason });
```

#### 1.3 Fix getEmployeeByClerkId Logic
**Priority:** CRITICAL
**Files:**
- `backend/controllers/rest/leave.controller.js`

**Action:** Update to query by actual employee ID:
```javascript
async function getEmployeeByClerkId(collections, clerkUserId) {
  // First try to get employeeId from metadata
  // Then query by employeeId
  // Fallback to clerkUserId if needed
}
```

#### 1.4 Fix Custom Policy Check
**Priority:** HIGH
**Files:**
- `backend/controllers/rest/leave.controller.js`

**Action:** Remove Mongoose import, use native driver service:
```javascript
import customLeavePolicyService from '../../services/leaves/customLeavePolicy.service.js';
// Use service instead of Mongoose model
```

---

### Phase 2: LEDGER INTEGRATION (Week 2-3)

#### 2.1 Create Ledger Entries on Approval
**Files:** `backend/controllers/rest/leave.controller.js:950-976`

**Action:** Add ledger entry creation after balance update:
```javascript
// After updating employee balance:
import leaveLedgerService from '../../services/leaves/leaveLedger.service.js';

await leaveLedgerService.recordLeaveUsage(
  user.companyId,
  leave.employeeId,
  leave.leaveType,
  leave.duration,
  leave._id.toString(),
  leave.startDate,
  leave.endDate,
  `Leave approved by ${currentEmployee.firstName}`
);
```

#### 2.2 Create Ledger Entry on Cancellation
**Files:** `backend/controllers/rest/leave.controller.js:1343-1371`

**Action:** Add ledger entry for balance restoration:
```javascript
await leaveLedgerService.recordLeaveRestoration(
  user.companyId,
  leave.employeeId,
  leave.leaveType,
  leave.duration,
  leave._id.toString(),
  'Leave cancelled - balance restored'
);
```

#### 2.3 Update Balance Calculation to Use Ledger
**Files:** `backend/services/leaves/leaveLedger.service.js`

**Action:** Modify `getBalanceSummary` to prioritize ledger over `employee.leaveBalances`:
```javascript
// Check ledger first, fall back to employee balance
const latestEntry = await getLatestEntry(leaveLedger, employeeId, type);
if (latestEntry) {
  return latestEntry.balanceAfter;
}
// Fall back to employee.leaveBalance.balances
```

---

### Phase 3: FRONTEND IMPROVEMENTS (Week 3-4)

#### 3.1 Dynamic Leave Types from Database
**Files:**
- `react/src/hooks/useLeaveREST.ts`
- `react/src/hooks/useLeaveTypesREST.ts` (already exists)

**Action:** Remove hardcoded leave types, fetch from API:
```typescript
const { activeOptions } = useLeaveTypesREST(); // Already exists!
// Use activeOptions instead of hardcoded map
```

#### 3.2 Add employeeId to Auth Context
**Files:** `react/src/hooks/useAuth.ts`

**Action:** Include employeeId in auth context from Clerk metadata

#### 3.3 Improve Error Handling
**Files:** All leave components

**Action:** Add specific error messages for each failure scenario

---

### Phase 4: CODE CLEANUP (Week 5)

#### 4.1 Remove Deprecated Fields
**Files:**
- `backend/models/leave/leave.schema.js`
- `backend/controllers/rest/leave.controller.js`

**Action:**
1. Add migration to populate `status` from deprecated fields
2. Remove deprecated fields from new documents
3. Update `normalizeLeaveStatuses` to be no-op
4. Eventually remove fields entirely

#### 4.2 Consolidate Duplicate Logic
**Files:** `backend/controllers/rest/leave.controller.js`

**Action:** Extract common approval/rejection logic into shared functions

#### 4.3 Standardize Authorization Checks
**Files:** All controllers

**Action:** Create helper function:
```javascript
function hasRole(user, ...roles) {
  return roles.some(r => r.toLowerCase() === user.role?.toLowerCase());
}
```

---

### Phase 5: TESTING & VALIDATION (Week 6)

#### 5.1 Unit Tests
- Balance calculation
- Ledger entry creation
- Custom policy application

#### 5.2 Integration Tests
- Leave request → approval → balance update flow
- Leave request → rejection flow
- Leave cancellation → balance restoration

#### 5.3 E2E Tests
- Employee creates leave
- Manager approves
- Balance updated in ledger
- Frontend shows correct balance

---

### Phase 6: DOCUMENTATION (Ongoing)

#### 6.1 API Documentation
- Document all REST endpoints
- Include request/response formats
- Document Socket.IO events

#### 6.2 Data Flow Diagrams
- Leave request flow
- Balance calculation flow
- Ledger transaction flow

#### 6.3 Deployment Guide
- Environment setup
- Database migrations
- Rollback procedures

---

## Summary of Critical Issues

| # | Issue | Severity | Impact | Phase |
|---|-------|----------|--------|-------|
| 1 | `leaveBalances` vs `leaveBalance.balances` | CRITICAL | Balance queries fail | 1 |
| 2 | Wrong cancel API method | CRITICAL | Balance not restored | 1 |
| 3 | `getEmployeeByClerkId` uses wrong field | CRITICAL | Employee lookup fails | 1 |
| 4 | Custom policy uses Mongoose | HIGH | Custom policies not found | 1 |
| 5 | No ledger entries on approval | HIGH | Audit trail incomplete | 2 |
| 6 | No ledger entries on cancellation | HIGH | Audit trail incomplete | 2 |
| 7 | Hardcoded leave types | MEDIUM | New types don't appear | 3 |
| 8 | Duplicate approval logic | LOW | Maintenance burden | 4 |

---

## Recommended Immediate Actions

1. **Audit database** to confirm employee balance field name
2. **Fix cancel leave** frontend to use correct API
3. **Restart backend server** to apply previous controller fixes
4. **Test with user session refresh** for updated Clerk metadata

---

**Generated:** 2026-02-22
**Author:** Claude Code
**Status:** Ready for Implementation
