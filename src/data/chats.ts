// Conversaciones del bot (telmoney-bot/docs/marca.md §2), en español neutro.
// Montos de ejemplo; el formato y los emojis son los del bot. No inventar funciones nuevas aquí.

export type Msg = {
  from: 'me' | 'bot';
  text?: string;
  time?: string;
  /** Botones de respuesta rápida debajo de la burbuja */
  buttons?: string[];
  /** Nota de voz (duración) o foto de recibo en lugar de texto */
  voice?: string;
  receipt?: { merchant: string; total: string };
};

export const almuerzo: Msg[] = [
  { from: 'me', text: 'gasté 3.50 en el almuerzo', time: '12:41' },
  {
    from: 'bot',
    text: '✅ $3.50 · comida fuera · efectivo\n🟢 Hoy te quedan *$18.20* de $21.70.',
    time: '12:41',
    buttons: ['↩️ Deshacer', '📊 ¿Cómo voy?'],
  },
];

export const tenis: Msg[] = [
  { from: 'me', text: '¿puedo comprar unos tenis de 80?', time: '18:15' },
  {
    from: 'bot',
    text:
      '🟡 *Puedes, pero se sale de lo de hoy* ($21.70).\nSi los compras, tu disponible baja de $21.70 a *$14.43 por día* hasta el 15/10.',
    time: '18:15',
  },
];

export const alquiler: Msg[] = [
  {
    from: 'bot',
    text: '⏰ En 2 días (lun 20/10) vence *Alquiler*: $300.00.',
    time: '09:00',
    buttons: ['✅ Ya pagué'],
  },
];

export const juan: Msg[] = [
  { from: 'me', text: 'recuérdale a Juan', time: '19:30' },
  {
    from: 'bot',
    text:
      'Así le llegaría a *Juan*:\n_Hola Juan 👋 Te recuerdo los $12.50 de la pizza (quedamos para el 12/10). Cuando puedas me avisas. ¡Gracias! 🙌_\n¿Cómo se lo mando?',
    time: '19:30',
    buttons: ['📧 Por correo', '📱 Por WhatsApp'],
  },
];

export const salario: Msg[] = [
  { from: 'me', text: 'me pagaron 650 de salario', time: '07:48' },
  {
    from: 'bot',
    text:
      '💵 *¡Día de pago!* Recibiste $650.00.\nHasta tu próximo ingreso (31/10, en 16 días):\n💰 En tus cuentas: $650.00\n📌 Gastos fijos por pagar: $300.00\n🐷 Tu 20% de ahorro: $130.00\n🟢 Te quedan *$13.75 por día* para todo lo demás.\n💪 ¿Apartas tu 20% (*$130.00*) para *moto*?',
    time: '07:48',
    buttons: ['✅ Sí, apartar', '✏️ Otro monto'],
  },
];

export const reporte: Msg[] = [
  {
    from: 'bot',
    text:
      '📊 *Tu día — sáb 4/10*\n💸 Gastos: *$23.50* · 💰 Ingresos: *$0.00*\nEn qué: 🍽️ comida fuera $15.00 · 🚌 transporte $8.50\n🟢 Te quedaste dentro de tu disponible ($25.00)\n💵 Para mañana: *$24.80 por día*\n🎯 Moto: $340.00 de $2,500.00 (13%)\n❤️ Salud financiera: *78/100*\nVas bien: gastaste menos de tu disponible. Mañana trata de no pasar de $24.80.',
    time: '20:30',
  },
];

/** Guion del inicio: se reproduce en bucle. Mezcla texto, voz y una consulta para mostrar cómo se usa. */
export const heroScript: Msg[] = [
  ...almuerzo.map((m) => ({ ...m, buttons: undefined })),
  { from: 'me', voice: '0:04', time: '12:58' },
  {
    from: 'bot',
    text: '✅ $1.20 · transporte · billetera\n🟢 Hoy te quedan *$17.00* de $21.70.',
    time: '12:58',
  },
  ...tenis,
];

// ── Inglés (página /en/). El bot de verdad habla español; estas conversaciones solo muestran
//    cómo se usa a quien lee en inglés (la página lo aclara).
const almuerzoEn: Msg[] = [
  { from: 'me', text: 'spent 3.50 on lunch', time: '12:41' },
  {
    from: 'bot',
    text: '✅ $3.50 · eating out · cash\n🟢 You have *$18.20* left of $21.70 today.',
    time: '12:41',
    buttons: ['↩️ Undo', '📊 How am I doing?'],
  },
];

const tenisEn: Msg[] = [
  { from: 'me', text: 'can I buy sneakers for 80?', time: '18:15' },
  {
    from: 'bot',
    text:
      '🟡 *You can, but it goes over today* ($21.70).\nIf you buy them, your daily budget drops from $21.70 to *$14.43 a day* until 10/15.',
    time: '18:15',
  },
];

const alquilerEn: Msg[] = [
  {
    from: 'bot',
    text: '⏰ In 2 days (Mon 10/20) *Rent* is due: $300.00.',
    time: '09:00',
    buttons: ['✅ Already paid'],
  },
];

const juanEn: Msg[] = [
  { from: 'me', text: 'remind Juan', time: '19:30' },
  {
    from: 'bot',
    text:
      'This is what *Juan* would get:\n_Hi Juan 👋 Just a reminder about the $12.50 for the pizza (we said 10/12). Let me know when you can. Thanks! 🙌_\nHow should I send it?',
    time: '19:30',
    buttons: ['📧 By email', '📱 By WhatsApp'],
  },
];

const salarioEn: Msg[] = [
  { from: 'me', text: 'got paid 650 salary', time: '07:48' },
  {
    from: 'bot',
    text:
      '💵 *Payday!* You received $650.00.\nUntil your next income (10/31, in 16 days):\n💰 In your accounts: $650.00\n📌 Bills to pay: $300.00\n🐷 Your 20% savings: $130.00\n🟢 You have *$13.75 a day* for everything else.\n💪 Set aside your 20% (*$130.00*) for *motorbike*?',
    time: '07:48',
    buttons: ['✅ Yes, set aside', '✏️ Other amount'],
  },
];

const reporteEn: Msg[] = [
  {
    from: 'bot',
    text:
      '📊 *Your day — Sat 10/4*\n💸 Spent: *$23.50* · 💰 Received: *$0.00*\nOn: 🍽️ eating out $15.00 · 🚌 transport $8.50\n🟢 You stayed within your daily budget ($25.00)\n💵 For tomorrow: *$24.80 a day*\n🎯 Motorbike: $340.00 of $2,500.00 (13%)\n❤️ Financial health: *78/100*\nGood job: you spent less than your budget. Tomorrow try to stay under $24.80.',
    time: '20:30',
  },
];

const heroScriptEn: Msg[] = [
  ...almuerzoEn.map((m) => ({ ...m, buttons: undefined })),
  { from: 'me', voice: '0:04', time: '12:58' },
  {
    from: 'bot',
    text: '✅ $1.20 · transport · wallet\n🟢 You have *$17.00* left of $21.70 today.',
    time: '12:58',
  },
  ...tenisEn,
];

const CHATS = {
  es: { almuerzo, tenis, alquiler, juan, salario, reporte, heroScript },
  en: {
    almuerzo: almuerzoEn,
    tenis: tenisEn,
    alquiler: alquilerEn,
    juan: juanEn,
    salario: salarioEn,
    reporte: reporteEn,
    heroScript: heroScriptEn,
  },
};

/** Las conversaciones en el idioma de la página. */
export const chatsFor = (lang: 'es' | 'en') => CHATS[lang];
