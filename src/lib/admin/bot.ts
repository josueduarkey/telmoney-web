// Llamadas a la API de administración del bot (telmoney-bot/docs/ia.md). Solo desde el servidor:
// el token no llega nunca al navegador, y lo que se manda (como una llave nueva) no se registra.
import { BOT_ADMIN_TOKEN, BOT_API_URL } from 'astro:env/server';

export const botConfigured = Boolean(BOT_API_URL && BOT_ADMIN_TOKEN);

export type BotOk<T> = { ok: true; status: number; data: T };
export type BotError = { ok: false; status: number; detail: string; campo?: string };

const BY_STATUS: Record<number, string> = {
  401: 'El token del panel no coincide con el del bot (BOT_ADMIN_TOKEN = ADMIN_API_TOKEN del bot).',
  404: 'El bot no tiene activado el panel de IA (falta ADMIN_API_TOKEN en el bot) o esa conexión ya no existe.',
  429: 'Demasiados intentos. Espera unos minutos.',
  502: 'Google no respondió.',
};

export async function bot<T>(
  path: string,
  { method = 'GET', body, email }: { method?: string; body?: unknown; email?: string } = {},
): Promise<BotOk<T> | BotError> {
  if (!botConfigured) return { ok: false, status: 0, detail: 'Falta configurar BOT_API_URL y BOT_ADMIN_TOKEN.' };
  const headers: Record<string, string> = { Authorization: `Bearer ${BOT_ADMIN_TOKEN}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (email) headers['X-Admin-Email'] = email;
  try {
    const res = await fetch(`${BOT_API_URL!.replace(/\/$/, '')}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Las pruebas del bot cortan a los 10 s; aquí se le da un poco más.
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return { ok: true, status: res.status, data: data as T };
    return {
      ok: false,
      status: res.status,
      detail: data?.detail || BY_STATUS[res.status] || `El bot respondió con un error (${res.status}).`,
      campo: data?.campo,
    };
  } catch (err) {
    const timeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return {
      ok: false,
      status: 0,
      detail: timeout
        ? 'El bot tardó demasiado en responder.'
        : 'No se pudo conectar con el bot. ¿Está encendido y con su URL fija (BOT_API_URL)?',
    };
  }
}

// ─────────────────────────────────────────────── tipos de /admin/ia

export type Estado = 'sin_probar' | 'ok' | 'llave_invalida' | 'sin_cuota' | 'caida';

export type Conexion = {
  id: number;
  nombre: string;
  proveedor: string;
  modelo: string | null;
  modelo_fotos: string | null;
  modelo_respaldo: string | null;
  prioridad: number;
  activa: boolean;
  llave_fin: string;
  llave_origen: 'env' | 'guardada';
  estado: Estado;
  ultimo_error: string | null;
  ultimo_ok: string | null;
  ultimo_error_en: string | null;
};

export type Evento = {
  id: number;
  connection_id: number | null;
  nombre: string | null;
  tipo: 'caida' | 'recuperada' | 'todas_caidas' | 'agregada' | 'cambio' | 'orden' | 'borrada';
  detalle: string | null;
  origen: 'bot' | 'web' | 'whatsapp' | 'env';
  quien: string | null;
  created_at: string;
};

export type Ia = { conexiones: Conexion[]; en_uso: number | null; puede_guardar_llaves: boolean; eventos: Evento[] };
