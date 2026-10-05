# Resumen de trabajo: landing de TelMoney

Qué se hizo, dónde está y qué queda pendiente. Para revisar con calma.

## Dónde está todo

- **Rama de trabajo:** `feat/mode-toggle`, con 11 commits **sin subir a GitHub** (`git push -u origin feat/mode-toggle` cuando lo revises).
- **`main`** ya incluye la etapa anterior (rama `feat/landing-verde-demo` + tu commit «fix images»).
- **Para verla:** `npm run dev` → http://localhost:4321

## Commits de esta etapa (en orden)

| Commit | Qué hace |
|---|---|
| `e7e2bbc` feat(tema): tokens de rol para modo oscuro y claro | Todos los colores pasan a tokens con valor por tema; contraste verificado |
| `cc5ecf4` feat(tema): botón de modo claro/oscuro con transición y aura | Botón en el menú, sigue al navegador, recuerda la elección |
| `56e5faa` fix(como-funciona): paso activo sin animaciones | «Así de simple» quedaba vacío con «reducir movimiento» |
| `5c8b2f0` docs: modo claro/oscuro y tokens | Sección en el README |
| `5561c76` feat(logo): logo oficial como favicon y en todo el sitio | El pájaro en «t» de `public/favicon.png` |
| `491796b` feat(footer): ola, la app y sin «Hecho en El Salvador» | Ola con cresta verde y bloque «¿Prefieres una app?» |
| `c880256` feat(seo): imágenes para compartir | `npm run og`: 1200×630 y 1080×1080 |
| `150c31b` feat(seo): textos, Open Graph, X y datos estructurados | Todo lo que leen Google y las redes |
| `7c998a8` feat(seo): robots.txt, sitemap y manifiesto | Antes daban 404 |
| `3001a1a` feat(compartir): botones con mensajes por red | Con campañas `utm_*` medibles |
| `304b1f2` fix(seo): encabezados legibles | «sueldo.Otro» y títulos de adorno en el footer |

## 1. Modo claro y oscuro

- **Primera visita:** toma el modo del navegador; se aplica antes de pintar, sin parpadeo.
- **Botón en el menú:** cambia el tema y lo recuerda. Si eliges lo mismo que tu sistema, vuelve a seguir al sistema.
- **Transición:** el tema nuevo entra en círculo desde el botón, con un aura verde. Sin animación si la persona pidió menos movimiento.
- **Modo claro:** página blanca con acentos verdes. Precios y preguntas se invierten a negro, con el plan Pro en blanco, para mantener el ritmo. El teléfono muestra WhatsApp en modo claro.
- **Contraste verificado** (WCAG AA: 4.5:1 texto, 3:1 gráficos y bordes de campos):
  - axe-core: 0 fallas, en los dos temas, a 1440 y 390 px.
  - Medición propia por píxeles contra el fondo real: 2,174 textos en 8 escenarios, 0 bajo el mínimo.
- **Fallas viejas corregidas de paso:**
  - Hora en burbujas verdes: 3.48 → 5.31:1.
  - Texto de ayuda del chat: 3.91 → 5.37:1.
  - Hora de los avisos de «Sin TelMoney»: 4.2 → 4.86:1.
  - Bordes de campos del formulario: 1.5 → 3.4:1 o más.
  - Texto seleccionado: 3.4 → 6.2:1.
  - «money» del logo en modo claro: pasa a Verde Profundo #057A55.
- **Para editar sin romper el contraste:** usa siempre los tokens de `src/styles/global.css` (`--bg`, `--text`, `--text-muted`…). Para una sección con el tema contrario, agrega la clase `tone-invert`.

## 2. Logo oficial

- `public/favicon.png` es la fuente. `npm run icons` genera todos los tamaños: favicon, Android, iPhone, Google y manifiesto.
- El pájaro tiene partes casi negras y fondo transparente, así que en la página va sobre una baldosa blanca: en el menú, el footer y la foto de perfil (redonda) del chat.

## 3. Footer

- Ola suave con cresta verde luminosa. Se mueve lento solo cuando el footer está en pantalla.
- Bloque «¿Prefieres una app?» (opcional): ícono, «Descárgala en Google Play» y «Muy pronto en App Store».
- Sin «Hecho en El Salvador».

