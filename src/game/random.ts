export type Random = () => number;

export const CAMPAIGN_RANDOM_VERSION = 1;
const CAMPAIGN_SEED_PATTERN = /^[a-z0-9]{16}$/;
const SEED_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function hash32(value: string, basis = 0x811c9dc5): number {
  let hash = basis >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  return (Math.imul(hash, 0xc2b2ae35) ^ (hash >>> 16)) >>> 0;
}

export function isCampaignSeed(value: unknown): value is string {
  return typeof value === 'string' && CAMPAIGN_SEED_PATTERN.test(value);
}

export function createCampaignSeed(rng: Random = Math.random): string {
  let seed = '';
  for (let index = 0; index < 16; index += 1) {
    const roll = Math.max(0, Math.min(0.999999999999, rng()));
    seed += SEED_ALPHABET[Math.floor(roll * SEED_ALPHABET.length)];
  }
  return seed;
}

export function campaignSeedFromText(value: string): string {
  const first = hash32(value).toString(16).padStart(8, '0');
  const second = hash32(value, 0x9e3779b9).toString(16).padStart(8, '0');
  return `${first}${second}`;
}

/**
 * Produces an independent deterministic stream for one campaign operation.
 * Domain scopes prevent UI timing or an unrelated roll from shifting later results.
 */
export function campaignRandom(seed: string, scope: string): Random {
  if (!isCampaignSeed(seed) || !scope) throw new Error('Seed ou escopo de campanha inválido.');
  let state = hash32(`${CAMPAIGN_RANDOM_VERSION}:${seed}:${scope}`);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
