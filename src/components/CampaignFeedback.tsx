import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import type { AnalyticsTracker, FeedbackRating } from '../game/analytics';
import './feedback.css';

const ratings: Array<{ id: FeedbackRating; label: string }> = [
  { id: 'good', label: 'Bom' },
  { id: 'ok', label: 'Ok' },
  { id: 'bad', label: 'Ruim' },
];

export function CampaignFeedback({ tracker }: { tracker: AnalyticsTracker }) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (!tracker.isEnabled() || status === 'sent')
    return status === 'sent' ? (
      <p className="feedback-thanks" role="status">
        <Check size={16} /> Obrigado pelo feedback.
      </p>
    ) : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating || status === 'sending') return;
    setStatus('sending');
    setStatus((await tracker.submitFeedback(rating, note)) ? 'sent' : 'error');
  }

  return (
    <form className="campaign-feedback" onSubmit={submit}>
      <span className="eyebrow">SUA AVALIAÇÃO</span>
      <h2>Como foi essa campanha?</h2>
      <div className="feedback-ratings" role="radiogroup" aria-label="Avaliação da campanha">
        {ratings.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={rating === option.id}
            className={rating === option.id ? 'selected' : ''}
            onClick={() => setRating(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label>
        <span>Comentário opcional</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Não inclua dados pessoais."
        />
      </label>
      {status === 'error' && (
        <p className="feedback-error" role="alert">
          Não foi possível enviar agora. Sua campanha não foi afetada.
        </p>
      )}
      <button className="feedback-submit" type="submit" disabled={!rating || status === 'sending'}>
        <Send size={16} /> {status === 'sending' ? 'Enviando' : 'Enviar avaliação'}
      </button>
    </form>
  );
}