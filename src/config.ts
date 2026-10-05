// Todo lo que cambia el día del lanzamiento vive aquí (o en .env).

const env = import.meta.env;

/** Número oficial en formato internacional sin "+" (ej. 50370000000). Vacío = todavía no existe. */
export const WHATSAPP_NUMBER: string = env.PUBLIC_WHATSAPP_NUMBER ?? '';

/** Con número oficial, los CTA abren WhatsApp. Sin él, llevan a la lista de espera. */
export const LAUNCHED = WHATSAPP_NUMBER.length > 0;

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20TelMoney`;

/** Endpoint que recibe el formulario de la beta (POST JSON). Vacío = modo demo. */
export const WAITLIST_URL: string = env.PUBLIC_WAITLIST_URL ?? '';

export const CTA = LAUNCHED
  ? { label: 'Pruébalo gratis 7 días', href: WHATSAPP_URL, external: true, cursor: 'Pruébalo' }
  : { label: 'Únete a la beta', href: '#beta', external: false, cursor: 'Únete' };

/** Apertura de la beta: 1 de noviembre de 2026, medianoche en El Salvador (UTC−6). */
export const RELEASE_AT = '2026-11-01T00:00:00-06:00';

export const SITE = {
  name: 'TelMoney',
  url: 'https://telmoney.app',
  title: 'TelMoney · Tu pisto en orden, por WhatsApp',
  description:
    'Cuéntale tus gastos por WhatsApp como a un amigo. TelMoney anota todo, te dice cuánto puedes gastar hoy y te avisa antes de cada pago. Sin apps, sin Excel.',
  instagram: 'https://instagram.com/telmoney.sv',
  tiktok: 'https://tiktok.com/@telmoney.sv',
  email: 'hola@telmoney.app',
};

export const PLANS = {
  starter: { monthly: 4.99, annual: 49.9 },
  pro: { monthly: 9.99, annual: 99.9 },
};
