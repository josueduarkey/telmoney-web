// Textos para buscadores y redes sociales. Un solo lugar para todo lo que "se ve afuera" de la página.
//
// Por qué cada texto es distinto:
// - <title> y meta description son para Google: llevan lo que la gente busca ("control de gastos",
//   "WhatsApp") y caben sin cortarse (≈60 y ≈155 caracteres).
// - og:title / og:description son para cuando alguien comparte el link (WhatsApp, Facebook, LinkedIn,
//   X, Telegram, iMessage): van con el lema, más cortos y terminan en un llamado a la acción.
// - Todo cambia solo el día del lanzamiento (LAUNCHED en config.ts): de "únete a la beta" a "pruébalo gratis".
import { LAUNCHED, SITE } from '../config';

// Corto a propósito (≈90 caracteres): WhatsApp muestra 2 líneas y Facebook 1; el beneficio va primero.
const CTA_SOCIAL = LAUNCHED ? 'Pruébalo gratis.' : 'Beta gratis el 2 de noviembre.';

export const SEO = {
  /** Idioma del contenido: español neutro (se lanza en El Salvador, pensado para Latinoamérica). */
  lang: 'es',
  /** Facebook no reconoce es_SV: para Latinoamérica usa es_LA. */
  ogLocale: 'es_LA',

  /** 61 caracteres / 571 px (Google corta cerca de 580 px): marca + lo que se busca + el lema. */
  title: 'TelMoney: control de gastos por WhatsApp | Tu dinero en orden',
  /** ≈150 caracteres: qué hace, el beneficio y el llamado a la acción. */
  description: LAUNCHED
    ? 'Anota tus gastos con un mensaje, un audio o la foto del recibo. TelMoney te dice cuánto puedes gastar hoy y te avisa antes de cada pago. Pruébalo gratis.'
    : 'Anota tus gastos con un mensaje, un audio o la foto del recibo. TelMoney te dice cuánto puedes gastar hoy y te avisa antes de cada pago. Únete a la beta.',

  /** Para redes: el lema manda; el nombre ya aparece como og:site_name. */
  ogTitle: 'Tu dinero en orden, por WhatsApp',
  ogDescription: `Sabe cuánto puedes gastar hoy con un mensaje de WhatsApp. ${CTA_SOCIAL}`,

  /** Imagen para compartir: 1200×630 (1.91:1), JPEG liviano (WhatsApp no muestra imágenes pesadas).
   *  Se genera con "npm run og" (scripts/og.mjs). Si cambia el diseño, sube el número de ?v=
   *  para que WhatsApp y Facebook no sigan mostrando la versión vieja guardada en caché. */
  image: {
    path: '/og/telmoney-og.jpg?v=5',
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: 'TelMoney: tu dinero en orden, por WhatsApp. Un chat responde "Hoy puedes gastar $21.70".',
  },
};

/** Lo mismo para la página en inglés (/en/). El bot habla español: la descripción no promete otra cosa. */
const CTA_SOCIAL_EN = LAUNCHED ? 'Try it free.' : 'Free beta on November 2.';
export const SEO_EN: typeof SEO = {
  lang: 'en',
  ogLocale: 'en_US',
  title: 'TelMoney: expense tracker on WhatsApp | Your money in order',
  description: LAUNCHED
    ? 'Log expenses with a message, a voice note or a receipt photo. TelMoney tells you how much you can spend today and reminds you before every bill. Try it free.'
    : 'Log expenses with a message, a voice note or a receipt photo. TelMoney tells you how much you can spend today and reminds you before every bill. Join the beta.',
  ogTitle: 'Your money in order, on WhatsApp',
  ogDescription: `Know how much you can spend today with a WhatsApp message. ${CTA_SOCIAL_EN}`,
  image: { ...SEO.image, alt: 'TelMoney: your money in order, on WhatsApp. A chat answers "Today you can spend $21.70".' },
};

export const seoFor = (lang: 'es' | 'en') => (lang === 'en' ? SEO_EN : SEO);

/** Convierte una ruta del sitio en URL absoluta (las redes no aceptan rutas relativas). */
export const absolute = (path: string) => new URL(path, SITE.url + '/').toString();
