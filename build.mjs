// Générateur du site CRM Maçonnerie — aucune dépendance. Usage : node build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const OUT = join(ROOT, 'dist');
const load = f => JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'));
const S = load('site.json'), METIERS = load('metiers.json'), COMMUNES = load('communes.json');
const REAL = load('realisations.json'), JOURNAL = load('journal.json'), ARTICLES = load('articles.json');
const M = Object.fromEntries(METIERS.map(m => [m.slug, m]));
// Indexation Google : bloquée tant que la variable INDEXATION=on n'est pas définie dans Cloudflare
// (à activer le jour où crm-maconnerie.fr est branché).
const INDEX = process.env.INDEXATION === 'on';
import { createHash } from 'node:crypto';
const ver = f => createHash('sha1').update(readFileSync(join(ROOT, 'src', f))).digest('hex').slice(0, 8);
const V = { css: ver('assets/css/style.css'), js: ver('assets/js/main.js') };
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const pages = [];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isPlaceholder = v => /^\[.*\]$/.test(String(v || ''));
const frDate = d => new Date(d.length === 7 ? d + '-01' : d).toLocaleDateString('fr-FR', d.length === 7 ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' });

// ---------- Icônes ----------
const I = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  facade: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 22 24 7l18 15"/><path d="M10 19v22h28V19"/><path d="M16 26h6v6h-6zM26 26h6v6h-6z"/><path d="M21 41v-5h6v5"/></svg>',
  mur: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 14h40v26H4z"/><path d="M4 22.7h40M4 31.3h40M14 14v8.7M26 14v8.7M38 14v8.7M8 22.7v8.6M20 22.7v8.6M32 22.7v8.6M14 31.3V40M26 31.3V40M38 31.3V40"/><path d="M2 10h44"/></svg>',
  toit: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M3 26 24 9l21 17"/><path d="M8 30c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0 4-2 6 0"/><path d="M10 34v8h28v-8"/></svg>',
  terrasse: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 38 14 24h30L34 38z"/><path d="M21 24l-8 14M28 24l-6 14M9 31h30"/><path d="M30 8c0 6-6 8-6 14M30 8c-3 2-8 2-10 0"/></svg>',
  renovation: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M5 42V10h38v32"/><path d="M16 42V22h16v20"/><path d="M13 20h22" stroke-width="4"/><path d="M5 42h38"/></svg>',
  maison: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M3 24 17 12l14 12"/><path d="M7 21v19h20V21"/><path d="M27 28h17v12H27" stroke-dasharray="3 3"/><path d="M14 40v-8h6v8"/></svg>'
};
// ---------- Photos : les vraies photos Facebook remplacent les visuels provisoires dès la 1re synchro ----------
const REAL_POSTS = JOURNAL.posts.filter(p => !p.exemple && p.images?.length);
const FB_PHOTOS = REAL_POSTS.flatMap(p => p.images.map(src => ({ src, metiers: p.metiers || [], date: p.date })));
const PLACE = { 'murs-clotures': 'mur', 'enduits-facades': 'facade', 'toitures-genoises': 'toit', 'terrasses-exterieurs': 'terrasse', 'renovation': 'renovation', 'construction-extension': 'maison' };
const placeholder = slug => `/assets/img/placeholder-${PLACE[slug] || 'mur'}.svg`;
const used = new Set();
const ALL_PHOTOS = [...REAL.filter(r => !r.exemple).map(r => ({ src: r.image, metiers: [r.metier] })), ...FB_PHOTOS];
function photoFor(slug, i = 0) {
  const list = ALL_PHOTOS.filter(p => !slug || p.metiers.includes(slug));
  const pick = list[i % (list.length || 1)];
  return pick ? pick.src : placeholder(slug);
}
const HERO = S.heroImage || photoFor(null, 0) || placeholder('terrasses-exterieurs');

