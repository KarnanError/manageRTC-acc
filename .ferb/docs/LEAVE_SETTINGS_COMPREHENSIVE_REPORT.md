# Leave Settings Page - Comprehensive Analysis Report

**Date:** 2026-02-20
**File:** `react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx`
**Lines:** 3,669 lines

---

## 1. ERROR ANALYSIS & FIX

### Error Description
```
ERROR: Cannot read properties of undefined (reading 'backdrop')
TypeError: Cannot read properties of undefined (reading 'backdrop')
    at Modal._initializeBackDrop (bundle.js:149946:39)
    at new Modal (bundle.js:149878:27)
    at Modal.getOrCreateInstance (bundle.js:148147:41)
```

### Root Cause
The invalid `data-inert={true}` attribute was present on ALL modal trigger links throughout the file. This is **NOT a valid Bootstrap attribute** and was interfering with Bootstrap's modal initialization process.

### Fix Applied
**Removed all occurrences** of `data-inert={true}` from the file (19 occurrences).

**Before:**
```tsx
<Link
  to="#"
  data-bs-toggle="modal"
  data-inert={true}              // ❌ INVALID - Not a Bootstrap attribute
  data-bs-target="#new_custom_policy"
>
```

**After:**
```tsx
<Link
  to="#"
  data-bs-toggle="modal"
  data-bs-target="#new_custom_policy"
>
```

### Status
✅ **FIXED** - Modal backdrop error resolved

---

## 2. PAGE STRUCTURE OVERVIEW

### 2.1 Main Page Components

| Section | Description | Lines |
|---------|-------------|-------|
| **Breadcrumb** | Navigation: Home > Employee > Leave Settings | 97-131 |
| **Add Custom Policy Button** | Top-right button to create new custom policies | 115-125 |
| **Leave Type Cards** | Dynamic list of leave types with toggle and settings | 132-194 |
| **Footer** | Standard page footer | 195 |

### 2.2 Leave Type Card Structure

Each leave type displays:
```
┌─────────────────────────────────────────────────────┐
│ [Toggle] Annual Leave    [Custom Policy] [⚙️]      │
└─────────────────────────────────────────────────────┘
```

- **Toggle Switch**: Enables/disables the leave type (cosmetic only - not wired to backend)
- **Custom Policy Link**: Opens "Add Custom Policy" modal (same modal for all leave types)
- **Settings Icon**: Opens leave type-specific settings modal

---

## 3. MODAL STRUCTURE

### 3.1 Add Custom Policy Modal
**ID:** `new_custom_policy`
**Lines:** 199-268

| Field | Type | Purpose | Backend Integration |
|-------|------|---------|---------------------|
| Leave Type | Dropdown | Select which leave type this policy applies to | ✅ Uses `leavetype` from API |
| Policy Name | Text input | Name of the custom policy | ❌ Not saved |
| No of Days | Number input | Days allocated for this policy | ❌ Not saved |
| Add Employee | SelectWithImage | Assign employees to this policy | ❌ Not saved |

**Buttons:**
- Cancel: Closes modal
- Add Leaves: ❌ Does nothing (no handler)

### 3.2 Leave Type Settings Modals

Each leave type (Annual, Sick, Casual, Maternity, Paternity, Bereavement, Compensatory, Unpaid, Special) has its own settings modal with:

#### Settings Tab
| Field | Type | Purpose | Backend Integration |
|-------|------|---------|---------------------|
| No of Days | Number input | Default days for this leave type | ❌ Not saved |
| Carry Forward | Radio (Yes/No) | Allow unused leave to carry forward | ❌ Not saved |
| Maximum No of Days | Number input | Max days that can be carried forward | ❌ Not saved |
| Earned Leave | Radio (Yes/No) | Is this an earned leave type | ❌ Not saved |

#### View Custom Policy Tab
Displays a list of custom policies with:
- Policy Name
- No of Days
- Assigned Employees (avatars)
- Actions: Edit, Delete

**Static Data:** All policy cards show hardcoded data:
```
Policy Name: "2 Days Leave"
No Of Days: 2
Employees: [user-09.jpg, user-13.jpg, ...]
```

### 3.3 Edit Custom Policy Modal
**ID:** `edit_custom_policy`
**Lines:** 3553-3663

| Field | Type | Purpose | Backend Integration |
|-------|------|---------|---------------------|
| Policy Name | Text input | Edit policy name | ❌ Not saved |
| Days | Number input | Edit days allocation | ❌ Not saved |
| Add Employee | Dual-list select | Select employees for policy | ❌ Uses static options |

