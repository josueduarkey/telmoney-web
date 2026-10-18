// Genera todos los íconos del sitio a partir del logo oficial: public/logo-mark.svg
// (la "t" con la burbuja que sonríe, en blanco y en vector). Uso: npm run icons
//
// - public/app-icon.png         el símbolo blanco, cuadrado y transparente (para las imágenes de redes)
// - public/favicon-32.png       pestaña del navegador
// - public/favicon-192.png      Android / accesos directos
// - public/favicon-512.png      logo para Google (datos estructurados) y el manifiesto
// - public/apple-touch-icon.png iPhone (iOS redondea las esquinas solo y no admite transparencia)
// - public/maskable-512.png     Android: ícono que el sistema recorta con su propia forma
//
// Los íconos son el símbolo blanco sobre una baldosa verde (Verde Quincena), igual que en el sitio.
import sharp from 'sharp';

const SRC = 'public/logo-mark.svg';
const GREEN = '#0e9f6e';

const mark = (size) => sharp(SRC, { density: 72 }).resize(size, size).png().toBuffer();

await sharp(await mark(288)).png({ compressionLevel: 9 }).toFile('public/app-icon.png');

const tile = async (size, { radius, inset, file }) => {
  const r = Math.round(size * radius);
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${GREEN}"/></svg>`,
  );
  const inner = Math.round(size * (1 - inset * 2));
  await sharp(bg)
    .composite([{ input: await mark(inner), top: Math.round(size * inset), left: Math.round(size * inset) }])
    .png({ compressionLevel: 9 })
    .toFile(file);
};

await tile(32, { radius: 0.22, inset: 0.12, file: 'public/favicon-32.png' });
await tile(192, { radius: 0.22, inset: 0.18, file: 'public/favicon-192.png' });
await tile(512, { radius: 0.22, inset: 0.18, file: 'public/favicon-512.png' });
await tile(180, { radius: 0, inset: 0.2, file: 'public/apple-touch-icon.png' });
// "maskable": Android lo recorta en círculo o gota; el dibujo queda dentro de la zona segura (80 %)
await tile(512, { radius: 0, inset: 0.24, file: 'public/maskable-512.png' });

console.log('Íconos generados desde', SRC);
