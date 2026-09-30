import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// A separate server keeps the public feature flag disabled in the regular suite.
// Every Auth/RPC request is intercepted by the invitation tests.
export default defineConfig({
  ...base,
  testMatch: /online-duel\.spec\.ts/,
  testIgnore: [],
  outputDir: './test-results/online',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5174', serviceWorkers: 'block' },
  webServer: {
    command: 'npm run dev -- --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
    env: {
      VITE_ADMIN_DEMO_MODE: 'false',
      VITE_ONLINE_DUEL_ENABLED: 'true',
      VITE_SUPABASE_URL: 'https://duel-tests.supabase.test',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_invitation_tests_only',
    },
  },
  projects: base.projects?.filter((project) => ['desktop', 'mobile'].includes(project.name!)),
});
