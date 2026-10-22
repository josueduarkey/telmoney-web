// Preguntas frecuentes: respuestas verdaderas (telmoney-bot/docs/marca.md §8).
// Las usa la sección de la página (Faq.astro) y los datos estructurados (seo/schema.ts):
// si cambia el producto, se cambia solo aquí.
export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  { q: '¿Tengo que descargar algo?', a: 'No. Todo pasa en WhatsApp, la app que ya tienes.' },
  {
    q: '¿Se conecta a mi banco?',
    a: 'No, y nunca te pide claves. Tú le cuentas tus movimientos por texto o audio, o le mandas la foto del recibo.',
  },
  {
    q: '¿Quién ve mis datos?',
    a: 'Tú y el equipo de TelMoney, para darte soporte y mejorar el servicio. Escribe "borrar mis datos" y se eliminan todos; "exportar" te los manda en CSV.',
  },
  {
    q: '¿Qué pasa cuando termina la prueba?',
    a: 'Sigues gratis con el plan Free: hasta 10 mensajes al día para anotar y saber cuánto puedes gastar. Si quieres más, pasas a Plus o a Pro. Tus datos siguen ahí.',
  },
  {
    q: '¿TelMoney le escribe a la persona que me debe?',
    a: 'Por WhatsApp no: te arma el mensaje y lo mandas tú con un toque. Por correo sí lo puede mandar, siempre con tu confirmación (plan Pro).',
  },
  { q: '¿Cómo pago?', a: 'Con tarjeta de crédito o débito, por Wompi.' },
  { q: '¿Puedo cancelar?', a: 'Sí, cuando quieras. No hay contratos.' },
];

/** Las mismas preguntas en inglés (página /en/). La primera avisa que el bot habla español. */
export const faqsEn: Faq[] = [
  {
    q: 'Does TelMoney speak English?',
    a: 'Not yet: TelMoney chats in Spanish. It is built for El Salvador first, and English is on the way.',
  },
  { q: 'Do I need to download anything?', a: 'No. Everything happens in WhatsApp, the app you already have.' },
  {
    q: 'Does it connect to my bank?',
    a: 'No, and it never asks for your passwords. You tell it your expenses by text or voice note, or send a photo of the receipt.',
  },
  {
    q: 'Who can see my data?',
    a: 'You and the TelMoney team, to give you support and improve the service. Write "borrar mis datos" and everything is deleted; "exportar" sends it to you as a CSV.',
  },
  {
    q: 'What happens when the trial ends?',
    a: 'You keep using it for free on the Free plan: up to 10 messages a day to log expenses and know how much you can spend. If you want more, upgrade to Plus or Pro. Your data stays there.',
  },
  {
    q: 'Does TelMoney message the person who owes me?',
    a: 'Not on WhatsApp: it writes the message and you send it with one tap. By email it can, always with your confirmation (Pro plan).',
  },
  { q: 'How do I pay?', a: 'With a credit or debit card, through Wompi.' },
  { q: 'Can I cancel?', a: 'Yes, anytime. There are no contracts.' },
];

export const faqsFor = (lang: 'es' | 'en') => (lang === 'en' ? faqsEn : faqs);
