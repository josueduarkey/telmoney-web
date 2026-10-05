// Fondo del inicio: las luces y el grabado siguen al cursor con suavidad.
// En pantallas táctiles (sin cursor) la luz recorre sola el fondo. Se detiene fuera de pantalla.
export function heroBackground(hero: HTMLElement) {
  const bg = hero.querySelector<HTMLElement>('[data-hero-bg]');
  if (!bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hasCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const target = { x: 0.68, y: 0.38 };
  const pos = { ...target };
  let lastMove = 0;
  let raf = 0;
  let visible = true;

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = (e.clientY - r.top) / r.height;
    lastMove = performance.now();
  });

  const frame = (t: number) => {
    // Sin cursor reciente: la luz da vueltas lentas sobre el lado del teléfono
    if (!hasCursor || t - lastMove > 4000) {
      target.x = 0.62 + Math.sin(t / 5200) * 0.22;
      target.y = 0.45 + Math.sin(t / 3700) * 0.25;
    }
    pos.x += (target.x - pos.x) * 0.06;
    pos.y += (target.y - pos.y) * 0.06;
    bg.style.setProperty('--mx', `${(pos.x * 100).toFixed(2)}%`);
    bg.style.setProperty('--my', `${(pos.y * 100).toFixed(2)}%`);
    bg.style.setProperty('--px', (pos.x - 0.5).toFixed(3));
    bg.style.setProperty('--py', (pos.y - 0.5).toFixed(3));
    if (visible) raf = requestAnimationFrame(frame);
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(hero);
}
