// Synchronise les publications de la page Facebook de CRM vers data/journal.json
// puis télécharge les photos dans src/assets/journal/ (pour que Google les indexe et
// qu'elles ne dépendent pas des URL temporaires de Facebook).
//
// Prérequis (une seule fois, avec Cyril) : un « Page Access Token » longue durée pour sa page,
// obtenu via une app Meta (developers.facebook.com) avec les permissions pages_read_engagement
// et pages_read_user_content. Stocké en secret GitHub : FB_PAGE_TOKEN, et FB_PAGE_ID.
//
// Usage : FB_PAGE_ID=... FB_PAGE_TOKEN=... node scripts/sync-facebook.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const { FB_PAGE_ID, FB_PAGE_TOKEN } = process.env;
if (!FB_PAGE_ID || !FB_PAGE_TOKEN) { console.error('FB_PAGE_ID et FB_PAGE_TOKEN requis'); process.exit(1); }

const metiers = JSON.parse(readFileSync(join(ROOT, 'data/metiers.json'), 'utf8'));
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Classement automatique par métier à partir des mots-clés de data/metiers.json
const classer = texte => {
  const t = norm(texte);
  return metiers.filter(m => m.motsCles.some(k => t.includes(norm(k)))).map(m => m.slug);
};

const fields = 'id,message,created_time,permalink_url,full_picture,attachments{media,subattachments{media}}';
const url = `https://graph.facebook.com/v21.0/${FB_PAGE_ID}/posts?fields=${encodeURIComponent(fields)}&limit=50&access_token=${FB_PAGE_TOKEN}`;
const res = await fetch(url);
if (!res.ok) { console.error('Erreur Graph API', res.status, await res.text()); process.exit(1); }
const { data = [] } = await res.json();

const imgDir = join(ROOT, 'src/assets/journal');
mkdirSync(imgDir, { recursive: true });

const posts = [];
for (const p of data) {
  if (!p.message && !p.full_picture) continue;
  const srcs = [];
  const att = p.attachments?.data?.[0];
  for (const s of att?.subattachments?.data || []) if (s.media?.image?.src) srcs.push(s.media.image.src);
  if (!srcs.length && p.full_picture) srcs.push(p.full_picture);

  const images = [];
  for (const [i, src] of srcs.slice(0, 4).entries()) {
    const name = `${p.id.replace(/\W/g, '_')}_${i}.jpg`, file = join(imgDir, name);
    if (!existsSync(file)) {
      const r = await fetch(src);
      if (r.ok) writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    }
    if (existsSync(file)) images.push(`/assets/journal/${name}`);
  }
  posts.push({
    id: p.id, date: p.created_time.slice(0, 10), texte: (p.message || '').trim(),
    images, lien: p.permalink_url || '', metiers: classer(p.message || '')
  });
}

writeFileSync(join(ROOT, 'data/journal.json'), JSON.stringify({ derniereSynchro: new Date().toISOString(), posts }, null, 2) + '\n');
console.log(`✓ ${posts.length} publications synchronisées`);
