import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { players } = await server.ssrLoadModule('/src/data/players.ts');
  const { champions } = await server.ssrLoadModule('/src/data/champions.ts');
  const E = await server.ssrLoadModule('/src/game/engine.ts');
  const D = await server.ssrLoadModule('/src/game/draft.ts');
  const { ROLES } = await server.ssrLoadModule('/src/game/types.ts');
  E.validateData(players, champions);
  const rngFor = (seed) => () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const summary = (xs) => {
    const sorted = [...xs].sort((a, b) => a - b),
      average = mean(xs);
    return {
      mean: average,
      sd: Math.sqrt(mean(xs.map((x) => (x - average) ** 2))),
      min: sorted[0],
      p10: sorted[Math.floor(xs.length * 0.1)],
      median: sorted[Math.floor(xs.length * 0.5)],
      p90: sorted[Math.floor(xs.length * 0.9)],
      max: sorted.at(-1),
    };
  };
  const increment = (obj, key, n = 1) => {
    obj[key] = (obj[key] ?? 0) + n;
  };
  const pools = D.eligiblePools(players);
  const ratings = new Map(
    players.map((p) => [
      p.id,
      {
        g1: p.championPool[0].rating,
        bo3: mean(p.championPool.slice(0, 3).map((s) => s.rating)),
        bo5: mean(p.championPool.map((s) => s.rating)),
      },
    ]),
  );
  const templates = [...new Set(players.map((p) => `${p.team} ${p.worldsYear}`))]
    .map((name) => ({ name, team: players.filter((p) => `${p.team} ${p.worldsYear}` === name) }))
    .filter((t) => t.team.length === 5);
  const opponentStrength = new Map(
    templates.map((t) => [
      t.name,
      [1, 2, 3, 4, 5].map((g) => E.teamStrength(t.team, g, champions).total),
    ]),
  );
  const best = (options, horizon, rng) => {
    const max = Math.max(...options.map((p) => ratings.get(p.id)[horizon]));
    const ties = options.filter((p) => ratings.get(p.id)[horizon] === max);
    return ties[Math.floor(rng() * ties.length)];
  };
  const partialValue = (p, team) =>
    mean(
      [1, 2, 3, 4, 5].map(
        (g) =>
          (0.8 *
            (team.reduce((s, x) => s + x.championPool[g - 1].rating, 0) +
              p.championPool[g - 1].rating +
              (4 - team.length) * 84.5)) /
            5 +
          0.2 * E.compositionScore([...team, p], g, champions),
      ),
    );
  const choose = (options, policy, team, rng) => {
    if (policy === 'random') return options[Math.floor(rng() * options.length)];
    if (policy === 'composition') {
      const values = options.map((p) => partialValue(p, team));
      const max = Math.max(...values);
      const ties = options.filter((_, i) => values[i] === max);
      return ties[Math.floor(rng() * ties.length)];
    }
    return best(options, policy === 'g1' ? 'g1' : policy === 'bo3' ? 'bo3' : 'bo5', rng);
  };
  // Public offer-space expectations, not knowledge of the next sampled roll.
  const expectedCache = new Map();
  function expectedExchange(round, kind) {
    const key = `${D.offerKey(round)}/${kind}`;
    if (!expectedCache.has(key)) {
      const alternatives = D.exchangeAlternatives(round, pools, kind);
      const destinations = [...new Set(alternatives.map((r) => `${r.year}/${r.region}`))];
      expectedCache.set(
        key,
        destinations.length
          ? mean(
              destinations.map((d) =>
                mean(
                  alternatives
                    .filter((r) => `${r.year}/${r.region}` === d)
                    .map((r) => Math.max(...r.options.map((p) => ratings.get(p.id).bo5))),
                ),
              ),
            )
          : -Infinity,
      );
    }
    return expectedCache.get(key);
  }
  const n = Number(process.env.DRAFT_SAMPLES ?? 10000);
  const threshold = Number(process.env.EXCHANGE_GAIN_THRESHOLD ?? 1.5);
  const policies = [
    ...['random', 'g1', 'bo3', 'bo5', 'composition', 'reroll'].map((policy) => ({
      policy,
      budget: 3,
    })),
    ...[0, 1, 2, 5].map((budget) => ({ policy: 'reroll', budget })),
  ];
  const results = [];
  for (const { policy, budget } of policies) {
    const forces = { g1: [], bo3: [], bo5: [] },
      compositions = [],
      roles = {},
      pickCounts = {},
      offeredCounts = {},
      yearPicks = {},
      regionPicks = {},
      rejectYears = {},
      rejectRegions = {},
      rejectPlayers = {},
      exchangesByKind = {};
    let titles = 0,
      swissEliminations = 0,
      exchanges = 0;
    const eraCounts = [],
      regionCounts = [];
    for (let i = 0; i < n; i++) {
      // Common independent streams per draft index across all policy/budget runs.
      const rollRng = rngFor(7919 + i * 104729),
        pickRng = rngFor(12497 + i * 65537),
        exchangeRng = rngFor(17191 + i * 32771),
        matchRng = rngFor(23603 + i * 8191);
      const rounds = D.createDraft(players, rollRng);
      const team = [];
      let remaining = budget;
      for (let r of rounds) {
        let rejected = [];
        if (policy === 'reroll')
          while (remaining > 0) {
            const current = Math.max(...r.options.map((p) => ratings.get(p.id).bo5));
            const ranked = ['year', 'region', 'players']
              .map((kind) => ({ kind, value: expectedExchange(r, kind) }))
              .sort((a, b) => b.value - a.value);
            if (ranked[0].value - current < threshold) break;
            const next = D.exchangeRound(
              r,
              pools,
              ranked[0].kind,
              remaining,
              rejected,
              exchangeRng,
            );
            if (!next.changed) break;
            increment(rejectYears, r.year);
            increment(rejectRegions, r.region);
            r.options.forEach((p) => increment(rejectPlayers, p.id));
            increment(exchangesByKind, ranked[0].kind);
            r = next.round;
            remaining = next.remaining;
            rejected = next.rejected;
            exchanges++;
          }
        r.options.forEach((p) => increment(offeredCounts, p.id));
        const p = choose(r.options, policy, team, pickRng);
        team.push(p);
        increment(pickCounts, p.id);
        increment(yearPicks, p.worldsYear);
        increment(regionPicks, p.region);
        (roles[p.role] ??= []).push(ratings.get(p.id).bo5);
      }
      const strength = [1, 2, 3, 4, 5].map((g) => E.teamStrength(team, g, champions));
      forces.g1.push(strength[0].total);
      forces.bo3.push(mean(strength.slice(0, 3).map((s) => s.total)));
      forces.bo5.push(mean(strength.map((s) => s.total)));
      compositions.push(mean(strength.map((s) => s.composition)));
      eraCounts.push(new Set(team.map((p) => p.worldsYear)).size);
      regionCounts.push(new Set(team.map((p) => p.region)).size);
      let tournament = E.newTournament();
      while (!tournament.outcome) {
        const unplayed = templates.filter(
          (t) => !tournament.history.some((s) => s.opponentName === t.name),
        );
        const choices = unplayed.length ? unplayed : templates;
        const opponent = choices[Math.floor(matchRng() * choices.length)];
        const series = {
          stage: tournament.stage,
          opponentName: opponent.name,
          opponent: opponent.team,
          bestOf: E.formatFor(tournament),
          games: [],
        };
        while (!E.seriesDone(series)) {
          const game = series.games.length + 1;
          const force = strength[game - 1].total;
          const opp = opponentStrength.get(opponent.name)[game - 1];
          const probability = E.winProbability(force, opp);
          // Match-report narration is omitted; authoritative probability, series and tournament functions are reused.
          series.games.push({
            game,
            won: matchRng() < probability,
            strength: force,
            opponentStrength: opp,
            probability,
            recap: { duration: 0, moments: [] },
          });
        }
        tournament = E.advanceTournament(tournament, series);
      }
      titles += Number(tournament.outcome === 'Campeão mundial');
      swissEliminations += Number(tournament.outcome === 'Eliminado no Suíço');
    }
    const result = {
      policy,
      budget,
      samples: n,
      titleRate: titles / n,
      swissEliminationRate: swissEliminations / n,
      averageExchanges: exchanges / n,
      force: Object.fromEntries(Object.entries(forces).map(([k, v]) => [k, summary(v)])),
      composition: summary(compositions),
      roleRatings: Object.fromEntries(Object.entries(roles).map(([k, v]) => [k, summary(v)])),
      averageEras: mean(eraCounts),
      averageRegions: mean(regionCounts),
      exchangesByKind,
      rejectYears,
      rejectRegions,
      rejectPlayers,
      pickCounts,
      offeredCounts,
      yearPicks,
      regionPicks,
    };
    results.push(result);
    console.log(
      JSON.stringify({
        policy,
        budget,
        n,
        titleRate: result.titleRate,
        force: result.force.bo5.mean,
        exchanges: result.averageExchanges,
      }),
    );
  }
  const varietySamples = 10000,
    sequences = new Set(),
    offers = new Set(),
    finalTeams = new Set(),
    counts = {},
    distinctYears = [],
    distinctRegions = [];
  let repeatedOffers = 0;
  for (let i = 0; i < varietySamples; i++) {
    const rng = rngFor(13579 + i * 101);
    const rounds = D.createDraft(players, rng);
    const team = rounds.map((r) => r.options[Math.floor(rng() * 3)]);
    sequences.add(rounds.map((r) => `${r.year}/${r.region}`).join('|'));
    finalTeams.add(team.map((p) => p.id).join('|'));
    for (const r of rounds) {
      const key = D.offerKey(r);
      if (offers.has(key)) repeatedOffers++;
      offers.add(key);
    }
    team.forEach((p) => increment(counts, p.id));
    distinctYears.push(new Set(team.map((p) => p.worldsYear)).size);
    distinctRegions.push(new Set(team.map((p) => p.region)).size);
  }
  const comparisons = players.map((p) => ({
    id: p.id,
    player: p.playerName,
    year: p.worldsYear,
    region: p.region,
    role: p.role,
    ...ratings.get(p.id),
  }));
  const dominates = (p, q) =>
    ['g1', 'bo3', 'bo5'].every((k) => p[k] >= q[k]) &&
    ['g1', 'bo3', 'bo5'].some((k) => p[k] > q[k]);
  const dominance = comparisons.map((p) => ({
    id: p.id,
    withinPool: comparisons
      .filter(
        (q) => q.role === p.role && q.year === p.year && q.region === p.region && dominates(p, q),
      )
      .map((q) => q.id),
    crossEra: comparisons.filter((q) => q.role === p.role && q.year !== p.year && dominates(p, q))
      .length,
  }));
  const strata = {};
  for (const key of ['year', 'region', 'role'])
    strata[key] = Object.fromEntries(
      [...new Set(comparisons.map((p) => p[key]))].map((value) => [
        value,
        Object.fromEntries(
          ['g1', 'bo3', 'bo5'].map((h) => [
            h,
            summary(comparisons.filter((p) => p[key] === value).map((p) => p[h])),
          ]),
        ),
      ]),
    );
  const ratingDistribution = {};
  players.forEach((p) => p.championPool.forEach((s) => increment(ratingDistribution, s.rating)));
  await writeFile(
    'data/research/multi-era/simulation.json',
    JSON.stringify(
      {
        version: 'multi-era-balance-v1',
        seedScheme: 'LCG32 independent per-index roll/pick/exchange/match streams; see script',
        totalDrafts: n * policies.length,
        exchangeGainThreshold: threshold,
        engine: E.BALANCE,
        results,
        variety: {
          samples: varietySamples,
          uniqueYearRegionSequences: sequences.size,
          uniqueOffers: offers.size,
          repeatedOffers,
          totalOffers: varietySamples * 5,
          uniqueFinalTeams: finalTeams.size,
          playerVersionCounts: counts,
          distinctYears: summary(distinctYears),
          distinctRegions: summary(distinctRegions),
        },
        comparisons,
        dominance,
        strata,
        ratingDistribution,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await server.close();
}
