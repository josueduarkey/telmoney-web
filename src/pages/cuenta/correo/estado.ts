// GET /cuenta/correo/estado: si ya llegó el código de Google para confirmar el reenvío
// (la pantalla del correo lo consulta cada pocos segundos). Solo dice sí o no.
import type { APIRoute } from 'astro';
import { me, type Correo } from '../../../lib/admin/bot';
import { tokenOf } from '../../../lib/cuenta/session';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const token = await tokenOf(locals);
  const r = token ? await me<Correo>('/me/correo', token) : null;
  const listo = Boolean(r?.ok && (r.data.confirmacion?.codigo || r.data.ultimo_correo));
  return new Response(JSON.stringify({ codigo: listo }), { headers: { 'Content-Type': 'application/json' } });
};
