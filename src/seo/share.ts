// Compartir TelMoney: mensajes listos para cada red, con su llamado a la acción.
// Cada link lleva utm_* para saber de dónde llega la gente: la lista de espera guarda esos utm
// (scripts/waitlist.ts), así que se puede medir qué red trae más registros.
import { LAUNCHED, SITE } from '../config';

/** "nativo" = el menú de compartir del celular (no se sabe a qué app fue). */
export type Network = 'whatsapp' | 'telegram' | 'facebook' | 'x' | 'linkedin' | 'email' | 'copy' | 'nativo';

/** Link a la página con la campaña de la red que lo compartió (en inglés, a /en/). */
export const shareUrl = (network: Network, lang: 'es' | 'en' = 'es') => {
  const u = new URL(SITE.url + (lang === 'en' ? '/en/' : '/'));
  u.searchParams.set('utm_source', network);
  u.searchParams.set('utm_medium', ['email', 'copy', 'nativo'].includes(network) ? 'referral' : 'social');
  u.searchParams.set('utm_campaign', LAUNCHED ? 'compartir' : 'beta_compartir');
  return u.toString();
};

/** Mensajes: cercanos, en español neutro, con el beneficio concreto y la acción al final.
 *  WhatsApp y Telegram son conversaciones: van en primera persona, como lo diría un amigo. */
const CTA = LAUNCHED ? 'Pruébalo gratis' : 'La beta abre el 2 de noviembre y es gratis';

export const shareText = {
  chat: `Mira esto 👀 TelMoney te dice cuánto puedes gastar hoy, solo con mensajes de WhatsApp. ${CTA}:`,
  x: `Tu dinero en orden, por WhatsApp 💚 Le escribes tus gastos como a un amigo y te dice cuánto puedes gastar hoy. ${CTA} 👇`,
  emailSubject: 'Para que el dinero te alcance todo el mes',
  emailBody: `Encontré TelMoney: le escribes tus gastos por WhatsApp como a un amigo y te dice cuánto puedes gastar hoy, con tus pagos fijos ya descontados. ${CTA}:`,
};

const CTA_EN = LAUNCHED ? 'Try it free' : 'The beta opens on November 2 and it is free';
export const shareTextEn: typeof shareText = {
  chat: `Check this out 👀 TelMoney tells you how much you can spend today, just with WhatsApp messages. ${CTA_EN}:`,
  x: `Your money in order, on WhatsApp 💚 Text it your expenses like you would a friend and it tells you how much you can spend today. ${CTA_EN} 👇`,
  emailSubject: 'So your money lasts all month',
  emailBody: `I found TelMoney: you text your expenses on WhatsApp like you would a friend and it tells you how much you can spend today, with your bills already taken out. ${CTA_EN}:`,
};
export const shareTextFor = (lang: 'es' | 'en') => (lang === 'en' ? shareTextEn : shareText);

/** URL de cada red con el mensaje y el link ya armados. */
export const shareHref = (network: Exclude<Network, 'copy' | 'nativo'>, lang: 'es' | 'en' = 'es') => {
  const url = shareUrl(network, lang);
  const shareText = shareTextFor(lang);
  const e = encodeURIComponent;
  switch (network) {
    case 'whatsapp':
      return `https://wa.me/?text=${e(`${shareText.chat} ${url}`)}`;
    case 'telegram':
      return `https://t.me/share/url?url=${e(url)}&text=${e(shareText.chat)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`;
    case 'x':
      return `https://x.com/intent/post?text=${e(shareText.x)}&url=${e(url)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`;
    case 'email':
      return `mailto:?subject=${e(shareText.emailSubject)}&body=${e(`${shareText.emailBody}\n\n${url}`)}`;
  }
};
