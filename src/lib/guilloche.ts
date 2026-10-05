// Rosetón de grabado (guilloché), como el de los billetes de dólar:
// hipotrocoides superpuestos de trazo fino. Se genera una vez como /guilloche.svg.
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

function hypotrochoid(cx: number, R: number, r: number, d: number) {
  const k = (R - r) / r;
  const turns = r / gcd(R, r);
  const steps = Math.ceil(k * turns * 22);
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = cx + (R - r) * Math.sin(t) - d * Math.sin(k * t);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

export function guillocheSvg(size = 900) {
  const c = size / 2;
  const layers = [
    { R: 410, r: 5, d: 34 },
    { R: 390, r: 6, d: 30 },
    { R: 330, r: 5, d: 26 },
    { R: 260, r: 4, d: 22 },
    { R: 180, r: 3, d: 18 },
  ];
  const paths = layers
    .map((l, i) => `<path d="${hypotrochoid(c, l.R, l.r, l.d)}" opacity="${i % 2 ? 0.7 : 1}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><g fill="none" stroke="#000" stroke-width="0.7">${paths}</g></svg>`;
}
