import { norm } from '../core/util.js';

export const ECONOMIA = [['accion', 'Acción'], ['adicional', 'Acción adicional'], ['reaccion', 'Reacción'], ['movimiento', 'Movimiento']];
export const COMBATE0 = () => ({ activo: false, ronda: 1, iniciativa: null, iniManual: false, turno: { accion: false, adicional: false, reaccion: false, movimiento: false } });
export function normCombate(c) {
  const x = { ...COMBATE0(), ...(c && typeof c === 'object' ? c : {}) };
  x.activo = !!x.activo; x.ronda = Math.max(1, parseInt(x.ronda, 10) || 1);
  x.iniciativa = x.iniciativa == null || x.iniciativa === '' ? null : parseInt(x.iniciativa, 10) || 0;
  x.iniManual = !!x.iniManual && x.iniciativa != null;
  x.turno = Object.fromEntries(ECONOMIA.map(([k]) => [k, !!x.turno?.[k]]));
  return x;
}
export const combateDe = ch => (ch.combate && ch.combate.turno ? ch.combate : (ch.combate = normCombate(ch.combate)));

export function empezarCombate(ch) { const c = combateDe(ch); Object.assign(c, COMBATE0(), { activo: true }); return c; }
export function terminarCombate(ch) { const c = combateDe(ch); Object.assign(c, COMBATE0()); return c; }
export function siguienteTurno(ch) {
  const c = combateDe(ch); c.ronda += 1;
  c.turno = { accion: false, adicional: false, reaccion: false, movimiento: false };
  return c;
}
export function alternarEconomia(ch, k) { const c = combateDe(ch); if (k in c.turno) c.turno[k] = !c.turno[k]; return c.turno[k]; }

export function economiaDeTiempo(tiempo) {
  const t = norm(tiempo || '');
  if (/reaccion/.test(t)) return 'reaccion';
  if (/adicional|bonus/.test(t)) return 'adicional';
  if (/^(1 )?accion\b|^action|^magia/.test(t)) return 'accion';
  return 'otro';
}