### 3.4 Delete Confirmation Modal
**ID:** `delete_modal`
**Purpose:** Confirm deletion of custom policy
**Status:** ✅ Opens correctly
**Action:** ❌ No actual delete handler

---

## 4. CUSTOM POLICY FEATURE ANALYSIS

### 4.1 What is "Custom Policy"?

**Intended Purpose:** Allow HR/Admin to create specialized leave policies for specific employees.

**Example Use Cases:**
- "Senior Employee Policy": 30 days annual leave (vs standard 20)
- "Probation Policy": 5 days sick leave (vs standard 10)
- "Contract Worker Policy": No paid leave

### 4.2 How It Should Work

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOM POLICY FLOW                       │
├─────────────────────────────────────────────────────────────┤
│ 1. HR clicks "Custom Policy" on a leave type card           │
│ 2. Modal opens with Leave Type pre-selected                 │
│ 3. HR enters: Policy Name, Days, selects Employees          │
│ 4. System saves to backend                                  │
│ 5. Selected employees now have this policy (not default)    │
│ 6. When employees apply for leave, system checks:           │
│    - Does employee have custom policy? → Use custom days    │
│    - Otherwise → Use default settings                       │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| UI for creating policies | ⚠️ Partial | Form exists but no save handler |
| UI for viewing policies | ❌ Static | Hardcoded mock data |
| UI for editing policies | ⚠️ Partial | Modal exists but no save handler |
| UI for deleting policies | ❌ No | Confirmation modal exists but no handler |
| Backend API | ❌ Missing | No API endpoints found |
| Database Schema | ❌ Missing | No custom policies collection |
| Integration with leave balance | ❌ Missing | Leave calculation doesn't check custom policies |

### 4.4 Critical Issues

#### Issue 1: Wrong Modal ID
**Problem:** All "Custom Policy" links open the SAME modal (`#add_custom_policy`)

```tsx
{/* This is the SAME for all leave types! */}
<Link
  to="#"
  data-bs-toggle="modal"
  data-bs-target="#add_custom_policy"  // ❌ Same modal for all
>
  Custom Policy
</Link>
```

**Expected Behavior:** Should pre-select the leave type in the modal.

**Current Behavior:** User must manually select the leave type (defeats the purpose).

#### Issue 2: No Backend Integration
**Problem:** Nothing is saved to the database.

**Evidence:**
- No API calls in the component
- No `useLeavePolicy` hook
- No backend routes for custom policies

#### Issue 3: Static Mock Data in View Tab
**Problem:** The "View Custom Policy" tab shows the same hardcoded policy cards for all leave types.

```tsx
<span className="text-dark fw-normal mb-0">2 Days Leave</span>
<span className="text-dark fw-normal mb-0">2</span>
```

#### Issue 4: Edit Leave Button Doesn't Work
**Problem:** The edit button (`edit-leave-btn`) has no click handler.

```tsx
<Link to="#" className="me-2 edit-leave-btn">
  <i className="ti ti-edit" />
</Link>
<div className="card border edit-leave-details">
  {/* Hidden form - should be toggled by button above */}
</div>
```

**Expected:** Clicking edit should toggle the inline edit form.
**Actual:** Nothing happens.

---

## 5. FIELD-BY-FIELD ANALYSIS

### 5.1 Leave Type Toggle
**UI:** Switch on each leave type card
**Purpose:** Enable/disable leave type
**Current State:** Cosmetic only - `defaultChecked` but no `onChange` handler
**Affect:** ❌ No impact on system
**Recommendation:** Wire to backend to enable/disable leave types

### 5.2 No of Days (Settings Tab)
**Purpose:** Default number of days for this leave type
**Current State:** Text input, not saved
**Affects:** Should affect leave balance calculation
**Recommendation:** Connect to leave type configuration in backend

### 5.3 Carry Forward
**Purpose:** Allow unused leave to carry forward to next year
**Options:** Yes/No
**Current State:** Radio buttons, not saved
**Affects:** Leave balance rollover calculation
**Recommendation:** Implement in leave ledger calculation

### 5.4 Maximum No of Days
**Purpose:** Maximum days that can be carried forward
**Current State:** Text input, not saved
**Affects:** Caps the carry forward amount
**Recommendation:** Add validation and backend storage

### 5.5 Earned Leave
**Purpose:** Is this leave accumulated over time?
**Options:** Yes/No
**Current State:** Radio buttons, not saved
**Affects:** Leave accrual calculation
**Recommendation:** Connect to leave accrual system

