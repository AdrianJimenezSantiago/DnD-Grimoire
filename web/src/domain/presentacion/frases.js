// Narración del resultado de una tirada: una frase propia de cada tipo de tirada (cada habilidad, cada
// característica, iniciativa, ataque, salvación contra la muerte, concentración, cada tipo de daño y la curación)
// y del tramo en que cae el resultado. Los textos están en frases/; aquí se decide cuál toca.
import { FRASES_HABILIDAD } from './frases/habilidades.js';
import { FRASES_PRUEBA, FRASES_SALVACION } from './frases/caracteristicas.js';
import { FRASES_COMBATE } from './frases/combate.js';
import { FRASES_DANO } from './frases/dano.js';
import { probMenor, maxDist } from '../reglas/dados.js';

// De peor a mejor: 1 natural (o el daño mínimo), malo, normal, bueno y 20 natural (o el daño máximo)
export const TRAMOS = ['muyMal', 'mal', 'normal', 'bien', 'muyBien'];

const pref = (o, p) => Object.fromEntries(Object.entries(o).map(([k, v]) => [p + k, v]));
export const FRASES = {
  ...pref(FRASES_HABILIDAD, 'hab:'), ...pref(FRASES_PRUEBA, 'prueba:'), ...pref(FRASES_SALVACION, 'salvacion:'),
  ...FRASES_COMBATE, ...pref(FRASES_DANO, 'dano:'),
};

// Qué juego de frases corresponde a una tirada. Devuelve '' si no hay frases para ella (una tirada libre, por ejemplo).
export function categoriaTirada({ tipo, hab = '', ab = '', motivo = '', clave = '', cura = false, conjuro = false } = {}) {
  let k = '';
  if (tipo === 'iniciativa' || tipo === 'muerte') k = tipo;
  else if (tipo === 'ataque') k = conjuro ? 'ataqueConjuro' : 'ataque';
  else if (tipo === 'salvacion') k = motivo === 'concentracion' ? 'concentracion' : ab ? `salvacion:${ab}` : '';
  else if (tipo === 'prueba') k = hab ? `hab:${hab}` : ab ? `prueba:${ab}` : '';
  else if (tipo === 'dano') k = cura ? 'dano:curacion' : clave ? `dano:${clave}` : '';
  return FRASES[k] ? k : '';
}

// Tramo de una tirada de d20. Con CD, cuenta si se supera y por cuánto; sin ella, la dificultad habitual
// (10 fácil, 15 media). Los ataques sin CA conocida usan una CA típica (12 y 18).
export function tramoD20({ nat = null, total, cd = null, tipo = '' }) {
  if (nat === 1) return 'muyMal';
  if (nat === 20) return 'muyBien';
  if (cd != null) return total < cd ? 'mal' : total - cd >= 5 ? 'bien' : 'normal';
  const [bajo, alto] = tipo === 'ataque' ? [12, 18] : [10, 15];
  return total < bajo ? 'mal' : total < alto ? 'normal' : 'bien';
}

// Tramo de una tirada de daño o curación según dónde cae dentro de lo posible: el mínimo y el máximo son los
// extremos; el resto se reparte por el percentil (el tercio bajo, el central y el alto).
export function tramoDano(total, dist) {
  if (!dist || !dist.p?.length) return 'normal';
  const min = dist.min, max = maxDist(dist);
  if (max <= min) return 'normal';
  if (total <= min) return 'muyMal';
  if (total >= max) return 'muyBien';
  const q = probMenor(dist, total) + (dist.p[total - min] || 0) / 2;
  return q < 0.3 ? 'mal' : q > 0.7 ? 'bien' : 'normal';
}

// Una frase al azar del tramo, distinta de la anterior si se puede
export function elegirFrase(cat, tramo, { rng = Math.random, evitar = '' } = {}) {
  const xs = FRASES[cat]?.[tramo];
  if (!xs?.length) return '';
  const pool = xs.length > 1 ? xs.filter(f => f !== evitar) : xs;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}
