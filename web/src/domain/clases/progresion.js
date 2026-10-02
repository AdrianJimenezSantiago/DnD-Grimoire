import { joinY, norm } from '../../core/util.js';
import { reglas } from './rasgos.js';
import { conjurosAutomaticos, rasgosEnNivel } from './clases2024.js';
import { clasesDe, vistaClase, nivelTotal } from '../reglas/reglas2024.js';
import { conjurosEspecie } from '../origen/especies.js';
import { importSrd } from '../conjuros/catalogo.js';

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
  // Ya lo tiene si está como «siempre preparado»; si lo tenía preparado a mano, pasa a siempre preparado y deja libre su hueco
  const tiene = new Set(ch.book.filter(e => e.always).map(e => norm(db.catalog[e.sid]?.es)));
  return [...clasesDe(ch).flatMap(c => conjurosAutomaticos(vistaClase(ch, c))), ...conjurosEspecie(ch, nivelTotal(ch))].filter(c => !tiene.has(norm(c.nombre))).map(c => ({ ...c, x: porNombre.get(norm(c.nombre)) })).filter(c => c.x);
}
// Conjuros «siempre preparados» de un rasgo que ya no toca (otro terreno del Círculo de la tierra, otra subclase…): dejan de estarlo
export function sobrantesAutomaticos(db, ch) {
  const auto = [...clasesDe(ch).flatMap(c => conjurosAutomaticos(vistaClase(ch, c))), ...conjurosEspecie(ch, nivelTotal(ch))];
  const nombres = new Set(auto.map(c => norm(c.nombre))), fuentes = new Set(auto.map(c => norm(c.fuente)));
  for (const f of ['Conjuros del círculo de la tierra', 'Vástago de los Tres', 'Linaje élfico', 'Linaje gnomo', 'Legado infernal']) fuentes.add(norm(f));
  return ch.book.filter(e => e.always && fuentes.has(norm(String(e.fuente || '').replace(/\s*\(solo ritual\)$/, ''))) && !nombres.has(norm(db.catalog[e.sid]?.es)));
}
export function quitarSobrantes(db, ch) {
  const fuera = sobrantesAutomaticos(db, ch);
  for (const e of fuera) Object.assign(e, { always: false, prep: false, fuente: '' });
  return fuera.map(e => db.catalog[e.sid]?.es).filter(Boolean);
}
export function anadirPendientes(db, ch, pendientes) {
  for (const c of pendientes) {
    const sid = importSrd(db, c.x);
    const fuente = c.fuente + (c.ritual ? ' (solo ritual)' : ''), ya = ch.book.find(e => e.sid === sid || norm(db.catalog[e.sid]?.es) === norm(c.x.es));
    if (ya) Object.assign(ya, { prep: true, always: true, fuente, gratis: ya.gratis || c.gratis || '' });
    else ch.book.push({ sid, prep: true, always: true, fuente, gratis: c.gratis || '', used: false });
  }
  return pendientes.map(c => c.x.es);
}
