import { mkdir, writeFile } from 'node:fs/promises';
import { champions } from '../src/data/champions.ts';
const ids = Object.keys(champions);
await mkdir('public/assets/champions', { recursive: true });
await mkdir('public/assets/splash', { recursive: true });
const tasks = ids.flatMap((id) => [
  [
    `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${id}.png`,
    `public/assets/champions/${id}.png`,
  ],
  [
    `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`,
    `public/assets/splash/${id}.jpg`,
  ],
]);
let failed = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (tasks.length) {
      const [url, path] = tasks.shift();
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status}`);
        await writeFile(path, Buffer.from(await response.arrayBuffer()));
      } catch (e) {
        failed++;
        console.error(path, e.message);
      }
    }
  }),
);
console.log(`${ids.length} champions downloaded; ${failed} errors`);
if (failed) process.exitCode = 1;
