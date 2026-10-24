// Cómo se escriben y se leen las fuentes de ingreso en el panel: cada cuánto llegan y qué días. Lo
// comparten /cuenta/ingresos (el formulario) y /cuenta/apartados (de qué fuentes sale cada uno).
import type { Ingreso } from '../admin/bot';
import { texto } from './acciones';

export const FRECUENCIAS = {
  semanal: 'Cada semana',
  quincenal: 'Cada quincena',
  mensual: 'Una vez al mes',
  dias: 'Ciertos días del mes',
} as const;
export type Frecuencia = keyof typeof FRECUENCIAS;
export const SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const diaMes = (d: number) => (d === 31 ? 'el último día' : `el ${d}`);
const lista = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}` : (xs[0] ?? ''));

/** "Cada semana, los lunes" · "Cada quincena: el 15 y el último día". */
export function cadaCuanto(i: Pick<Ingreso, 'frecuencia' | 'dias'>): string {
  const dias = [...(i.dias ?? [])].sort((a, b) => a - b);
  if (i.frecuencia === 'semanal') return `Cada semana, ${lista(dias.map((d) => `los ${SEMANA[d - 1] ?? '?'}`))}`;
  if (!dias.length) return FRECUENCIAS[i.frecuencia] ?? i.frecuencia;
  if (i.frecuencia === 'mensual') return `Cada mes, ${diaMes(dias[0])}`;
  return `${i.frecuencia === 'quincenal' ? 'Cada quincena' : 'Cada mes'}: ${lista(dias.map(diaMes))}`;
}

/** Los días que eligió en el formulario, o el texto del error. Quincenal sin días = el 15 y el último. */
export function leerDias(frecuencia: Frecuencia, f: FormData): number[] | string {
  if (frecuencia === 'semanal') {
    const d = [...new Set(f.getAll('dia_semana').map(Number))].filter((n) => n >= 1 && n <= 7).sort((a, b) => a - b);
    if (!d.length) return 'Elige qué día de la semana te llega.';
    if (d.length > 4) return 'Son 4 días de la semana como máximo.';
    return d;
  }
  const d = [...new Set(texto(f.get('dias_mes')).split(/[^\d]+/).filter(Boolean).map(Number))].sort((a, b) => a - b);
  if (d.some((n) => n < 1 || n > 31)) return 'Los días del mes van del 1 al 31 (31 = el último día).';
  if (frecuencia === 'quincenal') {
    if (!d.length) return [15, 31];
    return d.length === 2 ? d : 'En una quincena son 2 días, por ejemplo: 15 y 31.';
  }
  if (frecuencia === 'mensual') return d.length === 1 ? d : 'Escribe un solo día del mes, por ejemplo: 5.';
  if (!d.length) return 'Escribe los días del mes, por ejemplo: 5 y 20.';
  return d.length <= 4 ? d : 'Son 4 días como máximo.';
}
