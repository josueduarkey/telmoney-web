// POST /api/waitlist: guarda el formulario de la beta directo en la base (tabla waitlist del bot).
// GET /api/waitlist: solo despierta la base mientras la persona llena el formulario (ver abajo).
// Mismas reglas que el endpoint del bot (telmoney-bot/src/telmoney_bot/waitlist.py):
//   201 registrado · 200 ya estaba (se actualiza) · 413 muy grande · 415 no es JSON
//   422 datos inválidos ({ fields }) · 429 demasiados intentos · 503 falta configurar la base
// Contra spam, sin captcha: tope de tamaño, límite por IP y el campo trampa «company».
// En los registros del servidor no va ningún dato personal.
import type { APIRoute } from 'astro';
import { waitlistDb } from '../../lib/db';
import { PAINS, PAIN_ALIASES } from '../../data/pains';

export const prerender = false;

const MAX_BODY_BYTES = 4096;
const PER_IP_PER_MINUTE = 5;
const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Límite por IP en memoria: vale por instancia (Vercel puede tener varias), alcanza para la beta.
const hits = new Map<string, number[]>();
function allow(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= PER_IP_PER_MINUTE) return false;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return true;
}

// Neon se duerme tras unos minutos sin uso, y despertarla tarda unos segundos. El formulario llama
// aquí cuando la persona empieza a escribir: para cuando envía, la base ya está despierta.
// No lee ni devuelve datos.
export const GET: APIRoute = async ({ request, clientAddress }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || '?';
  const sql = waitlistDb();
  if (sql && allow(`despertar:${ip}`)) {
    try {
      await sql`select 1`;
    } catch {
      // si falla, el envío lo vuelve a intentar y ahí sí se avisa
    }
  }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
};

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Clean = { name: string; whatsapp: string; email: string | null; pains: string[]; utm: Record<string, string> };

function validate(data: Record<string, unknown>): { ok: true; value: Clean } | { ok: false; fields: string[] } {
  const fields: string[] = [];

  const name = typeof data.name === 'string' ? data.name.replace(/\s+/g, ' ').trim() : '';
  if (!name || name.length > 80) fields.push('name');

  const whatsapp = typeof data.whatsapp === 'string' ? data.whatsapp.replace(/[\s().-]/g, '') : '';
  if (!E164.test(whatsapp) || (whatsapp.startsWith('+503') && whatsapp.length !== 12)) fields.push('whatsapp');

  const rawEmail = data.email == null ? '' : typeof data.email === 'string' ? data.email.trim().toLowerCase() : null;
  if (rawEmail === null || (rawEmail && (rawEmail.length > 254 || !EMAIL.test(rawEmail)))) fields.push('email');

  const rawPains = Array.isArray(data.pains) ? data.pains.map((p) => PAIN_ALIASES[String(p)] ?? String(p)) : null;
  const pains = rawPains ? [...new Set(rawPains)] : [];
  if (!rawPains || pains.length > PAINS.length || pains.some((p) => !(PAINS as readonly string[]).includes(p))) {
    fields.push('pains');
  }

  // Solo claves utm_*, máximo 10, valores cortos: es atribución, no un depósito.
  const utm: Record<string, string> = {};
  if (data.utm && typeof data.utm === 'object') {
    for (const [k, v] of Object.entries(data.utm).slice(0, 10)) {
      if (k.startsWith('utm_')) utm[k.slice(0, 40)] = String(v).slice(0, 200);
    }
  }

  if (fields.length) return { ok: false, fields };
  return { ok: true, value: { name, whatsapp, email: rawEmail || null, pains, utm } };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || '?';
  if (!allow(ip)) return json(429, { ok: false, detail: 'Demasiados intentos. Prueba en un minuto.' });

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return json(413, { ok: false, detail: 'Solicitud demasiado grande.' });
  }
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json(415, { ok: false, detail: 'Envía JSON.' });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, detail: 'Solicitud demasiado grande.' });

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return json(422, { ok: false, detail: 'Datos inválidos.', fields: [] });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json(422, { ok: false, detail: 'Datos inválidos.', fields: [] });
  }
  const body = data as Record<string, unknown>;
  if (body.company) return json(201, { ok: true }); // trampa para bots: se descarta sin decir nada

  const result = validate(body);
  if (!result.ok) return json(422, { ok: false, detail: 'Datos inválidos.', fields: result.fields });

  const sql = waitlistDb();
  if (!sql) {
    if (import.meta.env.DEV) {
      console.info('[waitlist] Sin WAITLIST_DATABASE_URL: modo demo, no se guardó nada.');
      return json(201, { ok: true });
    }
    console.error('[waitlist] Falta WAITLIST_DATABASE_URL: no se puede guardar.');
    return json(503, { ok: false, detail: 'No pudimos guardar tu registro. Intenta más tarde.' });
  }

  // Si ya estaba: se actualizan nombre, correo (si trae uno) y lo que le cuesta;
  // se conservan la fuente y los utm de la primera vez (igual que waitlist_repo.join del bot).
  const { name, whatsapp, email, pains, utm } = result.value;
  try {
    const rows = await sql`
      insert into waitlist (name, whatsapp, email, pains, source, utm)
      values (${name}, ${whatsapp}, ${email}, ${pains}, 'landing', ${JSON.stringify(utm)}::jsonb)
      on conflict (whatsapp) do update
         set name = excluded.name,
             email = coalesce(excluded.email, waitlist.email),
             pains = case when cardinality(excluded.pains) > 0 then excluded.pains else waitlist.pains end,
             updated_at = now()
      returning (xmax = 0) as created`;
    const created = Boolean(rows[0]?.created);
    return json(created ? 201 : 200, { ok: true });
  } catch (err) {
    console.error('[waitlist] No se pudo guardar:', err instanceof Error ? err.message : err);
    return json(500, { ok: false, detail: 'No pudimos guardar tu registro. Intenta de nuevo.' });
  }
};
