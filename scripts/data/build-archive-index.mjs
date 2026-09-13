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
const years = [];

for (const file of files) {
  const year = Number(file.slice(0, 4));
  const players = JSON.parse(await readFile(path.join(yearsDirectory, file), 'utf8'));
  const teams = new Set();
  const champions = new Set();
  for (const player of players) {
    teams.add(player.team);
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
  version: 1,
  years,
  players: [...playerMap.values()]
    .map(sortYears)
    .sort((a, b) => a.name.localeCompare(b.name, 'en')),
  champions: [...championMap.values()]
    .map(sortYears)
    .sort((a, b) => a.id.localeCompare(b.id, 'en')),
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
    `Archive index: ${years.length} years, ${index.players.length} players, ${index.champions.length} champions.`,
  );
}
