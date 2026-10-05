// Demo en vivo del inicio: un TelMoney de bolsillo que corre en el navegador.
// Imita el formato de las respuestas del bot real con los montos de ejemplo de la página
// (marca.md §2). No guarda ni envía nada: todo vive en esta pestaña.
import { gsap } from 'gsap';
import { TICKS_SVG } from '../lib/ticks';

const FIXED = 300; // gastos fijos por pagar
const GOALS = 1.3; // apartado para metas
const DAYS = 11; // días hasta el próximo ingreso (15/10)
const PAYDAY = '15/10';

type Move = { amount: number; kind: 'expense' | 'income'; category: string; account: string };

const CATEGORIES: [RegExp, string, string][] = [
  [/caf[eé]|almuerzo|comida|cena|desayuno|pizza|pupusa|hamburguesa|restaurante|pollo|tacos?/i, 'comida fuera', '🍽️'],
  [/s[uú]per|mercado|despensa|tienda/i, 'mercado', '🛒'],
  [/bus|uber|taxi|gasolina|pasaje|metro|parqueo/i, 'transporte', '🚌'],
  [/luz|agua|internet|tel[eé]fono|cable|recibo/i, 'servicios', '💡'],
  [/cine|netflix|spotify|juego|salida|fiesta|concierto/i, 'entretenimiento', '🎬'],
  [/farmacia|doctor|medicina|consulta|dentista/i, 'salud', '💊'],
  [/ropa|tenis|zapatos|camisa|pantal[oó]n/i, 'ropa', '👕'],
  [/alquiler|renta/i, 'vivienda', '🏠'],
];
const ACCOUNTS: [RegExp, string][] = [
  [/n1co/i, 'n1co'],
  [/tarjeta/i, 'tarjeta'],
  [/agr[ií]cola/i, 'Banco Agrícola'],
  [/bac|credomatic/i, 'BAC Credomatic'],
  [/tigo/i, 'Tigo Money'],
];

const usd = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const now = () => new Date().toTimeString().slice(0, 5);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (s: string) =>
  escape(s)
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

function amountIn(text: string): number | null {
  const m = text.replace(/,(\d{3})/g, '$1').match(/(\d+(?:[.,]\d{1,2})?)/);
  return m ? Number(m[1].replace(',', '.')) : null;
}

