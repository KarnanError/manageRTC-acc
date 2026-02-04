# Employee Re-Registration Strategy
## Multi-Tenant HRMS System Design Analysis

**Date:** February 3, 2026
**Scenario:** Employee (User 1) terminated from Company A, later joins Company B with same email address

---

## Executive Summary

This document outlines strategies for handling employee re-registration and cross-company employment in a multi-tenant HRMS system. The core challenge is balancing **global user identity** (authentication) with **tenant-specific employment records** while maintaining data integrity and supporting various business scenarios.

---

## 1. Problem Analysis

### 1.1 The Scenario
```
Timeline:
─────────────────────────────────────────────────────────────
T1: User 1 → Company A → Email: user@example.com
T2: User 1 terminated from Company A
    - Record moved to terminated_employees collection
    - Clerk user account still exists
T3: User 1 joins Company B
    - Same email: user@example.com
    - Should create new employment record
    - Authentication: Reuse existing Clerk account
─────────────────────────────────────────────────────────────
```

### 1.2 Key Questions
1. **Authentication:** Should User 1 have a new Clerk account or reuse the existing one?
2. **Email Uniqueness:** Is email unique globally or per-company?
3. **Data Privacy:** Can Company A see User 1's new employment at Company B?
4. **Re-hiring:** What if User 1 returns to Company A later?

---

## 2. Architectural Approaches

### Approach A: **Global User, Per-Company Employment Records** (Recommended)

#### Concept
- **Single Clerk User Account** per email (global identity)
- **Multiple Employment Records** linked to same user (one per company)
- Employment records are **tenant-isolated**

#### Data Model
```
┌─────────────────────────────────────────────────────────────┐
│                    CLERK (Global)                           │
├─────────────────────────────────────────────────────────────┤
│ User ID: user_abc123                                        │
│ Email: user@example.com                                     │
│ Metadata: {                                                 │
│   previousCompanies: ["company_A_id"],                      │
│   currentCompany: "company_B_id",                           │
│   role: "employee"                                          │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              COMPANY A (Tenant DB)                          │
├─────────────────────────────────────────────────────────────┤
│ Collection: employees                                       │
│ {                                                           │
│   _id: emp_001,                                             │
│   clerkUserId: "user_abc123",                               │
│   employeeId: "EMP001",                                     │
│   status: "terminated",                                     │
│   terminationDate: "2025-12-15"                             │
│ }                                                           │
│                                                             │
│ Collection: terminated_employees                            │
│ {                                                           │
│   originalEmployeeId: "emp_001",                            │
│   clerkUserId: "user_abc123",                               │
│   terminationReason: "performance",                         │
│   terminatedBy: "admin_123"                                 │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              COMPANY B (Tenant DB)                          │
├─────────────────────────────────────────────────────────────┤
│ Collection: employees                                       │
│ {                                                           │
│   _id: emp_002,                                             │
│   clerkUserId: "user_abc123",                               │
│   employeeId: "EMP001",                                     │
│   status: "active",                                         │
│   joiningDate: "2026-01-15",                                │
│   firstName: "John",                                        │
│   lastName: "Doe"                                           │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

#### Pros
- Single sign-on experience for users
- Complete employment history across companies (for reporting/analytics)
- Clerk handles email uniqueness automatically
- Simplified password management
- Better UX for users changing jobs

#### Cons
- Requires careful data isolation between tenants
- More complex queries (need to filter by tenant)
- Potential data privacy concerns

---

### Approach B: **Separate User Per Company**

#### Concept
- **New Clerk User Account** for each company employment
- Email may be duplicated (with Clerk customization)
- Complete isolation between companies

#### Data Model
```
Clerk Users:
- user_abc123 → Company A (terminated)
- user_xyz789 → Company B (active)
Both have email: user@example.com
```

#### Pros
- Complete data isolation
- Simpler tenant queries
- No cross-company data leakage risk

#### Cons
- Poor user experience (multiple accounts)
- Clerk requires customization for duplicate emails
- Lost employment history across companies
- Users must remember multiple credentials

---

## 3. Recommended Implementation Strategy

### 3.1 Authentication Layer (Clerk)

#### Clerk User Account Behavior
```javascript
// Clerk configuration (already in place)
{
  email: "user@example.com",
  userId: "user_abc123",  // UNIQUE, GLOBAL
  publicMetadata: {
    companyId: null,  // Current company (changes with employment)
    role: null        // Current role (changes with employment)
  },
  privateMetadata: {
    employmentHistory: [
      {
        companyId: "company_A_id",
        role: "employee",
        startDate: "2025-01-01",
        endDate: "2025-12-15",
        status: "terminated"
      }
    ]
  }
}
```

#### Key Principle
> **Clerk user = Global Identity**
> **Employee record = Employment Relationship**

### 3.2 Database Schema Design

#### Employees Collection (Per Tenant)
```javascript
{
  _id: ObjectId,
  clerkUserId: String,           // Links to Clerk (not unique in collection)
  employeeId: String,            // Company-specific employee ID (unique per company)
  firstName: String,
  lastName: String,
  email: String,                 // Employee's email (may duplicate across companies)
  contact: {
    email: String,
    phone: String
  },
  status: String,                // "active", "terminated", "on-leave", "resigned"
  employmentType: String,
  employmentStatus: String,
  joiningDate: Date,
  terminationDate: Date,         // Null if active

  // Audit fields
  companyId: ObjectId,           // Redundant but useful for queries
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
  updatedBy: String
}

