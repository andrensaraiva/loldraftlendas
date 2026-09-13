export const PWA_UPDATE_EVENT = 'draft-lendas:pwa-update';

export function registerPwa(): void {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
      if (registration.waiting)
        window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, { detail: registration }));
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller)
            window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, { detail: registration }));
        });
      });
    });
  });
}
