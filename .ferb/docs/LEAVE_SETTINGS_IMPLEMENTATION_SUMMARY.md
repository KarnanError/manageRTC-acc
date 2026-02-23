# Leave Settings Implementation Summary

**Date:** 2026-02-20
**Status:** ✅ Implementation Complete

---

## Overview

The Leave Settings page has been enhanced with full CRUD functionality for Leave Types and Custom Policies. The implementation includes dynamic data loading from the backend API, form state management, and proper modal handling.

---

## Files Modified

### 1. `react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx`

**Changes Made:**

1. **Imports Updated:**
   - Added `LeaveType` import from `useLeaveTypesREST`
   - Added state imports for form management

2. **New State Variables:**
   ```typescript
   // Custom Policy Form State
   const [policyFormData, setPolicyFormData] = useState<CustomPolicyFormData>({
     name: '',
     leaveType: '',
     days: 0,
     employeeIds: [],
     settings: {
       carryForward: false,
       maxCarryForwardDays: 0,
       isEarnedLeave: false
     }
   });

   // Leave Type Settings State
   const [leaveTypeSettings, setLeaveTypeSettings] = useState({
     annualQuota: 0,
     carryForwardAllowed: false,
     maxCarryForwardDays: 0,
     isEarnedLeave: false
   });
   ```

3. **New Handler Functions:**

   - **`openAddCustomPolicyModal(leaveType: string)`**
     - Opens the "Add Custom Policy" modal with pre-selected leave type
     - Resets form data and clears selected employees

   - **`openEditLeaveTypeSettings(leaveTypeKey: string)`**
     - Opens the Leave Type Settings modal for editing
     - Loads existing leave type configuration

   - **`handleSaveLeaveTypeSettings()`**
     - Saves the leave type settings to the backend
     - Calls `updateLeaveType()` API method

4. **"Custom Policy" Link Handler:**
   - Each leave type card's "Custom Policy" link now:
     - Pre-selects the leave type in the modal
     - Opens the modal using Bootstrap API
     - Passes the leave type to the form state

5. **"Add Custom Policy" Modal (id="new_custom_policy"):**
   - Form inputs wired to `policyFormData` state
   - Leave Type dropdown with pre-selected value
   - Policy Name input (required)
   - No of Days input (number, required)
   - Employee PickList for multi-select
   - Carry Forward checkbox
   - Earned Leave checkbox
   - Form submission handler that calls `createPolicy()`

6. **Annual Leave Settings Modal (id="annual_leave_settings"):**

   **Settings Tab:**
   - No of Days input → `leaveTypeSettings.annualQuota`
   - Carry Forward radio buttons → `leaveTypeSettings.carryForwardAllowed`
   - Maximum No of Days input → `leaveTypeSettings.maxCarryForwardDays`
   - Earned Leave radio buttons → `leaveTypeSettings.isEarnedLeave`
   - Save Changes button → calls `handleSaveLeaveTypeSettings()`

   **View Custom Policy Tab:**
   - Replaced static policy cards with `CustomPolicyCards` component
   - Shows dynamic custom policies for "earned" leave type
   - Edit/Delete handlers properly wired

7. **Other Leave Type Modals:**
   - All other "View Custom Policy" tabs updated with `CustomPolicyCards` component:
     - Sick Leave (`policy-one`) → leaveType="sick"
     - Casual Leave (`policy-two`) → leaveType="casual"
     - Maternity Leave (`policy-three`) → leaveType="maternity"
     - Paternity Leave (`policy-four`) → leaveType="paternity"
     - Bereavement Leave (`policy-five`) → leaveType="bereavement"

---

## How It Works

### Creating a Custom Policy

1. User clicks "Custom Policy" link on a leave type card
2. Modal opens with leave type pre-selected
3. User fills in:
   - Policy Name (e.g., "Senior Staff Policy")
   - No of Days (e.g., 30)
   - Selects employees from PickList
   - Optionally enables Carry Forward
   - Optionally enables Earned Leave
4. On submit, `createPolicy()` is called with form data
5. Modal closes and policies list refreshes

### Editing Leave Type Settings

1. User clicks the settings icon on a leave type card
2. Settings modal opens with current configuration
3. User modifies:
   - No of Days (annual quota)
   - Carry Forward setting
   - Maximum Carry Forward Days
   - Earned Leave setting
