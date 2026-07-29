import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Matches the plain-JS file config below — unused vars starting with
      // an uppercase letter/underscore (component names kept for JSX,
      // intentionally-unused destructured values) are allowed.
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // This codebase uses `any` pervasively at API-response boundaries —
      // banning it wholesale would produce hundreds of pre-existing
      // warnings unrelated to real bugs, not a practical rule here.
      '@typescript-eslint/no-explicit-any': 'off',
      // eslint-plugin-react-hooks' "recommended" preset also ships the
      // newer React Compiler-oriented rules (set-state-in-effect,
      // static-components, immutability, purity), which flag this
      // codebase's existing, working data-fetch-in-useEffect pattern
      // throughout. Fixing those properly means restructuring component
      // logic across dozens of files — out of scope for a lint-config
      // pass — so they're turned off here; rules-of-hooks and
      // exhaustive-deps (the ones that catch real bugs) stay on.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    // Test-only infrastructure — re-exports testing-library helpers
    // alongside app-specific render/store utilities, which isn't part of
    // the app's Fast Refresh graph at all, so this rule doesn't apply.
    files: ['src/test/**', '**/*.test.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
