# HRM Module - Testing Strategies

**Report Generated:** 2026-02-03
**Last Updated:** 2026-02-03 (Brutal Validation Review)
**Module:** Human Resource Management (HRM)
**Testing Framework:** Jest + Supertest + React Testing Library

---

## ⚠️ TESTING VALIDATION FINDINGS

**Issues Found:** 12
- **CRITICAL:** 4
- **HIGH:** 5
- **MEDIUM:** 3

### Critical Testing Issues

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | No tests exist for authentication/authorization | CRITICAL | Security vulnerabilities undetected |
| 2 | No tests for critical security flaws | CRITICAL | Production at risk |
| 3 | No tests for frontend-backend endpoint mismatches | CRITICAL | Runtime failures undetected |
| 4 | No tests for HR Dashboard const reassignment bug | HIGH | Runtime bug undetected |
| 5 | No tests for schema type conversions | HIGH | Data issues undetected |
| 6 | No integration tests for multi-tenant isolation | HIGH | Data leak risks |
| 7 | No tests for Socket.IO real-time features | HIGH | Feature gaps |
| 8 | No load testing for bulk operations | MEDIUM | Performance issues |
| 9 | No input validation tests | MEDIUM | Invalid data risks |
| 10 | No error handling tests | MEDIUM | Poor UX |
| 11 | No API contract tests | MEDIUM | Integration issues |
| 12 | No security penetration tests | MEDIUM | Vulnerabilities |

**See Section 14 for detailed testing validation report.**

---

## Table of Contents

