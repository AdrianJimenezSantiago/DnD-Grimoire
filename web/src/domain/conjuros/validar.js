import { norm } from '../../core/util.js';
import { SCHOOLS } from '../reglas/reglas2024.js';

const CERO = /^(0+([.,]0+)?\s*(m|metros?|pies|ft|km)?|nada|ninguno|ninguna|no|-+|—|–)$/i;
const limpio = v => String(v ?? '').replace(/\s*[|*]+\s*/g, ' ').replace(/\s+/g, ' ').trim();

export function escuelaOficial(v) {
  const k = norm(v).replace(/[^a-z]/g, '').slice(0, 3); if (!k) return '';
  return SCHOOLS.find(s => norm(s).startsWith(k)) || '';
}

export function usoGratis(v) {
  const t = limpio(v);
  if (!t || CERO.test(t) || /^0+\s*\//.test(t)) return '';
  return t;
}

export function alcance(v) {
  let t = limpio(v).replace(/(\d)\s*m\b\s*\d+$/, '$1 m');
  if (!t || CERO.test(t)) return 'Toque';
  if (/^limitado$/i.test(t)) return 'Ilimitado';
  if (/^(propio|self|personal)$/i.test(t)) return 'Lanzador';
  if (/^toque$/i.test(t)) return 'Toque';
  if (/^\d+([.,]\d+)?$/.test(t)) return `${t.replace('.', ',')} m`;
  return t.replace(/(\d)m\b/, '$1 m');
}

export function duracion(v) {
  const t = limpio(v);
  if (!t || CERO.test(t) || /^instant/i.test(t)) return 'Instantáneo';
  return t;
}

export function tiempo(v) {
  const t = limpio(v);
  return !t || CERO.test(t) ? 'Acción' : t;
}

export function componentes(v) {
  const t = String(v ?? '').toUpperCase(), out = ['V', 'S', 'M'].filter(c => new RegExp(`(^|[^A-Z])${c}([^A-Z]|$)`).test(t));
  return out.length ? out.join(' ') : null;
}

export function material(v) {
  const t = limpio(v);
  return !t || CERO.test(t) || /^0+\s*(po|pp|pc|pe|pl)$/i.test(t) ? '' : t;
}

export function campo(k, v) {
  switch (k) {
    case 'escuela': { const e = escuelaOficial(v); return { valor: e || null, aviso: e ? '' : 'Elige una de las ocho escuelas de magia.' }; }
    case 'gratis': return { valor: usoGratis(v), aviso: usoGratis(v) || !limpio(v) ? '' : 'Un 0 no es un uso gratis: se deja sin uso gratis.' };
    case 'alcance': { const a = alcance(v); return { valor: a, aviso: a === 'Toque' && !/^toque$/i.test(limpio(v)) ? 'El alcance mínimo es «Toque».' : '' }; }
    case 'duracion': { const d = duracion(v); return { valor: d, aviso: d === 'Instantáneo' && !/^instant/i.test(limpio(v)) ? 'Sin duración: se deja como «Instantáneo».' : '' }; }
    case 'tiempo': { const t = tiempo(v); return { valor: t, aviso: t === 'Acción' && limpio(v) !== 'Acción' && (!limpio(v) || CERO.test(limpio(v))) ? 'Sin tiempo de lanzamiento: se deja como «Acción».' : '' }; }
    case 'comp': { const c = componentes(v); return { valor: c, aviso: c ? '' : 'Todo conjuro tiene al menos un componente: V, S o M.' }; }
    case 'coste': return { valor: material(v), aviso: '' };
    case 'es': { const t = limpio(v); return { valor: t || null, aviso: t ? '' : 'El conjuro necesita un nombre.' }; }
    default: return { valor: limpio(v), aviso: '' };
  }
}

export function limpiarConjuro(s) {
  if (s.escuela != null) s.escuela = escuelaOficial(s.escuela) || s.escuela;
  if (s.alcance != null && s.alcance !== '') s.alcance = alcance(s.alcance);
  if (s.duracion != null && s.duracion !== '') s.duracion = duracion(s.duracion);
  if (s.comp) s.comp = componentes(s.comp) || s.comp;
  if (s.coste) s.coste = material(s.coste);
  return s;
}
