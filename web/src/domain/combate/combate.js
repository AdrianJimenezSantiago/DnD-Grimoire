// Estado del combate: ronda, iniciativa, economía del turno, ataques hechos y acciones comunes.
import { norm } from '../../core/util.js';
import { clasesDe, dotesDe } from '../reglas/reglas2024.js';
import { normOrden, alEmpezarTuTurno, aliadosParaOtroCombate } from './orden.js';

export const ECONOMIA = [['accion', 'Acción'], ['adicional', 'Acción adicional'], ['reaccion', 'Reacción'], ['movimiento', 'Movimiento']];
export const COMBATE0 = () => ({ activo: false, ronda: 1, iniciativa: null, iniManual: false, turno: { accion: false, adicional: false, reaccion: false, movimiento: false }, ataques: null, espacio: '', hechas: [], unaVez: [], orden: [], turnoDe: null, jugado: false });
export function normCombate(c) {
  const x = { ...COMBATE0(), ...(c && typeof c === 'object' ? c : {}) };
  x.activo = !!x.activo; x.ronda = Math.max(1, parseInt(x.ronda, 10) || 1);
  x.iniciativa = x.iniciativa == null || x.iniciativa === '' ? null : parseInt(x.iniciativa, 10) || 0;
  x.iniManual = !!x.iniManual && x.iniciativa != null;
  x.turno = Object.fromEntries(ECONOMIA.map(([k]) => [k, !!x.turno?.[k]]));
  x.espacio = x.activo && x.espacio ? String(x.espacio) : '';
  x.hechas = Array.isArray(x.hechas) ? x.hechas.filter(h => h && ACCION_COMUN[h.k] && ['accion', 'adicional', 'reaccion'].includes(h.via)).map(h => ({ k: h.k, via: h.via })) : [];
  x.unaVez = x.activo && Array.isArray(x.unaVez) ? x.unaVez.filter(k => typeof k === 'string') : [];
  const a = x.ataques; x.ataques = a && typeof a === 'object' ? { usados: Math.max(0, parseInt(a.usados, 10) || 0), max: Math.max(1, parseInt(a.max, 10) || 1), ligera: !!a.ligera, mella: !!a.mella, extra: !!a.extra } : null;
  return normOrden(x);
}
export const combateDe = ch => (ch.combate && ch.combate.turno ? ch.combate : (ch.combate = normCombate(ch.combate)));

export function empezarCombate(ch) { const c = combateDe(ch), aliados = aliadosParaOtroCombate(c); Object.assign(c, COMBATE0(), { activo: true, orden: aliados }); return c; }
export function terminarCombate(ch) { const c = combateDe(ch), aliados = aliadosParaOtroCombate(c); Object.assign(c, COMBATE0(), { orden: aliados }); return c; }
export function siguienteTurno(ch) {
  const c = combateDe(ch); c.ronda += 1;
  c.turno = { accion: false, adicional: false, reaccion: false, movimiento: false }; c.ataques = null; c.espacio = ''; c.hechas = []; c.unaVez = [];
  alEmpezarTuTurno(c);
  return c;
}

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

export function limiteEspacio(ch, tiempo) {
  const c = combateDe(ch); if (!c.activo || !c.espacio) return '';
  return economiaDeTiempo(tiempo) === 'reaccion' ? 'reaccion' : 'turno';
}
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

