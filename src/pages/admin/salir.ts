// POST /admin/salir: cierra la sesión del panel. Revoca la sesión en Clerk y borra su cookie aquí,
// para que no siga abierta el minuto que dura el token. Astro rechaza un POST que venga de otro sitio.
import type { APIRoute } from 'astro';
import { clerkApi } from '../../lib/admin/clerk';

export const prerender = false;

export const POST: APIRoute = async ({ locals, request, cookies, redirect }) => {
  const sessionId = locals.auth?.().sessionId;
  if (clerkApi && sessionId) {
    try {
      await clerkApi.sessions.revokeSession(sessionId);
    } catch {
      // ya estaba cerrada o vencida: igual se borra la cookie
    }
  }
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const name = part.split('=')[0].trim();
    if (name.startsWith('__session')) cookies.delete(name, { path: '/' });
  }
  return redirect('/', 303);
};
