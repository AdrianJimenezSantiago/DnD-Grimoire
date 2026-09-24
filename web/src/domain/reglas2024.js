/**
 * Reglas del Manual del Jugador 2024 que necesita la hoja.
 * Módulo puro: sin DOM ni estado. Todo lo derivado de un personaje sale de perfil().
 */
import { clamp } from '../core/util.js';

export const ABILS = [['fue', 'Fuerza'], ['des', 'Destreza'], ['con', 'Constitución'], ['int', 'Inteligencia'], ['sab', 'Sabiduría'], ['car', 'Carisma']];
export const ABIL_NAME = Object.fromEntries(ABILS);
export const SCHOOLS = ['Abjuración', 'Adivinación', 'Conjuración', 'Encantamiento', 'Evocación', 'Ilusionismo', 'Nigromancia', 'Transmutación'];
export const modOf = v => Math.floor(((parseInt(v, 10) || 10) - 10) / 2);
export const sgn = n => (n >= 0 ? '+' : '') + n;
export const nivelDe = ch => clamp(parseInt(ch.nivel, 10) || 1, 1, 20);
export const competencia = L => 2 + Math.floor((L - 1) / 4);

// Espacios por nivel de personaje (índice 0 = nivel 1). Cada fila: espacios de nivel 1, 2, 3…
const FULL = [[2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
const HALF = [[2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2]];
const THIRD = [[], [], [2], [3], [3], [3], [4, 2], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1]];
const PACT_N = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
const PACT_L = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
// Conjuros preparados de nivel 1+ (índice 0 = nivel 1)
const PREP = {
  mago: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
  div: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],   // bardo, clérigo, druida
  hech: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  brujo: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  medio: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],        // paladín, explorador
  tercio: [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],          // caballero y embaucador arcanos
};
// cant: [base, niveles en los que se gana un truco más]. Subclases del Manual del Jugador y, al final, las de Héroes de Faerûn.
export const CLASES = {
  'Bárbaro': { subs: ['Senda del Árbol del Mundo', 'Senda del berserker', 'Senda del corazón salvaje', 'Senda del fanático'] },
  'Bardo': { cast: { tipo: 'full', ap: 'car', prep: 'div', cant: [2, 4, 10] }, subs: ['Colegio de la danza', 'Colegio del conocimiento', 'Colegio del glamour', 'Colegio del valor', 'Colegio de la luna'] },
  'Brujo': { cast: { tipo: 'pact', ap: 'car', prep: 'brujo', cant: [2, 4, 10] }, subs: ['Patrón celestial', 'Patrón feérico', 'Patrón infernal', 'Patrón primigenio'] },
  'Clérigo': { cast: { tipo: 'full', ap: 'sab', prep: 'div', cant: [3, 4, 10] }, subs: ['Dominio de la guerra', 'Dominio de la luz', 'Dominio de la vida', 'Dominio del engaño', 'Dominio del conocimiento'] },
  'Druida': { cast: { tipo: 'full', ap: 'sab', prep: 'div', cant: [2, 4, 10] }, subs: ['Círculo de la luna', 'Círculo de la tierra', 'Círculo de las estrellas', 'Círculo del mar'] },
  'Explorador': { cast: { tipo: 'half', ap: 'sab', prep: 'medio' }, subs: ['Acechador en la penumbra', 'Cazador', 'Errante feérico', 'Señor de las bestias', 'Caminante invernal'] },
  'Guerrero': { subs: ['Caballero arcano', 'Campeón', 'Guerrero psiónico', 'Maestro del combate', 'Abanderado'],
    subCast: { re: /arcan|eldritch/i, desde: 3, tipo: 'third', ap: 'int', prep: 'tercio', cant: [2, 10], nombre: 'Caballero arcano' } },
  'Hechicero': { cast: { tipo: 'full', ap: 'car', prep: 'hech', cant: [4, 4, 10] }, subs: ['Hechicería aberrante', 'Hechicería de magia salvaje', 'Hechicería dracónica', 'Hechicería mecánica', 'Hechicería del fuego mágico'] },
  'Mago': { cast: { tipo: 'full', ap: 'int', prep: 'mago', cant: [3, 4, 10] }, subs: ['Abjurador', 'Adivino', 'Evocador', 'Ilusionista', 'Hojacantante'] },
  'Monje': { subs: ['Guerrero de la mano abierta', 'Guerrero de la misericordia', 'Guerrero de la sombra', 'Guerrero de los elementos'] },
  'Paladín': { cast: { tipo: 'half', ap: 'car', prep: 'medio' }, subs: ['Juramento de entrega', 'Juramento de gloria', 'Juramento de los antiguos', 'Juramento de venganza', 'Juramento de los genios nobles'] },
  'Pícaro': { subs: ['Asesino', 'Embaucador arcano', 'Ladrón', 'Rebanaalmas', 'Vástago de los Tres'],
    subCast: { re: /arcan|trickster/i, desde: 3, tipo: 'third', ap: 'int', prep: 'tercio', cant: [3, 10], nombre: 'Embaucador arcano' } },
};
export const ESPECIES = ['Aasimar', 'Dracónido', 'Elfo', 'Enano', 'Gnomo', 'Goliat', 'Humano', 'Mediano', 'Orco', 'Tiefling'];
export const TRASFONDOS = ['Acólito', 'Animador', 'Artesano', 'Campesino', 'Charlatán', 'Comerciante', 'Criminal', 'Ermitaño', 'Erudito', 'Escriba', 'Guardia', 'Guía', 'Marinero', 'Noble', 'Soldado', 'Vagabundo'];
export const LISTAS = ['Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador', 'Hechicero', 'Mago', 'Paladín'];