1. [Testing Overview](#1-testing-overview)
2. [Testing Pyramid](#2-testing-pyramid)
3. [Unit Testing Strategy](#3-unit-testing-strategy)
4. [Integration Testing Strategy](#4-integration-testing-strategy)
5. [End-to-End Testing Strategy](#5-end-to-end-testing-strategy)
6. [API Testing Strategy](#6-api-testing-strategy)
7. [Frontend Testing Strategy](#7-frontend-testing-strategy)
8. [Database Testing Strategy](#8-database-testing-strategy)
9. [Security Testing](#9-security-testing)
10. [Performance Testing](#10-performance-testing)
11. [Test Data Management](#11-test-data-management)
12. [CI/CD Integration](#12-cicd-integration)
13. [Testing Checklist](#13-testing-checklist)
14. [Testing Validation Issues](#14-testing-validation-issues)

---

## 1. Testing Overview

### 1.1 Current Testing Status

| Layer | Status | Coverage | Tools | Issues Found |
|-------|--------|----------|-------|--------------|
| Unit Tests | ❌ Not Implemented | 0% | Jest | 47 issues require tests |
| Integration Tests | ❌ Not Implemented | 0% | Supertest | Critical bugs need tests |
| E2E Tests | ❌ Not Implemented | 0% | Cypress/Playwright | User flows untested |
| API Tests | ❌ Not Implemented | 0% | Supertest | Security untested |
| Frontend Tests | ❌ Not Implemented | 0% | React Testing Library | Hooks untested |
| Database Tests | ❌ Not Implemented | 0% | MongoDB Memory Server | Schema issues untested |

**Overall Test Coverage:** 0% ❌ **CRITICAL - NO QUALITY GATES**

### 1.2 Testing Gaps Identified by Brutal Validation

**Security Tests (URGENTLY NEEDED):**
- Authentication middleware tests
- Authorization/role-based access tests
- Multi-tenant data isolation tests
- Input validation tests
- NoSQL injection prevention tests

**Integration Tests (URGENTLY NEEDED):**
- Frontend hook to backend endpoint matching
- ObjectId to String conversion tests
- Socket.IO broadcast tests
- Cross-company data leak prevention tests

**Bug Regression Tests (URGENTLY NEEDED):**
- HR Dashboard const reassignment bug
- Frontend endpoint mismatches
- Missing route authentication

### 1.3 Target Testing Goals

| Goal | Target | Timeline | Priority |
|------|--------|----------|----------|
| Security Test Coverage | 95%+ | Week 1-2 | URGENT |
| Bug Regression Tests | 100% | Week 1 | URGENT |
| Unit Test Coverage | 80%+ | Phase 1 (4-6 weeks) | HIGH |
| API Test Coverage | 90%+ | Phase 1 (4-6 weeks) | HIGH |
| Frontend Coverage | 70%+ | Phase 1 (4-6 weeks) | HIGH |
| E2E Coverage | Key User Flows | Phase 2 (ongoing) | MEDIUM |

---

## 2. Testing Pyramid

```
                    ┌──────────────┐
                    │   E2E Tests  │  10% - Critical user flows
                    │   (Cypress)  │
                    ├──────────────┤
                    │Integration   │  30% - API, component integration
                    │   Tests      │
                    ├──────────────┤
                    │  Unit Tests  │  60% - Functions, components
                    │   (Jest)     │
                    └──────────────┘
```

### 2.1 Test Distribution (REVISED)

| Test Type | Count Target | Execution Time | Maintenance | Priority |
|-----------|--------------|----------------|-------------|----------|
| Security Tests | ~50 tests | < 5 minutes | Medium | URGENT |
| Bug Regression | ~20 tests | < 2 minutes | Low | URGENT |
| Unit Tests | ~400 tests | < 5 minutes | Low | HIGH |
| Integration Tests | ~150 tests | < 20 minutes | Medium | HIGH |
| E2E Tests | ~30 tests | < 30 minutes | High | MEDIUM |
| **TOTAL** | **~650 tests** | **< 1 hour** | | |

---

## 3. Unit Testing Strategy

### 3.1 Backend Unit Tests

**Framework:** Jest + MongoDB Memory Server

**Target:** Controllers, Services, Models, Utilities

#### 3.1.1 Controller Tests

Test each controller method with:

**⚠️ CRITICAL - Must Test:**
- Authentication/authorization requirements
- Error handling for invalid inputs
- Multi-tenant data isolation
- ObjectId/String type conversions

```javascript
// Example: Employee Controller Test Template
describe('Employee Controller', () => {
  let mockRequest, mockResponse, next;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: { companyId: 'test-company', role: 'admin' }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('GET /api/employees', () => {
    // ⚠️ CRITICAL TEST - Multi-tenant isolation
    it('should only return employees from user company', async () => {
      mockRequest.query = { page: 1, limit: 10 };
      await employeeController.getAll(mockRequest, mockResponse, next);

      // Verify no cross-company data leak
      const employees = mockResponse.json.mock.calls[0][0].data;
      employees.forEach(emp => {
        expect(emp.companyId).toBe(mockRequest.user.companyId);
      });
    });

    it('should return paginated employee list', async () => {
      mockRequest.query = { page: 1, limit: 10 };
      await employeeController.getAll(mockRequest, mockResponse, next);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should filter by department', async () => {
      mockRequest.query = { department: 'dept-id' };
      await employeeController.getAll(mockRequest, mockResponse, next);
      // Assertions...
    });

    it('should handle errors gracefully', async () => {
      // Error case test...
    });
  });

  describe('POST /api/employees', () => {
    it('should create new employee with valid data', async () => {
      mockRequest.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        department: 'dept-id',
        designation: 'desg-id'
      };
      await employeeController.create(mockRequest, mockResponse, next);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should reject invalid email', async () => {
      mockRequest.body = { email: 'invalid-email' };
      await employeeController.create(mockRequest, mockResponse, next);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
```

#### 3.1.2 Authentication/Authorization Tests (URGENT)

```javascript
// ⚠️ CRITICAL - Security Tests
describe('Authentication & Authorization', () => {
  describe('Attendance Routes', () => {
    it('should require authentication for GET /attendance', async () => {
      const response = await request(app)
        .get('/api/attendance')
        .expect(401); // Should fail without auth
    });

    it('should require authentication for POST /attendance', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({ employee: 'emp-001', date: '2026-02-03' })
        .expect(401); // Should fail without auth
    });
  });

  describe('Leave Routes', () => {
    it('should require authentication for all operations', async () => {
      await request(app).get('/api/leaves').expect(401);
      await request(app).post('/api/leaves').expect(401);
      await request(app).put('/api/leaves/123').expect(401);
    });
  });

  describe('Department Routes', () => {
    it('should require admin/hr role to create department', async () => {
      const employeeToken = generateToken({ role: 'employee' });
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Test Department' })
        .expect(403); // Should fail for employee role
    });
  });
});
```

#### 3.1.3 Service Tests

```javascript
// Example: HR Service Test
describe('HRM Employee Service', () => {
  let EmployeeModel, DepartmentModel;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    EmployeeModel = mongoose.model('Employee', employeeSchema);
    DepartmentModel = mongoose.model('Department', departmentSchema);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('createEmployee', () => {
    it('should create employee with auto-generated ID', async () => {
      const employee = await hrmEmployeeService.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        companyId: 'test-company'
      });
      expect(employee.employeeId).toMatch(/^EMP-\d{4}-\d{4}$/);
    });

    it('should update department employee count', async () => {
      // Test department count update...
    });
  });
});
```

### 3.2 Frontend Unit Tests

**Framework:** Jest + React Testing Library

#### 3.2.1 Hook Tests

**⚠️ CRITICAL - Must Test Endpoint Mismatches:**

```javascript
// Example: useAttendanceREST Hook Test
describe('useAttendanceREST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ⚠️ CRITICAL TEST - Endpoint mismatch
  it('should call correct clock-in endpoint', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useAttendanceREST());

    await act(async () => {
      await result.current.clockIn({ type: 'office' });
    });

    // ⚠️ BUG FIX: Should be POST /attendance, not POST /attendance/clock-in
    expect(axios.post).toHaveBeenCalledWith('/attendance', {
      type: 'office'
    });
  });

  it('should fetch attendance on mount', async () => {
    const mockAttendance = [
      { _id: '1', date: '2026-02-03', status: 'present' }
    ];
    axios.get.mockResolvedValue({ data: mockAttendance });

    const { result } = renderHook(() => useAttendanceREST());

    await waitFor(() => {
      expect(result.current.attendance).toEqual(mockAttendance);
    });
  });

  it('should handle fetch errors', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useAttendanceREST());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

```javascript
// ⚠️ CRITICAL - Leave Hook Tests
describe('useLeaveREST', () => {
  // ⚠️ BUG FIX TEST - Wrong HTTP method
  it('should use POST for approve, not PUT', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useLeaveREST());

    await act(async () => {
      await result.current.approveLeave('leave-123', 'Approved');
    });

    // ⚠️ BUG FIX: Should be POST, not PUT
    expect(axios.post).toHaveBeenCalledWith('/leaves/leave-123/approve', {
      comments: 'Approved'
    });
  });

  // ⚠️ BUG FIX TEST - Wrong endpoint pattern
  it('should call correct leave balance endpoint', async () => {
    axios.get.mockResolvedValue({ data: { casual: 10 } });

    const { result } = renderHook(() => useLeaveREST());

    await act(async () => {
      await result.current.getLeaveBalance();
    });

    // ⚠️ BUG FIX: Should be /leaves/balance, not /leaves/balance/:id
    expect(axios.get).toHaveBeenCalledWith('/leaves/balance');
  });
});
```

#### 3.2.2 Component Tests

```javascript
// EmployeeList Component Test
describe('EmployeeList Component', () => {
  const mockEmployees = [
    { _id: '1', firstName: 'John', lastName: 'Doe', department: { name: 'Engineering' } },
    { _id: '2', firstName: 'Jane', lastName: 'Smith', department: { name: 'HR' } }
  ];

  it('should render employee list', () => {
    render(<EmployeeList employees={mockEmployees} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should filter employees by search term', () => {
    render(<EmployeeList employees={mockEmployees} />);
    const searchInput = screen.getByPlaceholderText('Search employees...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should handle empty state', () => {
    render(<EmployeeList employees={[]} />);
    expect(screen.getByText('No employees found')).toBeInTheDocument();
  });

  it('should open employee details on click', () => {
    const mockOnSelect = jest.fn();
    render(<EmployeeList employees={mockEmployees} onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByText('John Doe'));
    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });
});
```

---

## 4. Integration Testing Strategy

### 4.1 API Integration Tests

**Framework:** Supertest + Jest + MongoDB Memory Server

#### 4.1.1 Test Setup

```javascript
// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../backend/server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

#### 4.1.2 API Endpoint Tests

**⚠️ CRITICAL - Must Test Security:**

```javascript
// tests/api/employee.api.test.js
const request = require('supertest');
const app = require('../../backend/server');
const Employee = require('../../backend/models/employee/employee.schema');
const Department = require('../../backend/models/organization/department.schema');
const { generateToken } = require('../helpers/auth');

describe('Employee API Integration Tests', () => {
  let authToken, companyId, departmentId;

  beforeEach(async () => {
    // Setup test data
    companyId = new mongoose.Types.ObjectId();
    const department = await Department.create({
      departmentId: 'DEPT-001',
      companyId,
      name: 'Engineering'
    });
    departmentId = department._id;

    authToken = generateToken({ companyId, role: 'hr' });
  });

  // ⚠️ CRITICAL TEST - Multi-tenant isolation
  describe('Multi-tenant Data Isolation', () => {
    it('should not allow cross-company employee access', async () => {
      // Create employee for Company A
      const companyA = new mongoose.Types.ObjectId();
      const employeeA = await Employee.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@companyA.com',
        companyId: companyA,
        department: departmentId
      });

      // Create employee for Company B
      const companyB = new mongoose.Types.ObjectId();
      await Employee.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@companyB.com',
        companyId: companyB,
        department: departmentId
      });

      // User from Company A tries to get all employees
      const tokenA = generateToken({ companyId: companyA, role: 'hr' });
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${tokenA}`);

      // Should only return Company A employees
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].companyId).toBe(companyA.toString());
    });
  });

  // ⚠️ CRITICAL TEST - Authentication required
  describe('POST /api/employees', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({ firstName: 'John', lastName: 'Doe' });

      expect(response.status).toBe(401);
    });

    it('should create employee with valid data', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          department: departmentId.toString(),
          designation: new mongoose.Types.ObjectId().toString(),
          employmentType: 'Full-time'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('employeeId');
      expect(response.body.firstName).toBe('John');
    });

    it('should enforce unique email constraint', async () => {
      await Employee.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com',
        companyId
      });

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          department: departmentId
        });

      expect(response.status).toBe(400);
    });
  });
});
```

**⚠️ CRITICAL - Attendance Route Security Tests:**

```javascript
describe('Attendance API Security Tests', () => {
  it('should require authentication for GET /attendance', async () => {
    const response = await request(app)
      .get('/api/attendance');

    expect(response.status).toBe(401);
  });

  it('should require authentication for POST /attendance (clock-in)', async () => {
    const response = await request(app)
      .post('/api/attendance')
      .send({ employee: 'emp-001', date: '2026-02-03' });

    expect(response.status).toBe(401);
  });

  it('should allow clock-in with authentication', async () => {
    const token = generateToken({ companyId: 'test-company', role: 'employee' });
    const response = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-02-03' });

    expect(response.status).toBe(201);
  });
});
```

### 4.2 Workflow Integration Tests

```javascript
describe('Leave Approval Workflow', () => {
  it('should complete full leave approval cycle', async () => {
    // 1. Create employee
    const employee = await createTestEmployee();

    // 2. Create leave request
    const leave = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employee: employee._id,
        leaveType: 'casual',
        startDate: '2026-02-10',
        endDate: '2026-02-12',
        reason: 'Personal work'
      });

    expect(leave.status).toBe(201);
    expect(leave.body.status).toBe('pending');

    // 3. Manager approves leave (POST, not PUT!)
    const approval = await request(app)
      .post(`/api/leaves/${leave.body._id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ comments: 'Approved' });

    expect(approval.status).toBe(200);
    expect(approval.body.status).toBe('approved');

    // 4. Verify leave balance updated
    const updatedEmployee = await Employee.findById(employee._id);
    expect(updatedEmployee.leaveBalance.casual).toBe(9); // 10 - 1 day
  });
});
```

---

## 5. End-to-End Testing Strategy

### 5.1 E2E Test Framework

**Recommended:** Playwright (or Cypress)

### 5.2 Critical User Flows (Updated with Bug Fixes)

| Flow | Description | Priority | Known Bugs |
|------|-------------|----------|------------|
| Employee Creation | Create new employee from HR dashboard | High | None |
| Clock In/Out | Employee clock in/out flow | High | ⚠️ Endpoint mismatch |
| Leave Request | Submit and approve leave request | High | ⚠️ Wrong HTTP methods |
| Promotion Process | Create and apply promotion | Medium | ⚠️ Missing /stats endpoint |
| Dashboard | View HR dashboard with filters | High | ⚠️ Const reassignment bug |

### 5.3 E2E Test Examples

```javascript
// e2e/attendance-clock-in.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Attendance Clock In Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as employee
    await page.goto('/login');
    await page.fill('[name="email"]', 'employee@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should clock in successfully', async ({ page }) => {
    // Navigate to attendance
    await page.click('text=Attendance');

    // Click Clock In button
    await page.click('button:has-text("Clock In")');

    // Verify success message
    await expect(page.locator('text=Clocked in successfully')).toBeVisible();

    // Verify clock in time displayed
    await expect(page.locator('[data-testid="clock-in-time"]')).toBeVisible();
  });

  // ⚠️ BUG TEST - Verify correct endpoint is called
  test('should call POST /attendance endpoint', async ({ page, request }) => {
    // Monitor API calls
    page.on('request', req => {
      if (req.url().includes('/attendance')) {
        expect(req.method()).toBe('POST');
      }
    });

    await page.goto('/attendance');
    await page.click('button:has-text("Clock In")');
  });
});
```

```javascript
// e2e/leave-approval.spec.ts
test.describe('Leave Approval Flow', () => {
  test('should approve leave using POST method', async ({ page }) => {
    // Login as manager
    await loginAsManager(page);

    // Navigate to leave approvals
    await page.goto('/approvals/leave');

    // Click approve button
    await page.click('[data-testid="approve-btn"]:first');

    // ⚠️ BUG FIX VERIFICATION - Should use POST, not PUT
    // Monitor for correct HTTP method
    const apiCall = await page.waitForResponse(response =>
      response.url().includes('/approve') && response.request().method() === 'POST'
    );

    expect(apiCall.status()).toBe(200);
    await expect(page.locator('text=Leave approved')).toBeVisible();
  });
});
```

---

## 6. API Testing Strategy

### 6.1 API Test Coverage Matrix (UPDATED)

| Controller | Endpoints | Test Cases | Security Tests | Priority |
|------------|-----------|------------|----------------|----------|
| Employee | 12 | ~40 tests | ✅ Multi-tenant, Auth, Roles | URGENT |
| Attendance | 10 | ~35 tests | ⚠️ MISSING - URGENT | URGENT |
| Leave | 10 | ~35 tests | ⚠️ MISSING - URGENT | URGENT |
| Department | 5 | ~15 tests | ⚠️ MISSING - URGENT | URGENT |
| Designation | 5 | ~15 tests | ⚠️ MISSING - URGENT | URGENT |
| Promotion | 5 | ~15 tests | ⚠️ MISSING - URGENT | HIGH |
| Policy | 5 | ~15 tests | ⚠️ Missing | HIGH |
| Holiday | 10 | ~20 tests | ✅ Has auth | MEDIUM |
| Training | 8 | ~25 tests | ⚠️ Missing | MEDIUM |
| HR Dashboard | 6 | ~15 tests | ⚠️ Missing | HIGH |
| **Total** | **76** | **~230 tests** | **47 security tests needed** | |

### 6.2 API Test Categories (UPDATED)

#### 6.2.1 Security Tests (URGENT - Week 1)

```javascript
// tests/security/authentication.test.js
describe('Authentication Tests', () => {
  const protectedRoutes = [
    { method: 'GET', path: '/api/employees' },
    { method: 'POST', path: '/api/employees' },
    { method: 'GET', path: '/api/attendance' },      // ⚠️ CRITICAL
    { method: 'POST', path: '/api/attendance' },     // ⚠️ CRITICAL
    { method: 'GET', path: '/api/leaves' },          // ⚠️ CRITICAL
    { method: 'POST', path: '/api/leaves' },         // ⚠️ CRITICAL
    { method: 'GET', path: '/api/departments' },     // ⚠️ CRITICAL
    { method: 'POST', path: '/api/departments' },    // ⚠️ CRITICAL
    { method: 'GET', path: '/api/designations' },    // ⚠️ CRITICAL
    { method: 'POST', path: '/api/designations' },   // ⚠️ CRITICAL
    { method: 'GET', path: '/api/promotions' },      // ⚠️ CRITICAL
    { method: 'POST', path: '/api/promotions' }      // ⚠️ CRITICAL
  ];

  protectedRoutes.forEach(({ method, path }) => {
    it(`should require authentication for ${method} ${path}`, async () => {
      const response = await request(app)
        [method.toLowerCase()](path)
        .expect(401);
    });
  });
});

describe('Authorization Tests', () => {
  it('should reject employee accessing admin routes', async () => {
    const employeeToken = generateToken({ role: 'employee' });

    await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Test' })
      .expect(403);
  });

  it('should allow HR to access department routes', async () => {
    const hrToken = generateToken({ role: 'hr' });

    await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);
  });
});
```

#### 6.2.2 Multi-Tenant Isolation Tests (URGENT)

```javascript
describe('Multi-Tenant Data Isolation', () => {
  it('should prevent cross-company employee access', async () => {
    const companyA = await createCompany();
    const companyB = await createCompany();

    // Create employee in Company A
    await Employee.create({ firstName: 'John', companyId: companyA.id });

    // Create employee in Company B
    await Employee.create({ firstName: 'Jane', companyId: companyB.id });

    // User from Company A queries employees
    const tokenA = generateToken({ companyId: companyA.id, role: 'hr' });
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${tokenA}`);

    // Should only return Company A employees
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].firstName).toBe('John');
  });

  it('should prevent cross-company attendance access', async () => {
    // Similar test for attendance...
  });

  it('should prevent cross-company leave access', async () => {
    // Similar test for leaves...
  });
});
```

#### 6.2.3 Frontend-Backend Endpoint Matching Tests (URGENT)

```javascript
describe('Frontend-Backend Endpoint Consistency', () => {
  it('should match attendance clock-in endpoint', async () => {
    // Frontend expects: POST /attendance/clock-in
    // Backend has: POST /attendance
    // ⚠️ TEST WILL FAIL - Bug exists

    // This test documents the bug
    const frontendEndpoint = '/attendance/clock-in';
    const backendEndpoint = '/attendance';

    // Test that backend endpoint works
    const token = generateToken({ role: 'employee' });
    await request(app)
      .post(backendEndpoint)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-02-03' })
      .expect(201);

    // TODO: Fix frontend to use correct endpoint
  });

  it('should match leave approve HTTP method', async () => {
    // Frontend uses: PUT /leaves/:id/approve
    // Backend expects: POST /leaves/:id/approve
    // ⚠️ TEST WILL FAIL - Bug exists

    const leaveId = 'test-leave-id';

    // Test that POST works (correct)
    const managerToken = generateToken({ role: 'manager' });
    await request(app)
      .post(`/leaves/${leaveId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200); // May fail if leave doesn't exist

    // TODO: Fix frontend to use POST instead of PUT
  });
});
```

#### 6.2.4 Positive Cases
- Valid CRUD operations
- Pagination
- Filtering
- Sorting
- Search

#### 6.2.5 Negative Cases
- Invalid input
- Missing required fields
- Duplicate data
- Invalid references
- Out of range values

#### 6.2.6 Performance Cases
- Response time < 200ms for single record
- Response time < 500ms for lists
- Response time < 2s for complex aggregations

---

## 7. Frontend Testing Strategy

### 7.1 Component Testing Coverage (UPDATED)

| Component Category | Target Coverage | Bug Tests Needed |
|-------------------|-----------------|------------------|
| Employee Components | 75% | None |
| Attendance Components | 70% | ⚠️ Endpoint fixes |
| Leave Components | 75% | ⚠️ HTTP method fixes |
| Dashboard Components | 70% | ⚠️ Const reassignment |
| Form Components | 80% | None |
| Common Components | 70% | None |

### 7.2 Frontend Test Checklist

```markdown
## Component Test Template

- [ ] Renders without errors
- [ ] Displays correct props
- [ ] Handles user interactions
- [ ] Shows loading states
- [ ] Shows error states
- [ ] Shows empty states
- [ ] Validates form inputs
- [ ] Calls callbacks correctly
- [ ] Updates on prop changes
- [ ] Handles edge cases
- [ ] ⚠️ Calls correct API endpoints
- [ ] ⚠️ Uses correct HTTP methods
```

### 7.3 Frontend Test Examples

```javascript
// EmployeeForm.test.tsx
describe('EmployeeForm', () => {
  const mockOnSubmit = jest.fn();

  it('should render all form fields', () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Department')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }));
    });
  });
});
```

---

## 8. Database Testing Strategy

### 8.1 Database Test Categories

#### 8.1.1 Schema Validation Tests
- Required field validation
- Type validation
- Enum validation
- Range validation
- Unique constraint validation
- Custom validation rules

#### 8.1.2 Index Tests
- Index creation
- Index usage verification
- Compound index tests
- Text search tests
- Partial filter tests

#### 8.1.3 Relationship Tests
- Reference validation
- Cascade operations
- Populate operations
- Aggregation pipelines

#### 8.1.4 Middleware Tests
- Pre-save hooks
- Post-save hooks
- Pre-delete hooks
- Virtual properties
- Static methods
- Instance methods

### 8.2 Database Test Example

```javascript
describe('Employee Database Tests', () => {
  describe('Indexes', () => {
    it('should use company index for company queries', async () => {
      const plan = await Employee.collection.find({ companyId: 'test' }).explain();
      expect(plan.queryPlanner.winningPlan.stage).not.toBe('COLLSCAN');
    });

    it('should use text index for search', async () => {
      const results = await Employee.find({
        $text: { $search: 'John' }
      });
      // Verify text index usage...
    });
  });

  describe('Relationships', () => {
    it('should populate department correctly', async () => {
      const dept = await Department.create({
        departmentId: 'DEPT-001',
        companyId: 'test',
        name: 'Engineering'
      });
      const employee = await Employee.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyId: 'test',
        department: dept._id
      });
      const populated = await Employee.findById(employee._id).populate('department');
      expect(populated.department.name).toBe('Engineering');
    });
  });

  describe('Aggregations', () => {
    it('should calculate employee count by department', async () => {
      const stats = await Employee.aggregate([
        { $match: { companyId: 'test', isDeleted: false } },
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]);
      expect(stats).toHaveLength(1);
    });
  });
});
```

---

## 9. Security Testing

### 9.1 Authentication & Authorization Tests

| Test Case | Description | Priority |
|-----------|-------------|----------|
| Unauthenticated access | Verify 401 for protected routes | URGENT |
| Role-based access | Verify 403 for unauthorized roles | URGENT |
| Company isolation | Verify users cannot access other company data | URGENT |
| Token expiration | Verify expired tokens are rejected | HIGH |
| Token refresh | Verify refresh token flow | HIGH |

### 9.2 Input Validation Tests

| Test Case | Description | Priority |
|-----------|-------------|----------|
| SQL Injection | Test with SQL injection patterns | HIGH |
| NoSQL Injection | Test with NoSQL injection patterns | HIGH |
| XSS | Test with XSS payloads | HIGH |
| Path Traversal | Test with path traversal attempts | MEDIUM |
| Command Injection | Test with command injection patterns | MEDIUM |

### 9.3 Security Test Examples (URGENT)

```javascript
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/employees');
      expect(response.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = generateExpiredToken();
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    it('should prevent employee from accessing HR routes', async () => {
      const employeeToken = generateToken({ role: 'employee' });
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(response.status).toBe(403);
    });
  });

  describe('Company Isolation', () => {
    it('should prevent cross-company data access', async () => {
      const companyA = await createTestCompany('A');
      const companyB = await createTestCompany('B');
      const companyAToken = generateToken({ companyId: companyA._id });

      const employee = await Employee.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyId: companyB._id  // Belongs to B
      });

      const response = await request(app)
        .get(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${companyAToken}`);
      expect(response.status).toBe(404); // Should NOT find B's employee
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should sanitize NoSQL injection attempts', async () => {
      const adminToken = generateToken({ role: 'admin' });

      // Attempt NoSQL injection
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ $ne: null });

      // Should either reject or sanitize the query
      expect(response.status).not.toBe(500);
    });
  });
});
```

---

## 10. Performance Testing

### 10.1 Performance Metrics

| Endpoint | Target Response Time | Max Concurrent Users | Current Status |
|----------|---------------------|---------------------|---------------|
| GET /api/employees | < 200ms | 100 | ⚠️ Needs testing |
| GET /api/employees/:id | < 100ms | 100 | ⚠️ Needs testing |
| POST /api/employees | < 300ms | 50 | ⚠️ Needs testing |
| GET /api/attendance/stats | < 500ms | 50 | ⚠️ Needs testing |
| GET /api/hr-dashboard/stats | < 1s | 25 | ⚠️ Has const bug |

### 10.2 Load Testing Tools

- **k6** - For load testing
- **Artillery** - For API load testing
- **JMeter** - For comprehensive load testing

### 10.3 Load Test Example

```javascript
// load-tests/hr-dashboard-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up
    { duration: '1m', target: 50 },    // Stay at 50
    { duration: '30s', target: 100 },  // Ramp up to 100
    { duration: '1m', target: 100 },   // Stay at 100
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Login
  let loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'hr@example.com',
    password: 'password'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, { 'login successful': (r) => r.status === 200 });
  let token = loginRes.json('token');

  // Get HR Dashboard stats
  let statsRes = http.get(`${BASE_URL}/api/hr-dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(statsRes, { 'stats loaded': (r) => r.status === 200 });

  sleep(1);
}
```

---

## 11. Test Data Management

### 11.1 Test Data Fixtures

```javascript
// tests/fixtures/employee.fixtures.js
const mongoose = require('mongoose');

module.exports = {
  validEmployee: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Male',
    employmentType: 'Full-time',
    employmentStatus: 'Active',
    joiningDate: new Date('2023-01-01'),
    salary: {
      basic: 50000,
      hra: 20000,
      allowances: 10000,
      currency: 'USD'
    }
  },

  minimalEmployee: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    employmentType: 'Full-time',
    joiningDate: new Date('2023-01-01')
  },

  invalidEmployee: {
    firstName: '',  // Invalid: empty
    email: 'invalid-email',  // Invalid: bad format
    employmentType: 'Invalid-Type'  // Invalid: not in enum
  },

  async createTestEmployee(overrides = {}) {
    const Employee = mongoose.model('Employee');
    return Employee.create({
      ...this.validEmployee,
      companyId: new mongoose.Types.ObjectId(),
      department: new mongoose.Types.ObjectId(),
      designation: new mongoose.Types.ObjectId(),
      ...overrides
    });
  }
};
```

### 11.2 Database Seeding

```javascript
// tests/seed/index.js
const seedDatabase = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoose = require('mongoose');

  // Departments
  const departments = await Department.create([
    { departmentId: 'DEPT-001', companyId, name: 'Engineering', code: 'ENG' },
    { departmentId: 'DEPT-002', companyId, name: 'HR', code: 'HR' },
    { departmentId: 'DEPT-003', companyId, name: 'Finance', code: 'FIN' }
  ]);

  // Designations
  const designations = await Designation.create([
    { designationId: 'DESG-001', companyId, title: 'Software Engineer', level: 'Mid' },
    { designationId: 'DESG-002', companyId, title: 'HR Manager', level: 'Manager' }
  ]);

  // Employees
  await Employee.create([
    {
      employeeId: 'EMP-2023-001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin',
      companyId,
      department: departments[0]._id,
      designation: designations[0]._id
    }
  ]);

  return { departments, designations };
};
```

---

## 12. CI/CD Integration

### 12.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: HRM Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  # ⚠️ URGENT - Security tests first
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run security tests
        working-directory: ./backend
        run: npm run test:security

  test-backend:
    runs-on: ubuntu-latest
    needs: security-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run unit tests
        working-directory: ./backend
        run: npm run test:unit

      - name: Run integration tests
        working-directory: ./backend
        run: npm run test:integration

      - name: Generate coverage
        working-directory: ./backend
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        working-directory: ./react
        run: npm ci

      - name: Run tests
        working-directory: ./react
        run: npm run test

      - name: Build
        working-directory: ./react
        run: npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../react && npm ci

      - name: Start services
        run: docker-compose up -d

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-screenshots
          path: e2e/screenshots
```

### 12.2 Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:security": "jest --testPathPattern=security",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## 13. Testing Checklist

### 13.1 Pre-Release Checklist (UPDATED)

```markdown
## URGENT - Week 1
- [ ] All 6 critical security vulnerabilities fixed
- [ ] Authentication tests for all routes
- [ ] Authorization tests for all routes
- [ ] Multi-tenant isolation tests
- [ ] Frontend-backend endpoint matching tests
- [ ] Bug regression tests (const reassignment, endpoint mismatches)

## Backend
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] API tests for all endpoints
- [ ] Security tests passing (URGENT)
- [ ] Coverage > 80%

