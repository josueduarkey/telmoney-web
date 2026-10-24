// Lo que se edita desde el panel de cuenta: cada formulario hace POST a su propia página con un campo
// `accion`; la página arma la llamada al bot (/me, fase 2 en telmoney-bot/docs/cuenta-web.md) y vuelve a
// la misma página con el resultado en un aviso (lib/cuenta/pagina.ts: avisar). POST → 303 → GET: recargar
// no repite la acción.
// Astro revisa el Origin de cada POST (security.checkOrigin), así que otro sitio no puede mandarlos.
import type { AstroGlobal } from 'astro';
import { me } from '../admin/bot';
import { avisar } from './pagina';

export type Llamada = { path: string; method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown; ok: string };
/** Una llamada al bot, o el texto del error si el formulario no sirve. */
export type Plan = Llamada | string;

/** "12.50", "12,50", "$1,250.75" → número; vacío o inválido → null. */
export function dinero(v: FormDataEntryValue | null): number | null {
  let s = String(v ?? '').replace(/[$\s]/g, '');
  if (!s) return null;
  // Una sola coma con 1–2 decimales es la coma decimal; si no, las comas son de miles.
  s = /^\d+,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
export const texto = (v: FormDataEntryValue | null) => String(v ?? '').trim();
export const entero = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? '').trim());
  return String(v ?? '').trim() && Number.isInteger(n) ? n : null;
};
/** El id de la ruta: solo dígitos (el bot igual responde 404 si no es de la persona). */
export const idDe = (v: FormDataEntryValue | null) => (/^\d{1,18}$/.test(String(v ?? '')) ? String(v) : null);

/** Corre la acción del formulario y vuelve a la página con el resultado. */
export async function ejecutar(
  Astro: AstroGlobal,
  token: string,
  planear: (accion: string, f: FormData) => Plan,
): Promise<Response> {
  const f = await Astro.request.formData();
  // El botón que se tocó va al final (p. ej. «Sí, borrar»); si no, la acción del campo oculto.
  const plan = planear(texto(f.getAll('accion').at(-1) ?? null), f);
  if (typeof plan === 'string') {
    avisar(Astro.cookies, { tipo: 'error', texto: plan });
  } else {
    const r = await me(plan.path, token, { method: plan.method, body: plan.body });
    if (r.ok) avisar(Astro.cookies, { tipo: 'ok', texto: plan.ok });
    else if (r.status === 404 && /^not found$/i.test(r.detail))
      avisar(Astro.cookies, { tipo: 'error', texto: 'Esto todavía no se puede hacer desde la web. Pídeselo por WhatsApp.' });
    else avisar(Astro.cookies, { tipo: 'error', texto: r.detail });
  }
  // Vuelve a la misma página, con sus filtros.
  return Astro.redirect(`${Astro.url.pathname}${Astro.url.search}`, 303);
}
