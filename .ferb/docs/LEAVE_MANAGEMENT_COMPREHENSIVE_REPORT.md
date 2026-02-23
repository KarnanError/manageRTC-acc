# Leave Management System - Comprehensive Analysis Report

## 📊 Executive Summary

This report provides a complete analysis of the Leave Management System, covering all pages, their purposes, access controls, permissions, data storage, and approval workflows.

**Report Date:** 2026-02-20
**System Version:** manageRTC-my
**Database:** MongoDB (Multi-tenant per company)

---

## 🗂️ System Architecture Overview

### Multi-Tenant Database Structure
```
AmasQIS (Superadmin Database)
├── companies (Company records)
├── packages (Subscription plans)
├── modules (Feature modules)
├── pages (Page definitions)
├── permissions (Page permissions)
├── roles (User roles)
└── role_permissions (Role-permission junction table)

{companyId} (Company-specific Database)
├── leaves (Leave requests) ← Main storage for approval requests
├── leaveTypes (Leave type configurations)
├── leaveLedger (Balance history/transactions)
├── employees (Employee records)
└── departments (Department records)
```

### Leave Request Data Flow
```
1. Employee creates leave → leaves collection
2. Balance update → leaveLedger collection
3. Notification → Socket.IO broadcast
4. Manager approval → leaves collection (update)
5. Balance deduction → leaveLedger collection
```

---

## 📄 Page-by-Page Analysis

### 1️⃣ Leaves (Admin) - `/leaves`

**Purpose:** HR/Admin view of all leave requests in the company with full visibility and approval capabilities.

**Access Control:**
| Role | Access Level | Scope |
|------|-------------|-------|
| `hr` | ✅ Full Access | All leaves in their department |
| `admin` | ✅ Full Access | All leaves in the company |
| `superadmin` | ✅ Full Access | All leaves in all companies |

**Page Code:** `hrm.leaves-admin`
**Database Query:**
```javascript
{
  companyId: user.companyId,
  departmentId: currentEmployee.departmentId, // HR scoped to department
  isDeleted: { $ne: true }
}
```

**Capabilities:**
- View all leave requests (past and present)
- Filter by status (pending, approved, rejected, cancelled)
- Filter by leave type (sick, casual, earned, etc.)
- Filter by date range
- Filter by employee
- **Approve/Reject pending requests**
- View leave details
- Cancel leaves (before approval)
- Export leave data

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaves` | Get all leaves (role-filtered) |
| PUT | `/api/leaves/:id/approve` | Approve leave request |
| PUT | `/api/leaves/:id/reject` | Reject leave request |
| PUT | `/api/leaves/:id/cancel` | Cancel leave request |
| DELETE | `/api/leaves/:id` | Delete leave request |

**Key Schema Fields (leaves collection):**
```javascript
{
  leaveId: "leave_xxx",
  employeeId: "EMP001",
  companyId: "698195cc0afbe3284fd5aa60",
  departmentId: "DEPT001",
  leaveType: "sick", // sick, casual, earned, etc.
  startDate: Date,
  endDate: Date,
  duration: Number,
  reason: String,
  status: "pending", // pending, approved, rejected, cancelled
  managerStatus: "pending", // Manager approval status
  hrStatus: "pending", // HR review status
  finalStatus: "pending", // Final combined status
  reportingManagerId: "EMP002",
  approvedBy: ObjectId,
  approvedAt: Date,
  approvalComments: String,
  rejectedBy: ObjectId,
  rejectedAt: Date,
  rejectionReason: String
}
```

---

### 2️⃣ Leaves (Employee) - `/leaves-employee`

**Purpose:** Employee self-service portal for managing personal leave requests.

**Access Control:**
| Role | Access Level | Scope |
|------|-------------|-------|
| `employee` | ✅ Full Access | Own leave requests only |
| `hr` | ✅ Full Access | All leaves (can also use admin view) |
| `admin` | ✅ Full Access | All leaves |
| `superadmin` | ✅ Full Access | All leaves |

**Page Code:** `hrm.leaves-employee`
**Database Query:**
```javascript
{
  companyId: user.companyId,
  employeeId: currentEmployee.employeeId, // Self-only
  isDeleted: { $ne: true }
}
```

**Capabilities:**
- View own leave history
- Create new leave requests
- **Cancel pending leave requests**
- View leave balance
- Upload supporting documents (medical certificates)
- Add handover information
- View approval status

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaves/my` | Get own leave requests |
| POST | `/api/leaves` | Create new leave request |
| PUT | `/api/leaves/:id/cancel` | Cancel pending request |
| GET | `/api/leave-ledger/my-summary` | Get leave balance summary |

