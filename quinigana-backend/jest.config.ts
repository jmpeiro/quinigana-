import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/controllers/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageDirectory: 'coverage',
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: [
        '<rootDir>/src/__tests__/services/**/*.test.ts',
        '<rootDir>/src/__tests__/controllers/**/*.test.ts',
        '<rootDir>/src/__tests__/*.test.ts',
      ],
      clearMocks: true,
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      clearMocks: true,
      testTimeout: 30000,
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/__tests__/e2e/**/*.test.ts'],
      clearMocks: true,
      testTimeout: 60000,
    },
  ],
};

export default config;
