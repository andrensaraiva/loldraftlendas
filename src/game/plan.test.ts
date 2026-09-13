import { describe, expect, it } from 'vitest';
import simulation from '../../data/research/game-plans/simulation.json';
import { BALANCE } from './engine';
import { GAME_PLANS, GAME_PLAN_IDS, gamePlanDefinition, isGamePlan } from './plan';

describe('game plans', () => {
  it('defines four distinct plans with explicit target tags', () => {
    expect(GAME_PLANS.map((plan) => plan.id)).toEqual(GAME_PLAN_IDS);
    expect(new Set(GAME_PLANS.flatMap((plan) => plan.tags))).toEqual(
      new Set([
        'EARLY_GAME',
        'ENGAGE',
        'TEAMFIGHT',
        'FRONTLINE',
        'PEEL',
        'PICK',
        'POKE',
        'CONTROL',
        'SCALING',
        'CARRY',
      ]),
    );
    expect(gamePlanDefinition('control_pick').label).toBe('Controle/Pick');
    expect(isGamePlan('scaling')).toBe(true);
    expect(isGamePlan('unknown')).toBe(false);
  });

  it('keeps the checked 100k-campaign calibration within product limits', () => {
    expect(simulation).toMatchObject({
      version: 'game-plans-v1',
      datasetVersion: 'multi-era-v1.3.0',
      totalCampaigns: 100000,
      samplesPerScenario: 20000,
      balance: {
        gamePlanHigh: BALANCE.gamePlanHigh,
        gamePlanMedium: BALANCE.gamePlanMedium,
        gamePlanLow: BALANCE.gamePlanLow,
        minProbability: BALANCE.minProbability,
        maxProbability: BALANCE.maxProbability,
      },
    });
    expect(simulation.results.map((result) => result.id)).toEqual(['none', ...GAME_PLAN_IDS]);
    const planned = simulation.results.filter((result) => result.id !== 'none');
    planned.forEach((result) => {
      expect(result.samples).toBe(20000);
      expect(result.probability.min).toBeGreaterThanOrEqual(BALANCE.minProbability);
      expect(result.probability.max).toBeLessThanOrEqual(BALANCE.maxProbability);
      expect(result.planModifier.min).toBeGreaterThanOrEqual(BALANCE.gamePlanLow);
      expect(result.planModifier.max).toBeLessThanOrEqual(BALANCE.gamePlanHigh);
    });
    const titleRates = planned.map((result) => result.titleRate);
    expect(Math.max(...titleRates) - Math.min(...titleRates)).toBeLessThanOrEqual(0.03);
  });
});
