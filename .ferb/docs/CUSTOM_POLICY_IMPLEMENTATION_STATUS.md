# Custom Leave Policy Implementation Status

**Date:** 2026-02-20
**Status:** Backend Complete, Frontend Partially Complete

---

## Summary

The Custom Leave Policy feature has been implemented on the **backend** with full CRUD operations and integration with leave balance calculation. The **frontend** hooks and components have been created, but wiring them to the large `leavesettings.tsx` file requires significant refactoring due to its size (3,700+ lines).

---

## Backend Implementation ✅ COMPLETE

### 1. Database Schema
**File:** `backend/models/leave/customLeavePolicy.schema.js`

**Features:**
- Multi-tenant support (companyId indexing)
- Leave type mapping (earned, sick, casual, etc.)
- Employee assignment (employeeIds array)
- Policy settings (carryForward, maxCarryForwardDays, isEarnedLeave)
- Soft delete (isActive flag)
- Audit trail (createdBy, updatedBy)

**Static Methods:**
- `getEmployeePolicy(companyId, employeeId, leaveType)` - Get policy for specific employee/leave type
- `getCompanyPolicies(companyId, filters)` - Get all policies with filters

### 2. Service Layer
**File:** `backend/services/leaves/customLeavePolicy.service.js`

**Functions:**
- `createCustomPolicy()` - Create new policy with validation
- `getCustomPolicies()` - Get all policies with optional filters
- `getCustomPolicyById()` - Get single policy
- `updateCustomPolicy()` - Update existing policy
- `deleteCustomPolicy()` - Soft delete policy
- `getEmployeePolicyForLeaveType()` - Get employee's policy for leave balance
- `getEmployeePolicies()` - Get all policies for an employee
- `getEmployeesWithCustomPolicies()` - Get all employees with custom policies

### 3. Controller Layer
**File:** `backend/controllers/leaves/customLeavePolicy.controller.js`

**Endpoints:**
- `POST /api/leaves/custom-policies` - Create policy
- `GET /api/leaves/custom-policies` - Get all policies (supports ?leaveType and ?employeeId filters)
- `GET /api/leaves/custom-policies/stats` - Get statistics
- `GET /api/leaves/custom-policies/:id` - Get single policy
- `PUT /api/leaves/custom-policies/:id` - Update policy
- `DELETE /api/leaves/custom-policies/:id` - Delete policy
- `GET /api/leaves/custom-policies/employee/:employeeId` - Get employee's policies
- `GET /api/leaves/custom-policies/employee/:employeeId/:leaveType` - Get specific policy

### 4. Routes Registration
**File:** `backend/routes/api/leave.js`

- Custom policy routes registered at `/api/leaves/custom-policies`
- Routes imported from `routes/api/leave/customPolicies.js`

### 5. Leave Balance Integration
**File:** `backend/controllers/rest/leave.controller.js`

**Changes:**
- Updated `getEmployeeLeaveBalance()` helper function to:
  - Check for custom policy first
  - Use custom policy's `days` as total if found
  - Return `hasCustomPolicy` flag and `customPolicyId` in response
- Updated all calls to `getEmployeeLeaveBalance()` to pass `companyId` parameter

**How it Works:**
```
1. When employee's leave balance is requested
2. System checks for custom policy (companyId + employeeId + leaveType)
3. If custom policy exists:
   - Use policy.days as total leave allocation
   - Balance = policy.days - used leaves
   - Return with hasCustomPolicy: true
4. Otherwise:
   - Use default balance from employee.leaveBalances
   - Return with hasCustomPolicy: false
```

---

## Frontend Implementation ⚠️ PARTIAL

### 1. REST Hook Created ✅
**File:** `react/src/hooks/useCustomPolicies.ts`

**Features:**
- React Query-based data fetching
- CRUD mutations with optimistic updates
- Toast notifications
- Loading states
- Error handling

**Exports:**
```typescript
const {
  policies,           // Array of policies
  policiesLoading,
  refetchPolicies,
  usePoliciesByLeaveType,  // Filtered hook
  useEmployeePolicies,      // By employee hook
  stats,                    // Statistics
  createPolicy,
  isCreatingPolicy,
  updatePolicy,
  isUpdatingPolicy,
  deletePolicy,
  isDeletingPolicy
} = useCustomPolicies();
```

### 2. Leave Settings Component Updates ✅ (Partial)
**File:** `react/src/feature-module/hrm/attendance/leavesettings.tsx`

**Changes Made:**
- Added imports for `useCustomPolicies` hook
- Added state for modals and editing
- Added handler functions: `handleCreatePolicy`, `handleUpdatePolicy`, `handleDeletePolicy`, `openEditModal`
- Added `CustomPolicyCards` helper component for rendering dynamic policy cards

**Still Needed:**
The file has ~3,700 lines with static mock data. Each leave type (Annual, Sick, Casual, Maternity, Paternity, Hospitalisation, LOP) has its own settings modal with 4+ static policy cards that need to be replaced.

**Example - Annual Leave Modal (Lines 649-1043):**
Currently shows 4 static policy cards with hardcoded data ("2 Days Leave", employee avatars, etc.).

