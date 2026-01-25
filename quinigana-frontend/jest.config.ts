import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFiles: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
