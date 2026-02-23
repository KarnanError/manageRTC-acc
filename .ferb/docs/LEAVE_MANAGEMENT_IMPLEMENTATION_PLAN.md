# Leave Management System - Implementation Plan

**Based on:** Brutal Validation Report (2026-02-22)
**Timeline:** 6 Weeks
**Status:** Ready for Execution

---

## Quick Start - Fix Most Critical Issues (Today)

### Step 1: Audit Database Field Names

Run this script to determine the actual field name:

```bash
cd backend
node seed/diagnoseEmployeeBalanceField.js
```

### Step 2: Apply the Fix

Based on diagnostic results, update all code to use consistent field name.

### Step 3: Frontend Fix for Cancel Leave

**File:** `react/src/hooks/useLeaveREST.ts:425-451`

**Change:**
```typescript
// FROM (WRONG):
const response = await put(`/leaves/${leaveId}`, {
  status: 'cancelled',
  cancellationReason: reason,
});

// TO (CORRECT):
const response = await post(`/leaves/${leaveId}/cancel`, { reason });
```

### Step 4: Restart Backend & Test

```bash
# Stop backend, then:
cd backend
npm run dev

# In frontend:
# 1. Clear browser cache
# 2. Sign out and sign back in (refresh Clerk metadata)
# 3. Test leave ledger page
```

---

## Phase 1: Critical Fixes (Week 1)

### 1.1 Employee Balance Field Standardization

**Issue:** Two field names used inconsistently:
- `employee.leaveBalances` (array)
- `employee.leaveBalance.balances` (nested)

**Diagnosis Script:** `backend/seed/diagnoseEmployeeBalanceField.js`

```javascript
// Checks which field actually exists in employee documents
const sampleEmployee = await employees.findOne({});
console.log('Has leaveBalances:', !!sampleEmployee.leaveBalances);
console.log('Has leaveBalance.balances:', !!sampleEmployee.leaveBalance?.balances);
```

**Fix Locations:**
- `backend/controllers/rest/leave.controller.js` (5 occurrences)
- `backend/services/leaves/leaveLedger.service.js` (3 occurrences)

**Expected Outcome:** All code uses same field name

### 1.2 Cancel Leave API Fix

**Frontend File:** `react/src/hooks/useLeaveREST.ts:425-451`

```typescript
// Current (WRONG):
const cancelLeave = useCallback(async (leaveId: string, reason?: string) => {
  const response = await put(`/leaves/${leaveId}`, {
    status: 'cancelled',
    cancellationReason: reason,
  });
  // ...
});

// Fixed (CORRECT):
const cancelLeave = useCallback(async (leaveId: string, reason?: string) => {
  const response = await post(`/leaves/${leaveId}/cancel`, { reason });
  // ...
});
```

### 1.3 Employee Lookup Fix

**File:** `backend/controllers/rest/leave.controller.js:152-157`

```javascript
// Current (PROBLEMATIC):
async function getEmployeeByClerkId(collections, clerkUserId) {
  return await collections.employees.findOne({
    clerkUserId: clerkUserId,  // This field might not exist!
    isDeleted: { $ne: true }
  });
}

// Fixed:
async function getEmployeeByClerkId(collections, clerkUserId) {
  // Try multiple lookup strategies
  return await collections.employees.findOne({
    $or: [
      { clerkUserId: clerkUserId },
      { userId: clerkUserId }
    ],
    isDeleted: { $ne: true }
  });
}
```

### 1.4 Custom Policy Service Fix

**File:** `backend/controllers/rest/leave.controller.js:100-113`

```javascript
// Remove Mongoose import, use native service:
// Remove this:
const CustomLeavePolicy = (await import('../../models/leave/customLeavePolicy.schema.js')).default;
customPolicy = await CustomLeavePolicy.getEmployeePolicy(companyId, employeeId, leaveType);

// Use this instead:
import customLeavePolicyService from '../../services/leaves/customLeavePolicy.service.js';
customPolicy = await customLeavePolicyService.getEmployeePolicy(companyId, employeeId, leaveType);
```

---

## Phase 2: Ledger Integration (Week 2-3)

### 2.1 Ledger Entry on Leave Approval

**File:** `backend/controllers/rest/leave.controller.js:950-976`

**Add after balance update:**