export const ACCIONES_COMUNES = [
  { k: 'correr', corto: 'Movimiento ×2', nombre: 'Correr', ico: 'velocidad', efecto: 'correr', texto: 'Ganas movimiento extra igual a tu velocidad durante este turno.' },
  { k: 'destrabarse', corto: 'Sin ataques de oportunidad', nombre: 'Destrabarse', ico: 'iniciativa', efecto: 'destrabarse', texto: 'Tu movimiento no provoca ataques de oportunidad durante el resto del turno.' },
  { k: 'esquivar', corto: 'Desventaja contra ti', nombre: 'Esquivar', ico: 'ca', efecto: 'esquivar', texto: 'Hasta tu siguiente turno, quien te ataque y puedas ver tiene desventaja, y tus salvaciones de Destreza tienen ventaja. Lo pierdes si quedas incapacitado o tu velocidad es 0.' },
  { k: 'ayudar', corto: 'Ventaja a un aliado', nombre: 'Ayudar', ico: 'inspiracion', texto: 'Antes de tu siguiente turno, un aliado tiene ventaja en su siguiente prueba con una habilidad o herramienta en la que tengas competencia, o en su siguiente ataque contra un enemigo a 1,5 m de ti. También sirve para estabilizar a una criatura a 0 PG con una prueba de Sabiduría (Medicina) CD 10.' },
  { k: 'esconderse', corto: 'Sigilo CD 15', nombre: 'Esconderse', ico: 'ojo', tirar: ['sigilo'], texto: 'Muy oscurecido o tras cobertura de tres cuartos o total, y fuera de la vista de tus enemigos: prueba de Destreza (Sigilo) CD 15. Si la superas, tienes el estado invisible y tu total es la CD para encontrarte. Termina si haces más ruido que un susurro, te encuentran, atacas o lanzas un conjuro con componente verbal.' },
  { k: 'buscar', corto: 'Prueba de Sabiduría', nombre: 'Buscar', ico: 'buscar', tirar: ['percepcion', 'perspicacia', 'medicina', 'supervivencia'], texto: 'Prueba de Sabiduría para encontrar algo: Percepción, Perspicacia, Medicina o Supervivencia.' },
  { k: 'estudiar', corto: 'Prueba de Inteligencia', nombre: 'Estudiar', ico: 'libro', tirar: ['investigacion', 'arcanos', 'historia', 'naturaleza', 'religion'], texto: 'Prueba de Inteligencia para recordar o deducir algo: Arcanos, Historia, Investigación, Naturaleza o Religión.' },
  { k: 'influir', corto: 'Prueba de Carisma', nombre: 'Influir', ico: 'corazon', tirar: ['persuasion', 'engano', 'intimidacion', 'interpretacion', 'tratoanimales'], texto: 'Intentas convencer a una criatura: prueba de Carisma (Engaño, Intimidación, Interpretación o Persuasión) o de Sabiduría (Trato con animales).' },
  { k: 'preparar', corto: 'Con tu reacción', nombre: 'Preparar', ico: 'md_tiempo', texto: 'Eliges un desencadenante y una acción (o un conjuro, concentrándote en él). Cuando ocurra, la haces con tu reacción.' },
  { k: 'objeto', corto: 'Objeto no mágico', nombre: 'Usar un objeto', alias: ['Utilizar'], ico: 'o_pocion', texto: 'Usas un objeto no mágico que necesite una acción, como encender una antorcha o forzar una cerradura con herramientas. Activar un objeto mágico es la acción de Magia, y beber una poción, una acción adicional.' },
  { k: 'oportunidad', corto: 'Cuerpo a cuerpo', nombre: 'Ataque de oportunidad', ico: 'combate', via: 'reaccion', texto: 'Cuando una criatura que puedes ver sale de tu alcance, le haces un ataque cuerpo a cuerpo con tu reacción.' },
];
export const ACCION_COMUN = Object.fromEntries(ACCIONES_COMUNES.map(a => [a.k, a]));
export function accionesAdicionales(ch) {
  const out = [], c = Object.fromEntries(clasesDe(ch).map(x => [x.clase, x.nivel]));
  if ((c['Pícaro'] || 0) >= 2) for (const k of ['correr', 'destrabarse', 'esconderse']) out.push({ k, rasgo: 'Acción astuta' });
  if ((c['Monje'] || 0) >= 2) { out.push({ k: 'correr', rasgo: 'Paso del viento' }); out.push({ k: 'destrabarse', rasgo: 'Defensa paciente' }); }
  const dotes = dotesDe(ch).map(d => norm(d.nombre));
  if (dotes.includes('mente aguda')) out.push({ k: 'estudiar', rasgo: 'Mente aguda' });
  if (dotes.includes('observador')) out.push({ k: 'buscar', rasgo: 'Observador' });
  if (dotes.includes('don de la velocidad')) out.push({ k: 'destrabarse', rasgo: 'Don de la velocidad' });
  return out.filter((x, i) => out.findIndex(y => y.k === x.k) === i);
}
export function hacerAccionComun(ch, k, via = ACCION_COMUN[k]?.via || 'accion') {
  const c = combateDe(ch); if (!ACCION_COMUN[k]) return false;
  c.turno[via] = true; c.hechas = [...(c.hechas || []), { k, via }];
  return true;
}
export function deshacerAccionComun(ch, k, via) {
  const c = combateDe(ch), i = (c.hechas || []).findIndex(h => h.k === k && h.via === via); if (i < 0) return false;
  c.hechas.splice(i, 1);
  if (!c.hechas.some(h => h.via === via) && !(via === 'accion' && c.ataques)) c.turno[via] = false;
  return true;
}
