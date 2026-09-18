import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { clearCampaign } from './game/campaign';
import { applyRouteMetadata } from './seo';
import { registerPwa } from './pwa';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-sans/latin-800.css';
import './styles.css';
import './components/autoplay.css';
import './components/draft.css';
import './components/campaign-report.css';
const AdminApp = lazy(() => import('./admin/AdminApp'));
const ArchiveApp = lazy(() => import('./archive/ArchiveApp'));
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';
const isArchive =
  window.location.pathname === '/arquivo' || window.location.pathname.startsWith('/arquivo/');
applyRouteMetadata(window.location.pathname);
if (!isAdmin) registerPwa();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary clearSavedCampaign={isAdmin ? undefined : clearCampaign}>
      {isAdmin ? (
        <Suspense
          fallback={
            <main className="loading" role="status" aria-live="polite">
              Carregando painel…
            </main>
          }
        >
          <AdminApp />
        </Suspense>
      ) : isArchive ? (
        <Suspense
          fallback={
            <main className="loading" role="status" aria-live="polite">
              Carregando arquivo histórico…
            </main>
          }
        >
          <ArchiveApp />
        </Suspense>
      ) : (
        <App />
      )}
    </AppErrorBoundary>
  </React.StrictMode>,
);
