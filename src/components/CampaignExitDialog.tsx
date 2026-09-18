import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export type CampaignExitAction = 'abandon' | 'replace';

export function CampaignExitDialog({
  action,
  onCancel,
  onConfirm,
}: {
  action: CampaignExitAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const replacing = action === 'replace';
  return (
    <dialog
      ref={dialog}
      className="campaign-exit-dialog"
      aria-labelledby="campaign-exit-title"
      onCancel={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <button className="icon-button close-help" onClick={onCancel} aria-label="Fechar confirmação">
        <X />
      </button>
      <span className="exit-dialog-icon" aria-hidden="true">
        <AlertTriangle />
      </span>
      <span className="eyebrow">CAMPANHA EM ANDAMENTO</span>
      <h2 id="campaign-exit-title">
        {replacing ? 'Começar um novo draft?' : 'Abandonar esta campanha?'}
      </h2>
      <p>
        {replacing
          ? 'O progresso salvo será substituído assim que o novo draft começar.'
          : 'Esta ação remove o progresso salvo neste dispositivo e não pode ser desfeita.'}
      </p>
      <div className="campaign-exit-actions">
        <button className="secondary" onClick={onCancel}>
          Manter campanha
        </button>
        <button className="danger-button" onClick={onConfirm}>
          {replacing ? 'Começar novo draft' : 'Abandonar campanha'}
        </button>
      </div>
    </dialog>
  );
}
