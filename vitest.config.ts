import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { BUILD_DEFINES } from './build-constants.ts';

export default defineConfig({
  define: BUILD_DEFINES,
  plugins: [react()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/routes.ts',
        'src/root.tsx',
      ],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
    ],
  },
});
