import { Download, Flag, Sparkles, Trophy } from 'lucide-react';
import { useState } from 'react';
import type { CampaignSummary } from '../game/history';
import { buildJourneyNodes } from '../game/journey';
import type { CampaignReport } from '../game/report';
import { createJourneyCard, downloadCampaignCard } from '../game/share';
import type { GameResult, Series, Tournament } from '../game/types';

const stageLabel = {
  swiss: 'Etapa Suíça',
  quarters: 'Quartas',
  semis: 'Semifinal',
  final: 'Final',
} as const;

export default function CampaignJourney({
  report,
  tournament,
  previousCampaigns,
  currentCampaignId,
  onOpenGame,
  onDownload,
}: {
  report: CampaignReport;
  tournament: Tournament;
  previousCampaigns: CampaignSummary[];
  currentCampaignId: string;
  onOpenGame: (result: GameResult, series: Series) => void;
  onDownload: () => void;
}) {
  const nodes = buildJourneyNodes(report);
  const [status, setStatus] = useState('');
  const previous = previousCampaigns.filter((campaign) => campaign.id !== currentCampaignId);
  const bestPreviousWins = Math.max(0, ...previous.map((campaign) => campaign.wins));

  async function download() {
    setStatus('Preparando imagem…');
    try {
      downloadCampaignCard(await createJourneyCard(report));
      onDownload();
      setStatus('Imagem da jornada baixada.');
    } catch {
      setStatus('Não foi possível gerar a imagem neste navegador.');
    }
  }

  return (
    <section className="campaign-journey" aria-labelledby="campaign-journey-title">
      <header>
        <div>
          <span className="eyebrow green">SUA JORNADA</span>
          <h2 id="campaign-journey-title">Cada confronto deixou uma marca.</h2>
          <p>O caminho mostra somente partidas que realmente aconteceram na sua campanha.</p>
        </div>
        <button className="secondary" onClick={() => void download()}>
          Baixar jornada <Download size={17} />
        </button>
      </header>
      <ol className="journey-path" aria-label="Caminho da campanha">
        {nodes.map((node) => {
          const series = tournament.history[node.seriesIndex];
          const decisiveGame = series?.games[series.games.length - 1];
          return (
            <li className="journey-node-wrap" key={node.seriesIndex}>
              <button
                type="button"
                className={`journey-node ${node.won ? 'win' : 'loss'} ${node.highlight ?? ''}`}
                onClick={() => series && decisiveGame && onOpenGame(decisiveGame, series)}
                aria-label={`Abrir relatório de ${stageLabel[node.stage]} contra ${node.opponentName}`}
              >
                <span className="journey-marker">
                  {node.highlight === 'title' ? (
                    <Trophy size={19} />
                  ) : node.highlight === 'upset' || node.highlight === 'decisive' ? (
                    <Sparkles size={18} />
                  ) : (
                    <Flag size={17} />
                  )}
                </span>
                <small>{stageLabel[node.stage]}</small>
                <b>{node.opponentName}</b>
                <strong>
                  {node.wins}–{node.losses}
                </strong>
                {node.highlight && (
                  <em>
                    {{
                      upset: 'Maior zebra',
                      decisive: 'Jogo decisivo',
                      title: 'Título mundial',
                      elimination: 'Eliminação',
                    }[node.highlight]}
                  </em>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="journey-local-comparison">
        <span>SEU HISTÓRICO LOCAL</span>
        {previous.length ? (
          <p>
            Esta campanha teve <b>{report.totals.wins} vitórias</b>. Sua melhor campanha anterior
            registrada teve <b>{bestPreviousWins}</b>.
          </p>
        ) : (
          <p>Esta é a primeira campanha disponível para comparação neste dispositivo.</p>
        )}
      </div>
      <p className="journey-status" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
