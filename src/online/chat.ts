import type { RealtimeChannel } from '@supabase/supabase-js';
import { requireClient } from './api';

export type ChatSeat = 'host' | 'guest';
export type ChatStatus = 'connecting' | 'connected' | 'disconnected';
export type ChatMessage = { id: string; text: string; seat: ChatSeat };
export const CHAT_MAX_LENGTH = 300;
export const CHAT_MAX_MESSAGES = 60;
let pendingCleanup: Promise<unknown> = Promise.resolve();

export function parseChatMessage(payload: unknown, seat: ChatSeat): ChatMessage | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as Record<string, unknown>;
  if (
    typeof value.id !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(value.id) ||
    typeof value.text !== 'string' ||
    value.text.length > CHAT_MAX_LENGTH ||
    !value.text.trim()
  )
    return null;
  // The authorized channel identifies the sender. Never trust a payload's seat.
  return { id: value.id, text: value.text.trim(), seat };
}

export function appendChatMessage(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (messages.some((item) => item.id === message.id && item.seat === message.seat))
    return messages;
  return [...messages, message].slice(-CHAT_MAX_MESSAGES);
}

export function connectRoomChat(
  code: string,
  seat: ChatSeat,
  onMessage: (message: ChatMessage) => void,
  onStatus: (status: ChatStatus) => void,
) {
  const client = requireClient();
  const channels = new Map<ChatSeat, RealtimeChannel>();
  const ready = new Set<ChatSeat>();
  let closed = false;

  // Two authorized topics prevent either player from impersonating the other.
  // WebSocket Broadcast has no database writes, history, or replay request.
  async function subscribe() {
    // The SDK reuses topics until removal finishes; wait before reconnecting.
    await pendingCleanup;
    if (closed) return;
    for (const sender of ['host', 'guest'] as const) {
      const channel = client.channel(`duel-chat:${code}:${sender}`, {
        config: { private: true, broadcast: { ack: true, self: false } },
      });
      channels.set(sender, channel);
      channel
        .on('broadcast', { event: 'message' }, ({ payload }) => {
          if (closed) return;
          const message = parseChatMessage(payload, sender);
          if (message) onMessage(message);
        })
        .subscribe((status) => {
          if (closed) return;
          if (status === 'SUBSCRIBED') ready.add(sender);
          else ready.delete(sender);
          onStatus(ready.size === 2 ? 'connected' : 'disconnected');
        });
    }
  }
  void subscribe().catch(() => {
    if (!closed) onStatus('disconnected');
  });

  return {
    async send(text: string) {
      const channel = channels.get(seat)!;
      if (closed || ready.size !== 2 || channel.state !== 'joined') {
        throw new Error('O chat está reconectando. Aguarde para enviar.');
      }
      const message = parseChatMessage({ id: crypto.randomUUID(), text }, seat);
      if (!message) throw new Error(`Escreva até ${CHAT_MAX_LENGTH} caracteres.`);
      const result = await channel.send(
        {
          type: 'broadcast',
          event: 'message',
          payload: { id: message.id, text: message.text },
        },
        { timeout: 5000 },
      );
      if (closed) return;
      if (result !== 'ok') throw new Error('Envio não confirmado. Tente novamente.');
      onMessage(message);
    },
    close() {
      closed = true;
      ready.clear();
      pendingCleanup = Promise.all([
        pendingCleanup,
        ...Array.from(channels.values(), (channel) => client.removeChannel(channel)),
      ]).catch(() => {});
    },
  };
}
