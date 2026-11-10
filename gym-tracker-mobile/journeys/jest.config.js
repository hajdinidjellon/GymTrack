/** The user journeys, counted tap by tap on the real screens (see journeys/README.md). */
module.exports = {
  rootDir: '..',
  preset: 'jest-expo/ios',
  roots: ['<rootDir>/journeys'],
  testMatch: ['**/*.test.ts?(x)'],
  setupFiles: [
    '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js',
    '<rootDir>/jest.setup.ts',
    '<rootDir>/journeys/setup.ts',
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};
