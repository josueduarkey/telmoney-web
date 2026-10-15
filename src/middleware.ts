// Puertas de las zonas con sesión (Clerk). La página pública no pasa por aquí ni carga nada de Clerk.
//   /admin   solo un correo verificado de ADMIN_EMAILS
//   /cuenta  cualquier persona con sesión (su cuenta de TelMoney; docs/cuenta.md)
// El inicio de sesión es la página de Clerk (Google o código por correo).
import type { MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { clerkMiddleware } from '@clerk/astro/server';
import { adminEmails, clerkApi, clerkKeys } from './lib/admin/clerk';
import { adminDb } from './lib/db';

const zone = (path: string) =>
  path === '/admin' || path.startsWith('/admin/')
    ? 'admin'
    : path === '/cuenta' || path.startsWith('/cuenta/')
      ? 'cuenta'
      : null;

// `next('/ruta')` muestra esa página sin cambiar la URL y sin volver a pasar por aquí.
const NOTICE = '/admin/aviso';
const SALIR = new Set(['/admin/salir', '/cuenta/salir']);

const api = clerkApi;
const gate =
  clerkKeys && api
    ? clerkMiddleware(async (auth, context, next) => {
        const show = next as MiddlewareNext;
        const { userId, sessionId, redirectToSignIn } = auth();
        // Salir siempre se puede, aunque la cuenta no tenga acceso (así se cambia de cuenta);
        // sin sesión no hay nada que cerrar: al inicio.
        if (SALIR.has(context.url.pathname)) return userId ? next() : context.redirect('/', 303);
        if (!userId || !sessionId) return redirectToSignIn();

        if (zone(context.url.pathname) === 'cuenta') {
          context.locals.cuenta = { userId, sessionId };
          return next();
        }

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
  const area = zone(context.url.pathname);
  if (context.isPrerendered || !area) return next();

  let response: Response;
  if (gate) {
    response = (await gate(context, next)) ?? (await next());
  } else if (area === 'admin') {
    context.locals.adminNotice = 'not-configured';
    response = await next(NOTICE);
  } else {
    response = new Response('Las cuentas todavía no están disponibles.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  // Datos privados: que ningún navegador, CDN ni buscador los guarde.
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
