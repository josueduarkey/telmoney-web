// Manifiesto web: nombre e íconos cuando alguien guarda TelMoney en la pantalla de inicio (Android, Chrome).
import { SITE } from '../config';
import { SEO } from '../seo/meta';

export function GET() {
  const manifest = {
    name: `${SITE.name}: ${SITE.tagline.replace(/\.$/, '')}`,
    short_name: SITE.name,
    description: SEO.description,
    lang: SEO.lang,
    start_url: '/?utm_source=pantalla_inicio',
    display: 'browser',
    background_color: '#000000',
    theme_color: '#000000',
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
}
