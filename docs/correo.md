# Correo del banco: las compras llegan solas

*18 de octubre de 2026.*

## Qué es

Los bancos mandan un correo con cada compra. La persona crea en **telmoney.app/cuenta/correo** una dirección solo suya (`k7f3x2ab@gastos.telmoney.app`) y, con un filtro de Gmail u Outlook, le reenvía ahí los correos de su banco. TelMoney lee el monto, el comercio y la fecha, y le pregunta por WhatsApp: "¿La anoto?".

**Por qué así y no "Conectar Gmail":** leer el Gmail de alguien (permiso `gmail.readonly`) es un permiso *restringido* de Google: exige una auditoría de seguridad externa (CASA) cada año, y sin ella la app queda en 100 usuarios con pantalla de "app no verificada". Con el reenvío no hay permiso de Google, sirve con cualquier correo y solo llega lo que la persona decide.

Todo es gratis: Cloudflare Email Routing y Email Workers (100,000 correos al día en el plan gratis).

## Las piezas

```
banco ──correo──► Gmail de la persona ──filtro "reenviar"──► <alias>@gastos.telmoney.app
                                                                   │  Cloudflare Email Routing (catch-all del subdominio)
                                                                   ▼
                                                   Worker cloudflare/correo  ──POST /correo/entrante──► bot
                                                                                                         ├─ código de Google → lo guarda (la web lo muestra)
                                                                                                         └─ correo del banco → Gemini lo lee → "¿La anoto?" por WhatsApp
telmoney.app/cuenta/correo ──Bearer <token de Clerk>──► bot /me/correo   (crear, ver, desconectar)
```

- **Worker** (`cloudflare/correo/`): no guarda nada. Lee el correo (postal-mime), se queda con remitente, asunto, fecha y texto (máx. 30,000 caracteres; si solo trae HTML, lo pasa a texto) y se lo manda al bot. Si el bot dice 404 rechaza el correo; si el bot no responde, lanza un error para que Gmail lo reintente.
- **Web**: la pantalla de la guía (Gmail paso a paso, Outlook), la dirección con botón de copiar, el código de Google en cuanto llega (se actualiza sola) y lo último que ha llegado.
- **Bot**: dueño de las direcciones y de todo lo demás.

## API del bot

### Para la web (y la app): `/me/correo`

Misma autenticación y reglas que el resto de `/me` (docs/cuenta.md). Sin vincular: 404.

| Ruta | Respuesta |
|---|---|
| `GET /me/correo` | `{direccion: "k7f3x2ab@gastos.telmoney.app" \| null, creada, confirmacion: {codigo: "123456789" \| null, enlace \| null, llego} \| null, ultimo_correo: iso \| null, recibidos: [{fecha, de, asunto, estado: "pendiente"\|"anotado"\|"descartado"\|"ignorado", monto \| null, comercio \| null}]}` (los últimos 20) |
| `POST /me/correo` | Crea la dirección (o devuelve la que ya tiene): `{direccion}` |
| `DELETE /me/correo` | Desconecta: la dirección deja de recibir (404 al Worker). Si vuelve a crear, **dirección nueva** (por si la anterior se filtró). `{ok: true}` |

### Para el Worker: `POST /correo/entrante`

Cabecera `Authorization: Bearer <CORREO_TOKEN>` (secreto compartido, comparar en tiempo constante). Cuerpo:

```json
{ "alias": "k7f3x2ab", "de": "notificaciones@banco.com", "de_nombre": "Banco", "de_sobre": "persona+caf_=…@gmail.com",
  "asunto": "Compra aprobada", "fecha": "2026-10-18T16:00:00.000Z", "message_id": "<abc@banco>", "texto": "Comercio SUPER SELECTOS\nMonto $23.40" }
```

Respuestas: `200 {ok}` · `404` alias que no existe o desconectado · `429` pasó el límite del día · `401` token malo · cualquier `5xx` = "reintenta".

### Qué hace el bot con cada correo