**Leave Creation Flow:**
```
1. Employee submits form
2. System checks:
   - Leave balance availability
   - Overlapping leave requests
   - Reporting manager assignment
3. Creates record in leaves collection
4. Creates transaction in leaveLedger (pending)
5. Sends notification to reporting manager
6. Status: pending
```

---

### 3️⃣ Team Leaves - `/team-leaves`

**Purpose:** Reporting manager dashboard for viewing and approving team member leave requests.

**Access Control:**
| Role | Access Level | Scope |
|------|-------------|-------|
| `manager` | ✅ Full Access | Team members' leaves (employees reporting to them) |
| `hr` | ✅ Full Access | Can view (uses department scope) |
| `admin` | ✅ Full Access | All leaves |
| `superadmin` | ✅ Full Access | All leaves |

**Page Code:** `hrm.team-leaves`
**Database Query:**
```javascript
{
  companyId: user.companyId,
  reportingManagerId: currentEmployee.employeeId, // Manager's team only
  isDeleted: { $ne: true }
}
```

**Capabilities:**
- View team's leave requests
- **Approve/Reject team leave requests**
- See team leave calendar
- View team leave statistics
- Filter by team member
- Filter by status/leave type
- Add rejection reason
- View overlapping leaves

**Dashboard Statistics:**
```
- Team Size: Total team members
- On Leave Today: Team members currently on leave
- Pending Approvals: Awaiting manager action
- Approved This Month: Leaves approved this month
- Total Team Leaves: All-time team leaves
```

**Approval Actions:**
```javascript
// Approve leave
PUT /api/leaves/:id/approve
Body: { comments: "Approved, enjoy your break!" }
Result: {
  status: "approved",
  managerStatus: "approved",
  finalStatus: "approved", // May change if HR review needed
  approvedBy: managerId,
  approvedAt: Date
}

// Reject leave
PUT /api/leaves/:id/reject
Body: { reason: "Insufficient staff coverage during this period" }
Result: {
  status: "rejected",
  managerStatus: "rejected",
  finalStatus: "rejected",
  rejectedBy: managerId,
  rejectedAt: Date,
  rejectionReason: "..."
}
```

**Approval Notification Flow:**
```
1. Manager approves/rejects
2. System updates leaves collection
3. System updates leaveLedger (if approved)
4. Socket.IO broadcast to employee
5. Email notification to employee
6. Calendar event created/updated
```

---

### 4️⃣ Leave Calendar - `/leave-calendar`

**Purpose:** Visual calendar view showing leave schedules for the current user (or team for managers).

**Access Control:**
| Role | Access Level | Scope |
|------|-------------|-------|
| `employee` | ✅ Read Only | Own leaves only |
| `manager` | ✅ Read Only | Own leaves + team leaves |
| `hr` | ✅ Read Only | Own leaves + department leaves |
| `admin` | ✅ Read Only | All leaves |
| `superadmin` | ✅ Read Only | All leaves |

**Page Code:** `hrm.leave-calendar`
**Data Source:**
- Managers: Fetches all team leaves (`GET /api/leaves`)
- Others: Fetches own leaves (`GET /api/leaves/my`)

**Capabilities:**
- Monthly calendar view
- Legend by leave type (color-coded)
- Status indicators (✓ approved, ✗ rejected, ? pending)
- Filter by leave type
- Filter by status
- Navigate between months
- Click to view leave details
- Export calendar (future feature)

**Color Legend:**
```javascript
{
  sick: { bg: '#e3f2fd', border: '#2196f3', text: '#1976d2' },     // Blue
  casual: { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },   // Purple
  earned: { bg: '#e8f5e9', border: '#4caf50', text: '#388e3c' },   // Green
  maternity: { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' }, // Pink
  paternity: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },  // Light Blue
  bereavement: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },// Orange
  compensatory: { bg: '#fff8e1', border: '#ffc107', text: '#f57c00' },// Amber
  unpaid: { bg: '#ffebee', border: '#f44336', text: '#c62828' },    // Red
  special: { bg: '#f3e5f5', border: '#673ab7', text: '#512da8' }    // Indigo
}
```

