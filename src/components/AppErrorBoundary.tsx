import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  clearSavedCampaign?: () => void;
}

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Draft Lendas render failure', error, info.componentStack);
  }

  private reload = () => window.location.reload();

  private restart = () => {
    this.props.clearSavedCampaign?.();
    window.location.assign('/');
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="loading error-fallback" role="alert" aria-live="assertive">
        <span className="brand">
          DRAFT <em>LENDAS</em>
        </span>
        <h1>O jogo encontrou um erro.</h1>
        <p>Você pode tentar recarregar sem perder a campanha salva.</p>
        <div className="error-actions">
          <button className="primary" onClick={this.reload}>
            Recarregar
          </button>
          {this.props.clearSavedCampaign && (
            <button className="text-button" onClick={this.restart}>
              Descartar campanha e recomeçar
            </button>
          )}
        </div>
      </main>
    );
  }
}
