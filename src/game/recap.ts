import type { MatchMoment, MatchRecap, PlayerKda, Team } from './types';

// Presentation only: the outcome is already decided by the rating model.
// Every kill creates exactly one opposing death. Assists exclude the killer.
export function createRecap(
  team: Team,
  opponent: Team,
  game: number,
  won: boolean,
  rng: () => number,
): MatchRecap {
  const user = team.map((p) => ({ playerId: p.id, kills: 0, deaths: 0, assists: 0 }));
  const enemy = opponent.map((p) => ({ playerId: p.id, kills: 0, deaths: 0, assists: 0 }));
  const duration = 26 + Math.floor(rng() * 12);
  const moments: MatchMoment[] = [];
  const weightedPlayer = (players: Team, supportWeight: number) => {
    const weights = players.map(
      (p) =>
        (p.role === 'SUPPORT' ? supportWeight : p.role === 'ADC' || p.role === 'MID' ? 1.4 : 1) *
        p.championPool[game - 1].rating,
    );
    let roll = rng() * weights.reduce((a, b) => a + b, 0);
    return weights.findIndex((weight, i) => (roll -= weight) < 0 || i === weights.length - 1);
  };
  const addKills = (side: 'user' | 'opponent', count: number) => {
    const allies = side === 'user' ? user : enemy;
    const foes = side === 'user' ? enemy : user;
    const players = side === 'user' ? team : opponent;
    const opponents = side === 'user' ? opponent : team;
    let lastKiller = 0;
    for (let n = 0; n < count; n++) {
      const killer = weightedPlayer(players, 0.3);
      const victim = weightedPlayer(opponents, 1.15);
      allies[killer].kills++;
      foes[victim].deaths++;
      allies.forEach((p, i) => {
        if (i !== killer && rng() < (players[i].role === 'SUPPORT' ? 0.88 : 0.55)) p.assists++;
      });
      lastKiller = killer;
    }
    return players[lastKiller].playerName;
  };
  const copy = (stats: PlayerKda[]) => stats.map((p) => ({ ...p }));
  const headlines = [
    'Primeiro sangue',
    'Pressão no rio',
    'Briga pelo dragão',
    'Luta no meio',
    'Disputa pelo Barão',
    'A base está aberta',
    'Nexus destruído',
  ];
  const minutes = [3, 8, 13, 18, Math.max(21, duration - 8), duration - 3, duration];
  headlines.forEach((title, i) => {
    const side: 'user' | 'opponent' =
      i === headlines.length - 1
        ? won
          ? 'user'
          : 'opponent'
        : rng() < (won ? 0.62 : 0.38)
          ? 'user'
          : 'opponent';
    const kills = i === 0 ? 1 : 2 + Math.floor(rng() * 4);
    const killer = addKills(side, kills);
    const trades = i === 0 ? 0 : Math.floor(rng() * 3);
    if (trades) addKills(side === 'user' ? 'opponent' : 'user', trades);
    const name = side === 'user' ? 'Suas lendas' : 'Os adversários';
    const description =
      i === 0
        ? `${killer} encontra a primeira eliminação e abre o placar.`
        : i === 6
          ? `${name} vencem a última luta por ${kills} a ${trades} e destroem o Nexus.`
          : `${name} levam a troca por ${kills} a ${trades}. ${killer} participa da jogada que abre espaço ${i === 2 ? 'na região do dragão' : i === 4 ? 'na região do Barão' : i === 5 ? 'dentro da base' : 'no mapa'}.`;
    moments.push({
      minute: minutes[i],
      title,
      description,
      side,
      user: copy(user),
      opponent: copy(enemy),
    });
  });
  return { duration, moments };
}