---

### 5️⃣ Leave Balance History - `/leave-ledger`

**Purpose:** Complete audit trail of all leave balance changes for each employee.

**Access Control:**
| Role | Access Level | Scope |
|------|-------------|-------|
| `employee` | ✅ Read Only | Own balance history |
| `manager` | ✅ Read Only | Own balance history |
| `hr` | ✅ Read Only | Own balance history |
| `admin` | ✅ Read/Write | Can view and adjust all employees' balances |
| `superadmin` | ✅ Read/Write | Full access |

**Page Code:** `hrm.leave-ledger`
**Database Query (for employees):**
```javascript
{
  employeeId: currentEmployee.employeeId,
  isDeleted: false
}
```

**Capabilities (Employees):**
- View complete balance history
- Filter by leave type
- Filter by date range
- Filter by transaction type
- View current balance for each leave type
- Export statement

**Capabilities (Admin/HR):**
- All employee capabilities PLUS:
- **Manual balance adjustments**
- Add carry forward credits
- Process leave encashment
- Adjust for errors
- View any employee's history

**Transaction Types:**
| Type | Description | Amount Example |
|------|-------------|----------------|
| `opening` | Opening balance at period start | 0 |
| `allocated` | Leave credited (annual accrual) | +15 |
| `used` | Leave taken (approved leave) | -3 |
| `restored` | Leave restored after cancellation | +3 |
| `carry_forward` | Brought from previous year | +5 |
| `encashed` | Converted to cash | -5 |
| `adjustment` | Manual adjustment by HR | ±X |
| `expired` | Leave validity period over | -2 |

**Ledger Entry Schema (leaveLedger collection):**
```javascript
{
  employeeId: "EMP001",
  companyId: "698195cc0afbe3284fd5aa60",
  leaveType: "earned",
  transactionType: "used",
  amount: -3, // Negative for debit
  balanceBefore: 12,
  balanceAfter: 9,
  leaveId: ObjectId("..."),
  transactionDate: Date,
  financialYear: "FY2024-2025",
  year: 2024,
  month: 2,
  description: "Leave used",
  details: {
    startDate: Date,
    endDate: Date,
    duration: 3,
    reason: "Family vacation"
  },
  changedBy: ObjectId("..."), // For manual adjustments
  adjustmentReason: String // For manual adjustments
}
```

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave-ledger/my-summary` | Get current balances |
| GET | `/api/leave-ledger/my-history` | Get transaction history |
| POST | `/api/leave-ledger/adjustment` | Manual adjustment (admin only) |
| POST | `/api/leave-ledger/carry-forward` | Process carry forward |

---

### 6️⃣ Leave Settings - `/leave-settings`

**Purpose:** Configure leave types and policies for the company.

**Access Control:**
| Role | Access Level | Scope |
|------|-------------|-------|
| `admin` | ✅ Full Access | Full control over all settings |
| `superadmin` | ✅ Full Access | Full control over all settings |
| `hr` | ❌ No Access | Restricted to admin only |
| `manager` | ❌ No Access | Restricted to admin only |
| `employee` | ❌ No Access | Restricted to admin only |

**Page Code:** `hrm.leave-settings`
**RBAC Permission:** Only users with `hrm.leave-settings` page access (admin/superadmin)

**Capabilities:**
- Create/Edit/Delete leave types
- Configure leave quotas per type
- Set approval requirements
- Configure carry forward rules
- Set encashment rules
- Upload required documents for specific leave types
- Assign approvers for leave types
- Set leave accrual rates

**Leave Type Configuration (leaveTypes collection):**
```javascript
{
  leaveTypeId: "LT-EARNED-123",
  companyId: "698195cc0afbe3284fd5aa60",
  name: "Annual Leave",
  code: "EARNED",
  annualQuota: 15, // Days per year
  isPaid: true,
  requiresApproval: true,
  // Carry Forward
  carryForwardAllowed: true,
  maxCarryForwardDays: 5,
  carryForwardExpiry: 90, // Days after which it expires
  // Encashment
  encashmentAllowed: true,
  maxEncashmentDays: 10,
  encashmentRatio: 1, // 1.0 = full salary
  // Restrictions
  minNoticeDays: 1,
  maxConsecutiveDays: 0, // 0 = no limit
  requiresDocument: false,
  acceptableDocuments: ["Medical Certificate", "Doctor's Note"],
  // Accrual
  accrualRate: 1.25, // Days per month
  accrualMonth: 1, // Month when accrual happens
  // Display
  color: "#52c41a",
  icon: "ti ti-calendar",
  description: "Annual earned leave",
  isActive: true
}
```

**Default Leave Types (Seeded per Company):**
| Type | Quota | Paid | Carry Forward | Encashment |
|------|-------|------|---------------|------------|
| Annual Leave | 15 days | ✅ | ✅ 5 days | ✅ 10 days |
| Sick Leave | 10 days | ✅ | ❌ | ❌ |
| Casual Leave | 12 days | ✅ | ❌ | ❌ |
| Maternity Leave | 90 days | ✅ | ❌ | ❌ |
| Paternity Leave | 5 days | ✅ | ❌ | ❌ |
| Bereavement Leave | 3 days | ✅ | ❌ | ❌ |
| Compensatory Off | 0 days | ✅ | ✅ 5 days | ❌ |
| Loss of Pay | Unlimited | ❌ | ❌ | ❌ |
| Special Leave | 5 days | ✅ | ❌ | ❌ |

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave-types` | Get all leave types |
| GET | `/api/leave-types/active` | Get active leave types (for dropdowns) |
| POST | `/api/leave-types` | Create new leave type |
| PUT | `/api/leave-types/:id` | Update leave type |
| PATCH | `/api/leave-types/:id/toggle` | Activate/deactivate |
| DELETE | `/api/leave-types/:id` | Delete leave type |

