import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { players } = await server.ssrLoadModule('/src/data/players.ts');
  const { champions } = await server.ssrLoadModule('/src/data/champions.ts');
  const engine = await server.ssrLoadModule('/src/game/engine.ts');
  const draft = await server.ssrLoadModule('/src/game/draft.ts');
  const { GAME_PLANS } = await server.ssrLoadModule('/src/game/plan.ts');

  engine.validateData(players, champions);
  const rngFor = (initialSeed) => {
    let seed = initialSeed >>> 0;
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  };
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const summary = (values) => {
    const sorted = [...values].sort((left, right) => left - right);
    const average = mean(values);
    return {
      mean: average,
      sd: Math.sqrt(mean(values.map((value) => (value - average) ** 2))),
      min: sorted[0],
      p10: sorted[Math.floor(values.length * 0.1)],
      median: sorted[Math.floor(values.length * 0.5)],
      p90: sorted[Math.floor(values.length * 0.9)],
      max: sorted.at(-1),
    };
  };
  const increment = (record, key) => {
    record[key] = (record[key] ?? 0) + 1;
  };

  const teams = [...new Set(players.map((player) => `${player.team} ${player.worldsYear}`))]
    .map((name) => ({
      name,
      team: players.filter((player) => `${player.team} ${player.worldsYear}` === name),
    }))
    .filter((candidate) => candidate.team.length === 5);
  const opponentStrengths = new Map(
    teams.map((candidate) => [
      candidate.name,
      [1, 2, 3, 4, 5].map((game) => engine.teamStrength(candidate.team, game, champions).total),
    ]),
  );
  const samplesPerScenario = Number(process.env.GAME_PLAN_SAMPLES ?? 20000);
  if (!Number.isInteger(samplesPerScenario) || samplesPerScenario < 1)
    throw new Error('GAME_PLAN_SAMPLES must be a positive integer');
  const scenarios = [
    { id: 'none', label: 'Sem plano (linha de base)', plan: null },
    ...GAME_PLANS.map((plan) => ({ id: plan.id, label: plan.label, plan: plan.id })),
  ];
  const results = [];

  for (const scenario of scenarios) {
    let titles = 0;
    let swissEliminations = 0;
    let totalGames = 0;
    const strengths = [];
    const modifiers = [];
    const probabilities = [];
    const compatibility = { high: 0, medium: 0, low: 0 };

    for (let sample = 0; sample < samplesPerScenario; sample++) {
      const draftRng = rngFor(11003 + sample * 104729);
      const pickRng = rngFor(17011 + sample * 65537);
      const opponentRng = rngFor(23003 + sample * 32771);
      const matchRng = rngFor(29009 + sample * 8191);
      const rounds = draft.createDraft(players, draftRng);
      const team = rounds.map(
        (round) => round.options[Math.floor(pickRng() * round.options.length)],
      );
      const gameStrengths = [1, 2, 3, 4, 5].map((game) =>
        engine.teamStrength(team, game, champions, scenario.plan),
      );
      gameStrengths.forEach((strength) => {
        strengths.push(strength.total);
        modifiers.push(strength.plan?.modifier ?? 0);
        if (strength.plan) increment(compatibility, strength.plan.compatibility);
      });

      let tournament = engine.newTournament();
      while (!tournament.outcome) {
        const unplayed = teams.filter(
          (candidate) =>
            !tournament.history.some((series) => series.opponentName === candidate.name),
        );
        const choices = unplayed.length ? unplayed : teams;
        const opponent = choices[Math.floor(opponentRng() * choices.length)];
        const series = {
          stage: tournament.stage,
          opponentName: opponent.name,
          opponent: opponent.team,
          bestOf: engine.formatFor(tournament),
          games: [],
        };
        while (!engine.seriesDone(series)) {
          const game = series.games.length + 1;
          const strength = gameStrengths[game - 1].total;
          const opponentStrength = opponentStrengths.get(opponent.name)[game - 1];
          const probability = engine.winProbability(strength, opponentStrength);
          probabilities.push(probability);
          series.games.push({
            game,
            won: matchRng() < probability,
            strength,
            opponentStrength,
            probability,
            recap: { duration: 0, moments: [] },
          });
          totalGames++;
        }
        tournament = engine.advanceTournament(tournament, series);
      }
      titles += Number(tournament.outcome === 'Campeão mundial');
      swissEliminations += Number(tournament.outcome === 'Eliminado no Suíço');
    }

    if (
      probabilities.some(
        (probability) =>
          probability < engine.BALANCE.minProbability ||
          probability > engine.BALANCE.maxProbability,
      ) ||
      modifiers.some(
        (modifier) =>
          modifier < engine.BALANCE.gamePlanLow || modifier > engine.BALANCE.gamePlanHigh,
      )
    )
      throw new Error(`Balance bounds failed for ${scenario.id}`);

    const result = {
      id: scenario.id,
      label: scenario.label,
      samples: samplesPerScenario,
      titleRate: titles / samplesPerScenario,
      swissEliminationRate: swissEliminations / samplesPerScenario,
      averageGames: totalGames / samplesPerScenario,
      strength: summary(strengths),
      planModifier: summary(modifiers),
      probability: summary(probabilities),
      compatibility,
    };
    results.push(result);
    console.log(
      JSON.stringify({
        plan: scenario.id,
        samples: samplesPerScenario,
        titleRate: result.titleRate,
        meanModifier: result.planModifier.mean,
      }),
    );
  }

  await mkdir('data/research/game-plans', { recursive: true });
  await writeFile(
    'data/research/game-plans/simulation.json',
    `${JSON.stringify(
      {
        version: 'game-plans-v1',
        datasetVersion: 'multi-era-v1.6.0',
        generatedAt: '2026-09-13',
        seedScheme: 'LCG32 with independent draft, pick, opponent and match streams',
        totalCampaigns: samplesPerScenario * scenarios.length,
        samplesPerScenario,
        historicalOpponentTeams: teams.length,
        balance: {
          gamePlanHigh: engine.BALANCE.gamePlanHigh,
          gamePlanMedium: engine.BALANCE.gamePlanMedium,
          gamePlanLow: engine.BALANCE.gamePlanLow,
          minProbability: engine.BALANCE.minProbability,
          maxProbability: engine.BALANCE.maxProbability,
        },
        method:
          'The five scenarios reuse identical per-index draft, choice, opponent and match seeds. Picks are uniform among each public three-player offer; opponents retain baseline strength.',
        results,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await server.close();
}
