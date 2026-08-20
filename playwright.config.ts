import { defineConfig, devices } from '@playwright/test';

/*
 * The suite runs against the built static export served under the production sub-path, not against
 * the dev server. What ships is what is tested — including `basePath`, which the dev server on the
 * root would quietly paper over.
 */
const BASE_PATH = '/kreobuddha-ui-docs';
const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    /*
     * The trailing slash matters. Without it every path in the suite would resolve against the
     * origin and silently drop the base path, and a suite that tests the wrong URL still passes
     * the checks that do not need a page.
     */
    baseURL: `http://localhost:${PORT}${BASE_PATH}/`,
    trace: 'retain-on-failure',

    /*
     * The suite runs as a reader who asked for less motion. That is not only for determinism —
     * although smooth scrolling does make every position assertion a race with an animation — it
     * also means the path most likely to be left untested is the one being exercised.
     */
    contextOptions: { reducedMotion: 'reduce' },
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // 320 is the narrowest width the site claims to support, and the one every mobile check is
      // written against. A device preset would have picked a more comfortable 390.
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 320, height: 640 },
      },
    },
  ],

  webServer: {
    command: 'node scripts/serve-export.mjs',
    url: `http://localhost:${PORT}${BASE_PATH}/en/`,
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, PORT: String(PORT) },
  },
});
