// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const site = (env.PUBLIC_SITE_URL || 'https://telmoney.app').replace(/\/$/, '');

// Páginas que todavía no deben entrar al sitemap: las mismas que llevan `draft` en <Legal>.
// Cuando tengan su texto definitivo, se quitan de aquí y del `draft`.
const DRAFTS = ['/privacidad/', '/terminos/'];

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    sitemap({
      filter: (page) => !DRAFTS.some((p) => page.endsWith(p)),
    }),
  ],
});
