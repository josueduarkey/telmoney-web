// Demo en vivo del inicio: un TelMoney de bolsillo que corre en el navegador.
// Imita el formato de las respuestas del bot real con los montos de ejemplo de la página
// (marca.md §2). No guarda ni envía nada: todo vive en esta pestaña.
// Habla el idioma de la página (<html lang>): en /en/ entiende y contesta en inglés.
import { gsap } from 'gsap';
import { TICKS_SVG } from '../lib/ticks';

const FIXED = 300; // gastos fijos por pagar
const GOALS = 1.3; // apartado para metas
const DAYS = 11; // días hasta el próximo ingreso (15/10)
const EN = typeof document !== 'undefined' && document.documentElement.lang === 'en';
const PAYDAY = EN ? '10/15' : '15/10';

type Link = { label: string; href: string; external?: boolean };
type Move = { amount: number; kind: 'expense' | 'income'; category: string; account: string };

// [patrón (español e inglés), categoría en español, en inglés, ícono]
const CATEGORIES: [RegExp, string, string, string][] = [
  [/caf[eé]|almuerzo|comida|cena|desayuno|pizza|pupusa|hamburguesa|restaurante|pollo|tacos?|coffee|lunch|dinner|breakfast|food|burger|restaurant/i, 'comida fuera', 'eating out', '🍽️'],
  [/s[uú]per|mercado|despensa|tienda|grocer|market|store/i, 'mercado', 'groceries', '🛒'],
  [/bus|uber|taxi|gasolina|pasaje|metro|parqueo|gas\b|fuel|parking/i, 'transporte', 'transport', '🚌'],
  [/luz|agua|internet|tel[eé]fono|cable|recibo|electric|water|phone|bill/i, 'servicios', 'utilities', '💡'],
  [/cine|netflix|spotify|juego|salida|fiesta|concierto|movie|game|party|concert/i, 'entretenimiento', 'entertainment', '🎬'],
  [/farmacia|doctor|medicina|consulta|dentista|pharmacy|medicine|dentist/i, 'salud', 'health', '💊'],
  [/ropa|tenis|zapatos|camisa|pantal[oó]n|clothes|sneakers|shoes|shirt|pants/i, 'ropa', 'clothes', '👕'],
  [/alquiler|renta|rent/i, 'vivienda', 'housing', '🏠'],
];
const ACCOUNTS: [RegExp, string, string][] = [
  [/billetera|wallet/i, 'billetera', 'wallet'],
  [/tarjeta|card/i, 'tarjeta', 'card'],
  [/banco|cuenta|bank|account/i, 'banco', 'bank'],
];

