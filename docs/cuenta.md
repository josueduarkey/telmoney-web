# Cuentas de usuario: telmoney.app/cuenta (y la app móvil)

*Octubre 2026.*

## Qué es

La gente entra con su cuenta (Clerk: Google o código por correo), conecta su WhatsApp una vez y ve en la web lo que lleva con el bot: cuánto puede gastar hoy, lo que ha gastado, sus cuentas y metas, su plan, cuándo vence y cómo pagar. La app móvil usará **el mismo login y la misma API**.

## Las piezas

```
navegador / app ──(sesión de Clerk)──► telmoney.app (servidor) ──Bearer <token de Clerk>──► bot /me/*
                                                                                            └─► base (solo lo de esa persona)
```

- **Login:** Clerk, la misma instancia del panel. Cualquiera puede crear cuenta; el panel `/admin` sigue solo para `ADMIN_EMAILS`.
- **Datos:** nunca directo de la base. La web (y la app) le piden al bot con el token de sesión de Clerk; el bot verifica el token y responde solo lo de esa persona (la regla de `telmoney-bot/docs/base-de-datos.md`: la app lee por una API que pasa por `repo.py`).
- **Vincular WhatsApp sin SMS:** la web pide un código al bot y muestra un botón que abre WhatsApp con `vincular 482913` ya escrito. Cuando llega ese mensaje desde un número, el bot une ese número con la cuenta de Clerk. Prueba que el número es suyo, sin costo.
- **Pagos (Wompi):** «Pasar a Pro» le pide al bot el enlace de pago (el mismo `checkout.start` que usa por WhatsApp) y redirige a Wompi. Wompi avisa al bot por su webhook y el bot activa el plan. Wompi devuelve a la persona a `telmoney.app/pago` (página pública: también vuelven ahí los pagos que empiezan en WhatsApp). Las credenciales de Wompi viven solo en el bot.

## API del bot para cuentas (`/me`)

Cabecera: `Authorization: Bearer <token de sesión de Clerk>`. El bot lo verifica con las llaves públicas (JWKS) de Clerk:
- `iss` = `https://clerk.telmoney.app` (producción) o la instancia de desarrollo (pruebas y local), configurable;
- `azp` en una lista permitida (`https://telmoney.app`, `http://localhost:4321`, y la app cuando exista);
- `sub` = el id de usuario de Clerk.

Errores: `{detail, campo?}` en español. 401 token inválido o vencido. Fechas ISO 8601 con zona. Montos en número (USD). Todas las respuestas con `Cache-Control: no-store`.

| Ruta | Respuesta |
|---|---|
| `GET /me` | `{vinculado: false}` o `{vinculado: true, usuario: {nombre, whatsapp, zona, desde}, plan: {estado: "prueba"\|"pagando"\|"vencido"\|"equipo", nivel: "starter"\|"pro"\|null, plan: "pro_mensual"…\|null, prueba_hasta, pagado_hasta, renovacion_automatica: false}, hoy: {disponible, gastado}, mes: {gastado, ingresos}, precios: [{plan, nombre, monto, periodo: "mes"\|"año"}]}` |
| `POST /me/vincular` | `{codigo: "482913", mensaje: "vincular 482913", expira: iso}` (10 min, un solo uso). 409 si ya está vinculada. |
| `DELETE /me/vincular` | `{ok: true}`: desvincula (no borra datos del bot). |
| `GET /me/resumen?dias=30` | `{gastado, ingresos, por_dia: [{dia: "2026-10-14", total}], por_categoria: [{nombre, emoji, total, n}], cuentas: [{nombre, tipo, saldo}], metas: [{nombre, meta, actual, fecha}]}` |
| `GET /me/movimientos?limite=50&antes=<id>` | `{movimientos: [{id, fecha, tipo: "expense"\|"income"\|"transfer", monto, categoria, emoji, cuenta, a_cuenta, descripcion}], hay_mas}` |
| `POST /me/pagar` `{plan}` | `{checkout_url}` del enlace de Wompi. 422 si el plan no existe. |
| `GET /me/pagos` | `{pagos: [{fecha, plan, monto, estado: "approved"\|"pending"\|"failed"}]}` |
| `GET/POST/DELETE /me/correo` | La dirección para reenviar los correos del banco: ver `docs/correo.md`. |

