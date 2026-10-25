// El calendario de /cuenta/calendario: qué pasó cada día (gastos e ingresos anotados) y qué viene
// (gastos fijos, ingresos esperados y deudas que vencen), con el color de cómo fue el día contra lo
// que puede gastar al día. Todo sale de lo que ya devuelve /me; aquí solo se acomoda por fecha.
import type { Deudas, Fijo, Ingreso, Limite, Movimiento, PlanMes } from '../admin/bot';
import { TZ } from '../admin/queries';

/** "2026-10-25" en la hora de El Salvador. Una fecha sin hora ya es el día (new Date la leería en UTC). */
export const isoDe = (d: string | Date) =>
  typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });
export const hoyIso = () => isoDe(new Date());

export const diasDelMes = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
/** 1 = lunes … 7 = domingo, como `dias` de un ingreso semanal. */
export const diaSemana = (s: string) => new Date(`${s}T12:00:00Z`).getUTCDay() || 7;

export type Evento = {
  tipo: 'ingreso' | 'fijo' | 'debo' | 'me_deben';
  nombre: string;
  /** null: no se sabe cuánto (un ingreso variable, un pago sin monto, el corte de la tarjeta). */
  monto: number | null;
  nota?: string;
};

/** Los días del mes en que toca algo que se repite: el 31 es el último día y un 30 en febrero, el 28. */
function fechasDe(frecuencia: Ingreso['frecuencia'], dias: number[], y: number, m: number): string[] {
  const fin = diasDelMes(y, m);
  if (frecuencia === 'semanal') {
    return Array.from({ length: fin }, (_, i) => iso(y, m, i + 1)).filter((f) => dias.includes(diaSemana(f)));
  }
  return [...new Set(dias.map((d) => iso(y, m, Math.min(d, fin))))];
}

/**
 * Lo que viene en el mes, de hoy en adelante (y lo atrasado, en su día). Un fijo que ya se pagó este
 * mes tiene su `proximo` en el otro: se muestra desde ahí. Lo mismo un ingreso que ya llegó.
 */
export function eventos(y: number, m: number, hoy: string, fijos: Fijo[], ingresos: Ingreso[], deudas: Deudas | null) {
  const por = new Map<string, Evento[]>();
  const add = (f: string, e: Evento) => por.set(f, [...(por.get(f) ?? []), e]);
  const mes = iso(y, m, 1).slice(0, 7);

  for (const f of fijos) {
    for (const fecha of fechasDe('mensual', [f.dia], y, m)) {
      if (fecha < hoy || (f.proximo && fecha < isoDe(f.proximo))) continue;
      const corte = f.tipo === 'tarjeta' && f.evento === 'corte';
      add(fecha, { tipo: 'fijo', nombre: corte ? `Corte · ${f.nombre}` : f.nombre, monto: corte ? null : f.monto });
    }
  }

  for (const i of ingresos) {
    if (i.activa === false) continue;
    const p = i.proximo;
    if (p?.estado === 'atrasado' && p.fecha.startsWith(mes)) {
      add(p.fecha, { tipo: 'ingreso', nombre: i.nombre, monto: p.monto, nota: 'no ha llegado' });
    }
    for (const fecha of fechasDe(i.frecuencia, i.dias ?? [], y, m)) {
      if (fecha < hoy || (p && fecha < p.fecha) || (p && fecha === p.fecha && p.estado !== 'esperado')) continue;
      add(fecha, { tipo: 'ingreso', nombre: i.nombre, monto: p && fecha === p.fecha ? p.monto : i.monto });
    }
  }

  for (const [lado, lista] of [['debo', deudas?.debo ?? []], ['me_deben', deudas?.me_deben ?? []]] as const) {
    for (const d of lista) {
      if (!d.vence || d.pendiente <= 0) continue;
      const fecha = isoDe(d.vence);
      if (!fecha.startsWith(mes)) continue;
      add(fecha, {
        tipo: lado,
        nombre: lado === 'debo' ? `Pagar a ${d.persona}` : `${d.persona} te paga`,
        monto: d.pendiente,
        nota: fecha < hoy ? 'venció' : undefined,
      });
    }
  }
  return por;
}

/**
 * Cuánto puede gastar al día, para darle color a cada día: lo libre del plan del mes entre los días del
 * mes; si no tiene ingresos, su límite general (semanal o del mes). null si no hay con qué comparar.
 */
export function ritmoDiario(plan: PlanMes | null, limites: Limite[], dias: number): { monto: number; de: string } | null {
  if (plan && plan.ingresos_mes > 0 && plan.libre_mes > 0) return { monto: plan.libre_mes / dias, de: 'lo libre de tu plan del mes' };
  const general = limites.filter((l) => !l.id_categoria && !l.categoria);
  const semana = general.find((l) => l.periodo === 'semana');
  if (semana) return { monto: semana.limite / 7, de: 'tu límite semanal' };
  const mes = general.find((l) => l.periodo === 'mes');
  if (mes) return { monto: mes.limite / dias, de: 'tu límite del mes' };
  return null;
}

/** Un gasto que es el pago de un fijo (misma categoría y mismo monto) no cuenta para el color del día. */
export const esPagoFijo = (mov: Movimiento, fijos: Fijo[]) =>
  mov.tipo === 'expense' &&
  fijos.some((f) => f.id_categoria && f.id_categoria === mov.id_categoria && f.monto !== null && Math.abs(f.monto - mov.monto) < 0.005);

export type Salud = 'bien' | 'cuidado' | 'pasado' | 'sin_gastos' | null;
/** Hasta lo que puede gastar, bien; hasta 1.5 veces, cuidado; más, se pasó. */
export function salud(gasto: number, ritmo: number | null): Salud {
  if (ritmo === null) return null;
  if (gasto < 0.005) return 'sin_gastos';
  if (gasto <= ritmo) return 'bien';
  return gasto <= ritmo * 1.5 ? 'cuidado' : 'pasado';
}
