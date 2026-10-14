// /admin/salir: cierra la sesión del panel. Revoca la sesión en Clerk y borra su cookie aquí,
// para que no siga abierta el minuto que dura el token.
// El botón «Salir» hace POST, pero si el token ya venció, Clerk primero lo renueva y regresa aquí
// con GET; por eso se aceptan los dos. (Cerrar sesión por GET a lo sumo saca al admin: no expone nada.)
import type { APIRoute } from 'astro';
import { clerkApi } from '../../lib/admin/clerk';

export const prerender = false;

const signOut: APIRoute = async ({ locals, request, cookies, redirect }) => {
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

export const GET = signOut;
export const POST = signOut;
