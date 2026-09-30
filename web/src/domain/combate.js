import { norm } from '../core/util.js';
import { clasesDe, dotesDe } from './reglas2024.js';

export const ECONOMIA = [['accion', 'Acción'], ['adicional', 'Acción adicional'], ['reaccion', 'Reacción'], ['movimiento', 'Movimiento']];
export const COMBATE0 = () => ({ activo: false, ronda: 1, iniciativa: null, iniManual: false, turno: { accion: false, adicional: false, reaccion: false, movimiento: false }, ataques: null, espacio: '', hechas: [], unaVez: [] });
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
  return x;
}
export const combateDe = ch => (ch.combate && ch.combate.turno ? ch.combate : (ch.combate = normCombate(ch.combate)));

export function empezarCombate(ch) { const c = combateDe(ch); Object.assign(c, COMBATE0(), { activo: true }); return c; }
export function terminarCombate(ch) { const c = combateDe(ch); Object.assign(c, COMBATE0()); return c; }
export function siguienteTurno(ch) {
  const c = combateDe(ch); c.ronda += 1;
  c.turno = { accion: false, adicional: false, reaccion: false, movimiento: false }; c.ataques = null; c.espacio = ''; c.hechas = []; c.unaVez = [];
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

// Acciones que cualquiera puede hacer en combate (Manual del Jugador 2024). efecto: el que te deja puesto hasta tu siguiente turno;
// tirar: las habilidades de la prueba que suele acompañarla, la más habitual primero
export const ACCIONES_COMUNES = [
  { k: 'correr', corto: 'Movimiento ×2', nombre: 'Correr', ico: 'velocidad', efecto: 'correr', texto: 'Ganas movimiento extra igual a tu velocidad durante este turno.' },
  { k: 'destrabarse', corto: 'Sin ataques de oportunidad', nombre: 'Destrabarse', ico: 'iniciativa', efecto: 'destrabarse', texto: 'Tu movimiento no provoca ataques de oportunidad durante el resto del turno.' },
  { k: 'esquivar', corto: 'Desventaja contra ti', nombre: 'Esquivar', ico: 'ca', efecto: 'esquivar', texto: 'Hasta tu siguiente turno, quien te ataque y puedas ver tiene desventaja, y tus salvaciones de Destreza tienen ventaja. Lo pierdes si quedas incapacitado o tu velocidad es 0.' },
  { k: 'ayudar', corto: 'Ventaja a un aliado', nombre: 'Ayudar', ico: 'inspiracion', texto: 'Un aliado a 1,5 m tiene ventaja en su siguiente prueba de característica o en su siguiente ataque contra un enemigo a 1,5 m de ti, antes de tu siguiente turno.' },
  { k: 'esconderse', corto: 'Sigilo CD 15', nombre: 'Esconderse', ico: 'ojo', tirar: ['sigilo'], texto: 'Fuera de la vista y tras cobertura, prueba de Destreza (Sigilo) CD 15: si la superas, tienes el estado invisible hasta que te descubran, ataques o hagas ruido.' },
  { k: 'buscar', corto: 'Prueba de Sabiduría', nombre: 'Buscar', ico: 'buscar', tirar: ['percepcion', 'perspicacia', 'medicina', 'supervivencia'], texto: 'Prueba de Sabiduría para encontrar algo: Percepción, Perspicacia, Medicina o Supervivencia.' },
  { k: 'estudiar', corto: 'Prueba de Inteligencia', nombre: 'Estudiar', ico: 'libro', tirar: ['investigacion', 'arcanos', 'historia', 'naturaleza', 'religion'], texto: 'Prueba de Inteligencia para recordar o deducir algo: Arcanos, Historia, Investigación, Naturaleza o Religión.' },
  { k: 'influir', corto: 'Prueba de Carisma', nombre: 'Influir', ico: 'corazon', tirar: ['persuasion', 'engano', 'intimidacion', 'interpretacion', 'tratoanimales'], texto: 'Intentas convencer a una criatura: prueba de Carisma (Engaño, Intimidación, Interpretación o Persuasión) o de Sabiduría (Trato con animales).' },
  { k: 'preparar', corto: 'Con tu reacción', nombre: 'Preparar', ico: 'md_tiempo', texto: 'Eliges un desencadenante y una acción (o un conjuro, concentrándote en él). Cuando ocurra, la haces con tu reacción.' },
  { k: 'objeto', corto: 'Poción, objeto mágico…', nombre: 'Usar un objeto', ico: 'o_pocion', texto: 'Usas un objeto que lo requiera, como beber una poción o activar un objeto mágico.' },
  { k: 'oportunidad', corto: 'Cuerpo a cuerpo', nombre: 'Ataque de oportunidad', ico: 'combate', via: 'reaccion', texto: 'Cuando una criatura que puedes ver sale de tu alcance, le haces un ataque cuerpo a cuerpo con tu reacción.' },
];
export const ACCION_COMUN = Object.fromEntries(ACCIONES_COMUNES.map(a => [a.k, a]));
// Rasgos que dejan hacer algunas de ellas como acción adicional
export function accionesAdicionales(ch) {
  const out = [], c = Object.fromEntries(clasesDe(ch).map(x => [x.clase, x.nivel]));
  if ((c['Pícaro'] || 0) >= 2) for (const k of ['correr', 'destrabarse', 'esconderse']) out.push({ k, rasgo: 'Acción astuta' });
  if ((c['Monje'] || 0) >= 2) { out.push({ k: 'correr', rasgo: 'Paso del viento' }); out.push({ k: 'destrabarse', rasgo: 'Defensa paciente' }); }
  // Dotes: Estudio rápido (Mente aguda), Búsqueda rápida (Observador), Artista escapista (Don de la velocidad)
  const dotes = dotesDe(ch).map(d => norm(d.nombre));
  if (dotes.includes('mente aguda')) out.push({ k: 'estudiar', rasgo: 'Mente aguda' });
  if (dotes.includes('observador')) out.push({ k: 'buscar', rasgo: 'Observador' });
  if (dotes.includes('don de la velocidad')) out.push({ k: 'destrabarse', rasgo: 'Don de la velocidad' });
  return out.filter((x, i) => out.findIndex(y => y.k === x.k) === i);
}
// Marca la acción común hecha y gasta la parte del turno que toca
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
