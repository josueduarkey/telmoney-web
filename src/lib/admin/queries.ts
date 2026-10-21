// Consultas del panel. Todas de solo lectura, con el usuario de Postgres del panel (lib/db.ts).
//
// De dónde sale cada número:
// - Mensajes: message_log del bot (todo lo que escriben y lo que responde, de todos los usuarios).
//   El bot lo borra a los 30 días, por eso los rangos llegan hasta 30. Del texto no se lee nada.
// - Estado de cada usuario: las mismas reglas que telmoney-bot/src/telmoney_bot/billing/access.py.
// - Costo: estimado por mensaje con los precios de astro.config.mjs (COST_*).
import { adminDb } from '../db';
import { COST_GEMINI_PER_MESSAGE, COST_META_PER_REPLY, COST_TWILIO_PER_MESSAGE, FREE_NUMBERS } from 'astro:env/server';

export const TZ = 'America/El_Salvador';
export const RANGES = [7, 30] as const;
export type Range = (typeof RANGES)[number];

/** gratis = plan Free: terminó la prueba (o venció un plan pagado) y sigue con límite diario. */
export type Status = 'invitado' | 'pagando' | 'prueba' | 'gratis';

const freeNumbers = FREE_NUMBERS.split(',')
  .map((n) => n.trim())
  .filter(Boolean);

// Invitados y equipo no tienen prueba ni límite (billing/access.py: _exempt). En el bot el equipo es
// FREE_NUMBERS + ADMIN_NUMBERS: aquí FREE_NUMBERS tiene que traer los dos.
const STATUS_SQL = `
  case
    when u.whatsapp_number = any($1::text[])
      or exists (select 1 from access_list a
                  where a.phone = u.whatsapp_number and a.exempt and a.revoked_at is null) then 'invitado'
    when u.paid_until > now() then 'pagando'
    when u.trial_ends_at > now() then 'prueba'
    else 'gratis'
  end`;

function db() {
  const sql = adminDb();
  if (!sql) throw new Error('ADMIN_DATABASE_URL no está configurada');
  return sql;
}

/** Costo estimado: Gemini por cada mensaje que entra y Meta por cada mensaje del bot. Twilio ya no se usa
 *  (COST_TWILIO_PER_MESSAGE = 0); tgIn son usuarios viejos de Telegram, que solo cuestan Gemini. */
export function estimateCost(m: { waIn: number; waOut: number; tgIn: number }) {
  return (
    m.waIn * (COST_TWILIO_PER_MESSAGE + COST_GEMINI_PER_MESSAGE) +
    m.waOut * (COST_TWILIO_PER_MESSAGE + COST_META_PER_REPLY) +
    m.tgIn * COST_GEMINI_PER_MESSAGE
  );
}

// ─────────────────────────────────────────────────────────── resumen