// Indexes
db.employees.createIndex(
  { clerkUserId: 1, companyId: 1 },
  { unique: true }  // One active employee record per user per company
)
db.employees.createIndex({ employeeId: 1 }, { unique: true })
db.employees.createIndex({ email: 1 })  // Not unique - allows same email across companies
```

#### Terminated Employees Collection (Per Tenant)
```javascript
{
  _id: ObjectId,
  originalEmployeeId: ObjectId,   // Reference to original employee record
  clerkUserId: String,
  employeeId: String,
  terminationDate: Date,
  terminationReason: String,
  terminatedBy: String,
  terminationNotes: String,

  // Snapshot of employee data at termination
  employeeSnapshot: {
    firstName: String,
    lastName: String,
    email: String,
    designation: String,
    department: String
  },

  createdAt: Date
}
```

---

## 4. Handling Key Scenarios

### 4.1 Scenario 1: Employee Terminated (Current Implementation)

```javascript
// When terminating an employee
async function terminateEmployee(employeeId, terminationData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get current employee record
    const employee = await Employee.findById(employeeId).session(session);

    // 2. Create termination record
    await TerminatedEmployee.create([{
      originalEmployeeId: employee._id,
      clerkUserId: employee.clerkUserId,
      employeeId: employee.employeeId,
      terminationDate: new Date(),
      terminationReason: terminationData.reason,
      terminatedBy: terminationData.adminId,
      employeeSnapshot: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        designation: employee.designation
      }
    }], { session });

    // 3. Update employee status
    employee.status = 'terminated';
    employee.terminationDate = new Date();
    await employee.save({ session });

    // 4. Update Clerk metadata (remove current company)
    await clerkClient.users.updateUserMetadata(employee.clerkUserId, {
      publicMetadata: {
        companyId: null,
        role: null
      },
      privateMetadata: {
        // Keep employment history
        employmentHistory: [
          ...(existingHistory || []),
          {
            companyId: employee.companyId,
            endDate: new Date(),
            status: 'terminated'
          }
        ]
      }
    });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### 4.2 Scenario 2: Same Employee Joins New Company