```javascript
import leaveLedgerService from '../../services/leaves/leaveLedger.service.js';

// In approveLeave function, after employee balance update:
if (updatedLeaveBalances) {
  // Create ledger entry for used leave
  await leaveLedgerService.recordLeaveUsage(
    user.companyId,
    leave.employeeId,
    leave.leaveType,
    leave.duration,
    leave._id.toString(),
    leave.startDate,
    leave.endDate,
    `Leave approved by ${currentEmployee.firstName} ${currentEmployee.lastName}`
  );
}
```

### 2.2 Ledger Entry on Leave Cancellation

**File:** `backend/controllers/rest/leave.controller.js:1343-1371`

**Add during balance restoration:**

```javascript
// After restoring balance:
await leaveLedgerService.recordLeaveRestoration(
  user.companyId,
  leave.employeeId,
  leave.leaveType,
  leave.duration,
  leave._id.toString(),
  'Leave cancelled - balance restored'
);
```

### 2.3 Prioritize Ledger in Balance Calculation

**File:** `backend/services/leaves/leaveLedger.service.js:114-189`

**Modify `getBalanceSummary` function:**

```javascript
// For each leave type, check ledger FIRST
const latestEntry = await getLatestEntry(leaveLedger, employeeId, type);

// Use ledger balance if available, otherwise fall back to employee balance
const baseBalance = latestEntry ? latestEntry.balanceAfter : null;

const total = hasCustomPolicy ? customDays : (baseBalance ?? employeeBalance?.total ?? defaultQuota);
const used = employeeBalance?.used || 0;
const balance = hasCustomPolicy ? customDays : (baseBalance ?? employeeBalance?.balance ?? defaultQuota);
```

---

## Phase 3: Frontend Improvements (Week 3-4)

### 3.1 Remove Hardcoded Leave Types

**Files to Update:**
- `react/src/hooks/useLeaveREST.ts`
- All leave components

**Implementation:**

```typescript
// Remove hardcoded map:
export const leaveTypeDisplayMap: Record<string, string> = {
  sick: 'Medical Leave',
  // ... DELETE THIS
};

// Use database instead:
import { useLeaveTypesREST } from './useLeaveTypesREST';

const InComponent = () => {
  const { activeOptions } = useLeaveTypesREST();

  // activeOptions already has: { value: 'EARNED', label: 'Annual Leave' }
  // Convert to display map:
  const leaveTypeDisplayMap = useMemo(() => {
    return Object.fromEntries(
      activeOptions.map(opt => [opt.value.toLowerCase(), opt.label])
    );
  }, [activeOptions]);
};
```

### 3.2 Add employeeId to Auth Context

**File:** `react/src/hooks/useAuth.ts`

```typescript
export interface AuthUser {
  userId: string;
  companyId: string;
  employeeId?: string;  // ADD THIS
  role: string;
  email?: string;
}

// In the hook, extract from metadata:
const employeeId = user?.publicMetadata?.employeeId;
```

### 3.3 Improve Error Messages

**File:** `react/src/hooks/useLeaveREST.ts`

**Add specific error handling:**

```typescript
catch (err: any) {
  let errorMessage = err.response?.data?.error?.message || err.message;

  // Add context-specific messages
  if (err.response?.status === 403) {
    errorMessage = 'You do not have permission to perform this action';
  } else if (err.response?.status === 404) {
    errorMessage = 'Leave request not found. It may have been deleted';
  } else if (errorMessage.includes('overlap')) {
    errorMessage = 'You have overlapping leave requests for this period';
  }

  message.error(errorMessage);
  return false;
}
```

---

## Phase 4: Code Cleanup (Week 5)

### 4.1 Remove Deprecated Status Fields

**Migration Plan:**

1. **Week 5, Day 1:** Create migration script
2. **Week 5, Day 2:** Update all new documents to not include deprecated fields
3. **Week 5, Day 3:** Update `normalizeLeaveStatuses` to no-op
4. **Week 5, Day 4:** Remove from schema

**Migration Script:**

```javascript
// backend/seed/removeDeprecatedStatusFields.js
const result = await db.collection('leaves').updateMany(
  {
    $or: [
      { employeeStatus: { $exists: true } },
      { managerStatus: { $exists: true } },
      { hrStatus: { $exists: true } },
      { finalStatus: { $exists: true } }
    ]
  },
  {
    $unset: {
      employeeStatus: '',
      managerStatus: '',
      hrStatus: '',
      finalStatus: ''
    }
  }
);
```

### 4.2 Consolidate Approval Logic

**New File:** `backend/services/leaves/approvalHelper.service.js`

```javascript
export async function processApproval(collections, leave, approver, comments) {
  // Common approval logic
  // Update status
  // Update balance
  // Create ledger entry
  // Broadcast event
  // Return updated leave
}
```

