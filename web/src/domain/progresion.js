/** Subida de nivel: qué se gana y qué hay que elegir. Módulo puro. */
import { joinY } from '../core/util.js';
import { CLASES } from './reglas2024.js';
import { reglas } from './rasgos.js';

export const ASI_LVLS = { _: [4, 8, 12, 16], 'Guerrero': [4, 6, 8, 12, 14, 16], 'Pícaro': [4, 8, 10, 12, 16] };
const SAVANT = [[/abjur/i, 'Abjuración'], [/adivin|divin/i, 'Adivinación'], [/evoca/i, 'Evocación'], [/ilusi|illus/i, 'Ilusionismo']];
const RASGOS_CLASE = {
  'Mago': { 1: ['Lanzamiento de conjuros', 'Adepto de los rituales', 'Recuperación arcana'], 2: ['Erudito'], 5: ['Memorizar conjuro'], 18: ['Maestría con conjuros'], 20: ['Conjuros distintivos'] },
  'Mago/Adivinación': { 3: ['Experto en adivinación', 'Presagio'], 6: ['Adivino avezado'], 10: ['El tercer ojo'], 14: ['Gran presagio'] },
};

export const esMejora = (clase, L) => (ASI_LVLS[clase] || ASI_LVLS._).includes(L);
export function savantSchool(ch) {
  if (ch.clase !== 'Mago') return '';
  const m = SAVANT.find(([re]) => re.test(ch.subclase || ''));
  return m ? m[1] : '';
}
export function featuresAt(ch, draft, to) {
  const f = [...((RASGOS_CLASE[ch.clase] || {})[to] || [])];
  const sch = savantSchool(draft); if (sch) f.push(...(((RASGOS_CLASE['Mago/' + sch] || {})[to]) || []));
  if (to === 3 && (CLASES[ch.clase] || {}).subs) f.push('Subclase');
  if (esMejora(ch.clase, to)) f.push('Mejora de característica o dote');
  if (to === 19) f.push('Don épico');
  return [...new Set(f)];
}

/** Diferencias entre dos perfiles (y sus rasgos) en una frase. */
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
