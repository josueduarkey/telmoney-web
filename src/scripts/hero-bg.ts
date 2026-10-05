// Fondo del inicio: el foco de luz sigue al cursor y las luces se desplazan un poco (paralaje).
// Todo se mueve con transform (lo resuelve la GPU sin repintar). El bucle duerme cuando no hay movimiento.
// Sin cursor (pantallas táctiles), el foco pasea solo con una animación CSS.
export function heroBackground(hero: HTMLElement) {
  const bg = hero.querySelector<HTMLElement>('[data-hero-bg]');
  const spot = bg?.querySelector<HTMLElement>('.spot');
  const aurora = bg?.querySelector<HTMLElement>('.aurora');
  if (!bg || !spot || !aurora) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const SPOT = 380; // mitad del tamaño del foco
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  let w = hero.clientWidth;
  let h = hero.clientHeight;
  let raf = 0;
  let started = false;

  window.addEventListener('resize', () => {
    w = hero.clientWidth;
    h = hero.clientHeight;
  });

  const frame = () => {
    pos.x += (target.x - pos.x) * 0.12;
    pos.y += (target.y - pos.y) * 0.12;
    spot.style.transform = `translate3d(${pos.x - SPOT}px, ${pos.y - SPOT}px, 0)`;
    aurora.style.transform = `translate3d(${(pos.x / w - 0.5) * 40}px, ${(pos.y / h - 0.5) * 30}px, 0)`;
    raf = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.3 ? requestAnimationFrame(frame) : 0;
  };

  hero.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      if (!started) {
        // el foco deja de pasear solo y empieza desde donde está el cursor
        started = true;
        pos.x = target.x;
        pos.y = target.y;
        bg.classList.add('has-pointer');
      }
      if (!raf) raf = requestAnimationFrame(frame);
    },
    { passive: true },
  );
}
