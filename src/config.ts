// Todo lo que cambia el día del lanzamiento vive aquí (o en .env).

const env = import.meta.env;

/** Número oficial en formato internacional sin "+" (ej. 50370000000). Vacío = todavía no existe. */
export const WHATSAPP_NUMBER: string = env.PUBLIC_WHATSAPP_NUMBER ?? '';

/** Con número oficial, los CTA abren WhatsApp. Sin él, llevan a la lista de espera. */
export const LAUNCHED = WHATSAPP_NUMBER.length > 0;

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20TelMoney`;

/** App de TelMoney (opcional: todo funciona por WhatsApp).
 *  Google Play: la ficha de la app en PUBLIC_PLAY_STORE_URL; mientras no exista, lleva a la búsqueda de "TelMoney".
 *  App Store: todavía no está; se muestra "Muy pronto" hasta que haya PUBLIC_APP_STORE_URL. */
export const PLAY_STORE_URL: string =
  env.PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/search?q=TelMoney&c=apps';
export const APP_STORE_URL: string = env.PUBLIC_APP_STORE_URL ?? '';

/** Endpoint que recibe el formulario de la beta (POST JSON). Por defecto, el de esta misma página
 *  (pages/api/waitlist.ts), que guarda directo en la base. */
export const WAITLIST_URL: string = env.PUBLIC_WAITLIST_URL || '/api/waitlist';

export const CTA = LAUNCHED
  ? { label: 'Pruébalo gratis', href: WHATSAPP_URL, external: true, cursor: 'Pruébalo' }
  : { label: 'Únete a la beta', href: '#beta', external: false, cursor: 'Únete' };

/** Apertura de la beta: 1 de noviembre de 2026, medianoche en El Salvador (UTC−6). */
export const RELEASE_AT = '2026-11-01T00:00:00-06:00';

/** Datos fijos de la marca. Los textos para buscadores y redes viven en src/seo/meta.ts. */
export const SITE = {
  name: 'TelMoney',
  /** Dominio público (sin "/" final). Las imágenes para compartir necesitan URLs absolutas. */
  url: (env.PUBLIC_SITE_URL || 'https://telmoney.app').replace(/\/$/, ''),
  tagline: 'Tu dinero en orden, por WhatsApp.',
  instagram: 'https://instagram.com/telmoney.sv',
  tiktok: 'https://tiktok.com/@telmoney.sv',
  /** Usuario de X sin "@". Vacío = no se publica twitter:site. */
  x: env.PUBLIC_X_HANDLE ?? '',
  email: 'hola@telmoney.app',
};

// Planes. Las claves (gratis, starter, pro) son las del bot y de los pagos; `name` es lo que ve la gente.
// Los límites del plan gratis los aplica el bot (telmoney-bot/docs/precios-y-pagos.md); aquí solo se muestran.
export const PLANS = {
  gratis: { name: 'Free', monthly: 0, annual: 0 },
  starter: { name: 'Plus', monthly: 4.99, annual: 49.9 },
  pro: { name: 'Pro', monthly: 9.99, annual: 99.9 },
};
export const FREE_LIMITS = { perDay: 10, questions: 2 };

/** "pro_mensual" → "Pro mensual"; "pro" → "Pro". */
export const planDisplay = (id: string) => {
  const [nivel, periodo] = id.split('_');
  const name = PLANS[nivel as keyof typeof PLANS]?.name ?? nivel.charAt(0).toUpperCase() + nivel.slice(1);
  return periodo ? `${name} ${periodo}` : name;
};
