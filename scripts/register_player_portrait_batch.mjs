import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifestPath = resolve(root, 'src/data/player-portraits.json');
const archivePath = resolve(root, 'src/data/archive-index.json');

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function portraitKey(value) {
  return value
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const batch = option('--batch');
const slugs = (option('--slugs') ?? '')
  .split(',')
  .map((slug) => slug.trim())
  .filter(Boolean);
const complete = process.argv.includes('--complete');

if (!batch || slugs.length === 0) {
  throw new Error('Usage: node scripts/register_player_portrait_batch.mjs --batch NN --slugs slug-a,slug-b [--complete]');
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const archive = JSON.parse(readFileSync(archivePath, 'utf8'));
const playersBySlug = new Map(archive.players.map((player) => [player.slug, player]));
const registered = new Set(manifest.entries.map((entry) => portraitKey(entry.playerName)));

for (const slug of slugs) {
  const player = playersBySlug.get(slug);
  if (!player) throw new Error(`Unknown archive player slug: ${slug}`);
  const key = portraitKey(player.name);
  if (registered.has(key)) {
    throw new Error(`Portrait identity already registered: ${player.name}`);
  }
  manifest.entries.push({
    playerKey: slug,
    playerName: player.name,
    portrait: `/assets/players/portraits/catalog-v2/${slug}.webp`,
    silhouette: `/assets/players/silhouettes/catalog-v2/${slug}.webp`,
    approval: 'approved',
    focus: { x: 50, y: 40 },
  });
  registered.add(key);
}

manifest.version = 'catalog-v2';
manifest.status = complete ? 'catalog_complete' : 'catalog_expanding';
manifest.generatedAt = new Date().toISOString().slice(0, 10);
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Registered batch ${batch}: ${slugs.length} identities; ${manifest.entries.length} total.`);
