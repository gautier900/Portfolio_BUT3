/* =========================================================
   Portfolio « Ma playlist » — interactions
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  };

  /* ---------- Mur de pochettes (fond de l'accueil) ---------- */
  // Pour afficher de vraies pochettes : déposer les images dans assets/albums/
  // (carrées, ~300 × 300 px, en .webp ou .jpg) puis lister leurs noms ici.
  // Tant que la liste est vide, des pochettes générées en CSS sont affichées.
  const ALBUMS = [
    'sade-best-of-sade.webp',
    'hamza-zombie-life-10-ans.webp',
    'ateyaba-ateyaba.webp',
    'ino-casablanca-extasiaaaaa.webp',
    'huntrill-le-bruit-de-la-machine-a-billets.webp',
    'linlin-disco-inferno.webp',
    'sch-a7.webp',
    'th-e-music.webp',
    'ledouble-fck-label-machine.webp',
    'sade-love-deluxe.webp',
    'asinine-doom.webp',
    'djuno-d.webp',
    'saki225-captain-freeza.webp',
    'ateyaba-delorean-music.webp',
    'jeune-morty-vol-1.webp',
    'bblowa-vol-1.webp',
    'cherry-pie-coup-d-etat.webp',
  ];

  const wall = $('.hero__wall');
  if (wall) {
    const hues = [275, 175, 320, 200, 245, 190, 295, 160];
    const ROWS = 6;
    const PER_ROW = 30; // assez large pour couvrir un écran 4K sans trou
    const frag = document.createDocumentFragment();

    const makeCover = (r, i) => {
      const c = document.createElement('span');
      if (ALBUMS.length) {
        // Décalage par rangée pour que deux rangées voisines ne se ressemblent pas
        const file = ALBUMS[(i + r * 7) % ALBUMS.length];
        c.className = 'wall-cover wall-cover--img';
        const img = document.createElement('img');
        img.src = `assets/albums/${file}`;
        img.alt = '';
        img.width = 160;
        img.height = 160;
        img.decoding = 'async';
        img.loading = 'eager'; // peu d'images distinctes, mises en cache par le navigateur
        // Image manquante : on retombe sur une pochette générée
        img.addEventListener('error', () => {
          img.remove();
          c.className = `wall-cover wall-cover--v${(i + r * 3) % 5}`;
          c.style.setProperty('--h', hues[(i * 3 + r * 5) % hues.length]);
        }, { once: true });
        c.appendChild(img);
      } else {
        c.className = `wall-cover wall-cover--v${(i + r * 3) % 5}`;
        c.style.setProperty('--h', hues[(i * 3 + r * 5) % hues.length]);
      }
      return c;
    };

    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement('div');
      row.className = 'wall-row';
      row.style.setProperty('--dur', `${80 + (r % 3) * 20}s`);
      const covers = [];
      for (let i = 0; i < PER_ROW; i++) covers.push(makeCover(r, i));
      // Rangée doublée pour une boucle sans raccord
      covers.forEach((c) => row.appendChild(c));
      covers.forEach((c, i) => row.appendChild(makeCover(r, i)));
      frag.appendChild(row);
    }
    wall.appendChild(frag);
  }

  /* ---------- Thème clair / sombre ---------- */
  const themeBtn = $('.theme-toggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
  const updateThemeLabel = () => {
    const next = currentTheme() === 'dark' ? 'clair' : 'sombre';
    themeBtn.setAttribute('aria-label', `Passer en thème ${next}`);
  };
  // Barre du navigateur (mobile) de la même couleur que le fond de la page
  const themeMetas = $$('meta[name="theme-color"]');
  const syncThemeColor = () => {
    if (!root.dataset.theme) return; // pas de choix manuel : les balises suivent déjà le système
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    themeMetas.forEach((m) => m.setAttribute('content', bg));
  };
  const applyTheme = (next) => {
    root.dataset.theme = next;
    store.set('theme', next);
    updateThemeLabel();
    syncThemeColor();
  };
  // Le nouveau thème se dévoile en cercle depuis le bouton (View Transitions,
  // inspiré de l'Animated Theme Toggler de Magic UI). Sans l'API ou en mouvement
  // réduit : changement immédiat.
  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reducedMotion) { applyTheme(next); return; }
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('is-theme-switching');
    const transition = document.startViewTransition(() => applyTheme(next));
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.2, .7, .2, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
    transition.finished.finally(() => root.classList.remove('is-theme-switching'));
  });
  updateThemeLabel();
  syncThemeColor();

  /* ---------- Menu mobile ---------- */
  const menuBtn = $('.menu-toggle');
  const nav = $('#menu');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.sr-only', menuBtn).textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
    nav.classList.toggle('is-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('.nav__link').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });

  /* ---------- Sections = pistes ---------- */
  const sections = $$('main > section[id]');
  const navLinks = $$('.nav__link');
  // Zone annoncée aux lecteurs d'écran (texte brut) et titre visible (animé par js/effects.js)
  const playerTitle = $('.player__live');
  const playerTitleVis = $('.player__title-vis');
  const playerCover = $('.player__cover');
  let current = 0;

  const setCurrent = (i) => {
    if (i === current && playerTitle.textContent) return;
    current = i;
    const s = sections[i];
    const n = String(i).padStart(2, '0');
    const label = i === 0 ? s.dataset.track : `${n} · ${s.dataset.track}`;
    playerTitle.textContent = label;
    playerTitleVis.textContent = label;
    document.dispatchEvent(new CustomEvent('fx:track', { detail: { index: i, label, hue: s.dataset.hue || 18 } }));
    playerCover.style.setProperty('--h', s.dataset.hue || 18);
    playerCover.textContent = i === 0 ? '▶' : n;
    navLinks.forEach((a) => {
      if (a.getAttribute('href') === `#${s.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  // Section active = celle qui occupe la ligne située à 35 % de la hauteur d'écran
  const findCurrent = () => {
    const line = window.innerHeight * 0.35;
    let idx = 0;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) idx = i; });
    // En bas de page, on active la dernière section
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = sections.length - 1;
    return idx;
  };

  /* ---------- Lecteur : progression = défilement ---------- */
  const seek = $('.player__seek');
  const timeCur = $('.player__time--cur');
  const TOTAL_SECONDS = 273; // 4:33, clin d'œil à John Cage
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  let seeking = false;

  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  const scrollRatio = () => Math.min(1, Math.max(0, window.scrollY / maxScroll()));

  const updateProgress = (ratio = scrollRatio()) => {
    if (!seeking) seek.value = Math.round(ratio * 1000);
    seek.style.setProperty('--p', `${ratio * 100}%`);
    timeCur.textContent = fmt(ratio * TOTAL_SECONDS);
    seek.setAttribute('aria-valuetext', `${Math.round(ratio * 100)} % — ${sections[current].dataset.track}`);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      // Toutes les lectures de mise en page d'abord, puis les écritures :
      // évite de forcer un recalcul de la page à chaque image.
      const idx = findCurrent();
      const ratio = scrollRatio();
      setCurrent(idx);
      updateProgress(ratio);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  seek.addEventListener('input', () => {
    seeking = true;
    window.scrollTo({ top: (seek.value / 1000) * maxScroll(), behavior: 'auto' });
  });
  seek.addEventListener('change', () => { seeking = false; });
  seek.addEventListener('pointerup', () => { seeking = false; });

  // Cible en cours pendant un défilement animé (permet d'enchaîner plusieurs clics)
  let pending = null;
  let pendingTimer = 0;
  const goTo = (i) => {
    const idx = Math.max(0, Math.min(sections.length - 1, i));
    pending = idx;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { pending = null; }, 900);
    sections[idx].scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  // Comme sur un vrai lecteur : « précédent » revient au début de la piste
  // si on y est avancé, sinon passe à la piste d'avant.
  $('[data-action="prev"]').addEventListener('click', () => {
    if (pending !== null) { goTo(pending - 1); return; }
    const top = sections[current].getBoundingClientRect().top;
    const headerH = $('.header').offsetHeight;
    if (current > 0 && top < headerH - 80) goTo(current);
    else goTo(current - 1);
  });
  $('[data-action="next"]').addEventListener('click', () => goTo((pending ?? current) + 1));

  /* ---------- Bouton lecture/pause = animations ---------- */
  const playBtn = $('[data-action="toggle"]');
  const setPaused = (paused) => {
    root.classList.toggle('is-paused', paused);
    playBtn.setAttribute('aria-pressed', String(paused));
    playBtn.setAttribute('aria-label', paused ? 'Relancer les animations' : 'Mettre en pause les animations');
    store.set('paused', paused ? '1' : '0');
    // js/effects.js met aussi en pause ses animations en boucle (GSAP, shader)
    document.dispatchEvent(new CustomEvent('fx:paused', { detail: { paused } }));
  };
  playBtn.addEventListener('click', () => setPaused(!root.classList.contains('is-paused')));
  const savedPaused = store.get('paused');
  setPaused(savedPaused === null ? reducedMotion : savedPaused === '1');

  /* ---------- Fiches projet (modale) ---------- */
  const sheet = $('.sheet');
  const sheetBody = $('.sheet__body');
  const sheetTitle = $('.sheet__title');
  const sheetArtist = $('.sheet__artist');
  const sheetCover = $('.sheet__cover');
  let openTrack = null;

  const openSheet = (track) => {
    const details = $('.track__details', track);
    if (!details) return;
    const hue = track.dataset.hue || 18;
    const title = $('.track__title', track).cloneNode(true);
    $$('.badge', title).forEach((b) => b.remove());

    sheetTitle.textContent = title.textContent.trim();
    sheetArtist.textContent = $('.track__artist', track).textContent;
    sheetCover.textContent = $('.cover', track).textContent;
    sheetCover.style.setProperty('--h', hue);
    $('.sheet__head').style.setProperty('--h', hue);
    sheetBody.innerHTML = details.innerHTML;

    openTrack = track;
    track.classList.add('is-open');
    sheet.showModal();
    $('.sheet__inner').scrollTop = 0;
    // js/effects.js fait « voler » la pochette de la piste jusqu'à la fiche
    document.dispatchEvent(new CustomEvent('fx:sheet-open', { detail: { track } }));
  };

  const closeSheet = () => sheet.close();

  sheet.addEventListener('close', () => {
    if (!openTrack) return;
    openTrack.classList.remove('is-open');
    $('.track__btn', openTrack).focus();
    openTrack = null;
  });
  $('.sheet__close').addEventListener('click', closeSheet);
  // Clic sur le fond assombri = fermeture
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });

  $$('.track').forEach((track) => {
    $('.track__btn', track).addEventListener('click', () => openSheet(track));
  });

  /* ---------- Apparition au défilement ---------- */
  // Gérée par js/effects.js (GSAP ScrollTrigger.batch). Sans ce script,
  // ou en mouvement réduit, tout le contenu reste simplement visible.

  /* ---------- Formulaire de contact ---------- */
  const form = $('.form');
  const status = $('.form__status');
  const setStatus = (msg, type) => {
    status.textContent = msg;
    status.className = `form__status${type ? ` is-${type}` : ''}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let firstInvalid = null;
    $$('input, textarea', form).forEach((field) => {
      const ok = field.checkValidity() && field.value.trim() !== '';
      field.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      setStatus('Merci de remplir correctement tous les champs.', 'error');
      firstInvalid.focus();
      return;
    }

    const data = new FormData(form);

    // Formspree pas encore configuré : on ouvre le logiciel de messagerie
    if (form.action.includes('VOTRE_ID')) {
      const to = ($('.contact a[href^="mailto:"]') || {}).href || 'mailto:';
      const subject = encodeURIComponent(`Portfolio — message de ${data.get('nom')}`);
      const body = encodeURIComponent(`${data.get('message')}\n\n${data.get('nom')} — ${data.get('email')}`);
      window.location.href = `${to}?subject=${subject}&body=${body}`;
      setStatus('Votre logiciel de messagerie va s\'ouvrir pour envoyer le message.', 'ok');
      return;
    }

    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    setStatus('Envoi en cours…');
    try {
      const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      $$('[aria-invalid]', form).forEach((f) => f.removeAttribute('aria-invalid'));
      setStatus('Merci ! Votre message a bien été envoyé.', 'ok');
    } catch (err) {
      setStatus('Oups, l\'envoi a échoué. Vous pouvez m\'écrire directement par e-mail.', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  $$('input, textarea', form).forEach((f) => f.addEventListener('input', () => {
    if (f.getAttribute('aria-invalid') === 'true' && f.checkValidity()) f.setAttribute('aria-invalid', 'false');
  }));

  /* ---------- Initialisation ---------- */
  playerTitle.textContent = '';
  setCurrent(findCurrent());
  updateProgress();
})();