```javascript
// When a user with existing Clerk account joins a new company
async function addEmployeeToCompany(employeeData, adminToken) {
  const { clerkUserId, email, firstName, lastName, companyId } = employeeData;

  // 1. Verify Clerk user exists
  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  // 2. Check if employee already exists in this company (re-hiring scenario)
  const existingEmployee = await Employee.findOne({
    clerkUserId: clerkUserId,
    companyId: companyId
  });

  if (existingEmployee) {
    // RE-HIRING: Handle re-hiring to same company
    return await handleRehiring(existingEmployee, employeeData);
  }

  // 3. Create new employee record for this company
  const newEmployee = await Employee.create({
    clerkUserId: clerkUserId,
    employeeId: await generateEmployeeId(companyId),
    firstName,
    lastName,
    email,
    companyId,
    status: 'active',
    joiningDate: new Date(),
    employmentType: employeeData.employmentType || 'permanent'
  });

  // 4. Update Clerk metadata with new company
  await clerkClient.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      companyId: companyId,
      role: employeeData.role || 'employee'
    }
  });

  return newEmployee;
}
```

### 4.3 Scenario 3: Employee Re-hired by Same Company

```javascript
// Handle re-hiring to same company (after termination)
async function handleRehiring(existingEmployee, newData) {
  if (existingEmployee.status === 'active') {
    throw new Error('Employee is already active in this company');
  }

  // Update existing record
  existingEmployee.status = 'active';
  existingEmployee.joiningDate = new Date();  // New joining date
  existingEmployee.employmentType = newData.employmentType;
  existingEmployee.terminationDate = null;  // Clear previous termination

  await existingEmployee.save();

  // Archive old termination record
  await TerminationArchive.create({
    originalEmployeeId: existingEmployee._id,
    previousTerminationDate: existingEmployee.terminationDate,
    rehiredDate: new Date()
  });

  return existingEmployee;
}
```

### 4.4 Scenario 4: Login After Company Switch

```javascript
// When user logs in after switching companies
async function handleUserLogin(clerkUserId) {
  // 1. Get Clerk user data
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const currentCompanyId = clerkUser.publicMetadata.companyId;

  // 2. Get employee record for current company
  if (currentCompanyId) {
    const collections = getTenantCollections(currentCompanyId);
    const employee = await collections.employees.findOne({
      clerkUserId: clerkUserId
    });

    return {
      success: true,
      data: {
        role: clerkUser.publicMetadata.role,
        companyId: currentCompanyId,
        employeeId: employee?.employeeId,
        firstName: employee?.firstName,
        lastName: employee?.lastName,
        email: employee?.email
      }
    };
  }

  // User exists but not assigned to any company
  return {
    success: true,
    data: {
      role: 'unassigned',
      message: 'User account exists. Please contact your company administrator.'
    }
  };
}
```

---

## 5. API Endpoint Enhancements

### 5.1 Enhanced GET /api/user-profile/current

```javascript
/**
 * Enhanced user profile endpoint
 * Returns current company employment + employment history summary
 */
export const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  if (user.role === 'hr' || user.role === 'employee') {
    const collections = getTenantCollections(user.companyId);

    // Get current employee record
    const employee = await collections.employees.findOne({
      clerkUserId: user.userId
    });

    if (!employee) {
      throw buildNotFoundError('Employee profile');
    }

    // Check if there are previous employments
    const previousEmployments = await collections.terminatedEmployees.countDocuments({
      clerkUserId: user.userId
    });

    const profileData = {
      role: user.role,
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: employee.fullName,
      email: employee.contact?.email || user.email,
      phone: employee.contact?.phone,
      designation: employee.designation,
      department: employee.department,
      profileImage: employee.profileImage,

      // Employment metadata
      employmentType: employee.employmentType,
      employmentStatus: employee.employmentStatus,
      joiningDate: employee.joiningDate,

      // NEW: Previous employment count (privacy-safe)
      previousEmploymentsInCompany: previousEmployments,

      companyId: user.companyId
    };

    return sendSuccess(res, profileData, 'Profile retrieved successfully');
  }

  // ... rest of role handling
});
```

---

## 6. Data Privacy & Security Considerations

### 6.1 Tenant Data Isolation

| Data Type | Visibility | Rationale |
|-----------|------------|-----------|
| **Current Employee Data** | Current company only | Operational necessity |
| **Terminated Records** | Current company only | Historical data for same company |
| **Employment History (Clerk)** | System only | Analytics, never exposed to tenants |
| **Other Company Data** | **NEVER** | Complete isolation |

### 6.2 Clerk Metadata Strategy

