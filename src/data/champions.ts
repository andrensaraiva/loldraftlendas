import type { Champion, Tag } from '../game/types';
import historicalAssets from './historical-assets.json';
import multiAssetsData from './multi-era-assets.json';
import additional from './additional-champions.json';
const multiAssets = multiAssetsData as Record<string, NonNullable<Champion['historicalAssets']>>;
const definitions: [string, string, Tag[]][] = [
  ['Aatrox', 'Aatrox', ['TEAMFIGHT', 'AD_DAMAGE', 'FRONTLINE', 'CARRY']],
  ['Renekton', 'Renekton', ['EARLY_GAME', 'AD_DAMAGE', 'FRONTLINE', 'ENGAGE']],
  ['Gnar', 'Gnar', ['ENGAGE', 'TEAMFIGHT', 'AD_DAMAGE', 'FRONTLINE']],
  ['Jayce', 'Jayce', ['POKE', 'EARLY_GAME', 'AD_DAMAGE', 'SPLIT_PUSH']],
  ['Kennen', 'Kennen', ['TEAMFIGHT', 'ENGAGE', 'AP_DAMAGE', 'MOBILITY']],
  ['Camille', 'Camille', ['PICK', 'SPLIT_PUSH', 'AD_DAMAGE', 'MOBILITY']],
  ['Fiora', 'Fiora', ['SCALING', 'SPLIT_PUSH', 'AD_DAMAGE', 'CARRY']],
  ['Ornn', 'Ornn', ['ENGAGE', 'FRONTLINE', 'SCALING', 'TEAMFIGHT']],
  ['LeeSin', 'Lee Sin', ['EARLY_GAME', 'MOBILITY', 'AD_DAMAGE', 'PICK']],
  ['Nidalee', 'Nidalee', ['POKE', 'EARLY_GAME', 'AP_DAMAGE', 'MOBILITY']],
  ['Sejuani', 'Sejuani', ['ENGAGE', 'FRONTLINE', 'CONTROL', 'TEAMFIGHT']],
  ['JarvanIV', 'Jarvan IV', ['ENGAGE', 'AD_DAMAGE', 'FRONTLINE', 'TEAMFIGHT']],
  ['Graves', 'Graves', ['SCALING', 'AD_DAMAGE', 'CARRY']],
  ['Elise', 'Elise', ['EARLY_GAME', 'AP_DAMAGE', 'PICK']],
  ['Gragas', 'Gragas', ['ENGAGE', 'AP_DAMAGE', 'FRONTLINE', 'PEEL']],
  ['Viego', 'Viego', ['CARRY', 'AD_DAMAGE', 'MOBILITY', 'TEAMFIGHT']],
  ['Galio', 'Galio', ['TEAMFIGHT', 'ENGAGE', 'AP_DAMAGE', 'FRONTLINE']],
  ['Orianna', 'Orianna', ['TEAMFIGHT', 'CONTROL', 'AP_DAMAGE', 'SCALING']],
  ['Ryze', 'Ryze', ['SCALING', 'AP_DAMAGE', 'SPLIT_PUSH', 'CONTROL']],
  ['Taliyah', 'Taliyah', ['CONTROL', 'AP_DAMAGE', 'PICK']],
  ['Cassiopeia', 'Cassiopeia', ['SCALING', 'AP_DAMAGE', 'CARRY', 'CONTROL']],
  ['Azir', 'Azir', ['SCALING', 'AP_DAMAGE', 'CARRY', 'TEAMFIGHT']],
  ['Syndra', 'Syndra', ['AP_DAMAGE', 'PICK', 'CONTROL']],
  ['Ahri', 'Ahri', ['AP_DAMAGE', 'PICK', 'MOBILITY']],
  ['Sylas', 'Sylas', ['AP_DAMAGE', 'MOBILITY', 'TEAMFIGHT']],
  ['Malzahar', 'Malzahar', ['AP_DAMAGE', 'CONTROL', 'PICK']],
  ['Xayah', 'Xayah', ['AD_DAMAGE', 'CARRY', 'SCALING', 'TEAMFIGHT']],
  ['Kaisa', 'Kai’Sa', ['AD_DAMAGE', 'CARRY', 'MOBILITY', 'SCALING']],
  ['Ashe', 'Ashe', ['AD_DAMAGE', 'ENGAGE', 'PICK']],
  ['Varus', 'Varus', ['AD_DAMAGE', 'POKE', 'CONTROL']],
  ['Ezreal', 'Ezreal', ['AD_DAMAGE', 'POKE', 'MOBILITY']],
  ['Caitlyn', 'Caitlyn', ['AD_DAMAGE', 'EARLY_GAME', 'POKE']],
  ['Jinx', 'Jinx', ['AD_DAMAGE', 'SCALING', 'CARRY', 'TEAMFIGHT']],
  ['Kalista', 'Kalista', ['AD_DAMAGE', 'EARLY_GAME', 'MOBILITY']],
  ['Tristana', 'Tristana', ['AD_DAMAGE', 'SCALING', 'MOBILITY', 'CARRY']],
  ['Rakan', 'Rakan', ['ENGAGE', 'TEAMFIGHT', 'MOBILITY', 'PEEL']],
  ['Thresh', 'Thresh', ['PICK', 'PEEL', 'ENGAGE', 'CONTROL']],
  ['Lulu', 'Lulu', ['PEEL', 'SCALING']],
  ['Nautilus', 'Nautilus', ['ENGAGE', 'FRONTLINE', 'CONTROL']],
  ['Braum', 'Braum', ['PEEL', 'FRONTLINE', 'TEAMFIGHT']],
  ['Alistar', 'Alistar', ['ENGAGE', 'FRONTLINE', 'PEEL']],
  ['Leona', 'Leona', ['ENGAGE', 'FRONTLINE', 'CONTROL']],
  ['Bard', 'Bard', ['PICK', 'MOBILITY', 'CONTROL']],
  ['TahmKench', 'Tahm Kench', ['PEEL', 'FRONTLINE']],
  ['Chogath', "Cho'Gath", ['FRONTLINE', 'CONTROL', 'AP_DAMAGE', 'SCALING']],
  ['Maokai', 'Maokai', ['ENGAGE', 'FRONTLINE', 'PEEL', 'CONTROL']],
  ['Trundle', 'Trundle', ['AD_DAMAGE', 'FRONTLINE', 'SPLIT_PUSH', 'PEEL']],
  ['Khazix', "Kha'Zix", ['AD_DAMAGE', 'PICK', 'MOBILITY', 'CARRY']],
  ['RekSai', "Rek'Sai", ['AD_DAMAGE', 'EARLY_GAME', 'ENGAGE', 'MOBILITY']],
  ['Fizz', 'Fizz', ['AP_DAMAGE', 'PICK', 'MOBILITY']],
  ['KogMaw', "Kog'Maw", ['AD_DAMAGE', 'SCALING', 'CARRY']],
  ['Twitch', 'Twitch', ['AD_DAMAGE', 'SCALING', 'CARRY', 'TEAMFIGHT']],
  ['Janna', 'Janna', ['PEEL', 'CONTROL']],
  ['Taric', 'Taric', ['PEEL', 'FRONTLINE', 'TEAMFIGHT']],
  ['Shen', 'Shen', ['FRONTLINE', 'PEEL', 'ENGAGE', 'SPLIT_PUSH']],
  ['Nasus', 'Nasus', ['AD_DAMAGE', 'SCALING', 'SPLIT_PUSH', 'FRONTLINE']],
  ['Jax', 'Jax', ['AD_DAMAGE', 'SCALING', 'SPLIT_PUSH', 'CARRY']],
  ['Karma', 'Karma', ['AP_DAMAGE', 'POKE', 'PEEL']],
];
const historicalOnly = new Set([
  'Chogath',
  'Maokai',
  'Trundle',
  'Khazix',
  'RekSai',
  'Fizz',
  'KogMaw',
  'Twitch',
  'Janna',
  'Taric',
  'Shen',
  'Nasus',
  'Jax',
  'Karma',
]);
export const champions: Record<string, Champion> = Object.fromEntries(
  [
    ...definitions,
    ...Object.values(additional).map((c) => [c.id, c.name, c.tags] as [string, string, Tag[]]),
  ].map(([id, name, tags]) => [
    id,
    {
      id,
      name,
      tags,
      // New historical entries have a historical fallback; existing era assets remain available.
      image: historicalOnly.has(id)
        ? `/assets/2017/champions/${id}.png`
        : `/assets/champions/${id}.png`,
      splash: historicalOnly.has(id) ? `/assets/2017/splash/${id}.jpg` : `/assets/splash/${id}.jpg`,
      ...(id in multiAssets
        ? {
            historicalAssets: {
              ...(id in historicalAssets
                ? { '2017': historicalAssets[id as keyof typeof historicalAssets] }
                : {}),
              ...multiAssets[id],
            },
          }
        : id in historicalAssets
          ? { historicalAssets: { '2017': historicalAssets[id as keyof typeof historicalAssets] } }
          : {}),
    },
  ]),
);
