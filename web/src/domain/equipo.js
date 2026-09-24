/**
 * Objetos mágicos del personaje: los que lleva, cuáles tiene sintonizados (máximo 3) y sus cargas.
 * Las cargas se llevan como un rasgo propio (recurso con recarga), así se gastan y recuperan desde la hoja como el resto. Puro.
 */
import { uid } from '../core/util.js';

export const MAX_SINTONIA = 3;
export const equipoDe = ch => (ch.equipo ||= { objetos: [] });
export const sintonizados = ch => equipoDe(ch).objetos.filter(o => o.sintonizado);
export const tieneObjeto = (ch, clave) => equipoDe(ch).objetos.some(o => o.clave === clave);

/** Rasgo de cargas a partir de lo leído en el libro («7 cargas, recupera 1d6 + 1 al amanecer»). */
export function rasgoDeCargas(o) {
  const c = o.cargas; if (!c || !c.max) return null;
  const m = /^(\d+d\d+)(?:\+(\d+))?$/.exec(c.recarga || '');
  const base = { id: uid('r'), tipo: 'recurso', nombre: `${o.nombre} (cargas)`, nota: 'Cargas del objeto mágico.', maxBase: 'fijo', maxN: c.max, maxAb: 'car', dado: 'd20', nivMax: 5, escuela: '', espacioMin: 0, soloEspacio: true, efecto: 'aviso', efectoN: 5, texto: '', objeto: o.clave };
  if (m) return { ...base, recarga: 'dado', recDado: m[1], recBono: +(m[2] || 0), recMomento: 'largo' };
  if (/todas/.test(c.recarga || '')) return { ...base, recarga: 'largo' };
  if (/^\d+$/.test(c.recarga || '')) return { ...base, recarga: 'dado', recDado: `${c.recarga}d1`, recBono: 0, recMomento: 'largo' };
  return { ...base, recarga: 'nunca' };
}
/** Añade un objeto de la biblioteca al personaje. Devuelve la entrada creada. */
export function anadirObjeto(ch, o) {
  const e = { id: uid('ob'), clave: o.clave, nombre: o.nombre, tipo: o.tipo, rareza: o.rareza, sintonia: !!o.sintonia, sintonizado: false, notas: '', rasgo: null };
  const r = rasgoDeCargas(o);
  if (r) { (ch.rasgos ||= []).push(r); e.rasgo = r.id; }
  equipoDe(ch).objetos.push(e);
  return e;
}
export function quitarObjeto(ch, id) {
  const eq = equipoDe(ch), e = eq.objetos.find(x => x.id === id); if (!e) return null;
  eq.objetos = eq.objetos.filter(x => x !== e);
  if (e.rasgo) { ch.rasgos = (ch.rasgos || []).filter(r => r.id !== e.rasgo); if (ch.play?.rec) delete ch.play.rec[e.rasgo]; }
  return e;
}
/** Sintonizar o dejar de estarlo. Devuelve false si ya hay tres objetos sintonizados. */
export function alternarSintonia(ch, id) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return false;
  if (!e.sintonizado && sintonizados(ch).length >= MAX_SINTONIA) return false;
  e.sintonizado = !e.sintonizado; return true;
}
