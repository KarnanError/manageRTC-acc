/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// In ESM mode (--experimental-vm-modules), jest is not auto-injected as a global
// in setupFilesAfterEnv files — import it explicitly.
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/managertest_db';
process.env.CLERK_SECRET_KEY = 'test_secret_key';
process.env.JWT_SECRET = 'test_jwt_secret';

// Mock environment variables for development
process.env.isDevelopment = 'false';

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging test failures
  error: console.error,
};

// Mock Socket.IO
global.mockSocketIO = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  to: jest.fn(() => global.mockSocketIO),
  emit: jest.fn(),
};

// Setup test database connection
beforeAll(async () => {
  // Database connection will be handled in individual test files
  // to allow for proper cleanup
});

// Global teardown
afterAll(async () => {
  // Cleanup will be handled in individual test files
});

// Note: jest.mock() calls must be placed in individual test files, NOT here.
// In ESM mode (--experimental-vm-modules), jest.mock() in setupFilesAfterEach
// cannot use require() hoisting and will throw "require is not defined".
// Each test file mocks its own dependencies via jest.mock() / jest.unstable_mockModule().
