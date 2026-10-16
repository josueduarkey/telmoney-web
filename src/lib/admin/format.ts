// Formatos del panel: dinero en USD, números, fechas en hora de El Salvador y teléfonos.
import { TZ } from './queries';
import { planDisplay } from '../../config';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const moneyRound = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-US');

export const usd = (n: number) => money.format(n);
/** Sin centavos desde $1,000: en una tarjeta grande, los centavos son ruido. */
export const usdShort = (n: number) => (Math.abs(n) >= 1000 ? moneyRound.format(n) : money.format(n));
/** Costos chicos (fracciones de centavo): con 3 decimales para que no salga $0.00. */
export const usdCost = (n: number) =>
  n > 0 && n < 1 ? `$${n.toFixed(3)}` : money.format(n);
export const int = (n: number) => num.format(n);

const dateFmt = new Intl.DateTimeFormat('es-SV', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es-SV', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const dayFmt = new Intl.DateTimeFormat('es-SV', { timeZone: 'UTC', day: 'numeric', month: 'short' });

export const date = (d: string | Date | null) => (d ? dateFmt.format(new Date(d)) : '—');
export const dateTime = (d: string | Date | null) => (d ? dateTimeFmt.format(new Date(d)) : '—');
/** Un día "2026-10-13" (sin hora), como sale de messagesPerDay. */
export const day = (iso: string) => dayFmt.format(new Date(`${iso}T00:00:00Z`));

/** "hace 3 h", "hace 2 días"… para la última actividad. */
export function ago(d: string | Date | null): string {
  if (!d) return 'nunca';
  const min = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  return days === 1 ? 'ayer' : days < 30 ? `hace ${days} días` : date(d);
}

/** +50370001234 → +503 7000 1234. Otros países, como vienen. */
export const phone = (p: string | null) =>
  !p ? '—' : /^\+503\d{8}$/.test(p) ? `+503 ${p.slice(4, 8)} ${p.slice(8)}` : p;

/** Enlace para escribirle por WhatsApp. */
export const waLink = (p: string) => `https://wa.me/${p.replace(/\D/g, '')}`;

/** "pro_mensual" → "Pro mensual" (los nombres viven en src/config.ts). */
export const planName = (p: string | null) =>
  !p ? '—' : p === 'mensual' ? 'Mensual' : p === 'anual' ? 'Anual' : planDisplay(p);
