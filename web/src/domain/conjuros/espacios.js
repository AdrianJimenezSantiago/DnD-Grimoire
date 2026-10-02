// Espacios de conjuro y libro de conjuros del personaje: cuántos espacios hay de cada nivel, cuántos quedan libres,
// qué conjuros están preparados y la clave de color de cada escuela. P es el perfil de reglas2024.perfil(ch).
import { norm } from '../../core/util.js';

export const slotsOf = (P, n) => P.slots[n] || 0;
export const usedOf = (ch, P, n) => Math.min(ch.play.used[n] || 0, slotsOf(P, n));
export const freeOf = (ch, P, n) => slotsOf(P, n) - usedOf(ch, P, n);
export function firstFreeFrom(ch, P, n) { for (let L = Math.max(1, n); L <= 9; L++) if (freeOf(ch, P, L) > 0) return L; return 0; }
export const isPrepared = e => !!(e.prep || e.always);
export const prepCount = (db, ch) => ch.book.filter(e => { const s = db.catalog[e.sid]; return s && s.level > 0 && e.prep && !e.always; }).length;
export const cantCount = (db, ch) => ch.book.filter(e => { const s = db.catalog[e.sid]; return s && s.level === 0 && !e.always; }).length;
export const conConjuros = (ch, P) => !!P.apKey || P.maxSlot > 0 || ch.book.length > 0 || !!ch.enJuego?.conjuros;

const SC = { abj: 'abj', adi: 'adi', con: 'con', enc: 'enc', evo: 'evo', ilu: 'ilu', nig: 'nig', tra: 'tra' };
export const schoolKey = escuela => SC[norm(escuela).slice(0, 3)] || '';
