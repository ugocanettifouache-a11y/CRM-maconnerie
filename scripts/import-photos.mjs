// Télécharge une liste de photos ({ "dossier/nom.jpg": "url" }) depuis data/import-photos.json
// et data/import-sources.json. Lancé par le workflow « Import photos ».
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const lists = [['data/import-photos.json', 'src/assets/realisations/'], ['data/import-sources.json', 'sources/facebook/']];
for (const [file, base] of lists) {
  if (!existsSync(root + file)) continue;
  const list = JSON.parse(readFileSync(root + file, 'utf8'));
  let ok = 0;
  for (const [name, url] of Object.entries(list)) {
    const out = root + base + name;
    if (existsSync(out)) { ok++; continue; }
    mkdirSync(dirname(out), { recursive: true });
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) { console.error('échec', name, r.status); continue; }
    writeFileSync(out, Buffer.from(await r.arrayBuffer())); ok++;
  }
  console.log(`${file} : ${ok}/${Object.keys(list).length} présentes`);
}
