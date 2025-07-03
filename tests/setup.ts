// Test setup file for Jest
// This file is run before each test file

// Mock console to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};