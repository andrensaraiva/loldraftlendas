export const GAME_MODES = ['classic', 'almanac'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === 'string' && (GAME_MODES as readonly string[]).includes(value);
}

export function gameModeLabel(mode: GameMode): string {
  return mode === 'almanac' ? 'Almanaque' : 'Clássico';
}