## 4. SEO y redes

La guía completa está en [`seo-y-redes.md`](seo-y-redes.md). En resumen:

- **Google:**
  - Título «TelMoney: control de gastos por WhatsApp \| Tu dinero en orden» (61 caracteres, entra sin cortarse).
  - Descripción de 153 caracteres que termina en «Únete a la beta».
  - Datos estructurados: empresa, sitio, la app con sus 2 planes en USD y las preguntas.
  - robots.txt y sitemap.
  - Páginas legales provisionales con `noindex`.
- **Al compartir** (WhatsApp, Facebook, LinkedIn, X, Telegram):
  - Imagen de 1200×630 (70 KB) con el lema, un chat que responde «Hoy puedes gastar $21.70» y «Únete gratis a la beta · 1 de noviembre».
  - Título «Tu dinero en orden, por WhatsApp» y una descripción que entra completa en WhatsApp.
- **Botones para compartir:**
  - Están en el «¡Listo!» de la beta y en el footer.
  - Cada red tiene su mensaje, y todos llevan `utm_*`. La lista de espera guarda esos `utm`, así se ve qué red trae más registros.
- **Todo cambia solo el día del lanzamiento:** al poner `PUBLIC_WHATSAPP_NUMBER`, el llamado a la acción pasa a «Pruébalo gratis 7 días».

## 5. «Dinero» en lugar del modismo local

Para que lo entienda gente de cualquier país, todos los textos públicos usan «dinero»: el lema («Tu dinero en orden, por WhatsApp»), el título de Google, las imágenes para compartir (regeneradas, versión `?v=3`), los mensajes de los botones, el formulario y el manifiesto. No queda ningún modismo local en el código ni en la página compilada.

- El título de Google quedó en 61 caracteres, pero mide 571 px y Google corta cerca de 580 px: entra completo.
- Una opción del formulario cambió de texto («Llegar a fin de mes con dinero»). Se le pidió a @bot que el endpoint la acepte (y que siga aceptando la anterior). Si el servidor rechaza algo que no es un campo visible, el formulario ahora muestra un aviso claro en vez de fallar en silencio.

## Pendiente (lo tuyo)

0. **Confirmar con @bot** que el endpoint `/waitlist` acepta la opción «Llegar a fin de mes con dinero». Además, el túnel temporal del bot está caído: hay que levantarlo o, mejor, publicar el bot en `api.telmoney.app`.

1. **Publicar en telmoney.app:** el paso a paso de hosting, DNS, variables, Google Search Console y la revisión de vistas previas está en [`seo-y-redes.md`, sección 4](seo-y-redes.md#4-paso-a-paso-para-publicar-en-telmoneyapp).
2. **Endpoint fijo de la lista de espera:** hoy `.env` apunta a un túnel temporal de Cloudflare que cambia al reiniciar el bot. Hace falta un dominio fijo, por ejemplo `api.telmoney.app/waitlist`.
3. **Links de la app:** `PUBLIC_PLAY_STORE_URL` y `PUBLIC_APP_STORE_URL` cuando existan las fichas, y cambiar los botones por las insignias oficiales de cada tienda.
4. **Textos legales:** cuando estén, quitar `draft` en `src/pages/privacidad.astro` y `terminos.astro`, y sacarlos de `DRAFTS` en `astro.config.mjs`.
5. **Voz del bot:** la página está en español neutro («tú»); el bot real todavía responde con voseo. Decidirlo con @bot.
6. **Fondo de WhatsApp:** `public/whatsapp-fondo.jpg` es diseño de Meta. Para el lanzamiento público conviene uno propio con el mismo estilo.
7. **Archivo sin uso:** `public/whatsapp-fondo.png` (1.4 MB) ya no se usa desde tu commit «fix images»; se puede borrar.

## Notas técnicas

- **`npm audit`** marca 2 avisos moderados en `fflate`, que viene con `satori`. Solo corre al generar las imágenes con nuestro propio contenido, nunca abre archivos ZIP de terceros: no aplica.
- **Servidor de desarrollo:** cuando se reescribe un archivo `.astro` entero, a veces muestra estilos viejos. Si algo se ve raro: `npx astro dev stop` y `npm run dev`. La compilación (`npm run build`) siempre sale bien.
