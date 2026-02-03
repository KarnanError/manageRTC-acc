# PM Module - Testing Strategies Documentation

**Generated:** 2026-02-03
**Testing Approach:** Brutal Validation Based
**Current Test Coverage:** 0% (No tests found)

---

## Executive Summary

The PM Module currently has **ZERO test coverage**. This document provides a comprehensive testing strategy covering unit tests, integration tests, E2E tests, performance tests, and security tests.

**Critical Gap:** No tests exist for any PM module functionality

**Target Coverage:** 80% unit, 70% integration, 60% E2E

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Test Architecture](#2-test-architecture)
3. [Unit Testing Strategy](#3-unit-testing-strategy)
4. [Integration Testing Strategy](#4-integration-testing-strategy)
5. [E2E Testing Strategy](#5-e2e-testing-strategy)
6. [Performance Testing Strategy](#6-performance-testing-strategy)
7. [Security Testing Strategy](#7-security-testing-strategy)
8. [Test Implementation Plan](#8-test-implementation-plan)

---

## 1. Testing Philosophy

### 1.1 Testing Principles

| Principle | Description |
|-----------|-------------|
| **Test Early** | Write tests alongside code (TDD preferred) |
| **Test Isolation** | Each test should be independent |
| **Test Realism** | Tests should mirror real usage |
| **Fast Feedback** | Unit tests should run in < 5 seconds |
| **Coverage Goals** | 80% unit, 70% integration, 60% E2E |

### 1.2 Testing Pyramid

```
                    /\
                   /  \
                  / E2E \         10% (Critical flows)
                 /--------\
                /          \
               / Integration\   30% (API & Database)
              /--------------\
             /                \
            /    Unit Tests    \ 60% (Functions & Components)
           /--------------------\
```

---

## 2. Test Architecture

### 2.1 Directory Structure

```
backend/
├── tests/
│   ├── unit/
│   │   ├── models/
│   │   │   ├── project.test.js
│   │   │   ├── task.test.js
│   │   │   ├── client.test.js
│   │   │   └── projectNotes.test.js
│   │   ├── services/
│   │   │   ├── project.service.test.js
│   │   │   └── task.service.test.js
│   │   ├── controllers/
│   │   │   ├── project.controller.test.js
│   │   │   └── task.controller.test.js
│   │   └── utils/
│   │       ├── idGenerator.test.js
│   │       └── apiResponse.test.js
│   ├── integration/
│   │   ├── api/
│   │   │   ├── projects.test.js
│   │   │   ├── tasks.test.js
│   │   │   └── clients.test.js
│   │   └── database/
│   │       ├── project.queries.test.js
│   │       └── task.queries.test.js
│   ├── e2e/
│   │   ├── scenarios/
│   │   │   ├── project-lifecycle.test.js
│   │   │   ├── task-management.test.js
│   │   │   └── client-management.test.js
│   │   └── flows/
│   │       ├── create-project-with-tasks.test.js
│   │       └── kanban-board-operations.test.js
│   ├── performance/
│   │   ├── load.test.js
│   │   └── stress.test.js
│   ├── security/
│   │   ├── auth.test.js
│   │   ├── authorization.test.js
│   │   └── injection.test.js
│   ├── fixtures/
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── employees.js
│   └── setup/
│       ├── db.js
│       └── server.js

react/
├── src/
│   └── __tests__/
│       ├── components/
│       │   ├── projects/
│       │   │   ├── ProjectList.test.tsx
│       │   │   ├── ProjectDetails.test.tsx
│       │   │   └── ProjectForm.test.tsx
│       │   ├── tasks/
│       │   │   ├── TaskBoard.test.tsx
│       │   │   ├── TaskCard.test.tsx
│       │   │   └── TaskForm.test.tsx
│       │   └── shared/
│       │       └── KanbanColumn.test.tsx
│       ├── hooks/
│       │   ├── useProjectsREST.test.ts
│       │   ├── useTasksREST.test.ts
│       │   └── useKanbanBoard.test.ts
│       ├── services/
│       │   └── api.test.ts
│       └── utils/
│           ├── dateFormatters.test.ts
│           └── validators.test.ts
```

### 2.2 Technology Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit Tests | Jest | Backend unit testing |
| Component Tests | Jest + React Testing Library | Frontend component testing |
| Integration Tests | Supertest | API endpoint testing |
| E2E Tests | Playwright | Full flow testing |
| Coverage | Istanbul (nyc) | Code coverage |
| Mocking | MSW (Mock Service Worker) | API mocking |
| Load Testing | Artillery/k6 | Performance testing |

---

## 3. Unit Testing Strategy

### 3.1 Backend Unit Tests

#### 3.1.1 Model Tests

**Test File:** `tests/unit/models/project.test.js`

```javascript
import Project from '../../../models/project/project.schema.js';
import mongoose from 'mongoose';

describe('Project Model', () => {
  // Test data
  const validProjectData = {
    projectId: 'PRO-0001',
    name: 'Test Project',
    description: 'Test Description',
    client: 'Test Client',  // Will be ObjectId ref after fix
    companyId: 'company123',
    startDate: new Date('2026-01-01'),
    dueDate: new Date('2026-12-31'),
    priority: 'High',
    status: 'Active',
    projectValue: 100000,
    progress: 0
  };

  describe('Validation', () => {
    test('should create project with valid data', async () => {
      const project = new Project(validProjectData);
      const savedProject = await project.save();

      expect(savedProject._id).toBeDefined();
      expect(savedProject.projectId).toBe('PRO-0001');
      expect(savedProject.name).toBe('Test Project');
    });

    test('should fail without required fields', async () => {
      const invalidProject = new Project({});

      await expect(invalidProject.save()).rejects.toThrow();
    });

    test('should fail if startDate > dueDate', async () => {
      const invalidDates = {
        ...validProjectData,
        startDate: new Date('2026-12-31'),
        dueDate: new Date('2026-01-01')
      };

      const project = new Project(invalidDates);
      await expect(project.save()).rejects.toThrow();
    });

    test('should validate priority enum', async () => {
      const invalidPriority = {
        ...validProjectData,
        priority: 'Invalid'
      };

      const project = new Project(invalidPriority);
      await expect(project.save()).rejects.toThrow();
    });

    test('should validate status enum', async () => {
      const invalidStatus = {
        ...validProjectData,
        status: 'Invalid'
      };

      const project = new Project(invalidStatus);
      await expect(project.save()).rejects.toThrow();
    });

    test('should validate progress range (0-100)', async () => {
      const invalidProgress = {
        ...validProjectData,
        progress: 150
      };

      const project = new Project(invalidProgress);
      await expect(project.save()).rejects.toThrow();
    });
  });

  describe('Virtual Properties', () => {
    test('should calculate isOverdue correctly', async () => {
      const overdueProject = new Project({
        ...validProjectData,
        dueDate: new Date('2025-01-01'),  // Past date
        status: 'Active'
      });

      expect(overdueProject.isOverdue).toBe(true);
    });

    test('should not be overdue if completed', async () => {
      const completedProject = new Project({
        ...validProjectData,
        dueDate: new Date('2025-01-01'),
        status: 'Completed'
      });

      expect(completedProject.isOverdue).toBe(false);
    });
  });

  describe('Pre-save Middleware', () => {
    test('should update updatedAt on save', async () => {
      const project = new Project(validProjectData);
      await project.save();
      const originalUpdatedAt = project.updatedAt;

      project.name = 'Updated Name';
      await project.save();

      expect(project.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });
});
```

#### 3.1.2 Controller Tests

**Test File:** `tests/unit/controllers/project.controller.test.js`

```javascript
import request from 'supertest';
import express from 'express';
import { getProjects, createProject, updateProject, deleteProject }
  from '../../../controllers/rest/project.controller.js';

// Mock dependencies
jest.mock('../../../models/project/project.schema.js');
jest.mock('../../../utils/apiResponse.js');
jest.mock('../../../utils/socketBroadcaster.js');

describe('Project Controller', () => {
  let app;
  let mockProject;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authenticated user
    mockProject = {
      _id: '507f1f77bcf86cd799439011',
      projectId: 'PRO-0001',
      name: 'Test Project',
      companyId: 'company123',
      toObject: jest.fn().mockReturnValue({})
    };
  });

  describe('GET /api/projects', () => {
    test('should return projects for authenticated user', async () => {
      const req = {
        query: { page: 1, limit: 20 },
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await getProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should filter by status', async () => {
      const req = {
        query: { status: 'Active', page: 1, limit: 20 },
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await getProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle invalid pagination', async () => {
      const req = {
        query: { page: 'invalid', limit: 'invalid' },
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await getProjects(req, res);

      // Should default to page 1, limit 20
    });
  });

  describe('POST /api/projects', () => {
    test('should create project with valid data', async () => {
      const req = {
        body: {
          name: 'New Project',
          description: 'Project description',
          client: 'client123',
          startDate: '2026-01-01',
          dueDate: '2026-12-31',
          priority: 'High'
        },
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should fail without required fields', async () => {
      const req = {
        body: { name: 'Project' },  // Missing required fields
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    test('should update project', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { name: 'Updated Project' },
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should fail with invalid ObjectId', async () => {
      const req = {
        params: { id: 'invalid-id' },
        body: { name: 'Updated Project' },
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    test('should soft delete project', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should fail if project has active tasks', async () => {
      // Mock task count query
      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { userId: 'user123', companyId: 'company123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await deleteProject(req, res);

      // Should return 400 if active tasks exist
    });
  });
});
```

#### 3.1.3 Service Tests

**Test File:** `tests/unit/services/project.service.test.js`

```javascript
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getProjectStats
} from '../../../services/project/project.services.js';

describe('Project Service', () => {
  const mockCompanyId = 'company123';
  const mockProjectData = {
    name: 'Test Project',
    description: 'Test',
    client: 'Test Client',
    startDate: '01-01-2026',
    endDate: '31-12-2026',
    priority: 'high',
    teamMembers: ['emp1', 'emp2']
  };

  describe('createProject', () => {
    test('should create project with generated ID', async () => {
      const result = await createProject(mockCompanyId, mockProjectData);

      expect(result.done).toBe(true);
      expect(result.data.projectId).toMatch(/^PRO-\d{4}$/);
    });

    test('should handle database errors', async () => {
      // Mock database error
      const result = await createProject(mockCompanyId, {});

      expect(result.done).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getProjects', () => {
    test('should return all non-deleted projects', async () => {
      const result = await getProjects(mockCompanyId, {});

      expect(result.done).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should filter by status', async () => {
      const result = await getProjects(mockCompanyId, {
        status: 'Active'
      });

      expect(result.done).toBe(true);
      result.data.forEach(project => {
        expect(project.status).toBe('active');
      });
    });

    test('should filter by priority', async () => {
      const result = await getProjects(mockCompanyId, {
        priority: 'High'
      });

      expect(result.done).toBe(true);
    });

    test('should search by name', async () => {
      const result = await getProjects(mockCompanyId, {
        search: 'Test'
      });

      expect(result.done).toBe(true);
    });
  });

  describe('updateProject', () => {
    test('should update project fields', async () => {
      const existingProject = { _id: 'proj123', ...mockProjectData };

      const result = await updateProject(
        mockCompanyId,
        'proj123',
        { name: 'Updated Name' }
      );

      expect(result.done).toBe(true);
      expect(result.data.name).toBe('Updated Name');
    });

    test('should handle non-existent project', async () => {
      const result = await updateProject(
        mockCompanyId,
        'nonexistent',
        { name: 'Updated' }
      );

      expect(result.done).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('deleteProject', () => {
    test('should soft delete project', async () => {
      const result = await deleteProject(mockCompanyId, 'proj123');

      expect(result.done).toBe(true);
    });

    test('should not hard delete from database', async () => {
      const result = await deleteProject(mockCompanyId, 'proj123');

      // Verify isDeleted flag is set
    });
  });
});
```

### 3.2 Frontend Unit Tests

#### 3.2.1 Component Tests

**Test File:** `src/__tests__/components/projects/ProjectList.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectList } from '../projectlist';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API
jest.mock('../../hooks/useProjectsREST', () => ({
  useProjectsREST: () => ({
    projects: mockProjects,
    loading: false,
    error: null,
    fetchProjects: jest.fn()
  })
}));

const mockProjects = [
  {
    _id: '1',
    name: 'Project A',
    status: 'Active',
    priority: 'High',
    progress: 50
  },
  {
    _id: '2',
    name: 'Project B',
    status: 'Completed',
    priority: 'Low',
    progress: 100
  }
];

describe('ProjectList Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectList />
      </QueryClientProvider>
    );

  test('should render project list', () => {
    renderComponent();

    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('Project B')).toBeInTheDocument();
  });

  test('should show loading state', () => {
    // Override mock to return loading
    renderComponent();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('should show error state', () => {
    // Override mock to return error
    renderComponent();

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  test('should filter projects by status', async () => {
    renderComponent();

    const statusFilter = screen.getByLabelText('Filter by status');
    fireEvent.change(statusFilter, { target: { value: 'Active' } });

    await waitFor(() => {
      expect(screen.getByText('Project A')).toBeInTheDocument();
      expect(screen.queryByText('Project B')).not.toBeInTheDocument();
    });
  });

  test('should handle project click', () => {
    renderComponent();

    fireEvent.click(screen.getByText('Project A'));

    // Verify navigation to project details
  });

  test('should display progress bar correctly', () => {
    renderComponent();

    const progressBar = screen.getByTestId('progress-1');
    expect(progressBar).toHaveStyle('width: 50%');
  });

  test('should show priority badge', () => {
    renderComponent();

    expect(screen.getByTestId('priority-1')).toHaveTextContent('High');
    expect(screen.getByTestId('priority-2')).toHaveTextContent('Low');
  });
});
```

#### 3.2.2 Hook Tests

**Test File:** `src/__tests__/hooks/useProjectsREST.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectsREST } from '../useProjectsREST';
import * as api from '../../services/api';

// Mock API module
jest.mock('../../services/api');

describe('useProjectsREST Hook', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  describe('fetchProjects', () => {
    test('should fetch projects successfully', async () => {
      const mockProjects = [
        { _id: '1', name: 'Project A' },
        { _id: '2', name: 'Project B' }
      ];

      (api.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockProjects
      });

      const { result } = renderHook(() => useProjectsREST(), { wrapper });

      await act(async () => {
        await result.current.fetchProjects({ page: 1, limit: 20 });
      });

      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should handle API error', async () => {
      (api.get as jest.Mock).mockRejectedValue({
        response: { data: { error: { message: 'Failed to fetch' } } }
      });

      const { result } = renderHook(() => useProjectsREST(), { wrapper });

      await act(async () => {
        await result.current.fetchProjects({});
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('createProject', () => {
    test('should create project successfully', async () => {
      const newProject = { _id: '1', name: 'New Project' };

      (api.post as jest.Mock).mockResolvedValue({
        success: true,
        data: newProject
      });

      const { result } = renderHook(() => useProjectsREST(), { wrapper });

      let success;
      await act(async () => {
        success = await result.current.createProject({
          name: 'New Project',
          client: 'client123'
        });
      });

      expect(success).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/projects', expect.any(Object));
    });

    test('should handle validation error', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: { data: { error: { message: 'Validation failed' } } }
      });

      const { result } = renderHook(() => useProjectsREST(), { wrapper });

      let success;
      await act(async () => {
        success = await result.current.createProject({ name: '' });
      });

      expect(success).toBe(false);
    });
  });

  describe('updateProject', () => {
    test('should update project successfully', async () => {
      const updatedProject = { _id: '1', name: 'Updated Project' };

      (api.put as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedProject
      });

      const { result } = renderHook(() => useProjectsREST(), { wrapper });

      // Set initial projects
      result.current.projects = [{ _id: '1', name: 'Original' }];

      let success;
      await act(async () => {
        success = await result.current.updateProject('1', { name: 'Updated Project' });
      });

      expect(success).toBe(true);
      expect(result.current.projects[0].name).toBe('Updated Project');
    });
  });

  describe('deleteProject', () => {
    test('should delete project successfully', async () => {
      (api.del as jest.Mock).mockResolvedValue({
        success: true
      });

      const { result } = renderHook(() => useProjectsREST(), { wrapper });

      result.current.projects = [
        { _id: '1', name: 'Project A' },
        { _id: '2', name: 'Project B' }
      ];

      let success;
      await act(async () => {
        success = await result.current.deleteProject('1');
      });

      expect(success).toBe(true);
      expect(result.current.projects.length).toBe(1);
      expect(result.current.projects.find(p => p._id === '1')).toBeUndefined();
    });
  });
});
```

---

## 4. Integration Testing Strategy

### 4.1 API Integration Tests

**Test File:** `tests/integration/api/projects.test.js`

```javascript
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../../server';
import Project from '../../../models/project/project.schema.js';

describe('Project API Integration Tests', () => {
  let authToken;
  let companyId;
  let projectId;

  // Setup: Connect to test database and get auth token
  beforeAll(async () => {
    // Connect to test MongoDB
    await mongoose.connect(process.env.MONGO_TEST_URI);

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
    companyId = loginResponse.body.user.companyId;
  });

  // Cleanup: Drop test data
  afterAll(async () => {
    await Project.deleteMany({ companyId });
    await mongoose.connection.close();
  });

  // Clear data before each test
  beforeEach(async () => {
    await Project.deleteMany({ companyId });
  });

  describe('POST /api/projects', () => {
    const validProject = {
      name: 'Integration Test Project',
      description: 'Testing project creation',
      client: 'Test Client',
      startDate: '2026-01-01',
      dueDate: '2026-12-31',
      priority: 'High',
      teamLeader: ['emp123'],
      teamMembers: ['emp123', 'emp456']
    };

    test('should create project with valid data', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProject)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId).toMatch(/^PRO-\d{4}$/);
      expect(response.body.data.name).toBe(validProject.name);

      projectId = response.body.data._id;
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Project' })  // Missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate date range', async () => {
      const invalidDates = {
        ...validProject,
        startDate: '2026-12-31',
        dueDate: '2026-01-01'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDates)
        .expect(400);
    });

    test('should check uniqueness of projectId', async () => {
      // Create first project
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProject);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProject)
        .expect(409);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Seed test data
      await Project.create([
        {
          projectId: 'PRO-0001',
          name: 'Active Project 1',
          companyId,
          client: 'Client A',
          startDate: new Date('2026-01-01'),
          dueDate: new Date('2026-06-30'),
          status: 'Active',
          priority: 'High'
        },
        {
          projectId: 'PRO-0002',
          name: 'Completed Project',
          companyId,
          client: 'Client B',
          startDate: new Date('2025-01-01'),
          dueDate: new Date('2025-12-31'),
          status: 'Completed',
          priority: 'Medium'
        }
      ]);
    });

    test('should return paginated projects', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/api/projects?status=Active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('Active');
    });

    test('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/projects?priority=High')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].priority).toBe('High');
    });

    test('should search projects', async () => {
      const response = await request(app)
        .get('/api/projects?search=Active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(project => {
        expect(
          project.name.includes('Active') ||
          project.description.includes('Active')
        ).toBe(true);
      });
    });
  });

  describe('GET /api/projects/:id', () => {
    test('should return single project', async () => {
      const project = await Project.create({
        projectId: 'PRO-0003',
        name: 'Single Project',
        companyId,
        client: 'Client C',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-12-31')
      });

      const response = await request(app)
        .get(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(project._id.toString());
    });

    test('should return 404 for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    test('should update project', async () => {
      const project = await Project.create({
        projectId: 'PRO-0004',
        name: 'Original Name',
        companyId,
        client: 'Client D',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-12-31')
      });

      const response = await request(app)
        .put(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
    });

    test('should not allow updating projectId', async () => {
      const project = await Project.create({
        projectId: 'PRO-0005',
        name: 'Test Project',
        companyId,
        client: 'Client E',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-12-31')
      });

      const response = await request(app)
        .put(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ projectId: 'PRO-9999' })
        .expect(400);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    test('should soft delete project', async () => {
      const project = await Project.create({
        projectId: 'PRO-0006',
        name: 'To Delete',
        companyId,
        client: 'Client F',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-12-31')
      });

      const response = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.isDeleted).toBe(true);

      // Verify soft delete
      const deletedProject = await Project.findById(project._id);
      expect(deletedProject.isDeleted).toBe(true);
    });

    test('should not delete project with active tasks', async () => {
      const project = await Project.create({
        projectId: 'PRO-0007',
        name: 'Project With Tasks',
        companyId,
        client: 'Client G',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-12-31')
      });

      // Create active task
      await mongoose.model('Task').create({
        title: 'Active Task',
        projectId: project._id,
        status: 'Pending',
        createdBy: 'user123'
      });

      const response = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
```

### 4.2 Database Integration Tests

**Test File:** `tests/integration/database/project.queries.test.js`

```javascript
import mongoose from 'mongoose';
import Project from '../../../models/project/project.schema.js';
import Task from '../../../models/task/task.schema.js';

describe('Project Database Integration', () => {
  let companyId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_TEST_URI);
    companyId = new mongoose.Types.ObjectId().toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Project.deleteMany({});
    await Task.deleteMany({});
  });

  describe('Project-Task Relationship', () => {
    test('should create project with associated tasks', async () => {
      const project = await Project.create({
        projectId: 'PRO-0001',
        name: 'Test Project',
        companyId,
        client: 'Test Client',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-12-31')
      });

      const task1 = await Task.create({
        title: 'Task 1',
        projectId: project._id,
        status: 'Pending',
        createdBy: 'user123'
      });

      const task2 = await Task.create({
        title: 'Task 2',
        projectId: project._id,
        status: 'Completed',
        createdBy: 'user123'
      });

      // Verify relationship
      const projectWithTasks = await Project.findById(project._id);
      expect(projectWithTasks).toBeDefined();
    });

    test('should populate team member details', async () => {
      const employeeId = new mongoose.Types.ObjectId();

      const project = await Project.create({
        projectId: 'PRO-0002',
        name: 'Project with Team',
        companyId,
        client: 'Test Client',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-12-31'),
        teamMembers: [employeeId]
      });

      const populatedProject = await Project.findById(project._id)
        .populate('teamMembers');

      expect(populatedProject.teamMembers[0]._id).toEqual(employeeId);
    });

    test('should handle soft delete cascading', async () => {
      const project = await Project.create({
        projectId: 'PRO-0003',
        name: 'Cascading Delete Test',
        companyId,
        client: 'Test Client',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-12-31')
      });

      await Task.create({
        title: 'Task to Delete',
        projectId: project._id,
        status: 'Pending',
        createdBy: 'user123'
      });

      // Soft delete project
      project.isDeleted = true;
      await project.save();

      // Tasks should still exist (no cascade)
      const tasks = await Task.find({ projectId: project._id });
      expect(tasks.length).toBe(1);
    });
  });

  describe('Aggregation Queries', () => {
    beforeEach(async () => {
      await Project.create([
        {
          projectId: 'PRO-0001',
          name: 'Active High Priority',
          companyId,
          client: 'Client A',
          startDate: new Date('2026-01-01'),
          dueDate: new Date('2026-12-31'),
          status: 'Active',
          priority: 'High',
          projectValue: 100000
        },
        {
          projectId: 'PRO-0002',
          name: 'Completed Medium Priority',
          companyId,
          client: 'Client B',
          startDate: new Date('2025-01-01'),
          dueDate: new Date('2025-12-31'),
          status: 'Completed',
          priority: 'Medium',
          projectValue: 50000
        }
      ]);
    });

    test('should get project statistics', async () => {
      const stats = await Project.aggregate([
        { $match: { companyId, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            totalValue: { $sum: '$projectValue' }
          }
        }
      ]);

      expect(stats[0].total).toBe(2);
      expect(stats[0].active).toBe(1);
      expect(stats[0].completed).toBe(1);
      expect(stats[0].totalValue).toBe(150000);
    });
  });
});
```

---

## 5. E2E Testing Strategy

### 5.1 Critical User Flows

**Test File:** `tests/e2e/scenarios/project-lifecycle.test.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Project Lifecycle E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new project', async ({ page }) => {
    // Navigate to projects
    await page.click('text=Projects');
    await expect(page).toHaveURL('/projects');

    // Click create button
    await page.click('button:has-text("New Project")');

    // Fill form
    await page.fill('[name="name"]', 'E2E Test Project');
    await page.fill('[name="description"]', 'Project created by E2E test');
    await page.selectOption('[name="client"]', 'Test Client');
    await page.fill('[name="startDate"]', '2026-01-01');
    await page.fill('[name="dueDate"]', '2026-12-31');
    await page.selectOption('[name="priority"]', 'High');

    // Add team members
    await page.click('button:has-text("Add Team Member")');
    await page.click('.employee-option:first-child');

    // Submit
    await page.click('button:has-text("Create Project")');

    // Verify success
    await expect(page.locator('text=Project created successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9]{24}/);
  });

  test('should update project progress', async ({ page }) => {
    // Go to existing project
    await page.goto('/projects/proj-123');

    // Update progress slider
    await page.fill('[type="range"][name="progress"]', '50');
    await page.click('button:has-text("Update Progress")');

    // Verify update
    await expect(page.locator('.progress-bar')).toHaveAttribute('style', /width:\s*50%/);
  });

  test('should delete project with confirmation', async ({ page }) => {
    await page.goto('/projects/proj-123');

    // Click delete
    await page.click('button:has-text("Delete")');

    // Confirm dialog
    await expect(page.locator('.modal')).toBeVisible();
    await page.click('.modal button:has-text("Confirm")');

    // Verify redirect and success message
    await expect(page).toHaveURL('/projects');
    await expect(page.locator('text=Project deleted successfully')).toBeVisible();
  });
});

test.describe('Task Management E2E', () => {
  test('should create task for project', async ({ page }) => {
    await page.goto('/projects/proj-123');

    // Click add task
    await page.click('button:has-text("Add Task")');

    // Fill task form
    await page.fill('[name="title"]', 'E2E Test Task');
    await page.fill('[name="description"]', 'Task created by E2E test');
    await page.selectOption('[name="priority"]', 'High');
    await page.fill('[name="estimatedHours"]', '8');

    // Add assignees
    await page.click('button:has-text("Add Assignee")');
    await page.click('.employee-option:first-child');

    // Submit
    await page.click('button:has-text("Create Task")');

    // Verify
    await expect(page.locator('text=Task created successfully')).toBeVisible();
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
  });

  test('should move task on kanban board', async ({ page }) => {
    await page.goto('/projects/proj-123/tasks');

    // Get initial column count
    const pendingColumn = page.locator('.kanban-column:has-text("Pending")');
    const inProgressColumn = page.locator('.kanban-column:has-text("In Progress")');

    const pendingBefore = await pendingColumn.locator('.task-card').count();
    const inProgressBefore = await inProgressColumn.locator('.task-card').count();

    // Drag task
    const task = pendingColumn.locator('.task-card:first-child');
    await task.dragTo(inProgressColumn);

    // Verify moved
    const pendingAfter = await pendingColumn.locator('.task-card').count();
    const inProgressAfter = await inProgressColumn.locator('.task-card').count();

    expect(pendingAfter).toBe(pendingBefore - 1);
    expect(inProgressAfter).toBe(inProgressBefore + 1);
  });
});

test.describe('Client Management E2E', () => {
  test('should create and link client to project', async ({ page }) => {
    // Create client
    await page.goto('/clients');
    await page.click('button:has-text("New Client")');

    await page.fill('[name="name"]', 'E2E Test Client');
    await page.fill('[name="email"]', 'client@e2e.com');
    await page.selectOption('[name="clientType"]', 'Enterprise');
    await page.fill('[name="annualRevenue"]', '1000000');

    await page.click('button:has-text("Create Client")');
    await expect(page.locator('text=Client created successfully')).toBeVisible();

    // Create project with this client
    await page.click('text=Projects');
    await page.click('button:has-text("New Project")');

    await page.fill('[name="name"]', 'Project for E2E Client');
    await page.selectOption('[name="client"]', 'E2E Test Client');
    await page.fill('[name="startDate"]', '2026-01-01');
    await page.fill('[name="dueDate"]', '2026-12-31');

    await page.click('button:has-text("Create Project")');
    await expect(page.locator('text=Project created successfully')).toBeVisible();

    // Verify client in project details
    await expect(page.locator('text=E2E Test Client')).toBeVisible();
  });
});
```

### 5.2 Cross-Browser Testing

```javascript
// playwright.config.js
module.exports = {
  projects: [
    {
      name: 'chromium',
      use: {
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'firefox',
      use: {
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'webkit',
      use: {
        viewport: { width: 1280, height: 720 }
      }
    }
  ]
};
```

---

## 6. Performance Testing Strategy

### 6.1 Load Testing

**Test File:** `tests/performance/load.test.js'

```javascript
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },     // Ramp up to 50 users
    { duration: '2m', target: 100 },    // Ramp up to 100 users
    { duration: '1m', target: 0 },      // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],    // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // List projects
  let listRes = http.get({
    url: `${BASE_URL}/api/projects?page=1&limit=20`,
    headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` }
  });
  check(listRes, {
    'Projects list status is 200': (r) => r.status === 200,
    'Projects list has data': (r) => JSON.parse(r.body).data.length > 0,
  });

  // Get project stats
  let statsRes = http.get({
    url: `${BASE_URL}/api/projects/stats`,
    headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` }
  });
  check(statsRes, {
    'Stats status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

### 6.2 Stress Testing

```javascript
export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Normal load
    { duration: '5m', target: 100 },   // Sustained load
    { duration: '2m', target: 500 },   // Spike to 500 users
    { duration: '2m', target: 500 },   // Hold spike
    { duration: '1m', target: 0 },      // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],     // Allow 5% errors during spike
  },
};
```

---

## 7. Security Testing Strategy

### 7.1 Authentication & Authorization Tests

**Test File:** `tests/security/auth.test.js`

```javascript
import request from 'supertest';
import { app } from '../../../server';

describe('Security Tests', () => {
  describe('Authentication', () => {
    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('should reject expired token', async () => {
      // Create expired token
      const expiredToken = createExpiredToken();

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.message).toContain('expired');
    });
  });

  describe('Authorization', () => {
    test('should prevent employee from creating projects', async () => {
      const employeeToken = await loginAs('employee');

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Unauthorized Project' })
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    test('should allow admin to create projects', async () => {
      const adminToken = await loginAs('admin');

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProjectData)
        .expect(201);
    });
  });

  describe('Multi-tenancy', () => {
    test('should not access projects from other companies', async () => {
      const companyA_Token = await loginAs('admin', 'companyA');
      const companyB_ProjectId = await createProjectFor('companyB');

      const response = await request(app)
        .get(`/api/projects/${companyB_ProjectId}`)
        .set('Authorization', `Bearer ${companyA_Token}`)
        .expect(404);  // Should return 404, not 200
    });

    test('should enforce companyId in all queries', async () => {
      // Test that all queries include companyId filter
      // This is a critical security test
    });
  });
});
```

### 7.2 Input Validation Tests

```javascript
describe('Input Validation Security', () => {
  describe('SQL Injection Prevention', () => {
    test('should handle SQL injection in search', async () => {
      const maliciousSearch = "'; DROP TABLE projects; --";

      const response = await request(app)
        .get(`/api/projects?search=${encodeURIComponent(maliciousSearch)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should return empty results, not error
      expect(response.body.data).toEqual([]);
    });
  });

  describe('NoSQL Injection Prevention', () => {
    test('should sanitize MongoDB operators', async () => {
      const maliciousInput = {
        name: { $ne: null },
        clientId: { $in: ['all'] }
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousInput)
        .expect(400);  // Should be rejected by validation
    });

    test('should prevent prototype pollution', async () => {
      const maliciousPayload = {
        name: 'Test',
        __proto__: { isAdmin: true }
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousPayload)
        .expect(201);

      // Verify that prototype was not polluted
      expect({}.isAdmin).toBeUndefined();
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize HTML in project name', async () => {
      const xssPayload = {
        name: '<script>alert("XSS")</script>',
        description: 'Test'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssPayload)
        .expect(201);

      // HTML should be escaped
      expect(response.body.data.name).not.toContain('<script>');
    });
  });

  describe('Path Traversal Prevention', () => {
    test('should prevent path traversal in file uploads', async () => {
      const maliciousFileName = '../../etc/passwd';

      const response = await request(app)
        .post('/api/projects/attachments')
        .attach('file', Buffer.from('test'), maliciousFileName)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
```

---

## 8. Test Implementation Plan

### 8.1 Phase-by-Phase Implementation

| Phase | Duration | Tests | Coverage Target |
|-------|----------|-------|-----------------|
| **Phase 1: Foundation** | Week 1-2 | Setup, fixtures, utilities | - |
| **Phase 2: Unit Tests** | Week 3-4 | Models, Controllers, Services | 60% |
| **Phase 3: Integration Tests** | Week 5-6 | API endpoints, Database | 50% |
| **Phase 4: Component Tests** | Week 7-8 | React components, Hooks | 50% |
| **Phase 5: E2E Tests** | Week 9-10 | Critical user flows | 40% |
| **Phase 6: Security Tests** | Week 11 | Auth, Input validation | - |
| **Phase 7: Performance Tests** | Week 12 | Load, Stress | - |

### 8.2 Test Coverage Goals

| Module | Unit | Integration | E2E | Overall |
|--------|------|-------------|-----|--------|
| Project CRUD | 90% | 80% | 70% | 85% |
| Task CRUD | 90% | 80% | 70% | 85% |
| Client CRUD | 85% | 75% | 60% | 80% |
| Kanban Board | 80% | 70% | 60% | 75% |
| Reports | 75% | 70% | 50% | 70% |
| **Overall** | **85%** | **75%** | **62%** | **78%** |

### 8.3 CI/CD Integration

**GitHub Actions Workflow:**

```yaml
name: PM Module Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Generate coverage
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run integration tests
        run: npm run test:integration
        env:
          MONGO_URI: mongodb://localhost:27017/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security audit
        run: npm audit
      - name: Run SAST scan
        uses: github/super-linter@v3
```

---

## Summary

**Current State:** 0% test coverage

**Target State:** 78% overall test coverage

**Implementation Timeline:** 12 weeks

**Critical Priority:**
1. Set up test infrastructure (Week 1)
2. Write critical security tests (Week 11, but should be earlier)
3. Add unit tests for fixed schema issues (Week 3-4)

**Testing Tools Stack:**
- Backend: Jest, Supertest
- Frontend: Jest, React Testing Library, MSW
- E2E: Playwright
- Performance: k6
- Coverage: Istanbul/nyc

---

**Report Version:** 1.0
**Generated:** 2026-02-03