```javascript
// Private Metadata (Never exposed to frontend)
{
  employmentHistory: [
    { companyId: "company_A", startDate: "2025-01-01", endDate: "2025-12-15" }
  ]
}

// Public Metadata (Exposed to frontend)
{
  companyId: "company_B",     // Current company only
  role: "employee"            // Current role only
}
```

### 6.3 GDPR/Compliance Considerations

1. **Right to Access:** User can see their data in current company
2. **Right to Export:** User can export their employment history
3. **Right to Delete:**
   - Delete Clerk account → All employment records become "anonymized"
   - Company retains employment records for legal purposes (without PII)
4. **Data Retention:** Terminated records retained per company policy

---

## 7. Edge Cases & Risk Mitigation

### 7.1 Edge Cases

| Edge Case | Handling Strategy |
|-----------|------------------|
| **Same email, different person** | Additional verification (phone, SSN) required |
| **User registers for Company B while active at Company A** | Block or warn about moonlighting policy |
| **Company A tries to access User 1's data at Company B** | Database-level tenant isolation prevents this |
| **Clerk account deleted while employed** | Soft delete in employee records, mark as "inactive" |
| **User requests account deletion** | Anonymize employment records, keep aggregate data |
| **Merge two Clerk accounts** | Manual admin process, update all clerkUserId references |

### 7.2 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Data leakage between companies** | Tenant-specific collections, always filter by companyId |
| **Duplicate employee records** | Unique index on (clerkUserId, companyId) |
| **Lost employment history** | Keep terminated records, Clerk private metadata |
| **User account takeover** | Clerk's built-in security (2FA, session management) |
| **Compliance violations** | Data retention policies, anonymization on deletion |

---

## 8. Implementation Checklist

### Phase 1: Database Schema Updates
- [ ] Add unique index on (clerkUserId, companyId) in employees collection
- [ ] Ensure non-unique index on email field (allow duplicates)
- [ ] Add employmentHistory tracking in Clerk private metadata
- [ ] Create termination archive collection for re-hiring scenarios

### Phase 2: Backend API Updates
- [ ] Update termination logic to update Clerk metadata
- [ ] Update employee creation to check for existing Clerk users
- [ ] Add re-hiring handler for same-company returns
- [ ] Enhance user profile endpoint with employment history count
- [ ] Add audit logging for cross-company employment changes

### Phase 3: Frontend Updates
- [ ] Update registration flow for existing Clerk users
- [ ] Add UI for handling "email already exists" scenario
- [ ] Update profile display to show current company only
- [ ] Add admin notification for re-hiring scenarios

### Phase 4: Testing
- [ ] Test termination → new company registration flow
- [ ] Test re-hiring to same company flow
- [ ] Test data isolation between companies
- [ ] Test Clerk metadata updates
- [ ] Test concurrent employment scenarios

---

## 9. Recommended Best Practices

### 9.1 For This System
1. **Keep Clerk user accounts global** - one per email
2. **Employment records are tenant-specific** - separate per company
3. **Track employment history in Clerk private metadata** - for system analytics only
4. **Never expose cross-company data** - strict tenant isolation
5. **Handle re-hiring as record update** - don't create new employee record

### 9.2 User Experience
1. **Seamless company switching** - single login for all companies
2. **Clear communication** - inform users when their previous company data is archived
3. **Privacy-first** - users only see their current company data
4. **Admin controls** - company admins only see their employees

---

## 10. Conclusion

### Recommended Approach: **Global User, Per-Company Employment**

This approach provides:
- Best user experience (single sign-on)
- Complete employment history tracking
- Proper data isolation between tenants
- Support for re-hiring and cross-company employment
- Compliance with data privacy regulations

### Key Implementation Points

1. **Clerk handles authentication** - one user per email globally
2. **Database tracks employment** - separate records per company
3. **Tenant isolation is mandatory** - always filter by companyId
4. **Employment history is system-only** - never exposed to tenants

---

**Document Version:** 1.0
**Last Updated:** February 3, 2026
**Next Review:** After Phase 1 implementation
