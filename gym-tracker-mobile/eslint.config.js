// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier/flat');

/**
 * Couches, de la plus pure à la plus concrète :
 *   types, domain → services → stores → hooks, components → app
 * Une couche n'importe jamais une couche au-dessus d'elle.
 */
module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'coverage/**', 'expo-env.d.ts'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            { target: './domain', from: './services', message: 'domain/ is pure: no I/O.' },
            { target: './domain', from: './stores', message: 'domain/ is pure: no state.' },
            { target: './domain', from: './components', message: 'domain/ is pure: no UI.' },
            { target: './domain', from: './hooks', message: 'domain/ is pure: no React.' },
            { target: './domain', from: './app', message: 'domain/ is pure: no routes.' },
            { target: './services', from: './stores', message: 'services/ must not depend on state.' },
            { target: './services', from: './components', message: 'services/ must not depend on UI.' },
            { target: './services', from: './app', message: 'services/ must not depend on routes.' },
            { target: './stores', from: './components', message: 'stores/ must not depend on UI.' },
            { target: './stores', from: './app', message: 'stores/ must not depend on routes.' },
            { target: './components', from: './app', message: 'components/ must not depend on routes.' },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['../*'], message: 'Use the @/ alias.' }],
        },
      ],
      'no-console': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      'react-hooks/exhaustive-deps': 'error',
      // Règle pensée pour le HTML : en React Native une apostrophe dans <Text> ne pose aucun problème
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    // Le domaine ne connaît ni React Native ni Expo : il tourne tel quel sous Node
    files: ['domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-native',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                'zustand*',
                '@supabase/*',
              ],
              message: 'domain/ is pure TypeScript.',
            },
            { group: ['../*'], message: 'Use the @/ alias.' },
          ],
        },
      ],
    },
  },
  {
    files: ['services/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // Les fabriques de jest.mock sont remontées avant les imports : require() y est obligatoire
    files: ['**/__tests__/**', 'jest.setup.ts'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
