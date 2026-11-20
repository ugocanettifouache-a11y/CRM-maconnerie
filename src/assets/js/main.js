(() => {
  // Menu mobile
  const t = document.querySelector('.menu-toggle'), nav = document.getElementById('nav'), head = document.querySelector('.site-header');
  if (t && nav) t.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    t.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (head) head.classList.toggle('menu', open); solid();
  });

  // En-tête transparent sur le héros de l'accueil : devient blanc au défilement
  function solid() { if (head && head.classList.contains('over')) head.classList.toggle('solid', scrollY > 40 || head.classList.contains('menu')); }
  addEventListener('scroll', solid, { passive: true }); solid();

  // Héros : photos de chantier en fondu enchaîné
  const bg = document.querySelector('.hero-bg');
  if (bg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const imgs = [...bg.querySelectorAll('img')], bars = [...document.querySelectorAll('.hero-prog i')];
    const num = document.querySelector('.hero-prog .n'), cap = document.querySelector('.hero-cap');
    const first = { cap: cap ? cap.querySelector('b').textContent : '', lieu: cap ? cap.querySelector('span').textContent : '' };
    let cur = 0;
    const load = () => imgs.forEach(im => { if (im.dataset.src) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; delete im.dataset.src; } });
    if (document.readyState === 'complete') setTimeout(load, 400); else addEventListener('load', () => setTimeout(load, 400));
    const go = () => {
      if (document.hidden) return;
      const nx = (cur + 1) % imgs.length, im = imgs[nx];
      if (im.dataset.src || !im.complete || !im.naturalWidth) return;
      const old = imgs[cur]; old.classList.add('out');
      im.classList.remove('out'); im.classList.add('on');
      setTimeout(() => old.classList.remove('on', 'out'), 1900);
      bars.forEach((b, k) => { b.classList.toggle('on', k === nx); });
      if (num) num.textContent = String(nx + 1).padStart(2, '0');
      if (cap) { cap.classList.add('fade'); setTimeout(() => { cap.querySelector('b').textContent = nx ? im.dataset.cap : first.cap; cap.querySelector('span').textContent = nx ? im.dataset.lieu : first.lieu; cap.classList.remove('fade'); }, 600); }
      cur = nx;
    };
    if (imgs.length > 1) setInterval(go, 6500);
  }

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
      st.textContent = 'Merci ! Votre demande est bien partie. Nous vous rappelons rapidement.';
      st.classList.add('ok');
    } catch {
      st.innerHTML = 'L’envoi n’a pas abouti. Vous pouvez appeler directement ou écrire à <a href="mailto:' + form.dataset.mail + '">' + form.dataset.mail + '</a>.';
      st.classList.add('err');
    }
    btn.disabled = false; btn.textContent = 'Envoyer ma demande';
  });
})();

// Agrandissement des photos de chantier, avec navigation dans la galerie du projet
(() => {
  const imgs = document.querySelectorAll('.w .ph:not(.ba) > img, .w .ba .after-img img, .story-ph img, .fig img, .page-hero .ph img, .hero .ph img');
  if (!imgs.length) return;
  const box = document.createElement('div');
  box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.hidden = true;
  box.innerHTML = '<button class="lb-x" aria-label="Fermer">×</button><button class="lb-p" aria-label="Photo précédente">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-n" aria-label="Photo suivante">›</button>';
  document.body.appendChild(box);
  const im = box.querySelector('img'), cap = box.querySelector('figcaption'), prev = box.querySelector('.lb-p'), next = box.querySelector('.lb-n');
  let list = [], idx = 0, title = '';
  const show = () => { im.src = list[idx]; cap.textContent = title + (list.length > 1 ? `  ·  ${idx + 1} / ${list.length}` : ''); prev.hidden = next.hidden = list.length < 2; };
  const open = (srcs, start, t) => { list = srcs; idx = Math.max(0, start); title = t || ''; show(); box.hidden = false; document.body.style.overflow = 'hidden'; box.querySelector('.lb-x').focus(); };
  const close = () => { box.hidden = true; document.body.style.overflow = ''; };
  const step = d => { idx = (idx + d + list.length) % list.length; show(); };
  imgs.forEach(i => {
    i.style.cursor = 'zoom-in';
    i.addEventListener('click', e => {
      const card = i.closest('[data-gal]'); const src = i.getAttribute('src');
      if (card) { const g = JSON.parse(card.dataset.gal); open(g, g.indexOf(src), card.dataset.t); }
      else open([src], 0, i.alt);
    });
  });
  prev.addEventListener('click', e => { e.stopPropagation(); step(-1); });
  next.addEventListener('click', e => { e.stopPropagation(); step(1); });
  box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lb-x')) close(); });
  document.addEventListener('keydown', e => { if (box.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  let x0 = null; box.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
  box.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); x0 = null; });
})();
