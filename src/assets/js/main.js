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
  // Apparitions au défilement : titres qui se dévoilent, photos en rideau, grilles en cascade
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('main h2').forEach(h => { if (!h.closest('.hero, .page-hero, .cta')) h.classList.add('rv-h'); });
    document.querySelectorAll('.w .ph, .story-ph, .pool-ph a, .strip a, .fig').forEach(p => p.classList.add('rv-img'));
    document.querySelectorAll('.index, .works, .steps, .points, .trades, .strip, .towns, .journal, .quotes, .bax-list, .ticks, .stories').forEach(g =>
      [...g.children].forEach((c, i) => { c.style.setProperty('--d', Math.min(i, 8) * 90 + 'ms'); if (!c.classList.contains('reveal') && !c.classList.contains('rv-img')) c.classList.add('rv-c'); }));
  }
  const els = document.querySelectorAll('.reveal, .rv-h, .rv-img, .rv-c');
  const show = el => { el.classList.add('in'); if (el.classList.contains('rv-img')) setTimeout(() => el.classList.remove('rv-img', 'in'), 2200 + (parseInt(el.style.getPropertyValue('--d')) || 0)); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  } else els.forEach(show);

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

  // Avant / après géant : choix du chantier + balayage de démonstration à la première apparition
  const bax = document.querySelector('.bax-ba');
  if (bax) {
    const range = bax.querySelector('input'), before = bax.querySelector('.bimg'), after = bax.querySelector('.after-img img');
    const srcset = p => p.startsWith('/assets/photos/') ? `${p.replace('.jpg', '-800.jpg')} 800w, ${p} 1600w` : '';
    const setV = v => { range.value = v; range.dispatchEvent(new Event('input')); };
    let sweeping = false;
    const sweep = () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      sweeping = true; const t0 = performance.now(), D = 2400;
      const keys = [50, 18, 82, 50];
      const step = now => {
        if (!sweeping) return;
        const p = Math.min(1, (now - t0) / D), seg = Math.min(2, Math.floor(p * 3)), lp = p * 3 - seg;
        const e = lp < .5 ? 2 * lp * lp : 1 - Math.pow(-2 * lp + 2, 2) / 2;
        setV(keys[seg] + (keys[seg + 1] - keys[seg]) * e);
        if (p < 1) requestAnimationFrame(step); else sweeping = false;
      };
      requestAnimationFrame(step);
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => range.addEventListener(ev, () => { sweeping = false; }, { passive: true }));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); setTimeout(sweep, 500); } }, { threshold: .55 });
      io.observe(bax);
    }
    document.querySelectorAll('.bax-list button').forEach(btn => btn.addEventListener('click', () => {
      if (btn.classList.contains('on')) return;
      document.querySelectorAll('.bax-list button').forEach(x => { x.classList.toggle('on', x === btn); x.setAttribute('aria-pressed', x === btn); });
      bax.classList.add('swap');
      const pre = [new Image(), new Image()]; let n = 0;
      const done = () => { if (++n < 2) return;
        before.src = btn.dataset.avant; before.srcset = srcset(btn.dataset.avant); before.alt = 'Avant : ' + btn.dataset.titre;
        after.src = btn.dataset.apres; after.srcset = srcset(btn.dataset.apres); after.alt = 'Après : ' + btn.dataset.titre;
        setV(50); setTimeout(() => { bax.classList.remove('swap'); setTimeout(sweep, 350); }, 60);
      };
      pre[0].onload = pre[0].onerror = done; pre[1].onload = pre[1].onerror = done;
      pre[0].src = btn.dataset.avant; pre[1].src = btn.dataset.apres;
    }));
  }

  // Vérificateur : « votre commune est-elle dans notre secteur ? » (base adresse nationale, geo.api.gouv.fr)
  document.querySelectorAll('.zcheck').forEach(f => {
    const inp = f.querySelector('input'), ul = f.querySelector('.zc-sugg'), res = f.querySelector('.zc-res');
    const B = { lat: +f.dataset.lat, lng: +f.dataset.lng }, R = +f.dataset.r, pages = JSON.parse(f.dataset.pages || '{}');
    const km = (la, lo) => { const r = Math.PI / 180, a = Math.sin((la - B.lat) * r / 2) ** 2 + Math.cos(B.lat * r) * Math.cos(la * r) * Math.sin((lo - B.lng) * r / 2) ** 2; return Math.round(12742 * Math.asin(Math.sqrt(a))); };
    let list = [], sel = -1, timer, ctrl;
    const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-']/g, ' ').trim();
    const rank = (c, q) => norm(c.nom) === norm(q) ? 0 : norm(c.nom).startsWith(norm(q)) && km(c.lat, c.lng) <= R + 15 ? 1 : 2;
    const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const close = () => { ul.hidden = true; sel = -1; inp.setAttribute('aria-expanded', 'false'); };
    const show = c => {
      close(); inp.value = c.nom; const d = km(c.lat, c.lng), page = pages[c.nom];
      const tel = `<a href="tel:${f.dataset.tel}">${f.dataset.telAff}</a>`;
      if (d <= R) { res.className = 'zc-res ok'; res.innerHTML = `<b>Oui !</b> ${esc(c.nom)} est à environ ${d} km de Quissac : nous intervenons chez vous. ${page ? `<a href="${page}">Nos travaux à ${esc(c.nom)}</a> · ` : ''}<a href="/contact/">Demander un devis</a>`; }
      else if (d <= R + 15) { res.className = 'zc-res lim'; res.innerHTML = `${esc(c.nom)} est à environ ${d} km, en limite de notre secteur. Appelez-nous au ${tel} : selon le projet, nous pouvons venir.`; }
      else { res.className = 'zc-res out'; res.innerHTML = `${esc(c.nom)} est à environ ${d} km de Quissac, en dehors de notre secteur de ${R} km. Pour un projet important, appelez-nous quand même au ${tel}.`; }
    };
    const render = () => {
      ul.innerHTML = list.map((c, i) => `<li role="option" aria-selected="${i === sel}" data-i="${i}">${esc(c.nom)}<span>${c.cp} · ${km(c.lat, c.lng)} km</span></li>`).join('');
      ul.hidden = !list.length; inp.setAttribute('aria-expanded', String(!!list.length));
    };
    const search = async q => {
      if (ctrl) ctrl.abort(); ctrl = new AbortController();
      try {
        const r = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&codeRegion=76&fields=nom,centre,codesPostaux&boost=population&limit=8`, { signal: ctrl.signal });
        const data = await r.json();
        list = data.filter(c => c.centre).map(c => ({ nom: c.nom, cp: (c.codesPostaux || [''])[0], lat: c.centre.coordinates[1], lng: c.centre.coordinates[0] }))
          .sort((a, b) => rank(a, q) - rank(b, q) || km(a.lat, a.lng) - km(b.lat, b.lng)).slice(0, 6);
        sel = -1; render();
        if (!list.length) { res.className = 'zc-res out'; res.textContent = 'Aucune commune trouvée. Vérifiez l’orthographe, ou appelez-nous.'; }
      } catch (e) { if (e.name !== 'AbortError') { res.className = 'zc-res out'; res.innerHTML = `Recherche indisponible pour le moment : appelez-nous au <a href="tel:${f.dataset.tel}">${f.dataset.telAff}</a>.`; } }
    };
    inp.addEventListener('input', () => { clearTimeout(timer); res.className = 'zc-res'; res.textContent = ''; const q = inp.value.trim(); if (q.length < 2) { list = []; render(); return; } timer = setTimeout(() => search(q), 220); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' && list.length) { e.preventDefault(); sel = (sel + 1) % list.length; render(); }
      else if (e.key === 'ArrowUp' && list.length) { e.preventDefault(); sel = (sel - 1 + list.length) % list.length; render(); }
      else if (e.key === 'Escape') close();
    });
    ul.addEventListener('mousedown', e => { const li = e.target.closest('li'); if (li) { e.preventDefault(); show(list[+li.dataset.i]); } });
    f.addEventListener('submit', async e => { e.preventDefault(); if (sel >= 0) return show(list[sel]); if (!list.length && inp.value.trim().length > 1) await search(inp.value.trim()); if (list.length) show(list[0]); });
    inp.addEventListener('blur', () => setTimeout(close, 150));
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
