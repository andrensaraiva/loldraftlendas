import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { players } = await server.ssrLoadModule('/src/data/frozen-2017.ts');
  const { champions } = await server.ssrLoadModule('/src/data/champions.ts');
  const { ROLES } = await server.ssrLoadModule('/src/game/types.ts');
  const engine = await server.ssrLoadModule('/src/game/engine.ts');
  // Freeze the original RNG consumption too: year + region, no subset draw for three players.
  const frozenDraft = (rng) => ROLES.map(role => {
    const available = players.filter(p => p.role === role);
    const years = [...new Set(available.map(p => p.worldsYear))];
    const year = years[Math.min(years.length - 1, Math.floor(rng() * years.length))];
    const regions = [...new Set(available.filter(p => p.worldsYear === year).map(p => p.region))];
    const region = regions[Math.min(regions.length - 1, Math.floor(rng() * regions.length))];
    return { role, year, region, options: available.filter(p => p.worldsYear === year && p.region === region) };
  });
  engine.validateData(players, champions);
  const mean = (a) => a.reduce((s, n) => s + n, 0) / a.length;
  const sd = (a) => Math.sqrt(mean(a.map((n) => (n - mean(a)) ** 2)));
  const byRole = Object.fromEntries(
    ROLES.map((role) => [role, players.filter((p) => p.role === role)]),
  );
  const comparisons = players.map((p) => {
    const ratings = p.championPool.map((c) => c.rating);
    return {
      playerId: p.id,
      player: p.playerName,
      role: p.role,
      g1: ratings[0],
      bo3: mean(ratings.slice(0, 3)),
      bo5: mean(ratings),
      sd: sd(ratings),
      strongest: p.championPool
        .filter((s) => s.rating === Math.max(...ratings))
        .map((s) => s.championId),
      weakest: p.championPool
        .filter((s) => s.rating === Math.min(...ratings))
        .map((s) => s.championId),
    };
  });
  const dominance = comparisons.map((p) => ({
    playerId: p.playerId,
    dominates: comparisons
      .filter(
        (q) =>
          p.role === q.role &&
          p.playerId !== q.playerId &&
          ['g1', 'bo3', 'bo5'].every((k) => p[k] >= q[k]) &&
          ['g1', 'bo3', 'bo5'].some((k) => p[k] > q[k]),
      )
      .map((q) => q.playerId),
  }));
  const combinations = (roles) =>
    roles.reduce((teams, role) => teams.flatMap((t) => byRole[role].map((p) => [...t, p])), [[]]);
  const contexts = [];
  for (const role of ROLES) {
    const others = combinations(ROLES.filter((r) => r !== role));
    for (const p of byRole[role]) {
      const wins = { g1: 0, bo3: 0, bo5: 0 },
        ties = { g1: 0, bo3: 0, bo5: 0 };
      for (const rest of others) {
        const values = byRole[role].map((option) => {
          const forces = [1, 2, 3, 4, 5].map(
            (g) => engine.teamStrength([...rest, option], g, champions).total,
          );
          return {
            playerId: option.id,
            g1: forces[0],
            bo3: mean(forces.slice(0, 3)),
            bo5: mean(forces),
          };
        });
        const v = values.find((v) => v.playerId === p.id);
        for (const k of Object.keys(wins)) {
          const competitors = values.filter((x) => x !== v);
          if (competitors.every((x) => v[k] > x[k] + 1e-9)) wins[k]++;
          else if (competitors.every((x) => v[k] >= x[k] - 1e-9)) ties[k]++;
        }
      }
      contexts.push({ playerId: p.id, contexts: others.length, strictBest: wins, tiedBest: ties });
    }
  }
  const seed = 201718;
  let state = seed;
  const rng = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  const runs = 10000,
    selections = {},
    options = {},
    titles = {},
    outcomes = {};
  let titlesTotal = 0,
    seriesTotal = 0,
    gamesTotal = 0,
    playedForce = 0;
  const strengthSums = [0, 0, 0, 0, 0];
  for (let run = 0; run < runs; run++) {
    const rounds = frozenDraft(rng);
    const team = rounds.map((r) => {
      r.options.forEach((p) => (options[p.id] = (options[p.id] || 0) + 1));
      const p = r.options[Math.floor(rng() * r.options.length)];
      selections[p.id] = (selections[p.id] || 0) + 1;
      return p;
    });
    for (let g = 1; g <= 5; g++)
      strengthSums[g - 1] += engine.teamStrength(team, g, champions).total;
    let tournament = engine.newTournament();
    while (!tournament.outcome) {
      let series = engine.createSeries(tournament, players, rng);
      while (!engine.seriesDone(series)) {
        const game = engine.simulateGame(series, team, champions, rng);
        series = { ...series, games: [...series.games, game] };
        gamesTotal++;
        playedForce += game.strength;
      }
      seriesTotal++;
      tournament = engine.advanceTournament(tournament, series);
    }
    outcomes[tournament.outcome] = (outcomes[tournament.outcome] || 0) + 1;
    if (tournament.outcome === 'Campeão mundial') {
      titlesTotal++;
      team.forEach((p) => (titles[p.id] = (titles[p.id] || 0) + 1));
    }
  }
  const averageByGame = strengthSums.map((n) => n / runs);
  const report = {
    seed,
    runs,
    balance: engine.BALANCE,
    policy:
      'Uniform independent selection from the three options per role; complete production simulation including recap RNG.',
    comparisons,
    dominance,
    compositionContexts: contexts,
    averageByGame,
    averageG1: averageByGame[0],
    averageBO3: mean(averageByGame.slice(0, 3)),
    averageBO5: mean(averageByGame),
    averageActuallyPlayed: playedForce / gamesTotal,
    championshipRate: titlesTotal / runs,
    binomial95HalfWidth: 1.96 * Math.sqrt(((titlesTotal / runs) * (1 - titlesTotal / runs)) / runs),
    outcomes,
    seriesTotal,
    gamesTotal,
    players: players.map((p) => ({
      playerId: p.id,
      offered: options[p.id],
      selected: selections[p.id],
      appearanceRate: selections[p.id] / runs,
      championshipsWhenSelected: titles[p.id] || 0,
      conditionalTitleRate: (titles[p.id] || 0) / selections[p.id],
    })),
  };
  await writeFile(
    'data/research/worlds-2017/simulation.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(
    JSON.stringify({
      runs,
      gamesTotal,
      championshipRate: report.championshipRate,
      averageByGame,
      dominance,
    }),
  );
} finally {
  await server.close();
}
