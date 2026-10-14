# Panel de administración (telmoney.app/admin)

Un panel privado para ver cómo va TelMoney. Lee la misma base del bot (Neon) y no cambia nada en ella.

| Sección | Qué muestra |
|---|---|
| **Resumen** | Usuarios (nuevos, por canal y por estado), mensajes de usuarios y del bot, costo estimado, ventas y margen, clientes pagando, gasto que anotaron (total y por categoría) e interesados. Últimos 7 o 30 días. |
| **Usuarios** | La lista con estado (en prueba, pagando, vencido, invitado), plan, mensajes, gasto y pagos. Se busca por nombre o número. |
| **Una persona** | Sus mensajes por día, lo que cuesta atenderla, su gasto por categoría, sus cuentas con saldo, sus últimos 100 movimientos y sus pagos. |
| **Interesados** | La lista de espera de la beta: nombre, WhatsApp (con enlace para escribirle), correo, lo que más le cuesta, de qué red llegó y si ya usa el bot. Se descarga en CSV. |

## Cómo se protege

- **Entrar:** con Google, a través de Clerk. Solo pasa un correo **verificado** de `ADMIN_EMAILS` (`josueduardo.dev@gmail.com`). Cualquier otra cuenta ve «Esta cuenta no tiene acceso».
- **Dos llaves:** la revisión está en `src/middleware.ts` y otra vez en cada página: si una fallara, la otra no deja consultar nada.
- **La página pública no carga nada de Clerk.** El inicio de sesión es la página que Clerk hospeda.
- **Base de datos con lo mínimo:** el panel entra con un usuario de Postgres de **solo lectura**, que del registro de mensajes ve la fecha y el tipo, **nunca el texto**. El formulario de la beta entra con otro que **solo** puede escribir en la lista de espera.
- **Nada se guarda en caché ni entra a Google** (`Cache-Control: no-store`, `noindex` y `robots.txt`).

## Configurarlo (una sola vez)

### 1. Dos usuarios de Postgres en Neon

Se crean con SQL, **no** desde la pantalla «Roles» de Neon: los que se crean ahí reciben permisos sobre todos los datos.

1. En tu terminal, genera dos contraseñas (una para cada usuario):
   ```bash
   openssl rand -hex 24
   openssl rand -hex 24
   ```
2. Neon → el proyecto del bot → **SQL Editor** (rama `main`, base `neondb`). Pega esto con tus contraseñas y córrelo:
   ```sql
   -- Panel: solo lectura. Del registro de mensajes, la fecha y el tipo; nunca el texto.
   create role panel_admin with login password 'CONTRASEÑA_1';
   alter role panel_admin set default_transaction_read_only = on;
   grant usage on schema public to panel_admin;
   grant select on users, accounts, categories, transactions, payments, access_list, waitlist,
                   scheduled_jobs, account_balances to panel_admin;
   grant select (id, user_id, role, created_at) on message_log to panel_admin;

   -- Formulario de la beta: solo la lista de espera.
   create role landing_waitlist with login password 'CONTRASEÑA_2';
   grant usage on schema public to landing_waitlist;
   grant select, insert, update on waitlist to landing_waitlist;
   ```
3. Las dos conexiones quedan así (el mismo host del bot, con «-pooler»):
   ```
   postgresql://panel_admin:CONTRASEÑA_1@TU-HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   postgresql://landing_waitlist:CONTRASEÑA_2@TU-HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   ```

Si más adelante el bot agrega una tabla que el panel necesite, hay que darle `grant select` también. Si falta un permiso, el panel lo dice («permission denied») en vez de fallar en silencio.

### 2. Clerk (el inicio de sesión)