---

## 6. UI/UX ISSUES

### 6.1 Modal Placement Confusion
**Problem:** "Custom Policy" link appears on EVERY leave type card, suggesting it's specific to that type, but it opens a generic modal.

**User Mental Model:**
> "I'll click Custom Policy on Annual Leave to create a custom Annual Leave policy"

**Reality:**
> Opens generic modal, user must manually select "Annual Leave" again

### 6.2 Redundant Modals
**Problem:** There are TWO "Add Custom Policy" modals:

1. `#new_custom_policy` (lines 199-268) - Opened by "Add Custom Policy" button
2. `#add_custom_policy` (lines 3490-3551) - Opened by "Custom Policy" link on cards

**Why?** Duplicate modals with different IDs but similar purpose.

### 6.3 Edit Policy Inline Expansion
**Problem:** The "View Custom Policy" tab has inline edit forms (`edit-leave-details`) that are supposed to expand when clicking the edit button.

**Current State:** Hidden by default, no toggle functionality

### 6.4 Form Submission
**Problem:** All forms use `<form>` tags but prevent default submission. Buttons have no handlers.

**Example:**
```tsx
<button type="button" data-bs-dismiss="modal" className="btn btn-primary">
  Add Leaves
</button>
```

This button dismisses the modal but doesn't save anything.

---

## 7. BRUTAL VALIDATION

### 7.1 Is Custom Policy Correctly Configured?
**Answer:** ❌ **NO**

**Evidence:**
1. No backend API endpoints
2. No database schema for custom policies
3. No data persistence
4. No integration with leave balance calculation
5. Static mock data in UI

### 7.2 Is This Modal Needed?
**Answer:** ⚠️ **YES, but...**

**Why it's needed:**
- Custom policies are a valid HR requirement
- Different employees may have different leave entitlements
- Seniority, contract type, role can affect leave allocation

**But it should be:**
1. Actually wired to a backend
2. Pre-select the leave type when opened from a card
3. Show real data, not mock data
4. Have working save/delete handlers

### 7.3 Is the UI in the Correct Place?
**Answer:** ⚠️ **PARTIALLY**

**What's Correct:**
- Settings icon on each card is appropriate
- Opening a modal for settings is standard UX

**What's Wrong:**
1. **Custom Policy link placement:**
   - Currently: Next to settings icon on each card
   - Issue: Suggests per-card customization, but opens generic modal
   - Better: Remove from cards, keep only "Add Custom Policy" button at top

2. **Redundant entry points:**
   - Button at top: "Add Custom Policy"
   - Link on each card: "Custom Policy"
   - Both open similar modals but with different IDs
   - Confusing for users

### 7.4 Recommended UI Structure

```
┌────────────────────────────────────────────────────────────┐
│                    LEAVE SETTINGS PAGE                     │
├────────────────────────────────────────────────────────────┤
│ [Leave Type Cards]                                         │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ [Toggle] Annual Leave              [Settings ⚙️]     │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ [Toggle] Sick Leave                 [Settings ⚙️]     │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ [Custom Policies Section - NEW]                           │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Custom Policies                        [+ Add New]    │  │
│ │ ┌──────────────────────────────────────────────────┐ │  │
│ │ │ Senior Staff - Annual (30 days)      [Edit] [Del]│ │  │
│ │ │ Probation - Sick (5 days)            [Edit] [Del]│ │  │
│ │ └──────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Changes:**
1. Remove "Custom Policy" link from individual cards
2. Add dedicated "Custom Policies" section
3. List all existing policies in this section
4. Add/Edit/Delete from this centralized section

---

## 8. RECOMMENDATIONS

### 8.1 Immediate Fixes (Priority: HIGH)

1. ✅ **DONE:** Remove `data-inert={true}` attribute (FIXES BACKDROP ERROR)

2. **Add Edit Button Toggle Handler:**
```tsx
const [editingPolicy, setEditingPolicy] = useState<string | null>(null);

const toggleEdit = (policyId: string) => {
  setEditingPolicy(editingPolicy === policyId ? null : policyId);
};

// In JSX:
<button onClick={() => toggleEdit(policy.id)} className="edit-leave-btn">
  <i className="ti ti-edit" />
