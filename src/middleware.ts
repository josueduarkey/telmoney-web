// Puertas de las zonas con sesión (Clerk). La página pública no pasa por aquí ni carga nada de Clerk.
//   /admin   solo un correo verificado de ADMIN_EMAILS
//   /cuenta  cualquier persona con sesión (su cuenta de TelMoney; docs/cuenta.md)
// El inicio de sesión es /entrar: el formulario de Clerk dentro del sitio (Google o código por correo).
import type { MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { clerkMiddleware } from '@clerk/astro/server';
import { adminEmailOf, clerkApi, clerkKeys } from './lib/admin/clerk';
import { adminDb } from './lib/db';
import { avisar } from './lib/cuenta/pagina';

const zone = (path: string) =>
  path === '/admin' || path.startsWith('/admin/')
    ? 'admin'
    : path === '/cuenta' || path.startsWith('/cuenta/')
      ? 'cuenta'
      : null;

// `next('/ruta')` muestra esa página sin cambiar la URL y sin volver a pasar por aquí.
const NOTICE = '/admin/aviso';
const SALIR = new Set(['/admin/salir', '/cuenta/salir', '/admin/salir/', '/cuenta/salir/']);

const api = clerkApi;
const gate =
  clerkKeys && api
    ? clerkMiddleware(async (auth, context, next) => {
        const show = next as MiddlewareNext;
        const { userId, sessionId, redirectToSignIn } = auth();
        // Salir siempre se puede, aunque la cuenta no tenga acceso (así se cambia de cuenta);
        // sin sesión no hay nada que cerrar: al inicio.
        if (SALIR.has(context.url.pathname)) return userId ? next() : context.redirect('/', 303);
        if (!userId || !sessionId) {
          // Un formulario de /cuenta que llega con la sesión vencida (dura un minuto y en un POST Clerk no
          // la puede renovar): de vuelta a la misma página, que al abrirse sí la renueva. Si de verdad
          // salió, esa visita lo manda a /entrar.
          if (context.request.method === 'POST' && zone(context.url.pathname) === 'cuenta') {
            avisar(context.cookies, { tipo: 'error', texto: 'No se guardó porque tu sesión se renovó. Inténtalo otra vez.' });
            return context.redirect(context.url.pathname + context.url.search, 303);
          }
          return redirectToSignIn();
        }

        if (zone(context.url.pathname) === 'cuenta') {
          context.locals.cuenta = { userId, sessionId };
          return next();
        }

        const email = await adminEmailOf(userId);
        if (!email) {
          context.locals.adminNotice = 'forbidden';
          return show(NOTICE);
        }
        context.locals.admin = { email, sessionId };
        if (!adminDb()) {
          context.locals.adminNotice = 'not-configured';
          return show(NOTICE);
        }
        return next();
      }, { ...clerkKeys, signInUrl: '/entrar', signUpUrl: '/entrar' })
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
