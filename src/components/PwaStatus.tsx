import { Download, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PWA_UPDATE_EVENT } from '../pwa';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const showInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => setInstallPrompt(null);
    const wentOnline = () => setOnline(true);
    const wentOffline = () => setOnline(false);
    const updateAvailable = (event: Event) =>
      setUpdate((event as CustomEvent<ServiceWorkerRegistration>).detail);
    window.addEventListener('beforeinstallprompt', showInstall);
    window.addEventListener('appinstalled', installed);
    window.addEventListener('online', wentOnline);
    window.addEventListener('offline', wentOffline);
    window.addEventListener(PWA_UPDATE_EVENT, updateAvailable);
    return () => {
      window.removeEventListener('beforeinstallprompt', showInstall);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('online', wentOnline);
      window.removeEventListener('offline', wentOffline);
      window.removeEventListener(PWA_UPDATE_EVENT, updateAvailable);
    };
  }, []);

  useEffect(() => {
    if (!update) return;
    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
    return () => navigator.serviceWorker.removeEventListener('controllerchange', reload);
  }, [update]);

  if (online && !installPrompt && !update) return null;
  return (
    <aside className="pwa-status" aria-live="polite">
      {!online && (
        <span>
          <WifiOff size={16} /> Offline · sua campanha salva continua disponível
        </span>
      )}
      {installPrompt && (
        <button
          onClick={() => {
            void installPrompt
              .prompt()
              .then(() => installPrompt.userChoice)
              .then(() => setInstallPrompt(null));
          }}
        >
          <Download size={16} /> Instalar Draft Lendas
        </button>
      )}
      {update?.waiting && (
        <button onClick={() => update.waiting?.postMessage({ type: 'SKIP_WAITING' })}>
          <RefreshCw size={16} /> Atualizar com segurança
        </button>
      )}
    </aside>
  );
}
