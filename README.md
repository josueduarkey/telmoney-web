# telmoney-web

Landing de **TelMoney**: tu plata en orden, por WhatsApp. Hecha con Astro, GSAP y Lenis.

- Marca, tono, conversaciones y precios: `../telmoney-bot/docs/marca.md` (la fuente de verdad del contenido).
- Identidad visual: `DESIGN.md` (sistema de dos polaridades, chip de palabra clave y calcomanías), adaptado a la paleta de la marca.

## Correr

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # para Vercel (.vercel/output): la página es estática; el panel y /api/waitlist, funciones
```

## Configuración (`.env`, ver `.env.example`)

| Variable | Qué hace |
|---|---|
| `PUBLIC_WHATSAPP_NUMBER` | Vacío = pre-lanzamiento: los botones dicen «Unite a la beta» y llevan al formulario. Con número (ej. `50370000000`), dicen «Probalo gratis 7 días» y abren `wa.me` con «Hola TelMoney». |
| `RELEASE_AT` (en `src/config.ts`) | Fecha de apertura de la beta para la cuenta regresiva (hoy: 1/11/2026, 00:00 de El Salvador). |
| `PUBLIC_PLAY_STORE_URL` | Ficha de la app en Google Play. Vacío = el botón lleva a la búsqueda de «TelMoney» en Google Play. |
| `PUBLIC_APP_STORE_URL` | Ficha en App Store. Vacío = el botón dice «Muy pronto» y no es un enlace. |
| `PUBLIC_SITE_URL` | Dominio público (`https://telmoney.app`). Lo usan las URLs absolutas para redes, el sitemap y robots.txt. |
| `PUBLIC_X_HANDLE` | Usuario de X sin «@» para la tarjeta de X (opcional). |
| `PUBLIC_WAITLIST_URL` | Endpoint que recibe el formulario de la beta. Vacío = `/api/waitlist` de esta misma página, que guarda directo en la base del bot. |
| `ADMIN_DATABASE_URL`, `WAITLIST_DATABASE_URL`, `PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`… | Panel de administración y formulario de la beta: ver [`docs/admin.md`](docs/admin.md). |

El formulario manda `POST` con JSON:

```json
{ "name": "Ana", "whatsapp": "+50371234567", "email": null, "pains": ["Ahorrar", "Acordarme de los pagos"], "source": "landing", "utm": {} }
```

Cualquier respuesta 2xx muestra «¡Listo! Te escribimos por WhatsApp cuando abra la beta».

## Estructura

```
src/
  config.ts            número, endpoint, precios: lo que cambia al lanzar
  data/chats.ts        conversaciones reales del bot (no inventar respuestas)
  lib/wa.ts            *negrita* y _cursiva_ de WhatsApp a HTML
  scripts/motion.ts    scroll suave y animaciones de entrada (respeta «reducir movimiento»)
  scripts/hero-bg.ts   luces del inicio que siguen al cursor
  scripts/typewriter.ts  título que escribe hasta 3 frases
  scripts/chat.ts      reproduce chats en el teléfono
  scripts/demo-bot.ts  demo en vivo del inicio: responde gastos, ingresos y consultas en el navegador
  scripts/waitlist.ts  validación y envío del formulario
  pages/api/waitlist.ts  guarda el formulario en la base (tabla waitlist del bot)
  pages/admin/         panel de administración (con sesión de Clerk; ver docs/admin.md)
  middleware.ts        la puerta del panel
  lib/admin/           consultas y formatos del panel
  components/          una sección por archivo, en el orden de la página
```

## Panel de administración

`telmoney.app/admin`: usuarios, mensajes, costo estimado, ventas, gastos (también por persona) y la lista de interesados en la beta. Solo entra `josueduardo.dev@gmail.com` con Google. Qué muestra, cómo se protege y cómo configurarlo: [`docs/admin.md`](docs/admin.md).

## Documentación

- [`docs/resumen-de-trabajo.md`](docs/resumen-de-trabajo.md): qué se hizo, en qué commits y qué queda pendiente.
- [`docs/seo-y-redes.md`](docs/seo-y-redes.md): SEO, vistas previas al compartir y paso a paso para publicar en telmoney.app.

## SEO y redes

Textos para Google y redes, datos estructurados, imagen al compartir, botones de compartir y el paso a paso para publicar en telmoney.app: [`docs/seo-y-redes.md`](docs/seo-y-redes.md).

```bash
npm run og      # imágenes para compartir (1200×630 y 1080×1080) en public/og/
```

## Logo e íconos

El logo oficial es `public/favicon.png` (fondo transparente). Si cambia, reemplaza ese archivo y corre:

```bash
npm run icons   # genera app-icon.png, favicon-32.png, favicon-192.png y apple-touch-icon.png
```

El pájaro tiene partes casi negras, así que en la página va sobre una baldosa blanca para verse en los dos temas.

## Logos de bancos

En el repo solo quedan los logos ya normalizados (`src/assets/bancos/*.png`); los originales no se guardan. Para agregar o cambiar uno, pon el original (como venga: a color, blanco, con aire alrededor) en `src/assets/bancos/originales/`, súmalo a `LOGOS` en `scripts/bancos.mjs` y a la lista de `src/components/MadeInSV.astro`, y corre:

```bash
npm run bancos  # recorta, deja una sola tinta y mismo alto en src/assets/bancos/
```

Después puedes borrar el original: esa carpeta está en `.gitignore` y el script deja como están los logos que no tengan original.

En la página se pintan con el color del texto, así se ven igual en tema claro y oscuro. El tamaño de cada uno sale de su proporción para que todos pesen parecido.

## Modo claro y oscuro

- La primera visita sigue la configuración del navegador; el botón del menú (`ThemeToggle.astro`) lo cambia y lo recuerda.
- Los colores viven en `src/styles/global.css` como **tokens de rol** (`--bg`, `--text`, `--text-muted`, `--hairline`, `--band`, `--chat-*`…), con un valor por tema verificado con WCAG AA (4.5:1 texto, 3:1 gráficos y bordes de campos).
- En los componentes usa siempre esos tokens, nunca colores sueltos. Para una sección o tarjeta con el tema contrario al de la página, agrega la clase `tone-invert`.

## Antes de lanzar

- [ ] Número oficial de WhatsApp en `PUBLIC_WHATSAPP_NUMBER`.
- [ ] Variables del panel y del formulario en Vercel (`docs/admin.md`); sin `WAITLIST_DATABASE_URL` el formulario no guarda.
- [ ] Que la política de privacidad diga que el equipo puede ver los movimientos (el panel los muestra).
- [ ] Textos de `/privacidad` y `/terminos` (hoy son páginas provisionales).
- [ ] Dominio definitivo en `astro.config.mjs` y `SITE.url` (`src/config.ts`).
- [ ] Cuentas de Instagram/TikTok y correo de contacto en `SITE`.
- [ ] Imagen para compartir (Open Graph) de 1200×630.
- [ ] Links reales de la app en Google Play y App Store, y cambiar los botones por las insignias oficiales de cada tienda.
- [ ] Decidir si se mantiene `public/whatsapp-fondo.jpg` (es el fondo de chat de WhatsApp, propiedad de Meta) o se reemplaza por uno propio.