/** Todo lo que la hoja necesita saber de un personaje. */
export function perfil(ch) {
  const cls = CLASES[ch.clase] || {};
  const lvl = nivelDe(ch);
  let c = cls.cast || null, viaSub = false;
  if (!c && cls.subCast && cls.subCast.re.test(ch.subclase || '') && lvl >= cls.subCast.desde) { c = cls.subCast; viaSub = true; }
  const apKey = ch.aptitud || (c ? c.ap : '');
  const pb = competencia(lvl);
  const mod = apKey ? modOf(ch.stats[apKey]) : null;
  const slots = {}; let pact = null;
  if (ch.espaciosManuales) {
    for (let L = 1; L <= 9; L++) { const n = parseInt((ch.espacios || {})[L], 10) || 0; if (n > 0) slots[L] = n; }
  } else if (c) {
    if (c.tipo === 'pact') { pact = { level: PACT_L[lvl - 1], n: PACT_N[lvl - 1] }; slots[pact.level] = pact.n; }
    else { const row = (c.tipo === 'full' ? FULL : c.tipo === 'half' ? HALF : THIRD)[lvl - 1]; row.forEach((n, i) => { if (n) slots[i + 1] = n; }); }
  }
  return {
    c, viaSub, lvl, pb, apKey, mod,
    lista: c ? (viaSub ? 'Mago' : ch.clase) : '',
    listaNombre: c ? (viaSub ? cls.subCast.nombre : ch.clase) : '',
    cd: mod == null ? null : 8 + pb + mod + (parseInt(ch.extraCD, 10) || 0),
    atk: mod == null ? null : pb + mod + (parseInt(ch.extraAtaque, 10) || 0),
    slots, pact, maxSlot: Math.max(0, ...Object.keys(slots).map(Number)),
    maxPrep: c ? PREP[c.prep][lvl - 1] : 0,
    maxCant: c && c.cant ? c.cant[0] + c.cant.slice(1).filter(t => lvl >= t).length : 0,
    ritualLibro: ch.clase === 'Mago',   // Adepto en rituales
  };
}
