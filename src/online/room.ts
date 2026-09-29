import type { GameData } from '../data/repository';
import { DUEL_SAVE_VERSION, simulateDuel } from '../game/duel';
import type { DuelResult, DuelState } from '../game/duel';
import { playerIsInDraftRegion } from '../game/regions';
import { CAMPAIGN_RANDOM_VERSION, isCampaignSeed } from '../game/random';
import { isGamePlan } from '../game/plan';
import type { GamePlan } from '../game/plan';
import { ROLES } from '../game/types';
import type { DraftRound, PlayerVersion } from '../game/types';

export interface OnlineDuelOffer {
  role: string;
  year: number;
  regionGroup: string;
  optionIds: string[];
}

export interface OnlineDuelRoom {
  code: string;
  seed: string;
  datasetVersion: string;
  offers: OnlineDuelOffer[];
  seat: 'host' | 'guest';
  state: 'waiting_guest' | 'drafting' | 'complete' | 'cancelled' | 'expired';
  expiresAt: string;
  hostReady: boolean;
  guestReady: boolean;
  myPicks: string[] | null;
  myPlan: GamePlan | null;
  hostPicks: string[] | null;
  guestPicks: string[] | null;
  hostPlan: GamePlan | null;
  guestPlan: GamePlan | null;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Estado da sala inválido.');
  return value as Record<string, unknown>;
}

function picks(value: unknown): string[] | null {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length !== 5 || !value.every((id) => typeof id === 'string'))
    throw new Error('Equipe da sala inválida.');
  return value;
}

function plan(value: unknown): GamePlan | null {
  if (value === null) return null;
  if (!isGamePlan(value)) throw new Error('Plano da sala inválido.');
  return value;
}

export function parseOnlineDuelRoom(value: unknown): OnlineDuelRoom {
  const room = object(value);
  if (
    typeof room.code !== 'string' ||
    !/^[0-9A-F]{12}$/.test(room.code) ||
    !isCampaignSeed(room.seed) ||
    typeof room.datasetVersion !== 'string' ||
    !Array.isArray(room.offers) ||
    room.offers.length !== 5 ||
    (room.seat !== 'host' && room.seat !== 'guest') ||
    !['waiting_guest', 'drafting', 'complete', 'cancelled', 'expired'].includes(
      String(room.state),
    ) ||
    typeof room.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(room.expiresAt)) ||
    typeof room.hostReady !== 'boolean' ||
    typeof room.guestReady !== 'boolean'
  )
    throw new Error('Estado da sala inválido.');

  const offers = room.offers.map((rawOffer, index) => {
    const offer = object(rawOffer);
    if (
      offer.role !== ROLES[index] ||
      !Number.isInteger(offer.year) ||
      typeof offer.regionGroup !== 'string' ||
      !Array.isArray(offer.optionIds) ||
      offer.optionIds.length !== 3 ||
      !offer.optionIds.every((id) => typeof id === 'string') ||
      new Set(offer.optionIds).size !== 3
    )
      throw new Error('Ofertas da sala inválidas.');
    return offer as unknown as OnlineDuelOffer;
  });

  const hostPicks = picks(room.hostPicks);
  const guestPicks = picks(room.guestPicks);
  const hostPlan = plan(room.hostPlan);
  const guestPlan = plan(room.guestPlan);
  const myPicks = picks(room.myPicks);
  const myPlan = plan(room.myPlan);
  if (
    (room.state === 'complete' && !(hostPicks && guestPicks && hostPlan && guestPlan)) ||
    Boolean(hostPicks) !== Boolean(hostPlan) ||
    Boolean(guestPicks) !== Boolean(guestPlan) ||
    Boolean(myPicks) !== Boolean(myPlan) ||
    (hostPicks !== null && !room.hostReady) ||
    (guestPicks !== null && !room.guestReady) ||
    (room.state !== 'complete' &&
      !(room.hostReady && room.guestReady) &&
      (hostPicks !== null || guestPicks !== null)) ||
    (room.state === 'complete' &&
      (JSON.stringify(myPicks) !== JSON.stringify(room.seat === 'host' ? hostPicks : guestPicks) ||
        myPlan !== (room.seat === 'host' ? hostPlan : guestPlan)))
  )
    throw new Error('Entregas da sala inválidas.');

  return {
    code: room.code as string,
    seed: room.seed as string,
    datasetVersion: room.datasetVersion as string,
    offers,
    seat: room.seat as OnlineDuelRoom['seat'],
    state: room.state as OnlineDuelRoom['state'],
    expiresAt: room.expiresAt as string,
    hostReady: room.hostReady as boolean,
    guestReady: room.guestReady as boolean,
    myPicks,
    myPlan,
    hostPicks,
    guestPicks,
    hostPlan,
    guestPlan,
  };
}

export function onlineDuelRounds(room: OnlineDuelRoom, data: GameData): DraftRound[] {
  if (room.datasetVersion !== data.draftRegionManifest.datasetVersion)
    throw new Error('Versão do catálogo incompatível com a sala.');
  const players = new Map<string, PlayerVersion>(data.players.map((player) => [player.id, player]));
  return room.offers.map((offer) => {
    const region = data.draftRegionManifest.groups
      .find((entry) => entry.year === offer.year)
      ?.groups.find((group) => group.id === offer.regionGroup);
    if (!region) throw new Error('Grupo da sala indisponível.');
    const options = offer.optionIds.map((id) => players.get(id));
    if (
      options.some(
        (player) =>
          !player ||
          player.role !== offer.role ||
          player.worldsYear !== offer.year ||
          !playerIsInDraftRegion(player, region),
      )
    )
      throw new Error('Jogadores da sala incompatíveis com o catálogo.');
    return {
      role: offer.role as DraftRound['role'],
      year: offer.year,
      region,
      options,
    } as DraftRound;
  });
}

export function completedOnlineDuel(room: OnlineDuelRoom, data: GameData): DuelResult | null {
  if (room.state !== 'complete') return null;
  const rounds = onlineDuelRounds(room, data);
  const duel: DuelState = {
    version: DUEL_SAVE_VERSION,
    randomVersion: CAMPAIGN_RANDOM_VERSION,
    datasetVersion: room.datasetVersion,
    seed: room.seed,
    phase: 'result',
    turn: 1,
    picks: [room.hostPicks!, room.guestPicks!],
    plans: [room.hostPlan!, room.guestPlan!],
  };
  return simulateDuel(duel, data, rounds);
}
