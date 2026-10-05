import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const EASE = 'expo.out';

export function initMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    document.documentElement.classList.remove('motion');
    return;
  }

  const lenis = smoothScroll();
  document.fonts.ready.then(() => {
    hero();
    headings();
    floatStickers();
    howItWorks();
    counters();
    score();
    bento();
    magnetic();
    ScrollTrigger.refresh();
  });

  return lenis;
}

/* Scroll suave, sincronizado con ScrollTrigger, y anclas con compensación del menú fijo */
function smoothScroll() {
  const lenis = new Lenis({ lerp: 0.13, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href')!;
    const target = id === '#top' ? 0 : document.querySelector<HTMLElement>(id);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    history.replaceState(null, '', id);
  });
  return lenis;
}

/* Un solo momento orquestado al cargar: título por líneas, el chip se pinta, el teléfono sube */
function hero() {
  const title = document.querySelector<HTMLElement>('[data-hero-title]');
  const chip = title?.querySelector<HTMLElement>('.chip');
  const ins = gsap.utils.toArray<HTMLElement>('[data-hero-in]');
  const phone = document.querySelector<HTMLElement>('[data-hero-phone] .phone');
  const stickers = gsap.utils.toArray<HTMLElement>('[data-hero-phone] [data-sticker]');
  if (!title) return;

  const tl = gsap.timeline({ defaults: { ease: EASE } });
  gsap.set([title, '[data-hero-phone]', ...ins], { autoAlpha: 1 });

  // Las líneas ya vienen enmascaradas en el HTML (el chip se sigue escribiendo solo)
  tl.from(title.querySelectorAll('.hl__in'), { yPercent: 115, duration: 1.3, stagger: 0.1 }, 0.15);
  if (chip) {
    tl.fromTo(
      chip,
      { backgroundSize: '0% 100%' },
      { backgroundSize: '100% 100%', duration: 0.9, ease: 'power3.inOut' },
      0.75,
    );
  }
  tl.from(ins, { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.55);
  if (phone) {
    tl.from(phone, { y: 140, rotate: 12, autoAlpha: 0, duration: 1.6 }, 0.3);
  }
  tl.from(stickers, { scale: 0, rotate: -40, duration: 1, ease: 'back.out(2)', stagger: 0.12 }, 1.1);

  // El rosetón y el resplandor se desplazan más lento que la página
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const depth = Number(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: depth * 60,
      ease: 'none',
      scrollTrigger: { trigger: el.closest('section'), start: 'top top', end: 'bottom top', scrub: true },
    });
  });
}

/* Títulos de sección: las líneas suben desde una máscara, una vez */
function headings() {
  gsap.utils.toArray<HTMLElement>('main h2.display, main h2.display-hero').forEach((h) => {
    SplitText.create(h, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => {
        roomForDescenders(self.masks);
        return gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.2,
          ease: EASE,
          stagger: 0.09,
          scrollTrigger: { trigger: h, start: 'top 85%', once: true },
        });
      },
    });
  });
}

/* La máscara de cada línea recorta con el interlineado apretado: le damos aire abajo sin mover nada */
function roomForDescenders(masks: Element[]) {
  masks.forEach((m) => {
    (m as HTMLElement).style.paddingBottom = '0.14em';
    (m as HTMLElement).style.marginBottom = '-0.14em';
  });
}

function floatStickers() {
  gsap.utils.toArray<HTMLElement>('[data-float]').forEach((el, i) => {
    gsap.to(el, {
      y: i % 2 ? -14 : 14,
      rotate: `+=${i % 2 ? 6 : -6}`,
      duration: 3 + i * 0.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    if (!el.closest('.hero')) {
      gsap.from(el, {
        scale: 0,
        rotate: -30,
        duration: 1,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    }
  });
}

/* Línea de progreso de «Así de simple» */
function howItWorks() {
  // El paso activo lo marca el propio componente (HowItWorks.astro), también sin animaciones.
  // Aquí solo se anima la línea de progreso.
  const root = document.querySelector<HTMLElement>('[data-how]');
  if (!root) return;
  gsap.to(root.querySelector('[data-how-progress]'), {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: root.querySelector('.how__steps'), start: 'top 55%', end: 'bottom 70%', scrub: true },
  });
}

/* Cifras que cuentan hasta su valor la primera vez que se ven */
function counters() {
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el, i) => {
    const to = Number(el.dataset.count);
    const isInt = el.hasAttribute('data-int');
    const fmt = (v: number) => (isInt ? String(Math.round(v)) : `$${v.toFixed(2)}`);
    const obj = { v: 0 };
    el.textContent = fmt(0);
    gsap.to(obj, {
      v: to,
      duration: 1.6,
      delay: i * 0.12,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = fmt(obj.v)),
      scrollTrigger: { trigger: el.closest('dl') ?? el, start: 'top 75%', once: true },
    });
  });
}

function score() {
  const root = document.querySelector<HTMLElement>('[data-score]');
  const ring = root?.querySelector<SVGCircleElement>('[data-score-ring]');
  const n = root?.querySelector<HTMLElement>('[data-score-n]');
  if (!root || !ring || !n) return;
  const obj = { v: 0 };
  ring.style.strokeDasharray = '0 100';
  n.textContent = '0';
  gsap.to(obj, {
    v: 78,
    duration: 2.2,
    ease: 'power3.out',
    onUpdate: () => {
      ring.style.strokeDasharray = `${obj.v} 100`;
      n.textContent = String(Math.round(obj.v));
    },
    scrollTrigger: { trigger: root, start: 'top 70%', once: true },
  });
}

/* Las tarjetas se descubren con un recorte, no con el típico fundido */
function bento() {
  gsap.set('.bento > .card, .plans > .plan', { autoAlpha: 0 });
  ScrollTrigger.batch('.bento > .card, .plans > .plan', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { clipPath: 'inset(18% 6% 0% 6% round 28px)', y: 40, autoAlpha: 0 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 28px)',
          y: 0,
          autoAlpha: 1,
          duration: 1.2,
          ease: EASE,
          stagger: 0.1,
          clearProps: 'clipPath',
        },
      ),
  });
}

/* El CTA principal se acerca al cursor */
function magnetic() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.25);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });
}
