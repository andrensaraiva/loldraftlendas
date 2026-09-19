import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  GitCompareArrows,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import archiveIndexData from '../data/archive-index.json';
import { championArt } from '../data/art';
import { LocalDataRepository } from '../data/repository';
import type { GameData } from '../data/repository';
import type { ChampionSlot, PlayerVersion } from '../game/types';
import { canonicalRegionFor } from '../game/regions';
import {
  DEFAULT_ARCHIVE_FILTERS,
  archiveFilterSearch,
  averagePlayerRating,
  filterArchivePlayers,
  parseArchiveFilters,
} from './filters';
import type { ArchiveFilters } from './filters';
import { archiveSlug, parseArchiveRoute } from './routes';
import './archive.css';

interface ArchiveIndex {
  version: number;
  years: Array<{ year: number; players: number; teams: number; champions: number }>;
  players: Array<{ slug: string; name: string; years: number[] }>;
  champions: Array<{ id: string; years: number[]; appearances: number }>;
  teams: Array<{
    slug: string;
    name: string;
    years: number[];
    codes: string[];
    regions: string[];
    players: string[];
  }>;
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
          <p>
            <a href={`/arquivo/equipe/${archiveSlug(player.teamName ?? player.team)}`}>
              {player.teamName ?? player.team}
            </a>
          </p>
        </div>
      </div>
      <p className="archive-profile">{player.profile}</p>
      <a
        className="archive-draft-link"
        href={`/?archiveYear=${player.worldsYear}&archiveRegion=${encodeURIComponent(canonicalRegionFor(player))}`}
      >
        Usar este recorte no draft <ArrowRight size={12} />
      </a>
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
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get('q')?.slice(0, 60) ?? '',
  );
  useEffect(() => {
    const url = new URL(window.location.href);
    if (search) url.searchParams.set('q', search);
    else url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  }, [search]);
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
    const teams = archiveIndex.teams
      .filter((team) => archiveSlug(team.name).includes(term) || team.codes.some((code) => archiveSlug(code).includes(term)))
      .slice(0, 6)
      .map((team) => ({
        key: `team-${team.slug}`,
        title: team.name,
        detail: `Equipe · ${team.years.join(', ')}`,
        href: `/arquivo/equipe/${team.slug}`,
      }));
    return [...players, ...champions, ...teams].slice(0, 12);
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
          <span className="sr-only">Buscar jogador, campeão ou equipe</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar jogador, campeão ou equipe"
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
      <section className="archive-team-index" aria-labelledby="archive-teams-title">
        <span className="archive-kicker">63 IDENTIDADES HISTÓRICAS</span>
        <h2 id="archive-teams-title">Equipes no acervo.</h2>
        <div>
          {archiveIndex.teams.map((team) => (
            <a key={team.slug} href={`/arquivo/equipe/${team.slug}`}>
              <b>{team.name}</b>
              <span>{team.years.join(' · ')}</span>
              <small>{team.players.length} jogadores</small>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function EditionFilters({
  players,
  value,
  onChange,
}: {
  players: PlayerVersion[];
  value: ArchiveFilters;
  onChange: (filters: ArchiveFilters) => void;
}) {
  const teams = [...new Map(players.map((player) => [archiveSlug(player.teamName ?? player.team), player.teamName ?? player.team])).entries()]
    .sort((left, right) => left[1].localeCompare(right[1], 'pt-BR'));
  const regions = [...new Set(players.map(canonicalRegionFor))].sort();
  return (
    <section className="archive-filters" aria-label="Filtrar versões do acervo">
      <span><SlidersHorizontal size={16} /> FILTRAR E ORDENAR</span>
      <label>
        Posição
        <select value={value.role} onChange={(event) => onChange({ ...value, role: event.target.value as ArchiveFilters['role'] })}>
          <option value="ALL">Todas</option>
          {Object.entries(roleNames).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
        </select>
      </label>
      <label>
        Equipe
        <select value={value.team} onChange={(event) => onChange({ ...value, team: event.target.value })}>
          <option value="">Todas</option>
          {teams.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
      </label>
      <label>
        Região
        <select value={value.region} onChange={(event) => onChange({ ...value, region: event.target.value })}>
          <option value="">Todas</option>
          {regions.map((region) => <option key={region} value={region}>{region}</option>)}
        </select>
      </label>
      <label>
        Ordem
        <select value={value.sort} onChange={(event) => onChange({ ...value, sort: event.target.value as ArchiveFilters['sort'] })}>
          <option value="name">Nome</option>
          <option value="rating-desc">Maior rating médio</option>
          <option value="rating-asc">Menor rating médio</option>
        </select>
      </label>
      <button type="button" onClick={() => onChange(DEFAULT_ARCHIVE_FILTERS)}>
        <RotateCcw size={14} /> Limpar
      </button>
    </section>
  );
}

function PlayerComparison({ players }: { players: PlayerVersion[] }) {
  const sorted = [...players].sort((left, right) => left.worldsYear - right.worldsYear);
  const params = new URLSearchParams(window.location.search);
  const requestedLeft = Number(params.get('de'));
  const requestedRight = Number(params.get('para'));
  const defaultLeft = sorted[0]?.worldsYear;
  const defaultRight = sorted[sorted.length - 1]?.worldsYear;
  const [years, setYears] = useState<[number, number]>([
    sorted.some((player) => player.worldsYear === requestedLeft) ? requestedLeft : defaultLeft,
    sorted.some((player) => player.worldsYear === requestedRight) ? requestedRight : defaultRight,
  ]);
  if (sorted.length < 2) return null;
  const selected = years.map((year) => sorted.find((player) => player.worldsYear === year)!);
  function select(index: 0 | 1, year: number) {
    const next: [number, number] = [...years] as [number, number];
    next[index] = year;
    setYears(next);
    const url = new URL(window.location.href);
    url.searchParams.set(index === 0 ? 'de' : 'para', String(year));
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  }
  return (
    <section className="archive-comparison" aria-labelledby="archive-comparison-title">
      <span className="archive-kicker"><GitCompareArrows size={14} /> COMPARAR VERSÕES</span>
      <h2 id="archive-comparison-title">A mesma lenda, em duas eras.</h2>
      <div className="archive-comparison-selects">
        {[0, 1].map((index) => (
          <label key={index}>
            {index === 0 ? 'De' : 'Para'}
            <select
              aria-label={index === 0 ? 'Versão inicial' : 'Versão final'}
              value={years[index]}
              onChange={(event) => select(index as 0 | 1, Number(event.target.value))}
            >
              {sorted.map((player) => <option key={player.worldsYear} value={player.worldsYear}>{player.worldsYear} · {player.team}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="archive-comparison-cards">
        {selected.map((player) => (
          <article key={player.id}>
            <strong>{player.worldsYear}</strong>
            <h3>{player.teamName ?? player.team}</h3>
            <p>Rating médio <b>{averagePlayerRating(player).toFixed(1)}</b></p>
            <small>{player.championPool.map((slot) => repository.catalog.champions[slot.championId]?.name ?? slot.championId).join(' · ')}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ArchiveApp() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(() => parseArchiveFilters(new URLSearchParams(window.location.search)));
  const playerIndex =
    route.kind === 'player'
      ? archiveIndex.players.find((player) => player.slug === route.slug)
      : undefined;
  const championIndex =
    route.kind === 'champion'
      ? archiveIndex.champions.find((champion) => champion.id === route.id)
      : undefined;
  const teamIndex =
    route.kind === 'team'
      ? archiveIndex.teams.find((team) => team.slug === route.slug)
      : undefined;
  const years =
    route.kind === 'edition'
      ? archiveIndex.years.some((entry) => entry.year === route.year)
        ? [route.year]
        : []
      : (playerIndex?.years ?? championIndex?.years ?? teamIndex?.years ?? []);

  useEffect(() => {
    if (route.kind !== 'edition') return;
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${archiveFilterSearch(filters)}`,
    );
  }, [filters]);

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
          : route.kind === 'team'
            ? teamIndex!.name
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
    if (route.kind === 'team')
      return data.players.filter(
        (player) => archiveSlug(player.teamName ?? player.team) === route.slug,
      );
    return [];
  }, [data]);

  const visiblePlayers = useMemo(
    () => (route.kind === 'edition' ? filterArchivePlayers(players, filters) : players),
    [players, filters],
  );

  const pageTitle =
    route.kind === 'edition'
      ? `Worlds ${route.year}`
      : route.kind === 'player'
        ? playerIndex?.name
        : route.kind === 'team'
          ? teamIndex?.name
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
                    : route.kind === 'team'
                      ? 'EQUIPE HISTÓRICA'
                      : 'CAMPEÃO NO ACERVO'}
              </span>
              <h1>{pageTitle}</h1>
              <p>
                {visiblePlayers.length}{' '}
                {visiblePlayers.length === 1 ? 'versão encontrada' : 'versões encontradas'}
                {' · '}dados e fontes carregados apenas para {years.join(', ')}.
              </p>
              {years.length > 0 && (
                <a
                  className="archive-heading-draft-link"
                  href={`/?archiveYear=${years[years.length - 1]}${teamIndex?.regions[0] ? `&archiveRegion=${encodeURIComponent(teamIndex.regions[0])}` : ''}`}
                >
                  Levar este recorte ao draft <ArrowRight size={15} />
                </a>
              )}
            </section>
            {route.kind === 'edition' && (
              <EditionFilters players={players} value={filters} onChange={setFilters} />
            )}
            {route.kind === 'player' && <PlayerComparison players={players} />}
            <section className="archive-player-grid" aria-label={`Versões de ${pageTitle}`}>
              {visiblePlayers.map((player) => (
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
