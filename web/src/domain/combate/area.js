// Áreas de efecto: lee la forma y el tamaño del texto de un conjuro y calcula las casillas que cubre.
const num = s => parseFloat(String(s).replace(',', '.'));
const ft = s => Math.round(num(s) * 0.3 * 10) / 10;
export const CASILLA = 1.5;

export function leerArea(texto = '', alcance = '') {
  const t = `${alcance} ${texto}`;
  let m;
  const X = '(?:\\s+de\\s+[a-záéíóúñ]+){0,2}';
  const re = (a, b = '') => new RegExp(a + X + b, 'i');
  if ((m = re('cilindro', ' de (\\d+(?:,\\d+)?) m de radio y (\\d+(?:,\\d+)?) m de alt').exec(t))) return { forma: 'cilindro', r: num(m[1]), alto: num(m[2]) };
  if ((m = /(\d+)-foot-radius, (\d+)-foot-high Cylinder|Cylinder (\d+) feet in radius and (\d+) feet high/i.exec(t))) return { forma: 'cilindro', r: ft(m[1] || m[3]), alto: ft(m[2] || m[4]) };
  if ((m = re('esfera', ' de (\\d+(?:,\\d+)?) m de radio').exec(t))) return { forma: 'esfera', r: num(m[1]) };
  if ((m = /(\d+)-foot-radius Sphere/i.exec(t))) return { forma: 'esfera', r: ft(m[1]) };
  if ((m = re('emanación', ' de (\\d+(?:,\\d+)?) m').exec(t))) return { forma: 'emanacion', r: num(m[1]) };
  if ((m = /(\d+)-foot Emanation/i.exec(t))) return { forma: 'emanacion', r: ft(m[1]) };
  if ((m = re('cono', ' de (\\d+(?:,\\d+)?) m').exec(t))) return { forma: 'cono', largo: num(m[1]) };
  if ((m = /(\d+)-foot Cone/i.exec(t))) return { forma: 'cono', largo: ft(m[1]) };
  if ((m = /línea de (\d+(?:,\d+)?) m de (?:largo|longitud) y (\d+(?:,\d+)?) m de ancho/i.exec(t))) return { forma: 'linea', largo: num(m[1]), ancho: num(m[2]) };
  if ((m = /(\d+)-foot-long, (\d+)-foot-wide Line/i.exec(t))) return { forma: 'linea', largo: ft(m[1]), ancho: ft(m[2]) };
  if ((m = re('cubo', ' de (\\d+(?:,\\d+)?) m').exec(t))) return { forma: 'cubo', lado: num(m[1]) };
  if ((m = /en un radio de (\d+(?:,\d+)?) m/i.exec(t))) return { forma: 'esfera', r: num(m[1]) };
  if ((m = /(\d+)-foot Cube/i.exec(t))) return { forma: 'cubo', lado: ft(m[1]) };
  return null;
}
export function alcanceMetros(a = '') {
  const m = /(\d+(?:,\d+)?)\s*(km|m)\b/i.exec(a); if (!m) return null;
  return num(m[1]) * (m[2].toLowerCase() === 'km' ? 1000 : 1);
}
export const casillas = metros => Math.round(metros / CASILLA * 10) / 10;
export function describir(a) {
  const c = x => `${String(x).replace('.', ',')} m (${casillas(x)} casillas)`;
  switch (a.forma) {
    case 'esfera': return `Esfera de ${c(a.r)} de radio`;
    case 'cilindro': return `Cilindro de ${c(a.r)} de radio y ${String(a.alto).replace('.', ',')} m de alto`;
    case 'emanacion': return `Emanación de ${c(a.r)} desde la criatura`;
    case 'cono': return `Cono de ${c(a.largo)} de largo`;
    case 'linea': return `Línea de ${c(a.largo)} de largo y ${String(a.ancho).replace('.', ',')} m de ancho`;
    case 'cubo': return `Cubo de ${c(a.lado)} de lado`;
    default: return '';
  }
}
export function celdasArea(a, dir = 0) {
  const R = x => x / CASILLA, out = [];
  const rad = dir * Math.PI / 180, ux = Math.cos(rad), uy = Math.sin(rad);
  const borde = [0.5 + ux * 0.5, 0.5 + uy * 0.5];
  let min = [-1, -1], max = [2, 2], dentro;
  switch (a.forma) {
    case 'esfera': case 'cilindro': {
      const r = R(a.r), c = [0.5 + ux * (r + 0.5), 0.5 + uy * (r + 0.5)];
      const o = [Math.round(c[0]), Math.round(c[1])];
      dentro = (x, y) => Math.hypot(x - o[0], y - o[1]) <= r + 1e-6; min = [o[0] - r - 1, o[1] - r - 1]; max = [o[0] + r + 1, o[1] + r + 1];
      return fin(o, r);
    }
    case 'emanacion': {
      const r = R(a.r);
      dentro = (x, y) => { const dx = Math.max(0 - x, 0, x - 1), dy = Math.max(0 - y, 0, y - 1); return Math.hypot(dx, dy) <= r + 1e-6; };
      min = [-r - 1, -r - 1]; max = [r + 2, r + 2]; return fin([0.5, 0.5], r);
    }
    case 'cono': {
      const L = R(a.largo), tan = 0.5;
      dentro = (x, y) => { const px = x - borde[0], py = y - borde[1], d = px * ux + py * uy, p = Math.abs(-px * uy + py * ux); return d > 0 && d <= L + 1e-6 && p <= d * tan + 1e-6; };
      min = [borde[0] - L - 1, borde[1] - L - 1]; max = [borde[0] + L + 1, borde[1] + L + 1]; return fin(borde, L);
    }
    case 'linea': {
      const L = R(a.largo), w = R(a.ancho) / 2;
      dentro = (x, y) => { const px = x - borde[0], py = y - borde[1], d = px * ux + py * uy, p = Math.abs(-px * uy + py * ux); return d > 0 && d <= L + 1e-6 && p <= w + 1e-6; };
      min = [borde[0] - L - 1, borde[1] - L - 1]; max = [borde[0] + L + 1, borde[1] + L + 1]; return fin(borde, L);
    }
    case 'cubo': {
      const L = R(a.lado), c = [borde[0] + ux * L / 2, borde[1] + uy * L / 2];
      if (dir % 90 === 0) { const al = v => (Math.round(L) % 2 ? Math.floor(v) + 0.5 : Math.round(v)); c[0] = al(c[0]); c[1] = al(c[1]); }
      dentro = (x, y) => { const px = x - c[0], py = y - c[1], d = Math.abs(px * ux + py * uy), p = Math.abs(-px * uy + py * ux); return d <= L / 2 + 1e-6 && p <= L / 2 + 1e-6; };
      min = [c[0] - L, c[1] - L]; max = [c[0] + L, c[1] + L]; return fin(c, L);
    }
    default: return null;
  }
  function cubierta(x, y) { let n = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (dentro(x + (i + 0.5) / 6, y + (j + 0.5) / 6)) n++; return n / 36; }
  function fin(origen, alcance) {
    for (let x = Math.floor(min[0]) - 1; x <= Math.ceil(max[0]) + 1; x++) for (let y = Math.floor(min[1]) - 1; y <= Math.ceil(max[1]) + 1; y++)
      if (cubierta(x, y) >= 0.5 && !(a.forma === 'emanacion' && x === 0 && y === 0)) out.push([x, y]);
    return { celdas: out, origen, radio: alcance, dentro };
  }
}
