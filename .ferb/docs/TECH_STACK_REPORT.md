# manageRTC - Technical Stack & Architecture Report

**Generated:** February 2, 2026
**Project Type:** Enterprise HRMS / Project Management Platform
**Architecture:** Full-stack Multi-tenant Application

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Frontend Technologies](#frontend-technologies)
3. [Backend Technologies](#backend-technologies)
4. [Database Architecture](#database-architecture)
5. [Communication Patterns](#communication-patterns)
6. [Authentication & Authorization](#authentication--authorization)
7. [Development Tools](#development-tools)
8. [Deployment Configuration](#deployment-configuration)
9. [Project Structure](#project-structure)
10. [API Documentation](#api-documentation)

---

## Executive Summary

**manageRTC** is a comprehensive, enterprise-grade Human Resource Management System (HRMS) combined with Project Management and CRM capabilities. The application follows a modern microservices-inspired architecture with clear separation between frontend and backend, real-time communication capabilities, and multi-tenant data isolation.

### Quick Stats

| Category | Count |
|----------|-------|
| Frontend Dependencies | 80+ packages |
| Backend Dependencies | 45+ packages |
| REST API Endpoints | 128 documented |
| Mongoose Schemas | 30+ models |
| Custom React Hooks | 25+ REST hooks |
| Feature Modules | 20+ modules |
| Socket.IO Events | 50+ event types |
| Test Coverage Target | 70% |

---

## Frontend Technologies

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library for building user interfaces |
| **TypeScript** | 4.9.5 | Type safety and enhanced developer experience |
| **Create React App** | 5.0.1 | Build tooling with Webpack bundler |

**Usage:**
- React components are organized in a modular structure under [react/src/feature-module/](react/src/feature-module/)
- TypeScript provides type definitions in [react/src/types/](react/src/types/)
- Strict mode is disabled for flexibility

### UI Component Libraries

The application uses multiple UI libraries for maximum flexibility:

| Library | Version | Purpose |
|---------|---------|---------|
| **Ant Design (antd)** | 5.22.3 | Primary UI component library (tables, forms, modals) |
| **PrimeReact** | 10.8.5 | Additional UI components |
| **React Bootstrap** | 2.10.9 | Bootstrap components |
| **Bootstrap** | 5.3.3 | CSS framework and grid system |

**Usage Examples:**
- Ant Design Table for data grids in [employeesGrid.tsx](react/src/feature-module/hrm/employees/employeesGrid.tsx)
- PrimeReact components in various feature modules
- Bootstrap layout utilities

### Routing

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Router DOM** | 7.0.2 | Client-side routing and navigation |
| **React Router** | 7.0.2 | Core routing library |

**Usage:**
- Route definitions in core routing files
- Protected routes using Clerk authentication
- Nested routes for feature modules

### State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **Redux Toolkit** | 2.4.0 | Modern Redux with slices for global state |
| **React Redux** | 9.1.2 | React bindings for Redux |

**Usage:**
- Redux store configuration in [react/src/core/store/](react/src/core/store/)
- Slices for different domains (HRM, Projects, etc.)
- Used for cross-component state sharing

### Data Fetching & API

| Technology | Version | Purpose |
|------------|---------|---------|
| **Axios** | 1.7.9 | HTTP client for REST API calls |
| **Custom Hooks** | - | REST API encapsulation in [react/src/hooks/](react/src/hooks/) |

**Usage Pattern:**
```typescript
// Custom hooks pattern example
const { data, loading, error, refetch } = useEmployeesREST();

// Axios configuration in react/src/services/api.ts
- Base URL from environment
- Clerk JWT token attachment via interceptors
- Centralized error handling
```

### Real-time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.IO Client** | 4.8.1 | WebSocket client for real-time updates |

**Usage:**
- Socket connection managed in [react/src/services/](react/src/services/)
- Event listeners for employee, project, task updates
- Auto-reconnection on disconnect

### Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Clerk React** | 5.22.7 | Complete frontend authentication solution |
| **Clerk SDK Node** | 5.1.6 | Backend Clerk integration |

**Usage:**
- ClerkProvider wraps the application
- Token management handled by Clerk
- User metadata contains role and companyId

### Charts & Visualizations

| Library | Version | Purpose |
|---------|---------|---------|
| **Chart.js** | 4.4.7 | Primary charting library |
| **React Chartjs-2** | 5.2.0 | Chart.js React wrapper |
| **ApexCharts** | 4.1.0 | Advanced charting options |
| **React ApexCharts** | 1.7.0 | ApexCharts React wrapper |
| **React Countup** | 6.5.3 | Animated number counters |

**Usage:**
- Dashboard analytics and KPI displays
- Project progress charts
- HR statistics visualizations

### Date & Time Handling

| Library | Version | Purpose |
|---------|---------|---------|
| **Luxon** | 3.7.1 | Modern date/time library (primary) |
| **Moment** | 2.30.1 | Legacy date support |
| **React DatePicker** | 7.5.0 | Date selection component |
| **React Time Picker** | 7.0.0 | Time selection component |

### Drag & Drop

| Library | Version | Purpose |
|---------|---------|---------|
| **React Beautiful DND** | 13.1.1 | Kanban board drag operations |
| **React DnD** | 16.0.1 | Alternative drag and drop |
| **@hello-pangea/dnd** | 17.0.0 | Fork of react-beautiful-dnd |

**Usage:**
- Kanban board for tasks and leads
- Pipeline stage management in CRM
- Project task reordering

### Rich Text & Forms

| Library | Version | Purpose |
|---------|---------|---------|
| **Quill** | 2.0.3 | Rich text editor |
| **React Simple Wysiwyg** | 3.2.0 | Lightweight WYSIWYG editor |
| **React Input Mask** | 2.0.4 | Input field masking |
| **React Tag Input** | 6.10.3 | Tag input component |

### Icons

| Library | Version | Purpose |
|---------|---------|---------|
| **Font Awesome** | 6.7.1 | Primary icon font |
| **React Icons** | 5.4.0 | Multiple icon collections |
| **Feather Icons React** | 0.7.0 | Feather-style icons |
| **PrimeIcons** | 7.0.0 | PrimeReact icons |

### Additional Utilities

| Library | Version | Purpose |
|---------|---------|---------|
| **FullCalendar** | 6.1.20 | Calendar component |
| **SweetAlert2** | 11.6.13 | Beautiful alert modals |
| **React Select** | 5.8.3 | Advanced dropdowns |
| **Leaflet** | 1.9.4 | Map integration |
| **XLSX** | 0.18.5 | Excel file handling |
| **jsPDF** | 3.0.1 | PDF generation |
| **HTML2Canvas** | 1.4.1 | HTML to image conversion |

### Styling

| Technology | Purpose |
|------------|---------|
| **Sass** | CSS preprocessing and variables |
| **SCSS Modules** | Component-scoped styling |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | Via react-scripts | Test runner |
| **@testing-library/react** | 16.0.1 | React component testing |
| **@testing-library/user-event** | 14.5.2 | User interaction simulation |

---

## Backend Technologies

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express** | 5.1.0 | Web application framework |
| **Node.js** | Latest | JavaScript runtime (ES2021 support) |

**Configuration:**
- ES modules enabled (`"type": "module"` in package.json)
- Entry point: [backend/server.js](backend/server.js)
- Modular route structure

### Database & ORM

| Technology | Version | Purpose |
|------------|---------|---------|
| **MongoDB** | 6.13.0 | NoSQL document database |
| **Mongoose** | 8.9.5 | Object Data Modeling (ODM) |

**Usage:**
- Database configuration in [backend/config/database.js](backend/config/database.js)
- Models defined in [backend/models/](backend/models/)
- Schema middleware for validation and hooks

### Authentication & Authorization

| Technology | Version | Purpose |
|------------|---------|---------|
| **Clerk SDK Node** | 5.1.6 | Primary authentication backend |
| **@clerk/express** | 1.5.0 | Express middleware for Clerk |
| **bcrypt** | 6.0.0 | Password hashing (legacy) |

**Authentication Flow:**
1. JWT token received in `Authorization` header
2. Token verified using Clerk's `verifyToken()`
3. User metadata extracted (role, companyId)
4. `req.user` populated with user context

**Middleware:** [backend/middleware/auth.js](backend/middleware/auth.js)

### Real-time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.IO** | 4.8.1 | WebSocket server for real-time updates |

**Configuration:**
- Socket setup in [backend/socket/](backend/socket/)
- Broadcast utilities in [backend/utils/socketBroadcaster.js](backend/utils/socketBroadcaster.js)
- Room-based broadcasts for role segregation

### API Documentation

| Technology | Version | Purpose |
|------------|---------|---------|
| **Swagger JSDoc** | 6.2.8 | OpenAPI specification from JSDoc |
| **Swagger UI Express** | 5.0.1 | Interactive API documentation |

**Access:** `/api-docs` endpoint when server is running

### Data Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **Joi** | 18.0.2 | Schema validation for requests |

### File Processing

| Library | Version | Purpose |
|---------|---------|---------|
| **ExcelJS** | 4.4.0 | Excel file generation |
| **PDFKit** | 0.17.1 | PDF generation |
| **pdfkit-table** | 0.1.99 | PDF table formatting |

### Scheduled Tasks

| Library | Version | Purpose |
|---------|---------|---------|
| **node-cron** | 4.2.1 | Cron job scheduling |

**Usage:**
- Automated promotion applications
- Scheduled reports
- Background task processing

### Logging

| Library | Version | Purpose |
|------------|---------|---------|
| **Winston** | 3.19.0 | Logging framework |
| **winston-daily-rotate-file** | 5.0.0 | Log rotation by date |

### Utilities

| Library | Version | Purpose |
|---------|---------|---------|
| **axios** | 1.13.2 | HTTP client for external APIs |
| **dotenv** | 16.5.0 | Environment variable management |
| **dotenv-flow** | 4.1.0 | Multi-environment configuration |
| **immer** | 10.1.1 | Immutable state updates |
| **cors** | 2.8.5 | Cross-origin resource sharing |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | 29.7.0 | Test framework |
| **Supertest** | 6.3.4 | HTTP endpoint testing |
| **mongodb-memory-server** | 9.1.8 | In-memory MongoDB for testing |

**Coverage Thresholds:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Nodemon** | 3.1.10 | Auto-restart on file changes |
| **ESLint** | 8.57.0 | Code linting |
| **Prettier** | 3.3.3 | Code formatting |
| **Babel** | Latest | JavaScript transpilation |

---

## Database Architecture

### Database Type

**MongoDB 6.0** - NoSQL document database with flexible schema design

### Multi-Tenant Architecture

The application implements a **database-per-tenant** pattern:

```
┌─────────────────────────────────────────────────────┐
│                    MongoDB Cluster                  │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Company A DB │  │ Company B DB │  │ Superadmin │ │
│  │ (tenant_a)   │  │ (tenant_b)   │  │ (AmasQIS)  │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Design Pattern:**
- Each company gets its own isolated database
- Database name derived from company identifier
- Superadmin database ("AmasQIS") manages company/subscription data
- Tenant selected based on `companyId` from Clerk user metadata

### ODM (Object Data Modeling)

**Mongoose 8.9.5** provides:
- Schema definition and validation
- Middleware (pre/post hooks)
- Virtual properties and computed fields
- Static and instance methods
- Compound indexes for query optimization

### Schema Collections

**Core HRM Collections:**
- employees, departments, designations
- attendance, leaves, holidays
- promotions, resignations, terminations
- performanceAppraisals, performanceReviews, goalTrackings
- trainings, policies, assets

**Project Management Collections:**
- projects, tasks, projectMembers
- milestones, timeLogs

**CRM Collections:**
- leads, clients, contacts
- pipelines, deals, activities
- tickets

**Communication Collections:**
- socialFeeds, conversations, messages
- notifications

**System Collections:**
- users, roles, permissions
- settings, configurations

### Schema Features

| Feature | Description |
|---------|-------------|
| **Soft Delete** | `isActive: false`, `isDeleted: true` flags |
| **Timestamps** | `createdAt`, `updatedAt` automatic management |
| **Company Isolation** | `companyId` field on all tenant documents |
| **User Tracking** | `createdBy`, `updatedBy` audit fields |
| **Text Search** | MongoDB text indexes for searchable fields |
| **Compound Indexes** | Optimized queries for common filters |

---

## Communication Patterns

### Hybrid Architecture: 80% REST + 20% Socket.IO

The application uses a hybrid communication pattern combining traditional REST APIs with real-time WebSocket broadcasts.

```
┌─────────────┐                    ┌──────────────┐
│  Frontend   │                    │   Backend    │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │ 1. REST API (Axios)              │
       │─────────────────────────────────>│
       │   POST /api/employees            │
       │                                  │
       │                2. Process        │
       │<─────────────────────────────────│
       │   { success: true, data: {...} } │
       │                                  │
       │ 3. Socket.IO Broadcast           │
       │<─────────────────────────────────│
       │   employee:created event         │
       │                                  │
       │ 4. Update UI in real-time        │
│
```

### REST API

**128 documented endpoints** across 13 modules

**Standard Patterns:**
- CRUD operations (Create, Read, Update, Delete)
- Pagination: `page`, `limit` query parameters
- Filtering: `filter`, `search` query parameters
- Sorting: `sortBy`, `sortOrder` query parameters
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Structured error responses

**Response Format:**
```javascript
{
  success: true/false,
  data: {...},
  message: "Operation successful",
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
}
```

### Socket.IO Real-time Updates

**Event Broadcasting Pattern:**

| Event Type | Example Events | Purpose |
|------------|----------------|---------|
| **Employee** | `employee:created`, `employee:updated`, `employee:deleted` | HRM updates |
| **Project** | `project:created`, `project:updated`, `project:progress_updated` | Project changes |
| **Task** | `task:created`, `task:updated`, `task:status_changed` | Task management |
| **Lead** | `lead:created`, `lead:updated`, `lead:stage_changed` | CRM pipeline |
| **Attendance** | `attendance:clock_in`, `attendance:clock_out` | Time tracking |
| **Leave** | `leave:approved`, `leave:rejected`, `leave:cancelled` | Leave management |

**Room-Based Broadcasting:**

| Room Pattern | Description |
|--------------|-------------|
| `superadmin_room` | All superadmin users |
| `admin_room_{companyId}` | Company admins |
| `hr_room_{companyId}` | Company HR users |
| `user_{userId}` | Individual user notifications |

**Rate Limiting:**
- Production: Limited broadcasts per minute
- Development: Unlimited for debugging

**Configuration:** [backend/utils/socketBroadcaster.js](backend/utils/socketBroadcaster.js)

### API Client (Frontend)

**Axios Configuration** in [react/src/services/api.ts](react/src/services/api.ts):

```typescript
// Features:
- Base URL from environment variable
- Clerk JWT token attached via interceptors
- Request/response interceptors for error handling
- TypeScript response typing
- Automatic retry on token expiration
```

---

## Authentication & Authorization

### Authentication Provider: Clerk

[Clerk](https://clerk.com) provides complete authentication as a service.

### Frontend Authentication

| Technology | Purpose |
|------------|---------|
| **@clerk/clerk-react** | React authentication hooks and components |
| **ClerkProvider** | Wraps application with auth context |
| **Publishable Key** | Frontend authentication key |

**Implementation:** [react/src/services/AuthProvider.tsx](react/src/services/AuthProvider.tsx)

```typescript
// Clerk provides:
- SignIn/SignUp components
- Session management
- Token management
- User metadata (role, companyId)
- Protected routes with <ProtectedRoute>
```

### Backend Authentication

| Technology | Purpose |
|------------|---------|
| **@clerk/clerk-sdk-node** | Node.js SDK for server-side auth |
| **@clerk/express** | Express middleware for route protection |
| **Clerk JWT Key** | Token verification key from Dashboard |

### Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Frontend  │     │    Clerk     │     │   Backend    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Sign In        │                    │
       │───────────────────>│                    │
       │                    │                    │
       │ 2. JWT Token       │                    │
       │<───────────────────│                    │
       │                    │                    │
       │ 3. API Request     │                    │
       │───────────────────────────────────────>│
       │    Authorization: Bearer <token>       │
       │                    │                    │
       │                    │ 4. Verify Token   │
       │                    │<───────────────────│
       │                    │                    │
       │                    │ 5. Token Valid     │
       │                    │───────────────────>│
       │                    │                    │
       │ 6. Response        │                    │
       │<───────────────────────────────────────│
       │                    │                    │
```

### Role-Based Access Control (RBAC)

**Roles:**
| Role | Level | Access |
|------|-------|--------|
| **superadmin** | Platform | All companies, system settings |
| **admin** | Company | Company-wide access |
| **hr** | Company | HR module access |
| **employee** | Self | Personal data only |

**Middleware:** [backend/middleware/auth.js](backend/middleware/auth.js)

```javascript
// Available middleware:
- requireAuth()           // Any authenticated user
- requireRole(...roles)   // Specific roles only
- requireCompany          // Requires valid companyId
- requireSuperadmin       // Superadmin only
```

### Authorization Implementation

**User Metadata Structure** (stored in Clerk):
```json
{
  "publicMetadata": {
    "role": "admin|hr|employee|superadmin",
    "companyId": "68443081dcdfe43152aebf80",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Request Context** (populated in `req.user`):
```javascript
{
  userId: "user_abc123",
  companyId: "68443081dcdfe43152aebf80",
  role: "admin",
  email: "john@example.com"
}
```

### Security Features

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | 100 requests/minute per user |
| **Request ID** | Unique tracking ID for audit |
| **CORS** | Configured allowed origins |
| **JWT Verification** | Via Clerk's secure endpoint |
| **HTTPS Required** | In production |

### Development Considerations

**Current workaround** (must be removed before production):
- Auto-assigns companyId for admin/hr in development
- Hardcoded companyId: "68443081dcdfe43152aebf80"
- Controlled by `DEV_MODE` environment variable

---

## Development Tools

### Linting

**ESLint 8.57.0** configuration includes:

| Plugin | Purpose |
|--------|---------|
| **@typescript-eslint** | TypeScript-specific rules |
| **eslint-plugin-react** | React best practices |
| **eslint-plugin-react-hooks** | Hooks rules of engagement |
| **eslint-plugin-jsx-a11y** | Accessibility checks |
| **eslint-plugin-import** | Import/export rules |
| **eslint-plugin-node** | Node.js specific rules |
| **eslint-plugin-prettier** | Prettier integration |

**Configuration:** `.eslintrc.json`

### Formatting

**Prettier 3.3.3** configuration:
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

### Testing

**Jest 29.7.0** with:

| Tool | Purpose |
|------|---------|
| **Supertest** | HTTP endpoint testing |
| **mongodb-memory-server** | In-memory MongoDB for tests |
| **@testing-library/react** | Frontend component testing |

**Coverage Requirements:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Package Management

**npm** is used for both frontend and backend:
- Root `package.json` for orchestration
- Separate `package.json` for backend and react/frontend
- `concurrently` for running multiple processes

**Root Scripts:**
```json
{
  "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
  "dev:backend": "cd backend && npm run dev",
  "dev:frontend": "cd react && npm start"
}
```

### Version Control

**Git with GitHub:**
- Main branch: `main`
- Feature branches for development
- Pull request workflow

---

## Deployment Configuration

### Docker Support

**docker-compose.yml** provides multi-service deployment:

```yaml
services:
  - backend:    # Node.js API server
  - frontend:   # React build (served by nginx)
  - mongo:      # MongoDB database
  - redis:      # Caching layer (optional)
  - nginx:      # Reverse proxy
```

**Network:** `hrms-network` for service isolation

### Environment Variables

#### Backend Environment (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | development/production |
| `PORT` | Server port | 5000 |
| `MONGO_URI` | MongoDB connection | mongodb://localhost:27017 |
| `CLERK_PUBLISHABLE_KEY` | Clerk frontend key | pk_test_... |
| `CLERK_SECRET_KEY` | Clerk backend key | sk_test_... |
| `CLERK_JWT_KEY` | JWT verification | From Clerk Dashboard |
| `FRONTEND_URL` | CORS origin | http://localhost:3000 |
| `SMTP_HOST` | Email server | smtp.gmail.com |
| `SMTP_USER` | Email username | noreply@example.com |
| `SMTP_PASS` | Email password | *** |
| `REDIS_HOST` | Redis server | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `DEV_MODE` | Development flag | true |

#### Frontend Environment (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_BACKEND_URL` | API base URL | http://localhost:5000 |
| `REACT_APP_API_URL` | API endpoint | http://localhost:5000/api |
| `REACT_APP_SOCKET_URL` | Socket.IO server | http://localhost:5000 |
| `REACT_APP_CLERK_PUBLISHABLE_KEY` | Clerk key | pk_test_... |
| `VITE_CLERK_PUBLISHABLE_KEY` | Vite support | pk_test_... |

### Deployment Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start both frontend and backend |
| `npm run build` | Build production frontend |
| `npm start` | Start production server |

### Infrastructure Options

| Component | Options |
|-----------|---------|
| **Database** | MongoDB Atlas (cloud) or self-hosted |
| **Caching** | Redis (optional) |
| **Reverse Proxy** | Nginx (optional) |
| **SSL** | Let's Encrypt certificates |

---

## Project Structure

```
manageRTC-my/
├── backend/                           # Node.js/Express Backend
│   ├── config/                        # Configuration files
│   │   ├── database.js               # MongoDB connection setup
│   │   └── swagger.js                # API documentation config
│   │
│   ├── controllers/                   # Request handlers
│   │   └── rest/                     # REST controllers
│   │       ├── department.controller.js
│   │       ├── designation.controller.js
│   │       ├── employee.controller.js
│   │       └── ... (20+ controllers)
│   │
│   ├── middleware/                    # Express middleware
│   │   ├── auth.js                   # Authentication & authorization
│   │   ├── errorHandler.js           # Centralized error handling
│   │   ├── requestLogger.js          # Request logging
│   │   └── rateLimiter.js            # Rate limiting
│   │
│   ├── models/                        # Mongoose schemas
│   │   ├── Department.js
│   │   ├── Designation.js
│   │   ├── Employee.js
│   │   └── ... (30+ models)
│   │
│   ├── routes/                        # API routes
│   │   ├── api/                      # REST API endpoints
│   │   │   ├── departments.js
│   │   │   ├── designations.js
│   │   │   ├── employees.js
│   │   │   └── ... (30+ route files)
│   │   └── index.js                  # Route aggregation
│   │
│   ├── socket/                        # Socket.IO setup
│   │   ├── index.js                  # Socket initialization
│   │   └── connectionHandler.js      # Connection management
│   │
│   ├── utils/                         # Utility functions
│   │   ├── socketBroadcaster.js      # Real-time broadcast helper
│   │   ├── errorHandler.js           # Error utilities
│   │   └── helpers.js                # Common helpers
│   │
│   ├── jobs/                          # Scheduled tasks
│   │   └── promotionScheduler.js     # Automated promotions
│   │
│   ├── tests/                         # Test files
│   │   ├── unit/                     # Unit tests
│   │   └── integration/              # Integration tests
│   │
│   ├── logs/                          # Application logs
│   │   └── (rotated log files)
│   │
│   ├── .env                           # Environment variables
│   ├── package.json                   # Dependencies
│   ├── server.js                      # Application entry point
│   └── nodemon.json                   # Nodemon configuration
│
├── react/                             # React Frontend
│   ├── public/                        # Static assets
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── components/                # Shared components
│   │   │   ├── layout/               # Layout components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── common/               # Common UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Modal.tsx
│   │   │   └── loading/              # Loading states
│   │   │
│   │   ├── core/                      # Core application setup
│   │   │   ├── store/                # Redux store
│   │   │   │   ├── index.ts
│   │   │   │   └── slices/           # Redux slices
│   │   │   ├── router/               # Route configuration
│   │   │   └── theme/                # Theme configuration
│   │   │
│   │   ├── feature-module/            # Feature modules
│   │   │   ├── hrm/                  # HR Management
│   │   │   │   ├── employees/
│   │   │   │   │   ├── employeedetails.tsx
│   │   │   │   │   ├── employeesGrid.tsx
│   │   │   │   │   └── employeesList.tsx
│   │   │   │   ├── designations.tsx
│   │   │   │   ├── departments.tsx
│   │   │   │   ├── attendance.tsx
│   │   │   │   └── leaves.tsx
│   │   │   │
│   │   │   ├── projects/             # Project Management
│   │   │   │   ├── projectsList.tsx
│   │   │   │   ├── projectDetails.tsx
│   │   │   │   ├── tasks.tsx
│   │   │   │   └── kanban.tsx
│   │   │   │
│   │   │   ├── crm/                  # CRM Features
│   │   │   │   ├── leads/
│   │   │   │   ├── clients/
│   │   │   │   ├── pipelines/
│   │   │   │   └── deals.tsx
│   │   │   │
│   │   │   ├── helpdesk/             # Help Desk
│   │   │   │   ├── tickets.tsx
│   │   │   │   └── knowledgeBase.tsx
│   │   │   │
│   │   │   ├── recruitment/          # Recruitment
│   │   │   │   ├── jobs.tsx
│   │   │   │   ├── candidates.tsx
│   │   │   │   └── onboarding.tsx
│   │   │   │
│   │   │   ├── performance/          # Performance
│   │   │   │   ├── appraisals.tsx
│   │   │   │   ├── goals.tsx
│   │   │   │   └── reviews.tsx
│   │   │   │
│   │   │   ├── payroll/              # Payroll
│   │   │   │   ├── salary.tsx
│   │   │   │   ├── payslips.tsx
│   │   │   │   └── taxes.tsx
│   │   │   │
│   │   │   └── ... (20+ modules)
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useEmployeesREST.ts
│   │   │   ├── useDepartmentsREST.ts
│   │   │   ├── useDesignationsREST.ts
│   │   │   ├── useProjectsREST.ts
│   │   │   ├── useTasksREST.ts
│   │   │   ├── useLeadsREST.ts
│   │   │   └── ... (25+ custom hooks)
│   │   │
│   │   ├── services/                  # API & services
│   │   │   ├── api.ts                # Axios configuration
│   │   │   ├── AuthProvider.tsx      # Clerk auth wrapper
│   │   │   └── socket.ts             # Socket.IO client
│   │   │
│   │   ├── types/                     # TypeScript types
│   │   │   ├── employee.types.ts
│   │   │   ├── project.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── App.tsx                    # Root component
│   │   ├── index.tsx                  # Entry point
│   │   └── react-app-env.d.ts         # React types
│   │
│   ├── .env                           # Environment variables
│   ├── package.json                   # Dependencies
│   ├── tsconfig.json                  # TypeScript config
│   └── tailwind.config.js             # Tailwind CSS config
│
├── .gitignore                         # Git exclusions
├── docker-compose.yml                 # Docker services
├── package.json                       # Root dependencies
├── README.md                          # Project documentation
└── TECH_STACK_REPORT.md              # This report
```

---

## API Documentation

### API Modules

The backend provides 128+ REST endpoints across these modules:

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Authentication** | 3 | Clerk integration, session management |
| **Companies** | 8 | Company CRUD, subscription management |
| **Departments** | 7 | Department CRUD, employee count |
| **Designations** | 7 | Designation/title CRUD |
| **Employees** | 12 | Full employee management |
| **Projects** | 10 | Project CRUD, member management |
| **Tasks** | 11 | Task CRUD, status updates |
| **Leads** | 9 | Lead management, stage transitions |
| **Clients** | 8 | Client management, deal stats |
| **Attendance** | 6 | Clock in/out, attendance records |
| **Leaves** | 9 | Leave requests, approval workflow |
| **Performance** | 8 | Appraisals, goals, reviews |
| **Recruitment** | 7 | Jobs, candidates, applications |
| **Help Desk** | 6 | Tickets, knowledge base |
| **Reports** | 8 | Various report generations |
| **Settings** | 5 | System configuration |

### Accessing Documentation

When the server is running, access interactive API docs at:
```
http://localhost:5000/api-docs
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Engineering",
    "description": "Software development team"
  },
  "message": "Department created successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "DEPT_001",
    "message": "Department name already exists",
    "details": "A department with this name already exists in your company"
  },
  "requestId": "req_abc123xyz"
}
```

---

## Summary & Recommendations

### Architecture Strengths

1. **Multi-tenant Design**: Clean data isolation between companies
2. **Hybrid Communication**: Efficient REST + real-time Socket.IO pattern
3. **Modern Auth**: Clerk provides enterprise-grade authentication
4. **Type Safety**: TypeScript on frontend reduces bugs
5. **Modular Structure**: Clear separation of concerns
6. **Comprehensive Features**: 20+ modules covering HRM, Projects, CRM

### Technology Choices

| Category | Technology | Justification |
|----------|------------|---------------|
| Frontend | React + TypeScript | Industry standard, type safety |
| UI Library | Ant Design | Enterprise component library |
| State | Redux Toolkit | Modern, boilerplate-free Redux |
| Backend | Express + Node.js | Proven, scalable stack |
| Database | MongoDB | Flexible schema for multi-tenant |
| Auth | Clerk | Complete auth solution, less custom code |
| Real-time | Socket.IO | Bidirectional events, room support |

### Development Recommendations

1. **Before Production:**
   - Remove hardcoded `companyId` in [backend/middleware/auth.js](backend/middleware/auth.js)
   - Enable all rate limiters
   - Configure production CORS origins
   - Set up proper error monitoring (Sentry, etc.)
   - Enable SSL/HTTPS

2. **Testing:**
   - Increase test coverage to 70%+
   - Add integration tests for critical flows
   - Add E2E tests with Playwright or Cypress

3. **Performance:**
   - Implement Redis caching for frequent queries
   - Add database query optimization
   - Consider CDN for static assets
   - Implement lazy loading for routes

4. **Security:**
   - Regular security audits
   - Dependency updates (npm audit)
   - API rate limiting per user
   - Input sanitization

5. **Documentation:**
   - API documentation for external integrators
   - Component storybook for UI library
   - Deployment guides
   - Contributing guidelines

---

**Report End**

*This report was generated automatically on February 2, 2026*
