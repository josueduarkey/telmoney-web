// robots.txt: todo se puede rastrear (menos el panel y la API) y se indica dónde está el sitemap.
// Las páginas provisionales no se bloquean aquí: llevan <meta name="robots" content="noindex">
// (si se bloquearan, Google no podría leer ese noindex). El panel pide sesión de todos modos.
import { SITE } from '../config';

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE.url}/sitemap-index.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
