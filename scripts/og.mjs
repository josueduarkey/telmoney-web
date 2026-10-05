// Imagen para compartir (Open Graph) y su versión cuadrada, generadas con código.
// Uso: npm run og
//
// - public/og/telmoney-og.jpg        1200×630  → la que muestran WhatsApp, Facebook, LinkedIn, X, Telegram
// - public/og/telmoney-cuadrado.jpg  1080×1080 → para publicar en Instagram o en estados de WhatsApp
//
// Mensaje: el lema (con su chip verde), el beneficio en una línea y el llamado a la acción;
// a la derecha, la prueba: un chat donde TelMoney responde cuánto puedes gastar hoy.
// Va en JPEG liviano: WhatsApp deja de mostrar la imagen si pesa demasiado.
// Si cambias el diseño, sube ?v= en src/seo/meta.ts para que las redes no usen la versión en caché.
import fs from 'node:fs';
import satori from 'satori';
import sharp from 'sharp';

// Mismo criterio que src/config.ts: con número oficial de WhatsApp, ya se lanzó.
const env = Object.fromEntries(
  fs.existsSync('.env')
    ? fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
    : [],
);
const LAUNCHED = Boolean(process.env.PUBLIC_WHATSAPP_NUMBER || env.PUBLIC_WHATSAPP_NUMBER);
const DOMAIN = (process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || 'https://telmoney.app').replace(/^https?:\/\//, '').replace(/\/$/, '');
const CTA = LAUNCHED ? ['Pruébalo gratis 7 días', 'sin tarjeta'] : ['Únete gratis a la beta', '1 de noviembre'];

const font = (pkg, file) => fs.readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`);
const fonts = [
  { name: 'Jakarta', data: font('plus-jakarta-sans', 'plus-jakarta-sans-latin-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'Jakarta', data: font('plus-jakarta-sans', 'plus-jakarta-sans-latin-700-normal.woff'), weight: 700, style: 'normal' },
  { name: 'Inter', data: font('inter', 'inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Inter', data: font('inter', 'inter-latin-500-normal.woff'), weight: 500, style: 'normal' },
  { name: 'Inter', data: font('inter', 'inter-latin-600-normal.woff'), weight: 600, style: 'normal' },
  { name: 'Inter', data: font('inter', 'inter-latin-700-normal.woff'), weight: 700, style: 'normal' },
];
const icon = `data:image/png;base64,${fs.readFileSync('public/app-icon.png').toString('base64')}`;

// Un mini «JSX» para satori: h('div', { style }, ...hijos). Sin hijos no se pasa la lista
// (satori trata una lista vacía como varios hijos) y con uno solo se pasa el hijo directo.
const h = (type, props = {}, ...children) => {
  const kids = children.flat();
  return { type, props: kids.length === 0 ? props : { ...props, children: kids.length === 1 ? kids[0] : kids } };
};

// Colores de la marca (tema oscuro, el de la portada)
const C = { black: '#000000', green: '#0e9f6e', glow: '#3ddc97', text: '#ffffff', muted: 'rgba(255,255,255,0.74)', chatBg: '#0b141a', head: '#1f2c34', in: '#202c33', out: '#005c4b', chatText: '#e9edef', meta: 'rgba(233,237,239,0.6)' };

const logo = (size) =>
  h('div', { style: { display: 'flex', alignItems: 'center', gap: size * 0.32 } },
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: size * 0.26, background: '#ffffff' } },
      h('img', { src: icon, width: size * 0.8, height: size * 0.8 })),
    h('div', { style: { display: 'flex', fontFamily: 'Jakarta', fontSize: size * 0.72, letterSpacing: -size * 0.03, color: C.text } },
      h('span', { style: { fontWeight: 700 } }, 'tel'),
      h('span', { style: { fontWeight: 800, color: C.green } }, 'money')));

const headline = (size) =>
  h('div', { style: { display: 'flex', flexDirection: 'column', fontFamily: 'Jakarta', fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.045, color: C.text } },
    h('span', {}, 'Tu dinero'),
    h('div', { style: { display: 'flex', marginTop: size * 0.06 } },
      h('span', { style: { background: C.green, color: C.black, padding: `0 ${size * 0.16}px ${size * 0.06}px`, borderRadius: size * 0.12 } }, 'en orden,')),
    // el punto de Plus Jakarta trae mucho aire a la izquierda: se acerca, igual que en la página
    h('div', { style: { display: 'flex', marginTop: size * 0.06 } },
      h('span', {}, 'por WhatsApp'),
      h('span', { style: { marginLeft: -size * 0.05 } }, '.')));

const cta = (scale = 1) =>
  h('div', { style: { display: 'flex', alignItems: 'center', gap: 16 * scale } },
    h('div', { style: { display: 'flex', padding: `${16 * scale}px ${26 * scale}px`, borderRadius: 14 * scale, background: '#ffffff', color: C.black, fontFamily: 'Inter', fontWeight: 700, fontSize: 24 * scale, letterSpacing: 0.3 } }, CTA[0]),
    h('span', { style: { fontFamily: 'Inter', fontWeight: 600, fontSize: 22 * scale, color: C.glow } }, CTA[1]));

const dot = (color) => h('div', { style: { width: 14, height: 14, borderRadius: 7, background: color, marginRight: 8, marginTop: 5 } });
const bubble = (from, children, time) =>
  h('div', { style: { display: 'flex', flexDirection: 'column', alignSelf: from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '90%', padding: '10px 14px 8px', borderRadius: 14, background: from === 'me' ? C.out : C.in, color: C.chatText, fontFamily: 'Inter', fontSize: 21, lineHeight: 1.35 } },
    ...children,
    h('span', { style: { alignSelf: 'flex-end', fontSize: 14, color: from === 'me' ? '#c3d7d2' : C.meta, marginTop: 2 } }, time));

const chat = (w) =>
  h('div', { style: { display: 'flex', flexDirection: 'column', width: w, borderRadius: 34, overflow: 'hidden', background: C.chatBg, border: '6px solid #2b2d30' } },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: C.head } },
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 22, background: '#ffffff' } }, h('img', { src: icon, width: 34, height: 34 })),
      h('div', { style: { display: 'flex', flexDirection: 'column' } },
        h('span', { style: { fontFamily: 'Inter', fontWeight: 700, fontSize: 21, color: C.chatText } }, 'TelMoney'),
        h('span', { style: { fontFamily: 'Inter', fontSize: 15, color: C.meta } }, 'en línea'))),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 16px 22px' } },
      bubble('me', [h('span', {}, '¿cuánto puedo gastar hoy?')], '08:02'),
      bubble('bot', [
        h('div', { style: { display: 'flex', alignItems: 'flex-start' } }, dot(C.glow),
          h('span', { style: { fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' } }, 'Hoy puedes gastar $21.70')),
        h('span', { style: { color: 'rgba(233,237,239,0.85)', fontSize: 18, marginTop: 4 } }, 'por día hasta tu próximo pago, con tus pagos fijos ya descontados.'),
      ], '08:02'),
      bubble('me', [h('span', {}, 'gasté 3.50 en el almuerzo')], '12:41'),
      bubble('bot', [h('div', { style: { display: 'flex', alignItems: 'flex-start' } }, dot(C.glow), h('span', { style: { whiteSpace: 'nowrap' } }, 'Te quedan $18.20 de $21.70'))], '12:41')));

// Brillos de fondo: cada uno ocupa todo el lienzo y ubica el centro del degradado adentro
// (si la caja se sale del lienzo, el degradado se corta con un borde recto al rasterizar).
const glow = (gradient) => h('div', { style: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundImage: gradient } });

// ── 1200×630: texto a la izquierda, chat a la derecha ──
const wide = h('div', { style: { position: 'relative', display: 'flex', width: 1200, height: 630, background: C.black, overflow: 'hidden' } },
  glow('radial-gradient(circle at 84% 4%, rgba(6,95,70,0.85) 0%, rgba(4,35,26,0) 46%)'),
  glow('radial-gradient(circle at 44% 112%, rgba(14,159,110,0.32) 0%, rgba(14,159,110,0) 40%)'),
  // abajo queda aire: X pone el título del link encima de la imagen, en la esquina inferior izquierda
  h('div', { style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 690, height: 630, padding: '48px 0 96px 72px' } },
    logo(46),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 26 } },
      headline(84),
      h('span', { style: { fontFamily: 'Inter', fontWeight: 500, fontSize: 27, lineHeight: 1.4, color: C.muted, maxWidth: 560 } }, 'Cuéntale tus gastos como a un amigo y sabe cuánto puedes gastar hoy.')),
    cta()),
  h('div', { style: { position: 'absolute', right: 64, top: 70, display: 'flex', transform: 'rotate(3deg)' } }, chat(410)),
  h('span', { style: { position: 'absolute', right: 72, bottom: 26, fontFamily: 'Inter', fontWeight: 600, fontSize: 20, color: 'rgba(255,255,255,0.6)' } }, DOMAIN));

// ── 1080×1080: todo centrado, para Instagram y estados ──
const square = h('div', { style: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 1080, height: 1080, background: C.black, overflow: 'hidden', padding: '72px 80px' } },
  glow('radial-gradient(circle at 88% 2%, rgba(6,95,70,0.85) 0%, rgba(4,35,26,0) 50%)'),
  glow('radial-gradient(circle at 6% 104%, rgba(14,159,110,0.32) 0%, rgba(14,159,110,0) 45%)'),
  logo(54),
  h('div', { style: { display: 'flex', width: '100%', marginTop: 58, justifyContent: 'space-between', alignItems: 'center' } },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 28 } }, headline(78)),
    h('div', { style: { display: 'flex', transform: 'rotate(3deg)' } }, chat(372))),
  h('span', { style: { marginTop: 54, fontFamily: 'Inter', fontWeight: 500, fontSize: 32, lineHeight: 1.4, color: C.muted, textAlign: 'center', maxWidth: 760 } }, 'Cuéntale tus gastos como a un amigo y sabe cuánto puedes gastar hoy.'),
  h('div', { style: { display: 'flex', marginTop: 40 } }, cta(1.25)),
  h('span', { style: { marginTop: 'auto', fontFamily: 'Inter', fontWeight: 600, fontSize: 24, color: 'rgba(255,255,255,0.6)' } }, DOMAIN));

const render = async (node, width, height, file) => {
  const svg = await satori(node, { width, height, fonts });
  await sharp(Buffer.from(svg), { density: 72 }).flatten({ background: '#000000' }).jpeg({ quality: 86, progressive: true, mozjpeg: true }).toFile(file);
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(`${file}  ${width}×${height}  ${kb} KB`);
};

fs.mkdirSync('public/og', { recursive: true });
await render(wide, 1200, 630, 'public/og/telmoney-og.jpg');
await render(square, 1080, 1080, 'public/og/telmoney-cuadrado.jpg');