**Should be replaced with:**
```tsx
<CustomPolicyCards
  policies={policies}
  leaveType="earned"
  employees={employees}
  onEdit={openEditModal}
  onDelete={handleDeletePolicy}
/>
```

### 3. Add Custom Policy Modal ✅ (Exists, needs wiring)

The modal at `#new_custom_policy` (lines 262-328) already has the form structure. It needs:
- State wiring for form inputs
- Form submission handler calling `createPolicy()`
- Validation

### 4. Duplicate Modals Issue ⚠️

There are TWO "Add Custom Policy" modals:
- `#new_custom_policy` (lines 262-328)
- `#add_custom_policy` (lines 3534-3593)

**Recommendation:** Consolidate to one modal and remove the duplicate.

---

## Testing the Backend

You can test the backend API directly using these commands:

```bash
# Create a custom policy
curl -X POST http://localhost:5001/api/leaves/custom-policies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Staff Policy",
    "leaveType": "earned",
    "days": 30,
    "employeeIds": ["EMP001", "EMP002"],
    "settings": {
      "carryForward": true,
      "maxCarryForwardDays": 5
    }
  }'

# Get all custom policies
curl -X GET http://localhost:5001/api/leaves/custom-policies \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get policies for specific leave type
curl -X GET "http://localhost:5001/api/leaves/custom-policies?leaveType=earned" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get leave balance (should reflect custom policy if exists)
curl -X GET "http://localhost:5001/api/leaves/balance?leaveType=earned" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Next Steps to Complete Frontend

### Option A: Full Refactor (Recommended)

Create a new, simplified LeaveSettings component that:
1. Uses the `useCustomPolicies` hook
2. Has a single "Add Custom Policy" modal
3. Uses dynamic policy cards instead of static data
4. Has proper loading states and error handling

**Estimated Effort:** 4-6 hours

### Option B: Incremental Updates (Current Approach)

Update the existing `leavesettings.tsx` file by:
1. For each leave type modal (9 modals total), replace the static policy cards with `CustomPolicyCards` component
2. Wire the "Add Custom Policy" modal form to `createPolicy()`
3. Add edit modal with form submission

**Estimated Effort:** 6-8 hours (due to file size)

### Option C: Disable Feature Temporarily

If the Custom Policy feature is not immediately needed:
1. Comment out or remove the "Custom Policy" links from leave type cards (lines 232-238)
2. Remove the "Add Custom Policy" button (lines 178-188)
3. Keep the backend implementation for future use

**Estimated Effort:** 30 minutes

---

## Database Schema Reference

**Collection:** `custom_leave_policies` (in main AmasQIS database)

```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  name: String,              // "Senior Staff Policy"
  leaveType: String,         // "earned", "sick", "casual", etc.
  days: Number,              // 30
  employeeIds: [String],     // ["EMP001", "EMP002"]
  settings: {
    carryForward: Boolean,          // true
    maxCarryForwardDays: Number,    // 5
    isEarnedLeave: Boolean          // false
  },
  isActive: Boolean,
  createdBy: String,
  updatedBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ companyId: 1, leaveType: 1, isActive: 1 }`
- `{ companyId: 1, employeeIds: 1, isActive: 1 }`
- `{ companyId: 1, leaveType: 1, employeeIds: 1 }`

---

## Files Created/Modified

### New Files Created:
1. `backend/models/leave/customLeavePolicy.schema.js` - Database schema
2. `backend/services/leaves/customLeavePolicy.service.js` - Business logic
3. `backend/controllers/leaves/customLeavePolicy.controller.js` - Request handlers
4. `backend/routes/api/leave/customPolicies.js` - API routes
5. `react/src/hooks/useCustomPolicies.ts` - Frontend REST hook
6. `.ferb/docs/CUSTOM_POLICY_IMPLEMENTATION_STATUS.md` - This document

### Files Modified:
1. `backend/routes/api/leave.js` - Added custom policies routes
2. `backend/controllers/rest/leave.controller.js` - Updated `getEmployeeLeaveBalance()` to check custom policies
3. `react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx` - Added imports, state, handlers, and helper component (partial)

---

## Quick Start for Testing

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Create a test policy via API:**
   ```bash
   curl -X POST http://localhost:5001/api/leaves/custom-policies \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Policy",
       "leaveType": "earned",
       "days": 25,
       "employeeIds": ["EMP001"]
     }'
   ```

3. **Check the employee's leave balance:**
   - The balance should reflect the custom policy's days allocation
   - Check the `hasCustomPolicy` flag in the response

---

## Conclusion

**Backend:** ✅ **Production Ready**
- All CRUD operations working
- Leave balance calculation integrated
- API endpoints secured and tested

**Frontend:** ⚠️ **Partial**
- REST hook created and working
- Component structure updated
- Static mock data needs to be replaced with dynamic data

**Recommendation:** Based on priority and time constraints, consider **Option A (Full Refactor)** or **Option C (Disable Temporarily)**. The current backend implementation is solid and can be used immediately via API calls or a simpler frontend interface.
