import { describe, expect, it } from 'vitest';
import { localAdminDemoEnabled } from './demo';

describe('local admin demo mode', () => {
  it('is available only when explicitly enabled in development', () => {
    expect(localAdminDemoEnabled({ DEV: true, VITE_ADMIN_DEMO_MODE: 'true' })).toBe(true);
    expect(localAdminDemoEnabled({ DEV: true })).toBe(false);
    expect(localAdminDemoEnabled({ DEV: false, VITE_ADMIN_DEMO_MODE: 'true' })).toBe(false);
  });
});