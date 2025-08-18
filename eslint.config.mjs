import { defineConfig } from 'eslint/config';
import baseConfig from './configs/eslint/base.js';

export default defineConfig([
  ...baseConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**', '**/*.config.js', '**/*.config.ts'],
  },
]);
