import type { Champion } from '../game/types';

export function championArt(champion: Champion, year: number) {
  const historical = champion.historicalAssets?.[String(year)];
  return historical
    ? { image: historical.square, splash: historical.splash }
    : { image: champion.image, splash: champion.splash };
}
