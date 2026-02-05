# Shift & Scheduling System Analysis Report (Batch-Based Architecture)

**Date:** 2026-02-05
**Module:** HRM - Shift & Attendance Management
**Status:** Analysis Complete | Implementation Pending
**Architecture:** Batch-Based Employee Grouping

---

## Executive Summary

The shift and scheduling system will use a **Batch-Based Architecture** where employees are organized into **batches** (groups), and shifts are assigned to batches rather than individual employees. This approach simplifies:

- **Bulk shift management** - Change shift for entire batch at once
- **Rotation scheduling** - Rotate entire batches together
- **Clearer organization** - Visual grouping by shift cycle
- **Flexible configuration** - Different rotation patterns per batch

---

## Architecture Overview

### New Entity Relationship

```
┌─────────────┐
│   Shift     │ (Day Shift, Night Shift, etc.)
│ - startTime │
│ - endTime   │
│ - duration  │
└──────┬──────┘
       │
       │ assigned to
       ▼
┌─────────────┐
│    Batch    │ (Batch A, Batch B, etc.)
│ - name      │
│ - code      │
│ - shiftId   │
│ - rotation  │
└──────┬──────┘
       │
       │ contains
       ▼
┌─────────────┐
│  Employee   │
│ - firstName │
│ - batchId   │ ← References Batch
└─────────────┘
```

### Key Concepts

| Concept | Description | Example |
|---------|-------------|---------|
| **Shift** | Work time definition | Day Shift: 09:00-18:00 |
| **Batch** | Group of employees with same schedule | "Batch A - Production Line 1" |
| **Batch Assignment** | Links batch to shift + rotation | Batch A → Day Shift (7 days) → Night Shift (7 days) |
| **Employee Assignment** | Employee belongs to one batch | John Doe → Batch A |

---

## Data Model

### 1. Batch Schema (NEW)

```javascript
// backend/models/shift/batch.schema.js

const batchSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Batch identification
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  description: {
    type: String,
    maxlength: 500
  },

  // Current shift assignment
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  shiftEffectiveFrom: {
    type: Date,
    default: Date.now
  },

  // Rotation configuration
  rotationEnabled: {
    type: Boolean,
    default: false
  },
  rotationPattern: {
    type: {
      // Rotation type: 'cyclic' (A→B→C→A) or 'sequential' (A→B→C)
      mode: {
        type: String,
        enum: ['cyclic', 'sequential'],
        default: 'cyclic'
      },
      // Shifts to rotate through (ordered)
      shiftSequence: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift'
      }],
      // Duration for each shift in rotation
      daysPerShift: {
        type: Number,
        default: 7,
        min: 1
      },
      // When rotation starts
      startDate: {
        type: Date,
        default: Date.now
      },
      // Current position in sequence
      currentIndex: {
        type: Number,
        default: 0
      }
    },
    _meta: {} // Store only if rotationEnabled is true
  },

  // Employee capacity (optional)
  capacity: {
    type: Number,
    default: null // null = unlimited
  },

  // Department filter (optional - restrict batch to dept)
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },

  // Color coding for UI
  color: {
    type: String,
    default: '#1890ff'
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
batchSchema.index({ companyId: 1, isActive: 1 });
batchSchema.index({ companyId: 1, shiftId: 1 });
batchSchema.index({ companyId: 1, departmentId: 1 });

// Methods

// Get current shift for this batch
batchSchema.methods.getCurrentShift = function() {
  if (!this.rotationEnabled) {
    return this.shiftId;
  }

  // Calculate current position based on rotation
  const daysSinceStart = Math.floor(
    (Date.now() - this.rotationPattern.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalCycleDays = this.rotationPattern.shiftSequence.length * this.rotationPattern.daysPerShift;
  const positionInCycle = daysSinceStart % totalCycleDays;
  const shiftIndex = Math.floor(positionInCycle / this.rotationPattern.daysPerShift);

  return this.rotationPattern.shiftSequence[shiftIndex % this.rotationPattern.shiftSequence.length];
};

// Get shift for a specific date
batchSchema.methods.getShiftForDate = function(date) {
  if (!this.rotationEnabled) {
    return this.shiftId;
  }

  const targetDate = new Date(date);
  const daysSinceStart = Math.floor(
    (targetDate - this.rotationPattern.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalCycleDays = this.rotationPattern.shiftSequence.length * this.rotationPattern.daysPerShift;
  const positionInCycle = daysSinceStart % totalCycleDays;
  const shiftIndex = Math.floor(positionInCycle / this.rotationPattern.daysPerShift);

  return this.rotationPattern.shiftSequence[shiftIndex % this.rotationPattern.shiftSequence.length];
};

// Get rotation schedule for date range
batchSchema.methods.getRotationSchedule = function(startDate, endDate) {
  if (!this.rotationEnabled) {
    return [{
      shiftId: this.shiftId,
      startDate: startDate,
      endDate: endDate
    }];
  }

  const schedule = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate initial position
  const daysSinceStart = Math.floor(
    (start - this.rotationPattern.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalCycleDays = this.rotationPattern.shiftSequence.length * this.rotationPattern.daysPerShift;

  let currentDate = new Date(start);
  while (currentDate <= end) {
    const positionInCycle = daysSinceStart % totalCycleDays;
    const shiftIndex = Math.floor(positionInCycle / this.rotationPattern.daysPerShift);
    const shiftId = this.rotationPattern.shiftSequence[shiftIndex % this.rotationPattern.shiftSequence.length];

    const periodStart = new Date(currentDate);
    const daysUntilNextShift = this.rotationPattern.daysPerShift - (positionInCycle % this.rotationPattern.daysPerShift);
    const periodEnd = new Date(currentDate);
    periodEnd.setDate(periodEnd.getDate() + daysUntilNextShift - 1);

    if (periodEnd > end) {
      periodEnd.setTime(end.getTime());
    }

    schedule.push({
      shiftId,
      startDate: periodStart,
      endDate: periodEnd,
      shiftIndex: shiftIndex % this.rotationPattern.shiftSequence.length
    });

    // Move to next period
    currentDate = new Date(periodEnd);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
};

export default mongoose.model('Batch', batchSchema);
```