export function demoBot(root: HTMLElement, { onFirstInteraction }: { onFirstInteraction?: () => void } = {}) {
  const form = root.querySelector<HTMLFormElement>('[data-chat-form]');
  const input = root.querySelector<HTMLInputElement>('[data-chat-input]');
  const body = root.querySelector<HTMLElement>('[data-chat-body]');
  const list = body?.querySelector<HTMLOListElement>('.chat');
  const typing = root.querySelector<HTMLElement>('[data-typing]');
  const presence = root.querySelector<HTMLElement>('[data-presence]');
  const chips = root.querySelectorAll<HTMLButtonElement>('[data-chat-chip]');
  if (!form || !input || !body || !list) return;

  // Estado de ejemplo: el de la sección «Un número. Todos los días.» ($540, $21.70 por día),
  // después del almuerzo ($3.50) y el bus ($1.20) que muestra la conversación inicial.
  let daily = (540 - FIXED - GOALS) / DAYS; // $21.70
  let spentToday = 4.7;
  let balance = 540 - spentToday;
  const moves: Move[] = [];
  let started = false;
  let busy = false;

  const free = () => balance - FIXED - GOALS;
  const leftToday = () => daily - spentToday;

  const start = () => {
    if (started) return;
    started = true;
    root.classList.add('is-live');
    onFirstInteraction?.();
  };

  const scrollDown = () => body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });

  const bubble = (from: 'me' | 'bot', html: string, buttons: string[] = []) => {
    const li = document.createElement('li');
    li.className = `msg msg--${from}`;
    const ticks = from === 'me' ? TICKS_SVG : '';
    li.innerHTML =
      `<div class="bubble"><span class="text">${html}</span><span class="time num">${now()}${ticks}</span></div>` +
      (buttons.length
        ? `<div class="quick">${buttons.map((b) => `<button type="button" class="quick__btn" data-chat-say="${escape(b)}">${escape(b)}</button>`).join('')}</div>`
        : '');
    list.appendChild(li);
    gsap.fromTo(
      li,
      { opacity: 0, y: 14, scale: 0.94, transformOrigin: from === 'me' ? '100% 100%' : '0% 100%' },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' },
    );
    scrollDown();
  };

  const setTyping = (on: boolean) => {
    typing?.classList.toggle('is-on', on);
    if (presence) presence.textContent = on ? 'escribiendo…' : 'en línea';
    if (on) {
      // el indicador va siempre al final de la conversación
      body.appendChild(typing!);
      scrollDown();
    }
  };

  const reply = (text: string): { text: string; buttons?: string[] } => {
    const t = text.toLowerCase().trim();
    const amount = amountIn(t);

    if (/^(hola|buenas|hey|qu[eé] tal|buenos d[ií]as|buenas tardes)/.test(t)) {
      return {
        text: '¡Hola! 👋 Soy TelMoney.\nCuéntame un gasto, por ejemplo «gasté 5 en café», o pregúntame «¿cuánto puedo gastar hoy?».',
        buttons: ['gasté 5 en café', '¿cuánto puedo gastar hoy?'],
      };
    }
    if (/gracias|grax|genial|buen[ií]simo|chivo/.test(t)) return { text: '¡Para eso estoy! 💚' };

    if (/deshacer|borra(r)? (eso|el [uú]ltimo)|me equivoqu[eé]/.test(t)) {
      const last = moves.pop();
      if (!last) return { text: 'No hay nada que deshacer todavía.' };
      if (last.kind === 'expense') {
        balance += last.amount;
        spentToday -= last.amount;
      } else {
        balance -= last.amount;
        daily = free() / DAYS;
      }
      return { text: `↩️ Listo, borré ${usd(last.amount)} · ${last.category}.\n🟢 Hoy te quedan *${usd(leftToday())}* de ${usd(daily)}.` };
    }

    if (/puedo comprar|me alcanza|lo compro|puedo gastar \d/.test(t) && amount) {
      if (amount <= leftToday()) {
        return {
          text: `🟢 *Sí, entra en lo de hoy.*\nTe quedarían *${usd(leftToday() - amount)}* de ${usd(daily)} para el resto del día.`,
        };
      }
      const after = (free() - amount) / DAYS;
      if (after >= 0) {
        return {
          text: `🟡 *Puedes, pero se sale de lo de hoy* (${usd(daily)}).\nSi lo compras, tu disponible baja de ${usd(daily)} a *${usd(after)} por día* hasta el ${PAYDAY}.`,
        };
      }
      return {
        text: `🔴 *Hoy no te alcanza.*\nTe faltarían *${usd(amount - free())}* para llegar al ${PAYDAY} con tus pagos fijos cubiertos.`,
      };
    }

    if (/cu[aá]nto puedo gastar|disponible|c[oó]mo voy|cu[aá]nto tengo|resumen/.test(t)) {
      return {
        text:
          `🟢 *Hoy puedes gastar ${usd(Math.max(leftToday(), 0))}*\n` +
          `Tu disponible es *${usd(daily)} por día* hasta tu próximo ingreso (${PAYDAY}, en ${DAYS} día(s)):\n` +
          `• Tienes ${usd(balance)} en tus cuentas\n• − ${usd(FIXED)} de gastos fijos por pagar\n• − ${usd(GOALS)} apartados en tus metas`,
      };
    }

    if (amount && /me pagaron|me pag[oó]|salario|sueldo|quincena|me dieron|me dio|recib[ií]|me depositaron|vend[ií]|cobr[eé]|me cay[oó]/.test(t)) {
      balance += amount;
      daily = free() / DAYS;
      moves.push({ amount, kind: 'income', category: 'ingreso', account: 'efectivo' });
      return {
        text: `💵 Entraron *${usd(amount)}*.\n🟢 Tu disponible sube a *${usd(daily)} por día* hasta el ${PAYDAY}.`,
        buttons: ['↩️ Deshacer', '📊 ¿Cómo voy?'],
      };
    }

    if (amount) {
      const [, category, icon] = CATEGORIES.find(([re]) => re.test(t)) ?? [null, 'otros', '🧾'];
      const account = ACCOUNTS.find(([re]) => re.test(t))?.[1] ?? 'efectivo';
      balance -= amount;
      spentToday += amount;
      moves.push({ amount, kind: 'expense', category, account });
      const left = leftToday();
      const status =
        left >= 0
          ? `🟢 Hoy te quedan *${usd(left)}* de ${usd(daily)}.`
          : `🔴 Hoy te pasaste *${usd(left)}* de ${usd(daily)}.\nMañana tu disponible queda en *${usd(Math.max(free(), 0) / (DAYS - 1))} por día*.`;
      return { text: `✅ ${usd(amount)} · ${icon} ${category} · ${account}\n${status}`, buttons: ['↩️ Deshacer', '📊 ¿Cómo voy?'] };
    }

    return {
      text: 'En esta demo entiendo gastos («12 de gasolina»), ingresos («me pagaron 650») y preguntas como «¿cuánto puedo gastar hoy?».\nEl TelMoney real también entiende audios y fotos de recibos. 📸',
      buttons: ['gasté 5 en café', '¿puedo comprar unos tenis de 80?'],
    };
  };

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 140);
    if (!text || busy) return;
    start();
    busy = true;
    bubble('me', escape(text));
    input.value = '';
    form.classList.remove('has-text');
    await wait(450);
    setTyping(true);
    const r = reply(text);
    await wait(700 + Math.min(r.text.length * 4, 700));
    setTyping(false);
    bubble('bot', fmt(r.text), r.buttons);
    busy = false;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });
  input.addEventListener('focus', start);
  input.addEventListener('input', () => form.classList.toggle('has-text', input.value.trim().length > 0));
  chips.forEach((c) => c.addEventListener('click', () => send(c.dataset.chatChip ?? c.textContent ?? '')));
  // Los botones de respuesta rápida de los mensajes también funcionan
  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-chat-say]');
    if (b) send(b.dataset.chatSay!.replace('↩️ ', '').replace('📊 ', ''));
  });
}
