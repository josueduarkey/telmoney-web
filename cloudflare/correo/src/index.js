// Worker de correo (Cloudflare Email Routing → este Worker → bot). docs/correo.md
//
// Cada persona tiene una dirección propia, <alias>@gastos.telmoney.app, y le reenvía ahí (con un filtro
// de Gmail u Outlook) los correos de su banco. Este Worker no guarda nada ni decide nada: lee el correo,
// se queda con lo útil (remitente, asunto, fecha y el texto) y se lo pasa al bot, que sabe de quién es
// la dirección, saca el monto y el comercio, y le pregunta a la persona por WhatsApp si lo anota.
//
//   404 del bot  → la dirección no existe o se desconectó: se rechaza (el remitente recibe el rebote)
//   429 del bot  → pasó el límite del día: se rechaza
//   422 del bot  → no pudo leer el correo: se rechaza
//   otro error   → se lanza: Cloudflare responde con un error temporal y el servidor que lo mandó
//                  (Gmail, Outlook) lo vuelve a intentar más tarde. Así no se pierde si el bot se cae.
import PostalMime from 'postal-mime';

// Más que esto no es una notificación de banco (y no se le manda al bot).
const MAX_BYTES = 1_000_000;
const MAX_TEXTO = 30_000;
const ALIAS = /^[a-z0-9]{6,32}$/;

/** De HTML a texto plano, suficiente para leer montos y comercios. */
const sinHtml = (html) =>
  html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '\t')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();

export default {
  async email(message, env) {
    const [usuario, dominio] = message.to.toLowerCase().split('@');
    if (dominio !== env.DOMINIO || !ALIAS.test(usuario)) return message.setReject('Esta dirección no existe.');
    if (message.rawSize > MAX_BYTES) return message.setReject('Correo demasiado grande.');

    const correo = await PostalMime.parse(message.raw);
    const texto = (correo.text?.trim() || sinHtml(correo.html ?? '')).slice(0, MAX_TEXTO);

    const res = await fetch(`${env.BOT_URL}/correo/entrante`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CORREO_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alias: usuario,
        // El remitente del encabezado (el banco, o Google al confirmar el reenvío) y el del sobre
        // (quien lo reenvió: la cuenta de Gmail de la persona).
        de: correo.from?.address?.toLowerCase() ?? null,
        de_nombre: correo.from?.name ?? null,
        de_sobre: message.from.toLowerCase(),
        asunto: correo.subject ?? '',
        fecha: correo.date ?? null,
        message_id: correo.messageId ?? message.headers.get('message-id'),
        texto,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (res.ok) return;
    if (res.status === 404) return message.setReject('Esta dirección no existe.');
    if (res.status === 429) return message.setReject('Esta dirección recibió demasiados correos hoy.');
    // Un correo que el bot no puede leer no se arregla reintentando. (Un 401, token mal puesto, sí se
    // reintenta: así no se pierde nada mientras se corrige.)
    if (res.status === 422) return message.setReject('No pudimos leer este correo.');
    throw new Error(`El bot respondió ${res.status}`);
  },
};
