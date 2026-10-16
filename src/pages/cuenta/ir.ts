// /cuenta/ir: a donde llega /entrar después de iniciar sesión, cuando nadie pidió una página en particular.
// El equipo (un correo de ADMIN_EMAILS) va directo al panel; los demás, a Mi cuenta.
// Pasa por src/middleware.ts como el resto de /cuenta: sin sesión, manda a /entrar.
import type { APIRoute } from 'astro';
import { adminEmailOf } from '../../lib/admin/clerk';

export const prerender = false;

export const GET: APIRoute = async ({ locals, redirect }) => {
  if (!locals.cuenta) return redirect('/entrar', 303);
  let admin = false;
  try {
    admin = Boolean(await adminEmailOf(locals.cuenta.userId));
  } catch {
    // Si Clerk no responde, a Mi cuenta: desde ahí no se expone nada del panel.
  }
  return redirect(admin ? '/admin' : '/cuenta', 303);
};
