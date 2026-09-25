import { joinY, norm } from '../core/util.js';
import { reglas } from './rasgos.js';
import { conjurosAutomaticos, rasgosEnNivel } from './clases2024.js';
import { clasesDe, vistaClase } from './reglas2024.js';
import { importSrd } from './catalogo.js';

export const ASI_LVLS = { _: [4, 8, 12, 16], 'Guerrero': [4, 6, 8, 12, 14, 16], 'Pícaro': [4, 8, 10, 12, 16] };
const SAVANT = [[/abjur/i, 'Abjuración'], [/adivin|divin/i, 'Adivinación'], [/evoca/i, 'Evocación'], [/ilusi|illus/i, 'Ilusionismo']];
export const esMejora = (clase, L) => (ASI_LVLS[clase] || ASI_LVLS._).includes(L);
export function savantSchool(ch) {
  if (ch.clase !== 'Mago') return '';
  const m = SAVANT.find(([re]) => re.test(ch.subclase || ''));
  return m ? m[1] : '';
}
export function featuresAt(ch, draft, to) {
  return rasgosEnNivel({ ...ch, subclase: draft.subclase ?? ch.subclase }, to).map(r => (/^Subclase de /.test(r) ? 'Subclase' : r));
}

export function levelDiff(a, b, chA, chB) {
  const bits = [];
  const d = (x, uno, varios) => `${Math.abs(x)} ${Math.abs(x) === 1 ? uno : varios} ${x > 0 ? 'más' : 'menos'}`;
  if (b.maxPrep !== a.maxPrep) bits.push('prepara ' + d(b.maxPrep - a.maxPrep, 'conjuro', 'conjuros'));
  if (b.maxCant !== a.maxCant) bits.push(d(b.maxCant - a.maxCant, 'truco', 'trucos'));
  const nuevos = Object.keys(b.slots).map(Number).filter(L => !a.slots[L]);
  if (nuevos.length) bits.push(`espacios de nivel ${nuevos.join(', ')}`);
  const mas = Object.keys(b.slots).map(Number).filter(L => a.slots[L] && b.slots[L] > a.slots[L]);
  if (mas.length) bits.push(`un espacio más de nivel ${mas.join(', ')}`);
  if (chA && chB) {
    const byId = Object.fromEntries(reglas(chA).map(r => [r.id, r]));
    reglas(chB).forEach(r => {
      const o = byId[r.id];
      if (!o) bits.push(r.nombre);
      else if (r.max > o.max && r.tipo !== 'al_lanzar') bits.push(r.tipo === 'dados' ? `un dado más de ${r.nombre}` : `${r.nombre} sube a ${r.max}`);
    });
  }
  if (!bits.length) return '';
  return (b.lvl > a.lvl ? 'Al subir de nivel gana: ' : 'Con este cambio: ') + joinY(bits) + '.';
}

export function conjurosPendientes(db, ch, compendio) {
  const porNombre = new Map(); for (const x of compendio || []) if (!porNombre.has(norm(x.es))) porNombre.set(norm(x.es), x);
  const tiene = new Set(ch.book.map(e => norm(db.catalog[e.sid]?.es)));
  return clasesDe(ch).flatMap(c => conjurosAutomaticos(vistaClase(ch, c))).filter(c => !tiene.has(norm(c.nombre))).map(c => ({ ...c, x: porNombre.get(norm(c.nombre)) })).filter(c => c.x);
}
export function anadirPendientes(db, ch, pendientes) {
  for (const c of pendientes) {
    const sid = importSrd(db, c.x);
    if (!ch.book.some(e => e.sid === sid)) ch.book.push({ sid, prep: true, always: true, fuente: c.fuente + (c.ritual ? ' (solo ritual)' : ''), gratis: c.gratis || '', used: false });
  }
  return pendientes.map(c => c.x.es);
}
