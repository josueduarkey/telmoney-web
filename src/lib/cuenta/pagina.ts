// Lo que repite cada página de /cuenta: la sesión, las listas para los formularios (cuentas y
// categorías) y el aviso de lo último que se hizo.
import type { AstroCookies, AstroGlobal } from 'astro';
import { me, type Categoria, type CuentaItem } from '../admin/bot';
import { tokenOf } from './session';

/** El token de la persona, o la respuesta con la que la página tiene que salir (sin sesión). */
export async function sesion(Astro: AstroGlobal): Promise<{ token: string } | { salir: Response }> {
  // Segunda llave (la primera es src/middleware.ts).
  if (!Astro.locals.cuenta) return { salir: new Response('No autorizado', { status: 401 }) };
  const token = await tokenOf(Astro.locals);
  if (!token) return { salir: Astro.redirect('/cuenta/salir') };
  return { token };
}

/** Cuentas activas y categorías para los select. Si el bot no las da, listas vacías (no se puede editar). */
export async function opciones(token: string, { categorias = true, cuentas = true } = {}) {
  const [rcat, rcue] = await Promise.all([
    categorias ? me<{ categorias: Categoria[] }>('/me/categorias', token) : null,
    cuentas ? me<{ cuentas: CuentaItem[] }>('/me/cuentas', token) : null,
  ]);
  return {
    categorias: rcat?.ok ? (rcat.data?.categorias ?? []) : [],
    cuentas: rcue?.ok ? (rcue.data?.cuentas ?? []).filter((c) => c.activa !== false && c.id) : [],
    ok: (!rcat || rcat.ok) && (!rcue || rcue.ok),
  };
}

/** "comida fuera" → "Comida fuera" (el bot guarda las categorías en minúsculas). */
export const cap = (s: string | null | undefined) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// ── El aviso de lo último que se hizo ("Meta creada.", o el error del bot). Va en una cookie de un
// minuto, no en la URL: así nadie puede mandar un enlace a telmoney.app con un mensaje inventado.
const FLASH = 'tm-flash';
export type Aviso = { tipo: 'ok' | 'error'; texto: string };

export function avisar(cookies: AstroCookies, aviso: Aviso) {
  cookies.set(FLASH, JSON.stringify({ tipo: aviso.tipo, texto: aviso.texto.slice(0, 300) }), {
    path: '/cuenta',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60,
  });
}

/** Lee el aviso y lo borra (se muestra una sola vez). */
export function leerAviso(cookies: AstroCookies): Aviso | null {
  const raw = cookies.get(FLASH)?.value;
  if (!raw) return null;
  cookies.delete(FLASH, { path: '/cuenta' });
  try {
    const a = JSON.parse(raw) as Aviso;
    return (a.tipo === 'ok' || a.tipo === 'error') && typeof a.texto === 'string' ? a : null;
  } catch {
    return null;
  }
}
