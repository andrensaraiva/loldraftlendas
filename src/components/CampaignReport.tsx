import type { CampaignGameReport, CampaignReport as Report } from '../game/report';
import { resultExpectationLabel } from '../game/report';

const percent = (value: number) => `${Math.round(value * 100)}%`;
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`;

function gameLabel(game: CampaignGameReport | null) {
  return game ? `${game.opponentName} · G${game.game}` : 'Nenhuma nesta campanha';
}

export function SeriesReportSummary({
  report,
  seriesIndex,
}: {
  report: Report;
  seriesIndex: number;
}) {
  const games = report.games.filter((game) => game.seriesIndex === seriesIndex);
  if (!games.length) return null;
  const wins = games.filter((game) => game.won).length;
  const effect = games.reduce((total, game) => total + game.planModifier, 0);
  return (
    <section className="series-report-summary" aria-labelledby="series-report-title">
      <div>
        <span className="eyebrow green">LEITURA DA SÉRIE</span>
        <h2 id="series-report-title">O que os números mostram</h2>
        <p>
          {wins}–{games.length - wins} contra {games[0].opponentName}. O plano acumulou{' '}
          <b>{signed(effect)}</b> de força nesta série.
        </p>
      </div>
      <div className="series-report-games">
        {games.map((game) => (
          <article key={game.id} className={game.won ? 'win' : 'loss'}>
            <span>G{game.game}</span>
            <b>{resultExpectationLabel(game.expectation)}</b>
            <small>
              {percent(game.probability)} de chance · plano {signed(game.planModifier)}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function CampaignReport({ report }: { report: Report }) {
  const compatibilityTotal =
    report.plan.compatibility.high +
    report.plan.compatibility.medium +
    report.plan.compatibility.low;
  return (
    <section className="campaign-report" aria-labelledby="campaign-report-title">
      <header>
        <span className="eyebrow green">RELATÓRIO DA CAMPANHA</span>
        <h2 id="campaign-report-title">A história por trás do resultado.</h2>
        <p>
          Todos os números abaixo vêm das partidas já sorteadas. KDA e acontecimentos são destaques
          da simulação, não causas do resultado probabilístico.
        </p>
      </header>

      <div className="campaign-report-totals">
        <article>
          <b>{report.totals.wins}</b>
          <span>vitórias em {report.totals.games} jogos</span>
        </article>
        <article>
          <b>{report.totals.seriesWins}</b>
          <span>séries vencidas em {report.totals.series}</span>
        </article>
        <article>
          <b>{report.strongestComposition.finalStrength.toFixed(1)}</b>
          <span>maior força · G{report.strongestComposition.game}</span>
        </article>
        <article>
          <b>{signed(report.plan.totalEffect)}</b>
          <span>efeito total do plano</span>
        </article>
      </div>

      <div className="campaign-report-grid">
        <article className="report-plan-card">
          <span>PLANO · {report.plan.label.toUpperCase()}</span>
          <h3>{signed(report.plan.averageEffect)} por jogo</h3>
          <p>
            Compatibilidade alta em {report.plan.compatibility.high}, média em{' '}
            {report.plan.compatibility.medium} e baixa em {report.plan.compatibility.low} de{' '}
            {compatibilityTotal} jogos.
          </p>
          <div className="compatibility-bar" aria-label="Distribuição da compatibilidade do plano">
            {compatibilityTotal > 0 && (
              <>
                <span
                  className="high"
                  style={{ width: `${(report.plan.compatibility.high / compatibilityTotal) * 100}%` }}
                />
                <span
                  className="medium"
                  style={{ width: `${(report.plan.compatibility.medium / compatibilityTotal) * 100}%` }}
                />
                <span
                  className="low"
                  style={{ width: `${(report.plan.compatibility.low / compatibilityTotal) * 100}%` }}
                />
              </>
            )}
          </div>
        </article>
        <article>
          <span>DESTAQUE DA SIMULAÇÃO</span>
          <h3>{report.standoutPlayer?.playerName ?? 'Sem dados'}</h3>
          <p>
            {report.standoutPlayer
              ? `${report.standoutPlayer.kills}/${report.standoutPlayer.deaths}/${report.standoutPlayer.assists} · KDA ${report.standoutPlayer.kda.toFixed(2)}`
              : 'A campanha não registrou estatísticas narrativas.'}
          </p>
        </article>
        <article>
          <span>JOGO DECISIVO</span>
          <h3>{gameLabel(report.decisiveGame)}</h3>
          <p>
            {report.decisiveGame
              ? `${resultExpectationLabel(report.decisiveGame.expectation)} · ${percent(report.decisiveGame.probability)} de chance pré-jogo.`
              : 'Nenhum jogo concluído.'}
          </p>
        </article>
        <article>
          <span>MAIOR ZEBRA A FAVOR</span>
          <h3>{gameLabel(report.biggestUpsetFor)}</h3>
          <p>
            {report.biggestUpsetFor
              ? `Vitória com ${percent(report.biggestUpsetFor.probability)} de chance estimada.`
              : 'As vitórias vieram quando sua equipe era favorita.'}
          </p>
        </article>
        <article>
          <span>MAIOR ZEBRA CONTRA</span>
          <h3>{gameLabel(report.biggestUpsetAgainst)}</h3>
          <p>
            {report.biggestUpsetAgainst
              ? `Derrota mesmo com ${percent(report.biggestUpsetAgainst.probability)} de chance.`
              : 'Não houve derrota enquanto favorita.'}
          </p>
        </article>
        <article>
          <span>CONFRONTO MAIS DIFÍCIL</span>
          <h3>{gameLabel(report.toughestGame)}</h3>
          <p>
            {report.toughestGame
              ? `A menor chance pré-jogo foi ${percent(report.toughestGame.probability)}.`
              : 'Nenhum confronto concluído.'}
          </p>
        </article>
        <article>
          <span>CAMPEÃO MAIS UTILIZADO</span>
          <h3>{report.mostUsedChampion?.championName ?? 'Sem dados'}</h3>
          <p>
            {report.mostUsedChampion
              ? `${report.mostUsedChampion.games} jogos · ${report.mostUsedChampion.wins} vitórias.`
              : 'Nenhum campeão utilizado.'}
          </p>
        </article>
        <article>
          <span>CAMPEÃO MAIS VITORIOSO</span>
          <h3>{report.mostSuccessfulChampion?.championName ?? 'Sem dados'}</h3>
          <p>
            {report.mostSuccessfulChampion
              ? `${report.mostSuccessfulChampion.wins}/${report.mostSuccessfulChampion.games} · ${percent(report.mostSuccessfulChampion.winRate)} de aproveitamento.`
              : 'Nenhum campeão utilizado.'}
          </p>
        </article>
        <article>
          <span>COMPOSIÇÃO MAIS FRACA</span>
          <h3>G{report.weakestComposition.game}</h3>
          <p>
            Força {report.weakestComposition.finalStrength.toFixed(1)} após efeito de plano{' '}
            {signed(report.weakestComposition.planModifier)}.
          </p>
        </article>
      </div>

      <div className="stage-report" aria-label="Retrospecto por fase">
        {report.stages.map((stage) => (
          <article key={stage.stage}>
            <span>
              {{ swiss: 'Etapa Suíça', quarters: 'Quartas', semis: 'Semifinal', final: 'Final' }[
                stage.stage
              ]}
            </span>
            <b>
              {stage.seriesWins}–{stage.seriesLosses} séries
            </b>
            <small>
              {stage.gameWins}V · {stage.gameLosses}D em jogos
            </small>
          </article>
        ))}
      </div>

      <div className="composition-report" aria-label="Força das composições G1 a G5">
        <div className="subheading">
          <h3>Composições G1–G5</h3>
          <span>BASE → PLANO → FINAL</span>
        </div>
        {report.compositions.map((composition) => (
          <div key={composition.game}>
            <b>G{composition.game}</b>
            <span>{composition.baseStrength.toFixed(1)}</span>
            <i>{signed(composition.planModifier)}</i>
            <strong>{composition.finalStrength.toFixed(1)}</strong>
            <div>
              <span style={{ width: `${composition.finalStrength}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="report-records">
        <span>
          Como favorita: <b>{report.favoriteRecord.wins}/{report.favoriteRecord.games}</b> ·{' '}
          {percent(report.favoriteRecord.winRate)}
        </span>
        <span>
          Como azarão: <b>{report.underdogRecord.wins}/{report.underdogRecord.games}</b> ·{' '}
          {percent(report.underdogRecord.winRate)}
        </span>
        <span>
          Edições: <b>{report.representedYears.join(', ')}</b>
        </span>
        <span>
          Regiões: <b>{report.representedRegions.join(', ')}</b>
        </span>
      </div>
    </section>
  );
}
