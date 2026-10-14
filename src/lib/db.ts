// Conexiones a la base del bot (Neon). Solo en el servidor: nunca se importa desde el navegador.
// Cada uso entra con su propio usuario de Postgres y lo mínimo que necesita (docs/admin.md):
//   panel       ADMIN_DATABASE_URL     solo lectura, y del registro de mensajes ve la fecha, no el texto
//   formulario  WAITLIST_DATABASE_URL  solo la tabla waitlist
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { ADMIN_DATABASE_URL, WAITLIST_DATABASE_URL } from 'astro:env/server';

type Sql = NeonQueryFunction<false, false>;

const cache = new Map<string, Sql>();
function client(url: string | undefined): Sql | null {
  if (!url) return null;
  if (!cache.has(url)) cache.set(url, neon(url));
  return cache.get(url)!;
}

/** null = falta configurar la variable. */
export const adminDb = () => client(ADMIN_DATABASE_URL);
export const waitlistDb = () => client(WAITLIST_DATABASE_URL);