export async function summary(days: Range) {
  const sql = db();
  const [row] = await sql.query(
    `with r as (select now() - make_interval(days => $1::int) as since),
     msgs as (
       select count(m.id) filter (where m.role = 'user' and u.whatsapp_number is not null)::int as wa_in,
              count(m.id) filter (where m.role = 'bot'  and u.whatsapp_number is not null)::int as wa_out,
              count(m.id) filter (where m.role = 'user' and u.whatsapp_number is null)::int     as tg_in,
              count(m.id) filter (where m.role = 'bot'  and u.whatsapp_number is null)::int     as tg_out,
              count(distinct m.user_id) filter (where m.role = 'user')::int                       as active
         from message_log m join users u on u.id = m.user_id, r
        where m.created_at >= r.since),
     -- Reportes diarios y alertas que el bot manda solo (también cuestan en WhatsApp).
     jobs as (
       select count(j.id) filter (where u.whatsapp_number is not null)::int as wa_sent
         from scheduled_jobs j join users u on u.id = j.user_id, r
        where j.status = 'sent' and j.finished_at >= r.since)
     select
       (select count(*)::int from users)                                               as users_total,
       (select count(*)::int from users, r where created_at >= r.since)               as users_new,
       (select count(*)::int from users where whatsapp_number is not null)            as users_whatsapp,
       (select count(*)::int from users where whatsapp_number is null)                as users_telegram,
       msgs.*, jobs.wa_sent,
       (select coalesce(sum(amount), 0)::float8 from payments, r
         where status = 'approved' and approved_at >= r.since)                         as revenue,
       (select count(*)::int from payments, r
         where status = 'approved' and approved_at >= r.since)                         as purchases,
       (select coalesce(sum(amount), 0)::float8 from payments where status = 'approved') as revenue_total,
       (select count(distinct user_id)::int from payments where status = 'approved')   as buyers_total,
       (select coalesce(sum(amount), 0)::float8 from transactions, r
         where kind = 'expense' and occurred_at >= r.since)                            as spent,
       (select count(*)::int from transactions, r where created_at >= r.since)        as movements,
       (select count(*)::int from waitlist)                                            as waitlist_total,
       (select count(*)::int from waitlist, r where created_at >= r.since)            as waitlist_new
     from msgs, jobs`,
    [days],
  );

  const statusRows = await sql.query(
    `select ${STATUS_SQL} as status, count(*)::int as n from users u group by 1`,
    [freeNumbers],
  );
  const byStatus: Record<Status, number> = { prueba: 0, pagando: 0, gratis: 0, invitado: 0 };
  for (const r of statusRows) byStatus[r.status as Status] = r.n;

  const waOut = row.wa_out + row.wa_sent;
  return {
    users: { total: row.users_total, new: row.users_new, whatsapp: row.users_whatsapp, telegram: row.users_telegram },
    byStatus,
    messages: { in: row.wa_in + row.tg_in, out: row.wa_out + row.tg_out + row.wa_sent, active: row.active },
    cost: estimateCost({ waIn: row.wa_in, waOut, tgIn: row.tg_in }),
    sales: {
      revenue: row.revenue,
      purchases: row.purchases,
      revenueTotal: row.revenue_total,
      buyersTotal: row.buyers_total,
    },
    spending: { total: row.spent, movements: row.movements },
    waitlist: { total: row.waitlist_total, new: row.waitlist_new },
  };
}

/** Mensajes que escribieron los usuarios, día por día (hora de El Salvador). */
export async function messagesPerDay(days: Range, userId?: number) {
  const rows = await db().query(
    `select to_char(d, 'YYYY-MM-DD') as day, count(m.id)::int as n
       from generate_series((now() at time zone $1)::date - ($2::int - 1), (now() at time zone $1)::date, interval '1 day') d
       left join message_log m
              on m.role = 'user'
             and (m.created_at at time zone $1)::date = d::date
             and ($3::bigint is null or m.user_id = $3::bigint)
      group by d order by d`,
    [TZ, days, userId ?? null],
  );
  return rows.map((r) => ({ day: r.day as string, n: r.n as number }));
}

/** Gasto anotado por categoría. Las categorías son de cada usuario: se juntan por nombre. */
export async function spendingByCategory(days: Range, userId?: number) {
  const rows = await db().query(
    `select coalesce(c.name, 'sin categoría') as name, max(c.emoji) as emoji,
            sum(t.amount)::float8 as total, count(t.id)::int as n
       from transactions t left join categories c on c.id = t.category_id
      where t.kind = 'expense' and t.occurred_at >= now() - make_interval(days => $1::int)
        and ($2::bigint is null or t.user_id = $2::bigint)
      group by 1 order by total desc`,
    [days, userId ?? null],
  );
  return rows.map((r) => ({ name: r.name as string, emoji: (r.emoji as string | null) ?? '', total: r.total as number, n: r.n as number }));
}

// ─────────────────────────────────────────────────────────── usuarios

export type UserRow = {
  id: number;
  name: string | null;
  whatsapp: string | null;
  telegramId: string | null;
  status: Status;
  plan: string | null;
  createdAt: string;
  lastSeen: string | null;
  msgs30: number;
  spent30: number;
  paidTotal: number;
};

export async function users({ q = '', status = '' }: { q?: string; status?: string } = {}): Promise<UserRow[]> {
  const rows = await db().query(
    `select * from (
       select u.id::int, u.name, u.whatsapp_number, u.telegram_id::text, u.plan, u.created_at,
              coalesce(u.last_inbound_at,
                       (select max(m.created_at) from message_log m where m.user_id = u.id and m.role = 'user')) as last_seen,
              ${STATUS_SQL} as status,
              (select count(m.id)::int from message_log m
                where m.user_id = u.id and m.role = 'user' and m.created_at >= now() - interval '30 days') as msgs30,
              (select coalesce(sum(t.amount), 0)::float8 from transactions t
                where t.user_id = u.id and t.kind = 'expense' and t.occurred_at >= now() - interval '30 days') as spent30,
              (select coalesce(sum(p.amount), 0)::float8 from payments p
                where p.user_id = u.id and p.status = 'approved') as paid_total
         from users u
        where $2 = '' or u.name ilike '%' || $2 || '%'
           or (regexp_replace($2, '\\D', '', 'g') <> ''
               and u.whatsapp_number like '%' || regexp_replace($2, '\\D', '', 'g') || '%')
     ) x
     where $3 = '' or x.status = $3
     order by x.last_seen desc nulls last, x.created_at desc
     limit 500`,
    [freeNumbers, q.trim(), status],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp_number,
    telegramId: r.telegram_id,
    status: r.status,
    plan: r.plan,
    createdAt: r.created_at,
    lastSeen: r.last_seen,
    msgs30: r.msgs30,
    spent30: r.spent30,
    paidTotal: r.paid_total,
  }));
}

