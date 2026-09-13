import type { Tag } from './types';

export const GAME_PLAN_IDS = ['aggression', 'teamfight', 'control_pick', 'scaling'] as const;
export type GamePlan = (typeof GAME_PLAN_IDS)[number];

export interface GamePlanDefinition {
  id: GamePlan;
  label: string;
  description: string;
  tags: readonly Tag[];
}

export const GAME_PLANS: readonly GamePlanDefinition[] = [
  {
    id: 'aggression',
    label: 'Agressão',
    description: 'Pressione cedo e force iniciações.',
    tags: ['EARLY_GAME', 'ENGAGE'],
  },
  {
    id: 'teamfight',
    label: 'Teamfight',
    description: 'Agrupe, absorva pressão e proteja seus carries.',
    tags: ['TEAMFIGHT', 'FRONTLINE', 'PEEL'],
  },
  {
    id: 'control_pick',
    label: 'Controle/Pick',
    description: 'Controle espaço e encontre alvos isolados.',
    tags: ['PICK', 'POKE', 'CONTROL'],
  },
  {
    id: 'scaling',
    label: 'Escala',
    description: 'Atravesse o início e potencialize seus carries.',
    tags: ['SCALING', 'CARRY', 'PEEL'],
  },
] as const;

export const GAME_PLAN_TAG_LABELS: Readonly<Partial<Record<Tag, string>>> = {
  EARLY_GAME: 'Início de jogo',
  ENGAGE: 'Engage',
  TEAMFIGHT: 'Teamfight',
  FRONTLINE: 'Linha de frente',
  PEEL: 'Proteção',
  PICK: 'Pick',
  POKE: 'Poke',
  CONTROL: 'Controle',
  SCALING: 'Escala',
  CARRY: 'Carry',
};

export function isGamePlan(value: unknown): value is GamePlan {
  return typeof value === 'string' && (GAME_PLAN_IDS as readonly string[]).includes(value);
}

export function gamePlanDefinition(plan: GamePlan): GamePlanDefinition {
  return GAME_PLANS.find((candidate) => candidate.id === plan)!;
}

export function gamePlanLabel(plan: GamePlan | null): string {
  return plan ? gamePlanDefinition(plan).label : 'Sem plano';
}
