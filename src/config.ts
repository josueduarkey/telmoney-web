// Todo lo que cambia el día del lanzamiento vive aquí (o en .env).

const env = import.meta.env;

/** Número oficial en formato internacional sin "+" (ej. 50370000000). Vacío = todavía no existe. */
export const WHATSAPP_NUMBER: string = env.PUBLIC_WHATSAPP_NUMBER ?? '';

/** Con número oficial, los CTA abren WhatsApp. Sin él, llevan a la lista de espera. */
export const LAUNCHED = WHATSAPP_NUMBER.length > 0;

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20TelMoney`;

/** App de TelMoney (opcional: todo funciona por WhatsApp).
 *  Google Play: la ficha de la app en PUBLIC_PLAY_STORE_URL; mientras no exista, lleva a la búsqueda de «TelMoney».
 *  App Store: todavía no está; se muestra «Muy pronto» hasta que haya PUBLIC_APP_STORE_URL. */
export const PLAY_STORE_URL: string =
  env.PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/search?q=TelMoney&c=apps';
export const APP_STORE_URL: string = env.PUBLIC_APP_STORE_URL ?? '';

/** Endpoint que recibe el formulario de la beta (POST JSON). Vacío = modo demo. */
export const WAITLIST_URL: string = env.PUBLIC_WAITLIST_URL ?? '';

export const CTA = LAUNCHED
  ? { label: 'Pruébalo gratis 7 días', href: WHATSAPP_URL, external: true, cursor: 'Pruébalo' }
  : { label: 'Únete a la beta', href: '#beta', external: false, cursor: 'Únete' };

/** Apertura de la beta: 1 de noviembre de 2026, medianoche en El Salvador (UTC−6). */
export const RELEASE_AT = '2026-11-01T00:00:00-06:00';

/** Datos fijos de la marca. Los textos para buscadores y redes viven en src/seo/meta.ts. */
export const SITE = {
  name: 'TelMoney',
  /** Dominio público (sin «/» final). Las imágenes para compartir necesitan URLs absolutas. */
  url: (env.PUBLIC_SITE_URL || 'https://telmoney.app').replace(/\/$/, ''),
  tagline: 'Tu pisto en orden, por WhatsApp.',
  instagram: 'https://instagram.com/telmoney.sv',
  tiktok: 'https://tiktok.com/@telmoney.sv',
  /** Usuario de X sin «@». Vacío = no se publica twitter:site. */
  x: env.PUBLIC_X_HANDLE ?? '',
  email: 'hola@telmoney.app',
};

export const PLANS = {
  starter: { monthly: 4.99, annual: 49.9 },
  pro: { monthly: 9.99, annual: 99.9 },
};
