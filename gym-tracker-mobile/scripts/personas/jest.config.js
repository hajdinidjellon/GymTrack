/** Runs the test-account seed (seed.run.ts) with the app's TypeScript and `@/` setup. Not a test suite. */
module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  roots: ['<rootDir>/scripts/personas'],
  testMatch: ['**/seed.run.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};
