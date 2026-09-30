import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Volume2, VolumeX } from 'lucide-react';
import { appendChatMessage, CHAT_MAX_LENGTH, connectRoomChat } from './chat';
import type { ChatMessage, ChatSeat, ChatStatus } from './chat';
import './chat.css';

export default function RoomChat({
  code,
  seat,
  expiresAt,
}: {
  code: string;
  seat: ChatSeat;
  expiresAt: string;
}) {
  const muteKey = `draft-lendas.chat-muted.${code}.${seat}`;
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(muteKey) === 'true';
    } catch {
      return false;
    }
  });
  const mutedRef = useRef(muted);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<ChatStatus>('connecting');
  const [expired, setExpired] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const connection = useRef<ReturnType<typeof connectRoomChat> | null>(null);
  const pending = useRef(false);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      setExpired(true);
      return;
    }
    setStatus('connecting');
    try {
      connection.current = connectRoomChat(
        code,
        seat,
        (message) => {
          if (!active || (message.seat !== seat && mutedRef.current)) return;
          setMessages((current) => appendChatMessage(current, message));
        },
        (next) => {
          if (active) setStatus(next);
        },
      );
    } catch {
      setStatus('disconnected');
    }
    const timer = window.setTimeout(
      () => {
        active = false;
        connection.current?.close();
        connection.current = null;
        setMessages([]);
        setExpired(true);
      },
      Math.min(remaining, 2_147_483_647),
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
      connection.current?.close();
      connection.current = null;
    };
  }, [code, seat, expiresAt, attempt]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, muted]);

  useEffect(() => {
    const leave = () => {
      connection.current?.close();
      connection.current = null;
      setMessages([]);
      setText('');
      setError('');
      setStatus('disconnected');
    };
    const resume = (event: PageTransitionEvent) => {
      if (event.persisted) setAttempt((value) => value + 1);
    };
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', resume);
    return () => {
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', resume);
    };
  }, []);

  function toggleMute() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) setMessages((current) => current.filter((message) => message.seat === seat));
    try {
      if (next) localStorage.setItem(muteKey, 'true');
      else localStorage.removeItem(muteKey);
    } catch {
      /* Muting still works when browser storage is unavailable. */
    }
  }

  async function send() {
    if (pending.current || !text.trim() || !connection.current) return;
    const current = connection.current;
    pending.current = true;
    setSending(true);
    setError('');
    try {
      await current.send(text);
      if (connection.current === current) setText('');
    } catch (cause) {
      if (connection.current === current)
        setError(cause instanceof Error ? cause.message : 'Não foi possível enviar.');
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return (
    <section className="room-chat" aria-labelledby="room-chat-title">
      <header>
        <h2 id="room-chat-title">
          <MessageCircle size={20} aria-hidden="true" /> Chat da sala
        </h2>
        <button type="button" onClick={toggleMute} aria-pressed={muted}>
          {muted ? (
            <Volume2 size={16} aria-hidden="true" />
          ) : (
            <VolumeX size={16} aria-hidden="true" />
          )}
          {muted ? 'Mostrar mensagens do adversário' : 'Silenciar adversário'}
        </button>
      </header>
      <p className="room-chat-note">
        Só vocês dois. Sem histórico: ao sair ou recarregar, as mensagens desaparecem.
      </p>
      <p className="room-chat-status" role="status">
        {expired
          ? 'Chat encerrado: a sala expirou.'
          : status === 'connected'
            ? 'Chat conectado. Mensagens chegam apenas a quem estiver na sala agora.'
            : status === 'connecting'
              ? 'Conectando chat…'
              : 'Chat desconectado. O duelo continua disponível.'}
      </p>
      {!expired && status === 'disconnected' && (
        <button
          type="button"
          onClick={() => {
            setError('');
            setAttempt((value) => value + 1);
          }}
        >
          Reconectar chat
        </button>
      )}
      {muted && (
        <p className="room-chat-muted">Adversário silenciado só para você. Ele não é avisado.</p>
      )}
      <div
        className="room-chat-log"
        ref={log}
        role="log"
        aria-label="Mensagens da sala"
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
      >
        {messages.length === 0 && <p className="room-chat-empty">Nenhuma mensagem nesta visita.</p>}
        {messages.map((message) => (
          <div
            className={`room-chat-message${message.seat === seat ? ' own' : ''}`}
            key={`${message.seat}:${message.id}`}
          >
            <b>{message.seat === seat ? 'Você' : 'Adversário'}</b>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <label htmlFor="room-chat-text">Sua mensagem</label>
        <div className="room-chat-compose">
          <input
            id="room-chat-text"
            value={text}
            maxLength={CHAT_MAX_LENGTH}
            autoComplete="off"
            placeholder="Escreva uma mensagem…"
            disabled={expired}
            readOnly={sending}
            onChange={(event) => setText(event.target.value)}
            aria-describedby="room-chat-limit"
          />
          <button
            type="submit"
            disabled={expired || sending || status !== 'connected' || !text.trim()}
          >
            <Send size={16} aria-hidden="true" /> {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        <small id="room-chat-limit">
          {text.length}/{CHAT_MAX_LENGTH}
        </small>
      </form>
      {error && (
        <p role="alert" className="duel-error">
          {error}
        </p>
      )}
    </section>
  );
}
