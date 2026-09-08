import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/assets/players', { recursive: true });
const names = [
  'Huni',
  'Peanut',
  'Faker',
  'Bang',
  'Wolf',
  'CuVee',
  'Ambition',
  'Crown',
  'Ruler',
  'CoreJJ',
  'Khan',
  'Cuzz',
  'Bdd',
  'PraY',
  'GorillA',
  'Nuguri',
  'Canyon',
  'ShowMaker',
  'Ghost',
  'BeryL',
  'Doran',
  'Pyosik',
  'Chovy',
  'Deft',
  'Keria',
  'Rascal',
  'Clid',
  'Life',
  'Zeus',
  'Oner',
  'Gumayusi',
  'Peyz',
  'Delight',
  'Kiin',
  'Aiming',
  'Lehends',
];
const portraits = {};
const credits = [];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (names.length) {
      const name = names.shift();
      try {
        const url = `https://en.wikipedia.org/wiki/${name}_(gamer)`;
        const page = await fetch(url);
        if (!page.ok) continue;
        const html = await page.text();
        const match = html.match(
          /(?:https:)?\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"\s<>]+?\.(?:jpg|png|jpeg)/i,
        );
        if (!match) continue;
        const image = match[0].startsWith('https:') ? match[0] : `https:${match[0]}`;
        const response = await fetch(image);
        if (!response.ok) continue;
        await writeFile(
          `public/assets/players/${name}.jpg`,
          Buffer.from(await response.arrayBuffer()),
        );
        portraits[name] = `/assets/players/${name}.jpg`;
        credits.push({
          name,
          page: url,
          image,
          licensePage: image.replace(/.*\//, 'https://commons.wikimedia.org/wiki/File:'),
        });
      } catch (e) {
        console.log(name, e.message);
      }
    }
  }),
);
await writeFile('src/data/portraits.json', JSON.stringify(portraits, null, 2));
await writeFile('public/assets/portrait-credits.json', JSON.stringify(credits, null, 2));
console.log(`Downloaded ${Object.keys(portraits).length} portraits`);
