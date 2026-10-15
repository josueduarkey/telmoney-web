// @ts-check
import { defineConfig, envField } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const site = (env.PUBLIC_SITE_URL || 'https://telmoney.app').replace(/\/$/, '');

// Páginas que todavía no deben entrar al sitemap: las mismas que llevan `draft` en <Legal>.
// Cuando tengan su texto definitivo, se quitan de aquí y del `draft`.
const DRAFTS = ['/privacidad/', '/terminos/'];

// https://astro.build/config
// La página sigue siendo estática. Solo el panel (/admin) y /api/waitlist corren en el servidor
// (llevan `export const prerender = false`); para eso está el adaptador de Vercel.
export default defineConfig({
  site,
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) =>
        !DRAFTS.some((p) => page.endsWith(p)) && !['/admin', '/cuenta', '/chat', '/pago'].some((p) => page.includes(p)),
    }),
  ],
  // Variables del servidor (panel y formulario). Los secretos se leen al correr, no quedan en el
  // código construido. Qué es cada una y cómo conseguirla: docs/admin.md.
  env: {
    schema: {
      ADMIN_DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      WAITLIST_DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CLERK_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_CLERK_PUBLISHABLE_KEY: envField.string({ context: 'server', access: 'public', optional: true }),
      // El nombre que usan Clerk (para Next.js) y el Marketplace de Vercel: también vale.
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: envField.string({ context: 'server', access: 'public', optional: true }),
      // API de administración del bot (sección IA del panel; telmoney-bot/docs/ia.md). Solo Production.
      BOT_API_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      BOT_ADMIN_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      ADMIN_EMAILS: envField.string({ context: 'server', access: 'public', default: 'josueduardo.dev@gmail.com' }),
      FREE_NUMBERS: envField.string({ context: 'server', access: 'public', default: '' }),
      // Costo por mensaje (USD), de telmoney-bot/docs/precios-y-pagos.md. Al pasar a la API de
      // Meta directa, COST_TWILIO_PER_MESSAGE=0.
      COST_TWILIO_PER_MESSAGE: envField.number({ context: 'server', access: 'public', default: 0.005 }),
      COST_META_PER_REPLY: envField.number({ context: 'server', access: 'public', default: 0.0113 }),
      COST_GEMINI_PER_MESSAGE: envField.number({ context: 'server', access: 'public', default: 0.001 }),
    },
  },
});