Mientras la cuenta no esté vinculada, todo lo que no sea `GET /me` y `POST /me/vincular` responde 404 `{detail: "Conecta tu WhatsApp primero."}`.

### En el bot

- Tabla de vínculo: `clerk_user_id` (único) ↔ `users.id`, con `created_at`; y la de códigos (`codigo`, `clerk_user_id`, `expira`, `usado`).
- El mensaje `vincular <código>` desde WhatsApp: si el número todavía no es usuario, se crea (como cuando escribe por primera vez, con su prueba de 7 días); responde «Listo, tu cuenta de telmoney.app quedó conectada».
- Un número solo puede estar en una cuenta de Clerk; volver a vincular desde otra cuenta reemplaza el vínculo y avisa por WhatsApp.
- Antes de unir, el bot **pide confirmación en WhatsApp** («¿Conecto tu WhatsApp con la cuenta j***@gmail.com?», botones «Sí, conectar» / «No fui yo»), para que nadie engañe a otra persona con «manda este mensaje». Para mostrar el correo: Clerk → Sessions → Customize session token → `{"email": "{{user.primary_email_address}}"}`.
- `hoy.disponible` es `null` mientras la persona no le diga sus saldos al bot.
- Variables nuevas: `CLERK_ISSUERS` (producción y dev, separados por coma), `CLERK_AUTHORIZED_PARTIES`, `CLERK_ALLOW_NO_AZP` (para la app móvil). Para pagos: `WOMPI_REDIRECT_URL=https://telmoney.app/pago`.
- Límites: 60 solicitudes por minuto por usuario; 5 códigos cada 10 minutos.
- Límite de solicitudes por usuario, como en `/admin/ia`.

## En la web

Un panel con barra lateral (en el celular se abre desde la izquierda), al estilo del sidebar de shadcn/ui. Cada módulo lee su ruta de `/me` (contrato en `telmoney-bot/docs/cuenta-web.md`); si el bot todavía no la tiene (404 «Not Found»), el módulo dice que viene pronto y muestra cómo hacerlo por WhatsApp.

