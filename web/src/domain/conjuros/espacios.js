// Espacios de conjuro y libro de conjuros del personaje: cuántos espacios hay de cada nivel, cuántos quedan libres,
// qué conjuros están preparados y la clave de color de cada escuela. P es el perfil de reglas2024.perfil(ch).
import { norm } from '../../core/util.js';

export const espaciosDe = (P, n) => P.slots[n] || 0;
export const gastadosDe = (ch, P, n) => Math.min(ch.play.used[n] || 0, espaciosDe(P, n));
export const espaciosLibres = (ch, P, n) => espaciosDe(P, n) - gastadosDe(ch, P, n);
export function primerLibreDesde(ch, P, n) { for (let L = Math.max(1, n); L <= 9; L++) if (espaciosLibres(ch, P, L) > 0) return L; return 0; }
export const estaPreparado = e => !!(e.prep || e.always);
export const numPreparados = (db, ch) => ch.book.filter(e => { const s = db.catalog[e.sid]; return s && s.level > 0 && e.prep && !e.always; }).length;
export const numTrucos = (db, ch) => ch.book.filter(e => { const s = db.catalog[e.sid]; return s && s.level === 0 && !e.always; }).length;
export const conConjuros = (ch, P) => !!P.apKey || P.maxSlot > 0 || ch.book.length > 0 || !!ch.enJuego?.conjuros;

const SC = { abj: 'abj', adi: 'adi', con: 'con', enc: 'enc', evo: 'evo', ilu: 'ilu', nig: 'nig', tra: 'tra' };
export const claveEscuela = escuela => SC[norm(escuela).slice(0, 3)] || '';