1. **Alias** → persona. Inactivo o desconocido: 404.
2. **Repetido** (`message_id` ya visto para esa persona): 200 sin hacer nada (Gmail a veces reintenta).
3. **Código de Google**: si `de` es `forwarding-noreply@google.com`, saca el código (9 dígitos) y el enlace de confirmación (`https://mail(-settings)?.google.com/...`), los guarda en la dirección y listo. No se manda a Gemini.
4. **Correo del banco**: Gemini extrae `{es_movimiento, tipo: compra|retiro|transferencia_enviada|transferencia_recibida|pago_tarjeta|otro, monto, moneda, comercio, fecha, banco, ultimos4}`. Si no es un movimiento (promociones, estados de cuenta): `ignorado`.
5. **Nunca se anota solo.** Cualquiera puede mandar un correo a una dirección: siempre se le pregunta a la persona. Botones "Anotar" / "No". Con la categoría que pondría el bot y la cuenta según el banco o los últimos 4 dígitos, si ya la conoce.
6. **WhatsApp y la ventana de 24 horas:** si la persona escribió en las últimas 24 h, la pregunta va de una vez (mensaje de servicio). Si no, se juntan y se le preguntan todas cuando vuelva a escribir y en el reporte de la noche. Opcional después: plantilla `telmoney_compra_correo` (utility, aprobación de Meta, se cobra).
7. **Privacidad:** el `texto` se borra a los 7 días (o al anotarse); se queda lo extraído. "borrar mis datos" borra también las direcciones y lo recibido.
8. **Límites:** 50 correos al día por dirección (después, 429). Si en un día llegan muchos que no son movimientos, avisarle que revise su filtro.

**Planes:** en la beta, todos (Free incluido). Cada correo cuesta una llamada a Gemini (~$0.001) y, si se pregunta fuera de una conversación, el mensaje de WhatsApp.

### En la base del bot (sugerido)

- `correo_direcciones`: `alias` (único, 8 caracteres `[a-z2-9]` sin parecidos), `user_id`, `activa`, `codigo_google`, `enlace_google`, `codigo_llego`, `created_at`, `desactivada_at`.
- `correo_recibidos`: `id`, `user_id`, `alias`, `message_id` (único con `user_id`), `de`, `asunto`, `recibido`, `estado`, `datos` jsonb (lo extraído), `texto` (se borra a los 7 días), `movimiento_id`.

Variables: `CORREO_TOKEN`, `CORREO_DOMINIO=gastos.telmoney.app`, `CORREO_LIMITE_DIA=50`.

## Configurar Cloudflare (una vez)

El dominio hoy está en **Namecheap** (DNS y reenvío de `hola@telmoney.app`). Email Routing necesita que el DNS de `telmoney.app` esté en Cloudflare (gratis). La web sigue en Vercel y Clerk sigue igual: solo cambia quién responde el DNS.

1. **Cloudflare** → crear cuenta (gratis) → *Add a domain* → `telmoney.app` → plan **Free**. Revisar que importe estos registros, todos con la **nube gris (DNS only)**:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | A | `@` | `216.150.1.1` (Vercel) |
   | CNAME | `www` | `6765835201b97771.vercel-dns-016.com` |
   | CNAME | `clerk` | `frontend-api.clerk.services` |
   | CNAME | `accounts` | `accounts.clerk.services` |
   | CNAME | `clkmail` | `mail.0wj5lt7dax2p.clerk.services` |
   | CNAME | `clk._domainkey` | `dkim1.0wj5lt7dax2p.clerk.services` |
   | CNAME | `clk2._domainkey` | `dkim2.0wj5lt7dax2p.clerk.services` |

   (Los MX y el SPF de Namecheap no se copian: Email Routing pone los suyos.)
2. **Namecheap** → Domain List → telmoney.app → Nameservers: *Custom DNS* → los dos que da Cloudflare. Tarda de minutos a unas horas. Mientras, la web sigue funcionando.
3. **Cloudflare → Email → Email Routing** → activar en `telmoney.app` y:
   - Reglas: `hola@telmoney.app` → tu Gmail (reemplaza el reenvío de Namecheap; Cloudflare te manda un correo para verificarlo).
   - *Settings* → agregar el subdominio **`gastos.telmoney.app`** (pone sus MX).
4. **Worker:** en `cloudflare/correo/` poner la URL del bot en `wrangler.toml` (`BOT_URL`) y:
   ```
   npm install && npx wrangler login
   npx wrangler secret put CORREO_TOKEN      # el mismo que CORREO_TOKEN en el bot
   npm run deploy
   ```
5. **Email Routing → Routing rules** del subdominio `gastos.telmoney.app` → *Catch-all* → **Send to a Worker** → `telmoney-correo`.
6. Probar: crear una dirección en /cuenta/correo, reenviar un correo del banco y ver `npm run logs` en `cloudflare/correo/`.
