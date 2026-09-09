export function localAdminDemoEnabled(environment: {
  DEV: boolean;
  VITE_ADMIN_DEMO_MODE?: string;
}): boolean {
  return environment.DEV && environment.VITE_ADMIN_DEMO_MODE === 'true';
}