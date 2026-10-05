# SEO y redes sociales: TelMoney

Cómo encuentra Google a TelMoney, cómo se ve el link cuando alguien lo comparte y qué hay que configurar para **telmoney.app**.

## 1. Diagnóstico

| Punto | Antes | Ahora |
|---|---|---|
| Imagen al compartir (`og:image`) | ❌ No había: el link salía sin imagen | ✅ 1200×630, 70 KB, con el lema, la prueba (chat) y el llamado a la acción |
| Tarjeta de X | Solo el tipo | ✅ Título, descripción, imagen y texto alternativo |
| Título para Google | «TelMoney · Tu pisto en orden, por WhatsApp» (sin lo que la gente busca) | ✅ «TelMoney: control de gastos por WhatsApp \| Tu pisto en orden» (60) |
| Descripción | Buena, sin llamado a la acción | ✅ 153 caracteres, termina en «Únete a la beta» |
| Título y descripción al compartir | Los mismos que para Google | ✅ Propios: el lema y una frase de ~90 caracteres que entra completa en WhatsApp |
| Idioma para redes | `es_SV` (Facebook no lo reconoce) | ✅ `es_LA`; página en `lang="es"` |
| Datos estructurados | Solo preguntas frecuentes | ✅ Empresa, sitio, página, app con sus 2 planes en USD y preguntas |
| robots.txt / sitemap / manifiesto | ❌ 404 | ✅ Generados desde la configuración |
| Páginas legales provisionales | Indexables | ✅ `noindex` y fuera del sitemap hasta tener el texto real |
| Encabezados | «sueldo.Otro» pegado; `h2` de adorno en el footer | ✅ Un solo `h1`, `h2` por sección, sin títulos de adorno |
| Fuente del título principal | Sin precargar | ✅ Precargada (llega antes lo primero que se pinta) |
| Compartir | No había forma | ✅ Botones con mensajes por red y campaña (`utm_*`) medible |

## 2. Mensajes

- **Lema:** «Tu pisto en orden, por WhatsApp.»
- **Promesa en una línea:** «Sabe cuánto puedes gastar hoy con un mensaje de WhatsApp.»
- **Llamado a la acción:** hasta el 1/11, «Únete gratis a la beta · 1 de noviembre». Desde el lanzamiento, «Pruébalo gratis 7 días». Cambia solo con `PUBLIC_WHATSAPP_NUMBER`.

| Dónde | Texto | Por qué |
|---|---|---|
| Google (título) | TelMoney: control de gastos por WhatsApp \| Tu pisto en orden | Lo que se busca va al principio; el lema da la personalidad |
| Google (descripción) | Anota tus gastos con un mensaje, un audio o la foto del recibo… Únete a la beta. | Cómo se usa, el beneficio y la acción |
| Al compartir (título) | Tu pisto en orden, por WhatsApp | El nombre ya aparece aparte (`og:site_name`) |
| Al compartir (descripción) | Sabe cuánto puedes gastar hoy con un mensaje de WhatsApp. Beta gratis el 1 de noviembre. | Entra completa en las 2 líneas de WhatsApp |
| Botón WhatsApp / Telegram | Mira esto 👀 TelMoney te dice cuánto puedes gastar hoy… La beta abre el 1 de noviembre y es gratis: | Suena a un amigo, no a un anuncio |
| Botón X | Tu pisto en orden, por WhatsApp 💚 … 👇 | Corto, con el lema |
| Correo | Asunto: «Para que el pisto te alcance todo el mes» | Beneficio en el asunto |

Todos los textos viven en `src/seo/meta.ts` y `src/seo/share.ts`.

### Medición

Cada botón agrega `utm_source` (whatsapp, telegram, facebook, x, linkedin, email, copy, nativo), `utm_medium` y `utm_campaign=beta_compartir`. El formulario de la beta guarda esos `utm` en la tabla `waitlist`, así se ve qué red trae más registros.

Para los links que publiques tú, usa la misma regla:

```
https://telmoney.app/?utm_source=instagram&utm_medium=bio&utm_campaign=beta
https://telmoney.app/?utm_source=tiktok&utm_medium=bio&utm_campaign=beta
https://telmoney.app/?utm_source=whatsapp&utm_medium=estado&utm_campaign=beta
```

### Kit de imágenes

- `public/og/telmoney-og.jpg` (1200×630): la que muestran las redes.
- `public/og/telmoney-cuadrado.jpg` (1080×1080): para publicar en Instagram o en estados de WhatsApp.

Se regeneran con `npm run og`. Después, sube `?v=` en `src/seo/meta.ts` para que WhatsApp y Facebook no sigan mostrando la versión vieja.

## 3. Estructura del código

```
src/seo/meta.ts              textos para Google y redes, imagen social
src/seo/schema.ts            datos estructurados (JSON-LD)
src/seo/share.ts             mensajes y links para compartir, con utm_*
src/components/seo/SeoHead.astro   todas las etiquetas del <head>
src/components/ShareButtons.astro  botones de compartir (+ menú nativo del celular)
src/data/faqs.ts             preguntas: las usa la sección y los datos estructurados
src/pages/robots.txt.ts      robots.txt
src/pages/site.webmanifest.ts manifiesto (íconos al guardar en la pantalla de inicio)
scripts/og.mjs               imágenes sociales (npm run og)
scripts/icons.mjs            íconos desde public/favicon.png (npm run icons)
astro.config.mjs             dominio y sitemap (excluye las páginas en borrador)
```