---

## 🔄 Approval Workflow

### Request Approval Chain

```
┌─────────────────────────────────────────────────────────────┐
│                    LEAVE REQUEST LIFECYCLE                    │
└─────────────────────────────────────────────────────────────┘

1. EMPLOYEE CREATES REQUEST
   ├─ Status: pending
   ├─ managerStatus: pending
   ├─ hrStatus: pending
   └─ finalStatus: pending
   │
   ▼
2. REPORTING MANAGER REVIEW (If reporting manager exists)
   ├─ APPROVE → managerStatus: approved
   ├─ REJECT → status: rejected, finalStatus: rejected
   └─ If approved: Forwards to HR (if hrReview required)
   │
   ▼
3. HR REVIEW (If isHRFallback or long leave)
   ├─ APPROVE → hrStatus: approved
   ├─ REJECT → status: rejected
   └─ Final status determined
   │
   ▼
4. FINAL STATUS
   ├─ If managerStatus: approved and hrStatus: approved
   │   → status: approved, finalStatus: approved
   ├─ If either rejected
   │   → status: rejected, finalStatus: rejected
   └─ If pending
   │   → status: pending, finalStatus: pending
```

### Approval Storage Location

**Primary Collection:** `leaves` (in company's database)

**Approval Status Fields:**
```javascript
{
  // Overall status
  status: "pending | approved | rejected | cancelled",

  // Manager approval (for reporting manager)
  managerStatus: "pending | approved | rejected",

  // HR approval (for HR fallback or long leaves)
  hrStatus: "pending | approved | rejected",

  // Final computed status
  finalStatus: "pending | approved | rejected",

  // Approval metadata
  approvedBy: ObjectId,
  approvedAt: Date,
  approvalComments: String,
  rejectedBy: ObjectId,
  rejectedAt: Date,
  rejectionReason: String
}
```

### HR Fallback (When No Reporting Manager)

```javascript
// From leave.controller.js line 396-405
const hasNoReportingManager = userRole === 'employee' && !reportingManagerId;
const isHRFallback = hasNoReportingManager;

if (hasNoReportingManager) {
  logger.info('No reporting manager found, routing to HR for approval');
}

// Create leave with HR fallback
const leaveToInsert = {
  ...
  managerStatus: isHRFallback ? 'approved' : 'pending',
  isHRFallback, // Flag to indicate HR should handle this
  ...
};
```

---

## 🔐 Role-Based Access Control Matrix

### Page Access by Role

| Page | employee | manager | hr | admin | superadmin |
|------|----------|---------|-----|-------|------------|
| Leaves (Admin) | ❌ | ❌ | ✅ Dept Only | ✅ All | ✅ All |
| Leaves (Employee) | ✅ Self | ✅ Self | ✅ All | ✅ All | ✅ All |
| Team Leaves | ❌ | ✅ Team | ✅ Dept | ✅ All | ✅ All |
| Leave Calendar | ✅ Self | ✅ Team | ✅ Dept | ✅ All | ✅ All |
| Leave Balance History | ✅ Self | ✅ Self | ✅ Self | ✅ All | ✅ All |
| Leave Settings | ❌ | ❌ | ❌ | ✅ Full | ✅ Full |

### Permission Actions by Role

| Action | employee | manager | hr | admin | superadmin |
|--------|----------|---------|-----|-------|------------|
| View own leaves | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create leave request | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancel own leave | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve team leaves | ❌ | ✅ | ✅ | ✅ | ✅ |
| Reject team leaves | ❌ | ✅ | ✅ | ✅ | ✅ |
| View department leaves | ❌ | ❌ | ✅ | ✅ | ✅ |
| View all leaves | ❌ | ❌ | ❌ | ✅ | ✅ |
| Adjust leave balances | ❌ | ❌ | ❌ | ✅ | ✅ |
| Configure leave types | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete leave types | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 📦 Data Storage Details

### 1. Leaves Collection (Main Storage)

**Location:** `{companyId}.leaves`
**Purpose:** Store all leave requests

**Key Indexes:**
```javascript
{ employee: 1, status: 1 }           // Employee's leaves by status
{ companyId: 1, status: 1 }          // Company-wide status
{ companyId: 1, leaveType: 1 }       // By leave type
{ companyId: 1, departmentId: 1 }    // Department leaves
{ employee: 1, isDeleted: 1 }       // Employee's active leaves
{ companyId: 1, startDate: -1 }     // Chronological
{ reportingManagerId: 1 }           // Manager's team leaves
```

**Sample Document:**
```javascript
{
  _id: ObjectId("..."),
  leaveId: "leave_1234567890_abc123",
  companyId: "698195cc0afbe3284fd5aa60",
  employeeId: "EMP001",
  employeeName: "John Doe",
  departmentId: "DEPT001",
  leaveType: "sick",
  startDate: ISODate("2024-02-15"),
  endDate: ISODate("2024-02-17"),
  duration: 3,
  reason: "Not feeling well",
  status: "approved",
  managerStatus: "approved",
  hrStatus: "approved",
  finalStatus: "approved",
  reportingManagerId: "EMP002",
  approvedBy: ObjectId("EMP002"),
  approvedAt: ISODate("2024-02-14T10:30:00Z"),
  approvalComments: "Get well soon!",
  createdAt: ISODate("2024-02-10T09:00:00Z"),
  updatedAt: ISODate("2024-02-14T10:30:00Z")
}
```

### 2. Leave Ledger Collection (Balance History)

**Location:** `{companyId}.leaveLedger`
**Purpose:** Audit trail of all balance changes

**Key Indexes:**
```javascript
{ employeeId: 1, leaveType: 1, transactionDate: -1 }
{ companyId: 1, transactionDate: -1 }
{ employeeId: 1, financialYear: 1, leaveType: 1 }
{ employeeId: 1, year: 1, month: 1, leaveType: 1 }
```

**Sample Document:**
```javascript
{
  _id: ObjectId("..."),
  employeeId: "EMP001",
  companyId: "698195cc0afbe3284fd5aa60",
  leaveType: "earned",
  transactionType: "used",
  amount: -3,
  balanceBefore: 12,
  balanceAfter: 9,
  leaveId: ObjectId("..."),
  transactionDate: ISODate("2024-02-15"),
  financialYear: "FY2024-2025",
  year: 2024,
  month: 2,
  description: "Leave used",
  details: {
    startDate: ISODate("2024-02-15"),
    endDate: ISODate("2024-02-17"),
    duration: 3,
    reason: "Family vacation"
  },
  createdAt: ISODate("2024-02-15T11:00:00Z")
}
```

### 3. Leave Types Collection (Configuration)

**Location:** `AmasQIS.leaveTypes` (shared, filtered by companyId)
**Purpose:** Configure leave types per company

**Key Indexes:**
```javascript
{ companyId: 1, code: 1, isActive: 1, isDeleted: 1 }
{ companyId: 1, name: 1, isActive: 1, isDeleted: 1 }
```

---

## 🌐 API Endpoints Summary

### Leave Management APIs

| Method | Endpoint | Admin | HR | Manager | Employee | Description |
|--------|----------|-------|----|---------|----------|-------------|
| **GET** | `/api/leaves` | ✅ All | ✅ Dept | ✅ Team | ❌ | Get leaves (role-filtered) |
| **GET** | `/api/leaves/my` | ✅ | ✅ | ✅ | ✅ | Get own leaves |
| **GET** | `/api/leaves/stats` | ✅ | ✅ | ✅ | ✅ | Get leave statistics |
| **GET** | `/api/leaves/:id` | ✅ | ✅ | ✅ | ✅ | Get single leave |
| **POST** | `/api/leaves` | ✅ | ✅ | ✅ | ✅ | Create leave request |
| **PUT** | `/api/leaves/:id` | ✅ Own | ✅ Dept | ✅ Team | ✅ Own | Update leave |
| **PUT** | `/api/leaves/:id/approve` | ✅ | ✅ | ✅ | ❌ | Approve leave |
| **PUT** | `/api/leaves/:id/reject` | ✅ | ✅ | ✅ | ❌ | Reject leave |
| **PUT** | `/api/leaves/:id/cancel` | ✅ | ✅ | ✅ | ✅ | Cancel leave |
| **DELETE** | `/api/leaves/:id` | ✅ | ✅ | ✅ | ❌ | Delete leave |
| **GET** | `/api/leave-ledger/my-summary` | ✅ | ✅ | ✅ | ✅ | Get balance summary |
| **GET** | `/api/leave-ledger/my-history` | ✅ | ✅ | ✅ | ✅ | Get balance history |
| **POST** | `/api/leave-ledger/adjustment` | ✅ | ❌ | ❌ | ❌ | Manual adjustment |
| **POST** | `/api/leave-ledger/carry-forward` | ✅ | ❌ | ❌ | ❌ | Carry forward |
| **GET** | `/api/leave-types` | ✅ | ✅ | ✅ | ✅ | Get leave types |
| **GET** | `/api/leave-types/active` | ✅ | ✅ | ✅ | ✅ | Get active leave types |
| **POST** | `/api/leave-types` | ✅ | ❌ | ❌ | ❌ | Create leave type |
| **PUT** | `/api/leave-types/:id` | ✅ | ❌ | ❌ | ❌ | Update leave type |
| **DELETE** | `/api/leave-types/:id` | ✅ | ❌ | ❌ | ❌ | Delete leave type |

---

## 📱 Frontend-Backend Communication

### Real-time Updates (Socket.IO)

Leave updates are broadcast via Socket.IO:

```javascript
// Events emitted
broadcastLeaveEvents.created(io, companyId, leave)
broadcastLeaveEvents.updated(io, companyId, leave)
broadcastLeaveEvents.approved(io, companyId, leave)
broadcastLeaveEvents.rejected(io, companyId, leave)
broadcastLeaveEvents.cancelled(io, companyId, leave)
broadcastLeaveEvents.deleted(io, companyId, leaveId)
```

**Who receives updates?**
- Employee: Their own leave updates
- Manager: Team leave updates
- HR: Department leave updates
- Admin: All leave updates

---

## 📊 Dashboard Statistics

### Team Leaves Dashboard (Manager View)

```javascript
{
  teamSize: 10,           // Total team members
  onLeaveToday: 2,         // Currently on leave
  pendingApprovals: 3,     // Awaiting action
  approvedThisMonth: 5,    // Approved this month
  totalTeamLeaves: 45      // Total leaves (all time)
}
```

### Leave Balance Summary

```javascript
{
  sick: { balance: 5, used: 3, total: 10, pending: 1 },
  casual: { balance: 8, used: 2, total: 10, pending: 0 },
  earned: { balance: 12, used: 3, total: 15, pending: 0 },
  compensatory: { balance: 2, used: 0, total: 0, pending: 0 }
}
```

---

## 🎯 Key Features by Role

### Employee
- ✅ Apply for leave online
- ✅ View leave balance
- ✅ Track leave status
- ✅ Cancel pending requests
- ✅ View leave calendar
- ✅ Download balance statement

### Manager
- ✅ All employee features
- ✅ Approve/reject team leaves
- ✅ View team leave calendar
- ✅ View team leave statistics
- ✅ Check team availability

### HR
- ✅ All manager features
- ✅ View department-wide leaves
- ✅ Process HR fallback requests
- ✅ Adjust employee balances
- ✅ Run leave reports
- ✅ Manage leave types

### Admin
- ✅ All HR features
- ✅ Configure leave policies
- ✅ Create custom leave types
- ✅ Adjust any employee's balance
- ✅ View company-wide leave reports

---

## 📌 Important Notes

### 1. Leave Balance Calculation
```javascript
// Current Balance = Total Allocated - Used + Pending
currentBalance = total - used - pending

// When leave is approved:
used = used + duration
balanceAfter = balanceBefore - duration
```

### 2. Overlap Detection
Employees cannot apply for overlapping leave (same date range). Only managers/admin can override this check.

### 3. HR Fallback Mode
When an employee has no reporting manager, requests go directly to HR with `managerStatus: 'approved'` automatically.

### 4. Leave Cancellation Rules
- Pending leaves: Can be cancelled by employee
- Approved leaves: Cannot be cancelled (must use "Leave Return" or contact admin)
- Cancelled leaves restore the balance to the ledger

### 5. Carry Forward
- Processed annually (typically at year end)
- Only for leave types with `carryForwardAllowed: true`
- Respects `maxCarryForwardDays` limit
- Expires after `carryForwardExpiry` days

### 6. Multi-Level Approval
Currently supports:
- Manager approval (first level)
- HR review (optional, for specific cases)

Future expansion may include:
- Additional approvers
- Auto-approval rules
- Delegation

---

## 🔗 Related Files Reference

### Backend
- **Schema:** [backend/models/leave/leave.schema.js](backend/models/leave/leave.schema.js)
- **Ledger Schema:** [backend/models/leave/leaveLedger.schema.js](backend/models/leave/leaveLedger.schema.js)
- **Leave Type Schema:** [backend/models/leave/leaveType.schema.js](backend/models/leave/leaveType.schema.js)
- **Controller:** [backend/controllers/rest/leave.controller.js](backend/controllers/rest/leave.controller.js)
- **Routes:** [backend/routes/api/leave.js](backend/routes/api/leave.js)

### Frontend
- **Admin View:** [react/src/feature-module/hrm/attendance/leaves/leaveAdmin.tsx](react/src/feature-module/hrm/attendance/leaves/leaveAdmin.tsx)
- **Employee View:** [react/src/feature-module/hrm/attendance/leaves/leaveEmployee.tsx](react/src/feature-module/hrm/attendance/leaves/leaveEmployee.tsx)
- **Team Leaves:** [react/src/feature-module/hrm/attendance/leaves/leaveManager.tsx](react/src/feature-module/hrm/attendance/leaves/leaveManager.tsx)
- **Calendar:** [react/src/feature-module/hrm/attendance/leaves/leaveCalendar.tsx](react/src/feature-module/hrm/attendance/leaves/leaveCalendar.tsx)
- **Ledger:** [react/src/feature-module/hrm/attendance/leaves/leaveLedger.tsx](react/src/feature-module/hrm/attendance/leaves/leaveLedger.tsx)
- **Settings:** [react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx](react/src/feature-module/hrm/attendance/leaves/leavesettings.tsx)

---

## 📝 Recommendations

### For Implementation
1. **RBAC Permissions:** Ensure all 6 pages have proper role-based access configured
2. **Approval Workflow:** Test manager and HR approval flows thoroughly
3. **Balance Calculation:** Verify ledger entries on every status change
4. **Notifications:** Set up email notifications for approvals
5. **Calendar Sync:** Consider integrating with external calendars (Outlook, Google Calendar)

### For Security
1. **Data Isolation:** Verify multi-tenant data separation
2. **Access Control:** Regularly audit role permissions
3. **Audit Trail:** Maintain ledger for compliance
4. **Document Storage:** Secure medical certificates and sensitive documents

---

**Report Generated:** 2026-02-20
**System Version:** manageRTC-my
**Author:** Claude (Anthropic)
