import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// The end-to-end tests run against `next dev` in demo mode: demo mode signs in
// one fixed local user and is refused by production builds on purpose. The
// real Clerk sign-in is checked by hand on the deployed demo.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-ES',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', testIgnore: /mobile\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testMatch: /mobile\.spec\.ts/, use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `node scripts/run-next.mjs dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/workspace`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      AUTH_MODE: 'demo',
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgres://fichas:fichas-local@127.0.0.1:5432/fichas',
      NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED: '1',
    },
  },
});
