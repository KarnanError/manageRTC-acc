# Custom Leave Policy Schema Migration - COMPLETE

**Date:** 2026-02-23
**Status:** ✅ COMPLETE
**Result:** Schema refactored to remove redundancy and use proper ObjectId references

---

## Summary

The `custom_leave_policies` collection has been refactored to eliminate redundant fields and establish proper ObjectId references to related collections. This improves data integrity and simplifies the multi-tenant architecture.

---

## Schema Changes

### Before (Old Schema)
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,           // REDUNDANT - already in company-specific DB
  name: String,
  leaveType: String,             // WRONG - should be ObjectId reference
  days: Number,
  employeeIds: [String],
  settings: Object,
  createdBy: String,             // WRONG - should be ObjectId reference
  updatedBy: String,             // WRONG - should be ObjectId reference
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### After (New Schema)
```javascript
{
  _id: ObjectId,
  name: String,
  leaveTypeId: ObjectId,         // ObjectId reference to leaveTypes collection
  days: Number,
  employeeIds: [String],
  settings: Object,
  createdBy: ObjectId,           // ObjectId reference to employees collection
  updatedBy: ObjectId,           // ObjectId reference to employees collection
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Files Modified

### Backend (4 files)

| File | Changes |
|------|---------|
| [backend/services/leaves/customLeavePolicy.service.js](backend/services/leaves/customLeavePolicy.service.js) | - Removed `companyId` parameter from all database operations<br>- Changed `leaveType` to `leaveTypeId` with ObjectId validation<br>- Changed `createdBy`/`updatedBy` to use `new ObjectId(userId)`<br>- Added leaveType enrichment (populate name, code, color)<br>- Updated `getEmployeePolicy()` to match by leaveType code, then use ObjectId |
| [backend/controllers/leaves/customLeavePolicy.controller.js](backend/controllers/leaves/customLeavePolicy.controller.js) | - Updated query param from `leaveType` to `leaveTypeId`<br>- Fixed service method call from `getEmployeePolicyForLeaveType` to `getEmployeePolicy`<br>- Updated comments to reflect `leaveTypeId` parameter |
| [backend/routes/api/leave/customPolicies.js](backend/routes/api/leave/customPolicies.js) | - Updated query param documentation from `leaveType` to `leaveTypeId`<br>- Migrated `/stats` endpoint from Mongoose to native MongoDB driver<br>- Updated aggregation to use `$leaveTypeId` and enrich with leave type names |
| [backend/models/leave/customLeavePolicy.schema.js](backend/models/leave/customLeavePolicy.schema.js) | - **DEPRECATED** - Mongoose schema, kept for reference only |

### Frontend (2 files)

| File | Changes |
|------|---------|
| [react/src/hooks/useCustomPolicies.ts](react/src/hooks/useCustomPolicies.ts) | - Updated `CustomPolicy` interface to use `leaveTypeId`<br>- Added `LeaveTypeDetails` interface for enriched leave type data<br>- Updated `CustomPolicyFormData` to use `leaveTypeId`<br>- Changed `fetchPolicies` filter from `leaveType` to `leaveTypeId` |
| [react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx](react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx) | - Updated `leaveTypeOptions` to use `_id` as value instead of `code.toLowerCase()`<br>- Changed form state from `leaveType` to `leaveTypeId`<br>- Updated error validation to use `leaveTypeId`<br>- Updated `handleCreatePolicy` validation<br>- Updated `handleUpdatePolicy` validation<br>- Updated `openAddCustomPolicyModal` to accept `leaveTypeId`<br>- Updated `openEditCustomPolicyModal` to use `leaveTypeId`<br>- Updated CommonSelect onChange handlers to find by `_id`<br>- Updated form reset code in multiple places |

---

## API Changes

### Request Body Changes

**Before:**
```json
{
  "name": "Senior Employee Policy",
  "leaveType": "earned",
  "days": 20,
  "employeeIds": ["emp001", "emp002"]
}
```

**After:**
```json
{
  "name": "Senior Employee Policy",
  "leaveTypeId": "507f1f77bcf86cd799439011",
  "days": 20,
  "employeeIds": ["emp001", "emp002"]
}
```

### Query Parameter Changes

**Before:**
```
GET /api/leave/custom-policies?leaveType=earned
```

**After:**
```
GET /api/leave/custom-policies?leaveTypeId=507f1f77bcf86cd799439011
```

### Response Changes

**Before:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "companyId": "...",
    "name": "Senior Employee Policy",
    "leaveType": "earned",
    "days": 20,
    "createdBy": "user123"
  }
}
```

**After:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Senior Employee Policy",
    "leaveTypeId": "507f1f77bcf86cd799439011",
    "leaveType": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Annual Leave",
      "code": "EARNED",
      "color": "#4CAF50"
    },
    "days": 20,
    "createdBy": "507f1f77bcf86cd799439012"
  }
}
```

---

## Key Implementation Details

### 1. Multi-Tenant Support (companyId Removed)

Since each company has its own MongoDB database named by its `companyId`, storing `companyId` in the document is redundant. The service layer now:

```javascript
// Before:
const policy = { companyId, name, leaveType, ... };

