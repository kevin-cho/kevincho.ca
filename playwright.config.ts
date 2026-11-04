import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

// Its own port, so it doesn't clash with `next dev` (3000) or the next-start
// preview (3001)
const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Terse output: a passing run is a line or two
  reporter: isCI ? [["github"], ["line"]] : "line",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Test a fresh production build, as Next.js recommends. Never reuse a
  // running server, so tests can't run against a stale build.
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
