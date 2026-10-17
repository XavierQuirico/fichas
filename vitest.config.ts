import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['tests/components/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/components/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['components/workspace/**', 'components/icons.tsx', 'hooks/**'],
      exclude: ['hooks/use-long-press-sort.ts'],
      reporter: ['text-summary', 'json-summary'],
    },
  },
});
