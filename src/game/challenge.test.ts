import { describe, expect, it } from 'vitest';
import manifest from '../data/draft-region-groups.json';
import type { DraftRegionManifest } from './types';
import {
  CHALLENGE_QUERY_PARAM,
  CHALLENGE_VERSION,
  challengeCode,
  createChallengeUrl,
  decodeChallenge,
  encodeChallenge,
} from './challenge';
import type { CampaignChallenge } from './challenge';

const draftManifest = manifest as DraftRegionManifest;
const challenge: CampaignChallenge = {
  version: CHALLENGE_VERSION,
  seed: 'draftlendas2026a',
  datasetVersion: draftManifest.datasetVersion,
  gameMode: 'almanac',
  gamePlan: 'control_pick',
  availability: {
    startingExchanges: 3,
    activeYears: [2017, 2025],
    activeRegionGroups: ['KOREA', 'CHINA'],
  },
};

describe('campaign challenges', () => {
  it('round-trips the versioned seed and exact draft rules', () => {
    const encoded = encodeChallenge(challenge);
    expect(decodeChallenge(encoded, draftManifest)).toEqual(challenge);
    const url = new URL(createChallengeUrl(challenge, 'https://draft.example/old?ignored=1#hash'));
    expect(url.pathname).toBe('/old');
    expect(url.searchParams.get(CHALLENGE_QUERY_PARAM)).toBe(encoded);
    expect(url.hash).toBe('');
    expect(challengeCode(challenge)).toBe('DRAF-TLEN');
  });

  it('keeps older links compatible as classic campaigns', () => {
    const compact = JSON.parse(Buffer.from(encodeChallenge(challenge), 'base64url').toString());
    delete compact.m;
    delete compact.p;
    const legacy = Buffer.from(JSON.stringify(compact)).toString('base64url');
    expect(decodeChallenge(legacy, draftManifest)).toMatchObject({
      gameMode: 'classic',
      gamePlan: null,
    });
  });

  it('rejects malformed, obsolete-dataset, and unsupported challenges', () => {
    expect(decodeChallenge('not-base64', draftManifest)).toBeNull();
    expect(
      decodeChallenge(
        encodeChallenge({ ...challenge, datasetVersion: 'obsolete-dataset' }),
        draftManifest,
      ),
    ).toBeNull();
    expect(
      decodeChallenge(
        encodeChallenge({
          ...challenge,
          availability: { ...challenge.availability, activeYears: [2011] },
        }),
        draftManifest,
      ),
    ).toBeNull();
    expect(
      decodeChallenge(
        encodeChallenge({ ...challenge, gameMode: 'invalid' as CampaignChallenge['gameMode'] }),
        draftManifest,
      ),
    ).toBeNull();
    expect(
      decodeChallenge(
        encodeChallenge({ ...challenge, gamePlan: 'invalid' as CampaignChallenge['gamePlan'] }),
        draftManifest,
      ),
    ).toBeNull();
  });
});
