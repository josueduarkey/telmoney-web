// Puerta del panel (/admin). Solo entra quien inicia sesión con Clerk usando un correo verificado
// de ADMIN_EMAILS. El inicio de sesión es la página de Clerk (con Google): aquí no se carga
// ningún script de Clerk, y la página pública ni pasa por este archivo.
import type { MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { clerkMiddleware } from '@clerk/astro/server';
import { adminEmails, clerkApi, clerkKeys } from './lib/admin/clerk';
import { adminDb } from './lib/db';

const isAdminPath = (path: string) => path === '/admin' || path.startsWith('/admin/');

// `next('/ruta')` muestra esa página sin cambiar la URL y sin volver a pasar por aquí.
const NOTICE = '/admin/aviso';

const api = clerkApi;
const gate =
  clerkKeys && api
    ? clerkMiddleware(async (auth, context, next) => {
        const show = next as MiddlewareNext;
        const { userId, sessionId, redirectToSignIn } = auth();
        // Salir siempre se puede, aunque la cuenta no tenga acceso (así se cambia de cuenta);
        // sin sesión no hay nada que cerrar: al inicio.
        if (context.url.pathname === '/admin/salir') return userId ? next() : context.redirect('/', 303);
        if (!userId || !sessionId) return redirectToSignIn();

        const user = await api.users.getUser(userId);
        const email = user.emailAddresses.find(
          (e) => e.verification?.status === 'verified' && adminEmails.has(e.emailAddress.toLowerCase()),
        );
        if (!email) {
          context.locals.adminNotice = 'forbidden';
          return show(NOTICE);
        }
        context.locals.admin = { email: email.emailAddress, sessionId };
        if (!adminDb()) {
          context.locals.adminNotice = 'not-configured';
          return show(NOTICE);
        }
        return next();
      }, clerkKeys)
    : null;

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered || !isAdminPath(context.url.pathname)) return next();

  let response: Response;
  if (gate) {
    response = (await gate(context, next)) ?? (await next());
  } else {
    context.locals.adminNotice = 'not-configured';
    response = await next(NOTICE);
  }
  // Datos privados: que ningún navegador, CDN ni buscador los guarde.
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
