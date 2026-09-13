import { describe, expect, it } from 'vitest';
import { champions } from '../data/champions';
import manifest from '../data/draft-region-groups.json';
import { players } from '../data/players';
import { createDraftFromPlan, planDraft } from './draft';
import { defaultDraftAvailability } from './product-config';
import { advanceTournament, createSeries, newTournament, seriesDone, simulateGame } from './engine';
import { campaignRandom } from './random';
import type { DraftRegionManifest, Tournament } from './types';

const draftManifest = manifest as DraftRegionManifest;

function runCampaign(seed: string) {
  const availability = defaultDraftAvailability({ draftRegionManifest: draftManifest });
  const plan = planDraft(draftManifest, availability, campaignRandom(seed, 'draft/initial'));
  const rounds = createDraftFromPlan(players, plan, draftManifest);
  const team = rounds.map((round) => round.options[0]);
  let tournament: Tournament = newTournament();
  while (!tournament.outcome) {
    let series = createSeries(
      tournament,
      players,
      campaignRandom(seed, `series/${tournament.history.length}/${tournament.stage}`),
    );
    while (!seriesDone(series)) {
      const result = simulateGame(
        series,
        team,
        champions,
        campaignRandom(
          seed,
          `series/${tournament.history.length}/${series.stage}/${series.opponentName}/game/${series.games.length + 1}`,
        ),
      );
      series = { ...series, games: [...series.games, result] };
    }
    tournament = advanceTournament(tournament, series);
  }
  return { rounds, team, tournament };
}

describe('deterministic campaigns', () => {
  it('reproduces offers, opponents, results and match recaps from one seed', () => {
    const seed = 'draftlendas2026a';
    expect(runCampaign(seed)).toEqual(runCampaign(seed));
  });

  it('keeps known end-to-end seeds for champion and Swiss elimination paths', () => {
    const champion = runCampaign('000000000000000x').tournament;
    expect(champion.outcome).toBe('Campeão mundial');
    expect(champion.history).toHaveLength(6);
    expect(champion.history.flatMap((entry) => entry.games)).toHaveLength(16);

    const eliminated = runCampaign('0000000000000000').tournament;
    expect(eliminated.outcome).toBe('Eliminado no Suíço');
    expect(eliminated.history).toHaveLength(3);
    expect(eliminated.history.flatMap((entry) => entry.games)).toHaveLength(5);
  });
});
