// Descarga de un reporte del mes: la web se lo pide al bot (/me/reporte) con el token de la persona y
// se lo pasa tal cual. El navegador nunca habla con el bot ni ve el token.
import type { APIRoute } from 'astro';
import { BOT_API_URL } from 'astro:env/server';
import { tokenOf } from '../../lib/cuenta/session';

export const prerender = false;

const FORMATOS = new Set(['xlsx', 'csv', 'pdf']);

export const GET: APIRoute = async ({ locals, url, redirect }) => {
  if (!locals.cuenta) return new Response('No autorizado', { status: 401 });
  const token = await tokenOf(locals);
  if (!token) return redirect('/cuenta/salir');

  const formato = url.searchParams.get('formato') ?? '';
  const mes = url.searchParams.get('mes') ?? '';
  const volver = (error: string) => redirect(`/cuenta/reportes?error=${encodeURIComponent(error)}`);
  if (!FORMATOS.has(formato) || !/^\d{4}-\d{2}$/.test(mes)) return volver('Elige un mes y un formato.');
  if (!BOT_API_URL) return volver('pronto');

  try {
    const res = await fetch(
      `${BOT_API_URL.replace(/\/$/, '')}/me/reporte?formato=${formato}&mes=${mes}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) },
    );
    if (res.status === 404) {
      const data = await res.json().catch(() => null);
      return /^not found$/i.test(data?.detail ?? '') ? volver('pronto') : volver(data?.detail || 'Ese mes no tiene movimientos.');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return volver(data?.detail || 'No pudimos generar el reporte. Intenta de nuevo.');
    }
    const headers = new Headers({
      'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition': res.headers.get('Content-Disposition') ?? `attachment; filename="telmoney-${mes}.${formato}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new Response(res.body, { status: 200, headers });
  } catch {
    return volver('TelMoney tardó demasiado en responder. Intenta de nuevo.');
  }
};
