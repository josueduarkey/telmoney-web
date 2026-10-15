// El token de sesión de Clerk de la persona, para pedirle sus datos al bot (lib/admin/bot.ts → me()).
// Lo renueva Clerk en cada solicitud; dura un minuto y nunca se manda al navegador desde aquí.
export async function tokenOf(locals: App.Locals): Promise<string | null> {
  if (!locals.cuenta) return null;
  try {
    return (await locals.auth?.().getToken()) ?? null;
  } catch {
    return null;
  }
}

/** "pro_mensual" → "Pro mensual". */
export const planLabel = (plan: string | null, nivel: string | null) =>
  plan
    ? plan.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
    : nivel
      ? nivel[0].toUpperCase() + nivel.slice(1)
      : 'Sin plan';
