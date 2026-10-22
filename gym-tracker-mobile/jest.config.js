/**
 * Deux projets :
 * - domain : la logique pure, sous Node, sans rien de React Native ;
 * - app : stores, services et composants, avec le preset jest-expo.
 */
const alias = { '^@/(.*)$': '<rootDir>/$1' };

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'domain',
      testEnvironment: 'node',
      roots: ['<rootDir>/domain'],
      testMatch: ['**/__tests__/**/*.test.ts'],
      moduleNameMapper: alias,
    },
    {
      displayName: 'app',
      preset: 'jest-expo/ios',
      roots: ['<rootDir>/services', '<rootDir>/stores', '<rootDir>/components', '<rootDir>/hooks'],
      testMatch: ['**/__tests__/**/*.test.ts?(x)'],
      setupFiles: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: alias,
    },
  ],
  collectCoverageFrom: [
    'domain/**/*.ts',
    'services/**/*.ts',
    'stores/**/*.ts',
    'components/**/*.tsx',
    '!**/__tests__/**',
    // Simples passe-plats vers un SDK natif : vérifiés sur téléphone, pas en Node
    '!services/{logger,notifications,speech,supabase}.ts',
  ],
  coverageThreshold: {
    // La logique métier doit être couverte presque entièrement
    './domain/': { statements: 95, branches: 90, functions: 95, lines: 95 },
    './stores/': { statements: 80, branches: 70, functions: 80, lines: 85 },
    './services/': { statements: 80, branches: 60, functions: 80, lines: 85 },
  },
};
