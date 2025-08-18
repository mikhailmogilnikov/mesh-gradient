import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';

import unusedImports from 'eslint-plugin-unused-imports';
import _import from 'eslint-plugin-import';
import typescriptEslint from '@typescript-eslint/eslint-plugin';

import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores([
    '.now/*',
    '**/*.css',
    '**/.changeset',
    '**/dist',
    'esm/*',
    'public/*',
    'tests/*',
    'scripts/*',
    '**/*.config.js',
    '**/.DS_Store',
    '**/node_modules',
    '**/coverage',
    '**/.next',
    '**/build',
    '!**/.commitlintrc.cjs',
    '!**/.lintstagedrc.cjs',
    '!**/jest.config.js',
    '!**/plopfile.js',
    '!**/react-shim.js',
    '!**/tsup.config.ts',
  ]),
  {
    extends: fixupConfigRules(compat.extends('plugin:prettier/recommended')),

    plugins: {
      'unused-imports': unusedImports,
      import: fixupPluginRules(_import),
      '@typescript-eslint': typescriptEslint,
      prettier: fixupPluginRules(prettier),
    },

    languageOptions: {
      globals: {
        ...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, 'off'])),
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 12,
      sourceType: 'module',
    },

    files: ['**/*.ts', '**/*.tsx'],

    rules: {
      'no-console': 'warn',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'prettier/prettier': 'warn',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_.*?$',
        },
      ],

      'import/order': [
        'warn',
        {
          groups: ['type', 'builtin', 'object', 'external', 'internal', 'parent', 'sibling', 'index'],

          pathGroups: [
            {
              pattern: '~/**',
              group: 'external',
              position: 'after',
            },
          ],

          'newlines-between': 'always',
        },
      ],

      'padding-line-between-statements': [
        'warn',
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],
    },
  },
]);
