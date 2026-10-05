// Escribe y borra frases dentro de un elemento [data-type='["a","b"]'] con un hijo [data-type-text].
// La primera frase ya viene escrita en el HTML: es la que queda si el usuario prefiere menos movimiento.
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Options = { startDelay?: number; hold?: number; typeMs?: number; deleteMs?: number };

export async function typewriter(
  root: HTMLElement,
  { startDelay = 2400, hold = 2600, typeMs = 75, deleteMs = 38 }: Options = {},
) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const phrases: string[] = JSON.parse(root.dataset.type ?? '[]').slice(0, 3);
  const out = root.querySelector<HTMLElement>('[data-type-text]');
  if (!out || phrases.length < 2) return;

  let i = 0;
  await wait(startDelay);
  for (;;) {
    if (document.hidden) {
      await wait(500);
      continue;
    }
    const current = phrases[i];
    for (let n = current.length; n >= 0; n--) {
      out.textContent = current.slice(0, n);
      await wait(deleteMs);
    }
    i = (i + 1) % phrases.length;
    const next = phrases[i];
    await wait(260);
    for (let n = 1; n <= next.length; n++) {
      out.textContent = next.slice(0, n);
      // un poco de irregularidad, como alguien que escribe de verdad
      await wait(typeMs + Math.random() * 60);
    }
    await wait(hold);
  }
}