### 2. Employee Schema Updates

```javascript
// backend/models/employee/employee.schema.js

// ADD new field:
batchId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Batch',
  index: true
},

// REMOVE old fields (or mark for migration):
// shiftId: { ... } - Will be derived from batch
// shiftEffectiveDate: { ... } - Will be derived from batch

// ADD virtual for current shift
employeeSchema.virtual('currentShift').get(function() {
  // Will be populated when querying with batch population
  return this._currentShift;
});

// ADD virtual for shift details
employeeSchema.virtual('shiftDetails').get(function() {
  // Will be populated when querying with batch.shift population
  return this._shiftDetails;
});
```

### 3. Batch Assignment History Schema

```javascript
// backend/models/shift/batchAssignmentHistory.schema.js

const batchAssignmentHistorySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },

  // What shift was assigned
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },

  // Effective period
  effectiveStartDate: {
    type: Date,
    required: true
  },
  effectiveEndDate: {
    type: Date,
    default: null // null if current
  },

  // Rotation snapshot (if applicable)
  rotationSnapshot: {
    enabled: Boolean,
    mode: String,
    shiftSequence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }],
    daysPerShift: Number,
    currentIndex: Number
  },

  // Metadata
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  reason: {
    type: String,
    maxlength: 500
  },
  changeType: {
    type: String,
    enum: ['initial', 'rotation', 'manual', 'batch_created', 'batch_deleted'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Indexes
batchAssignmentHistorySchema.index({ batchId: 1, effectiveStartDate: -1 });
batchAssignmentHistorySchema.index({ companyId: 1, shiftId: 1 });

export default mongoose.model('BatchAssignmentHistory', batchAssignmentHistorySchema);
```

---

## API Endpoints

### Batch Management

```
POST   /api/batches                          - Create new batch
GET    /api/batches                          - List all batches (with employee counts)
GET    /api/batches/:id                       - Get batch details
PUT    /api/batches/:id                       - Update batch
DELETE /api/batches/:id                       - Delete/Deactivate batch
POST   /api/batches/:id/assign-shift          - Assign shift to batch
POST   /api/batches/:id/setup-rotation        - Setup rotation for batch
DELETE /api/batches/:id/rotation              - Remove rotation from batch
GET    /api/batches/:id/schedule              - Get rotation schedule (calendar view)
GET    /api/batches/:id/employees             - List employees in batch
GET    /api/batches/:id/history               - Get batch shift assignment history
```

