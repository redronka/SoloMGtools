import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateData } from '../generator.js';
const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
validateData(JSON.parse(await readFile(new URL('data/WN_TAGS_PL.json', root), 'utf8')));
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'generator.js', 'favicon.svg', 'data']) {
  await cp(new URL(file, root), new URL(file, out), { recursive: true });
}
console.log(`Gotowa strona: ${fileURLToPath(out)}`);
