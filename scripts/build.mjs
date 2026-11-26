import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateData } from '../generator.js';
import { validatePlanetData } from '../planets.js';
const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
validateData(JSON.parse(await readFile(new URL('data/WN_TAGS_PL_v2.json', root), 'utf8')));
validatePlanetData(JSON.parse(await readFile(new URL('data/PLANET_NAMES_PL.json', root), 'utf8')));
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await mkdir(new URL('data/', out));
for (const file of ['index.html', 'styles.css', 'app.js', 'generator.js', 'ui.js', 'planets.js', 'planet-ui.js', 'uwp.js', 'uwp-data.js', 'uwp-levels.js', 'uwp-ui.js', 'favicon.svg', 'data/WN_TAGS_PL_v2.json', 'data/PLANET_NAMES_PL.json']) {
  await cp(new URL(file, root), new URL(file, out), { recursive: true });
}
console.log(`Gotowa strona: ${fileURLToPath(out)}`);