- `/cuenta` (Inicio): conectar WhatsApp (si falta) o el resumen: plan y vencimiento, cuánto puedes gastar hoy, gasto del mes, gasto por día y por categoría, cuentas, metas, últimos movimientos.
- `/cuenta/movimientos`: la lista completa, con búsqueda, mes y tipo.
- `/cuenta/cuentas`: cuentas y tarjetas (`/me/cuentas`): para usar, reservado 🔒 y lo que debe en tarjetas, con el uso del límite.
- `/cuenta/deudas` (`/me/deudas`; «Cambiar nombre» en cada deuda abierta con `PATCH /me/deudas/{id}` `{persona}`), `/cuenta/metas` (`/me/metas`), `/cuenta/presupuesto` (`/me/limites`), `/cuenta/fijos` (`/me/fijos`).
- **Editar** (fase 2 del bot): cada módulo tiene sus botones (Anotar, Editar, Abonar, Saldar, Poner límite, Agregar cuenta…) que abren una ventana (`components/cuenta/Dialog.astro`). El formulario hace POST a la misma página con `accion`; `lib/cuenta/acciones.ts` valida, llama a `/me` (POST/PATCH/PUT/DELETE) y vuelve con `?ok=` o `?error=` (303, así recargar no repite nada). Astro revisa el Origin de cada POST. Borrar pide confirmación dentro de la ventana.
- **Piezas compartidas:** `lib/cuenta/pagina.ts` (sesión, cuentas y categorías para los formularios, avisos), `lib/cuenta/acciones.ts` (validar y llamar al bot), `components/cuenta/` (Dialog, Flash, Head, Icon, CatIcon, Pide, Pronto). Cada página solo arma su contenido.
- **Avisos** («Meta creada.», o el error del bot): en una cookie `tm-flash` de 60 s, httpOnly, solo para `/cuenta`, que se borra al mostrarse. No van en la URL, para que nadie pueda mandar un enlace de telmoney.app con un mensaje inventado.
- **Sin recargar** (`<ClientRouter />` en `layouts/Cuenta.astro`): al cambiar de sección o guardar, Astro pide la página nueva y cambia solo el contenido; la barra lateral se queda (`transition:persist`) y se marca la sección nueva. El servidor responde igual que antes (misma sesión, mismos 303), y si algo falla cae a una recarga normal. Por eso los scripts escuchan en `document` o se enganchan en `astro:page-load`. Lo que sale del sitio o descarga lleva `data-astro-reload`: pagar con Wompi, Salir, la descarga de reportes, el logo y el panel de admin. Renovar la sesión de Clerk antes de un POST corre en captura, antes que el router.
- **Categorías con íconos** (`CatIcon`), no emojis: se eligen por el nombre (o el emoji, si la categoría es propia).
- `/cuenta/metas` (`/me/metas`): crear, editar, abonar, sacar y borrar. Una meta puede ir **vinculada a una cuenta** (`cuenta_id`; la de ahorro, por ejemplo): su avance es el saldo de esa cuenta, así que lo que entra o sale de la cuenta mueve la meta, y abonar o sacar desde la meta es una transferencia entre esa cuenta y otra (`desde_cuenta_id`, o la de siempre). Una cuenta va con una sola meta y no se vinculan tarjetas. El cálculo y las transferencias los hace el bot.
- `/cuenta/fijos`: agregar, editar, quitar y «ya pagué» (Pro; sin Pro, invita a ver los planes). Los de tarjeta solo se ven (el pago sí se marca).
- `/cuenta/ingresos` (`/me/ingresos`): sus fuentes de ingreso, fijas o variables, cada una con su frecuencia (semanal, quincenal, mensual o ciertos días), su cuenta y, si quiere, un sobre («solo para» una categoría). Agregar, editar, quitar, «me llegó» y «no llegó» (cuando es hoy o está atrasado).
- `/cuenta/apartados` (`/me/apartados`): porcentajes de lo que recibe que la persona separa para lo que ella nombre, de todos sus ingresos o de algunos, hacia una meta, una cuenta o una categoría de gasto. «Ya lo aparté» y «Esta vez no». Nada viene puesto: cada quien crea los suyos.
- `/cuenta/calendario?mes=AAAA-MM&dia=AAAA-MM-DD`: el mes día por día, sin endpoint nuevo. Lo pasado sale de `/me/movimientos` (gastos e ingresos de cada día); lo que viene, de `/me/fijos` (Pro), `/me/ingresos` (sus días y el `proximo`) y `/me/deudas` (`vence`). Cada día pasado tiene un color contra lo que puede gastar al día (lo libre de `/me/plan` entre los días del mes; si no hay ingresos, su límite general): hasta eso, verde; hasta 1.5 veces, oro; más, coral. Un gasto con la categoría y el monto de un fijo no cuenta para el color.
- Inicio muestra el plan del mes (`/me/plan`, viene en `{plan}`): ingresos − fijos − apartados − dinero con destino = libre, y el límite semanal; y la línea de lo que viene hasta el próximo ingreso fijo.
- `/cuenta/ajustes`: solo el nombre (`/me/perfil`). El ingreso, los días de pago y el % de ahorro ya no se escriben ahí (el bot responde 422): salen de Ingresos y Apartados.
- `/cuenta/reportes`: Excel, CSV o PDF del mes; la descarga pasa por `/cuenta/reporte`, que se la pide al bot (`/me/reporte`) con el token de la persona.
- `/cuenta/correo`: conectar el correo del banco (docs/correo.md).
- `/cuenta/ajustes` (Ajustes y plan, una sola página): cómo te llama (`/me/perfil`), tu plan, cuándo vence, pasar a Pro o renovar (Wompi), historial de pagos y tu WhatsApp. `/cuenta/plan` redirige aquí (`#plan`) con su `?pago=listo`, para los enlaces viejos y la vuelta de Wompi.
- Botón "Entrar" en el menú de la página. `/chat`: enlace corto que abre el bot en WhatsApp (para compartir). `/pago`: a donde vuelve Wompi.
- Fuera de Google (`noindex`, `robots.txt`), sin caché.

## Lo que hay que configurar

- **Clerk:** permitir crear cuenta (sin Allowlist), con Google y código por correo.
- **Vercel:** nada nuevo para la web (usa `BOT_API_URL`, que ya existe; ya no solo para el panel).
- **Bot:** lo de arriba, y su URL fija.
- **Wompi:** salir del modo de prueba cuando todo esté probado; el webhook apuntando a la URL fija del bot.
