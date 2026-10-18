// Genera todos los íconos del sitio a partir del logo oficial: public/logo-mark.svg
// (la "t" con la burbuja que sonríe, en blanco y en vector). Uso: npm run icons
//
// - public/app-icon.png         el símbolo blanco, cuadrado y transparente (para las imágenes de redes)
// - public/favicon-32.png       pestaña del navegador
// - public/favicon-192.png      Android / accesos directos
// - public/favicon-512.png      logo para Google (datos estructurados) y el manifiesto
// - public/apple-touch-icon.png iPhone (iOS redondea las esquinas solo y no admite transparencia)
// - public/maskable-512.png     Android: ícono que el sistema recorta con su propia forma
// - public/favicon.svg          favicon en vector (pestañas nítidas en cualquier pantalla)
// - public/favicon.ico          16, 32 y 48 px: lo que piden por defecto navegadores viejos y buscadores
//
// Los íconos son el símbolo blanco sobre una baldosa verde (Verde Quincena), igual que en el sitio.
import fs from 'node:fs';
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

// Favicon en vector: la misma baldosa verde con el símbolo blanco.
const svg = fs.readFileSync(SRC, 'utf8');
const [vx, vy, vw] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
const pad = vw * 0.14;
const side = vw + pad * 2;
const path = svg.match(/<path[^>]+\/>/)[0];
fs.writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx - pad} ${vy - pad} ${side} ${side}"><rect x="${vx - pad}" y="${vy - pad}" width="${side}" height="${side}" rx="${side * 0.22}" fill="${GREEN}"/>${path}</svg>\n`,
);

// favicon.ico con PNG adentro (el formato lo permite desde Windows Vista; todos los navegadores lo leen).
const sizes = [16, 32, 48];
const pngs = [];
for (const size of sizes) {
  const file = `/tmp/telmoney-ico-${size}.png`;
  await tile(size, { radius: 0.22, inset: 0.12, file });
  pngs.push(fs.readFileSync(file));
  fs.unlinkSync(file);
}
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, ...pngs]));

console.log('Íconos generados desde', SRC);
