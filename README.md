# telmoney-web

Landing de **TelMoney**: tu plata en orden, por WhatsApp. Hecha con Astro, GSAP y Lenis.

- Marca, tono, conversaciones y precios: `../telmoney-bot/docs/marca.md` (la fuente de verdad del contenido).
- Identidad visual: `DESIGN.md` (sistema de dos polaridades, chip de palabra clave y calcomanías), adaptado a la paleta de la marca.

## Correr

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # estático en dist/
```

## Configuración (`.env`, ver `.env.example`)

| Variable | Qué hace |
|---|---|
| `PUBLIC_WHATSAPP_NUMBER` | Vacío = pre-lanzamiento: los botones dicen «Unite a la beta» y llevan al formulario. Con número (ej. `50370000000`), dicen «Probalo gratis 7 días» y abren `wa.me` con «Hola TelMoney». |
| `RELEASE_AT` (en `src/config.ts`) | Fecha de apertura de la beta para la cuenta regresiva (hoy: 1/11/2026, 00:00 de El Salvador). |
| `PUBLIC_WAITLIST_URL` | Endpoint que recibe el formulario de la beta. Vacío = modo demo (no envía nada y lo imprime en la consola). |

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
  components/          una sección por archivo, en el orden de la página
```

## Modo claro y oscuro

- La primera visita sigue la configuración del navegador; el botón del menú (`ThemeToggle.astro`) lo cambia y lo recuerda.
- Los colores viven en `src/styles/global.css` como **tokens de rol** (`--bg`, `--text`, `--text-muted`, `--hairline`, `--band`, `--chat-*`…), con un valor por tema verificado con WCAG AA (4.5:1 texto, 3:1 gráficos y bordes de campos).
- En los componentes usa siempre esos tokens, nunca colores sueltos. Para una sección o tarjeta con el tema contrario al de la página, agrega la clase `tone-invert`.

## Antes de lanzar

- [ ] Número oficial de WhatsApp en `PUBLIC_WHATSAPP_NUMBER`.
- [ ] Endpoint de la lista de espera en `PUBLIC_WAITLIST_URL` (por ejemplo, un `POST /waitlist` en el bot).
- [ ] Textos de `/privacidad` y `/terminos` (hoy son páginas provisionales).
- [ ] Dominio definitivo en `astro.config.mjs` y `SITE.url` (`src/config.ts`).
- [ ] Cuentas de Instagram/TikTok y correo de contacto en `SITE`.
- [ ] Imagen para compartir (Open Graph) de 1200×630.
- [ ] Decidir si se mantiene `public/whatsapp-fondo.jpg` (es el fondo de chat de WhatsApp, propiedad de Meta) o se reemplaza por uno propio.
