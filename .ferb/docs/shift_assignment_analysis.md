# Shift & Scheduling System Analysis Report

**Date:** 2026-02-05
**Module:** HRM - Shift & Attendance Management
**Status:** Analysis Complete | Implementation Pending

---

## Executive Summary

The current shift and scheduling system has a **solid foundation** but lacks **complete shift assignment workflow** and **rotation management**. This report provides a comprehensive analysis of the current state, identifies gaps, and outlines a phased implementation plan.

---

## Table of Contents

1. [Current Implementation State](#current-implementation-state)
2. [Business Requirements Analysis](#business-requirements-analysis)
3. [Current Implementation Analysis](#current-implementation-analysis)
4. [Critical Issues & Gaps](#critical-issues--gaps)
5. [Proposed Architecture](#proposed-architecture)
6. [Phased Implementation Plan](#phased-implementation-plan)
7. [UI/UX Requirements](#uiux-requirements)
8. [Data Migration Considerations](#data-migration-considerations)
9. [Testing Strategy](#testing-strategy)

---

## Current Implementation State

### Backend Implementation Status

| Component | Status | File | Coverage |
|-----------|--------|------|----------|
| Shift Schema | ✅ Complete | `backend/models/shift/shift.schema.js` | 100% |
| Employee Schema | ✅ Complete | `backend/models/employee/employee.schema.js` | 70% |
| Shift CRUD API | ✅ Complete | `backend/controllers/rest/shift.controller.js` | 100% |
| Schedule Engine | ⚠️ Partial | `backend/services/shift/scheduleEngine.service.js` | 60% |
| Shift Assignment | ❌ Missing | N/A | 0% |
| Rotation Automation | ❌ Incomplete | N/A | 30% |

### Frontend Implementation Status

| Component | Status | File | Coverage |
|-----------|--------|------|----------|
| Shift Management UI | ✅ Complete | `shiftsManagement.tsx` | 100% |
| Shift Assignment UI | ❌ Missing | N/A | 0% |
| Employee Add/Edit Modal | ❌ No Shift Field | `employeesList.tsx` | 0% |
| Employee Details Page | ❌ No Shift Section | `employeedetails.tsx` | 0% |
| Schedule Timing Page | ✅ Partial | `scheduletiming.tsx` | 50% |

---

## Business Requirements Analysis

### Use Case: Rotating Shift System

**Scenario:** Manufacturing/Healthcare company with 24/7 operations

**Requirements:**
1. Employees work in **shift rotations** (e.g., Day 7 days → Night 7 days → Off 2 days)
2. **Default shift** automatically assigned to all new employees
3. HR can **override** shift assignments for individual employees
4. **Effective date tracking** - shift changes apply from specific dates
5. **Rotation scheduling** - automatic shift changes after X days

### Key Business Questions

| Question | Current State | Gap |
|----------|---------------|-----|
| How do we assign default shift to new employees? | Manual via DB only | ❌ No UI for assignment |
| Can HR change employee shift? | Via API only | ❌ No UI in employee forms |
| How do we track shift history? | Single field only | ❌ No history tracking |
| Can we schedule rotations? | API exists but incomplete | ❌ No rotation execution |
| What shift is employee on TODAY? | Need to calculate | ⚠️ No date-based resolution |

---

## Current Implementation Analysis

### 1. Employee Schema (Backend)

**File:** `backend/models/employee/employee.schema.js`

**Current Shift Fields:**
```javascript
// Shift Assignment (Lines 266-273)
shiftId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Shift',
  index: true
},
shiftEffectiveDate: {
  type: Date
}
```

**Issues:**
- ❌ **No shift history tracking** - Only current shift is stored
- ❌ **No rotation configuration** - Can't specify rotation pattern per employee
- ❌ **No effective date range** - Only single effective date, no end date
- ❌ **No assignment metadata** - Missing: assignedBy, assignedAt, reason

### 2. Shift Schema (Backend)

**File:** `backend/models/shift/shift.schema.js`

**Current Rotation Fields:**
```javascript
// Shift rotation settings (Lines 209-225)
rotation: {
  enabled: {
    type: Boolean,
    default: false
  },
  cycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  rotateAfterDays: {
    type: Number,
    default: 7,
    min: [1, 'Rotation period must be at least 1 day']
  }
}
```

**Issues:**
- ⚠️ **Rotation defined at shift level** - Should be at employee-assignment level
- ❌ **No rotation sequence** - Doesn't specify which shifts to rotate between
- ❌ **No auto-execution** - Pattern defined but no cron/scheduler to execute

### 3. Schedule Engine (Backend)

**File:** `backend/services/shift/scheduleEngine.service.js`

**Available Functions:**

| Function | Status | Issue |
|----------|--------|-------|
| `getShiftSchedule()` | ✅ Works | Returns current assignment only |
| `autoAssignDefaultShift()` | ✅ Works | One-time bulk assignment |
| `applyRotationPattern()` | ⚠️ Incomplete | Sets pattern but doesn't execute rotation |
| `getShiftCoverageReport()` | ✅ Works | Good for reporting |
| `previewAutoSchedule()` | ✅ Works | Preview only, no apply |

**Critical Gap:**
```javascript
// applyRotationPattern (Lines 132-202) - Sets up pattern BUT:
// 1. Doesn't create actual schedule for future dates
// 2. Doesn't handle "Day 7, Night 7" rotation
// 3. No background job to execute rotations
// 4. Manual intervention required to rotate
```

### 4. Frontend - Employee Forms

**Files:**
- `react/src/feature-module/hrm/employees/employeesList.tsx`
- `react/src/feature-module/hrm/employees/employeedetails.tsx`

**Issues:**
- ❌ **No shift selection in Add Employee modal**
- ❌ **No shift selection in Edit Employee modal**
- ❌ **No shift display in Employee Details page**
- ❌ **No shift history visible**

---

## Critical Issues & Gaps

### Priority 1: Critical (Blocks Core Functionality)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **No shift assignment in employee forms** | HR cannot assign shifts via UI | Medium |
| 2 | **No shift history tracking** | Cannot audit past changes | High |
| 3 | **Rotation not executable** | Pattern stored but never runs | High |
| 4 | **No date-based shift resolution** | Cannot determine "What shift TODAY?" | High |

### Priority 2: High (Limits Usability)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 5 | **No bulk assignment UI** | Must assign one-by-one | Medium |
| 6 | **No shift change notifications** | Employees unaware of changes | Low |
| 7 | **No rotation preview calendar** | Can't visualize future shifts | Medium |

### Priority 3: Medium (Nice to Have)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 8 | **No shift swap workflow** | Employees cannot trade shifts | High |
| 9 | **No overtime rules per shift** | Using default rules only | Low |
| 10 | **No shift conflict detection** | Can double-book employees | Medium |

---

## Proposed Architecture

### New Data Model: Employee Shift Assignment

```javascript
// NEW COLLECTION: EmployeeShiftAssignment
{
  _id: ObjectId,
  companyId: ObjectId,
  employeeId: ObjectId,           // Reference to Employee

  // Shift Assignment
  shiftId: ObjectId,              // Reference to Shift
  effectiveStartDate: Date,       // When this assignment starts
  effectiveEndDate: Date,         // When this assignment ends (nullable)

  // Rotation Configuration (Optional)
  rotationEnabled: Boolean,
  rotationPattern: {
    type: String,                 // 'cyclic', 'sequential', 'custom'
    sequence: [ObjectId],         // Shift IDs in rotation order
    cycleDuration: Number,        // Days per shift (e.g., 7)
    startDate: Date,              // When rotation starts
    currentShiftIndex: Number     // Tracks position in sequence
  },

  // Metadata
  assignedBy: ObjectId,           // User who made assignment
  assignedAt: Date,               // When assignment was made
  reason: String,                 // Optional reason
  isActive: Boolean,

  timestamps: true
}
```

### New API Endpoints

```
POST   /api/employees/:employeeId/shift-assign     - Assign shift
PUT    /api/employees/:employeeId/shift-change     - Change shift
GET    /api/employees/:employeeId/shift-history    - Get shift history
GET    /api/employees/:employeeId/shift-current    - Get current shift for date
DELETE /api/employees/:employeeId/shift/:assignmentId - Remove assignment

POST   /api/schedule/rotation-setup                - Setup rotation
POST   /api/schedule/rotation-execute              - Execute rotation (cron)
GET    /api/schedule/rotation-preview/:employeeId  - Preview rotation calendar
```

---

## Phased Implementation Plan

### Phase 1: Foundation (Week 1-2) ✅ Core Functionality

**Goal:** Enable basic shift assignment via employee forms

**Tasks:**
1. ✅ **Backend: Employee Shift Assignment Collection**
   - Create `EmployeeShiftAssignment` schema
   - Add indices for performance
   - Create migration for existing data

2. ✅ **Backend: Assignment API**
   - `POST /api/employees/:id/shift-assign` - Assign shift with effective date
   - `GET /api/employees/:id/shift-history` - Get assignment history
   - `GET /api/employees/:id/shift-current` - Get current shift

3. ✅ **Frontend: Add Shift to Employee Modals**
   - Add shift dropdown to "Add Employee" modal
   - Add shift dropdown to "Edit Employee" modal
   - Add effective date picker

4. ✅ **Frontend: Employee Details Shift Section**
   - Display current shift with details
   - Show shift history timeline
   - Add "Change Shift" button

**Deliverables:**
- HR can assign shift when creating employee
- HR can change shift from employee details
- Shift history is visible

---

### Phase 2: Rotation Engine (Week 3-4) 🔄 Automation

**Goal:** Implement executable rotation system

**Tasks:**
1. ✅ **Backend: Rotation Configuration**
   - Store rotation pattern per employee-assignment
   - Support cyclic sequences (Day → Night → Off)
   - Define cycle duration (e.g., 7 days)

2. ✅ **Backend: Rotation Execution Engine**
   - Create background job (cron) to check rotations
   - Calculate next shift based on cycle
   - Auto-create new assignments on rotation date
   - Send notifications on rotation

3. ✅ **Backend: Date-Based Shift Resolution**
   - `GET /api/employees/:id/shift-for-date?date=YYYY-MM-DD`
   - Algorithm: Find assignment where date falls in range
   - Handle rotation: Calculate position in cycle

4. ✅ **Frontend: Rotation Setup UI**
   - "Setup Rotation" modal in employee details
   - Select shifts in rotation order
   - Set cycle duration (days)
   - Preview calendar showing rotation

**Deliverables:**
- Rotating shifts automatically change
- Calendar preview of future shifts
- Employees notified of rotations

---

### Phase 3: Bulk Operations (Week 5) 📦 Efficiency

**Goal:** Enable mass shift management

**Tasks:**
1. ✅ **Backend: Bulk Assignment API**
   - `POST /api/shifts/bulk-assign` - Assign to multiple employees
   - Support CSV upload
   - Validation & rollback support

2. ✅ **Frontend: Bulk Assignment Modal**
   - Multi-select employees
   - Select shift + effective date
   - Preview before applying

3. ✅ **Frontend: Schedule Calendar View**
   - Monthly calendar showing shifts
   - Filter by department/shift
   - Drag-drop to reassign

**Deliverables:**
- Assign 100+ employees at once
- Visual schedule calendar

---

### Phase 4: Advanced Features (Week 6) 🎯 Polish

**Goal:** Complete workflow with notifications & reporting

**Tasks:**
1. ✅ **Shift Swap Workflow**
   - Employee requests swap
   - Manager approval
   - Automatic schedule update

2. ✅ **Notification System**
   - Email/In-app for shift changes
   - Reminders for upcoming rotations
   - Calendar integration (iCal feeds)

3. ✅ **Reporting Enhancements**
   - Shift coverage heatmap
   - Cost analysis by shift
   - Overtime trends by shift

**Deliverables:**
- Complete shift management system
- Employee self-service capabilities

---

## UI/UX Requirements

### 1. Add Employee Modal - New Section

```tsx
<div className="row">
  {/* Shift Assignment Section */}
  <div className="col-md-6">
    <label className="form-label">Shift Assignment *</label>
    <Select
      options={shiftsOptions}
      value={selectedShift}
      onChange={handleShiftChange}
      placeholder="Select Shift"
    />
    <small className="text-muted">
      Default shift: {defaultShift?.name} ({defaultShift?.timing})
    </small>
  </div>

  <div className="col-md-6">
    <label className="form-label">Effective From *</label>
    <DatePicker
      selected={effectiveDate}
      onChange={setEffectiveDate}
      minDate={new Date()}
    />
  </div>
</div>

{/* Rotation Option (Advanced) */}
<div className="form-check mt-2">
  <input
    type="checkbox"
    className="form-check-input"
    id="enableRotation"
    checked={enableRotation}
    onChange={(e) => setEnableRotation(e.target.checked)}
  />
  <label className="form-check-label" htmlFor="enableRotation">
    Enable Shift Rotation
  </label>
</div>

{enableRotation && (
  <div className="mt-3 p-3 border rounded">
    <h6>Configure Rotation</h6>
    {/* Rotation configuration UI */}
  </div>
)}
```

### 2. Employee Details Page - Shift Section

```tsx
<div className="card mt-3">
  <div className="card-header">
    <h5>Shift Assignment</h5>
    <button
      className="btn btn-sm btn-primary"
      onClick={openChangeShiftModal}
    >
      Change Shift
    </button>
  </div>
  <div className="card-body">
    {/* Current Shift Display */}
    <div className="d-flex align-items-center">
      <div
        className="shift-color-box me-3"
        style={{ backgroundColor: currentShift.color }}
      />
      <div>
        <h6>{currentShift.name}</h6>
        <p className="mb-0">
          <i className="ti ti-clock" /> {currentShift.startTime} - {currentShift.endTime}
          <span className="ms-3">
            <i className="ti ti-calendar" /> Since: {effectiveDate}
          </span>
        </p>
      </div>
    </div>

    {/* Rotation Timeline */}
    {hasRotation && (
      <div className="mt-3">
        <h6>Rotation Schedule</h6>
        <div className="rotation-timeline">
          {/* Visual timeline of future shifts */}
        </div>
      </div>
    )}

    {/* Shift History */}
    <div className="mt-4">
      <h6>Assignment History</h6>
      <table className="table">
        <thead>
          <tr>
            <th>Shift</th>
            <th>Period</th>
            <th>Assigned By</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {history.map(h => (
            <tr key={h._id}>
              <td>{h.shiftName}</td>
              <td>{h.startDate} - {h.endDate || 'Present'}</td>
              <td>{h.assignedBy}</td>
              <td>{h.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>
```

### 3. Shift Change Modal

```tsx
<Modal show={showChangeShiftModal} onHide={closeModal}>
  <Modal.Header>
    <Modal.Title>Change Shift Assignment</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      {/* Current Shift Info */}
      <Alert variant="info">
        Current: {currentShift.name} ({currentShift.timing})
      </Alert>

      {/* New Shift Selection */}
      <Form.Group>
        <Form.Label>New Shift</Form.Label>
        <Select options={availableShifts} />
      </Form.Group>

      {/* Effective Date */}
      <Form.Group>
        <Form.Label>Effective From</Form.Label>
        <DatePicker
          minDate={new Date()}
          selected={effectiveDate}
        />
      </Form.Group>

      {/* Reason */}
      <Form.Group>
        <Form.Label>Reason for Change</Form.Label>
        <textarea
          className="form-control"
          placeholder="Optional: Explain why this change is needed"
        />
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={closeModal}>Cancel</Button>
    <Button variant="primary" onClick={saveShiftChange}>
      Save Changes
    </Button>
  </Modal.Footer>
</Modal>
```

---

## Data Migration Considerations

### Migrate Existing Single Assignments

**Current State:** Employees have `shiftId` field directly in employee document

**Migration Script:**
```javascript
// backend/migrations/migrateShiftAssignments.js
export async function migrateShiftAssignments() {
  const collections = await getTenantCollections();

  // Find all employees with shiftId
  const employees = await collections.employees.find({
    shiftId: { $exists: true, $ne: null }
  }).toArray();

  const assignments = employees.map(emp => ({
    companyId: emp.companyId,
    employeeId: emp._id,
    shiftId: emp.shiftId,
    effectiveStartDate: emp.shiftEffectiveDate || emp.joiningDate,
    effectiveEndDate: null, // Still active
    rotationEnabled: false,
    assignedBy: emp.createdBy,
    assignedAt: emp.createdAt,
    isActive: true,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt
  }));

  // Insert into new collection
  await collections.employeeShiftAssignments.insertMany(assignments);

  // Optional: Remove old fields from employee
  await collections.employees.updateMany(
    { _id: { $in: employees.map(e => e._id) } },
    { $unset: { shiftId: 1, shiftEffectiveDate: 1 } }
  );
}
```

---

## Testing Strategy

### Unit Tests

```javascript
// tests/shift/assignment.test.js
describe('Shift Assignment', () => {
  test('should assign default shift to new employee', async () => {
    // Test automatic default assignment
  });

  test('should track shift history', async () => {
    // Test history creation on change
  });

  test('should resolve correct shift for date', async () => {
    // Test date-based resolution
  });

  test('should execute rotation on schedule', async () => {
    // Test rotation execution
  });
});
```

### Integration Tests

```javascript
// tests/shift/rotation.e2e.test.js
describe('Rotation E2E', () => {
  test('7-day rotation creates correct schedule', async () => {
    // Setup: Employee on rotation
    // Execute: Run rotation job
    // Assert: New assignments created
  });
});
```

### Manual Testing Checklist

- [ ] Create employee with default shift
- [ ] Change employee shift via edit modal
- [ ] Verify shift history shows both assignments
- [ ] Setup 7-day rotation (Day/Night)
- [ ] Run rotation job manually
- [ ] Verify new assignment created
- [ ] Check employee sees correct shift "today"
- [ ] Bulk assign shift to 10 employees
- [ ] View shift calendar for department

---

## Summary & Next Steps

### Immediate Actions (This Week)

1. ✅ **Create EmployeeShiftAssignment schema**
2. ✅ **Build assignment API endpoints**
3. ✅ **Add shift dropdown to Add Employee modal**
4. ✅ **Add shift section to Employee Details page**

### Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Shift Assignment via UI | 100% | 0% |
| Shift History Tracking | 100% | 0% |
| Rotation Automation | 100% | 30% |
| Bulk Assignment | 100% | 0% |

---

**Report Prepared By:** Claude AI
**Version:** 1.0
**Last Updated:** 2026-02-05