4. On "Save Changes", `handleSaveLeaveTypeSettings()` calls the backend API
5. Leave type is updated and settings are applied

### Viewing Custom Policies

1. User clicks the settings icon and switches to "View Custom Policy" tab
2. `CustomPolicyCards` component renders policies filtered by leave type
3. Each policy card shows:
   - Policy Name
   - No of Days
   - Assigned employee avatars
   - Edit button
   - Delete button
4. Edit opens the edit modal with policy data
5. Delete prompts for confirmation before removing

---

## Data Flow

```
Leave Settings Page
├── useLeaveTypesREST Hook
│   └── Fetches active leave types for dropdown display
├── useEmployeesREST Hook
│   └── Fetches employees for PickList selection
└── useCustomPolicies Hook
    ├── fetchPolicies() - Loads all custom policies
    ├── createPolicy() - Creates new policy
    ├── updatePolicy() - Updates existing policy
    └── deletePolicy() - Deletes policy
```

---

## API Integration

### Backend Endpoints Used

1. **Custom Policies:**
   - `GET /api/leave/custom-policies` - Get all policies
   - `POST /api/leave/custom-policies` - Create new policy
   - `PUT /api/leave/custom-policies/:id` - Update policy
   - `DELETE /api/leave/custom-policies/:id` - Delete policy

2. **Leave Types:**
   - `GET /api/leave-types/active` - Get active leave types
   - `PUT /api/leave-types/:id` - Update leave type settings

---

## Key Components

### CustomPolicyCards Component

```typescript
<CustomPolicyCards
  policies={policies}              // Array of all policies
  leaveType="earned"               // Filter by leave type
  employees={employees}            // Employee data for avatars
  onEdit={openEditModal}           // Edit handler
  onDelete={handleDeletePolicy}    // Delete handler
/>
```

**Features:**
- Filters policies by leave type
- Shows employee avatars using `employeeId` lookup
- Displays "No custom policies" message when empty
- Edit/Delete buttons with proper handlers

---

## User Experience Improvements

1. **Pre-selected Leave Type:** Clicking "Custom Policy" on a leave type card pre-selects that type
2. **Dynamic Employee Selection:** PickList allows selecting multiple employees
3. **Real-time State Updates:** Form inputs update state immediately
4. **Bootstrap Modal Integration:** Uses Bootstrap's Modal API for proper show/hide
5. **Responsive Design:** All modals are responsive and work on mobile devices

---

## Testing Checklist

- ✅ Add Custom Policy modal opens with pre-selected leave type
- ✅ Form submission creates policy successfully
- ✅ Custom Policies appear in "View Custom Policy" tab
- ✅ Edit button opens policy with data
- ✅ Delete button removes policy after confirmation
- ✅ Leave Type Settings modal shows current configuration
- ✅ Save Changes button updates leave type settings
- ✅ Employee PickList allows multi-selection
- ✅ Carry Forward and Earned Leave checkboxes work
- ✅ All leave type modals (Annual, Sick, Casual, Maternity, Paternity, Bereavement) have dynamic policy cards

---

## Future Enhancements

1. **Per-Employee Leave Balance Display:** Show calculated pending leave days for each employee in the policy cards
2. **Settings Tab for All Leave Types:** Currently only Annual Leave Settings tab is wired up - other leave types need similar updates
3. **Edit Policy Modal:** Create a dedicated modal for editing custom policies (currently uses inline edit form)
4. **Validation:** Add form validation for required fields and data ranges
5. **Success/Error Messages:** Improve user feedback with toast notifications

---

## Notes

- The file is still large (3,800+ lines) due to multiple leave type modals
- Static mock data has been replaced with dynamic `CustomPolicyCards` component
- The Settings tab for Annual Leave is fully wired up; other leave types can follow the same pattern
- Leave balance calculation is handled by the backend's `getEmployeeLeaveBalance()` function which checks for custom policies first

---

## Related Files

- `react/src/hooks/useCustomPolicies.ts` - Custom policies REST hook
- `backend/routes/api/leave/customPolicies.js` - Custom policies API routes
- `backend/controllers/leaves/customLeavePolicy.controller.js` - Request handlers
- `backend/services/leaves/customLeavePolicy.service.js` - Business logic
- `backend/models/leave/customLeavePolicy.schema.js` - Database schema
- `backend/controllers/rest/leave.controller.js` - Leave balance integration
