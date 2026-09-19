import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const yearsDirectory = path.join(root, 'src', 'data', 'years');
const outputPath = path.join(root, 'src', 'data', 'archive-index.json');

const slug = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const files = (await readdir(yearsDirectory)).filter((file) => /^\d{4}\.json$/.test(file)).sort();
const playerMap = new Map();
const championMap = new Map();
const teamMap = new Map();
const years = [];

for (const file of files) {
  const year = Number(file.slice(0, 4));
  const players = JSON.parse(await readFile(path.join(yearsDirectory, file), 'utf8'));
  const teams = new Set();
  const champions = new Set();
  for (const player of players) {
    teams.add(player.team);
    const teamName = player.teamName ?? player.team;
    const teamSlug = slug(teamName);
    const currentTeam = teamMap.get(teamSlug) ?? {
      slug: teamSlug,
      name: teamName,
      years: [],
      codes: [],
      regions: [],
      players: [],
    };
    if (!currentTeam.years.includes(year)) currentTeam.years.push(year);
    if (!currentTeam.codes.includes(player.team)) currentTeam.codes.push(player.team);
    const region = player.canonicalRegion ?? player.historicalLeague ?? player.region;
    if (!currentTeam.regions.includes(region)) currentTeam.regions.push(region);
    const teamPlayerSlug = slug(player.playerName);
    if (!currentTeam.players.includes(teamPlayerSlug)) currentTeam.players.push(teamPlayerSlug);
    teamMap.set(teamSlug, currentTeam);
    const playerSlug = slug(player.playerName);
    const currentPlayer = playerMap.get(playerSlug) ?? {
      slug: playerSlug,
      name: player.playerName,
      years: [],
    };
    if (!currentPlayer.years.includes(year)) currentPlayer.years.push(year);
    playerMap.set(playerSlug, currentPlayer);
    for (const slot of player.championPool) {
      champions.add(slot.championId);
      const currentChampion = championMap.get(slot.championId) ?? {
        id: slot.championId,
        years: [],
        appearances: 0,
      };
      if (!currentChampion.years.includes(year)) currentChampion.years.push(year);
      currentChampion.appearances += 1;
      championMap.set(slot.championId, currentChampion);
    }
  }
  years.push({
    year,
    players: players.length,
    teams: teams.size,
    champions: champions.size,
  });
}

const sortYears = (entry) => ({ ...entry, years: entry.years.sort((a, b) => a - b) });
const index = {
  version: 2,
  years,
  players: [...playerMap.values()]
    .map(sortYears)
    .sort((a, b) => a.name.localeCompare(b.name, 'en')),
  champions: [...championMap.values()]
    .map(sortYears)
    .sort((a, b) => a.id.localeCompare(b.id, 'en')),
  teams: [...teamMap.values()]
    .map((entry) => ({
      ...sortYears(entry),
      codes: entry.codes.sort((a, b) => a.localeCompare(b, 'en')),
      regions: entry.regions.sort((a, b) => a.localeCompare(b, 'en')),
      players: entry.players.sort((a, b) => a.localeCompare(b, 'en')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en')),
};
const output = `${JSON.stringify(index, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== output) {
    console.error('Archive index is stale. Run npm run data:archive:build.');
    process.exitCode = 1;
  } else console.log('Archive index is current.');
} else {
  await writeFile(outputPath, output, 'utf8');
  console.log(
    `Archive index: ${years.length} years, ${index.players.length} players, ${index.champions.length} champions, ${index.teams.length} teams.`,
  );
}
