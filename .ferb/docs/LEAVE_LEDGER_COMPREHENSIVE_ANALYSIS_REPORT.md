# Leave Ledger Page - Comprehensive Analysis Report

**Date**: 2026-02-22
**File**: [leaveLedger.tsx](react/src/feature-module/hrm/attendance/leaves/leaveLedger.tsx)
**Status**: Critical Issues Found

---

## Executive Summary

The Leave Ledger page has several critical issues that prevent it from displaying accurate leave balance information:

1. **Hardcoded leave types** instead of fetching from database
2. **Balance summary showing "0 / 0"** due to data transformation mismatch
3. **Hardcoded year filters** instead of dynamic generation
4. **Potential data source inconsistency** between employee balance and ledger

---

## Table of Contents

1. [Issues Found](#issues-found)
2. [Column Analysis](#column-analysis)
3. [Data Flow Analysis](#data-flow-analysis)
4. [Recommended Fixes](#recommended-fixes)
5. [Backend API Endpoints](#backend-api-endpoints)

---

## Issues Found

### 1. Hardcoded Leave Type Filter Options

**File**: [leaveLedger.tsx:93-100](react/src/feature-module/hrm/attendance/leaves/leaveLedger.tsx#L93-L100)

**Current Code**:
```typescript
const leaveTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'sick', label: 'Medical Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'earned', label: 'Annual Leave' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
];
```

**Problem**:
- Only includes 5 leave types (missing: bereavement, compensatory, unpaid, special)
- Does not reflect the actual leave types configured in the database
- If an admin adds custom leave types, they won't appear in the filter

**Database Schema** ([leaveType.schema.js](backend/models/leave/leaveType.schema.js)):
- Collection: `leaveTypes`
- Fields: `leaveTypeId`, `name`, `code`, `annualQuota`, `isActive`
- Each company can have their own leave types

---

### 2. Hardcoded Year Filter Options

**File**: [leaveLedger.tsx:102-107](react/src/feature-module/hrm/attendance/leaves/leaveLedger.tsx#L102-L107)

**Current Code**:
```typescript
const yearOptions = [
  { value: '', label: 'All Years' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
];
```

**Problem**:
- Hardcoded years (2024-2026)
- Will need manual updates every year
- Does not dynamically generate based on available data

---

### 3. Hardcoded Leave Type Display Map

**File**: [useLeaveREST.ts:92-102](react/src/hooks/useLeaveREST.ts#L92-L102)

**Current Code**:
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

**Problem**:
- Frontend uses a static mapping for display names
- Does not reflect database values where leave types can be customized per company
- The `code` field in database should match, but the display `name` may differ

---

### 4. Balance Summary Showing "0 / 0"

**Symptoms**:
- Balance cards show: `0 / 0 Used: 0 | Pending: 0.0`
- Data appears to be fetched but not displayed correctly

**Root Cause Analysis**:

The issue is in the **data transformation mismatch** between backend and frontend:

#### Backend Response Structure ([leaveLedger.service.js:84-91](backend/services/leaves/leaveLedger.service.js#L84-L91)):
```javascript
summary[type] = {
  total: employeeBalance?.total || 0,        // Total allocated from employee balance
  used: employeeBalance?.used || 0,          // Used from employee balance
  balance: employeeBalance?.balance || 0,    // Current balance from employee balance
  ledgerBalance: latestEntry?.balanceAfter || 0,  // Balance from ledger
  lastTransaction: latestEntry?.transactionDate || null,
  yearlyStats: { allocated, used, restored },
};
```

#### Frontend Transform ([useLeaveLedger.ts:105-123](react/src/hooks/useLeaveLedger.ts#L105-L123)):
```typescript
const transformSummary = (backendSummary: any): BalanceSummary => {
  const result: BalanceSummary = {};
  for (const [leaveType, data] of Object.entries(backendSummary)) {
    result[leaveType] = {
      total: (data as any).totalAllocated || 0,  // ❌ WRONG FIELD NAME
      used: (data as any).totalUsed || 0,        // ❌ WRONG FIELD NAME
      balance: (data as any).currentBalance || 0, // ❌ WRONG FIELD NAME
      // ...
    };
  }
  return result;
};
```

**The Mismatch**:
| Backend Returns | Frontend Expects | Result |
|----------------|------------------|--------|
| `total` | `totalAllocated` | ❌ Gets 0 |
| `used` | `totalUsed` | ❌ Gets 0 |
| `balance` | `currentBalance` | ❌ Gets 0 |

---

## Column Analysis

### Column: Date
**Purpose**: Shows when the transaction occurred
**Data Source**: `transactionDate` from ledger entry
**Format**: `DD MMM YYYY`
**Status**: ✅ Correctly configured

### Column: Leave Type
**Purpose**: Shows which type of leave the transaction affects
**Data Source**: `leaveType` code (sick, casual, etc.)
**Display**: Uses `leaveTypeDisplayMap` for display name
**Status**: ⚠️ Uses hardcoded mapping, should use database

### Column: Transaction
**Purpose**: Shows the type of transaction that occurred
**Data Source**: `transactionType`
**Possible Values**:
| Value | Display | Color | Purpose |
|-------|---------|-------|---------|
| `opening` | Opening Balance | Blue | Initial balance when employee joins |
| `allocated` | Leave Allocated | Green | New leave allocation (annual, monthly) |
| `used` | Leave Used | Yellow | Leave taken by employee |
| `restored` | Leave Restored | Green | Leave credited back (after cancellation) |
| `carry_forward` | Carried Forward | Primary | Previous year's balance brought forward |
| `encashed` | Leave Encashed | Purple | Leave converted to cash |
| `adjustment` | Manual Adjustment | Orange | Admin adjustment |
| `expired` | Leave Expired | Red | Leave lapsed/expired |

**Status**: ✅ Correctly configured

### Column: Amount
**Purpose**: Shows the change in leave balance
**Display**:
- Positive amounts (green): Credits (allocated, restored, carry_forward)
- Negative amounts (red): Debits (used, encashed, expired)
**Status**: ✅ Correctly configured

### Column: Balance Before
**Purpose**: Shows the leave balance before this transaction
**Data Source**: `balanceBefore`
**Status**: ✅ Correctly configured

### Column: Balance After
**Purpose**: Shows the leave balance after this transaction
**Data Source**: `balanceAfter`
**Status**: ✅ Correctly configured

### Column: Description
**Purpose**: Explains the transaction (e.g., "Leave used", "Annual allocation")
**Data Source**: `description`
**Status**: ✅ Correctly configured

### Column: Changed By
**Purpose**: Shows who made the change
**Data Source**: `changedBy` object with `firstName`, `lastName`
**Status**: ✅ Correctly configured (shows "-" if not available)

---

## Data Flow Analysis

### API Endpoints

| Endpoint | Method | Purpose | File |
|----------|--------|---------|------|
| `/api/leaves/ledger/my` | GET | Get current user's balance history | [leaveLedger.controller.js:11-34](backend/controllers/leaves/leaveLedger.controller.js#L11-L34) |
| `/api/leaves/ledger/my/summary` | GET | Get current user's balance summary | [leaveLedger.controller.js:76-97](backend/controllers/leaves/leaveLedger.controller.js#L76-L97) |
| `/api/leaves/ledger/employee/:id` | GET | Get employee's balance history (HR/Admin) | [leaveLedger.controller.js:39-71](backend/controllers/leaves/leaveLedger.controller.js#L39-L71) |
| `/api/leaves/ledger/employee/:id/summary` | GET | Get employee's balance summary (HR/Admin) | [leaveLedger.controller.js:102-132](backend/controllers/leaves/leaveLedger.controller.js#L102-L132) |
| `/api/leave-types` | GET | Get all leave types for company | [leaveType.controller.js:29-88](backend/controllers/rest/leaveType.controller.js#L29-L88) |

### Data Sources

1. **leaveLedger Collection**: Transaction history
   - Each transaction: leave type, amount, balance before/after, date, description

2. **employees Collection**: Employee balance summary
   - `employee.leaveBalance.balances[]`: Array of balances by type
   - Each balance has: `type`, `total`, `used`, `balance`

3. **leaveTypes Collection**: Leave type configuration
   - `name`, `code`, `annualQuota`, `isActive`, etc.

---

## Recommended Fixes

### Priority 1: Fix Balance Summary Display (Critical)

**Fix the `transformSummary` function** in [useLeaveLedger.ts](react/src/hooks/useLeaveLedger.ts#L105-L123):

```typescript
const transformSummary = (backendSummary: any): BalanceSummary => {
  const result: BalanceSummary = {};

  for (const [leaveType, data] of Object.entries(backendSummary)) {
    result[leaveType] = {
      total: (data as any).total || 0,              // ✅ Fixed: was totalAllocated
      used: (data as any).used || 0,                // ✅ Fixed: was totalUsed
      balance: (data as any).balance || 0,          // ✅ Fixed: was currentBalance
      ledgerBalance: (data as any).ledgerBalance || 0,
      lastTransaction: (data as any).lastTransaction || null,
      yearlyStats: {
        allocated: (data as any).yearlyStats?.allocated || 0,
        used: (data as any).yearlyStats?.used || 0,
        restored: (data as any).yearlyStats?.restored || 0,
      },
    };
  }

  return result;
};
```

### Priority 2: Fetch Leave Types from Database

**Create a new hook or update existing** to fetch leave types from database:

```typescript
// Add to useLeaveREST.ts or create new useLeaveTypes.ts
export const useLeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await get<any>('/leave-types', {
        params: { status: 'active', limit: 100 }
      });
      if (response.success && response.data) {
        const options = response.data.map((lt: any) => ({
          value: lt.code.toLowerCase(),  // Match with ledger leaveType values
          label: lt.name,
          annualQuota: lt.annualQuota,
          color: lt.color
        }));
        setLeaveTypes(options);
      }
    } catch (err) {
      message.error('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  return { leaveTypes, loading, fetchLeaveTypes };
};
```

### Priority 3: Dynamic Year Generation

**Replace hardcoded years with dynamic generation**:

```typescript
const yearOptions = useMemo(() => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 3;
  const endYear = currentYear + 1;
  const options = [{ value: '', label: 'All Years' }];
  for (let year = startYear; year <= endYear; year++) {
    options.push({ value: year.toString(), label: year.toString() });
  }
  return options;
}, []);
```

### Priority 4: Update Display Component

**Update balance card calculation** for pending display:

```typescript
// Current (potentially incorrect):
// Used: {data.used} | Pending: {(data.total - data.used - data.balance).toFixed(1)}

// Fixed (considering ledger):
// Pending = total - used - balance (should be 0 in most cases)
// Or use actual pending leave requests if tracked
```

---

## Database Schema Reference

### leaveLedger Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `companyId` | String | Company identifier |
| `employeeId` | String | Employee reference |
| `leaveType` | String | Leave type code (sick, casual, etc.) |
| `transactionType` | String | Transaction type (opening, allocated, used, etc.) |
| `amount` | Number | Amount changed (positive or negative) |
| `balanceBefore` | Number | Balance before transaction |
| `balanceAfter` | Number | Balance after transaction |
| `transactionDate` | Date | When transaction occurred |
| `financialYear` | String | FY format (e.g., "FY2025-2026") |
| `year` | Number | Calendar year |
| `month` | Number | Calendar month (1-12) |
| `description` | String | Transaction description |
| `details` | Object | Additional details (startDate, endDate, etc.) |
| `changedBy` | Object | User who made the change |
| `isDeleted` | Boolean | Soft delete flag |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Update timestamp |

### leaveTypes Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `leaveTypeId` | String | Unique leave type ID (e.g., LT-CASUAL) |
| `companyId` | String | Company identifier |
| `name` | String | Display name |
| `code` | String | Short code (CASUAL, SICK, etc.) |
| `annualQuota` | Number | Days per year |
| `isPaid` | Boolean | Is paid leave |
| `requiresApproval` | Boolean | Needs manager approval |
| `carryForwardAllowed` | Boolean | Can carry forward |
| `maxCarryForwardDays` | Number | Max carry forward days |
| `encashmentAllowed` | Boolean | Can encash |
| `color` | String | UI color code |
| `isActive` | Boolean | Is active |
| `isDeleted` | Boolean | Soft delete flag |

---

## Summary of Changes Required

| File | Change | Priority |
|------|--------|----------|
| [useLeaveLedger.ts](react/src/hooks/useLeaveLedger.ts) | Fix `transformSummary` field names | **Critical** |
| [leaveLedger.tsx](react/src/feature-module/hrm/attendance/leaves/leaveLedger.tsx) | Fetch leave types from database | **High** |
| [leaveLedger.tsx](react/src/feature-module/hrm/attendance/leaves/leaveLedger.tsx) | Dynamic year generation | Medium |
| [useLeaveREST.ts](react/src/hooks/useLeaveREST.ts) | Consider making display map dynamic | Low |

---

## Appendix: Transaction Types Reference

| Transaction Type | When Created | Amount | Description |
|------------------|--------------|--------|-------------|
| **opening** | Employee join/ledger init | 0 | Initial balance entry |
| **allocated** | Leave allocation | + | Annual/monthly leave credit |
| **used** | Leave taken | - | Leave deducted |
| **restored** | Leave cancelled | + | Leave credited back |
| **carry_forward** | Year-end processing | + | Previous year balance brought forward |
| **encashed** | Leave encashment | - | Leave converted to cash |
| **adjustment** | Manual admin change | +/- | Admin adjustment |
| **expired** | Leave lapsed | - | Leave expired |

---

**Report Generated**: 2026-02-22
**Analyst**: Claude Code Assistant
**Version**: 1.0
