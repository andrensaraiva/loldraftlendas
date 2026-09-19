import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_VERSION,
  onboardingStatus,
  saveOnboardingStatus,
  shouldOpenOnboarding,
} from './onboarding';
import type { OnboardingStorage } from './onboarding';

function storage(): OnboardingStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('versioned onboarding state', () => {
  it('opens on a first visit and stays dismissed after completion', () => {
    const local = storage();
    expect(shouldOpenOnboarding(local)).toBe(true);
    expect(saveOnboardingStatus('completed', local)).toBe(true);
    expect(onboardingStatus(local)).toBe('completed');
    expect(shouldOpenOnboarding(local)).toBe(false);
  });

  it('records a skip but reopens after the experience version changes', () => {
    const local = storage();
    saveOnboardingStatus('skipped', local);
    expect(onboardingStatus(local)).toBe('skipped');
    local.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ version: ONBOARDING_VERSION - 1, status: 'completed' }),
    );
    expect(shouldOpenOnboarding(local)).toBe(true);
  });

  it('fails open for invalid or unavailable storage', () => {
    const local = storage();
    local.setItem(ONBOARDING_STORAGE_KEY, '{broken');
    expect(shouldOpenOnboarding(local)).toBe(true);
    expect(saveOnboardingStatus('completed', null)).toBe(false);
  });
});
