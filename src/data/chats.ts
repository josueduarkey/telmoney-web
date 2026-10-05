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
      '💵 *¡Día de pago!* Entraron $650.00.\nHasta tu próximo ingreso (31/10, en 16 días):\n💰 En tus cuentas: $650.00\n📌 Gastos fijos por pagar: $300.00\n🐷 Tu 20% de ahorro: $130.00\n🟢 Te quedan *$13.75 por día* para todo lo demás.\n💪 ¿Apartas tu 20% (*$130.00*) para *moto*?',
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
    text: '✅ $1.20 · transporte · n1co\n🟢 Hoy te quedan *$17.00* de $21.70.',
    time: '12:58',
  },
  ...tenis,
];
