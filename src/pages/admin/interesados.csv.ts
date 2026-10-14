// GET /admin/interesados.csv: la lista de espera para abrir en Excel (UTF-8 con BOM).
// Los textos que escribió la gente van protegidos: si empiezan con = + - @, Excel los tomaría
// como fórmula, así que se les antepone un apóstrofo.
import type { APIRoute } from 'astro';
import { waitlist } from '../../lib/admin/queries';

export const prerender = false;

const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const cell = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;

export const GET: APIRoute = async ({ locals }) => {
  // Segunda llave (la primera es src/middleware.ts): sin sesión de admin no se consulta nada.
  if (!locals.admin) return new Response('No autorizado', { status: 401 });
  const rows = await waitlist();
  const header = ['nombre', 'whatsapp', 'correo', 'le_cuesta', 'utm_source', 'utm_medium', 'utm_campaign', 'se_anoto', 'avisado', 'ya_usa_el_bot'];
  const lines = rows.map((r) =>
    [
      cell(safe(r.name)),
      cell(r.whatsapp), // ya validado: +<dígitos>
      cell(r.email ? safe(r.email) : ''),
      cell(r.pains.join('; ')),
      cell(safe(r.utm.utm_source ?? '')),
      cell(safe(r.utm.utm_medium ?? '')),
      cell(safe(r.utm.utm_campaign ?? '')),
      cell(new Date(r.createdAt).toISOString()),
      cell(r.notifiedAt ? new Date(r.notifiedAt).toISOString() : ''),
      cell(r.isUser ? 'sí' : 'no'),
    ].join(','),
  );
  const today = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + [header.join(','), ...lines].join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="telmoney-interesados-${today}.csv"`,
    },
  });
};
