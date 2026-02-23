# Custom Leave Policy Schema Standardization - COMPLETE

**Date:** 2026-02-23
**Status:** ✅ COMPLETE - Schema standardized to `annualQuota`

---

## Summary

The custom leave policy schema has been standardized to match the leave types structure. The field `days` has been renamed to `annualQuota` throughout the entire codebase (backend and frontend).

---

## Schema Comparison

| Property | Leave Types | Custom Policies (Before) | Custom Policies (After) |
|----------|------------|-------------------------|------------------------|
| Default quota | `annualQuota` | `days` ❌ | `annualQuota` ✅ |
| Type ID | `_id` | `leaveTypeId` ✅ | `leaveTypeId` ✅ |
| Company ID | `companyId` | N/A (DB-level) | N/A (DB-level) ✅ |
| Code | `code` | N/A | N/A (from leaveType ref) |
| Employees | N/A | `employeeIds` ✅ | `employeeIds` ✅ |

---

## Database Schema

### Custom Leave Policies Collection (Final Schema)

```javascript
{
  _id: ObjectId,
  name: String,
  leaveTypeId: ObjectId,           // Reference to leaveTypes._id
  annualQuota: Number,             // Custom annual quota (OVERWRITES leaveType.annualQuota)
  employeeIds: [ObjectId],         // Array of employee IDs
  settings: {
    carryForward: Boolean,
    maxCarryForwardDays: Number,
    isEarnedLeave: Boolean
  },
  createdBy: ObjectId,             // Reference to employees._id
  updatedBy: ObjectId,             // Reference to employees._id
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Changes

### Request Body (Create/Update)

**Before:**
```json
{
  "name": "Senior Employee Policy",
  "leaveTypeId": "507f1f77bcf86cd799439011",
  "days": 20,  // ❌ Old field name
  "employeeIds": ["emp001", "emp002"],
  "settings": {...}
}
```

**After:**
```json
{
  "name": "Senior Employee Policy",
  "leaveTypeId": "507f1f77bcf86cd799439011",
  "annualQuota": 20,  // ✅ New field name
  "employeeIds": ["emp001", "emp002"],
  "settings": {...}
}
```

### Response Body

```json
{
  "_id": "...",
  "name": "Senior Employee Policy",
  "leaveTypeId": "...",
  "leaveType": {
    "_id": "...",
    "name": "Annual Leave",
    "code": "EARNED",
    "color": "#4CAF50",
    "annualQuota": 15  // Default from leave type
  },
  "annualQuota": 20,  // Custom value (overwrites default)
  "employeeIds": ["emp001", "emp002"],
  "settings": {...},
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "...",
  "createdBy": "...",
  "updatedBy": "..."
}
```

---

## Files Modified

### Backend (4 files)

| File | Changes |
|------|---------|
| [backend/services/leaves/customLeavePolicy.service.js](backend/services/leaves/customLeavePolicy.service.js) | - `days` → `annualQuota` in all functions<br>- Updated validation messages<br>- Updated serialization<br>- Added null-safe `.toString()` calls |
| [backend/services/leaves/leaveLedger.service.js](backend/services/leaves/leaveLedger.service.js) | - Updated to use `leaveTypeId` + `annualQuota`<br>- Changed from old schema (`policy.leaveType` + `policy.days`) to new |
| [backend/controllers/leaves/customLeavePolicy.controller.js](backend/controllers/leaves/customLeavePolicy.controller.js) | No changes needed (uses service layer) |
| [backend/routes/api/leave/customPolicies.js](backend/routes/api/leave/customPolicies.js) | No changes needed (uses controller layer) |

### Frontend (3 files)

| File | Changes |
|------|---------|
| [react/src/hooks/useCustomPolicies.ts](react/src/hooks/useCustomPolicies.ts) | - Updated `CustomPolicy` interface: `days` → `annualQuota`<br>- Updated `CustomPolicyFormData` interface |
| [react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx](react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx) | - Form mapping: `annualQuota: policyForm.customDays`<br>- Display: `policy.annualQuota`<br>- Table header: "Days" → "Annual Quota"<br>- Edit modal: `customDays: policy.annualQuota` |
| [react/src/hooks/useLeaveLedger.ts](react/src/hooks/useLeaveLedger.ts) | No changes (uses service layer) |

### Test Files (1 file)

| File | Changes |
|------|---------|
| [backend/seed/testCustomPolicyEndToEnd.js](backend/seed/testCustomPolicyEndToEnd.js) | - Updated test to use `annualQuota`<br>- Updated all console output |

---

## UI Field Mapping

### Form Fields (Internal State)

```typescript
const policyForm = {
  name: string,
  leaveTypeId: string,      // Sent to API as-is
  defaultDays: number,      // UI-only: shows system default from leaveType.annualQuota
  customDays: number,       // UI-only: user input, sent to API as annualQuota
  employeeIds: string[],
  settings: {...}
}
```

### API Mapping

| Form Field | API Field | Notes |
|-----------|----------|-------|
| `policyForm.name` | `name` | Direct mapping |
| `policyForm.leaveTypeId` | `leaveTypeId` | Direct mapping |
| `policyForm.customDays` | `annualQuota` | **Renamed** for API |
| `policyForm.employeeIds` | `employeeIds` | Direct mapping |
| `policyForm.settings` | `settings` | Direct mapping |
| `policyForm.defaultDays` | N/A | **Not sent** (UI reference only) |

---

## Edit Modal Flow

### 1. Loading Policy for Edit

```typescript
const openEditCustomPolicyModal = (policy: CustomPolicy) => {
  const selectedType = leaveTypes.find(lt => (lt._id || lt.leaveTypeId) === policy.leaveTypeId);

  setPolicyForm({
    name: policy.name,
    leaveTypeId: policy.leaveTypeId,
    defaultDays: selectedType?.annualQuota || 0,  // System default (read-only)
    customDays: policy.annualQuota,                 // Custom value (editable)
    employeeIds: [...policy.employeeIds],
    settings: { ...policy.settings },
  });
};
```

### 2. Saving Updated Policy

```typescript
const handleUpdatePolicy = async () => {
  const policyData = {
    name: policyForm.name,
    leaveTypeId: policyForm.leaveTypeId,
    annualQuota: policyForm.customDays,  // Maps customDays → annualQuota
    employeeIds: selectedEmployees.map(emp => emp.employeeId),
    settings: policyForm.settings,
  };

  await updatePolicy(editingPolicy._id, policyData);
};
```

---

## Validation Updates

### Service Layer Validation

**Before:**
```javascript
if (!days || days <= 0) {
  throw new Error('Days must be greater than 0');
}
```

**After:**
```javascript
if (!annualQuota || annualQuota <= 0) {
  throw new Error('Annual quota must be greater than 0');
}

