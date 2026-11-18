/* =========================================================
   Portfolio « Ma playlist » — effets (GSAP)
   Sources : GSAP (ScrollTrigger, SplitText, Draggable, Inertia, ScrambleText,
   CustomEase), idées reprises de Magic UI, Componentry et Skiper UI.
   Ne tourne que si la classe .fx est posée (pas de mouvement réduit) :
   sinon le site reste tel quel, contenu visible.
   ========================================================= */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { CustomWiggle } from 'gsap/CustomWiggle';
import { initHeroShader } from './hero-shader.js';

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduce) root.classList.remove('fx');
else if (root.classList.contains('fx')) init();

function init() {
  gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin, ScrambleTextPlugin, CustomEase, CustomWiggle);
  root.classList.add('fx-ready');

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hoverable = window.matchMedia('(hover: hover)').matches;
  const isMobile = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;

  // Courbes « maison » : un drop (lent puis claquement) et une secousse de basse
  CustomEase.create('drop', 'M0,0 C0.4,0 0.5,0.08 0.62,0.32 0.74,0.58 0.78,1.06 0.86,1.02 0.92,0.99 0.96,1 1,1');
  CustomWiggle.create('kick', { wiggles: 4, type: 'easeOut' });

  /* ---------- Pause (bouton du lecteur) ---------- */
  let paused = root.classList.contains('is-paused');
  const pauseHandlers = [];
  document.addEventListener('fx:paused', (e) => {
    paused = e.detail.paused;
    pauseHandlers.forEach((fn) => fn(paused));
  });

  /* ---------- Vitesse de défilement partagée ---------- */
  // boost : 0 au repos, monte avec la vitesse puis retombe ; dir : sens du dernier défilement
  const energy = { boost: 0, dir: 1 };
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const v = self.getVelocity();
      if (Math.abs(v) < 5) return;
      energy.dir = v > 0 ? 1 : -1;
      const b = gsap.utils.clamp(0, 6, Math.abs(v) / 260);
      if (b > energy.boost) {
        energy.boost = b;
        gsap.to(energy, { boost: 0, duration: 1.6, ease: 'power3.out', overwrite: true });
      }
    },
  });

  /* =========================================================
     ACCUEIL
     ========================================================= */
  const hero = $('.hero');
  const art = $('.hero__art');
  const vinyl = $('.vinyl');
  const tonearm = $('.tonearm');
  let heroOn = true;
  let shader = null;

  ScrollTrigger.create({
    trigger: hero,
    start: 'top bottom',
    end: 'bottom top',
    onToggle(self) {
      heroOn = self.isActive;
      hero.classList.toggle('is-off', !heroOn);
      shader?.setActive(heroOn);
    },
  });

  // Fond shader (C3) : ordinateur seulement, sinon les halos CSS restent
  const canvas = $('.hero__shader');
  if (canvas && !isMobile) {
    shader = initHeroShader(canvas, hero, art);
    if (shader) {
      hero.classList.add('has-shader');
      shader.setPaused(paused);
      pauseHandlers.push((p) => shader.setPaused(p));
      // Le vinyle finit sa sortie à 1,5 s : on recale le centre du fond
      gsap.delayedCall(1.6, () => shader.remeasure());
    }
  }

  // Intro : les mots tombent sur le « temps », secousse à l'impact, kicker brouillé
  const kicker = $('.hero .kicker');
  const kickerText = kicker.textContent;
  gsap.set('.hero__word', { yPercent: -125, opacity: 1 });
  gsap.set(tonearm, { rotation: -26, transformOrigin: '82.5% 7.14%' });
  const intro = gsap.timeline({ delay: 0.15 });
  intro
    .set(kicker, { opacity: 1 })
    .to(kicker, { duration: 1.1, scrambleText: { text: kickerText, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·', revealDelay: 0.25, speed: 0.5 } }, 0)
    .to('.hero__word', { yPercent: 0, duration: 0.9, ease: 'drop', stagger: 0.16 }, 0.1)
    .fromTo('.hero__title', { y: 0 }, { y: 7, duration: 0.55, ease: 'kick' }, 1.0)
    .fromTo(['.hero__lead', '.hero__meta', '.hero__actions'], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 }, 0.75)
    // Le bras se pose sur le disque une fois celui-ci sorti de la pochette
    .to(tonearm, { rotation: paused ? -26 : 0, duration: 1.1, ease: 'power3.inOut' }, 1.3);

  pauseHandlers.push((p) => gsap.to(tonearm, { rotation: p ? -26 : 0, duration: 0.8, ease: 'power3.inOut', overwrite: true }));

  /* ---------- Vinyle : vitesse liée au défilement + scratch ---------- */
  const BASE_DEG = 90; // 1 tour en 4 s
  let rot = 0;
  let spinning = false;
  let scratching = false;
  const setRot = gsap.quickSetter(vinyl, 'rotation', 'deg');
  gsap.delayedCall(1.4, () => { spinning = true; });

  if (finePointer) {
    Draggable.create(vinyl, {
      type: 'rotation',
      inertia: true,
      onPress() { scratching = true; },
      onRelease() { if (!this.tween || !this.tween.isActive()) scratching = false; },
      onThrowComplete() { scratching = false; },
    });
  }

  /* ---------- Mur de pochettes : boucle pilotée par le défilement ---------- */
  // Chaque rangée garde son sens ; remonter la page inverse le défilement de toutes.
  const rows = $$('.hero__wall .wall-row').map((row, i) => {
    const dur = parseFloat(row.style.getPropertyValue('--dur')) || 90;
    return {
      set: gsap.quickSetter(row, 'xPercent'),
      speed: 50 / dur, // % de la rangée par seconde (une moitié = une boucle)
      side: i % 2 ? 1 : -1,
      x: i % 2 ? -50 : gsap.utils.random(-50, 0),
    };
  });
  const wrap = gsap.utils.wrap(-50, 0);

  /* ---------- Bandeau « tracklist » ---------- */
  const band = $('.band');
  const bandRow = $('.band__row');
  let bandOn = false;
  let bandX = 0;
  let setBand = null;
  if (bandRow) {
    const track = document.createElement('div');
    track.className = 'band__track';
    while (bandRow.firstChild) track.appendChild(bandRow.firstChild);
    $$('.band__item, .band__dot', track).forEach((el) => { el.style.marginRight = '0'; });
    // Assez de copies pour couvrir les grands écrans, puis la même chose doublée
    const half = document.createElement('div');
    half.className = 'band__track';
    half.style.paddingRight = '0';
    half.style.gap = '0';
    for (let k = 0; k < 3; k++) half.appendChild(track.cloneNode(true));
    bandRow.appendChild(half);
    bandRow.appendChild(half.cloneNode(true));
    setBand = gsap.quickSetter(bandRow, 'xPercent');
    ScrollTrigger.create({ trigger: band, start: 'top bottom', end: 'bottom top', onToggle: (self) => { bandOn = self.isActive; } });
  }

  /* ---------- Une seule boucle pour tout ce qui tourne en continu ---------- */
  gsap.ticker.add((time, deltaMs) => {
    if (paused) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    const b = energy.boost;

    if (heroOn) {
      // Vinyle : accélère avec le défilement, tourne à l'envers quand on remonte
      if (scratching) {
        rot = gsap.getProperty(vinyl, 'rotation');
      } else if (spinning) {
        rot += BASE_DEG * (energy.dir < 0 && b > 0.05 ? -b : 1 + b) * dt;
        setRot(rot);
      }
      const k = energy.dir * (1 + b * 0.8);
      rows.forEach((r) => { r.x = wrap(r.x + r.side * r.speed * k * dt); r.set(r.x); });
    }

    if (bandOn && setBand) {
      bandX = wrap(bandX - energy.dir * (2 + b * 3) * dt);
      setBand(bandX);
    }
  });

  /* =========================================================
     TITRES DE SECTION : lettres qui roulent + kicker brouillé
     ========================================================= */
  $$('.section__head').forEach((head) => {
    const h2 = $('h2', head);
    const kick = $('.kicker', head);
    const kickTxt = kick ? kick.textContent : '';
    const split = SplitText.create(h2, { type: 'chars', charsClass: 'char' });
    gsap.set(split.chars, { opacity: 0 });
    if (kick) gsap.set(kick, { opacity: 0 });
    ScrollTrigger.create({
      trigger: head,
      start: 'top 85%',
      once: true,
      onEnter() {
        gsap.fromTo(split.chars,
          { opacity: 0, rotationX: -100, yPercent: 30, transformOrigin: '50% 50% -0.45em' },
          { opacity: 1, rotationX: 0, yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.035, onComplete: () => split.revert() });
        if (kick) {
          gsap.set(kick, { opacity: 1 });
          gsap.to(kick, { duration: 0.9, scrambleText: { text: kickTxt, chars: '0123456789·—', revealDelay: 0.15, speed: 0.6 } });
        }
      },
    });
  });

  /* =========================================================
     APPARITIONS EN CASCADE
     ========================================================= */
  const items = $$('.section__intro, .about, .playlist, .channel, .disco__item, .episode, .contact');
  gsap.set(items, { opacity: 0, y: 44, transition: 'none' });
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter(batch) {
      batch.forEach((el) => el.classList.add('is-in'));
      gsap.to(batch, {
        opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09, overwrite: true,
        onComplete: () => gsap.set(batch, { clearProps: 'transition,transform' }),
      });
    },
  });

  /* =========================================================
     LECTEUR : titre de piste brouillé à chaque changement
     ========================================================= */
  const titleVis = $('.player__title-vis');
  document.addEventListener('fx:track', (e) => {
    gsap.to(titleVis, { duration: 0.7, overwrite: true, scrambleText: { text: e.detail.label, chars: '0123456789·—', speed: 0.8 } });
  });

  /* =========================================================
     PLAYLIST : la pochette vole jusqu'à la fiche projet
     ========================================================= */
  const sheet = $('.sheet');
  const sheetCover = $('.sheet__cover');
  document.addEventListener('fx:sheet-open', (e) => {
    const src = $('.cover', e.detail.track);
    if (!src) return;
    sheet.classList.add('is-flipping');
    const a = src.getBoundingClientRect();
    const b = sheetCover.getBoundingClientRect();
    const ghost = src.cloneNode(true);
    ghost.classList.add('cover-ghost');
    ghost.style.setProperty('--h', e.detail.track.dataset.hue || 275);
    Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    sheet.appendChild(ghost);
    gsap.set(sheetCover, { opacity: 0 });
    gsap.to(ghost, {
      x: b.left - a.left,
      y: b.top - a.top,
      scaleX: b.width / a.width,
      scaleY: b.height / a.height,
      rotation: 0,
      duration: 0.7,
      ease: 'power3.inOut',
      onComplete() {
        ghost.remove();
        gsap.set(sheetCover, { opacity: 1 });
        sheet.classList.remove('is-flipping');
      },
    });
  });

  /* =========================================================
     COMPÉTENCES : projecteur qui suit le pointeur
     ========================================================= */
  if (hoverable) {
    $$('.channel').forEach((card) => {
      let rect = null;
      card.addEventListener('pointerenter', () => { rect = card.getBoundingClientRect(); });
      card.addEventListener('pointermove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
      card.addEventListener('pointerleave', () => { rect = null; });
    });
  }

  /* =========================================================
     PARCOURS : sillon qui se dessine, disques qui tournent
     ========================================================= */
  gsap.fromTo('.disco__progress', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.disco', start: 'top 65%', end: 'bottom 65%', scrub: 0.6 },
  });
  $$('.disco__item').forEach((item) => {
    gsap.fromTo($('.disco__year', item), { rotation: -220 }, {
      rotation: 0, ease: 'none',
      scrollTrigger: { trigger: item, start: 'top bottom', end: 'top 75%', scrub: 0.8 },
    });
  });

  /* =========================================================
     PIED DE PAGE : le bord rebondit, plus fort si on arrive vite
     ========================================================= */
  const wave = $('.footer__wave path');
  if (wave) {
    const shape = (d) => `M0 0 C360 ${d} 1080 ${d} 1440 0 Z`;
    ScrollTrigger.create({
      trigger: '.footer',
      start: 'top bottom',
      onEnter(self) {
        const depth = gsap.utils.clamp(18, 90, Math.abs(self.getVelocity()) / 22);
        gsap.fromTo(wave, { attr: { d: shape(depth) } }, { attr: { d: shape(0) }, duration: 2.2, ease: 'elastic.out(1, 0.4)', overwrite: true });
      },
    });
  }

  // Les polices modifient les hauteurs : on recalcule les déclencheurs une fois chargées
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