// After:
const policy = { name, leaveTypeId, ... }; // companyId comes from database context
```

### 2. ObjectId References (leaveTypeId)

The `leaveType` field is now an ObjectId reference to the `leaveTypes` collection:

```javascript
// Service validates leaveTypeId exists:
const leaveType = await leaveTypes.findOne({
  _id: new ObjectId(leaveTypeId),
  isDeleted: { $ne: true }
});

if (!leaveType) {
  throw new Error('Leave type not found');
}
```

### 3. Employee References (createdBy/updatedBy)

User references now store the employee database ID (ObjectId) instead of Clerk user ID:

```javascript
// Before:
createdBy: userId,  // String (Clerk ID)

// After:
createdBy: new ObjectId(userId),  // ObjectId (employee ID)
```

### 4. Leave Type Code Matching

The `getEmployeePolicy()` function matches by leave type code (e.g., "EARNED", "SICK") since that's what leave balance calculations use:

```javascript
export const getEmployeePolicy = async (companyId, employeeId, leaveType) => {
  // Find leaveType by code first
  const matchingLeaveTypes = await leaveTypes.find({
    code: leaveType.toUpperCase(),
    isActive: true,
    isDeleted: { $ne: true }
  }).toArray();

  if (matchingLeaveTypes.length === 0) {
    return null;
  }

  // Use the leaveType's ObjectId
  const leaveTypeId = matchingLeaveTypes[0]._id;

  // Find policy that references this leave type
  const policy = await customLeavePolicies.findOne({
    leaveTypeId,
    employeeIds: employeeId,
    isActive: true,
    isDeleted: { $ne: true }
  });

  return policy;
};
```

### 5. Leave Type Enrichment

API responses now include enriched leave type details:

```javascript
const enrichedPolicies = await Promise.all(policies.map(async (policy) => {
  const leaveType = await leaveTypes.findOne({
    _id: policy.leaveTypeId,
    isDeleted: { $ne: true }
  });

  return {
    ...policy,
    leaveType: leaveType ? {
      _id: leaveType._id.toString(),
      name: leaveType.name,
      code: leaveType.code,
      color: leaveType.color
    } : null
  };
}));
```

---

## Frontend Migration

### Dropdown Options Change

**Before:**
```typescript
const leaveTypeOptions = useMemo(() => {
  return leaveTypes.map((lt) => ({
    value: lt.code.toLowerCase(),  // "earned", "sick"
    label: lt.name,
  }));
}, [leaveTypes]);
```

**After:**
```typescript
const leaveTypeOptions = useMemo(() => {
  return leaveTypes.map((lt) => ({
    value: lt._id || lt.leaveTypeId,  // ObjectId
    label: lt.name,
  }));
}, [leaveTypes]);
```

### Form State Change

**Before:**
```typescript
const [policyForm, setPolicyForm] = useState({
  name: "",
  leaveType: "",  // code
  ...
});
```

**After:**
```typescript
const [policyForm, setPolicyForm] = useState({
  name: "",
  leaveTypeId: "",  // ObjectId
  ...
});
```

---

## Validation & Testing Checklist

- ✅ Backend service layer updated
- ✅ Backend controller layer updated
- ✅ Backend routes documentation updated
- ✅ `/stats` endpoint migrated to native MongoDB driver
- ✅ Frontend TypeScript types updated
- ✅ Frontend form state updated
- ✅ Frontend dropdown options updated
- ✅ Frontend validation updated
- ✅ Frontend error handling updated

---

## Next Steps

### Testing Required
1. **Restart Backend Server** - Changes require restart
   ```bash
   cd backend
   npm run dev
   ```

2. **Restart Frontend Dev Server** - Changes require rebuild
   ```bash
   cd react
   npm start
   ```

3. **Test Custom Policy Creation:**
   - Navigate to Leave Settings page
   - Click "Add Custom Policy"
   - Select a leave type from dropdown
   - Add employees and set custom days
   - Submit and verify creation

4. **Test Custom Policy Editing:**
   - Open an existing policy for editing
   - Verify leave type is selected correctly
   - Modify and save changes

5. **Test Leave Type Code Matching:**
   - Create a policy for "Annual Leave" (code: EARNED)
   - Verify it's returned when querying by leaveType code "earned"

### Data Migration (Optional)

If there are existing custom policies with the old schema, run a migration script to:
1. Remove `companyId` field
2. Convert `leaveType` codes to `leaveTypeId` ObjectIds
3. Convert `createdBy`/`updatedBy` strings to ObjectIds

---

## Related Documentation

- [Phase 1: Critical Fixes](memory/PHASE_1_CRITICAL_FIXES_COMPLETE.md)
- [Phase 2: Ledger Integration](memory/PHASE_2_LEDGER_INTEGRATION_COMPLETE.md)
- [Phase 3: Frontend Improvements](memory/PHASE_3_FRONTEND_IMPROVEMENTS_COMPLETE.md)
- [Leave Settings 500 Error Fix](.ferb/docs/LEAVE_SETTINGS_500_ERROR_FIX_REPORT.md)

---

**Custom Leave Policy Schema Migration:** ✅ COMPLETE - Ready for testing after server restart
