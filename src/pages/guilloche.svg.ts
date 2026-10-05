import { guillocheSvg } from '../lib/guilloche';

export function GET() {
  return new Response(guillocheSvg(), { headers: { 'Content-Type': 'image/svg+xml' } });
}
