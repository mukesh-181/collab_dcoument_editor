import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Run unit tests with Vitest.
    include: ['tests/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    setupFiles: ['./tests/unit/setup/rtl-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './tests'),
    },
  },
});
