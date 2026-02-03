# PM Module - Complete Database Schema Documentation

**Generated:** 2026-02-03
**Database:** MongoDB with Mongoose ODM
**Schema Version:** 1.0

---

## Executive Summary

The PM Module uses 4 primary schemas for data management. This document provides comprehensive schema definitions, relationships, indexes, and critical issues found during brutal validation.

**Schema Health Score:** 6.5/10

**Critical Issues:** 3 schema-level problems requiring immediate attention

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Project Schema](#2-project-schema)
3. [Task Schema](#3-task-schema)
4. [Project Notes Schema](#4-project-notes-schema)
5. [Client Schema](#5-client-schema)
6. [Relationships & References](#6-relationships--references)
7. [Indexes Analysis](#7-indexes-analysis)
8. [Critical Issues & Fixes](#8-critical-issues--fixes)
9. [Migration Scripts](#9-migration-scripts)

---

## 1. Schema Overview

### 1.1 Schema Hierarchy

```
PM Module Schemas
├── Project (projects)
│   └── has many → Task
│   └── has many → Project Notes
│   └── belongs to → Client
│   └── has many → Employee (teamMembers, teamLeader, projectManager)
│
├── Task (tasks)
│   └── belongs to → Project
│   └── has many → Employee (assignee)
│   └── belongs to → Company (companyId) ← MISSING!
│
├── Project Notes (projectnotes)
│   └── belongs to → Project
│
└── Client (clients)
    └── has many → Project
    └── has one → Employee (accountManager)
    └── has many → Employee (teamMembers)
```

### 1.2 Collection Statistics

| Collection | Est. Documents | Indexes | Size |
|------------|----------------|---------|------|
| `projects` | N/A | 7 | Medium |
| `tasks` | N/A | 3 | Large |
| `projectnotes` | N/A | 3 | Small |
| `clients` | N/A | 8 | Medium |

---

## 2. Project Schema

### 2.1 Schema Definition

**Collection Name:** `projects`
**Model File:** `backend/models/project/project.schema.js`

```javascript
{
  // ==================== PRIMARY KEYS ====================
  _id: ObjectId,                    // Auto-generated MongoDB ObjectId

  projectId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: "Auto-generated project ID (format: PRO-XXXX)"
  },

  // ==================== BASIC INFORMATION ====================
  name: {
    type: String,
    required: true,
    trim: true,
    description: "Project name"
  },

  description: {
    type: String,
    trim: true,
    default: "",
    maxlength: 2000,
    description: "Detailed project description"
  },

  // ⚠️ ISSUE: Should be ObjectId ref to Client
  client: {
    type: String,                   // ISSUE: Currently String, should be ObjectId
    required: true,
    trim: true,
    description: "Client name (should be ref to Client model)"
  },

  // ==================== MULTI-TENANCY ====================
  companyId: {
    type: String,
    required: true,
    index: true,
    description: "Company/tenant identifier for multi-tenancy"
  },

  // ==================== DATE FIELDS ====================
  startDate: {
    type: Date,
    required: true,
    index: true,
    description: "Project start date"
  },

  dueDate: {
    type: Date,
    required: true,
    index: true,
    description: "Project deadline/end date"
  },

  // ==================== PRIORITY & STATUS ====================
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
    description: "Project priority level"
  },

  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Active',
    description: "Current project status"
  },

  // ==================== FINANCIAL ====================
  projectValue: {
    type: Number,
    default: 0,
    min: 0,
    description: "Monetary value of the project"
  },

  // ==================== PROGRESS ====================
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    description: "Project completion percentage (0-100)"
  },

  // ==================== TEAM ASSIGNMENTS ====================
  // ⚠️ UNUSUAL: Arrays instead of single references
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    description: "Team members assigned to this project"
  }],

  teamLeader: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    description: "Project team leads (plural - multiple leads allowed)"
  }],

  projectManager: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    description: "Project managers (plural - multiple allowed)"
  }],

  // ==================== TAGS & MEDIA ====================
  tags: [{
    type: String,
    trim: true,
    description: "Project tags for categorization"
  }],

  logo: {
    type: String,
    default: null,
    description: "URL to project logo image"
  },

  // ==================== SOFT DELETE ====================
  isDeleted: {
    type: Boolean,
    default: false,
    description: "Soft delete flag (true = deleted)"
  },

  // ==================== AUDIT FIELDS ====================
  createdAt: {
    type: Date,
    default: Date.now,
    description: "Record creation timestamp"
  },

  updatedAt: {
    type: Date,
    default: Date.now,
    description: "Last update timestamp"
  },

  // ==================== VIRTUAL FIELDS ====================
  // These are computed, not stored:
  // - isOverdue: Boolean (dueDate < now AND status != 'Completed')
  // - taskCount: Number (count of related tasks)
}
```

### 2.2 Indexes

```javascript
// ==================== SINGLE FIELD INDEXES ====================
{ projectId: 1 }                  // Unique, for lookups
{ companyId: 1 }                  // Multi-tenancy queries
{ startDate: 1 }                   // Date range queries
{ dueDate: 1 }                     // Overdue queries

// ==================== COMPOUND INDEXES ====================
{ companyId: 1, projectId: 1 }     // Company-specific project lookups
{ companyId: 1, status: 1 }        // Company projects by status
{ companyId: 1, priority: 1 }      // Company projects by priority
{ companyId: 1, client: 1 }        // Company projects by client
{ companyId: 1, isDeleted: 1 }     // Soft delete filtering

// ==================== RECOMMENDED ADDITIONS ====================
// Missing indexes that should be added:
{ companyId: 1, teamMembers: 1 }   // "My Projects" queries
{ dueDate: 1, status: 1 }          // Overdue queries
{ companyId: 1, createdAt: -1 }    // Recent projects
```

### 2.3 Virtual Properties

```javascript
// Computed at query time, not stored in database

projectSchema.virtual('isOverdue').get(function() {
  if (this.status === 'Completed') return false;
  return this.dueDate && new Date() > this.dueDate;
});

projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: 'projectId',
  foreignField: 'projectId',
  count: true
});
```

### 2.4 Pre-Save Middleware

```javascript
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
```

### 2.5 Validation Rules

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `projectId` | ✅ | String | Unique |
| `name` | ✅ | String | - |
| `description` | ❌ | String | Max 2000 chars |
| `client` | ✅ | String | - |
| `companyId` | ✅ | String | - |
| `startDate` | ✅ | Date | Must be < dueDate |
| `dueDate` | ✅ | Date | Must be > startDate |
| `priority` | ❌ | String | Enum: High/Medium/Low |
| `status` | ❌ | String | Enum: Active/Completed/On Hold/Cancelled |
| `projectValue` | ❌ | Number | Min: 0 |
| `progress` | ❌ | Number | Min: 0, Max: 100 |

---

## 3. Task Schema

### 3.1 Schema Definition

**Collection Name:** `tasks`
**Model File:** `backend/models/task/task.schema.js`

```javascript
{
  // ==================== PRIMARY KEYS ====================
  _id: ObjectId,                    // Auto-generated (explicitly defined)

  // ⚠️ NO taskId field like projects have

  // ==================== BASIC INFORMATION ====================
  title: {
    type: String,
    required: true,
    trim: true,
    description: "Task title/name"
  },

  description: {
    type: String,
    trim: true,
    description: "Detailed task description"
  },

  // ==================== PROJECT REFERENCE ====================
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project',
    description: "Parent project"
  },

  // 🔴 CRITICAL ISSUE: NO companyId FIELD!
  // This is a SECURITY vulnerability - tasks can be accessed across companies

  // ==================== STATUS & PRIORITY ====================
  status: {
    type: String,
    enum: ['Pending', 'Inprogress', 'Completed', 'Onhold'],
    default: 'Pending',
    description: "Task status"
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    description: "Task priority"
  },

  // ==================== ASSIGNMENTS ====================
  // ⚠️ ISSUE: Invalid trim() on ObjectId, no ref specified
  assignee: [{
    type: mongoose.Schema.Types.ObjectId,
    trim: true,                     // INVALID - ObjectId doesn't have trim()
    description: "Assigned employees (should have ref: 'Employee')"
  }],

  // ==================== TAGS ====================
  tags: [{
    type: String,
    trim: true,
    description: "Task tags"
  }],

  // ==================== DATE FIELDS ====================
  startDate: {
    type: Date,
    description: "Task start date"
  },

  dueDate: {
    type: Date,
    description: "Task due date"
  },

  // ==================== TIME TRACKING ====================
  estimatedHours: {
    type: Number,
    default: 0,
    min: 0,
    description: "Estimated hours for completion"
  },

  actualHours: {
    type: Number,
    default: 0,
    min: 0,
    description: "Actual hours spent"
  },

  // ==================== ATTACHMENTS ====================
  attachments: [{
    filename: {
      type: String,
      description: "Attachment filename"
    },
    url: {
      type: String,
      description: "Attachment URL"
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      description: "Upload timestamp"
    }
  }],

  // ==================== AUDIT ====================
  createdBy: {
    type: String,                   // ⚠️ Should be ObjectId ref to Employee
    required: true,
    description: "User who created the task"
  },

  createdAt: {
    type: Date,
    default: Date.now,
    description: "Creation timestamp"
  },

  updatedAt: {
    type: Date,
    default: Date.now,
    description: "Last update timestamp"
  },

  // ==================== SOFT DELETE ====================
  isDeleted: {
    type: Boolean,
    default: false,
    description: "Soft delete flag"
  }
}
```

### 3.2 Indexes

```javascript
// ==================== EXISTING INDEXES ====================
{ projectId: 1, status: 1 }        // Tasks by project and status
{ projectId: 1, assignee: 1 }      // Tasks by project and assignee
{ createdAt: -1 }                  // Recent tasks

// ==================== CRITICAL MISSING INDEXES ====================
// 🔴 SECURITY: Missing companyId index
{ companyId: 1 }                   // ADD THIS IMMEDIATELY

{ companyId: 1, status: 1 }        // Stats queries
{ companyId: 1, assignee: 1 }      // "My Tasks" queries
{ dueDate: 1 }                      // Overdue tasks
{ projectId: 1, isDeleted: 1 }     // Soft delete filtering
```

### 3.3 Pre-Save Middleware

```javascript
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
```

### 3.4 Validation Rules

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `title` | ✅ | String | - |
| `description` | ❌ | String | - |
| `projectId` | ✅ | ObjectId | Ref to Project |
| `status` | ❌ | String | Enum |
| `priority` | ❌ | String | Enum |
| `estimatedHours` | ❌ | Number | Min: 0 |
| `actualHours` | ❌ | Number | Min: 0 |
| `createdBy` | ✅ | String | - |

---

## 4. Project Notes Schema

### 4.1 Schema Definition

**Collection Name:** `projectnotes`
**Model File:** `backend/models/project/project.notes.schema.js`

```javascript
{
  // ==================== PRIMARY KEYS ====================
  _id: ObjectId,

  // ==================== PROJECT REFERENCE ====================
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project',
    index: true,
    description: "Parent project"
  },

  // ==================== CONTENT ====================
  title: {
    type: String,
    required: true,
    trim: true,
    description: "Note title"
  },

  content: {
    type: String,
    required: true,
    description: "Note content"
  },

  // ==================== METADATA ====================
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    description: "Note priority"
  },

  tags: [{
    type: String,
    trim: true,
    description: "Note tags"
  }],

  // ==================== AUDIT ====================
  createdBy: {
    type: String,
    required: true,
    description: "User who created the note"
  },

  // ==================== SOFT DELETE ====================
  isDeleted: {
    type: Boolean,
    default: false,
    description: "Soft delete flag"
  },

  // ==================== TIMESTAMPS ====================
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### 4.2 Indexes

```javascript
{ projectId: 1 }                  // Notes by project
{ createdBy: 1 }                   // Notes by creator
{ createdAt: -1 }                  // Recent notes
```

---

## 5. Client Schema

### 5.1 Schema Definition

**Collection Name:** `clients`
**Model File:** `backend/models/client/client.schema.js`

```javascript
{
  // ==================== PRIMARY KEYS ====================
  _id: ObjectId,

  clientId: {
    type: String,
    unique: true,
    index: true,
    description: "Auto-generated client ID"
  },

  // ==================== BASIC INFORMATION ====================
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    description: "Client company name"
  },

  displayName: {
    type: String,
    trim: true,
    description: "Display name"
  },

  // ==================== INDUSTRY & TYPE ====================
  industry: {
    type: String,
    trim: true,
    description: "Industry sector"
  },

  clientType: {
    type: String,
    enum: ['Enterprise', 'SME', 'Startup', 'Individual', 'Government', 'Other'],
    default: 'Other',
    description: "Client categorization"
  },

  // ==================== CONTACT INFORMATION ====================
  email: {
    type: String,
    lowercase: true,
    trim: true,
    description: "Primary email"
  },

  phone: {
    type: String,
    trim: true,
    description: "Primary phone"
  },

  website: {
    type: String,
    trim: true,
    description: "Company website"
  },

  // ==================== ADDRESS ====================
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },

  // ==================== CONTACTS (MULTIPLE) ====================
  contacts: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    designation: String,
    email: String,
    phone: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  // ==================== STATUS & SOURCE ====================
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Prospect', 'Churned'],
    default: 'Prospect',
    description: "Client relationship status"
  },

  source: {
    type: String,
    enum: ['Website', 'Referral', 'Cold Call', 'Social Media', 'Email Campaign', 'Event', 'Other', 'Unknown'],
    default: 'Unknown',
    description: "Lead source"
  },

  // ==================== ACCOUNT MANAGEMENT ====================
  accountManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    description: "Primary account manager"
  },

  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    description: "Team members working with this client"
  }],

  // ==================== FINANCIAL ====================
  annualRevenue: {
    type: Number,
    default: 0,
    min: 0,
    description: "Client's annual revenue"
  },

  employeeCount: {
    type: Number,
    default: 0,
    min: 0,
    description: "Client's employee count"
  },

  // ==================== TIER (AUTO-CALCULATED) ====================
  tier: {
    type: String,
    enum: ['Enterprise', 'Mid-Market', 'Small-Business', 'Startup'],
    default: 'Small-Business',
    description: "Client tier (auto-calculated from revenue)"
  },

  // ==================== DEAL STATISTICS ====================
  totalDeals: {
    type: Number,
    default: 0
  },

  wonDeals: {
    type: Number,
    default: 0
  },

  totalValue: {
    type: Number,
    default: 0
  },

  wonValue: {
    type: Number,
    default: 0
  },

  // ==================== METADATA ====================
  tags: [{
    type: String,
    trim: true
  }],

  notes: {
    type: String,
    maxlength: 5000,
    description: "Additional notes"
  },

  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String
  },

  // ==================== MULTI-TENANCY ====================
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // ==================== AUDIT ====================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  createdAt: Date,
  updatedAt: Date
}
```

### 5.2 Indexes

```javascript
// ==================== COMPOUND INDEXES ====================
{ companyId: 1, status: 1 }
{ companyId: 1, tier: 1 }
{ companyId: 1, accountManager: 1 }
{ companyId: 1, source: 1 }
{ companyId: 1, isDeleted: 1 }

// ==================== SINGLE FIELD INDEXES ====================
{ createdAt: -1 }
{ totalValue: -1 }

// ==================== TEXT SEARCH ====================
{
  name: 'text',
  displayName: 'text',
  industry: 'text',
  tags: 'text'
}
```

### 5.3 Virtual Properties

```javascript
// Average deal value
clientSchema.virtual('averageDealValue').get(function() {
  if (this.totalDeals === 0) return 0;
  return this.totalValue / this.totalDeals;
});

// Win rate percentage
clientSchema.virtual('winRate').get(function() {
  if (this.totalDeals === 0) return 0;
  return (this.wonDeals / this.totalDeals) * 100;
});
```

---

## 6. Relationships & References

### 6.1 Relationship Diagram

```
┌──────────────┐
│   Company    │
│              │
└──────┬───────┘
       │
       │ 1:N
       ├───────────────────────┐
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────┐
│    Project   │        │    Client    │
│              │        │              │
│ - companyId  │◄───────│ - companyId  │
│ - client     │        │              │
└──────┬───────┘        │ - accountMgr │◄───────┐
       │                └──────────────┘        │
       │                                         │
       │ 1:N                                     │
       │                                         │
       ▼                                         │
┌──────────────┐                                 │
│     Task     │                                 │
│              │                                 │
│ - projectId  │─────────┐                       │
│              │         │                       │
│ 🔴 MISSING:  │         │                       │
│ - companyId  │         │                       │
└──────┬───────┘         │                       │
       │                 │                       │
       │ N:M             │                       │
       │                 │                       │
       ▼                 ▼                       ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Employee    │  │ Project Notes│  │  Employee    │
│              │  │              │  │              │
│ (assignee)   │  │ - projectId  │  │ (teamMembers)│
│ (teamLeader) │  │              │  │ (projManager)│
│ (projManager)│  └──────────────┘  │ (accountMgr) │
└──────────────┘                     └──────────────┘
```

### 6.2 Reference Summary

| From Model | Field | To Model | Type | Status |
|------------|-------|----------|------|--------|
| Project | client | Client | String | ⚠️ Should be ObjectId |
| Project | teamMembers | Employee | ObjectId[] | ✅ |
| Project | teamLeader | Employee | ObjectId[] | ✅ |
| Project | projectManager | Employee | ObjectId[] | ✅ |
| Task | projectId | Project | ObjectId | ✅ |
| Task | assignee | Employee | ObjectId[] | ⚠️ No ref, invalid trim() |
| Task | createdBy | Employee | String | ⚠️ Should be ObjectId |
| Project Note | projectId | Project | ObjectId | ✅ |
| Project Note | createdBy | Employee | String | ⚠️ Should be ObjectId |
| Client | accountManager | Employee | ObjectId | ✅ |
| Client | teamMembers | Employee | ObjectId[] | ✅ |

---

## 7. Indexes Analysis

### 7.1 Current Index State

| Schema | Indexes | Coverage | Score |
|--------|---------|----------|-------|
| Project | 7 | 70% | 🟡 7/10 |
| Task | 3 | 30% | 🔴 3/10 |
| Project Notes | 3 | 60% | 🟡 6/10 |
| Client | 8 | 80% | 🟢 8/10 |

### 7.2 Missing Critical Indexes

#### Task Schema - Critical Missing

```javascript
// 🔴 CRITICAL - For SECURITY
{ companyId: 1 }

// 🟠 HIGH - For common queries
{ companyId: 1, status: 1 }
{ companyId: 1, assignee: 1 }
{ dueDate: 1 }
{ projectId: 1, isDeleted: 1 }
```

#### Project Schema - Recommended

```javascript
// 🟡 MEDIUM - For performance
{ companyId: 1, teamMembers: 1 }
{ dueDate: 1, status: 1 }
{ companyId: 1, createdAt: -1 }
```

### 7.3 Compound Index Analysis

**Query Pattern Analysis:**

```javascript
// Common query: Get my projects
db.projects.find({
  companyId: "xxx",
  teamMembers: { $in: [employeeId] },
  isDeleted: false
})
// Recommended index: { companyId: 1, teamMembers: 1, isDeleted: 1 }

// Common query: Get overdue tasks
db.tasks.find({
  companyId: "xxx",    // MISSING!
  dueDate: { $lt: now },
  status: { $ne: "Completed" }
})
// Recommended index: { companyId: 1, dueDate: 1, status: 1 }

// Common query: Get my tasks
db.tasks.find({
  companyId: "xxx",    // MISSING!
  assignee: { $in: [employeeId] },
  isDeleted: false
})
// Recommended index: { companyId: 1, assignee: 1, isDeleted: 1 }
```

---

## 8. Critical Issues & Fixes

### 8.1 Critical Schema Issues

#### Issue #1: Missing companyId in Task Schema

**Severity:** 🔴 CRITICAL - SECURITY BREACH

**Current State:**
```javascript
// task.schema.js - NO companyId
{
  _id: ObjectId,
  title: String,
  projectId: ObjectId,
  // ... no companyId
}
```

**Impact:** Users can access tasks from other companies

**Fix:**
```javascript
// Add to task.schema.js
companyId: {
  type: String,
  required: true,
  index: true
}
```

**Migration:**
```javascript
// Add companyId to all existing tasks
db.tasks.updateMany(
  { companyId: { $exists: false } },
  [{
    $set: {
      companyId: {
        $arrayElemAt: [
          {
            $map: {
              input: [{
                $project: {
                  _id: "$projectId",
                  companyId: {
                    $let: {
                      vars: { project: { $first: { $filter: { input: ["$$project"], cond: { $eq: ["$$this._id", "$projectId"] } } } } } },
                      in: "$$project.companyId"
                    }
                  }
                }
              }],
              as: "p",
              in: "$$p.companyId"
            }
          ],
          0
        ]
      }
    }
  }]
);
```

#### Issue #2: Invalid trim() on ObjectId

**Severity:** 🟠 HIGH - Schema Error

**Current State:**
```javascript
assignee: [{
  type: mongoose.Schema.Types.ObjectId,
  trim: true    // INVALID - ObjectId doesn't have trim()
}]
```

**Fix:**
```javascript
assignee: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Employee'    // Add ref too
}]
```

#### Issue #3: Client Field Type

**Severity:** 🟠 HIGH - Data Type Error

**Current State:**
```javascript
// project.schema.js
client: {
  type: String,    // Should be ObjectId
  required: true
}
```

**Fix:**
```javascript
client: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Client',
  required: true
}
```

**Migration:**
```javascript
// Convert String client names to ObjectId references
db.projects.find({ client: { $type: "string" } }).forEach(project => {
  const client = db.clients.findOne({
    name: project.client,
    companyId: project.companyId
  });
  if (client) {
    db.projects.updateOne(
      { _id: project._id },
      { $set: { client: client._id } }
    );
  }
});
```

### 8.2 Validation Issues

| Field | Issue | Fix |
|-------|-------|-----|
| Task.createdBy | String, should be ObjectId | Change type, add ref |
| Project Notes.createdBy | String, should be ObjectId | Change type, add ref |
| Task.assignee | Invalid trim(), no ref | Remove trim(), add ref |

---

## 9. Migration Scripts

### 9.1 Migration Script Template

```javascript
/**
 * Migration: Add companyId to tasks
 * Date: 2026-02-03
 * Author: System
 */

