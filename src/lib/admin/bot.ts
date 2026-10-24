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

// ─────────────────────────────────────── cuentas de usuario (/me, docs/cuenta.md)
// Aquí no va el token del panel: va el token de sesión de Clerk de la persona, y el bot responde
// solo lo suyo. Es la misma API que usará la app móvil.

export async function me<T>(
  path: string,
  token: string,
  { method = 'GET', body }: { method?: string; body?: unknown } = {},
): Promise<BotOk<T> | BotError> {
  if (!BOT_API_URL) return { ok: false, status: 0, detail: 'Las cuentas todavía no están conectadas con el bot.' };
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  try {
    const res = await fetch(`${BOT_API_URL.replace(/\/$/, '')}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return { ok: true, status: res.status, data: data as T };
    const porCodigo: Record<number, string> = {
      401: 'Tu sesión venció. Vuelve a entrar.',
      429: 'Demasiadas solicitudes. Espera un momento.',
    };
    return { ok: false, status: res.status, detail: data?.detail || porCodigo[res.status] || 'Algo falló. Intenta de nuevo.', campo: data?.campo };
  } catch {
    return { ok: false, status: 0, detail: 'No pudimos conectar con TelMoney. Intenta de nuevo en un momento.' };
  }
}

export type Plan = {
  /** "gratis" = plan Free (al terminar la prueba o vencer un plan pagado). "vencido" solo si el bot apaga Free. */
  estado: 'prueba' | 'pagando' | 'gratis' | 'vencido' | 'equipo';
  nivel: 'gratis' | 'starter' | 'pro' | null;
  plan: string | null;
  prueba_hasta: string | null;
  pagado_hasta: string | null;
  renovacion_automatica: boolean;
};
export type Precio = { plan: string; nombre: string; monto: number; periodo: 'mes' | 'año' };
export type Me =
  | { vinculado: false }
  | {
      vinculado: true;
      usuario: { nombre: string | null; whatsapp: string | null; zona: string; desde: string };
      plan: Plan;
      hoy: { disponible: number | null; gastado: number };
      mes: { gastado: number; ingresos: number };
      precios: Precio[];
    };
export type Resumen = {
  gastado: number;
  ingresos: number;
  por_dia: { dia: string; total: number }[];
  por_categoria: { nombre: string; emoji: string | null; total: number; n: number }[];
  cuentas: { nombre: string; tipo: string; saldo: number }[];
  metas: { nombre: string; meta: number; actual: number; fecha: string | null }[];
};
export type Movimiento = {
  id: number;
  fecha: string;
  tipo: 'expense' | 'income' | 'transfer';
  monto: number;
  categoria: string | null;
  emoji: string | null;
  cuenta: string | null;
  a_cuenta: string | null;
  descripcion: string | null;
  id_categoria?: number | null;
  id_cuenta?: number | null;
  id_a_cuenta?: number | null;
};
export type Pago = { fecha: string; plan: string; monto: number; estado: 'approved' | 'pending' | 'failed' };

// ─────────────────────────────────────── correo del banco (/me/correo, docs/correo.md)

export type Recibido = {
  fecha: string;
  de: string;
  asunto: string;
  /** pendiente: le preguntó por WhatsApp · anotado · descartado (dijo que no) · ignorado (no era un movimiento) */
  estado: 'pendiente' | 'anotado' | 'descartado' | 'ignorado';
  monto: number | null;
  comercio: string | null;
};
export type Correo = {
  /** null mientras no la crea (o después de desconectarla). */
  direccion: string | null;
  creada: string | null;
  /** El código que manda Gmail para confirmar el reenvío (llega a la dirección y el bot lo guarda). */
  confirmacion: { codigo: string | null; enlace: string | null; llego: string } | null;
  ultimo_correo: string | null;
  recibidos: Recibido[];
};

// ─────────────────────────────── módulos del panel de cuenta (telmoney-bot/docs/cuenta-web.md)
// Mientras el bot no tenga una ruta, responde 404 «Not Found» y la página lo muestra como «pronto».

/** cash · bank · card (tarjeta de crédito: saldo negativo = lo que debe) · savings · wallet */
export type CuentaTipo = 'cash' | 'bank' | 'card' | 'savings' | 'wallet' | string;
export type CuentaItem = {
  id?: number;
  nombre: string;
  tipo: CuentaTipo;
  saldo: number;
  reservada?: boolean;
  activa?: boolean;
  limite?: number | null;
  dia_corte?: number | null;
  dia_pago?: number | null;
  deuda?: number | null;
};
export type Deuda = {
  id: number;
  persona: string;
  monto: number;
  abonado: number;
  pendiente: number;
  vence: string | null;
  creada: string;
  contacto?: boolean;
  descripcion?: string | null;
};
export type Deudas = { me_deben: Deuda[]; debo: Deuda[] };
export type Meta = {
  id?: number;
  nombre: string;
  meta: number;
  actual: number;
  fecha: string | null;
  ritmo_semanal?: number | null;
  cumplida?: boolean;
};
export type Limite = {
  id: number;
  periodo: 'semana' | 'mes';
  categoria: string | null;
  id_categoria?: number | null;
  emoji?: string | null;
  limite: number;
  gastado: number;
  desde?: string;
  hasta?: string;
};
export type Fijo = {
  id: number;
  nombre: string;
  monto: number | null;
  dia: number;
  proximo: string | null;
  cuenta: string | null;
  /** fijo · cuota · tarjeta (en las de tarjeta, `evento` dice si es el corte o el pago) */
  tipo: string;
  evento?: 'corte' | 'pago' | null;
  cuotas_restantes?: number | null;
  id_cuenta?: number | null;
  id_categoria?: number | null;
};
export type Puntaje = {
  puntaje: number | null;
  dia: string | null;
  componentes: { clave: string; nombre: string; puntos: number; peso: number; detalle: string | null }[];
  motivo_sin_datos: string | null;
};
export type Categoria = { id: number; nombre: string; emoji: string | null; tipo: string };
export type Perfil = {
  nombre: string | null;
  ingreso_mensual: number | null;
  /** quincena · fin_de_mes · semanal · otro */
  horario_pago: string | null;
  /** semanal: 1 = lunes … 7 = domingo; si no, días del mes (31 = el último). */
  dias_pago: number[];
  pct_ahorro: number | null;
  cuenta_cobro?: string | null;
};

/** El bot todavía no tiene esa ruta (FastAPI responde 404 «Not Found»). */
export const pendiente = (r: BotOk<unknown> | BotError): r is BotError =>
  !r.ok && r.status === 404 && /^not found$/i.test(r.detail.trim());
/** 404 con su propio mensaje: la cuenta no tiene WhatsApp conectado. */
export const sinVincular = (r: BotOk<unknown> | BotError): r is BotError => !r.ok && r.status === 404 && !pendiente(r);
