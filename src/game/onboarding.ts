export const ONBOARDING_VERSION = 1;
export const ONBOARDING_STORAGE_KEY = 'draft-lendas.onboarding';

export type OnboardingStatus = 'completed' | 'skipped';

export interface OnboardingStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): OnboardingStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function onboardingStatus(
  storage: OnboardingStorage | null = browserStorage(),
): OnboardingStatus | null {
  try {
    const raw = storage?.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: unknown; status?: unknown };
    if (
      parsed.version !== ONBOARDING_VERSION ||
      (parsed.status !== 'completed' && parsed.status !== 'skipped')
    )
      return null;
    return parsed.status;
  } catch {
    return null;
  }
}

export function shouldOpenOnboarding(storage?: OnboardingStorage | null): boolean {
  return onboardingStatus(storage) === null;
}

export function saveOnboardingStatus(
  status: OnboardingStatus,
  storage: OnboardingStorage | null = browserStorage(),
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ version: ONBOARDING_VERSION, status }),
    );
    return true;
  } catch {
    return false;
  }
}
