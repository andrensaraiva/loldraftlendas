import { Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import { campaignShareText, createCampaignCard, downloadCampaignCard } from '../game/share';
import type { CampaignShareSummary } from '../game/share';

export type CampaignShareEvent = 'share_started' | 'share_completed' | 'card_downloaded';
export type CampaignShareMethod = 'file' | 'link' | 'download';

function shareFile(card: Awaited<ReturnType<typeof createCampaignCard>>): File | null {
  if (typeof File === 'undefined') return null;
  return new File([card.blob], card.fileName, { type: card.blob.type });
}

function canShareFile(file: File | null): file is File {
  if (!file || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function')
    return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function CampaignShare({
  summary,
  onTrack,
}: {
  summary: CampaignShareSummary;
  onTrack: (event: CampaignShareEvent, method: CampaignShareMethod) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function download(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setStatus('Preparando o card…');
    try {
      const card = await createCampaignCard(summary);
      downloadCampaignCard(card);
      onTrack('card_downloaded', 'download');
      setStatus('Card baixado. Agora é só compartilhar sua campanha.');
    } catch {
      setStatus('Não foi possível gerar o card neste navegador.');
    } finally {
      setBusy(false);
    }
  }

  async function share(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setStatus('Preparando sua campanha…');
    try {
      const card = await createCampaignCard(summary);
      const file = shareFile(card);
      const text = campaignShareText(summary);
      if (canShareFile(file)) {
        onTrack('share_started', 'file');
        await navigator.share({ title: 'Meu Draft Lendas', text, files: [file] });
        onTrack('share_completed', 'file');
        setStatus('Campanha compartilhada.');
      } else if (typeof navigator.share === 'function') {
        onTrack('share_started', 'link');
        await navigator.share({ title: 'Meu Draft Lendas', text, url: window.location.origin });
        onTrack('share_completed', 'link');
        setStatus('Campanha compartilhada.');
      } else {
        onTrack('share_started', 'download');
        downloadCampaignCard(card);
        try {
          await navigator.clipboard?.writeText(`${text} ${window.location.origin}`);
        } catch {
          // The image download remains the successful fallback when clipboard access is blocked.
        }
        onTrack('card_downloaded', 'download');
        setStatus('Card baixado e texto preparado para compartilhar.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        setStatus('Compartilhamento cancelado.');
      else setStatus('Não foi possível compartilhar agora. Tente baixar o card.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="campaign-share">
      <div className="final-actions">
        <button className="primary" onClick={share} disabled={busy}>
          <Share2 size={18} /> {busy ? 'Preparando…' : 'Compartilhar campanha'}
        </button>
        <button className="secondary" onClick={download} disabled={busy}>
          <Download size={18} /> Baixar card
        </button>
      </div>
      <p className="share-status" role="status" aria-live="polite">
        {status || 'Mostre suas cinco lendas — vitória ou derrota também vira história.'}
      </p>
    </div>
  );
}
