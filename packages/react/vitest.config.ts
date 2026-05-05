import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
  },
});
