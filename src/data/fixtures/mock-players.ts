import type { PlayerVersion, Role } from '../../game/types';
import { ROLES } from '../../game/types';
import portraits from '../portraits.json';

// Rosters are historical. Pools and ratings are deliberately synthetic balancing data.
const rosters: [number, string, string[]][] = [
  [2017, 'SKT', ['Huni', 'Peanut', 'Faker', 'Bang', 'Wolf']],
  [2017, 'SSG', ['CuVee', 'Ambition', 'Crown', 'Ruler', 'CoreJJ']],
  [2017, 'LZ', ['Khan', 'Cuzz', 'Bdd', 'PraY', 'GorillA']],
  [2020, 'DWG', ['Nuguri', 'Canyon', 'ShowMaker', 'Ghost', 'BeryL']],
  [2020, 'DRX', ['Doran', 'Pyosik', 'Chovy', 'Deft', 'Keria']],
  [2020, 'GEN', ['Rascal', 'Clid', 'Bdd', 'Ruler', 'Life']],
  [2023, 'T1', ['Zeus', 'Oner', 'Faker', 'Gumayusi', 'Keria']],
  [2023, 'GEN', ['Doran', 'Peanut', 'Chovy', 'Peyz', 'Delight']],
  [2023, 'KT', ['Kiin', 'Cuzz', 'Bdd', 'Aiming', 'Lehends']],
];
const pools: Record<Role, string[][]> = {
  TOP: [
    ['Jayce', 'Kennen', 'Gnar', 'Renekton', 'Camille'],
    ['Renekton', 'Gnar', 'Kennen', 'Camille', 'Fiora'],
    ['Gnar', 'Renekton', 'Jayce', 'Fiora', 'Kennen'],
  ],
  JUNGLE: [
    ['LeeSin', 'Elise', 'Graves', 'Gragas', 'Sejuani'],
    ['Sejuani', 'JarvanIV', 'Gragas', 'LeeSin', 'Nidalee'],
    ['Gragas', 'Sejuani', 'LeeSin', 'Nidalee', 'Graves'],
  ],
  MID: [
    ['Galio', 'Orianna', 'Ryze', 'Taliyah', 'Cassiopeia'],
    ['Malzahar', 'Orianna', 'Syndra', 'Taliyah', 'Ryze'],
    ['Taliyah', 'Syndra', 'Orianna', 'Azir', 'Ryze'],
  ],
  ADC: [
    ['Varus', 'Ashe', 'Ezreal', 'Xayah', 'Tristana'],
    ['Xayah', 'Varus', 'Ashe', 'Kalista', 'Tristana'],
    ['Ashe', 'Varus', 'Caitlyn', 'Ezreal', 'Xayah'],
  ],
  SUPPORT: [
    ['Rakan', 'Alistar', 'Lulu', 'Braum', 'Thresh'],
    ['Lulu', 'Rakan', 'Alistar', 'Thresh', 'Braum'],
    ['Thresh', 'Lulu', 'Braum', 'Rakan', 'Alistar'],
  ],
};
const modern: Partial<Record<Role, string[][]>> = {
  TOP: [
    ['Aatrox', 'Jayce', 'Gnar', 'Camille', 'Kennen'],
    ['Renekton', 'Ornn', 'Gnar', 'Aatrox', 'Camille'],
    ['Gnar', 'Renekton', 'Jayce', 'Ornn', 'Aatrox'],
  ],
  ADC: [
    ['Caitlyn', 'Varus', 'Xayah', 'Jinx', 'Kaisa'],
    ['Xayah', 'Ashe', 'Kalista', 'Kaisa', 'Ezreal'],
    ['Kaisa', 'Xayah', 'Ezreal', 'Jinx', 'Caitlyn'],
  ],
  SUPPORT: [
    ['Rakan', 'Nautilus', 'Bard', 'TahmKench', 'Thresh'],
    ['Nautilus', 'Braum', 'Rakan', 'Alistar', 'Leona'],
    ['Leona', 'Thresh', 'Braum', 'Rakan', 'Bard'],
  ],
};
const curves = [
  [99, 95, 89, 87, 85],
  [94, 94, 95, 93, 94],
  [89, 91, 94, 98, 99],
];
const profiles = ['Explosivo no G1', 'Pool consistente', 'Decisivo no G5'];
export const players: PlayerVersion[] = rosters.flatMap(([worldsYear, team, names], teamIndex) =>
  names.map((playerName, roleIndex) => {
    const role = ROLES[roleIndex];
    const variant = (teamIndex + roleIndex) % 3;
    let pool = (worldsYear >= 2020 && modern[role] ? modern[role]! : pools[role])[variant];
    if (playerName === 'Faker' && worldsYear === 2017) pool = pools.MID[0];
    if (playerName === 'Canyon') pool = ['Nidalee', 'Graves', 'LeeSin', 'JarvanIV', 'Gragas'];
    if (role === 'MID' && worldsYear === 2023)
      pool = [
        ['Orianna', 'Azir', 'Sylas', 'Ahri', 'Ryze'],
        ['Azir', 'Orianna', 'Ahri', 'Sylas', 'Syndra'],
        ['Syndra', 'Taliyah', 'Orianna', 'Azir', 'Ahri'],
      ][variant];
    return {
      id: `${playerName.toLowerCase()}-${worldsYear}-${team.toLowerCase()}`,
      playerName,
      team,
      region: 'LCK',
      worldsYear,
      role,
      image: (portraits as Record<string, string>)[playerName],
      profile: profiles[variant],
      championPool: pool.map((championId, i) => ({
        game: i + 1,
        championId,
        rating: curves[variant][i] - (teamIndex % 2),
        source: 'MOCK' as const,
      })),
    };
  }),
);
