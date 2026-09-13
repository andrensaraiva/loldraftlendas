import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import archiveIndexData from '../data/archive-index.json';
import { championArt } from '../data/art';
import { LocalDataRepository } from '../data/repository';
import type { GameData } from '../data/repository';
import type { ChampionSlot, PlayerVersion } from '../game/types';
import { archiveSlug, parseArchiveRoute } from './routes';
import './archive.css';

interface ArchiveIndex {
  version: number;
  years: Array<{ year: number; players: number; teams: number; champions: number }>;
  players: Array<{ slug: string; name: string; years: number[] }>;
  champions: Array<{ id: string; years: number[]; appearances: number }>;
}

const archiveIndex = archiveIndexData as ArchiveIndex;
const repository = new LocalDataRepository();
const route = parseArchiveRoute(window.location.pathname);
const roleNames = { TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', ADC: 'ADC', SUPPORT: 'SUPORTE' };

function archiveMetadata(title: string, description: string) {
  document.title = `${title} — Draft Lendas`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  canonical?.setAttribute('href', window.location.href.split(/[?#]/)[0]);
  document
    .querySelector('meta[property="og:url"]')
    ?.setAttribute('content', window.location.href.split(/[?#]/)[0]);
}

function PlayerEntry({
  player,
  championFilter,
}: {
  player: PlayerVersion;
  championFilter?: string;
}) {
  const slots = championFilter
    ? player.championPool.filter((slot) => slot.championId === championFilter)
    : player.championPool;
  return (
    <article className="archive-player-card">
      <div className="archive-player-heading">
        {player.image && <img src={player.image} alt="" loading="lazy" />}
        <div>
          <span>
            {roleNames[player.role]} · {player.worldsYear}
          </span>
          <h2>
            <a href={`/arquivo/jogador/${archiveSlug(player.playerName)}`}>{player.playerName}</a>
          </h2>
          <p>{player.teamName ?? player.team}</p>
        </div>
      </div>
      <p className="archive-profile">{player.profile}</p>
      <div className="archive-pool">
        {slots.map((slot) => (
          <PoolEntry key={`${slot.game}-${slot.championId}`} player={player} slot={slot} />
        ))}
      </div>
    </article>
  );
}

function PoolEntry({ player, slot }: { player: PlayerVersion; slot: ChampionSlot }) {
  const champion = repository.catalog.champions[slot.championId];
  return (
    <div>
      <a className="archive-champion" href={`/arquivo/campeao/${slot.championId}`}>
        <img
          src={championArt(champion, player.worldsYear).image}
          alt=""
          width="38"
          height="38"
          loading="lazy"
        />
        <span>
          <b>{champion?.name ?? slot.championId}</b>
          <small>
            G{slot.game} · rating {slot.gameRating ?? slot.rating}
          </small>
        </span>
      </a>
      {slot.stats?.sourceUrl && (
        <a className="archive-source" href={slot.stats.sourceUrl} target="_blank" rel="noreferrer">
          Fonte <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

function ArchiveIndexPage() {
  const [search, setSearch] = useState('');
  const results = useMemo(() => {
    const term = archiveSlug(search);
    if (term.length < 2) return [];
    const players = archiveIndex.players
      .filter((player) => player.slug.includes(term))
      .slice(0, 6)
      .map((player) => ({
        key: `player-${player.slug}`,
        title: player.name,
        detail: `Jogador · ${player.years.join(', ')}`,
        href: `/arquivo/jogador/${player.slug}`,
      }));
    const champions = archiveIndex.champions
      .filter((entry) => {
        const name = repository.catalog.champions[entry.id]?.name ?? entry.id;
        return archiveSlug(name).includes(term);
      })
      .slice(0, 6)
      .map((entry) => ({
        key: `champion-${entry.id}`,
        title: repository.catalog.champions[entry.id]?.name ?? entry.id,
        detail: `Campeão · ${entry.years.join(', ')}`,
        href: `/arquivo/campeao/${entry.id}`,
      }));
    return [...players, ...champions].slice(0, 10);
  }, [search]);

  return (
    <>
      <div className="archive-hero">
        <span className="archive-kicker">ACERVO PESQUISADO · 2015–2025</span>
        <h1>O Worlds, lenda por lenda.</h1>
        <p>
          Explore as versões históricas usadas no jogo, seus cinco campeões e as fontes que
          sustentam cada pool. Ratings são estimativas editoriais, não números oficiais.
        </p>
        <label className="archive-search">
          <Search size={19} />
          <span className="sr-only">Buscar jogador ou campeão</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar jogador ou campeão"
          />
        </label>
        {search.length >= 2 && (
          <div className="archive-search-results" aria-live="polite">
            {results.length ? (
              results.map((result) => (
                <a key={result.key} href={result.href}>
                  <span>
                    <b>{result.title}</b>
                    <small>{result.detail}</small>
                  </span>
                  <ArrowRight size={16} />
                </a>
              ))
            ) : (
              <p>Nenhum jogador ou campeão encontrado.</p>
            )}
          </div>
        )}
      </div>
      <section className="archive-editions" aria-labelledby="archive-editions-title">
        <span className="archive-kicker">EDIÇÕES VALIDADAS</span>
        <h2 id="archive-editions-title">Escolha um ano.</h2>
        <div>
          {archiveIndex.years.map((edition) => (
            <a key={edition.year} href={`/arquivo/edicao/${edition.year}`}>
              <b>{edition.year}</b>
              <span>{edition.players} versões</span>
              <small>
                {edition.teams} times · {edition.champions} campeões
              </small>
              <ArrowRight size={18} />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

export default function ArchiveApp() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState('');
  const playerIndex =
    route.kind === 'player'
      ? archiveIndex.players.find((player) => player.slug === route.slug)
      : undefined;
  const championIndex =
    route.kind === 'champion'
      ? archiveIndex.champions.find((champion) => champion.id === route.id)
      : undefined;
  const years =
    route.kind === 'edition'
      ? archiveIndex.years.some((entry) => entry.year === route.year)
        ? [route.year]
        : []
      : (playerIndex?.years ?? championIndex?.years ?? []);

  useEffect(() => {
    if (route.kind === 'index') {
      archiveMetadata(
        'Arquivo histórico',
        'Explore jogadores, campeões, edições e fontes do acervo pesquisado do Draft Lendas.',
      );
      return;
    }
    if (!years.length) {
      setError('Esta página não existe no acervo validado.');
      archiveMetadata('Página não encontrada', 'Página não encontrada no arquivo histórico.');
      return;
    }
    const title =
      route.kind === 'edition'
        ? `Worlds ${route.year}`
        : route.kind === 'player'
          ? playerIndex!.name
          : (repository.catalog.champions[championIndex!.id]?.name ?? championIndex!.id);
    archiveMetadata(title, `${title}: versões históricas, pools de campeões e fontes pesquisadas.`);
    let active = true;
    void repository
      .loadYears(years)
      .then((snapshot) => {
        if (active) setData(snapshot);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar este recorte do arquivo.');
      });
    return () => {
      active = false;
    };
  }, []);

  const players = useMemo(() => {
    if (!data) return [];
    if (route.kind === 'edition') return data.players;
    if (route.kind === 'player')
      return data.players.filter((player) => archiveSlug(player.playerName) === route.slug);
    if (route.kind === 'champion')
      return data.players.filter((player) =>
        player.championPool.some((slot) => slot.championId === route.id),
      );
    return [];
  }, [data]);

  const pageTitle =
    route.kind === 'edition'
      ? `Worlds ${route.year}`
      : route.kind === 'player'
        ? playerIndex?.name
        : route.kind === 'champion'
          ? repository.catalog.champions[route.id]?.name
          : null;

  return (
    <div className="archive-shell">
      <header className="archive-header">
        <a className="archive-brand" href="/">
          DRAFT <em>LENDAS</em>
          <span>.</span>
        </a>
        <a href="/">
          <ArrowLeft size={16} /> Voltar ao jogo
        </a>
      </header>
      <main>
        {route.kind === 'index' ? (
          <ArchiveIndexPage />
        ) : error ? (
          <section className="archive-loading" role="alert">
            <BookOpen size={34} />
            <h1>{error}</h1>
            <a href="/arquivo">Abrir o arquivo</a>
          </section>
        ) : !data ? (
          <section className="archive-loading" role="status">
            <BookOpen size={34} />
            <h1>Carregando o acervo…</h1>
          </section>
        ) : (
          <>
            <section className="archive-page-heading">
              <span className="archive-kicker">
                {route.kind === 'edition'
                  ? 'EDIÇÃO DO WORLDS'
                  : route.kind === 'player'
                    ? 'JOGADOR HISTÓRICO'
                    : 'CAMPEÃO NO ACERVO'}
              </span>
              <h1>{pageTitle}</h1>
              <p>
                {players.length}{' '}
                {players.length === 1 ? 'versão encontrada' : 'versões encontradas'}
                {' · '}dados e fontes carregados apenas para {years.join(', ')}.
              </p>
            </section>
            <section className="archive-player-grid" aria-label={`Versões de ${pageTitle}`}>
              {players.map((player) => (
                <PlayerEntry
                  key={player.id}
                  player={player}
                  championFilter={route.kind === 'champion' ? route.id : undefined}
                />
              ))}
            </section>
          </>
        )}
      </main>
      <footer className="archive-footer">
        <span>Pools comprovados · ratings estimados, não oficiais.</span>
        <a href="/arquivo">Índice do arquivo</a>
      </footer>
    </div>
  );
}