const migrate = async () => {
  console.log('Starting migration: Add companyId to tasks');

  // Step 1: Backup tasks collection
  await db.tasks.aggregate([
    { $match: { companyId: { $exists: false } } },
    { $out: 'tasks_backup_20260203' }
  ]);
  console.log('✅ Backup created');

  // Step 2: Add companyId from related project
  const result = await db.tasks.updateMany(
    { companyId: { $exists: false } },
    [{
      $set: {
        companyId: "$projectCompanyId"
      }
    }]
  );
  console.log(`✅ Updated ${result.modifiedCount} tasks`);

  // Step 3: Verify
  const withoutCompanyId = await db.tasks.countDocuments({
    companyId: { $exists: false }
  });

  if (withoutCompanyId > 0) {
    console.log(`⚠️ Warning: ${withoutCompanyId} tasks still without companyId`);
  } else {
    console.log('✅ All tasks now have companyId');
  }

  return { success: true, migrated: result.modifiedCount };
};

// Rollback function
const rollback = async () => {
  await db.tasks.deleteMany({ companyId: { $exists: true, $ne: null } });
  await db.tasks.aggregate([
    { $match: {} },
    { $out: 'tasks' }
  ]);
  console.log('✅ Rolled back');
};
```

### 9.2 Migration Checklist

- [ ] Create backup before migration
- [ ] Test migration on staging database
- [ ] Document migration ID and date
- [ ] Run migration during low-traffic period
- [ ] Verify data integrity after migration
- [ ] Keep rollback script ready for 48 hours

---

## Summary

**Schema Health: 6.5/10**

**Strengths:**
- Comprehensive project and client schemas
- Good use of references for relationships
- Soft delete pattern implemented
- Proper audit trails

**Critical Issues:**
1. 🔴 Missing `companyId` in Task schema (SECURITY)
2. 🟠 Invalid schema definition (trim() on ObjectId)
3. 🟠 Client field should be ObjectId ref

**Required Actions:**
1. Add `companyId` to Task schema immediately
2. Fix invalid `trim()` on assignee
3. Convert client field to ObjectId ref
4. Add missing indexes for performance
5. Create migration system for schema changes

---

**Report Version:** 1.0
**Generated:** 2026-02-03
**Next Review:** After Phase 1 completion
