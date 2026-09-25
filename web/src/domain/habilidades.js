import { norm } from '../core/util.js';
import { ABILS, modOf, clasesDe, dotesDe, competencia, nivelTotal } from './reglas2024.js';
import { CLASES_INFO } from './clases2024.js';

export const HABILIDADES = [
  ['acrobacias', 'Acrobacias', 'des'], ['arcanos', 'Arcanos', 'int'], ['atletismo', 'Atletismo', 'fue'], ['engano', 'Engaño', 'car'],
  ['historia', 'Historia', 'int'], ['interpretacion', 'Interpretación', 'car'], ['intimidacion', 'Intimidación', 'car'], ['investigacion', 'Investigación', 'int'],
  ['juegomanos', 'Juego de manos', 'des'], ['medicina', 'Medicina', 'sab'], ['naturaleza', 'Naturaleza', 'int'], ['percepcion', 'Percepción', 'sab'],
  ['perspicacia', 'Perspicacia', 'sab'], ['persuasion', 'Persuasión', 'car'], ['religion', 'Religión', 'int'], ['sigilo', 'Sigilo', 'des'],
  ['supervivencia', 'Supervivencia', 'sab'], ['tratoanimales', 'Trato con animales', 'sab'],
];
export const NOMBRE_HAB = Object.fromEntries(HABILIDADES.map(([k, n]) => [k, n]));
export const AB_CORTA = { fue: 'Fue', des: 'Des', con: 'Con', int: 'Int', sab: 'Sab', car: 'Car' };

export const HAB_TRASFONDO = {
  'Acólito': ['perspicacia', 'religion'], 'Animador': ['acrobacias', 'interpretacion'], 'Artesano': ['investigacion', 'persuasion'],
  'Campesino': ['tratoanimales', 'naturaleza'], 'Charlatán': ['engano', 'juegomanos'], 'Comerciante': ['tratoanimales', 'persuasion'],
  'Criminal': ['juegomanos', 'sigilo'], 'Ermitaño': ['medicina', 'religion'], 'Erudito': ['arcanos', 'historia'], 'Escriba': ['investigacion', 'percepcion'],
  'Guardia': ['atletismo', 'percepcion'], 'Guía': ['sigilo', 'supervivencia'], 'Marinero': ['acrobacias', 'percepcion'], 'Noble': ['historia', 'persuasion'],
  'Soldado': ['atletismo', 'intimidacion'], 'Vagabundo': ['perspicacia', 'sigilo'],
};
const TODAS = HABILIDADES.map(([k]) => k);
export const HAB_CLASE = {
  'Bárbaro': [2, ['tratoanimales', 'atletismo', 'intimidacion', 'naturaleza', 'percepcion', 'supervivencia']],
  'Bardo': [3, TODAS],
  'Brujo': [2, ['arcanos', 'engano', 'historia', 'intimidacion', 'investigacion', 'naturaleza', 'religion']],
  'Clérigo': [2, ['historia', 'perspicacia', 'medicina', 'persuasion', 'religion']],
  'Druida': [2, ['arcanos', 'tratoanimales', 'perspicacia', 'medicina', 'naturaleza', 'percepcion', 'religion', 'supervivencia']],
  'Explorador': [3, ['tratoanimales', 'atletismo', 'perspicacia', 'investigacion', 'naturaleza', 'percepcion', 'sigilo', 'supervivencia']],
  'Guerrero': [2, ['acrobacias', 'tratoanimales', 'atletismo', 'historia', 'perspicacia', 'intimidacion', 'persuasion', 'percepcion', 'supervivencia']],
  'Hechicero': [2, ['arcanos', 'engano', 'perspicacia', 'intimidacion', 'persuasion', 'religion']],
  'Mago': [2, ['arcanos', 'historia', 'perspicacia', 'investigacion', 'medicina', 'naturaleza', 'religion']],
  'Monje': [2, ['acrobacias', 'atletismo', 'historia', 'perspicacia', 'religion', 'sigilo']],
  'Paladín': [2, ['atletismo', 'perspicacia', 'intimidacion', 'medicina', 'persuasion', 'religion']],
  'Pícaro': [4, ['acrobacias', 'atletismo', 'engano', 'perspicacia', 'intimidacion', 'investigacion', 'percepcion', 'persuasion', 'juegomanos', 'sigilo']],
};
export const PERICIAS_CLASE = { 'Pícaro': [[1, 2], [6, 2]], 'Bardo': [[2, 2], [9, 2]], 'Explorador': [[2, 1], [9, 2]], 'Mago': [[2, 1]] };

