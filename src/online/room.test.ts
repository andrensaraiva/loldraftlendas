import { describe, expect, it } from 'vitest';
import { champions } from '../data/champions';
import manifest from '../data/draft-region-groups.json';
import { players } from '../data/players';
import type { GameData } from '../data/repository';
import { duelRounds } from '../game/duel';
import { completedOnlineDuel, onlineDuelRounds, parseOnlineDuelRoom } from './room';

const seed = '0123456789abcdef';
const data: GameData = {
  players,
  champions,
  draftRegionManifest: manifest as GameData['draftRegionManifest'],
};
const rounds = duelRounds(data, seed);
const baseRoom = {
  code: 'ABCDEF123456',
  seed,
  datasetVersion: manifest.datasetVersion,
  offers: rounds.map((round) => ({
    role: round.role,
    year: round.year,
    regionGroup: round.region.id,
    optionIds: round.options.map((player) => player.id),
  })),
  seat: 'guest',
  state: 'drafting',
  expiresAt: '2026-10-06T00:00:00Z',
  hostReady: true,
  guestReady: false,
  myPicks: null,
  myPlan: null,
  hostPicks: null,
  guestPicks: null,
  hostPlan: null,
  guestPlan: null,
};

describe('online duel room contract', () => {
  it('keeps the opponent hidden until both sides submit and reproduces the final score', () => {
    const waiting = parseOnlineDuelRoom(baseRoom);
    expect(waiting.hostReady).toBe(true);
    expect(waiting.hostPicks).toBeNull();
    expect(completedOnlineDuel(waiting, data)).toBeNull();

    const complete = parseOnlineDuelRoom({
      ...baseRoom,
      state: 'complete',
      guestReady: true,
      myPicks: rounds.map((round) => round.options[2].id),
      myPlan: 'teamfight',
      hostPicks: rounds.map((round) => round.options[0].id),
      guestPicks: rounds.map((round) => round.options[2].id),
      hostPlan: 'aggression',
      guestPlan: 'teamfight',
    });
    expect(onlineDuelRounds(complete, data).map((round) => round.options)).toEqual(
      rounds.map((round) => round.options),
    );
    const result = completedOnlineDuel(complete, data)!;
    expect(Math.max(...result.score)).toBe(3);
    expect(completedOnlineDuel(complete, data)).toEqual(result);
  });

  it('rejects an altered offer and a room from another dataset', () => {
    expect(() => parseOnlineDuelRoom({ ...baseRoom, offers: [] })).toThrow();
    expect(() =>
      parseOnlineDuelRoom({
        ...baseRoom,
        hostPicks: rounds.map((round) => round.options[0].id),
        hostPlan: 'aggression',
      }),
    ).toThrow();
    const room = parseOnlineDuelRoom({
      ...baseRoom,
      offers: baseRoom.offers.map((offer, index) =>
        index === 0 ? { ...offer, optionIds: ['invented', ...offer.optionIds.slice(1)] } : offer,
      ),
    });
    expect(() => onlineDuelRounds(room, data)).toThrow();
    expect(() => onlineDuelRounds({ ...room, datasetVersion: 'other' }, data)).toThrow();
  });
});