## 4. Paso a paso para publicar en telmoney.app

### 4.1 Hosting

El sitio es estático (`dist/`). Sirve Vercel, Netlify o Cloudflare Pages; los tres tienen plan gratis y HTTPS automático.

1. Crea el proyecto conectando el repositorio `josueduarkey/telmoney-web`.
2. Comando de compilación: `npm run build`. Carpeta de salida: `dist`. Versión de Node: 22.
3. Variables de entorno (Settings → Environment variables):

| Variable | Valor |
|---|---|
| `PUBLIC_SITE_URL` | `https://telmoney.app` |
| `PUBLIC_WAITLIST_URL` | La URL fija del endpoint del bot, por ejemplo `https://api.telmoney.app/waitlist` (no el túnel temporal) |
| `PUBLIC_WHATSAPP_NUMBER` | Vacío hasta el lanzamiento; ese día, el número sin «+» |
| `PUBLIC_PLAY_STORE_URL` | La ficha de la app en Google Play, cuando exista |
| `PUBLIC_APP_STORE_URL` | La ficha en App Store, cuando exista |
| `PUBLIC_X_HANDLE` | Tu usuario de X sin «@», si abren cuenta |

### 4.2 Dominio

1. En el hosting, agrega `telmoney.app` y también `www.telmoney.app`, con una redirección de `www` a `telmoney.app`.
2. En el registrador del dominio, crea los registros DNS que te indique el hosting: para el dominio principal, un `A`/`ALIAS`; para `www`, un `CNAME`.
3. `.app` exige HTTPS siempre: el dominio no abre sin certificado. El hosting lo emite solo; espera a que diga «Valid» antes de compartir el link.
4. Para el bot, usa un subdominio: `api.telmoney.app` apuntando al servidor del bot. El CORS del bot ya acepta `https://telmoney.app` y `https://www.telmoney.app`.

### 4.3 Google

1. [Google Search Console](https://search.google.com/search-console): agrega una propiedad de tipo **Dominio** `telmoney.app` y verifícala con el registro TXT que te dan.
2. En «Sitemaps», envía `https://telmoney.app/sitemap-index.xml`.
3. En «Inspección de URLs», pide indexar `https://telmoney.app/`.
4. Revisa los datos estructurados en la [prueba de resultados enriquecidos](https://search.google.com/test/rich-results).
5. Opcional: [Bing Webmaster Tools](https://www.bing.com/webmasters) permite importar todo desde Search Console. Bing también alimenta a ChatGPT y otros buscadores.

### 4.4 Revisar cómo se ve al compartir

- **Facebook e Instagram:** [Sharing Debugger](https://developers.facebook.com/tools/debug/). Pega el link y toca «Scrape again» cada vez que cambies la imagen o los textos.
- **LinkedIn:** [Post Inspector](https://www.linkedin.com/post-inspector/).
- **X:** pega el link en un post nuevo, sin publicarlo, para ver la tarjeta.
- **WhatsApp:** mándate el link a ti mismo. WhatsApp guarda la vista previa en caché por días; si cambiaste la imagen, sube `?v=` en `src/seo/meta.ts`.
- **Telegram:** escríbele el link a `@WebpageBot` para refrescar su caché.

### 4.5 Redes

- Bio de Instagram y TikTok (`@telmoney.sv`): pon el link con `utm_source=instagram` o `utm_source=tiktok`, como en la sección 2.
- Primer contenido sugerido: la imagen cuadrada, o un video corto de la demo del inicio (escribir «gasté 5 en café» y ver la respuesta).

## 5. El día del lanzamiento (1/11)

1. `PUBLIC_WHATSAPP_NUMBER` con el número oficial. Los botones, la descripción y los mensajes para compartir pasan solos a «Pruébalo gratis 7 días».
2. `npm run og` para regenerar las imágenes con el nuevo llamado a la acción, y subir `?v=` en `src/seo/meta.ts`.
3. Si ya están los textos legales: quitar `draft` en `src/pages/privacidad.astro` y `terminos.astro`, y sacarlas de `DRAFTS` en `astro.config.mjs`.
4. Volver a compilar y publicar, y refrescar las vistas previas (sección 4.4).

## 6. Recomendaciones para después

- **Analítica respetuosa:** Plausible o Cloudflare Web Analytics, sin cookies ni banner. Hoy no hay ninguna instalada.
- **Reseñas reales:** cuando haya usuarios, sus opiniones se pueden agregar a los datos estructurados. Nunca inventarlas.
- **Contenido que posiciona:** páginas o artículos para lo que se busca, como «cómo calcular cuánto puedo gastar al día», «cómo ahorrar con quincena» o «recordatorio de pago de tarjeta». Hoy hay una sola página.
- **Insignias oficiales** de Google Play y App Store cuando existan las fichas.