export async function user(id: number) {
  const sql = db();
  const [u] = await sql.query(
    `select u.id::int, u.name, u.whatsapp_number, u.telegram_id::text, u.plan, u.created_at, u.timezone,
            u.trial_ends_at, u.paid_until, u.onboarded_at, u.monthly_income::float8, u.pay_schedule,
            u.last_inbound_at, ${STATUS_SQL} as status
       from users u where u.id = $2`,
    [freeNumbers, id],
  );
  if (!u) return null;

  type Totals = {
    spent30: number;
    income30: number;
    movements: number;
    msgs_in: number;
    msgs_out: number;
    jobs_sent: number;
    paid_total: number;
  };
  const [totals] = (await sql.query(
    `select
       (select coalesce(sum(amount), 0)::float8 from transactions
         where user_id = $1 and kind = 'expense' and occurred_at >= now() - interval '30 days') as spent30,
       (select coalesce(sum(amount), 0)::float8 from transactions
         where user_id = $1 and kind = 'income' and occurred_at >= now() - interval '30 days')  as income30,
       (select count(*)::int from transactions where user_id = $1)                               as movements,
       (select count(m.id) filter (where m.role = 'user')::int from message_log m
         where m.user_id = $1 and m.created_at >= now() - interval '30 days')                     as msgs_in,
       (select count(m.id) filter (where m.role = 'bot')::int from message_log m
         where m.user_id = $1 and m.created_at >= now() - interval '30 days')                     as msgs_out,
       (select count(j.id)::int from scheduled_jobs j
         where j.user_id = $1 and j.status = 'sent' and j.finished_at >= now() - interval '30 days') as jobs_sent,
       (select coalesce(sum(amount), 0)::float8 from payments where user_id = $1 and status = 'approved') as paid_total`,
    [id],
  )) as Totals[];

  const movements = await sql.query(
    `select t.id::int, t.occurred_at, t.kind, t.amount::float8, t.description, t.source, t.needs_review,
            c.name as category, c.emoji, a.name as account, ta.name as to_account
       from transactions t
       left join categories c on c.id = t.category_id
       left join accounts a on a.id = t.account_id
       left join accounts ta on ta.id = t.to_account_id
      where t.user_id = $1
      order by t.occurred_at desc, t.id desc
      limit 100`,
    [id],
  );

  const accounts = await sql.query(
    `select name, type, balance::float8 from account_balances
      where user_id = $1 and is_active order by balance desc`,
    [id],
  );

  const payments = await sql.query(
    `select plan, amount::float8, status, created_at, approved_at
       from payments where user_id = $1 order by created_at desc`,
    [id],
  );

  const wa = Boolean(u.whatsapp_number);
  const cost = estimateCost({
    waIn: wa ? totals.msgs_in : 0,
    waOut: wa ? totals.msgs_out + totals.jobs_sent : 0,
    tgIn: wa ? 0 : totals.msgs_in,
  });

  return { user: u, totals: { ...totals, cost }, movements, accounts, payments };
}

// ─────────────────────────────────────────────────────────── interesados

export type Interested = {
  id: number;
  name: string;
  whatsapp: string;
  email: string | null;
  pains: string[];
  utm: Record<string, string>;
  createdAt: string;
  notifiedAt: string | null;
  isUser: boolean;
};

export async function waitlist(): Promise<Interested[]> {
  const rows = await db().query(
    `select w.id::int, w.name, w.whatsapp, w.email, w.pains, w.utm, w.created_at, w.notified_at,
            (w.user_id is not null or exists (select 1 from users u where u.whatsapp_number = w.whatsapp)) as is_user
       from waitlist w order by w.created_at desc`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp,
    email: r.email,
    pains: r.pains ?? [],
    utm: r.utm ?? {},
    createdAt: r.created_at,
    notifiedAt: r.notified_at,
    isUser: r.is_user,
  }));
}

