// El token de sesión de Clerk de la persona, para pedirle sus datos al bot (lib/admin/bot.ts → me()).
// Lo renueva Clerk en cada solicitud; dura un minuto y nunca se manda al navegador desde aquí.
import { planDisplay } from '../../config';

export async function tokenOf(locals: App.Locals): Promise<string | null> {
  if (!locals.cuenta) return null;
  try {
    return (await locals.auth?.().getToken()) ?? null;
  } catch {
    return null;
  }
}

/** "pro_mensual" → "Pro mensual" (los nombres viven en src/config.ts). */
export const planLabel = (plan: string | null, nivel: string | null) =>
  plan ? planDisplay(plan) : nivel ? planDisplay(nivel) : 'Sin plan';