1. Crea la aplicación en [dashboard.clerk.com](https://dashboard.clerk.com) (o desde Vercel → Marketplace → Clerk).
2. En las opciones de inicio de sesión, deja solo **Google**.
3. Si tu plan de Clerk tiene **Allowlist** (en *Restrictions*), actívala con `josueduardo.dev@gmail.com`: así nadie más puede ni crear cuenta. Si no la tiene, no pasa nada: el panel igual rechaza cualquier correo que no esté en `ADMIN_EMAILS`.
4. En **API keys**, copia la *Publishable key* y la *Secret key*.

Con las llaves de desarrollo (`pk_test_…`) ya funciona en telmoney.app, pero la página de Clerk dice «Development mode». Para quitarlo, en Clerk crea la instancia de producción: te pide unos registros DNS en `telmoney.app` y tus propias credenciales de Google. Entonces cambias las dos llaves por las de producción.

### 3. Variables en Vercel

Vercel → el proyecto → **Settings → Environment Variables**, para *Production* y *Preview*:

| Variable | Valor |
|---|---|
| `ADMIN_DATABASE_URL` | La conexión de `panel_admin` (secreta). |
| `WAITLIST_DATABASE_URL` | La conexión de `landing_waitlist` (secreta). |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | La *Publishable key*. También vale con el nombre `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (el que pone Clerk o el Marketplace). |
| `CLERK_SECRET_KEY` | La *Secret key* (secreta). |
| `ADMIN_EMAILS` | Opcional. Correos con acceso, separados por coma. Por defecto `josueduardo.dev@gmail.com`. |
| `FREE_NUMBERS` | Opcional. El mismo valor que en el `.env` del bot (el equipo), para que aparezcan como «Invitado» y no como «Vencido». |
| `PUBLIC_WAITLIST_URL` | **Bórrala.** Vacía, el formulario guarda directo en la base con `/api/waitlist`. |

Después: **Deployments → Redeploy**. Las variables se leen al publicar.

**Importante:** publica la rama del panel *después* de poner `WAITLIST_DATABASE_URL`. Sin ella, el formulario de la beta le dice a la gente «No pudimos guardar tus datos» (que es cierto) en vez de fingir que guardó.

### 4. Probar

1. Abre `telmoney.app/admin` → entra con Google → ves el Resumen.
2. Anótate en el formulario de la beta con tu número → aparece en **Interesados**.
3. Prueba con otra cuenta de Google (o una ventana privada): no debe entrar.

## Costos (cómo se estiman)

Por mensaje, con los precios de `telmoney-bot/docs/precios-y-pagos.md`:

| | WhatsApp | Telegram |
|---|---|---|
| Mensaje del usuario | Twilio $0.005 + Gemini $0.001 | Gemini $0.001 |
| Mensaje del bot (respuestas, reportes y alertas) | Twilio $0.005 + Meta $0.0113 | gratis |

No descuenta los 1,000 mensajes gratis al mes de Meta, así que se pasa un poco hacia arriba. Al migrar a la API de Meta directa, pon `COST_TWILIO_PER_MESSAGE=0` en Vercel. Los otros precios se cambian con `COST_META_PER_REPLY` y `COST_GEMINI_PER_MESSAGE`.

## Límites que conviene saber

- **Mensajes:** el bot borra su registro de mensajes a los 30 días, por eso el panel llega hasta 30 días atrás. Para ver más tiempo, el bot tendría que guardar un conteo diario que incluya al equipo y a los invitados (`usage_daily` hoy no los cuenta).
- **El costo es un estimado**, no la factura. La real está en Twilio, Meta y Google Cloud.
- **Privacidad:** el panel muestra los gastos de cada persona. Por eso la página ya no dice «Solo tú los ves» y la pregunta frecuente dice que el equipo los ve para dar soporte. **La política de privacidad** (hoy un borrador en `src/pages/privacidad.astro`) tiene que decirlo también antes de abrir la beta.
- El bot recomienda que nada se conecte directo a su base (`telmoney-bot/docs/base-de-datos.md`). El panel es la excepción a propósito: entra con un usuario que solo lee y no ve el texto de los mensajes.

## En tu computadora

Pon las mismas variables en `.env` (está en `.gitignore`). Sin ellas, `/admin` muestra qué falta y el formulario de la beta funciona en modo demo: responde que sí y no guarda nada. Eso pasa solo en desarrollo; publicado, nunca finge.
