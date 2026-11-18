// Télécharge une liste de photos (data/import-photos.json : { "nom-fichier.jpg": "url" })
// dans src/assets/realisations/. Lancé par le workflow « Import photos ».
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const list = JSON.parse(readFileSync(root + 'data/import-photos.json', 'utf8'));
let ok = 0;
for (const [name, url] of Object.entries(list)) {
  const file = root + 'src/assets/realisations/' + name;
  if (existsSync(file)) { ok++; continue; }
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) { console.error('échec', name, r.status); continue; }
  writeFileSync(file, Buffer.from(await r.arrayBuffer())); ok++; console.log('✓', name);
}
console.log(`${ok}/${Object.keys(list).length} photos présentes`);