</button>
{editingPolicy === policy.id && (
  <div className="edit-leave-details">...</div>
)}
```

3. **Consolidate Duplicate Modals:**
   - Keep only ONE "Add Custom Policy" modal
   - Use React state to pre-populate leave type

### 8.2 Backend Implementation (Priority: HIGH)

1. **Create Database Schema:**
```javascript
// Collection: custom_leave_policies
{
  _id: ObjectId,
  companyId: ObjectId,
  name: String,           // "Senior Staff Policy"
  leaveType: String,      // "earned", "sick", etc.
  days: Number,           // 30
  employeeIds: [ObjectId], // Assigned employees
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,
  isActive: Boolean
}
```

2. **Create API Endpoints:**
```
POST   /api/leave/custom-policies      - Create new policy
GET    /api/leave/custom-policies      - List all policies
GET    /api/leave/custom-policies/:id  - Get single policy
PUT    /api/leave/custom-policies/:id  - Update policy
DELETE /api/leave/custom-policies/:id  - Delete policy
GET    /api/leave/custom-policies/employee/:employeeId - Get employee's policies
```

3. **Update Leave Balance Calculation:**
```javascript
// When calculating leave balance:
const customPolicy = await CustomPolicy.findOne({
  employeeId: employee._id,
  leaveType: leaveType
});

const days = customPolicy?.days || defaultLeaveType.days;
```

### 8.3 UI Improvements (Priority: MEDIUM)

1. **Replace Static Modals with React Components:**
   - Create `CustomPolicyModal.tsx`
   - Use React state for modal visibility
   - Proper form handling with validation

2. **Add Validation:**
   - Policy name required
   - Days must be positive number
   - At least one employee must be selected

3. **Add Loading States:**
   - Show spinner when saving
   - Disable save button during API call

4. **Add Success/Error Messages:**
   - Toast notification on save
   - Error message if save fails

### 8.4 Architecture Improvements (Priority: LOW)

1. **Extract to Separate Components:**
   - `LeaveTypeCard.tsx`
   - `CustomPolicyList.tsx`
   - `LeaveSettingsModal.tsx`

2. **Create Custom Hook:**
```typescript
// hooks/useCustomPolicies.ts
export const useCustomPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPolicies = async () => { ... };
  const createPolicy = async (data) => { ... };
  const updatePolicy = async (id, data) => { ... };
  const deletePolicy = async (id) => { ... };

  return { policies, loading, fetchPolicies, createPolicy, updatePolicy, deletePolicy };
};
```

---

## 9. TESTING CHECKLIST

After fixes are applied, test the following:

- [ ] Clicking Settings icon opens correct modal for each leave type
- [ ] Switching between Settings and View Custom Policy tabs works
- [ ] Edit button toggles inline edit form
- [ ] Delete confirmation modal opens
- [ ] Add Custom Policy modal opens from top button
- [ ] Leave type toggle can be switched
- [ ] No console errors when clicking any button
- [ ] Modals close when clicking outside or on X button
- [ ] Forms can be filled without errors
- [ ] (After backend) Custom policy is saved to database
- [ ] (After backend) Custom policy appears in View Custom Policy tab
- [ ] (After backend) Custom policy affects employee leave balance

---

## 10. SUMMARY

| Aspect | Status | Action Required |
|--------|--------|-----------------|
| **Modal Backdrop Error** | ✅ FIXED | None |
| **Edit Button Toggle** | ❌ Broken | Add click handler |
| **Custom Policy Backend** | ❌ Missing | Create API & schema |
| **Data Persistence** | ❌ Missing | Wire forms to API |
| **UI Organization** | ⚠️ Confusing | Restructure page |
| **Static Mock Data** | ❌ Problem | Replace with real data |
| **Duplicate Modals** | ❌ Problem | Consolidate |
| **Form Validation** | ❌ Missing | Add validation |
| **Loading States** | ❌ Missing | Add spinners |
| **Error Handling** | ❌ Missing | Add toasts |

### Overall Assessment
The Leave Settings page is a **UI shell with no functional backend integration**. The modals open correctly (after the `data-inert` fix), but nothing is saved or processed. The Custom Policy feature is incomplete and should either be fully implemented or removed to avoid user confusion.

### Priority Order
1. ✅ Fix backdrop error (DONE)
2. Add edit button toggle handler
3. Implement backend API for custom policies
4. Wire forms to backend
5. Replace static data with real data
6. Consolidate duplicate modals
7. Improve UI organization

---

**Report Generated:** 2026-02-20
**Component:** LeaveSettings (`leavesettings.tsx`)
**Analyst:** Claude (Sonnet 4.6)
