import { gsap } from 'gsap';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera hasta que el elemento esté en pantalla (no gastamos animaciones que nadie ve). */
function whenVisible(el: Element) {
  return new Promise<void>((resolve) => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          resolve();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
  });
}

type Options = { loop?: boolean; startDelay?: number };

/**
 * Reproduce una conversación de <Chat scripted> dentro de un <Phone typing>:
 * los mensajes propios aparecen como enviados; los del bot, después de «escribiendo…».
 */
export async function playChat(root: HTMLElement, { loop = false, startDelay = 400 }: Options = {}) {
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const typing = root.querySelector<HTMLElement>('[data-typing]');
  const presence = root.querySelector<HTMLElement>('[data-presence]');
  if (!steps.length || reduced()) return;

  const hideAll = () => steps.forEach((s) => (s.style.display = 'none'));
  const setTyping = (on: boolean) => {
    typing?.classList.toggle('is-on', on);
    if (presence) presence.textContent = on ? 'escribiendo…' : 'en línea';
  };

  hideAll();
  await wait(startDelay);

  do {
    await whenVisible(root);
    for (const step of steps) {
      const fromBot = step.classList.contains('msg--bot');
      const len = step.textContent?.length ?? 20;

      if (fromBot) {
        setTyping(true);
        gsap.fromTo(typing, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25 });
        await wait(900 + Math.min(len * 6, 900));
        setTyping(false);
      } else {
        await wait(650);
      }

      step.style.display = '';
      gsap.fromTo(
        step,
        { opacity: 0, y: 14, scale: 0.94, transformOrigin: fromBot ? '0% 100%' : '100% 100%' },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)' },
      );
      const buttons = step.querySelectorAll('.quick__btn');
      if (buttons.length) {
        gsap.from(buttons, { opacity: 0, y: 8, duration: 0.35, stagger: 0.08, delay: 0.25 });
      }
      await wait(fromBot ? 1300 + Math.min(len * 22, 2600) : 500);
    }

    if (!loop) break;
    await wait(2600);
    await gsap.to(steps, { opacity: 0, y: -12, duration: 0.45, stagger: 0.04 });
    hideAll();
    gsap.set(steps, { clearProps: 'opacity,transform' });
    await wait(500);
  } while (loop);
}
