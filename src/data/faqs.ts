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
    a: 'Solo tú. Escribe «borrar mis datos» y se eliminan todos; «exportar» te los manda en CSV.',
  },
  {
    q: '¿Qué pasa cuando termina la prueba?',
    a: 'Eliges Starter o Pro. Si no, TelMoney deja de responder, pero tus datos quedan guardados para cuando vuelvas.',
  },
  {
    q: '¿TelMoney le escribe a la persona que me debe?',
    a: 'Por WhatsApp no: te arma el mensaje y lo mandas tú con un toque. Por correo sí lo puede mandar, siempre con tu confirmación (plan Pro).',
  },
  { q: '¿Cómo pago?', a: 'Con tarjeta de crédito o débito, por Wompi.' },
  { q: '¿Puedo cancelar?', a: 'Sí, cuando quieras. No hay contratos.' },
];
