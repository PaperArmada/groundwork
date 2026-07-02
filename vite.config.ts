import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';

export default defineConfig({
  // Relative base: assets resolve under any Pages path without hardcoding
  // the repo name; hash routing keeps deep links free of 404 rewrites.
  base: './',
  plugins: [
    { enforce: 'pre', ...mdx({ jsxImportSource: 'react' }) },
    react(),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