## Frontend
- [ ] All component tests passing
- [ ] All hook tests passing
- [ ] Coverage > 70%
- [ ] No console errors
- [ ] Accessibility checks passing
- [ ] API endpoint consistency verified (URGENT)

## E2E
- [ ] Critical user flows tested
- [ ] Cross-browser testing done
- [ ] Mobile responsive verified

## Performance
- [ ] Load tests passing
- [ ] Response times within targets
- [ ] No memory leaks detected

## Documentation
- [ ] API documentation updated
- [ ] Test documentation updated
- [ ] Known issues documented
- [ ] Security fixes documented
```

### 13.2 Test Coverage Targets (UPDATED)

| Module | Unit | Integration | Security | E2E | Total |
|--------|------|-------------|----------|-----|-------|
| Employee | 90% | 85% | 95% | Key flows | 85% |
| Attendance | 85% | 85% | 95% | Key flows | 85% |
| Leave | 90% | 90% | 95% | Key flows | 90% |
| Department | 80% | 80% | 95% | - | 80% |
| Designation | 80% | 80% | 95% | - | 80% |
| Dashboard | 75% | 75% | 90% | Key flows | 75% |

---

## 14. Testing Validation Issues

### 14.1 CRITICAL Testing Gaps

#### Issue #1: No Authentication Tests
**Severity:** CRITICAL
**Impact:** 6 critical security vulnerabilities undetected
**Files Affected:**
- `backend/routes/api/attendance.js` - No auth middleware
- `backend/routes/api/leave.js` - No auth middleware
- `backend/routes/api/promotions.js` - No auth middleware
- `backend/routes/api/departments.js` - No role checks
- `backend/routes/api/designations.js` - No role checks

**Required Tests:**
```javascript
// Must create tests that verify:
1. All routes return 401 without authentication
2. Sensitive routes return 403 for wrong roles
3. Multi-tenant data isolation works correctly
```

---

#### Issue #2: No Frontend-Backend Endpoint Tests
**Severity:** CRITICAL
**Impact:** Runtime failures undetected
**Files Affected:**
- `react/src/hooks/useAttendanceREST.ts` - Wrong endpoints
- `react/src/hooks/useLeaveREST.ts` - Wrong HTTP methods
- `react/src/hooks/usePromotionsREST.ts` - Missing /stats endpoint

**Required Tests:**
```javascript
// Must create tests that verify:
1. Frontend hooks call correct backend endpoints
2. Correct HTTP methods are used (GET, POST, PUT, DELETE)
3. Request/response formats match
```

---

#### Issue #3: No Bug Regression Tests
**Severity:** HIGH
**Impact:** Known bugs will reoccur
**Bugs to Test:**
1. HR Dashboard const reassignment (line 239-242)
2. Frontend endpoint mismatches
3. Missing authentication middleware

**Required Tests:**
```javascript
describe('Bug Regression Tests', () => {
  it('should not reassign const events in HR dashboard', async () => {
    // Test that dashboard filtering works correctly
    const response = await request(app)
      .get('/api/hr-dashboard/calendar-events')
      .query({ start: '2026-02-01', end: '2026-02-28' });

    expect(response.status).toBe(200);
    // Should not throw "Cannot reassign const" error
  });
});
```

---

#### Issue #4: No Multi-Tenant Isolation Tests
**Severity:** HIGH
**Impact:** Data leak vulnerabilities undetected
**Affected:** All HRM collections

**Required Tests:**
```javascript
// Must verify that:
1. User from Company A cannot access Company B's employees
2. User from Company A cannot access Company B's attendance
3. User from Company A cannot access Company B's leaves
4. User from Company A cannot access Company B's departments
5. User from Company A cannot access Company B's designations
```

---

#### Issue #5: No Schema Validation Tests
**Severity:** HIGH
**Impact:** Invalid data can corrupt database

**Required Tests:**
```javascript
describe('Schema Validation Tests', () => {
  it('should validate ObjectId vs String conversions', async () => {
    // Test that department/designation conversions work
    const employee = await Employee.create({
      department: departmentId, // ObjectId in schema
      // API sends as String, verify conversion works
    });
  });

  it('should prevent invalid status values', async () => {
    // Leave uses lowercase, Department uses capitalized
    // Test that enum validation works
  });
});
```

---

#### Issue #6: No Socket.IO Tests
**Severity:** MEDIUM
**Impact:** Real-time features untested

**Required Tests:**
```javascript
describe('Socket.IO Tests', () => {
  it('should broadcast department:created event', async () => {
    // Test that Socket.IO broadcasts work correctly
  });

  it('should emit to correct rooms', async () => {
    // Test room-based broadcasting
  });
});
```

---

### 14.2 Testing Recommendations Summary

| Priority | Test Type | Count | Timeline |
|----------|-----------|-------|----------|
| URGENT | Security/Auth | ~50 | Week 1 |
| URGENT | Bug Regression | ~20 | Week 1 |
| URGENT | Endpoint Matching | ~30 | Week 1 |
| HIGH | Unit Tests | ~400 | Weeks 2-4 |
| HIGH | Integration Tests | ~150 | Weeks 3-5 |
| MEDIUM | E2E Tests | ~30 | Weeks 5-6 |
| LOW | Performance | ~10 | Ongoing |

---

*End of Testing Strategies Documentation*

**IMMEDIATE ACTIONS REQUIRED:**
1. Week 1: Create all security tests (authentication, authorization, multi-tenant)
2. Week 1: Create bug regression tests for known issues
3. Week 1: Create frontend-backend endpoint matching tests
4. Week 2-4: Implement comprehensive unit and integration tests
5. Ongoing: E2E tests for critical user flows