// ─────────────────────────────────────────── funciones (fase 1 del bot)
// Tablas de la migración 0018 del bot: feature_usage, ahorros y detecciones
// (telmoney-bot/docs/pro-se-paga-solo.md). Si todavía no existen o falta el permiso, se avisa.

export type FaseError = 'sin_tablas' | 'sin_permiso';

/** Distingue "todavía no está la migración" y "falta el grant" de cualquier otro error. */
export function faseError(e: unknown): FaseError | null {
  const code = (e as { code?: string })?.code;
  const msg = e instanceof Error ? e.message : String(e);
  if (code === '42P01' || /does not exist/i.test(msg)) return 'sin_tablas';
  if (code === '42501' || /permission denied/i.test(msg)) return 'sin_permiso';
  return null;
}

export async function features(days: Range) {
  const sql = db();
  const usage = await sql.query(
    `select feature,
            count(distinct user_id) filter (where uses > 0)::int as personas,
            coalesce(sum(uses), 0)::int as usos,
            count(distinct user_id) filter (where blocked > 0)::int as quisieron,
            coalesce(sum(blocked), 0)::int as bloqueos
       from feature_usage
      where day > (now() at time zone $2)::date - $1::int
      group by feature
      order by usos desc, bloqueos desc`,
    [days, TZ],
  );
  const ahorroMes = await sql.query(
    `select tipo, coalesce(sum(monto_estimado), 0)::float8 as total, count(*)::int as n,
            count(distinct user_id)::int as personas
       from ahorros
      where mes = date_trunc('month', now() at time zone $1)::date
      group by tipo order by total desc`,
    [TZ],
  );
  const [ahorroTotal] = await sql.query(
    `select coalesce(sum(monto_estimado), 0)::float8 as total, count(distinct user_id)::int as personas,
            count(distinct user_id) filter (where mes = date_trunc('month', now() at time zone $1)::date)::int as personas_mes
       from ahorros`,
    [TZ],
  );
  // ¿Ver su "te ahorré" lleva a pagar? Cuenta solo a quien vio un ahorro real: 'te_ahorre' también
  // se registra si preguntó y era $0, así que se cruza con un ahorro de un mes anterior a ese día.
  const [conversion] = await sql.query(
    `with vio as (
       select f.user_id from feature_usage f
        where f.feature = 'te_ahorre' and f.uses > 0
          and exists (select 1 from ahorros a
                       where a.user_id = f.user_id and a.monto_estimado > 0
                         and a.mes < date_trunc('month', f.day)::date)
        group by f.user_id)
     select (select count(*)::int from vio) as vieron,
            (select count(*)::int from vio join users u on u.id = vio.user_id where u.paid_until > now()) as vieron_pagando,
            (select count(*)::int from users where id not in (select user_id from vio)) as resto,
            (select count(*)::int from users where id not in (select user_id from vio) and paid_until > now()) as resto_pagando`,
  );
  const detecciones = await sql.query(
    `select tipo, estado, count(*)::int as n, coalesce(sum(monto), 0)::float8 as monto
       from detecciones group by tipo, estado order by tipo, estado`,
  );
  return {
    usage: usage as { feature: string; personas: number; usos: number; quisieron: number; bloqueos: number }[],
    ahorroMes: ahorroMes as { tipo: string; total: number; n: number; personas: number }[],
    ahorroTotal: ahorroTotal as { total: number; personas: number; personas_mes: number },
    conversion: conversion as { vieron: number; vieron_pagando: number; resto: number; resto_pagando: number },
    detecciones: detecciones as { tipo: string; estado: string; n: number; monto: number }[],
  };
}

/** Lo que TelMoney le ahorró a una persona (estimado). null si la fase 1 todavía no está en la base. */
export async function userSavings(id: number) {
  try {
    const [r] = await db().query(
      `select coalesce(sum(monto_estimado), 0)::float8 as total,
              coalesce(sum(monto_estimado) filter (where mes = date_trunc('month', now() at time zone $2)::date), 0)::float8 as mes
         from ahorros where user_id = $1`,
      [id, TZ],
    );
    return r as { total: number; mes: number };
  } catch (e) {
    if (faseError(e)) return null;
    throw e;
  }
}
