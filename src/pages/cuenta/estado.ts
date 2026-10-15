// GET /cuenta/estado: si la cuenta ya quedó conectada con WhatsApp (la pantalla del código lo
// consulta cada pocos segundos). Solo dice sí o no.
import type { APIRoute } from 'astro';
import { me, type Me } from '../../lib/admin/bot';
import { tokenOf } from '../../lib/cuenta/session';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const token = await tokenOf(locals);
  const r = token ? await me<Me>('/me', token) : null;
  return new Response(JSON.stringify({ vinculado: Boolean(r?.ok && r.data.vinculado) }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