const claveTrasfondo = t => Object.keys(HAB_TRASFONDO).find(k => norm(k) === norm(t));
export const habilidadesTrasfondo = ch => HAB_TRASFONDO[claveTrasfondo(ch.trasfondo)] || [];
export function periciasDisponibles(ch) {
  return clasesDe(ch).reduce((n, c) => n + (PERICIAS_CLASE[c.clase] || []).filter(([L]) => c.nivel >= L).reduce((s, [, k]) => s + k, 0), 0);
}

export function competenciasIniciales(ch) {
  const out = {};
  for (const k of habilidadesTrasfondo(ch)) out[k] = 1;
  const [n, lista] = HAB_CLASE[ch.clase] || [0, []];
  const prio = CLASES_INFO[ch.clase]?.prio || [];
  const orden = [...lista].sort((a, b) => prio.indexOf(abDe(a)) - prio.indexOf(abDe(b)));
  let puestas = 0;
  for (const k of orden) { if (puestas >= n) break; if (!out[k]) { out[k] = 1; puestas++; } }
  return out;
}
export const abDe = k => HABILIDADES.find(h => h[0] === k)?.[2] || 'des';

const tieneDote = (ch, nombre) => dotesDe(ch).some(d => norm(d.nombre) === norm(nombre));
const esBardo = ch => clasesDe(ch).some(c => c.clase === 'Bardo' && c.nivel >= 2);
export const penalizacionAgotamiento = ch => 2 * Math.max(0, Math.min(6, parseInt(ch.vida?.agotamiento, 10) || 0));

export function salvacionesCompetentes(ch) {
  const base = CLASES_INFO[clasesDe(ch)[0].clase]?.salv || [];
  return new Set([...base, ...(ch.salvacionesExtra || [])]);
}
export function bonoSalvacion(ch, ab) {
  const pb = competencia(nivelTotal(ch));
  return modOf(ch.stats?.[ab]) + (salvacionesCompetentes(ch).has(ab) ? pb : 0);
}
export function nivelHabilidad(ch, k) { return Math.max(0, Math.min(2, parseInt(ch.habilidades?.[k], 10) || 0)); }
export function bonoHabilidad(ch, k) {
  const pb = competencia(nivelTotal(ch)), n = nivelHabilidad(ch, k);
  const extra = n === 2 ? pb * 2 : n === 1 ? pb : esBardo(ch) ? Math.floor(pb / 2) : 0;
  return modOf(ch.stats?.[abDe(k)]) + extra;
}
export function iniciativa(ch) {
  const pb = competencia(nivelTotal(ch));
  return modOf(ch.stats?.des) + (tieneDote(ch, 'Alerta') ? pb : esBardo(ch) ? Math.floor(pb / 2) : 0);
}
export const percepcionPasiva = ch => 10 + bonoHabilidad(ch, 'percepcion');
export const investigacionPasiva = ch => 10 + bonoHabilidad(ch, 'investigacion');
export const perspicaciaPasiva = ch => 10 + bonoHabilidad(ch, 'perspicacia');

const VEL_ESPECIE = { goliat: 10.5 };
export function velocidad(ch) {
  const especie = norm(ch.especie || '').split(/[\s(]/)[0];
  let m = VEL_ESPECIE[especie] || 9;
  const armado = (ch.equipo?.objetos || []).some(o => o.equipado && o.armadura && o.armadura.tipo !== 'escudo');
  const conArmaduraPesada = (ch.equipo?.objetos || []).some(o => o.equipado && o.armadura?.tipo === 'pesada');
  for (const c of clasesDe(ch)) {
    if (c.clase === 'Bárbaro' && c.nivel >= 5 && !conArmaduraPesada) m += 3;
    if (c.clase === 'Monje' && c.nivel >= 2 && !armado) m += [[18, 9], [14, 7.5], [10, 6], [6, 4.5], [2, 3]].find(([L]) => c.nivel >= L)[1];
    if (c.clase === 'Explorador' && c.nivel >= 6) m += 3;
  }
  m -= 1.5 * Math.max(0, Math.min(6, parseInt(ch.vida?.agotamiento, 10) || 0));
  return Math.max(0, m);
}
export const fmtMetros = m => `${String(Math.round(m * 10) / 10).replace('.', ',')} m`;

export function tablaCaracteristicas(ch) {
  const salv = salvacionesCompetentes(ch);
  return ABILS.map(([k, nombre]) => ({
    k, nombre, corto: AB_CORTA[k], valor: parseInt(ch.stats?.[k], 10) || 10, mod: modOf(ch.stats?.[k]),
    salvacion: { bono: bonoSalvacion(ch, k), competente: salv.has(k) },
    habilidades: HABILIDADES.filter(h => h[2] === k).map(([hk, hn]) => ({ k: hk, nombre: hn, nivel: nivelHabilidad(ch, hk), bono: bonoHabilidad(ch, hk) })),
  }));
}