// ---------- Gabarit ----------
function layout({ path, title, desc, body, schema = [], image = '/assets/img/og.jpg', noindex = false }) {
  const url = S.url + path;
  const nav = [
    ['/metiers/', 'Métiers', METIERS.map(m => [`/metiers/${m.slug}/`, m.nom])],
    ['/realisations/', 'Réalisations'],
    ['/journal-de-chantier/', 'Journal'],
    ['/zone-intervention/', 'Secteur', COMMUNES.map(c => [`/zone-intervention/${c.slug}/`, `Maçon à ${c.nom}`])],
    ['/a-propos/', "L'artisan"],
  ];
  const cur = h => (path === h || (h !== '/' && path.startsWith(h))) ? ' aria-current="page"' : '';
  const navHtml = nav.map(([h, l, sub]) => sub
    ? `<div class="has-sub"><a href="${h}"${cur(h)}>${l}</a><div class="sub">${sub.map(([sh, sl]) => `<a href="${sh}">${esc(sl)}</a>`).join('')}</div></div>`
    : `<a href="${h}"${cur(h)}>${l}</a>`).join('');
  const ld = [localBusiness(), ...schema].map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add('js')</script>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${(noindex || !INDEX) ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${esc(S.nom)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${S.url}${image}">
<meta name="theme-color" content="#0B0B0C">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/fraunces-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/style.css?v=${V.css}">
${ld}
</head>
<body>
<a class="skip" href="#main">Aller au contenu</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${esc(S.nom)} — accueil"><img src="/assets/img/logo-h.svg" alt="CRM — Cyril Rives Maçonnerie générale" width="254" height="56"></a>
    <button class="menu-toggle" aria-expanded="false" aria-controls="nav" aria-label="Menu">${I.menu}</button>
    <nav class="nav" id="nav" aria-label="Navigation principale">
      ${navHtml}
      <a class="tel" href="tel:${S.telephoneLien}">${I.phone}${esc(S.telephone)}</a>
      <a class="btn btn-primary" href="/contact/">Devis gratuit</a>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
${footer()}
<div class="callbar">
  <a class="btn btn-line" href="tel:${S.telephoneLien}">${I.phone} Appeler</a>
  <a class="btn btn-primary" href="/contact/">Devis gratuit</a>
</div>
<script src="/assets/js/main.js?v=${V.js}" defer></script>
</body>
</html>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-logo">
        <img src="/assets/img/logo-h-blanc.svg" alt="CRM — Cyril Rives Maçonnerie générale" width="210" height="51" loading="lazy">
        <p style="max-width:32ch">${esc(S.slogan)}<br>Maçonnerie générale à ${esc(S.adresse.ville)} et dans le Gard.</p>
        <p><a href="${S.facebook}" rel="noopener" target="_blank" style="display:inline-flex;gap:10px;align-items:center"><span style="width:18px;display:inline-flex">${I.fb}</span>Les chantiers sur Facebook</a></p>
      </div>
      <div><h4>Métiers</h4><ul>${METIERS.map(m => `<li><a href="/metiers/${m.slug}/">${esc(m.nom)}</a></li>`).join('')}</ul></div>
      <div><h4>Secteur</h4><ul>${COMMUNES.map(c => `<li><a href="/zone-intervention/${c.slug}/">Maçon à ${esc(c.nom)}</a></li>`).join('')}</ul></div>
      <div><h4>Contact</h4><ul>
        <li><a href="tel:${S.telephoneLien}" style="font:500 1.3rem var(--serif);color:#fff">${esc(S.telephone)}</a></li>
        <li><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>
        <li>${esc(S.adresse.ville)} (${esc(S.adresse.codePostal)}), ${esc(S.adresse.departement)}</li>
        <li>${esc(S.horaires)}</li>
        <li style="margin-top:16px"><a href="/conseils/">Conseils travaux</a></li>
      </ul></div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} ${esc(S.nom)} · ${esc(S.dirigeant)}</span>
      <span><a href="/mentions-legales/">Mentions légales</a> · <a href="/confidentialite/">Confidentialité</a> · Site par <a href="${S.webmaster.url}" rel="noopener">${esc(S.webmaster.nom)}</a></span>
    </div>
  </div>
</footer>`;
}

// ---------- Données structurées ----------
function localBusiness() {
  const o = {
    '@context': 'https://schema.org', '@type': 'GeneralContractor', '@id': S.url + '/#entreprise',
    name: S.nom, url: S.url, logo: S.url + '/assets/img/logo.svg', image: S.url + '/assets/img/og.jpg',
    description: 'Maçon à Quissac (Gard) : murs de clôture, enduits de façade, terrasses, toitures et génoises, rénovation et extensions.',
    founder: { '@type': 'Person', name: S.dirigeant },
    address: { '@type': 'PostalAddress', postalCode: S.adresse.codePostal, addressLocality: S.adresse.ville, addressRegion: S.adresse.region, addressCountry: 'FR' },
    geo: { '@type': 'GeoCoordinates', latitude: S.adresse.lat, longitude: S.adresse.lng },
    areaServed: [...COMMUNES.map(c => ({ '@type': 'City', name: c.nom })), { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: S.adresse.lat, longitude: S.adresse.lng }, geoRadius: S.rayonKm * 1000 }],
    sameAs: [S.facebook],
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' }],
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Travaux de maçonnerie', itemListElement: METIERS.map(m => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: m.nom, url: `${S.url}/metiers/${m.slug}/` } })) }
  };
  if (!isPlaceholder(S.telephone)) o.telephone = S.telephoneLien;
  if (!isPlaceholder(S.email)) o.email = S.email;
  if (!isPlaceholder(S.adresse.rue)) o.address.streetAddress = S.adresse.rue;
  return o;
}
const crumbsLd = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: S.url + p })) });
const faqLd = faq => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.r } })) });

// ---------- Blocs ----------
const crumbs = items => `<nav class="crumbs" aria-label="Fil d'Ariane">${items.map(([n, p], i) => i < items.length - 1 ? `<a href="${p}">${esc(n)}</a> / ` : `<span aria-current="page">${esc(n)}</span>`).join('')}</nav>`;
const pageHero = ({ kicker, h1, lead, crumbItems, btns = true }) => `<section class="page-hero on-dark"><div class="wrap">
  ${crumbItems ? crumbs(crumbItems) : ''}<div class="eyebrow">${kicker}</div><h1>${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}
  ${btns ? `<div class="btns"><a class="btn btn-primary" href="/contact/">Demander un devis gratuit</a><a class="btn btn-line" href="tel:${S.telephoneLien}">${I.phone} ${esc(S.telephone)}</a></div>` : ''}
</div></section>`;
const cta = (titre = 'Parlons de votre <em>projet.</em>', texte = 'Visite et devis gratuits, sans engagement. Cyril vous rappelle sous 48 h.') => `<section class="cta on-dark"><div class="wrap">
  <div class="reveal"><div class="eyebrow">Devis gratuit</div><h2>${titre}</h2><p class="lead">${texte}</p></div>
  <div class="side reveal"><a class="tel-big" href="tel:${S.telephoneLien}">${esc(S.telephone)}</a><div class="btns"><a class="btn btn-primary" href="/contact/">Demander un devis ${I.arrow}</a></div></div>
</div></section>`;
const indexList = list => `<div class="index">${list.map(m => `<a href="/metiers/${m.slug}/" class="reveal"><h3>${esc(m.nom)}</h3><p>${esc(m.accroche)}</p><span class="go">${I.arrow}</span></a>`).join('')}</div>`;
const exBadge = o => o.exemple ? '<span class="badge ex">Exemple</span>' : '';
const realCard = (r, size = '') => {
  const img = (src, alt) => `<img src="${src}" alt="${esc(alt)}" loading="lazy" width="800" height="600">`;
  const ph = r.avant
    ? `<div class="ph ba">${exBadge(r)}${img(r.avant, `Avant : ${r.titre} à ${r.lieu}`)}<div class="after-img">${img(r.image, `Après : ${r.titre} à ${r.lieu}`)}</div><span class="lbl l">Avant</span><span class="lbl r">Après</span><div class="handle"></div><input type="range" min="0" max="100" value="50" aria-label="Comparer avant et après"></div>`
    : `<div class="ph">${exBadge(r)}${img(r.image, `${r.titre} à ${r.lieu}`)}</div>`;
  return `<article class="w ${size} reveal" data-m="${r.metier}">${ph}<div class="meta"><h3>${esc(r.titre)}</h3><span class="where">${esc(r.lieu)}</span></div><p>${esc(r.description)}</p></article>`;
};
const worksGrid = list => `<div class="works">${list.map((r, i) => realCard(r, list.length >= 3 && i === 0 ? 'big' : list.length >= 3 && i < 3 ? 'mid' : '')).join('')}</div>`;
const postCard = p => `<article class="post reveal" data-m="${(p.metiers || []).join(' ') || 'autre'}">
  ${p.images?.[0] ? `<div class="ph">${exBadge(p)}<img src="${esc(p.images[0])}" alt="Chantier du ${frDate(p.date)}" loading="lazy" width="800" height="800"></div>` : ''}
  <div class="body"><div class="date">${I.fb} ${frDate(p.date)}</div><p class="txt">${esc(p.texte).replace(/\n/g, '<br>')}</p>
  <div class="tags">${(p.metiers || []).map(s => M[s] ? `<a href="/metiers/${s}/">${esc(M[s].nom)}</a>` : '').join('')}${p.lien ? `<a href="${esc(p.lien)}" rel="noopener" target="_blank" style="color:var(--mute)">Voir sur Facebook ↗</a>` : ''}</div></div></article>`;
const filters = (id, slugs) => `<div class="filters" data-filters="${id}" role="group" aria-label="Filtrer par métier"><button data-f="all" aria-pressed="true">Tout voir</button>${slugs.map(s => `<button data-f="${s}" aria-pressed="false">${esc(M[s].nom)}</button>`).join('')}</div>`;
const towns = () => `<ul class="towns">${COMMUNES.map(c => `<li><a href="/zone-intervention/${c.slug}/">${esc(c.nom)}</a></li>`).join('')}</ul>`;
const house = (src, alt, cap) => `<figure class="house" style="margin:0"><div class="frame"><img src="${src}" alt="${esc(alt)}" width="1000" height="860" fetchpriority="high"></div>${cap ? `<figcaption class="cap"><b>${esc(cap[0])}</b>${esc(cap[1])}</figcaption>` : ''}</figure>`;
const posts = () => [...JOURNAL.posts].sort((a, b) => b.date.localeCompare(a.date));
const mapFrame = (bbox, title) => `<div class="map"><iframe title="${esc(title)}" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&amp;layer=mapnik&amp;marker=${S.adresse.lat}%2C${S.adresse.lng}"></iframe></div>`;
const trust = `<div class="trust"><span>${I.shield}Assurance décennale</span><span>${I.doc}Devis détaillé gratuit</span><span>${I.pin}Basé à ${esc(S.adresse.ville)}</span></div>`;
function add(path, opts) { pages.push({ path, ...opts }); }

// ---------- Accueil ----------
add('/', {
  title: 'Maçon à Quissac (Gard) — CRM Maçonnerie Générale, Cyril Rives',
  desc: 'CRM Maçonnerie Générale, maçon à Quissac : murs de clôture, enduits de façade, terrasses, toitures et génoises, rénovation, extensions. Devis gratuit dans le Gard.',
  body: `
<section class="hero">
  <div class="wrap">
    <div class="reveal">
      <div class="eyebrow">Maçonnerie générale · ${esc(S.adresse.ville)}, ${esc(S.adresse.departement)}</div>
      <h1>Bâtir juste,<br><em>bâtir pour durer.</em></h1>
      <p class="lead">Murs, façades, toitures, terrasses, rénovation : ${esc(S.dirigeant)} réalise vos travaux de maçonnerie avec l'exigence d'un artisan qui signe chaque chantier.</p>
      <div class="btns"><a class="btn btn-primary" href="/contact/">Demander un devis gratuit</a><a class="btn btn-line" href="tel:${S.telephoneLien}">${I.phone} ${esc(S.telephone)}</a></div>
      ${trust}
    </div>
    <div class="reveal">${house(HERO, 'Chantier réalisé par CRM Maçonnerie', ['Du sol au faîtage', 'Chaque chantier mené par Cyril, de A à Z'])}</div>
  </div>
</section>

<section class="section dark on-dark">
  <div class="wrap">
    <div class="head"><div><div class="eyebrow">Savoir-faire</div><h2>Toute la maçonnerie, <em>un seul artisan.</em></h2></div><a class="link" href="/metiers/">Tous les métiers ${I.arrow}</a></div>
    ${indexList(METIERS)}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="head"><div><div class="eyebrow">Réalisations</div><h2>Le travail, <em>en images.</em></h2></div><a class="link" href="/realisations/">Voir toutes les réalisations ${I.arrow}</a></div>
    ${worksGrid(REAL.slice(0, 3))}
  </div>
</section>

<section class="section paper">
  <div class="wrap split">
    <div class="reveal">${house(photoFor('renovation', 1), 'Cyril Rives sur un chantier', null)}</div>
    <div class="reveal">
      <div class="eyebrow">L'artisan</div>
      <h2>Un maçon du coin, <em>qui répond au téléphone.</em></h2>
      <p class="lead">${esc(S.dirigeant)} a fondé CRM à ${esc(S.adresse.ville)}. Pas de commercial, pas de sous-traitance à la chaîne : c'est lui qui vient voir votre projet, établit le devis et réalise les travaux.</p>
      <ul class="ticks"><li>Visite et devis détaillé gratuits</li><li>Assurance décennale fournie avec chaque devis</li><li>Chantier propre, délais annoncés et tenus</li><li>Des conseils honnêtes, même quand ça veut dire faire moins</li></ul>
      <a class="link" href="/a-propos/">Découvrir CRM ${I.arrow}</a>
    </div>
  </div>
</section>

<section class="section dark on-dark">
  <div class="wrap">
    <div class="head"><div><div class="eyebrow">Méthode</div><h2>Simple, du premier appel <em>à la réception.</em></h2></div></div>
    <div class="steps">
      <div class="step reveal"><h3>On se parle</h3><p>Vous appelez ou remplissez le formulaire. Cyril vous rappelle sous 48 h.</p></div>
      <div class="step reveal"><h3>Il vient voir</h3><p>Visite sur place : terrain, support, envies, contraintes. Gratuit.</p></div>
      <div class="step reveal"><h3>Devis clair</h3><p>Poste par poste, sans surprise, avec l'attestation décennale.</p></div>
      <div class="step reveal"><h3>Chantier</h3><p>Travaux dans les délais, chantier propre, réception ensemble.</p></div>
    </div>
  </div>
</section>

<section class="section paper">
  <div class="wrap">
    <div class="head"><div><div class="eyebrow">En direct de Facebook</div><h2>Journal <em>de chantier.</em></h2></div><a class="link" href="/journal-de-chantier/">Tout le journal ${I.arrow}</a><p class="lead">Chaque publication de Cyril sur Facebook arrive ici automatiquement.</p></div>
    <div class="journal">${posts().slice(0, 3).map(postCard).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="reveal"><div class="eyebrow">Secteur</div><h2>Autour de ${esc(S.adresse.ville)}, <em>à ${S.rayonKm} km à la ronde.</em></h2><p class="lead" style="margin-bottom:30px">Vallée du Vidourle, garrigue nîmoise, piémont cévenol : jusqu'à Nîmes, Alès, Lunel et le nord de Montpellier.</p>${towns()}</div>
    <div class="reveal">${mapFrame('3.35%2C43.55%2C4.65%2C44.27', "Carte du secteur d'intervention autour de Quissac")}</div>
  </div>
</section>
${cta()}`
});

// ---------- Métiers ----------
add('/metiers/', {
  title: 'Nos métiers de maçon dans le Gard | CRM Maçonnerie Générale',
  desc: 'Enduits de façade, murs de clôture, toitures et génoises, terrasses, rénovation, extensions : tous les travaux de maçonnerie de CRM à Quissac.',
  schema: [crumbsLd([['Accueil', '/'], ['Métiers', '/metiers/']])],
  body: pageHero({ kicker: 'Savoir-faire', h1: 'Six métiers, <em>une même exigence.</em>', lead: 'Chaque métier a ses règles. Voici ce que Cyril réalise pour les particuliers du Gard.', crumbItems: [['Accueil', '/'], ['Métiers', '/metiers/']] })
    + `<section class="section light"><div class="wrap">${indexList(METIERS)}</div></section>` + cta()
});

for (const m of METIERS) {
  const reals = REAL.filter(r => r.metier === m.slug);
  const villes = COMMUNES.filter(c => c.focus.includes(m.slug));
  const art = ARTICLES.filter(a => a.metier === m.slug);
  const items = [['Accueil', '/'], ['Métiers', '/metiers/'], [m.nom, `/metiers/${m.slug}/`]];
  add(`/metiers/${m.slug}/`, {
    title: m.metaTitle, desc: m.metaDesc,
    schema: [crumbsLd(items), faqLd(m.faq), { '@context': 'https://schema.org', '@type': 'Service', name: m.nom, serviceType: m.nom, provider: { '@id': S.url + '/#entreprise' }, areaServed: COMMUNES.map(c => c.nom) }],
    body: pageHero({ kicker: m.nom, h1: m.h1, lead: m.accroche, crumbItems: items }) + `
<section class="section"><div class="wrap split">
  <div class="reveal"><div class="eyebrow">Notre approche</div><h2>Bien fait, <em>fait pour durer.</em></h2><p class="lead">${esc(m.intro)}</p>
    <ul class="ticks">${m.prestations.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    <a class="btn btn-primary" href="/contact/">Demander un devis</a></div>
  <div class="reveal">${house(photoFor(m.slug, 0), `${m.nom} réalisé par CRM Maçonnerie`, null)}</div>
</div></section>
<section class="section paper"><div class="wrap"><div class="head"><div><div class="eyebrow">Engagements</div><h2>Ce qui fait <em>la différence.</em></h2></div></div>
  <div class="points">${m.points.map(p => `<div class="point reveal"><h3>${esc(p.titre)}</h3><p>${esc(p.texte)}</p></div>`).join('')}</div></div></section>
${reals.length ? `<section class="section"><div class="wrap"><div class="head"><div><div class="eyebrow">Réalisations</div><h2>Exemples <em>de chantiers.</em></h2></div><a class="link" href="/realisations/">Toutes les réalisations ${I.arrow}</a></div>${worksGrid(reals.slice(0, 3))}</div></section>` : ''}
<section class="section${reals.length ? ' paper' : ''}"><div class="wrap split" style="align-items:start">
  <div class="reveal"><div class="eyebrow">Questions fréquentes</div><h2>Vous vous <em>demandez…</em></h2>
    ${villes.length ? `<p class="lead" style="margin-top:12px">Très demandé à ${villes.map(c => `<a href="/zone-intervention/${c.slug}/">${esc(c.nom)}</a>`).join(', ')}.</p>` : ''}
    ${art.map(a => `<p style="margin-top:24px"><a class="link" href="/conseils/${a.slug}/">À lire : ${esc(a.titre)} ${I.arrow}</a></p>`).join('')}</div>
  <div class="faq reveal">${m.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.r)}</p></details>`).join('')}</div>
</div></section>
<section class="section dark on-dark"><div class="wrap"><div class="head"><div><div class="eyebrow">Aussi</div><h2>Nos autres <em>métiers.</em></h2></div></div>${indexList(METIERS.filter(x => x.slug !== m.slug))}</div></section>
${cta(`Votre projet de <em>${esc(m.court.toLowerCase())}</em> ?`)}`
  });
}

// ---------- Réalisations ----------
add('/realisations/', {
  title: 'Nos réalisations de maçonnerie dans le Gard | CRM Maçonnerie',
  desc: 'Murs, façades, terrasses, toitures, rénovations et extensions réalisés par CRM Maçonnerie autour de Quissac. Photos avant / après.',
  schema: [crumbsLd([['Accueil', '/'], ['Réalisations', '/realisations/']])],
  body: pageHero({ kicker: 'Réalisations', h1: 'Nos chantiers, <em>en images.</em>', lead: 'Une sélection de travaux réalisés dans le Gard. Faites glisser le curseur pour comparer avant et après.', crumbItems: [['Accueil', '/'], ['Réalisations', '/realisations/']], btns: false })
    + `<section class="section"><div class="wrap">${filters('reals', [...new Set(REAL.map(r => r.metier))])}<div class="works" id="reals">${REAL.map(r => realCard(r)).join('')}</div></div></section>` + cta()
});

// ---------- Journal ----------
const jp = posts();
add('/journal-de-chantier/', {
  title: 'Journal de chantier — les travaux en cours | CRM Maçonnerie',
  desc: 'Suivez les chantiers de CRM Maçonnerie Générale au fil des jours : murs, façades, terrasses et rénovations en cours dans le Gard.',
  schema: [crumbsLd([['Accueil', '/'], ['Journal de chantier', '/journal-de-chantier/']])],
  body: pageHero({ kicker: 'Journal de chantier', h1: 'Les chantiers, <em>au jour le jour.</em>', lead: 'Les publications de la page Facebook de CRM, rassemblées ici automatiquement et classées par métier.', crumbItems: [['Accueil', '/'], ['Journal de chantier', '/journal-de-chantier/']], btns: false })
    + `<section class="section paper"><div class="wrap">
  <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start">${filters('journal', METIERS.map(m => m.slug).filter(s => jp.some(p => (p.metiers || []).includes(s))))}
  <a class="btn btn-line" href="${S.facebook}" rel="noopener" target="_blank" style="margin-bottom:40px"><span style="width:18px;display:inline-flex;color:#1877F2">${I.fb}</span> Suivre sur Facebook</a></div>
  <div class="journal" id="journal">${jp.map(postCard).join('')}</div>
  ${JOURNAL.derniereSynchro ? `<p class="muted" style="font-size:.88rem;margin-top:28px">Dernière mise à jour : ${frDate(JOURNAL.derniereSynchro.slice(0, 10))}</p>` : ''}
</div></section>` + cta()
});

// ---------- Secteur ----------
add('/zone-intervention/', {
  title: "Zone d'intervention — maçon autour de Quissac | CRM Maçonnerie",
  desc: `CRM Maçonnerie intervient à Quissac, Sauve, Sommières, Lédignan, Saint-Hippolyte-du-Fort, Saint-Mamert-du-Gard et dans un rayon de ${S.rayonKm} km.`,
  schema: [crumbsLd([['Accueil', '/'], ["Zone d'intervention", '/zone-intervention/']])],
  body: pageHero({ kicker: "Zone d'intervention", h1: 'Du Vidourle <em>aux Cévennes.</em>', lead: `Basé à ${S.adresse.ville}, Cyril intervient dans un rayon d'environ ${S.rayonKm} km.`, crumbItems: [['Accueil', '/'], ["Zone d'intervention", '/zone-intervention/']] })
    + `<section class="section"><div class="wrap split" style="align-items:start">
  <div><div class="grid g2">${COMMUNES.map(c => `<a class="tile reveal" href="/zone-intervention/${c.slug}/"><span class="ico">${I.pin}</span><h3>Maçon à ${esc(c.nom)}</h3><p>${esc(c.accroche)}</p><span class="link">Voir ${I.arrow}</span></a>`).join('')}</div>
  <p class="muted" style="margin-top:28px">Votre commune n'est pas dans la liste ? Cyril intervient jusqu'à ${S.rayonKm} km autour de Quissac, de Nîmes à Alès et jusqu'au nord de Montpellier : appelez, il se déplace.</p></div>
  <div class="reveal" style="position:sticky;top:110px">${mapFrame('3.30%2C43.50%2C4.70%2C44.32', "Carte du secteur d'intervention")}</div>
</div></section>` + cta()
});

for (const c of COMMUNES) {
  const items = [['Accueil', '/'], ["Zone d'intervention", '/zone-intervention/'], [`Maçon à ${c.nom}`, `/zone-intervention/${c.slug}/`]];
  const fm = c.focus.map(s => M[s]);
  const reals = REAL.filter(r => r.lieu === c.nom).concat(REAL.filter(r => r.lieu !== c.nom && c.focus.includes(r.metier))).slice(0, 3);
  const realsAny = reals.length ? reals : REAL.slice(0, 3);
  add(`/zone-intervention/${c.slug}/`, {
    title: c.metaTitle, desc: c.metaDesc, schema: [crumbsLd(items)],
    body: pageHero({ kicker: `${c.nom} · ${c.cp}`, h1: `Votre maçon <em>à ${esc(c.nom)}.</em>`, lead: c.accroche, crumbItems: items }) + `
<section class="section"><div class="wrap split" style="align-items:start">
  <div class="reveal"><div class="eyebrow">Travaux à ${esc(c.nom)}</div>${c.texte.map(t => `<p class="lead" style="color:var(--ink)">${esc(t)}</p>`).join('')}
    <h3 style="margin-top:32px">Les demandes les plus fréquentes</h3>
    <ul class="ticks">${fm.map(m => `<li><a href="/metiers/${m.slug}/">${esc(m.nom)}</a> — ${esc(m.prestations.slice(0, 2).join(', ').toLowerCase())}</li>`).join('')}</ul>
    <p class="muted">Et tous les autres travaux : ${METIERS.filter(m => !c.focus.includes(m.slug)).map(m => `<a href="/metiers/${m.slug}/">${esc(m.nom.toLowerCase())}</a>`).join(', ')}.</p></div>
  <div class="contact-card reveal"><h3>Devis gratuit à ${esc(c.nom)}</h3><p style="color:var(--mute-d)">Cyril se déplace pour étudier votre projet sur place.</p>
    <div class="line">${I.phone}<div><b>Téléphone</b><a class="big" href="tel:${S.telephoneLien}">${esc(S.telephone)}</a></div></div>
    <div class="line">${I.clock}<div><b>Disponibilité</b>${esc(S.horaires)}</div></div>
    <div class="line">${I.pin}<div><b>Depuis</b>${esc(S.adresse.ville)} (${esc(S.adresse.codePostal)})</div></div>
    <a class="btn btn-primary" href="/contact/" style="width:100%;margin-top:18px">Demander un devis</a></div>
</div></section>
${realsAny.length ? `<section class="section paper"><div class="wrap"><div class="head"><div><div class="eyebrow">Réalisations</div><h2>Dans le <em>secteur.</em></h2></div></div>${worksGrid(realsAny)}</div></section>` : ''}
<section class="section"><div class="wrap"><div class="eyebrow">Communes voisines</div>${`<ul class="towns">${COMMUNES.filter(x => x.slug !== c.slug).map(x => `<li><a href="/zone-intervention/${x.slug}/">${esc(x.nom)}</a></li>`).join('')}</ul>`}</div></section>
${cta(`Un projet <em>à ${esc(c.nom)}</em> ?`)}`
  });
}

// ---------- Conseils ----------
add('/conseils/', {
  title: 'Conseils travaux de maçonnerie | CRM Maçonnerie Générale',
  desc: 'Les conseils de Cyril Rives, maçon à Quissac : enduits de façade, murs de clôture, terrasses… pour préparer vos travaux dans le Gard.',
  schema: [crumbsLd([['Accueil', '/'], ['Conseils', '/conseils/']])],
  body: pageHero({ kicker: 'Conseils', h1: 'Bien préparer <em>ses travaux.</em>', lead: "Les réponses d'un maçon aux questions qu'on lui pose le plus souvent.", crumbItems: [['Accueil', '/'], ['Conseils', '/conseils/']], btns: false })
    + `<section class="section"><div class="wrap"><div class="grid g3">${ARTICLES.map(a => `<a class="card reveal" href="/conseils/${a.slug}/"><div class="ph"><img src="${photoFor(a.metier, 2) || a.image}" alt="" loading="lazy" width="800" height="600"></div><div class="body"><span class="tag">${esc(M[a.metier].nom)}</span><h3>${esc(a.titre)}</h3><p>${esc(a.resume)}</p><span class="link">Lire ${I.arrow}</span></div></a>`).join('')}</div></div></section>` + cta()
});
for (const a of ARTICLES) {
  const items = [['Accueil', '/'], ['Conseils', '/conseils/'], [a.titre, `/conseils/${a.slug}/`]];
  add(`/conseils/${a.slug}/`, {
    title: `${a.titre} | CRM Maçonnerie`, desc: a.metaDesc,
    schema: [crumbsLd(items), { '@context': 'https://schema.org', '@type': 'Article', headline: a.titre, datePublished: a.date, dateModified: a.date, author: { '@type': 'Person', name: S.dirigeant }, publisher: { '@id': S.url + '/#entreprise' }, image: S.url + a.image, mainEntityOfPage: `${S.url}/conseils/${a.slug}/` }],
    body: pageHero({ kicker: `Conseils · ${M[a.metier].nom}`, h1: esc(a.titre), lead: esc(a.resume), crumbItems: items, btns: false }) + `
<section class="section"><div class="wrap"><article class="prose">
  <p class="muted" style="font-size:.92rem">Par ${esc(S.dirigeant)} · ${frDate(a.date)}</p>${a.corps}
  <p style="margin-top:40px"><a class="btn btn-primary" href="/metiers/${a.metier}/">${esc(M[a.metier].nom)} : nos prestations ${I.arrow}</a></p>
</article></div></section>${cta()}`
  });
}

// ---------- L'artisan ----------
add('/a-propos/', {
  title: 'À propos — Cyril Rives, maçon à Quissac | CRM Maçonnerie',
  desc: 'CRM Maçonnerie Générale, c’est Cyril Rives, artisan maçon installé à Quissac dans le Gard. Sa façon de travailler, ses engagements.',
  schema: [crumbsLd([['Accueil', '/'], ["L'artisan", '/a-propos/']])],
  body: pageHero({ kicker: "L'artisan", h1: 'CRM, <em>c’est Cyril Rives.</em>', lead: 'Un artisan maçon installé à Quissac, qui préfère les chantiers bien faits aux promesses.', crumbItems: [['Accueil', '/'], ["L'artisan", '/a-propos/']] }) + `
<section class="section"><div class="wrap split">
  <div class="reveal">${house(photoFor('renovation', 2), 'Cyril Rives sur un chantier', null)}</div>
  <div class="reveal"><div class="eyebrow">L'histoire</div><h2>Un métier appris <em>sur le terrain.</em></h2>
    <p class="notice">[À compléter avec Cyril : parcours, année de création, formation.]</p>
    <p class="lead" style="color:var(--ink)">Cyril Rives a créé CRM Maçonnerie Générale à Quissac pour proposer aux particuliers du Gard une maçonnerie soignée, avec un interlocuteur unique du devis à la réception.</p>
    <p class="lead">Sa clientèle s'est construite par le bouche-à-oreille : des voisins qui voient un mur terminé, des clients qui reviennent pour la terrasse après la façade.</p></div>
</div></section>
<section class="section paper"><div class="wrap"><div class="head"><div><div class="eyebrow">Engagements</div><h2>Ce que vous pouvez <em>attendre de CRM.</em></h2></div></div>
  <div class="points g4">
    <div class="point reveal"><h3>Un seul interlocuteur</h3><p>Cyril fait le devis et le chantier. Pas d'intermédiaire.</p></div>
    <div class="point reveal"><h3>Des devis clairs</h3><p>Poste par poste, sans ligne floue ni supplément surprise.</p></div>
    <div class="point reveal"><h3>Assuré et déclaré</h3><p>Assurance décennale et responsabilité civile professionnelle.</p></div>
    <div class="point reveal"><h3>Respect des lieux</h3><p>Abords protégés, chantier rangé, gravats évacués.</p></div>
  </div></div></section>${cta()}`
});

// ---------- Contact ----------
add('/contact/', {
  title: 'Contact et devis gratuit | CRM Maçonnerie Générale, Quissac',
  desc: 'Demandez un devis gratuit à CRM Maçonnerie Générale, maçon à Quissac : formulaire guidé, téléphone ou e-mail. Réponse sous 48 h.',
  schema: [crumbsLd([['Accueil', '/'], ['Contact', '/contact/']])],
  body: pageHero({ kicker: 'Contact', h1: 'Parlons de <em>votre projet.</em>', lead: 'Décrivez vos travaux en deux minutes : Cyril vous rappelle sous 48 h pour convenir d’une visite.', crumbItems: [['Accueil', '/'], ['Contact', '/contact/']], btns: false }) + `
<section class="section"><div class="wrap split" style="align-items:start;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)">
  <form class="form" id="devis" data-mail="${esc(S.email)}" novalidate>
    <h2 style="font-size:2rem">Demande de devis</h2>
    <fieldset class="chips"><legend class="legend">Quels travaux ? <small>(plusieurs choix possibles)</small></legend>
      ${METIERS.map(m => `<label><input type="checkbox" name="travaux" value="${esc(m.nom)}"><span>${esc(m.nom)}</span></label>`).join('')}
      <label><input type="checkbox" name="travaux" value="Autre"><span>Autre</span></label>
    </fieldset>
    <div class="row">
      <div class="field"><label for="commune">Commune du chantier</label><input id="commune" name="commune" list="communes" autocomplete="address-level2" required><datalist id="communes">${COMMUNES.map(c => `<option value="${esc(c.nom)}">`).join('')}</datalist></div>
      <div class="field"><label for="delai">Quand ?</label><select id="delai" name="delai"><option>Dès que possible</option><option>Dans les 3 mois</option><option>Dans l'année</option><option>Je me renseigne</option></select></div>
    </div>
    <div class="field"><label for="message">Votre projet</label><textarea id="message" name="message" placeholder="Ex. : mur de clôture de 25 m de long, environ 1,60 m de haut, enduit gratté…" required></textarea></div>
    <div class="row">
      <div class="field"><label for="nom">Nom</label><input id="nom" name="nom" autocomplete="name" required></div>
      <div class="field"><label for="tel">Téléphone</label><input id="tel" name="tel" type="tel" autocomplete="tel" required></div>
    </div>
    <div class="field"><label for="email">E-mail <small>(facultatif)</small></label><input id="email" name="email" type="email" autocomplete="email"></div>
    <input class="hp" type="text" name="site_web" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="consent"><input type="checkbox" name="rgpd" required><span>J'accepte que mes informations soient utilisées pour me recontacter au sujet de ma demande. <a href="/confidentialite/">En savoir plus</a></span></label>
    <div class="form-status" role="status" aria-live="polite"></div>
    <button class="btn btn-primary" type="submit" style="justify-self:start">Envoyer ma demande</button>
  </form>
  <div>
    <div class="contact-card">
      <h3>Joindre Cyril directement</h3>
      <div class="line">${I.phone}<div><b>Téléphone</b><a class="big" href="tel:${S.telephoneLien}">${esc(S.telephone)}</a></div></div>
      <div class="line">${I.mail}<div><b>E-mail</b><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></div></div>
      <div class="line">${I.pin}<div><b>Basé à</b>${esc(S.adresse.ville)} (${esc(S.adresse.codePostal)}), ${esc(S.adresse.departement)}</div></div>
      <div class="line">${I.clock}<div><b>Horaires</b>${esc(S.horaires)}</div></div>
      <div class="line"><span style="width:20px;display:inline-flex;color:#fff">${I.fb}</span><div><b>Facebook</b><a href="${S.facebook}" rel="noopener" target="_blank">Voir les chantiers en cours</a></div></div>
    </div>
    <div style="margin-top:20px">${mapFrame('3.90%2C43.86%2C4.10%2C43.96', 'Carte : Quissac')}</div>
  </div>
</div></section>`
});

// ---------- Légal ----------
const L = S.legal;
add('/mentions-legales/', {
  title: 'Mentions légales | CRM Maçonnerie Générale', desc: 'Mentions légales du site crm-maconnerie.fr.',
  body: pageHero({ kicker: 'Informations légales', h1: 'Mentions légales', btns: false }) + `
<section class="section"><div class="wrap prose legal">
  <h2>Éditeur du site</h2><p>${esc(S.nom)} — ${esc(L.formeJuridique)}${L.capital ? ', ' + esc(L.capital) : ''}<br>Dirigeant et directeur de la publication : ${esc(S.dirigeant)}<br>Adresse : ${esc(S.adresse.rue)}, ${esc(S.adresse.codePostal)} ${esc(S.adresse.ville)}<br>SIRET : ${esc(L.siret)} — ${esc(L.rcsOuRm)}<br>TVA : ${esc(L.tva)}<br>Téléphone : ${esc(S.telephone)} — E-mail : ${esc(S.email)}</p>
  <h2>Assurance professionnelle</h2><p>${esc(L.assuranceDecennale)}</p>
  <h2>Hébergement</h2><p>${esc(S.hebergeur)}</p>
  <h2>Conception et réalisation</h2><p>${esc(S.webmaster.nom)} — <a href="${S.webmaster.url}">${S.webmaster.url.replace('https://', '')}</a></p>
  <h2>Propriété intellectuelle</h2><p>Les textes, photographies et le logo de ce site sont la propriété de ${esc(S.nom)}. Toute reproduction sans autorisation est interdite.</p>
  <h2>Médiation de la consommation</h2><p>Conformément au Code de la consommation, le client peut recourir gratuitement à un médiateur de la consommation : [nom et coordonnées du médiateur auquel l'entreprise adhère].</p>
</div></section>`
});
add('/confidentialite/', {
  title: 'Politique de confidentialité | CRM Maçonnerie Générale', desc: 'Comment CRM Maçonnerie Générale traite vos données personnelles.',
  body: pageHero({ kicker: 'Vos données', h1: 'Politique de confidentialité', btns: false }) + `
<section class="section"><div class="wrap prose legal">
  <h2>Responsable du traitement</h2><p>${esc(S.nom)}, ${esc(S.dirigeant)} — ${esc(S.email)}</p>
  <h2>Données collectées</h2><p>Via le formulaire de devis : nom, téléphone, e-mail (facultatif), commune et description du projet. Ces données servent uniquement à vous recontacter et à établir un devis.</p>
  <h2>Base légale et durée</h2><p>Le traitement repose sur votre consentement et sur les mesures précontractuelles prises à votre demande. Les demandes sans suite sont supprimées au bout de 3 ans après le dernier contact ; les données des clients sont conservées le temps de la relation commerciale et des obligations légales.</p>
  <h2>Destinataires</h2><p>Vos données ne sont ni vendues ni cédées. Elles sont transmises par e-mail via un prestataire d'envoi technique, puis conservées par ${esc(S.nom)}.</p>
  <h2>Cookies et mesure d'audience</h2><p>Ce site ne dépose aucun cookie publicitaire. La mesure d'audience (Cloudflare Web Analytics) ne dépose pas de cookie et ne permet pas de vous identifier. Les cartes sont fournies par OpenStreetMap.</p>
  <h2>Vos droits</h2><p>Vous pouvez accéder à vos données, les rectifier, les supprimer ou vous opposer à leur traitement en écrivant à ${esc(S.email)}. Vous pouvez aussi saisir la CNIL (cnil.fr).</p>
</div></section>`
});
add('/404.html', {
  title: 'Page introuvable | CRM Maçonnerie', desc: 'Cette page n’existe pas ou plus.', noindex: true,
  body: pageHero({ kicker: 'Erreur 404', h1: 'Ce mur-là <em>n’existe pas encore.</em>', lead: 'La page demandée est introuvable.', btns: false }) + `<section class="section"><div class="wrap btns"><a class="btn btn-primary" href="/">Retour à l'accueil</a><a class="btn btn-line" href="/contact/">Contact</a></div></section>`
});


// ---------- Écriture ----------
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'src'), OUT, { recursive: true });
for (const p of pages) {
  const file = p.path.endsWith('.html') ? join(OUT, p.path) : join(OUT, p.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, layout(p));
}
const indexed = pages.filter(p => !p.noindex && !p.path.endsWith('.html'));
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed.map(p => `  <url><loc>${S.url}${p.path}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(OUT, 'robots.txt'), INDEX ? `User-agent: *\nAllow: /\n\nSitemap: ${S.url}/sitemap.xml\n` : `User-agent: *\nAllow: /\n`);
writeFileSync(join(OUT, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  X-Frame-Options: SAMEORIGIN\n/assets/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/*\n  Cache-Control: public, max-age=86400\n`);
console.log(`✓ ${pages.length} pages générées dans dist/ (${indexed.length} dans le sitemap) — indexation ${INDEX ? 'ACTIVÉE' : 'bloquée (INDEXATION≠on)'}`);
