(() => {
  // Menu mobile
  const t = document.querySelector('.menu-toggle'), nav = document.getElementById('nav');
  if (t && nav) t.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    t.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Apparition au défilement
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));

  // Filtres (réalisations, journal)
  document.querySelectorAll('[data-filters]').forEach(group => {
    const target = document.getElementById(group.dataset.filters);
    group.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      group.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      const f = b.dataset.f;
      target.querySelectorAll('[data-m]').forEach(it => {
        it.hidden = !(f === 'all' || it.dataset.m.split(' ').includes(f));
      });
    });
  });

  // Avant / après
  document.querySelectorAll('.ba input').forEach(r => {
    const ba = r.closest('.ba'), a = ba.querySelector('.after-img'), h = ba.querySelector('.handle');
    const set = () => { a.style.clipPath = `inset(0 0 0 ${r.value}%)`; h.style.left = r.value + '%'; };
    r.addEventListener('input', set); set();
  });

  // Formulaire de devis
  const form = document.getElementById('devis');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const st = form.querySelector('.form-status'), btn = form.querySelector('[type=submit]');
    st.className = 'form-status'; btn.disabled = true; btn.textContent = 'Envoi…';
    const data = Object.fromEntries(new FormData(form));
    data.travaux = [...form.querySelectorAll('input[name=travaux]:checked')].map(i => i.value).join(', ');
    try {
      const r = await fetch('/api/devis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error();
      form.reset();
      st.textContent = 'Merci ! Votre demande est bien partie. Cyril vous rappelle rapidement.';
      st.classList.add('ok');
    } catch {
      st.innerHTML = 'L’envoi n’a pas abouti. Vous pouvez appeler directement ou écrire à <a href="mailto:' + form.dataset.mail + '">' + form.dataset.mail + '</a>.';
      st.classList.add('err');
    }
    btn.disabled = false; btn.textContent = 'Envoyer ma demande';
  });
})();
