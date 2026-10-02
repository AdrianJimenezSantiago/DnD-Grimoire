const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function luminancia(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return 0.2126 * lin(f(0)) + 0.7152 * lin(f(8)) + 0.0722 * lin(f(4));
}
export const contraste = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

function lPara(h, s, objetivo, min, max) {
  let lo = min, hi = max;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (luminancia(h, s, m) < objetivo) lo = m; else hi = m; }
  return Math.round(((lo + hi) / 2) * 10) / 10;
}

const TINTE = [[15, 0.42], [35, 0.52], [70, 0.7], [165, 0.62], [200, 0.66], [255, 0.6], [292, 0.5], [345, 0.44], [360, 0.42]];
export const tinteDe = h => { h = ((h % 360) + 360) % 360; return TINTE.find(([hasta]) => h < hasta)[1]; };

const OBJ = { noche: [0.40, 0.58], dia: [0.085, 0.12] };
const SAT_MAX = 72;

export function paleta({ h, s }, neutro = false) {
  const sg = Math.min(s, SAT_MAX);
  return {
    '--acc-k': neutro ? '0.15' : String(tinteDe(h)),
    '--acc-sg': sg + '%',
    '--gl-d': lPara(h, sg, OBJ.noche[0], 56, 82) + '%', '--gl2-d': lPara(h, sg, OBJ.noche[1], 66, 90) + '%',
    '--gl-l': lPara(h, sg, OBJ.dia[0], 20, 42) + '%', '--gl2-l': lPara(h, sg, OBJ.dia[1], 28, 52) + '%',
  };
}
export const estiloPaleta = (t, neutro = false) => Object.entries({ '--acc-h': t.h, '--acc-s': t.s + '%', ...paleta(t, neutro) }).map(([k, v]) => `${k}:${v}`).join(';');