### Employee Batch Assignment

```
POST   /api/employees/:id/assign-batch        - Assign employee to batch
DELETE /api/employees/:id/batch               - Remove from batch
POST   /api/employees/batch-assign            - Bulk assign employees to batch
POST   /api/employees/batch-transfer          - Transfer employees between batches
GET    /api/employees/batch-unassigned        - Get employees without batch
```

### Schedule & Reporting

```
GET    /api/schedule/batches                  - Get all batch schedules
GET    /api/schedule/batches/:id/preview      - Preview rotation calendar
GET    /api/schedule/employees/:id/today      - Get employee's shift for today
GET    /api/schedule/coverage                 - Get shift coverage by batch
POST   /api/schedule/rotation-execute         - Execute rotation (cron job)
GET    /api/schedule/upcoming-rotations       - Get upcoming rotation dates
```

---

## UI/UX Design

### 1. Batch Management Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📦 Batch Management                                    [+ New Batch]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  Search: [____________]  Filter: [All Batches ▼]  Department: [All▼] │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🟦 Batch A - Production Line 1                         [Edit] [⋮]   │ │
│ │    Day Shift (09:00-18:00) • 45 employees                          │ │
│ │    🔄 Rotation: Day 7d → Night 7d → Off 2d                          │ │
│ │    Next rotation: Feb 12, 2026                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🟪 Batch B - Production Line 2                         [Edit] [⋮]   │ │
│ │    Night Shift (21:00-06:00) • 42 employees                        │ │
│ │    🔄 Rotation: Night 7d → Day 7d → Off 2d                         │ │
│ │    Next rotation: Feb 10, 2026                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🟩 General Staff (No Rotation)                         [Edit] [⋮]   │ │
│ │    General Shift (08:00-17:00) • 120 employees                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Create/Edit Batch Modal

```
┌─────────────────────────────────────────────────────────────┐
│ [Create Batch]                                    [X]        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Batch Information                                            │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Batch Name *:  [________________________________]      │  │
│ │ Batch Code:    [__________] (e.g., BATCH-A)            │  │
│ │ Description:   [________________________________]      │  │
│ │               [________________________________]      │  │
│ │ Department:    [All Departments ▼]                      │  │
│ │ Color:         [■] #1890ff                              │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ Shift Assignment                                             │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Current Shift *: [Day Shift ▼]                          │  │
│ │                     ▼                                   │  │
│ │                   [Select Shift...]                     │  │
│ │                                                            │
│ │ 📋 Shift Details:                                         │  │
│ │    • Time: 09:00 - 18:00                                 │  │
│ │    • Duration: 8 hours                                   │  │
│ │    • Grace Period: 15 min                                │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ Rotation Configuration (Optional)                             │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ ☐ Enable Rotation for this batch                        │  │
│ │                                                            │  │
│ │ When enabled:                                             │  │
│ │                                                            │  │
│ │ Rotation Pattern: [Cyclic ▼]                              │  │
│ │   ○ Cyclic (A → B → C → A ...)                           │  │
│ │   ○ Sequential (A → B → C)                                │  │
│ │                                                            │  │
│ │ Shift Sequence (Drag to reorder):                         │  │
│ │ ┌──────────────────────────────────────────────────────┐ │  │
│ │ │ 1. [Day Shift ▼]         [7 days per shift ▼]    [×]│ │  │
│ │ │ 2. [Night Shift ▼]       [7 days per shift ▼]    [×]│ │  │
│ │ │ 3. [Off ▼]               [2 days per shift ▼]    [×]│ │  │
│ │ │ [+ Add Shift to Rotation]                             │ │  │
│ │ └──────────────────────────────────────────────────────┘ │  │
│ │                                                            │  │
│ │ Rotation Start Date: [📅 Feb 5, 2026]                    │  │
│ │                                                            │  │
│ │ 📅 Preview:                                               │  │
│ │ ┌──────────────────────────────────────────────────────┐ │  │
│ │ │ Feb 5-11:   🟦 Day Shift                              │ │  │
│ │ │ Feb 12-18:  🟪 Night Shift                            │ │  │
│ │ │ Feb 19-20:  ⬜ Off                                    │ │  │
│ │ │ Feb 21-27:  🟦 Day Shift                              │ │  │
│ │ └──────────────────────────────────────────────────────┘ │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ Employee Assignment                                          │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ ☐ Add employees immediately after creating              │  │
│ │                                                            │  │
│ │ Or add later from:                                        │  │
│ │ • Employee List page                                     │  │
│ │ • Employee Details page                                  │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│                        [Cancel]  [Create Batch]              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Employee Details - Batch Section

```
┌─────────────────────────────────────────────────────────────────┐
│ EMPLOYEE: John Doe                                              │
├─────────────────────────────────────────────────────────────────┤
│ 📋 Personal | 🏢 Work | 📦 BATCH & SCHEDULE                    │
│                                                                  │
│ ━━━ Current Batch Assignment ━━━                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🟦 Batch A - Production Line 1                              │ │
│ │                                                              │ │
│ │ Current Shift: Day Shift (09:00 - 18:00)                    │ │
│ │                                                              │ │
│ │ Rotation Schedule:                                          │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Feb 5-11:   🟦 Day Shift ← Today                        │ │ │
│ │ │ Feb 12-18:  🟪 Night Shift                              │ │ │
│ │ │ Feb 19-20:  ⬜ Off                                      │ │ │
│ │ │ Feb 21-27:  🟦 Day Shift                                │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                              │ │
│ │                                    [Change Batch] [View Full]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ━━━ Assignment History ━━━                                    │
│ │ Date        | Batch        | Shift          | Changed By    │
│ │ Jan 15, 26  | Batch A      | Day Shift      | Admin         │
│ │ Nov 1, 25   | General      | General Shift  | HR Manager    │
│ └──────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