/** Los textos de la demo en los dos idiomas. */
const L = EN
  ? {
      online: 'online',
      typing: 'typing…',
      ask: 'Ask on WhatsApp',
      join: 'Join the beta',
      hello: 'Hi! 👋 I\'m TelMoney.\nTell me an expense, like "spent 5 on coffee", or ask me "how much can I spend today?".',
      helloBtns: ['spent 5 on coffee', 'how much can I spend today?'],
      thanks: 'That\'s what I\'m here for! 💚',
      nothingUndo: 'There\'s nothing to undo yet.',
      undone: (a: string, c: string, left: string, d: string) => `↩️ Done, I removed ${a} · ${c}.\n🟢 You have *${left}* left of ${d} today.`,
      buyOk: (left: string, d: string) => `🟢 *Yes, it fits in today.*\nYou'd have *${left}* left of ${d} for the rest of the day.`,
      buyWarn: (d: string, after: string) => `🟡 *You can, but it goes over today* (${d}).\nIf you buy it, your daily budget drops from ${d} to *${after} a day* until ${PAYDAY}.`,
      buyNo: (short: string) => `🔴 *You can't afford it today.*\nYou'd be *${short}* short of reaching ${PAYDAY} with your bills covered.`,
      status: (left: string, d: string, bal: string) =>
        `🟢 *Today you can spend ${left}*\nYour budget is *${d} a day* until your next income (${PAYDAY}, in ${DAYS} days):\n• You have ${bal} in your accounts\n• − ${usd(FIXED)} in bills to pay\n• − ${usd(GOALS)} set aside for your goals`,
      income: (a: string, d: string) => `💵 You received *${a}*.\n🟢 Your budget goes up to *${d} a day* until ${PAYDAY}.`,
      incomeCat: 'income',
      cash: 'cash',
      other: 'other',
      left: (l: string, d: string) => `🟢 You have *${l}* left of ${d} today.`,
      over: (l: string, d: string, tomorrow: string) => `🔴 You went *${l}* over your ${d} today.\nTomorrow your budget is *${tomorrow} a day*.`,
      btns: ['↩️ Undo', '📊 How am I doing?'],
      fallbackOpen: 'Ask me that on WhatsApp 👇\nThere I answer with your real numbers (in Spanish, for now).',
      fallbackSoon: 'I\'ll answer that on WhatsApp when the beta opens 👇\nHere you can try an expense or "how much can I spend today?".',
    }
  : {
      online: 'en línea',
      typing: 'escribiendo…',
      ask: 'Preguntar en WhatsApp',
      join: 'Únete a la beta',
      hello: '¡Hola! 👋 Soy TelMoney.\nCuéntame un gasto, por ejemplo "gasté 5 en café", o pregúntame "¿cuánto puedo gastar hoy?".',
      helloBtns: ['gasté 5 en café', '¿cuánto puedo gastar hoy?'],
      thanks: '¡Para eso estoy! 💚',
      nothingUndo: 'No hay nada que deshacer todavía.',
      undone: (a: string, c: string, left: string, d: string) => `↩️ Listo, borré ${a} · ${c}.\n🟢 Hoy te quedan *${left}* de ${d}.`,
      buyOk: (left: string, d: string) => `🟢 *Sí, te alcanza para hoy.*\nTe quedarían *${left}* de ${d} para el resto del día.`,
      buyWarn: (d: string, after: string) => `🟡 *Puedes, pero se sale de lo de hoy* (${d}).\nSi lo compras, tu disponible baja de ${d} a *${after} por día* hasta el ${PAYDAY}.`,
      buyNo: (short: string) => `🔴 *Hoy no te alcanza.*\nTe faltarían *${short}* para llegar al ${PAYDAY} con tus pagos fijos cubiertos.`,
      status: (left: string, d: string, bal: string) =>
        `🟢 *Hoy puedes gastar ${left}*\nTu disponible es *${d} por día* hasta tu próximo ingreso (${PAYDAY}, en ${DAYS} día(s)):\n• Tienes ${bal} en tus cuentas\n• − ${usd(FIXED)} de gastos fijos por pagar\n• − ${usd(GOALS)} apartados en tus metas`,
      income: (a: string, d: string) => `💵 Recibiste *${a}*.\n🟢 Tu disponible sube a *${d} por día* hasta el ${PAYDAY}.`,
      incomeCat: 'ingreso',
      cash: 'efectivo',
      other: 'otros',
      left: (l: string, d: string) => `🟢 Hoy te quedan *${l}* de ${d}.`,
      over: (l: string, d: string, tomorrow: string) => `🔴 Hoy te pasaste *${l}* de ${d}.\nMañana tu disponible queda en *${tomorrow} por día*.`,
      btns: ['↩️ Deshacer', '📊 ¿Cómo voy?'],
      fallbackOpen: 'Eso pregúntamelo en WhatsApp 👇\nAhí te respondo con tus números de verdad.',
      fallbackSoon: 'Eso te lo respondo en WhatsApp cuando abra la beta 👇\nAquí puedes probar con un gasto o "¿cuánto puedo gastar hoy?".',
    };

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

  // Estado de ejemplo: el de la sección "Un número. Todos los días." ($540, $21.70 por día),
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

  // Lo que la demo no entiende se pregunta en el WhatsApp de verdad (con el texto ya escrito).
  // Antes del lanzamiento no hay número: el botón lleva a la lista de espera.
  const waNumber = root.dataset.wa;
  const askLink = (question: string): Link =>
    waNumber
      ? { label: L.ask, href: `https://wa.me/${waNumber}?text=${encodeURIComponent(question)}`, external: true }
      : { label: L.join, href: root.dataset.ctaHref || '#beta' };

  const bubble = (from: 'me' | 'bot', html: string, buttons: string[] = [], link?: Link) => {
    const li = document.createElement('li');
    li.className = `msg msg--${from}`;
    const ticks = from === 'me' ? TICKS_SVG : '';
    li.innerHTML =
      `<div class="bubble"><span class="text">${html}</span><span class="time num">${now()}${ticks}</span></div>` +
      (buttons.length
        ? `<div class="quick">${buttons.map((b) => `<button type="button" class="quick__btn" data-chat-say="${escape(b)}">${escape(b)}</button>`).join('')}</div>`
        : '') +
      (link
        ? `<div class="quick"><a class="quick__btn quick__btn--link" href="${escape(link.href)}"${link.external ? ' target="_blank" rel="noopener"' : ''}>${escape(link.label)}</a></div>`
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
    if (presence) presence.textContent = on ? L.typing : L.online;
    if (on) {
      // el indicador va siempre al final de la conversación
      body.appendChild(typing!);
      scrollDown();
    }
  };

  const reply = (text: string): { text: string; buttons?: string[]; link?: Link } => {
    const t = text.toLowerCase().trim();
    const amount = amountIn(t);

    if (/^(hola|buenas|hey|qu[eé] tal|buenos d[ií]as|buenas tardes|hi\b|hello|good (morning|afternoon|evening))/.test(t)) {
      return { text: L.hello, buttons: L.helloBtns };
    }
    if (/gracias|grax|genial|buen[ií]simo|chivo|thanks|thank you|great|awesome/.test(t)) return { text: L.thanks };

    if (/deshacer|borra(r)? (eso|el [uú]ltimo)|me equivoqu[eé]|undo|delete (that|the last)/.test(t)) {
      const last = moves.pop();
      if (!last) return { text: L.nothingUndo };
      if (last.kind === 'expense') {
        balance += last.amount;
        spentToday -= last.amount;
      } else {
        balance -= last.amount;
        daily = free() / DAYS;
      }
      return { text: L.undone(usd(last.amount), last.category, usd(leftToday()), usd(daily)) };
    }

    if (/puedo comprar|me alcanza|lo compro|puedo gastar \d|can i (buy|afford|spend \d)|should i buy/.test(t) && amount) {
      if (amount <= leftToday()) return { text: L.buyOk(usd(leftToday() - amount), usd(daily)) };
      const after = (free() - amount) / DAYS;
      if (after >= 0) return { text: L.buyWarn(usd(daily), usd(after)) };
      return { text: L.buyNo(usd(amount - free())) };
    }

    if (/cu[aá]nto puedo gastar|disponible|c[oó]mo voy|cu[aá]nto tengo|resumen|how much can i spend|how am i doing|budget|summary|how much do i have/.test(t)) {
      return { text: L.status(usd(Math.max(leftToday(), 0)), usd(daily), usd(balance)) };
    }

    if (amount && /me pagaron|me pag[oó]|salario|sueldo|quincena|me dieron|me dio|recib[ií]|me depositaron|vend[ií]|cobr[eé]|me cay[oó]|got paid|paid me|salary|received|earned|sold|payday/.test(t)) {
      balance += amount;
      daily = free() / DAYS;
      moves.push({ amount, kind: 'income', category: L.incomeCat, account: L.cash });
      return { text: L.income(usd(amount), usd(daily)), buttons: L.btns };
    }

    if (amount) {
      const cat = CATEGORIES.find(([re]) => re.test(t));
      const category = cat ? (EN ? cat[2] : cat[1]) : L.other;
      const icon = cat?.[3] ?? '🧾';
      const acc = ACCOUNTS.find(([re]) => re.test(t));
      const account = acc ? (EN ? acc[2] : acc[1]) : L.cash;
      balance -= amount;
      spentToday += amount;
      moves.push({ amount, kind: 'expense', category, account });
      const left = leftToday();
      const status =
        left >= 0 ? L.left(usd(left), usd(daily)) : L.over(usd(left), usd(daily), usd(Math.max(free(), 0) / (DAYS - 1)));
      return { text: `✅ ${usd(amount)} · ${icon} ${category} · ${account}\n${status}`, buttons: L.btns };
    }

    return { text: waNumber ? L.fallbackOpen : L.fallbackSoon, link: askLink(text) };
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
    bubble('bot', fmt(r.text), r.buttons, r.link);
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
