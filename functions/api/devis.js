// Cloudflare Pages Function : POST /api/devis
// Envoie la demande de devis par e-mail via Resend (resend.com, offre gratuite suffisante).
// Variables d'environnement à définir dans Cloudflare Pages > Settings > Environment variables :
//   RESEND_API_KEY  (secret)    clé API Resend
//   MAIL_TO                     adresse de Cyril qui reçoit les demandes
//   MAIL_FROM                   ex. "Site CRM <devis@crm-maconnerie.fr>" (domaine vérifié dans Resend)

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'format' }, 400); }

  if (d.site_web) return json({ ok: true }); // pot de miel anti-robots
  const nom = String(d.nom || '').trim().slice(0, 120);
  const tel = String(d.tel || '').trim().slice(0, 40);
  const message = String(d.message || '').trim().slice(0, 5000);
  if (!nom || !tel || !message || !d.rgpd) return json({ ok: false, error: 'champs' }, 422);

  const lignes = [
    ['Nom', nom], ['Téléphone', tel], ['E-mail', d.email], ['Commune', d.commune],
    ['Travaux', d.travaux], ['Délai', d.delai], ['Projet', message]
  ];
  const html = `<h2>Nouvelle demande de devis</h2><table cellpadding="6">${lignes.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v || '—').replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM, to: [env.MAIL_TO],
      reply_to: d.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email) ? d.email : undefined,
      subject: `Devis : ${d.travaux || 'travaux'} — ${d.commune || ''} (${nom})`,
      html
    })
  });
  if (!r.ok) return json({ ok: false, error: 'envoi' }, 502);
  return json({ ok: true });
}