### 4. Add Employee Modal - Batch Selection

```
┌─────────────────────────────────────────────────────────────────┐
│ [+ ADD EMPLOYEE]                                                 │
├─────────────────────────────────────────────────────────────────┤
│ First Name: [John]                Last Name: [Doe]              │
│ Email: [john@example.com]        Department: [Production ▼]    │
│                                                                  │
│ ━━━ Batch Assignment (Optional) ━━━                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                              │ │
│ │ Assign to Batch:                                            │ │
│ │ ○ No Batch (Unassigned)                                     │ │
│ │ ● Batch A - Production Line 1 (Day Shift - 45 employees)    │ │
│ │ ○ Batch B - Production Line 2 (Night Shift - 42 employees)  │ │
│ │ ○ General Staff (General Shift - 120 employees)             │ │
│ │                                                              │ │
│ │ [+ Create New Batch]                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ━━━ Shift Information (Auto-filled from Batch) ━━━           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Selected Batch: Batch A - Production Line 1                 │ │
│ │                                                              │ │
│ │ Current Shift: Day Shift                                    │ │
│ │ • Time: 09:00 - 18:00                                       │ │
│ │ • Rotation: Enabled (Day 7d → Night 7d → Off 2d)            │ │
│ │ • Next Rotation: Feb 12, 2026                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                        [Cancel]        [Save Employee]          │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Batch Rotation Calendar

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📅 Batch A - Rotation Schedule                          [Month] [Year ▼]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│     January 2026                        February 2026                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Mon   Tue   Wed   Thu   Fri   Sat   Sun                         │  │
│  │                                                                   │  │
│  │  1     2     3     4     5     6     7                            │  │
│  │  🟦    🟦    🟦    🟦    🟦    🟦    🟦   ← Day 7d              │  │
│  │                                                                   │  │
│  │  8     9    10    11    12    13    14                           │  │
│  │  🟪    🟪    🟪    🟪    🟪    🟪    🟪   ← Night 7d            │  │
│  │                                                                   │  │
│  │  15    16    17    18    19    20    21                           │  │
│  │  ⬜    ⬜    🟦    🟦    🟦    🟦    🟦   ← Off 2d then Day       │  │
│  │                                                                   │  │
│  │  22    23    24    25    26    27    28                           │  │
│  │  🟦    🟦    🟦    🟦    🟪    🟪    🟪   ← Rotation continues    │  │
│  │                                                                   │  │
│  │  29    30    31                                            │  │
│  │  🟪    🟪    🟪                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Legend:                                                                 │
│  🟦 Day Shift (09:00-18:00)  🟪 Night Shift (21:00-06:00)  ⬜ Off     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phased Implementation Plan

### Phase 1: Foundation - Batch System (Week 1-2)

**Goal:** Create core batch management functionality

**Backend Tasks:**
1. ✅ Create `Batch` schema with all fields
2. ✅ Create `BatchAssignmentHistory` schema
3. ✅ Build batch CRUD API endpoints
4. ✅ Build batch shift assignment API
5. ✅ Add `batchId` field to Employee schema (migration)
6. ✅ Create batch-employee association APIs

**Frontend Tasks:**
1. ✅ Create Batch Management page (`batchesList.tsx`)
2. ✅ Create Create/Edit Batch modal
3. ✅ Create Batch component with rotation config UI
4. ✅ Add batch dropdown to Add Employee modal
5. ✅ Add batch dropdown to Edit Employee modal
6. ✅ Add batch section to Employee Details page

**Deliverables:**
- HR can create/manage batches
- HR can assign employees to batches
- Shifts are assigned via batches

---

### Phase 2: Rotation Engine (Week 3-4)

**Goal:** Implement automated rotation system

**Backend Tasks:**
1. ✅ Implement `getCurrentShift()` method
2. ✅ Implement `getShiftForDate(date)` method
3. ✅ Implement `getRotationSchedule()` method
4. ✅ Create rotation execution cron job
5. ✅ Build rotation preview API
6. ✅ Create upcoming rotations API
7. ✅ Build shift history tracking

**Frontend Tasks:**
1. ✅ Create rotation configuration UI in batch modal
2. ✅ Create rotation calendar preview component
3. ✅ Add rotation timeline to employee details
4. ✅ Add upcoming rotations dashboard widget
5. ✅ Create batch history view

**Deliverables:**
- Batches can have rotation patterns
- Calendar shows rotation schedule
- Automatic rotation execution

---

### Phase 3: Employee Assignment (Week 5)

**Goal:** Complete employee-batch workflow

**Backend Tasks:**
1. ✅ Batch assign employees to batch
2. ✅ Transfer employees between batches
3. ✅ Get unassigned employees API
4. ✅ Employee batch change history
5. ✅ Auto-assign default batch on employee creation

**Frontend Tasks:**
1. ✅ Bulk assignment modal (employees → batch)
2. ✅ Transfer modal (batch → batch)
3. ✅ Unassigned employees list
4. ✅ Batch change confirmation
5. ✅ Employee batch history timeline

**Deliverables:**
- Easy employee-batch management
- Track all assignment changes

---

### Phase 4: Reporting & Automation (Week 6)

**Goal:** Complete reporting and notification system

**Backend Tasks:**
1. ✅ Shift coverage by batch report
2. ✅ Batch utilization report
3. ✅ Rotation execution notifications
4. ✅ Email/In-app shift change alerts
5. ✅ Calendar iCal feed for schedules

**Frontend Tasks:**
1. ✅ Coverage dashboard
2. ✅ Batch analytics page
3. ✅ Notification preferences
4. ✅ Export schedule to calendar
5. ✅ Print batch schedules

**Deliverables:**
- Complete reporting suite
- Automated notifications

---

## Database Migration

### Migration Script

```javascript
// backend/migrations/migrateToBatchSystem.js

