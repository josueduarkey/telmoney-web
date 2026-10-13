// Normaliza los logos de bancos y billeteras de la sección «Conoce tus bancos».
// Uso: npm run bancos
//
// Lee los originales de src/assets/bancos/originales/ (como vengan: color, blanco, con aire)
// y escribe src/assets/bancos/<slug>.png:
// - una sola tinta: negro con transparencia, para usarlo como máscara y pintarlo con el color
//   del texto (así se ve igual en tema claro y oscuro, como pide DESIGN.md para tiras de logos)
// - sin aire transparente alrededor
// - todos del mismo alto; el tamaño final por proporción lo decide MadeInSV.astro
//
// Los originales no se guardan (pesan y no van al sitio; la carpeta está en .gitignore).
// Para agregar o cambiar uno: copia el original a originales/, súmalo a LOGOS y a la lista del
// componente, corre el script y borra el original. Los que no tengan original se dejan como están.
import fs from 'node:fs';
import sharp from 'sharp';

const SRC = 'src/assets/bancos/originales';
const OUT = 'src/assets/bancos';
const HEIGHT = 160; // px; el más alto se muestra a ~60px, así queda nítido en pantallas 2x

const LOGOS = [
  { slug: 'agricola', file: 'agricola.webp' },
  { slug: 'bac', file: 'bac.png' },
  { slug: 'cuscatlan', file: 'cuscatlan.png' },
  // la casita es de colores: si todo es tinta queda una mancha; así se cala la puerta amarilla
  { slug: 'davivienda', file: 'davivienda.png', lightCut: 0.8 },
  { slug: 'promerica', file: 'promerica.png' },
  { slug: 'hipotecario', file: 'hipotecario.png' },
  { slug: 'n1co', file: 'n1co.svg' },
  { slug: 'multimoney', file: 'multimoney.svg' },
  // sin el lema de abajo: a ese tamaño es ilegible
  { slug: 'azul', file: 'azul.png', keepTop: 0.8 },
  // la F es verde oscuro sobre un cuadro verde claro: solo lo oscuro es tinta, o la F se pierde
  { slug: 'fedecredito', file: 'fedecredito.png', lightCut: 0.6 },
];

// Cuánta tinta lleva cada píxel (0–1): todo lo visible, salvo que `lightCut` diga desde qué
// luminosidad (0–1) un color cuenta como hueco y no como tinta.
function inkOf(r, g, b, a, lightCut) {
  const alpha = a / 255;
  if (lightCut === undefined) return alpha;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return alpha * Math.min(1, Math.max(0, (lightCut - lum) / 0.1));
}

// Densidad para rasterizar un SVG lo bastante grande para recortarlo nítido, sin pasarse del
// límite de píxeles (los SVG medidos en «pt» crecen mucho más rápido que los medidos en px).
async function densityFor(path) {
  let density = 72;
  if (!path.endsWith('.svg')) return density;
  while ((await sharp(path, { density }).metadata()).height < HEIGHT * 4) density *= 1.5;
  return density;
}

for (const { slug, file, lightCut, keepTop } of LOGOS) {
  const path = `${SRC}/${file}`;
  if (!fs.existsSync(path)) {
    console.log(`${slug.padEnd(12)} sin original, se deja como está`);
    continue;
  }
  const { data, info } = await sharp(path, { density: await densityFor(path) })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mono = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    mono[i + 3] = Math.round(255 * inkOf(data[i], data[i + 1], data[i + 2], data[i + 3], lightCut));
  }

  const trim = { background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 };
  const raw = { raw: { width: info.width, height: info.height, channels: 4 } };
  let img = await sharp(mono, raw).trim(trim).png().toBuffer();
  if (keepTop) {
    const { width, height } = await sharp(img).metadata();
    img = await sharp(img)
      .extract({ left: 0, top: 0, width, height: Math.round(height * keepTop) })
      .trim(trim)
      .png()
      .toBuffer();
  }

  await sharp(img)
    .resize({ height: HEIGHT })
    .png({ compressionLevel: 9, palette: true })
    .toFile(`${OUT}/${slug}.png`);

  const { width, height } = await sharp(`${OUT}/${slug}.png`).metadata();
  const kb = (fs.statSync(`${OUT}/${slug}.png`).size / 1024).toFixed(1);
  console.log(`${slug.padEnd(12)} ${width}×${height}  ${kb} KB`);
}
