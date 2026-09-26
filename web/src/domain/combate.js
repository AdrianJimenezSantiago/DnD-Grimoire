import { norm } from '../core/util.js';

export const ECONOMIA = [['accion', 'Acción'], ['adicional', 'Acción adicional'], ['reaccion', 'Reacción'], ['movimiento', 'Movimiento']];
export const COMBATE0 = () => ({ activo: false, ronda: 1, iniciativa: null, iniManual: false, turno: { accion: false, adicional: false, reaccion: false, movimiento: false }, ataques: null, espacio: '' });
export function normCombate(c) {
  const x = { ...COMBATE0(), ...(c && typeof c === 'object' ? c : {}) };
  x.activo = !!x.activo; x.ronda = Math.max(1, parseInt(x.ronda, 10) || 1);
  x.iniciativa = x.iniciativa == null || x.iniciativa === '' ? null : parseInt(x.iniciativa, 10) || 0;
  x.iniManual = !!x.iniManual && x.iniciativa != null;
  x.turno = Object.fromEntries(ECONOMIA.map(([k]) => [k, !!x.turno?.[k]]));
  x.espacio = x.activo && x.espacio ? String(x.espacio) : '';
  const a = x.ataques; x.ataques = a && typeof a === 'object' ? { usados: Math.max(0, parseInt(a.usados, 10) || 0), max: Math.max(1, parseInt(a.max, 10) || 1), ligera: !!a.ligera, mella: !!a.mella, extra: !!a.extra } : null;
  return x;
}
export const combateDe = ch => (ch.combate && ch.combate.turno ? ch.combate : (ch.combate = normCombate(ch.combate)));

export function empezarCombate(ch) { const c = combateDe(ch); Object.assign(c, COMBATE0(), { activo: true }); return c; }
export function terminarCombate(ch) { const c = combateDe(ch); Object.assign(c, COMBATE0()); return c; }
export function siguienteTurno(ch) {
  const c = combateDe(ch); c.ronda += 1;
  c.turno = { accion: false, adicional: false, reaccion: false, movimiento: false }; c.ataques = null; c.espacio = '';
  return c;
}

// Acción de Ataque: el primer ataque gasta la acción y abre tantos ataques como dé la clase.
// Un ataque extra con arma Ligera tras atacar con otra Ligera gasta la acción adicional (o nada, con Mella).
export function registrarAtaque(ch, { max = 1, ligera = false, mella = false } = {}) {
  const c = combateDe(ch), a = c.ataques;
  if (a && a.usados < a.max) { a.usados++; a.ligera ||= ligera; return { tipo: 'accion', n: a.usados, max: a.max }; }
  if (a && ligera && a.ligera && !a.extra) {
    a.extra = true;
    if (mella && !a.mella) { a.mella = true; return { tipo: 'mella', n: a.usados, max: a.max }; }
    if (!c.turno.adicional) { c.turno.adicional = true; return { tipo: 'adicional' }; }
  }
  if (!c.turno.accion) { c.turno.accion = true; c.ataques = { usados: 1, max, ligera, mella: false, extra: false }; return { tipo: 'accion', n: 1, max }; }
  return { tipo: 'agotado' };
}
export function deshacerAtaques(ch) { const c = combateDe(ch); c.ataques = null; return c; }
export function alternarEconomia(ch, k) { const c = combateDe(ch); if (k in c.turno) c.turno[k] = !c.turno[k]; if (k === 'accion' && !c.turno.accion) c.ataques = null; return c.turno[k]; }

// Manual del Jugador 2024, «Un conjuro por cada espacio de conjuro y turno»: en un turno solo puedes gastar UN espacio
// para lanzar un conjuro. Los trucos y lo que lances sin espacio (rasgos, dotes, rituales) no cuentan. Una reacción en el
// turno de otra criatura es otro turno: puede gastar espacio aunque ya lo gastaras en el tuyo.
// Devuelve '' si se puede, 'turno' si ya gastaste el espacio de tu turno, o 'reaccion' si es una reacción (vale solo fuera de tu turno).
export function limiteEspacio(ch, tiempo) {
  const c = combateDe(ch); if (!c.activo || !c.espacio) return '';
  return economiaDeTiempo(tiempo) === 'reaccion' ? 'reaccion' : 'turno';
}
// Al lanzar en combate: marca la parte del turno que gasta y, si es con espacio en tu turno, el espacio del turno
export function lanzarEnCombate(ch, { tiempo, conEspacio = false, nombre = '', enTuTurno = null } = {}) {
  const c = combateDe(ch); if (!c.activo) return;
  const eco = economiaDeTiempo(tiempo);
  if (c.turno[eco] === false) c.turno[eco] = true;
  const propio = enTuTurno ?? eco !== 'reaccion';
  if (conEspacio && propio) c.espacio = nombre || 'un conjuro';
}
export function economiaDeTiempo(tiempo) {
  const t = norm(tiempo || '');
  if (/reaccion/.test(t)) return 'reaccion';
  if (/adicional|bonus/.test(t)) return 'adicional';
  if (/^(1 )?accion\b|^action|^magia/.test(t)) return 'accion';
  return 'otro';
}
