import { describe, expect, it } from 'vitest';
import { appendChatMessage, CHAT_MAX_MESSAGES, parseChatMessage } from './chat';
import type { ChatMessage } from './chat';

const id = '11111111-1111-4111-8111-111111111111';
describe('ephemeral room messages', () => {
  it('uses the authorized channel identity, ignoring a forged sender in the payload', () => {
    expect(parseChatMessage({ id, text: ' oi ', seat: 'host' }, 'guest')).toEqual({
      id,
      text: 'oi',
      seat: 'guest',
    });
  });
  it('rejects empty, malformed and oversized payloads', () => {
    for (const payload of [
      null,
      [],
      {},
      { id, text: '   ' },
      { id, text: 'a'.repeat(301) },
      { id, text: 2 },
      { id: 'invalid', text: 'oi' },
    ])
      expect(parseChatMessage(payload, 'host')).toBeNull();
    expect(parseChatMessage({ id, text: 'a'.repeat(300) }, 'host')).not.toBeNull();
  });
  it('deduplicates within a sender and keeps memory bounded without hiding another sender', () => {
    const message = { id, text: 'oi', seat: 'host' as const };
    const history = [message];
    expect(appendChatMessage(history, message)).toBe(history);
    expect(appendChatMessage(history, { ...message, seat: 'guest' })).toHaveLength(2);
    let bounded: ChatMessage[] = history;
    for (let index = 0; index < 100; index++)
      bounded = appendChatMessage(bounded, { ...message, id: String(index) });
    expect(bounded).toHaveLength(CHAT_MAX_MESSAGES);
    expect(bounded.at(-1)?.id).toBe('99');
  });
});
