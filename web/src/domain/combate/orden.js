// Orden de iniciativa: aliados y enemigos junto a tu personaje, de quién es el turno, rondas y puntos de golpe de los enemigos.
import { uid } from '../../core/util.js';

export const YO = 'yo';
export const TIPOS = { aliado: 'Aliado', enemigo: 'Enemigo' };
const MAX = 30;
const entero = (x, lo, hi) => { const n = parseInt(x, 10); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null; };
const nombreLimpio = x => String(x ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);

export function normCombatiente(x) {
  if (!x || typeof x !== 'object') return null;
  const nombre = nombreLimpio(x.nombre); if (!nombre) return null;
  const pgMax = entero(x.pgMax, 1, 9999), pg = pgMax == null ? null : entero(x.pg, 0, pgMax) ?? pgMax;
  return { id: typeof x.id === 'string' && /^[\w-]{1,40}$/.test(x.id) && x.id !== YO ? x.id : uid('cb'), nombre, tipo: TIPOS[x.tipo] ? x.tipo : 'enemigo',
    ini: entero(x.ini, -10, 60), desempate: entero(x.desempate, -10, 20) ?? 0, pg, pgMax, fuera: !!x.fuera };
}
export function normOrden(c) {
  c.orden = (Array.isArray(c.orden) ? c.orden : []).map(normCombatiente).filter(Boolean).slice(0, MAX);
  const ids = new Set([YO, ...c.orden.map(x => x.id)]);
  c.turnoDe = typeof c.turnoDe === 'string' && ids.has(c.turnoDe) ? c.turnoDe : null;
  c.jugado = !!c.jugado;
  return c;
}

export function listaIniciativa(c, { nombre = 'Tú', desempate = 0 } = {}) {
  const yo = c.iniciativa == null ? [] : [{ id: YO, nombre, tipo: YO, ini: c.iniciativa, desempate, pg: null, pgMax: null, fuera: false }];
  const conIni = [...yo, ...c.orden.filter(x => x.ini != null)], sin = c.orden.filter(x => x.ini == null);
  return [...conIni.map((x, i) => ({ x, i })).sort((a, b) => b.x.ini - a.x.ini || b.x.desempate - a.x.desempate || (a.x.id === YO ? -1 : b.x.id === YO ? 1 : a.i - b.i)).map(({ x }) => x), ...sin];
}

export function nombreLibre(c, base) {
  const usados = new Set(c.orden.map(x => x.nombre.toLowerCase()));
  if (!usados.has(base.toLowerCase())) return base;
  for (let n = 2; ; n++) if (!usados.has(`${base} ${n}`.toLowerCase())) return `${base} ${n}`;
}
export function anadirCombatientes(c, { nombre, tipo = 'enemigo', ini = null, pgMax = null, cantidad = 1, desempate = 0 }, tirarD20 = null) {
  const base = nombreLimpio(nombre); if (!base) return [];
  const n = Math.max(1, Math.min(MAX - c.orden.length, parseInt(cantidad, 10) || 1)), nuevos = [];
  for (let i = 0; i < n; i++) {
    const tiro = ini == null && tirarD20 ? tirarD20() + (parseInt(desempate, 10) || 0) : ini;
    const x = normCombatiente({ nombre: n > 1 ? nombreLibre(c, `${base} ${i + 1}`) : nombreLibre(c, base), tipo, ini: tiro, pgMax, desempate });
    if (x) { c.orden.push(x); nuevos.push(x); }
  }
  return nuevos;
}
export function quitarCombatiente(c, id, yo) {
  const antes = c.orden.length, eraSuTurno = c.turnoDe === id && id !== YO;
  const r = eraSuTurno ? avanzarTurno(c, yo) : null;
  c.orden = c.orden.filter(x => x.id !== id);
  if (c.turnoDe === id) c.turnoDe = null;
  return c.orden.length !== antes ? { quitado: true, tuTurno: !!r?.tuTurno } : null;
}
export const combatiente = (c, id) => c.orden.find(x => x.id === id) || null;
export function fijarIniciativa(c, id, ini) { const x = combatiente(c, id); if (x) x.ini = entero(ini, -10, 60); return x; }
export function cambiarPg(c, id, delta) {
  const x = combatiente(c, id); if (!x || x.pgMax == null) return null;
  x.pg = Math.max(0, Math.min(x.pgMax, x.pg + (parseInt(delta, 10) || 0)));
  x.fuera = x.pg === 0;
  return x;
}
export function alternarFuera(c, id) { const x = combatiente(c, id); if (x) x.fuera = !x.fuera; return x; }

export function turnoActual(c, yo) {
  const L = listaIniciativa(c, yo).filter(x => x.ini != null && !x.fuera);
  return L.find(x => x.id === c.turnoDe) || L[0] || null;
}
function llegar(c, x) {
  c.turnoDe = x.id;
  if (x.id !== YO) return { actual: x, tuTurno: false };
  const tuTurno = c.jugado; c.jugado = true;
  return { actual: x, tuTurno };
}
export function avanzarTurno(c, yo) {
  const L = listaIniciativa(c, yo).filter(x => x.ini != null);
  if (!L.some(x => !x.fuera)) return null;
  let i = L.findIndex(x => x.id === c.turnoDe);
  if (i < 0) return llegar(c, L.find(x => !x.fuera));
  do i = (i + 1) % L.length; while (L[i].fuera);
  return llegar(c, L[i]);
}
export function alEmpezarTuTurno(c) { c.jugado = true; if (c.orden.length || c.turnoDe) c.turnoDe = YO; }
export const aliadosParaOtroCombate = c => c.orden.filter(x => x.tipo === 'aliado').map(x => ({ ...x, ini: null, fuera: false, pg: x.pgMax }));