import { getTenantCollections } from '../config/db.js';
import { ObjectId } from 'mongodb';

export async function migrateToBatchSystem() {
  const collections = await getTenantCollections();

  console.log('Starting batch system migration...');

  // Step 1: Create default batch for each unique shift assignment
  const employees = await collections.employees.find({
    shiftId: { $exists: true, $ne: null },
    isDeleted: { $ne: true }
  }).toArray();

  // Group employees by shift
  const shiftGroups = new Map();
  for (const emp of employees) {
    const shiftKey = emp.shiftId.toString();
    if (!shiftGroups.has(shiftKey)) {
      shiftGroups.set(shiftKey, []);
    }
    shiftGroups.get(shiftKey).push(emp);
  }

  // Create batches for each shift group
  const batchIds = new Map();
  let batchCounter = 1;

  for (const [shiftId, emps] of shiftGroups.entries()) {
    // Get shift details
    const shift = await collections.shifts.findOne({
      _id: { $oid: shiftId }
    });

    if (!shift) continue;

    // Create batch
    const batch = {
      companyId: emps[0].companyId,
      name: shift.name || `Batch ${batchCounter}`,
      code: `BATCH-${String(batchCounter).padStart(3, '0')}`,
      description: `Auto-generated batch from ${shift.name} assignment`,
      shiftId: { $oid: shiftId },
      shiftEffectiveFrom: new Date(),
      rotationEnabled: false,
      color: shift.color || '#1890ff',
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collections.batches.insertOne(batch);
    const batchId = result.insertedId;
    batchIds.set(shiftId, batchId);

    console.log(`Created batch: ${batch.name} for ${emps.length} employees`);

    // Update employees with batchId
    const employeeIds = emps.map(e => e._id);
    await collections.employees.updateMany(
      { _id: { $in: employeeIds } },
      {
        $set: {
          batchId: batchId,
          updatedAt: new Date()
        }
      }
    );

    batchCounter++;
  }

  // Step 2: Create default batch for unassigned employees
  const unassignedEmployees = await collections.employees.find({
    $or: [
      { shiftId: { $exists: false } },
      { shiftId: null }
    ],
    isDeleted: { $ne: true }
  }).toArray();

  if (unassignedEmployees.length > 0) {
    // Get default shift
    const defaultShift = await collections.shifts.findOne({
      isDefault: true,
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (defaultShift) {
      const defaultBatch = {
        companyId: unassignedEmployees[0].companyId,
        name: 'Default Batch',
        code: 'BATCH-DEFAULT',
        description: 'Default batch for employees without specific shift assignment',
        shiftId: defaultShift._id,
        shiftEffectiveFrom: new Date(),
        rotationEnabled: false,
        color: '#1890ff',
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collections.batches.insertOne(defaultBatch);
      const employeeIds = unassignedEmployees.map(e => e._id);

      await collections.employees.updateMany(
        { _id: { $in: employeeIds } },
        {
          $set: {
            batchId: result.insertedId,
            shiftId: defaultShift._id,
            updatedAt: new Date()
          }
        }
      );

      console.log(`Created default batch for ${unassignedEmployees.length} employees`);
    }
  }

  console.log('Migration completed successfully!');
  return {
    batchesCreated: batchCounter,
    employeesUpdated: employees.length + unassignedEmployees.length
  };
}
```

---

## Key Benefits of Batch-Based Architecture

### 1. Simplified Management

| Without Batches | With Batches |
|----------------|--------------|
| Assign shift to 100 employees individually | Create batch, assign all at once |
| Change shift for 50 employees one by one | Update batch, all affected |
| Track 100 individual shift records | Track 1 batch record |
| Complex rotation per employee | Single rotation config per batch |

### 2. Clearer Organization

```
Before:
Employee 1 → Day Shift
Employee 2 → Day Shift
Employee 3 → Day Shift
... x100
Employee 101 → Night Shift
Employee 102 → Night Shift
... x100

After:
Batch A (100 employees) → Day Shift
Batch B (100 employees) → Night Shift
```

### 3. Easier Rotation

```
Without Batches:
- Configure rotation for each employee
- Execute rotation for each employee
- Track individual rotation schedules

With Batches:
- Configure rotation once for batch
- Execute rotation for entire batch
- Single rotation calendar for all employees
```

### 4. Better Reporting

```
Shift Coverage Report:
- Batch A: 45 employees on Day Shift
- Batch B: 42 employees on Night Shift
- General: 120 employees on General Shift

vs

- 45 employees: Day Shift
- 42 employees: Night Shift
- 120 employees: General Shift
```

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ Create `Batch` schema
2. ✅ Create batch CRUD APIs
3. ✅ Build Batch Management UI
4. ✅ Add batch selection to employee forms

### Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Batch Creation | 100% | 0% |
| Employee Batch Assignment | 100% | 0% |
| Rotation Configuration | 100% | 0% |
| Batch-based Reporting | 100% | 0% |

---

**Report Prepared By:** Claude AI
**Version:** 2.0 - Batch-Based Architecture
**Last Updated:** 2026-02-05
