// Habilidades, salvaciones, iniciativa, percepción pasiva y velocidad, con pericias, dotes y objetos.
import { norm } from '../../core/util.js';
import { linajeActual } from '../origen/especies.js';
import { statsEfectivos, statsPorObjeto, bonoSalvObjetos, bonoPruebasObjetos, bonoHabilidadObjetos, velocidadMinimaObjetos } from '../equipo/objetosEfecto.js';
import { CARACTERISTICAS, modOf, clasesDe, dotesDe, competencia, nivelTotal } from './reglas2024.js';
import { CLASES_INFO } from '../clases/clases2024.js';
import { biblioteca } from '../libros/biblioteca.js';
import { ordenDe } from '../clases/ordenes.js';
import { penalizacionArmadura } from '../equipo/equipo.js';

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
// Nombre de habilidad tal y como lo escriben los libros («Conocimiento arcano», con restos de OCR como «Intim idación»)
const ALIAS_HAB = { conocimientoarcano: 'arcanos', arcanos: 'arcanos' };
const pegado = t => norm(t).replace(/1/g, 'i').replace(/[^a-z]/g, '');
export function habilidadesDeTexto(texto) {
  const t = pegado(texto), out = [];
  for (const [k, nombre] of HABILIDADES) { const n = pegado(nombre); if (t.includes(n) || Object.entries(ALIAS_HAB).some(([a, kk]) => kk === k && t.includes(a))) out.push([t.indexOf(n) >= 0 ? t.indexOf(n) : t.indexOf('conocimientoarcano'), k]); }
  return out.sort((a, b) => a[0] - b[0]).map(([, k]) => k);
}
export function habilidadesTrasfondo(ch) {
  const k = claveTrasfondo(ch.trasfondo); if (k) return HAB_TRASFONDO[k];
  const x = norm(ch.trasfondo || '') && biblioteca().trasfondos.find(t => t.nombre && norm(t.nombre) === norm(ch.trasfondo));
  return x ? habilidadesDeTexto(x.habilidades || '').slice(0, 2) : [];
}
const PERICIA_DOTE = { 'experto en habilidades': 1, 'don de la habilidad': 1 };
// Bendiciones del conocimiento (clérigo del conocimiento 3): pericia en las dos habilidades que elige
const periciaSubclase = c => (c.clase === 'Clérigo' && /conocimiento/i.test(c.subclase || '') && c.nivel >= 3 ? 2 : 0);
export function periciasDisponibles(ch) {
  return clasesDe(ch).reduce((n, c) => n + periciaSubclase(c) + (PERICIAS_CLASE[c.clase] || []).filter(([L]) => c.nivel >= L).reduce((s, [, k]) => s + k, 0), 0)
    + dotesDe(ch).reduce((n, d) => n + (PERICIA_DOTE[norm(d.nombre)] || 0), 0);
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

const KS = CARACTERISTICAS.map(([k]) => k), AB_DE_NOMBRE = Object.fromEntries(CARACTERISTICAS.map(([k, n]) => [norm(n), k]));
// Competencias en salvaciones: la primera clase, Mente escurridiza (pícaro 15), Superviviente disciplinado (monje 14) y la dote Resiliente
export function salvacionesCompetentes(ch) {
  const out = new Set([...(CLASES_INFO[clasesDe(ch)[0].clase]?.salv || []), ...(ch.salvacionesExtra || [])]);
  for (const c of clasesDe(ch)) {
    if (c.clase === 'Pícaro' && c.nivel >= 15) { out.add('sab'); out.add('car'); }
    if (c.clase === 'Monje' && c.nivel >= 14) KS.forEach(k => out.add(k));
    // Mente ilimitada (dominio del conocimiento 6): Inteligencia, o Sabiduría/Carisma si ya la tenías
    if (c.clase === 'Clérigo' && c.nivel >= 6 && /conocimiento/i.test(c.subclase || '')) out.add(!out.has('int') ? 'int' : !out.has('sab') ? 'sab' : 'car');
    // Mente de hierro (acechador en la penumbra 7): Sabiduría, o Inteligencia si ya la tenías
    if (c.clase === 'Explorador' && c.nivel >= 7 && /acechador|penumbra/i.test(c.subclase || '')) out.add(out.has('sab') ? 'int' : 'sab');
  }
  for (const d of dotesDe(ch)) if (norm(d.nombre) === 'resiliente' && AB_DE_NOMBRE[norm(d.detalle)]) out.add(AB_DE_NOMBRE[norm(d.detalle)]);
  return out;
}
const INCAP = ['incapacitado', 'aturdido', 'inconsciente', 'paralizado', 'petrificado'];
// Aura de protección (paladín 6): suma el Carisma (mínimo +1) a tus salvaciones salvo si estás incapacitado
export function auraProteccion(ch) {
  if (!clasesDe(ch).some(c => c.clase === 'Paladín' && c.nivel >= 6)) return 0;
  if ((ch.vida?.estados || []).some(k => INCAP.includes(k))) return 0;
  return Math.max(1, modOf(statsEfectivos(ch).car));
}
export function bonoSalvacion(ch, ab) {
  const pb = competencia(nivelTotal(ch));
  return modOf(statsEfectivos(ch)[ab]) + (salvacionesCompetentes(ch).has(ab) ? pb : 0) + auraProteccion(ch) + bonoSalvObjetos(ch);
}
export function nivelHabilidad(ch, k) { return Math.max(0, Math.min(2, parseInt(ch.habilidades?.[k], 10) || 0)); }
export function bonoHabilidad(ch, k) {
  const pb = competencia(nivelTotal(ch)), n = nivelHabilidad(ch, k);
  const extra = n === 2 ? pb * 2 : n === 1 ? pb : esBardo(ch) ? Math.floor(pb / 2) : 0;
  return modOf(statsEfectivos(ch)[abDe(k)]) + extra + bonoOrden(ch, k) + bonoGlamur(ch, k) + bonoPruebasObjetos(ch) + bonoHabilidadObjetos(ch, k);
}
// Taumaturgo y Naturalista suman la Sabiduría (mínimo +1) a sus dos habilidades de Inteligencia
export const bonoOrden = (ch, k) => clasesDe(ch).some(c => ordenDe(ch, c.clase)?.habilidades?.includes(k)) ? Math.max(1, modOf(statsEfectivos(ch).sab)) : 0;
// Glamur sobrenatural (errante feérico 3): suma la Sabiduría (mínimo +1) a las pruebas de Carisma
export const bonoGlamur = (ch, k) => abDe(k) === 'car' && clasesDe(ch).some(c => c.clase === 'Explorador' && c.nivel >= 3 && /errante/i.test(c.subclase || '')) ? Math.max(1, modOf(statsEfectivos(ch).sab)) : 0;
export function iniciativa(ch) {
  const pb = competencia(nivelTotal(ch));
  // Aprendiz de mucho (2024) solo vale para pruebas de habilidad: la iniciativa no usa ninguna
  // Emboscador pavoroso (acechador en la penumbra 3): suma la Sabiduría a la iniciativa
  const acechador = clasesDe(ch).some(c => c.clase === 'Explorador' && c.nivel >= 3 && /acechador|penumbra/i.test(c.subclase || ''));
  return modOf(statsEfectivos(ch).des) + bonoPruebasObjetos(ch) + (tieneDote(ch, 'Alerta') ? pb : 0) + (acechador ? modOf(statsEfectivos(ch).sab) : 0);
}
export const percepcionPasiva = ch => 10 + bonoHabilidad(ch, 'percepcion');
export const investigacionPasiva = ch => 10 + bonoHabilidad(ch, 'investigacion');
export const perspicaciaPasiva = ch => 10 + bonoHabilidad(ch, 'perspicacia');

const VEL_ESPECIE = { goliat: 10.5 };
const DOTES_VEL = { veloz: 3, 'don de la velocidad': 9 };
export function velocidad(ch) {
  const especie = norm(ch.especie || '').split(/[\s(]/)[0];
  let m = VEL_ESPECIE[especie] || linajeActual(ch)?.vel || 9;
  for (const d of dotesDe(ch)) m += DOTES_VEL[norm(d.nombre)] || 0;
  // Movimiento sin armadura: ni armadura ni escudo
  const armado = (ch.equipo?.objetos || []).some(o => o.equipado && o.armadura);
  const conArmaduraPesada = (ch.equipo?.objetos || []).some(o => o.equipado && o.armadura?.tipo === 'pesada');
  for (const c of clasesDe(ch)) {
    if (c.clase === 'Bárbaro' && c.nivel >= 5 && !conArmaduraPesada) m += 3;
    if (c.clase === 'Monje' && c.nivel >= 2 && !armado) m += [[18, 9], [14, 7.5], [10, 6], [6, 4.5], [2, 3]].find(([L]) => c.nivel >= L)[1];
    if (c.clase === 'Explorador' && c.nivel >= 6 && !conArmaduraPesada) m += 3;
    // Aura de celeridad (juramento de gloria 7)
    if (c.clase === 'Paladín' && c.nivel >= 7 && /gloria/i.test(c.subclase || '')) m += 3;
  }
  // Armadura pesada sin la Fuerza que pide: −3 m
  m -= penalizacionArmadura(ch).lenta;
  // Botas de zancadas y brincos: al menos 9 m, sin que la armadura pesada las reduzca
  m = Math.max(m, velocidadMinimaObjetos(ch));
  m -= 1.5 * Math.max(0, Math.min(6, parseInt(ch.vida?.agotamiento, 10) || 0));
  return Math.max(0, m);
}
export const fmtMetros = m => `${String(Math.round(m * 10) / 10).replace('.', ',')} m`;

export function tablaCaracteristicas(ch) {
  const salv = salvacionesCompetentes(ch), st = statsEfectivos(ch), por = statsPorObjeto(ch);
  return CARACTERISTICAS.map(([k, nombre]) => ({
    k, nombre, corto: AB_CORTA[k], valor: parseInt(st[k], 10) || 10, mod: modOf(st[k]), prueba: modOf(st[k]) + bonoPruebasObjetos(ch), objetos: por[k] || [], base: parseInt(ch.stats?.[k], 10) || 10,
    salvacion: { bono: bonoSalvacion(ch, k), competente: salv.has(k) },
    habilidades: HABILIDADES.filter(h => h[2] === k).map(([hk, hn]) => ({ k: hk, nombre: hn, nivel: nivelHabilidad(ch, hk), bono: bonoHabilidad(ch, hk) })),
  }));
}