if (updates.annualQuota !== undefined && updates.annualQuota <= 0) {
  throw new Error('Annual quota must be greater than 0');
}
```

---

## Display Updates

### Table Header

**Before:**
```html
<th>Days</th>
```

**After:**
```html
<th>Annual Quota</th>
```

### Table Cell

**Before:**
```html
<td>{policy.days}</td>
```

**After:**
```html
<td>{policy.annualQuota}</td>
```

### View Modal

**Before:**
```html
<p>Custom Days: {viewingPolicy.days} days</p>
```

**After:**
```html
<p>Custom Days: {viewingPolicy.annualQuota} days</p>
```

---

## Migration Notes

### Existing Data

If you have existing custom policies in the database with the old `days` field, you may need to migrate them:

```javascript
// Migration script
db.custom_leave_policies.find({ days: { $exists: true } }).forEach(policy => {
  db.custom_leave_policies.updateOne(
    { _id: policy._id },
    {
      $rename: { days: "annualQuota" },
      $set: { updatedAt: new Date() }
    }
  );
});
```

---

## Test Results

```
========================================
Custom Policy End-to-End Test
========================================

✅ Create policy with annualQuota
✅ Fetch all policies
✅ Fetch policy by ID
✅ Update policy annualQuota
✅ Enrich policy with leaveType details
✅ Soft delete policy

🎉 Custom policy end-to-end test completed successfully!
```

---

## Related Documentation

- [Custom Leave Policy Schema Migration](.ferb/docs/CUSTOM_LEAVE_POLICY_SCHEMA_MIGRATION_COMPLETE.md)
- [Leave Management Implementation Plan](.ferb/docs/LEAVE_MANAGEMENT_IMPLEMENTATION_PLAN.md)
- [Leave Settings Comprehensive Report](.ferb/docs/LEAVE_SETTINGS_COMPREHENSIVE_REPORT.md)

---

**Status:** ✅ COMPLETE - Schema standardized to `annualQuota` across entire codebase
