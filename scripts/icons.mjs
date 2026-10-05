// Genera todos los íconos del sitio a partir del logo oficial: public/favicon.png
// (fondo transparente). Uso: npm run icons
//
// - public/app-icon.png         el dibujo recortado y cuadrado (transparente) para el logo del sitio
// - public/favicon-32.png       pestaña del navegador
// - public/favicon-192.png      Android / accesos directos
// - public/favicon-512.png      logo para Google (datos estructurados) y el manifiesto
// - public/apple-touch-icon.png iPhone (iOS redondea las esquinas solo y no admite transparencia)
// - public/maskable-512.png     Android: ícono que el sistema recorta con su propia forma
//
// El pájaro tiene partes casi negras: en los íconos va sobre una baldosa blanca para verse
// igual en pestañas claras y oscuras.
import sharp from 'sharp';

const SRC = 'public/favicon.png';

// 1) recortar el aire transparente y dejarlo cuadrado y centrado
const trimmed = await sharp(SRC).trim({ threshold: 40 }).toBuffer();
const { width, height } = await sharp(trimmed).metadata();
const side = Math.round(Math.max(width, height) * 1.04);
const mark = await sharp(trimmed)
  .extend({
    top: Math.floor((side - height) / 2),
    bottom: Math.ceil((side - height) / 2),
    left: Math.floor((side - width) / 2),
    right: Math.ceil((side - width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(mark).resize(288, 288).png({ compressionLevel: 9 }).toFile('public/app-icon.png');

// 2) íconos con baldosa blanca
const tile = async (size, { radius, inset, file }) => {
  const r = Math.round(size * radius);
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#ffffff"/></svg>`,
  );
  const inner = Math.round(size * (1 - inset * 2));
  const art = await sharp(mark).resize(inner, inner).png().toBuffer();
  await sharp(bg)
    .composite([{ input: art, top: Math.round(size * inset), left: Math.round(size * inset) }])
    .png({ compressionLevel: 9 })
    .toFile(file);
};

await tile(32, { radius: 0.22, inset: 0.08, file: 'public/favicon-32.png' });
await tile(192, { radius: 0.22, inset: 0.12, file: 'public/favicon-192.png' });
await tile(512, { radius: 0.22, inset: 0.12, file: 'public/favicon-512.png' });
await tile(180, { radius: 0, inset: 0.14, file: 'public/apple-touch-icon.png' });
// «maskable»: Android lo recorta en círculo o gota; el dibujo queda dentro de la zona segura (80 %)
await tile(512, { radius: 0, inset: 0.2, file: 'public/maskable-512.png' });

console.log('Íconos generados desde', SRC);
