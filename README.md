# crm-maconnerie.fr — site de CRM Maçonnerie Générale

Site vitrine de Cyril Rives, maçon à Quissac (Gard). Offre **Clé en main**, réalisée par Hélion.

Site statique généré par `build.mjs` (Node 18+, aucune dépendance) → dossier `dist/`.
Hébergement Cloudflare Pages, formulaire via Pages Function + Resend, journal de chantier synchronisé avec Facebook par une GitHub Action.

## Structure

```
data/            ← tout le contenu (textes, coordonnées, réalisations, journal, articles)
  site.json        coordonnées, mentions légales  ⚠ valeurs [entre crochets] à remplacer
  metiers.json     6 pages métier (+ mots-clés de classement Facebook)
  communes.json    6 pages locales
  realisations.json  galerie (éditable par Cyril via Pages CMS)
  journal.json     écrit automatiquement par la synchro Facebook
  articles.json    2 articles conseils
src/assets/      CSS, JS, polices auto-hébergées (RGPD), images
functions/api/devis.js   envoi du formulaire de devis
scripts/sync-facebook.mjs + .github/workflows/sync-facebook.yml
.pages.yml       configuration de l'espace d'édition (Pages CMS)
```

Pages générées (25) : accueil, 6 métiers + index, réalisations, journal de chantier, zone + 6 communes, conseils + 2 articles, à propos, contact, mentions légales, confidentialité, 404. Plus `sitemap.xml`, `robots.txt`, `_headers`.

Aperçu local : `node build.mjs && npx serve dist` (ou `python3 -m http.server -d dist`).

## Mise en ligne (pas à pas)

### 1. Nom de domaine — au nom de Cyril
`crm-maconnerie.fr` était **libre** au 18/11/2026. Cloudflare ne vend pas de `.fr` : l'acheter chez **OVHcloud** (ou Gandi, IONOS), **titulaire = l'entreprise de Cyril** (SIRET), avec son e-mail. Prendre aussi `www`.

### 2. Dépôt GitHub
Créer le dépôt (ex. `crm-maconnerie`) et pousser ce dossier (sans `dist/`).

### 3. Cloudflare
1. Ajouter le site `crm-maconnerie.fr` à Cloudflare (offre Free) → Cloudflare donne 2 serveurs DNS.
2. Chez OVH : *Serveurs DNS* → remplacer par ceux de Cloudflare (propagation : quelques heures).
3. Workers & Pages → Create → Pages → connecter le dépôt GitHub.
   - Build command : `node build.mjs`
   - Build output directory : `dist`
4. Custom domains : ajouter `crm-maconnerie.fr` **et** `www.crm-maconnerie.fr`.
   Puis une *Redirect Rule* : `www.crm-maconnerie.fr/*` → `https://crm-maconnerie.fr/$1` (301).
5. Activer *Web Analytics* (sans cookie) sur le projet Pages.

Chaque push sur `main` redéploie le site en ~1 min.

### 4. Formulaire de devis (Resend)
1. Compte gratuit sur resend.com → *Domains* → ajouter `crm-maconnerie.fr` → copier les enregistrements DNS dans Cloudflare.
2. Créer une clé API.
3. Cloudflare Pages → Settings → Variables (Production) :
   - `RESEND_API_KEY` (secret), `MAIL_TO` = e-mail de Cyril, `MAIL_FROM` = `Site CRM <devis@crm-maconnerie.fr>`
4. Redéployer, puis tester le formulaire.

### 5. E-mail pro (facultatif)
Pour recevoir sur `contact@crm-maconnerie.fr` sans payer de boîte mail : Cloudflare → Email Routing → rediriger vers la boîte actuelle de Cyril.

### 6. Synchro Facebook → Journal de chantier
1. developers.facebook.com → créer une app (type *Business*) → ajouter *Facebook Login for Business*.
2. Avec le compte de Cyril (admin de la page), générer un **Page Access Token longue durée** avec `pages_read_engagement` et `pages_read_user_content` (Graph API Explorer → token utilisateur → échanger en token longue durée → `/me/accounts`).
3. GitHub → Settings → Secrets → Actions : `FB_PAGE_ID`, `FB_PAGE_TOKEN`.
4. Onglet Actions → « Synchro Facebook » → *Run workflow*. Ensuite c'est quotidien et automatique.
Le classement par métier utilise les `motsCles` de `data/metiers.json`.

### 7. Espace d'édition pour Cyril
app.pagescms.org → se connecter avec GitHub → ouvrir le dépôt. Cyril (invité comme collaborateur) peut ajouter une réalisation avec photos depuis son téléphone.

### 8. Référencement
- Google Search Console : ajouter le domaine (validation DNS dans Cloudflare) → soumettre `https://crm-maconnerie.fr/sitemap.xml`.
- Fiche **Google Business Profile** : même nom / adresse / téléphone que le site, lien vers le site, catégorie « Maçon ».
- Générer le lien « laisser un avis » + QR code pour la fin de chantier.

## À compléter avant la mise en ligne

- [ ] `data/site.json` : téléphone, e-mail, adresse, forme juridique, SIRET, RCS/RM, TVA, assurance décennale, années d'expérience, lien avis Google
- [ ] Médiateur de la consommation (mentions légales — obligatoire pour un artisan qui travaille avec des particuliers)
- [ ] Logo vectoriel définitif (`src/assets/img/logo.svg` est provisoire) + favicon
- [ ] Photos : remplacer les `placeholder-*.svg` (format paysage 4:3, ~1600 px, nommées `mur-cloture-quissac.jpg`…)
- [ ] Réalisations réelles (retirer `"exemple": true`), texte de la page À propos
- [ ] Valider avec Cyril : liste des 6 communes, rayon d'intervention (30 km), horaires, « rappel sous 48 h »
- [ ] Coordonnées Hélion dans les mentions légales si souhaité
