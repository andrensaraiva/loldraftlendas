import { createClient } from '@supabase/supabase-js';
import { parseOnlineDuelRoom } from './room';
import type { OnlineDuelRoom } from './room';
import type { GamePlan } from '../game/plan';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const client =
  url && key && import.meta.env.VITE_ONLINE_DUEL_ENABLED === 'true'
    ? createClient(url, key, {
        auth: {
          storageKey: 'draft-lendas.online-duel.auth',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export function requireClient() {
  if (!client) throw new Error('Convites online indisponíveis no momento.');
  return client;
}

async function hasSession(): Promise<boolean> {
  const { data, error } = await requireClient().auth.getSession();
  if (error) throw new Error('Não foi possível recuperar sua sessão.');
  return Boolean(data.session);
}

async function ensureSession(): Promise<void> {
  if (await hasSession()) return;
  const { error } = await requireClient().auth.signInAnonymously();
  if (error) throw new Error('Não foi possível iniciar uma sessão para o convite.');
}

export function onlineDuelAvailable(): boolean {
  return Boolean(client);
}

export async function createOnlineDuelRoom(): Promise<string> {
  await ensureSession();
  const { data, error } = await requireClient().rpc('create_duel_room');
  if (error || typeof data !== 'string') throw new Error('Não foi possível criar a sala agora.');
  return data;
}

export async function getOnlineDuelRoom(code: string): Promise<OnlineDuelRoom | null> {
  if (!(await hasSession())) return null;
  const { data, error } = await requireClient().rpc('get_duel_room', { p_code: code });
  if (error?.code === '42501') return null;
  if (error) throw new Error('Não foi possível consultar a sala. Tente novamente.');
  return parseOnlineDuelRoom(data);
}

export async function joinOnlineDuelRoom(code: string): Promise<OnlineDuelRoom> {
  await ensureSession();
  const { data, error } = await requireClient().rpc('join_duel_room', { p_code: code });
  if (error?.code === '42501')
    throw new Error('A sala já tem dois participantes ou este navegador não pode entrar nela.');
  if (error) throw new Error('Convite inválido ou vencido. Confira o código.');
  return parseOnlineDuelRoom(data);
}

export async function submitOnlineDuelTeam(
  code: string,
  picks: string[],
  plan: GamePlan,
): Promise<OnlineDuelRoom> {
  const { data, error } = await requireClient().rpc('submit_duel_team', {
    p_code: code,
    p_picks: picks,
    p_plan: plan,
  });
  if (error)
    throw new Error('Não foi possível enviar sua equipe. Atualize a sala e tente novamente.');
  return parseOnlineDuelRoom(data);
}

export async function cancelOnlineDuelRoom(code: string): Promise<OnlineDuelRoom> {
  const { data, error } = await requireClient().rpc('cancel_duel_room', { p_code: code });
  if (error) throw new Error('Não foi possível cancelar esta sala.');
  return parseOnlineDuelRoom(data);
}
