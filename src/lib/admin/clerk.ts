// Clerk para el panel: llaves, cliente de su API y la lista de correos con acceso (ADMIN_EMAILS).
import { createClerkClient } from '@clerk/astro/server';
import { ADMIN_EMAILS, CLERK_SECRET_KEY, PUBLIC_CLERK_PUBLISHABLE_KEY } from 'astro:env/server';

/** null = falta configurar Clerk (el panel muestra cómo hacerlo). */
export const clerkKeys =
  CLERK_SECRET_KEY && PUBLIC_CLERK_PUBLISHABLE_KEY
    ? { secretKey: CLERK_SECRET_KEY, publishableKey: PUBLIC_CLERK_PUBLISHABLE_KEY }
    : null;

export const clerkApi = clerkKeys ? createClerkClient(clerkKeys) : null;

export const adminEmails = new Set(
  ADMIN_EMAILS.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);
