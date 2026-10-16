// Clerk para el panel: llaves, cliente de su API y la lista de correos con acceso (ADMIN_EMAILS).
import { createClerkClient } from '@clerk/astro/server';
import {
  ADMIN_EMAILS,
  CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  PUBLIC_CLERK_PUBLISHABLE_KEY,
} from 'astro:env/server';

const publishableKey = PUBLIC_CLERK_PUBLISHABLE_KEY || NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** null = falta configurar Clerk (el panel muestra cómo hacerlo). */
export const clerkKeys =
  CLERK_SECRET_KEY && publishableKey ? { secretKey: CLERK_SECRET_KEY, publishableKey } : null;

// Partes internas de Clerk (como la redirección al inicio de sesión) leen las llaves de process.env
// con estos nombres. En desarrollo Astro no las pone ahí, y la pública puede venir como NEXT_PUBLIC_…
if (clerkKeys && typeof process !== 'undefined') {
  process.env.PUBLIC_CLERK_PUBLISHABLE_KEY ||= clerkKeys.publishableKey;
  process.env.CLERK_SECRET_KEY ||= clerkKeys.secretKey;
}

export const clerkApi = clerkKeys ? createClerkClient(clerkKeys) : null;

export const adminEmails = new Set(
  ADMIN_EMAILS.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

/** El correo verificado con acceso al panel (ADMIN_EMAILS), o null si la persona no es del equipo. */
export async function adminEmailOf(userId: string): Promise<string | null> {
  if (!clerkApi) return null;
  const user = await clerkApi.users.getUser(userId);
  const email = user.emailAddresses.find(
    (e) => e.verification?.status === 'verified' && adminEmails.has(e.emailAddress.toLowerCase()),
  );
  return email?.emailAddress ?? null;
}
