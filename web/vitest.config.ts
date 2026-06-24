import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Only run unit tests with Vitest. Leave E2E to Playwright.
    include: ['tests/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['tests/e2e/**/*'],
    setupFiles: ['./tests/unit/setup/rtl-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './tests'),
    },
  },
});
