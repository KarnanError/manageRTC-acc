# HRM Module - Complete Database Schema Documentation

**Report Generated:** 2026-02-03
**Last Updated:** 2026-02-03 (Brutal Validation Review)
**Module:** Human Resource Management (HRM)
**Database:** MongoDB
**Schema Style:** Mongoose ODM

---

## ⚠️ SCHEMA VALIDATION FINDINGS

**Issues Found:** 7
- **HIGH:** 4
- **MEDIUM:** 3

### Critical Schema Issues

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | ObjectId vs String type inconsistency | HIGH | Requires complex aggregations |
| 2 | Missing indexes on some models | HIGH | Poor query performance |
| 3 | Inconsistent soft delete patterns | MEDIUM | Data recovery issues |
| 4 | Missing audit fields on some models | MEDIUM | Cannot track changes |
| 5 | Inconsistent status value naming | MEDIUM | String comparison issues |
| 6 | Missing validation rules | MEDIUM | Data integrity risks |
| 7 | companyId type inconsistency | MEDIUM | Type conversion overhead |

**See Section 16 for detailed schema validation report.**

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Employee Schema](#2-employee-schema)
3. [Attendance Schema](#3-attendance-schema)
4. [Leave Schema](#4-leave-schema)
5. [Leave Type Schema](#5-leave-type-schema)
6. [Department Schema](#6-department-schema)
7. [Designation Schema](#7-designation-schema)
8. [Promotion Schema](#8-promotion-schema)
9. [Policy Schema](#9-policy-schema)
10. [Holiday Type Schema](#10-holiday-type-schema)
11. [Training Schema](#11-training-schema)
12. [Performance Models](#12-performance-models)
13. [Payroll Schema](#13-payroll-schema)
14. [Schema Relationships](#14-schema-relationships)
15. [Index Strategy](#15-index-strategy)
16. [Schema Validation Issues](#16-schema-validation-issues)

---

## 1. Schema Overview

### 1.1 HRM Collections

| Collection | Model File | Document Count | Key Relationships | Validation Issues |
|------------|------------|----------------|-------------------|-------------------|
| Employee | `employee.schema.js` | - | Department, Designation, ReportingTo (self) | ⚠️ ObjectId/String mismatch |
| Attendance | `attendance.schema.js` | - | Employee, Shift | ⚠️ Missing employeeId validation |
| Leave | `leave.schema.js` | - | Employee, LeaveType | ⚠️ Status enum inconsistency |
| LeaveType | `leaveType.schema.js` | - | - | ✅ OK |
| Department | `department.schema.js` | - | Parent (self), HeadOfDepartment | ⚠️ Missing audit fields |
| Designation | `designation.schema.js` | - | Department, ReportsTo (self) | ⚠️ Missing audit fields |
| Promotion | `promotion.schema.js` | - | Employee | ⚠️ employeeId is String not ObjectId |
| Policy | `policy.schema.js` | - | Department, Designation | ⚠️ Missing audit fields |
| HolidayType | `holidayType.schema.js` | - | - | ✅ OK |
| Training | `training.schema.js` | - | Instructor, Participants | ✅ OK |
| Payroll | `payroll.schema.js` | - | Employee | ⚠️ Incomplete |
| GoalTracking | `goalTracking.model.js` | - | Employee | ⚠️ Minimal validation |
| PerformanceAppraisal | `performanceAppraisal.model.js` | - | Employee | ⚠️ Minimal validation |
| PerformanceIndicator | `performanceIndicator.model.js` | - | - | ⚠️ Minimal validation |
| PerformanceReview | `performanceReview.model.js` | - | Employee, Appraisal | ⚠️ Minimal validation |

### 1.2 Multi-Tenant Design

**⚠️ INCONSISTENT - Type varies across models:**

| Collection | companyId Type | Index | Issue |
|------------|----------------|-------|-------|
| Employee | ObjectId | ✅ | Consistent |
| Attendance | String | ✅ | ❌ Type mismatch |
| Leave | String | ✅ | ❌ Type mismatch |
| Department | String | ✅ | ❌ Type mismatch |
| Designation | String | ✅ | ❌ Type mismatch |
| Promotion | String | ✅ | ❌ Type mismatch |
| Policy | String | ✅ | ❌ Type mismatch |
| HolidayType | String | ✅ | ❌ Type mismatch |
| Training | String | ✅ | ❌ Type mismatch |

**Impact:** Complex type conversions, aggregation overhead

### 1.3 Standard Audit Fields

**⚠️ NOT CONSISTENTLY APPLIED:**

| Collection | createdBy | updatedBy | createdAt | updatedAt | isDeleted |
|------------|-----------|-----------|-----------|-----------|-----------|
| Employee | ✅ | ✅ | ✅ | ✅ | ✅ |
| Attendance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Leave | ✅ | ✅ | ✅ | ✅ | ✅ |
| Department | ⚠️ String | ⚠️ String | ✅ | ✅ | ✅ |
| Designation | ⚠️ String | ⚠️ String | ✅ | ✅ | ✅ |
| Promotion | ⚠️ Object | ⚠️ Object | ✅ | ✅ | ✅ |
| Policy | ⚠️ ObjectId | ⚠️ ObjectId | ✅ | ✅ | ⚠️ No deletedBy |
| HolidayType | ⚠️ String | ⚠️ String | ✅ | ✅ | ✅ |
| Training | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 2. Employee Schema

**File:** [backend/models/employee/employee.schema.js](backend/models/employee/employee.schema.js)
**Lines:** 608

**⚠️ KNOWN ISSUES:**
1. **HIGH:** Uses ObjectId for department/designation, but API expects String
2. **MEDIUM:** companyId as ObjectId, but most other models use String

### 2.1 Schema Structure

```javascript
{
  // Primary Keys
  employeeId: String,          // Auto-generated: EMP-YYYY-NNNN
  employeeCode: String,        // Optional manual code

  // Basic Information
  firstName: String,           // Required, min 2, max 50
  lastName: String,            // Required, min 2, max 50
  fullName: String,            // Computed from first + last
  email: String,               // Required, unique, validated
  phone: String,
  dateOfBirth: Date,
  gender: Enum['Male', 'Female', 'Other', 'Prefer not to say'],
  address: {
    street: String,            // max 200
    city: String,              // max 100
    state: String,             // max 100
    country: String,           // max 100
    postalCode: String         // max 20
  },

  // Organization ⚠️ TYPE MISMATCH
  department: ObjectId,        // Ref: Department (required) - BUT API expects String!
  designation: ObjectId,       // Ref: Designation (required) - BUT API expects String!
  level: Enum['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'],

  // Reporting Structure
  reportingTo: ObjectId,       // Ref: Employee (self-reference)
  reportees: [ObjectId],       // Ref: Employee (self-reference array)

  // Employment Details
  employmentType: Enum['Full-time', 'Part-time', 'Contract', 'Intern'],  // Required
  employmentStatus: Enum['Active', 'Probation', 'Resigned', 'Terminated', 'On Leave'],
  joiningDate: Date,           // Required
  confirmationDate: Date,
  resignationDate: Date,
  lastWorkingDate: Date,

  // Work Location
  workLocation: Enum['Office', 'Remote', 'Hybrid'],
  workLocationDetails: String,

  // Salary Information
  salary: {
    basic: Number,             // Required, min 0
    hra: Number,               // Default 0, min 0
    allowances: Number,        // Default 0, min 0
    currency: Enum['USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR']  // Default: USD
  },

  // Leave Balance
  leaveBalance: {
    casual: Number,            // Default 10
    sick: Number,              // Default 10
    earned: Number,            // Default 15
    compOff: Number            // Default 2
  },

  // Documents
  documents: [{
    type: Enum['Resume', 'ID Proof', 'Address Proof', 'Education Certificate',
              'Experience Letter', 'Offer Letter', 'Other'],
    fileName: String,
    fileUrl: String,
    fileSize: Number,          // in bytes
    mimeType: String,
    uploadedAt: Date,
    uploadedBy: ObjectId       // Ref: User
  }],

  // Skills & Qualifications
  skills: [String],
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    field: String
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean
  }],

  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },

  // Bank Details
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountType: Enum['Savings', 'Current']
  },

  // Social Profiles
  socialProfiles: {
    linkedin: String,
    github: String,
    twitter: String
  },

  // Profile
  profileImage: String,
  notes: String,               // max 2000

  // Multi-tenant & Authentication ⚠️ TYPE INCONSISTENCY
  companyId: ObjectId,         // Required, indexed - BUT other models use String!
  clerkUserId: String,         // Clerk authentication ID (unique, sparse)
  role: Enum['superadmin', 'admin', 'hr', 'employee'],

  // Status Flags
  isActive: Boolean,           // Default: true
  isDeleted: Boolean,          // Default: false
  deletedAt: Date,
  deletedBy: ObjectId,         // Ref: Employee

  // Audit
  createdBy: ObjectId,         // Ref: Employee
  updatedBy: ObjectId,         // Ref: Employee
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 Indexes

```javascript
// Single field indexes
employeeSchema.index({ employeeId: 1 });           // Unique
employeeSchema.index({ email: 1 });                // Unique
employeeSchema.index({ clerkUserId: 1 });          // Unique, sparse
employeeSchema.index({ companyId: 1 });            // ⚠️ ObjectId type
employeeSchema.index({ department: 1 });           // ObjectId type
employeeSchema.index({ employmentStatus: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ isDeleted: 1 });
employeeSchema.index({ employeeCode: 1 });

// Compound indexes
employeeSchema.index({ companyId: 1, employmentStatus: 1 });
employeeSchema.index({ companyId: 1, department: 1 });
employeeSchema.index({ companyId: 1, designation: 1 });
employeeSchema.index({ companyId: 1, reportingTo: 1 });
employeeSchema.index({ isActive: 1, isDeleted: 1 });

// Text search index
employeeSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  employeeCode: 'text',
  fullName: 'text'
});
```

### 2.3 Virtual Properties

| Virtual | Description | Calculation |
|---------|-------------|-------------|
| `name` | Full name display | `fullName \|\| firstName + ' ' + lastName` |
| `totalSalary` | Total compensation | `basic + hra + allowances` |
| `tenureDays` | Employment duration | Days from joining to lastWorkingDate |
| `isProbationComplete` | Probation status | `currentDate >= confirmationDate` |

### 2.4 Static Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `getActiveEmployees` | companyId | Array of active employees |
| `getByDepartment` | departmentId | Employees by department |
| `getByManager` | managerId | Employees by manager |
| `searchEmployees` | companyId, searchTerm | Search results |

---

## 3. Attendance Schema

**File:** [backend/models/attendance/attendance.schema.js](backend/models/attendance/attendance.schema.js)
**Lines:** 440

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** companyId as String (inconsistent with Employee's ObjectId)
2. **MEDIUM:** employee field is ObjectId, but no validation that employee belongs to companyId

### 3.1 Schema Structure

```javascript
{
  // Primary Keys
  attendanceId: String,        // Unique, sparse

  // Reference
  employee: ObjectId,          // Ref: Employee (required, indexed)
  companyId: String,           // Required, indexed ⚠️ TYPE MISMATCH with Employee.companyId
  date: Date,                  // Required, indexed

  // Clock In Details
  clockIn: {
    time: Date,                // Default: Date.now
    location: {
      type: Enum['office', 'remote', 'client-site', 'other'],
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      ipAddress: String,
      deviceId: String
    },
    notes: String
  },

  // Clock Out Details
  clockOut: {
    time: Date,
    location: {
      type: Enum['office', 'remote', 'client-site', 'other'],
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      ipAddress: String,
      deviceId: String
    },
    notes: String
  },

  // Work Hours
  hoursWorked: Number,         // Default: 0, min: 0
  regularHours: Number,        // Default: 0
  overtimeHours: Number,       // Default: 0

  // Status ⚠️ INCONSISTENT NAMING
  status: Enum['present', 'absent', 'half-day', 'late', 'early-departure',
              'on-leave', 'holiday', 'weekend'],  // Default: present
              // Uses kebab-case unlike other schemas that use camelCase!

  // Late/Early Detection
  isLate: Boolean,             // Default: false
  lateMinutes: Number,         // Default: 0
  isEarlyDeparture: Boolean,   // Default: false
  earlyDepartureMinutes: Number, // Default: 0

  // Break Tracking
  breakDuration: Number,       // In minutes
  breakStartTime: Date,
  breakEndTime: Date,

  // Shift
  shift: ObjectId,             // Ref: Shift

  // Schedule
  scheduledStart: Date,
  scheduledEnd: Date,

  // Regularization
  isRegularized: Boolean,      // Default: false
  regularizationRequest: {
    requested: Boolean,
    reason: String,
    requestedBy: ObjectId,     // Ref: Employee
    requestedAt: Date,
    approvedBy: ObjectId,      // Ref: Employee
    approvedAt: Date,
    status: Enum['pending', 'approved', 'rejected'],
    rejectionReason: String
  },

  // Notes
  notes: String,               // max 500
  managerNotes: String,        // max 500

  // Audit
  isActive: Boolean,
  isDeleted: Boolean,          // indexed
  createdBy: ObjectId,
  updatedBy: ObjectId,
  deletedBy: ObjectId,
  deletedAt: Date
}
```

### 3.2 Indexes

```javascript
attendanceSchema.index({ employee: 1, date: -1 });
attendanceSchema.index({ companyId: 1, date: -1 });
attendanceSchema.index({ companyId: 1, status: 1 });
attendanceSchema.index({ employee: 1, isDeleted: 1 });
attendanceSchema.index({ date: 1, status: 1, isDeleted: 1 });
```

---

## 4. Leave Schema

**File:** [backend/models/leave/leave.schema.js](backend/models/leave/leave.schema.js)
**Lines:** 511

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** Status values use lowercase ('pending', 'approved') while other schemas use capitalized ('Active', 'Inactive')
2. **MEDIUM:** companyId as String (inconsistent)

### 4.1 Schema Structure

```javascript
{
  // Primary Keys
  leaveId: String,             // Unique, sparse

  // Reference
  employee: ObjectId,          // Ref: Employee (required, indexed)
  companyId: String,           // Required, indexed

  // Leave Type & Dates
  leaveType: Enum['sick', 'casual', 'earned', 'maternity', 'paternity',
                  'bereavement', 'compensatory', 'unpaid', 'special'],  // Required
  startDate: Date,             // Required, indexed
  endDate: Date,               // Required, indexed

  // Duration
  duration: Number,            // Required, min: 0.5
  totalDays: Number,           // Default: 0
  workingDays: Number,         // Default: 0
  nonWorkingDays: Number,      // Default: 0

  // Half Day
  isHalfDay: Boolean,          // Default: false
  halfDayType: Enum['first-half', 'second-half'],

  // Reason
  reason: String,              // Required, max 500
  detailedReason: String,      // max 2000

  // Status ⚠️ LOWERCASE (inconsistent)
  status: Enum['pending', 'approved', 'rejected', 'cancelled', 'on-hold'],

  // Approval
  approvedBy: ObjectId,         // Ref: Employee
  approvedAt: Date,
  approvalComments: String,    // max 500

  // Rejection
  rejectedBy: ObjectId,        // Ref: Employee
  rejectedAt: Date,
  rejectionReason: String,     // max 500

  // Cancellation
  cancelledBy: ObjectId,       // Ref: Employee
  cancelledAt: Date,
  cancellationReason: String,  // max 500

  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: Date
  }],

  // Contact During Leave
  contactInfo: {
    phone: String,
    email: String,
    address: String
  },

  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },

  // Handover
  handoverTo: ObjectId,        // Ref: Employee
  handoverNotes: String,

  // Balance
  balanceAtRequest: Number,    // Default: 0

  // Carry Forward
  isCarryForward: Boolean,     // Default: false
  carryForwardYear: Number,

  // Workflow
  reportingManager: ObjectId,  // Ref: Employee
  additionalApprovers: [{
    approver: ObjectId,        // Ref: Employee
    status: Enum['pending', 'approved', 'rejected'],
    comments: String,
    approvedAt: Date,
    rejectedAt: Date
  }],

  // HR Review
  hrReview: {
    required: Boolean,
    reviewedBy: ObjectId,      // Ref: Employee
    reviewedAt: Date,
    comments: String
  },

  // Notifications
  notificationsSent: {
    employee: Boolean,
    manager: Boolean,
    team: Boolean
  },

  // Auto-approval
  autoApproved: Boolean,
  autoApprovalReason: String,

  // Notes
  notes: String,               // max 500
  adminNotes: String,          // max 500

  // Audit
  isActive: Boolean,
  isDeleted: Boolean,          // indexed
  createdBy: ObjectId,
  updatedBy: ObjectId,
  deletedBy: ObjectId,
  deletedAt: Date
}
```

### 4.2 Indexes

```javascript
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ companyId: 1, status: 1 });
leaveSchema.index({ companyId: 1, leaveType: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ employee: 1, isDeleted: 1 });
leaveSchema.index({ companyId: 1, startDate: -1 });
```

---

## 5. Leave Type Schema

**File:** [backend/models/leave/leaveType.schema.js](backend/models/leave/leaveType.schema.js)

**⚠️ KNOWN ISSUES:** None identified - well structured

### 5.1 Schema Structure

```javascript
{
  companyId: String,           // Required, indexed
  name: String,                // Required
  code: String,                // Required, uppercase
  description: String,
  defaultDaysAllowed: Number,  // Default: 0, min: 0
  isPaid: Boolean,             // Default: true
  requiresApproval: Boolean,   // Default: true
  canCarryForward: Boolean,    // Default: false
  maxCarryForwardDays: Number, // Default: 0, min: 0
  isActive: Boolean,           // Default: true, indexed
  displayOrder: Number,
  icon: String,
  color: String
}
```

---

## 6. Department Schema

**File:** [backend/models/organization/department.schema.js](backend/models/organization/department.schema.js)
**Lines:** 496

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** createdBy/updatedBy are String (not ObjectId)
2. **MEDIUM:** companyId as String (inconsistent with Employee)

### 6.1 Schema Structure

```javascript
{
  // Primary Keys
  departmentId: String,        // Unique, indexed (e.g., DEPT-0001)
  companyId: String,           // Required, indexed

  // Department Information
  name: String,                // Required, min 2, max 100
  code: String,                // Uppercase, max 20
  description: String,         // max 500

  // Hierarchy
  parentId: ObjectId,          // Ref: Department (self-reference)
  level: Number,               // Default: 1, min 1, max 10
  path: String,                // Full path string

  // Leadership
  headOfDepartment: ObjectId,  // Ref: Employee
  deputyHead: ObjectId,        // Ref: Employee

  // Contact & Location
  email: String,
  phone: String,
  location: {
    building: String,
    floor: String,
    wing: String
  },

  // Budget & Cost Center
  costCenter: String,
  budget: {
    annual: Number,            // Default: 0, min: 0
    currency: String           // Default: USD
  },

  // Employee Count
  employeeCount: {
    active: Number,            // Default: 0, min: 0
    total: Number              // Default: 0, min: 0
  },

  // Status ⚠️ CAPITALIZED (inconsistent with leave schema)
  status: Enum['Active', 'Inactive', 'Dissolved'],  // Default: Active
  isDeleted: Boolean,          // Default: false
  isActive: Boolean,           // Default: true

  // Metadata
  establishedDate: Date,
  dissolvedDate: Date,
  notes: String,               // max 2000

  // Audit ⚠️ STRING TYPE (not ObjectId)
  createdBy: String,
  updatedBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 7. Designation Schema

**File:** [backend/models/organization/designation.schema.js](backend/models/organization/designation.schema.js)
**Lines:** 651

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** createdBy/updatedBy are String (not ObjectId)
2. **MEDIUM:** companyId as String (inconsistent)

### 7.1 Schema Structure

```javascript
{
  // Primary Keys
  designationId: String,       // Unique, indexed (e.g., DESG-0001)
  companyId: String,           // Required, indexed

  // Designation Information
  title: String,               // Required, min 2, max 100
  code: String,                // Uppercase, max 20
  description: String,         // max 1000

  // Hierarchy & Level
  level: Enum['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager',
              'Senior Manager', 'Director', 'VP', 'C-Level', 'Executive'],  // Required
  levelNumber: Number,         // Default: 1, min 1, max 12
  rank: Number,                // Default: 0

  // Department Association
  departmentId: ObjectId,      // Ref: Department
  isDepartmentSpecific: Boolean, // Default: true

  // Reporting Structure
  reportsTo: ObjectId,         // Ref: Designation (self-reference)
  manages: [ObjectId],         // Ref: Designation array

  // Compensation Range
  compensationRange: {
    currency: String,          // Default: USD
    min: Number,               // Default: 0
    max: Number,               // Default: 0
    median: Number             // Default: 0
  },

  // Requirements
  requirements: {
    minExperience: Number,     // Default: 0
    maxExperience: Number,
    education: [{
      level: Enum['High School', 'Diploma', 'Bachelor', 'Master', 'PhD', 'None'],
      field: String
    }],
    skills: [String],
    certifications: [String]
  },

  // Employee Count
  employeeCount: {
    active: Number,            // Default: 0
    total: Number              // Default: 0
  },

  // Status ⚠️ CAPITALIZED
  status: Enum['Active', 'Inactive', 'Deprecated'],  // Default: Active
  isDeleted: Boolean,          // Default: false
  isActive: Boolean,           // Default: true
  isManagement: Boolean,       // Auto-detected
  isTechnical: Boolean,        // Manual flag

  // Default Role
  defaultRole: Enum['Employee', 'Manager', 'Admin', 'HR', 'Finance', 'Lead'],

  // Metadata
  establishedDate: Date,
  deprecatedDate: Date,
  notes: String,               // max 2000

  // Audit ⚠️ STRING TYPE (not ObjectId)
  createdBy: String,
  updatedBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 8. Promotion Schema

**File:** [backend/models/promotion/promotion.schema.js](backend/models/promotion/promotion.schema.js)
**Lines:** 167

**⚠️ KNOWN ISSUES:**
1. **HIGH:** employeeId is String (not ObjectId) - inconsistent with other references
2. **MEDIUM:** departmentId/designationId are also String

### 8.1 Schema Structure

```javascript
{
  // Multi-tenant
  companyId: String,           // Required, indexed

  // Employee ⚠️ STRING TYPE (inconsistent)
  employeeId: String,          // Required, indexed - Should be ObjectId!

  // Promotion Details ⚠️ STRING TYPES (inconsistent)
  promotionTo: {
    departmentId: String,      // Required - Should be ObjectId!
    designationId: String      // Required - Should be ObjectId!
  },

  // Current Position ⚠️ STRING TYPES
  promotionFrom: {
    departmentId: String,
    designationId: String
  },

  // Timing
  promotionDate: Date,         // Required, indexed
  promotionType: Enum['Regular', 'Acting', 'Charge', 'Transfer', 'Other'],

  // Salary Change
  salaryChange: {
    previousSalary: Number,
    newSalary: Number,
    increment: Number,
    incrementPercentage: Number
  },

  // Reason & Notes
  reason: String,              // max 500
  notes: String,               // max 1000

  // Status ⚠️ LOWERCASE (inconsistent)
  status: Enum['pending', 'applied', 'cancelled'],  // Default: pending, indexed
  appliedAt: Date,

  // Audit ⚠️ OBJECT TYPE (not ObjectId)
  createdBy: {
    userId: String,
    userName: String
  },
  updatedBy: {
    userId: String,
    userName: String
  },
  isDeleted: Boolean,          // indexed
  deletedAt: Date,
  deletedBy: {
    userId: String,
    userName: String
  }
}
```

---

## 9. Policy Schema

**File:** [backend/models/policy/policy.schema.js](backend/models/policy/policy.schema.js)
**Lines:** 150

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** Missing deletedBy field in soft delete pattern
2. **MEDIUM:** createdBy/updatedBy reference User (not Employee)

### 9.1 Schema Structure

```javascript
{
  // Multi-tenant
  companyId: String,           // Required, indexed

  // Policy Details
  policyName: String,          // Required, max 200
  policyDescription: String,   // Required, max 5000
  effectiveDate: Date,         // Required, indexed

  // Assignment
  applyToAll: Boolean,         // Default: false
  assignTo: [{
    departmentId: ObjectId,    // Ref: Department
    designationIds: [ObjectId] // Ref: Designation array
  }],

  // Audit ⚠️ MISSING deletedBy
  isDeleted: Boolean,
  createdBy: ObjectId,         // Ref: User (not Employee!)
  updatedBy: ObjectId,         // Ref: User (not Employee!)
  createdAt: Date,
  updatedAt: Date
}
```

---

## 10. Holiday Type Schema

**File:** [backend/models/holidayType/holidayType.schema.js](backend/models/holidayType/holidayType.schema.js)
**Lines:** 243

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** createdBy/updatedBy are String (not ObjectId)
2. **LOW:** name is unique without companyId scoping (collision risk)

### 10.1 Default Holiday Types

The system automatically initializes these holiday types for new companies:

| Code | Name | Default Days | Paid | Carry Forward |
|------|------|--------------|------|---------------|
| ANNUAL | Annual Leave | 20 | Yes | Yes (max 5) |
| SICK | Sick Leave | 10 | Yes | No |
| CASUAL | Casual Leave | 12 | Yes | No |
| MATERNITY | Maternity Leave | 90 | Yes | No |
| PATERNITY | Paternity Leave | 14 | Yes | No |
| UNPAID | Unpaid Leave | 0 | No | No |

---

## 11. Training Schema

**File:** [backend/models/training/training.schema.js](backend/models/training/training.schema.js)
**Lines:** 492

**⚠️ KNOWN ISSUES:** None - well structured

### 11.1 Schema Structure

```javascript
{
  // Primary Keys
  trainingId: String,          // Unique, sparse

  // Basic Information
  name: String,                // Required, indexed
  type: Enum['technical', 'soft-skills', 'compliance', 'safety',
             'leadership', 'onboarding', 'certification', 'other'],  // Required
  category: String,            // Required
  companyId: String,           // Required, indexed
  description: String,         // max 2000

  // Schedule
  startDate: Date,             // Required, indexed
  endDate: Date,               // Required, indexed
  duration: Number,            // Auto-calculated in days

  // Instructor
  instructor: ObjectId,        // Ref: Employee
  externalInstructor: {
    name: String,
    email: String,
    phone: String,
    organization: String
  },

  // Location
  location: {
    type: Enum['office', 'online', 'external', 'hybrid'],
    address: String,
    meetingLink: String,
    room: String
  },

  // Capacity
  maxParticipants: Number,     // Default: 30, min: 1
  minParticipants: Number,     // Default: 5, min: 1
  enrolledCount: Number,       // Auto-calculated

  // Participants
  participants: [{
    employee: ObjectId,        // Ref: Employee
    enrolledAt: Date,
    status: Enum['enrolled', 'in-progress', 'completed', 'dropped', 'no-show'],
    completionDate: Date,
    score: Number,
    certificate: {
      issued: Boolean,
      issuedDate: Date,
      certificateUrl: String
    },
    feedback: {
      rating: Number,          // min 1, max 5
      comments: String
    }
  }],

  // Waitlist
  waitlist: [{
    employee: ObjectId,        // Ref: Employee
    addedAt: Date
  }],

  // Status ⚠️ KEBAB-CASE (inconsistent)
  status: Enum['draft', 'published', 'registration-open', 'registration-closed',
              'in-progress', 'completed', 'cancelled'],  // Default: draft

  // Budget
  budget: {
    allocated: Number,         // Default: 0
    spent: Number,             // Default: 0
    costPerParticipant: Number // Default: 0
  },

  // Materials
  materials: [{
    filename: String,
    originalName: String,
    mimeType: String,
    url: String,
    uploadedAt: Date
  }],

  // Curriculum
  curriculum: [{
    title: String,
    description: String,
    duration: Number,
    order: Number
  }],

  // Prerequisites
  prerequisites: [{
    type: Enum['training', 'skill', 'experience'],
    description: String,
    required: Boolean
  }],

  // Learning Objectives
  objectives: [String],

  // Assessment
  hasAssessment: Boolean,      // Default: false
  assessmentDetails: {
    type: Enum['quiz', 'exam', 'project', 'presentation', 'practical'],
    passingScore: Number,      // Default: 70
    duration: Number,
    totalMarks: Number
  },

  // Certification
  certification: {
    offered: Boolean,          // Default: false
    name: String,
    issuer: String,
    validFor: Number           // in months
  },

  // Completion Requirements
  completionRequirements: {
    minAttendance: Number,     // Default: 80
    minScore: Number           // Default: 70
  },

  // Tags & Notes
  tags: [String],
  notes: String,

  // Audit
  isActive: Boolean,
  isDeleted: Boolean,          // indexed
  createdBy: ObjectId,
  updatedBy: ObjectId,
  deletedBy: ObjectId,
  deletedAt: Date
}
```

---

## 12. Performance Models

### 12.1 Goal Tracking Model

**File:** [backend/models/performance/goalTracking.model.js](backend/models/performance/goalTracking.model.js)

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** Minimal validation
2. **MEDIUM:** Missing audit fields

```javascript
{
  companyId: String,
  employeeId: ObjectId,        // Ref: Employee
  title: String,
  description: String,
  category: String,
  priority: Enum['low', 'medium', 'high', 'critical'],
  status: Enum['not-started', 'in-progress', 'completed', 'on-hold', 'cancelled'],
  startDate: Date,
  dueDate: Date,
  completedDate: Date,
  progress: Number,            // 0-100
  weight: Number,              // For overall performance calculation
  alignedWith: [String],       // Company/department goals
  metrics: [{
    name: String,
    target: Number,
    current: Number,
    unit: String
  }]
}
```

### 12.2 Performance Appraisal Model

**File:** [backend/models/performance/performanceAppraisal.model.js](backend/models/performance/performanceAppraisal.model.js)

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** Minimal validation
2. **MEDIUM:** Missing audit fields

```javascript
{
  companyId: String,
  employeeId: ObjectId,        // Ref: Employee
  appraisalCycleId: ObjectId,
  reviewerId: ObjectId,        // Ref: Employee
  period: {
    startDate: Date,
    endDate: Date
  },
  status: Enum['draft', 'submitted', 'reviewed', 'completed'],
  overallRating: Number,       // 1-5
  strengths: [String],
  areasForImprovement: [String],
  goals: [{
    goalId: ObjectId,
    rating: Number,
    comments: String
  }],
  competencies: [{
    name: String,
    rating: Number,
    comments: String
  }],
  recommendation: Enum['promote', 'retain', 'improvement-needed', 'terminate'],
  comments: String
}
```

### 12.3 Performance Indicator Model

**File:** [backend/models/performance/performanceIndicator.model.js](backend/models/performance/performanceIndicator.model.js)

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** Minimal validation

```javascript
{
  companyId: String,
  name: String,
  category: Enum['technical', 'behavioral', 'leadership', 'soft-skills'],
  description: String,
  weight: Number,
  levels: [{
    level: Number,             // 1-5
    description: String,
    behaviors: [String]
  }]
}
```

### 12.4 Performance Review Model

**File:** [backend/models/performance/performanceReview.model.js](backend/models/performance/performanceReview.model.js)

**⚠️ KNOWN ISSUES:**
1. **MEDIUM:** Minimal validation

```javascript
{
  companyId: String,
  appraisalId: ObjectId,
  reviewerId: ObjectId,        // Ref: Employee
  revieweeId: ObjectId,        // Ref: Employee
  relationship: Enum['manager', 'peer', 'subordinate', 'self'],
  status: Enum['pending', 'submitted', 'completed'],
  submittedDate: Date,
  responses: [{
    questionId: ObjectId,
    answer: String,
    rating: Number
  }],
  overallRating: Number,
  anonymous: Boolean,
  comments: String
}
```

---

## 13. Payroll Schema

**File:** [backend/models/payroll/payroll.schema.js](backend/models/payroll/payroll.schema.js)

**⚠️ KNOWN ISSUES:**
1. **HIGH:** Incomplete schema - missing many fields
2. **MEDIUM:** No validation defined

### 13.1 Schema Structure

```javascript
{
  companyId: String,
  employeeId: ObjectId,        // Ref: Employee
  payrollPeriod: {
    startDate: Date,
    endDate: Date
  },

  // Earnings
  earnings: {
    basic: Number,
    hra: Number,
    allowances: {
      dearance: Number,
      travel: Number,
      medical: Number,
      special: Number,
      other: Number
    },
    bonuses: {
      performance: Number,
      joining: Number,
      other: Number
    },
    overtime: Number,
    totalEarnings: Number
  },

  // Deductions
  deductions: {
    providentFund: {
      employee: Number,
      employer: Number
    },
    esic: {
      employee: Number,
      employer: Number
    },
    professionalTax: Number,
    incomeTax: {
      tds: Number,
      advanceTax: Number
    },
    loans: [{
      type: String,
      amount: Number,
      remaining: Number
    }],
    totalDeductions: Number
  },

  // Net Pay
  netPay: Number,

  // Payment
  paymentDate: Date,
  paymentMethod: Enum['bank-transfer', 'cheque', 'cash'],
  paymentReference: String,
  status: Enum['draft', 'processed', 'paid', 'failed'],

  // YTD
  yearToDate: {
    earnings: Number,
    deductions: Number,
    tax: Number
  }
}
```

---

## 14. Schema Relationships

### 14.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Department    │──────<│    Employee     │>──────│  Designation    │
│                 │       │                 │       │                 │
│ - parentId (self)│   ┌───│ - department   │       │ - reportsTo(self)│
│ - headOfDept    │   │   │ - designation  │───┐   │ - manages[]     │
│ - deputyHead    │   │   │ - reportingTo  │   │   │                 │
└─────────────────┘   │   │ - reportees[]  │<──┘   └─────────────────┘
                      │   │                 │
                      │   │ - clerkUserId   │
                      │   └─────────────────┘
                      │
                      │   ┌─────────────────┐
                      │   │    Attendance   │
                      └───│                 │
                          │ - employee      │
                          │ - shift         │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│      Leave      │       │    Promotion    │
│                 │       │                 │
│ - employee      │       │ - employeeId    │
│ - leaveType     │       │ - promotionTo   │
│ - reportingMgr  │       │   - department  │
└─────────────────┘       │   - designation │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│     Policy      │       │    Training     │
│                 │       │                 │
│ - assignTo[]    │       │ - instructor    │
│   - department  │       │ - participants[]│
│   - designations│       └─────────────────┘
└─────────────────┘

┌─────────────────┐
│  HolidayType    │
│                 │
│ - default types │
│ - carry forward │
└─────────────────┘
```

### 14.2 Reference Summary

| Collection | References To | Type Issues |
|------------|--------------|-------------|
| Employee | Department (ObjectId), Designation (ObjectId), Employee (self) | ⚠️ Inconsistent with API |
| Attendance | Employee (ObjectId), Shift (ObjectId) | ⚠️ companyId type mismatch |
| Leave | Employee (ObjectId), LeaveType, Employee (handover, approvers) | ⚠️ Status naming inconsistency |
| Department | Department (self), Employee | ⚠️ Audit fields wrong type |
| Designation | Designation (self), Department | ⚠️ Audit fields wrong type |
| Promotion | Employee (String!) | ⚠️ WRONG - should be ObjectId |
| Policy | Department, Designation, User (not Employee) | ⚠️ Wrong ref type |
| Training | Employee (instructor, participants) | ✅ OK |

---

## 15. Index Strategy

### 15.1 Index Issues Found

| Collection | Missing Index | Impact |
|------------|---------------|--------|
| Attendance | Composite index on (companyId, employee, date) | Medium |
| Leave | Composite index on (companyId, employee, startDate) | Low |
| Department | Index on costCenter | Low |
| Designation | Index on departmentId | Medium |
| Promotion | Composite index on (companyId, employeeId, status) | High |

### 15.2 Common Index Patterns

**Single Field Indexes:**
- All `companyId` fields (multi-tenant queries)
- All `isDeleted` fields (soft delete filtering)
- All `status` fields (workflow filtering)
- All `createdAt`, `updatedAt` (temporal queries)

**Compound Indexes:**
- `{ companyId: 1, status: 1, isDeleted: 1 }` - Common query pattern
- `{ companyId: 1, [foreign_key]: 1, isDeleted: 1 }` - Related entity queries
- `{ date: 1, status: 1, isDeleted: 1 }` - Date-range queries

**Text Search Indexes:**
- Employee: firstName, lastName, email, employeeCode
- Department: name, code, description
- Designation: title, code, description

---

## 16. Schema Validation Issues

### 16.1 HIGH Severity Issues

#### Issue #1: ObjectId vs String Type Inconsistency

**Impact:** Requires complex `$toObjectId` aggregations, lookup failures, performance overhead

**Affected Fields:**

| Field | Schema Type | API Type | Fix Required |
|-------|-------------|----------|--------------|
| Employee.department | ObjectId | String | ⚠️ Standardize |
| Employee.designation | ObjectId | String | ⚠️ Standardize |
| Promotion.employeeId | String | String | ⚠️ Should be ObjectId |
| Promotion.promotionTo.departmentId | String | String | ⚠️ Should be ObjectId |
| Promotion.promotionTo.designationId | String | String | ⚠️ Should be ObjectId |
| All companyId | Mixed | Mixed | ⚠️ Standardize to ObjectId |

**Workaround in Code:**
```javascript
// employee.controller.js - This should NOT be necessary!
{
  $addFields: {
    departmentId: { $toObjectId: "$department" }
  }
}
```

**Recommended Fix:**
1. Change all foreign keys to ObjectId type
2. Update API to accept ObjectId strings
3. Remove all `$toObjectId` aggregations

---

#### Issue #2: Missing Indexes

**Impact:** Poor query performance on large collections

**Missing Indexes:**

```javascript
// Attendance - Missing compound index
attendanceSchema.index({ companyId: 1, employee: 1, date: -1 });

// Leave - Missing compound index
leaveSchema.index({ companyId: 1, employee: 1, startDate: -1 });

// Designation - Missing department index
designationSchema.index({ departmentId: 1 });

// Promotion - Missing compound index
promotionSchema.index({ companyId: 1, employeeId: 1, status: 1 });
```

---

### 16.2 MEDIUM Severity Issues

#### Issue #3: Inconsistent Soft Delete Pattern

**Impact:** Cannot rely on consistent deletion behavior, incomplete audit trail

**Inconsistencies:**

| Collection | has isDeleted | has deletedAt | has deletedBy | Notes |
|------------|---------------|--------------|---------------|-------|
| Employee | ✅ | ✅ | ✅ | ObjectId type |
| Attendance | ✅ | ✅ | ✅ | ObjectId type |
| Leave | ✅ | ✅ | ✅ | ObjectId type |
| Department | ✅ | ❌ | ❌ | Missing fields |
| Designation | ✅ | ❌ | ❌ | Missing fields |
| Policy | ✅ | ❌ | ❌ | Missing deletedBy |

**Recommended Fix:** Add standard soft delete fields to all models

---

#### Issue #4: Audit Field Type Inconsistency

**Impact:** Cannot reliably track who created/modified records

**Inconsistencies:**

| Collection | createdBy Type | updatedBy Type | References |
|------------|----------------|----------------|------------|
| Employee | ObjectId | ObjectId | ✅ Employee |
| Attendance | ObjectId | ObjectId | ✅ Employee |
| Leave | ObjectId | ObjectId | ✅ Employee |
| Department | String | String | ❌ Not a ref |
| Designation | String | String | ❌ Not a ref |
| Promotion | Object | Object | ❌ Complex type |
| Policy | ObjectId | ObjectId | ⚠️ User (not Employee) |

**Recommended Fix:** Standardize all audit fields to ObjectId referencing Employee

---

#### Issue #5: Status Value Naming Inconsistency

**Impact:** String comparisons fail, case sensitivity issues

**Inconsistencies:**

| Collection | Status Style | Example Values |
|------------|--------------|----------------|
| Employee | Capitalized | 'Active', 'Probation', 'Resigned' |
| Department | Capitalized | 'Active', 'Inactive', 'Dissolved' |
| Designation | Capitalized | 'Active', 'Inactive', 'Deprecated' |
| Leave | Lowercase | 'pending', 'approved', 'rejected' |
| Promotion | Lowercase | 'pending', 'applied', 'cancelled' |
| Attendance | Kebab-case | 'half-day', 'early-departure', 'on-leave' |
| Training | Kebab-case | 'registration-open', 'in-progress' |

**Recommended Fix:** Standardize to PascalCase (Capitalized) or create status enum constants

---

#### Issue #6: Missing Validation Rules

**Impact:** Invalid data can reach database

**Missing Validations:**

```javascript
// Department - Missing required validator
name: {
  type: String,
  required: true,  // ✅ Has this
  minlength: 2,    // ⚠️ Missing
  maxlength: 100   // ✅ Has this
}

// Designation - Missing min/max on levelNumber
levelNumber: {
  type: Number,
  default: 1,
  min: 1,          // ⚠️ Missing validation
  max: 12          // ⚠️ Missing validation
}

// Leave - No validation that endDate >= startDate
// ⚠️ Should add custom validator
```

---

#### Issue #7: companyId Type Inconsistency

**Impact:** Type conversion overhead, potential query failures

**Current State:**
- Employee: `companyId` is ObjectId
- All other HRM models: `companyId` is String

**Recommended Fix:** Change all to ObjectId for:
1. Consistent joins
2. Better performance
3. Proper referential integrity

---

### 16.3 Schema Recommendations Summary

| Priority | Issue | Collections Affected | Effort |
|----------|-------|---------------------|---------|
| URGENT | ObjectId vs String | Employee, Promotion, All companyId refs | High |
| HIGH | Missing indexes | Attendance, Leave, Designation, Promotion | Low |
| MEDIUM | Audit field consistency | Department, Designation, Policy | Medium |
| MEDIUM | Soft delete pattern | Department, Designation, Policy | Low |
| MEDIUM | Status naming | Leave, Promotion, Attendance, Training | Medium |
| LOW | Validation rules | Department, Designation, Leave | Low |

---

*End of Database Schema Documentation*
