// Compartir TelMoney: mensajes listos para cada red, con su llamado a la acción.
// Cada link lleva utm_* para saber de dónde llega la gente: la lista de espera guarda esos utm
// (scripts/waitlist.ts), así que se puede medir qué red trae más registros.
import { LAUNCHED, SITE } from '../config';

/** «nativo» = el menú de compartir del celular (no se sabe a qué app fue). */
export type Network = 'whatsapp' | 'telegram' | 'facebook' | 'x' | 'linkedin' | 'email' | 'copy' | 'nativo';

/** Link a la página con la campaña de la red que lo compartió. */
export const shareUrl = (network: Network) => {
  const u = new URL(SITE.url + '/');
  u.searchParams.set('utm_source', network);
  u.searchParams.set('utm_medium', ['email', 'copy', 'nativo'].includes(network) ? 'referral' : 'social');
  u.searchParams.set('utm_campaign', LAUNCHED ? 'compartir' : 'beta_compartir');
  return u.toString();
};

/** Mensajes: cercanos, en español neutro, con el beneficio concreto y la acción al final.
 *  WhatsApp y Telegram son conversaciones: van en primera persona, como lo diría un amigo. */
const CTA = LAUNCHED ? 'Pruébalo gratis 7 días' : 'La beta abre el 1 de noviembre y es gratis';

export const shareText = {
  chat: `Mira esto 👀 TelMoney te dice cuánto puedes gastar hoy, solo con mensajes de WhatsApp. ${CTA}:`,
  x: `Tu dinero en orden, por WhatsApp 💚 Le escribes tus gastos como a un amigo y te dice cuánto puedes gastar hoy. ${CTA} 👇`,
  emailSubject: 'Para que el dinero te alcance todo el mes',
  emailBody: `Encontré TelMoney: le escribes tus gastos por WhatsApp como a un amigo y te dice cuánto puedes gastar hoy, con tus pagos fijos ya descontados. ${CTA}:`,
};

/** URL de cada red con el mensaje y el link ya armados. */
export const shareHref = (network: Exclude<Network, 'copy' | 'nativo'>) => {
  const url = shareUrl(network);
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
