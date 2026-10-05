// robots.txt: todo se puede rastrear y se indica dónde está el sitemap.
// Las páginas provisionales no se bloquean aquí: llevan <meta name="robots" content="noindex">
// (si se bloquearan, Google no podría leer ese noindex).
import { SITE } from '../config';

export function GET() {
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE.url}/sitemap-index.xml`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