**Update Controllers:**
- `approveLeave` - use helper
- `managerActionLeave` - use helper
- Remove duplicate code

### 4.3 Standardize Authorization

**New File:** `backend/middleware/authorization.js`

```javascript
export function hasRole(user, ...roles) {
  const normalizedRoles = roles.map(r => r?.toLowerCase());
  return normalizedRoles.includes(user?.role?.toLowerCase());
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!hasRole(req.user, ...roles)) {
      return res.status(403).json({
        error: `Requires one of: ${roles.join(', ')}`
      });
    }
    next();
  };
}
```

---

## Phase 5: Testing (Week 6)

### 5.1 Unit Test Structure

```
backend/tests/
├── unit/
│   ├── services/
│   │   ├── leaveLedger.service.test.js
│   │   ├── customLeavePolicy.service.test.js
│   │   └── approvalHelper.service.test.js
│   └── controllers/
│       └── leave.controller.test.js
```

### 5.2 Integration Test Scenarios

1. **Leave Request Flow:**
   - Create leave request
   - Verify ledger entry created (pending)
   - Approve leave
   - Verify balance deducted
   - Verify ledger entry created (used)

2. **Leave Cancellation Flow:**
   - Approve leave
   - Cancel leave
   - Verify balance restored
   - Verify ledger entry created (restored)

3. **Custom Policy Flow:**
   - Create custom policy
   - Create leave for covered employee
   - Verify custom days applied

### 5.3 E2E Test Scenarios

```
cypress/e2e/
├── leave-management/
│   ├── employee-creates-leave.cy.js
│   ├── manager-approves-leave.cy.js
│   ├── hr-views-leave-calendar.cy.js
│   └── ledger-shows-transactions.cy.js
```

---

## Phase 6: Documentation (Ongoing)

### 6.1 API Documentation

**Update Swagger/OpenAPI specs:**

```yaml
# backend/config/swagger.js

/leaves:
  get:
    summary: Get all leave requests
    tags: [Leaves]
    security: [BearerAuth]
    parameters:
      - name: status
        in: query
        schema:
          type: string
          enum: [pending, approved, rejected, cancelled]
```

### 6.2 Data Flow Diagrams

**Create diagrams in docs:**

```
docs/architecture/
├── leave-request-flow.md
├── balance-calculation-flow.md
└── ledger-transaction-flow.md
```

### 6.3 Deployment Runbook

**Create:** `docs/deployment/leave-management-deployment.md`

Contents:
- Environment variables checklist
- Database migration steps
- Rollback procedures
- Monitoring setup

---

## Validation Checklist

After each phase, run validation:

### Phase 1 Checklist
- [ ] Diagnostic script confirms field name
- [ ] All code uses consistent field name
- [ ] Cancel leave uses POST /cancel endpoint
- [ ] Employee lookup works with test user
- [ ] Custom policies load correctly

### Phase 2 Checklist
- [ ] Approval creates ledger entry
- [ ] Cancellation creates ledger entry
- [ ] Balance calculation prioritizes ledger
- [ ] Ledger history shows all transactions

### Phase 3 Checklist
- [ ] Leave types load from database
- [ ] New leave types appear in dropdown
- [ ] employeeId available in auth context
- [ ] Error messages are user-friendly

### Phase 4 Checklist
- [ ] No deprecated fields in new documents
- [ ] Approval/rejection logic consolidated
- [ ] Authorization helper used everywhere
- [ ] Code coverage > 80%

### Phase 5 Checklist
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] No console errors in tests

---

## Rollback Plan

If any phase causes issues:

1. **Revert code changes** (git reset)
2. **Rollback database** (if migration applied)
3. **Restart services**
4. **Document issue** for later analysis

**Emergency Rollback Command:**
```bash
# Revert to last known good commit
git checkout <last-known-good-commit>
npm install
npm run dev
```

---

## Success Metrics

### Before Implementation
- Leave ledger page: Not working for all roles
- Balance calculation: Inconsistent
- Custom policies: Not working
- Ledger entries: Missing

### After Implementation (Target)
- Leave ledger page: Works for all roles ✅
- Balance calculation: 100% accurate ✅
- Custom policies: Applied correctly ✅
- Ledger entries: Complete audit trail ✅
- Test coverage: > 80% ✅
- Response time: < 500ms ✅

---

**Generated:** 2026-02-22
**Author:** Claude Code
**Version:** 1.0
