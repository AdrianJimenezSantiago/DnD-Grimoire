import { clamp, norm } from '../core/util.js';
import { statsEfectivos, bonoMagiaObjetos } from './objetosEfecto.js';
import { ordenDe } from './ordenes.js';
import { aptitudEspecie, FUENTES_APTITUD } from './especies.js';

export const ABILS = [['fue', 'Fuerza'], ['des', 'Destreza'], ['con', 'Constitución'], ['int', 'Inteligencia'], ['sab', 'Sabiduría'], ['car', 'Carisma']];
export const ABIL_NAME = Object.fromEntries(ABILS);
export const SCHOOLS = ['Abjuración', 'Adivinación', 'Conjuración', 'Encantamiento', 'Evocación', 'Ilusionismo', 'Nigromancia', 'Transmutación'];
export const modOf = v => Math.floor(((parseInt(v, 10) || 10) - 10) / 2);
export const sgn = n => (n >= 0 ? '+' : '') + n;
export const nivelDe = ch => clamp(parseInt(ch.nivel, 10) || 1, 1, 20);
export const competencia = L => 2 + Math.floor((L - 1) / 4);

export function clasesDe(ch) {
  const out = [{ clase: ch.clase, subclase: ch.subclase || '', nivel: nivelDe(ch), principal: true }];
  for (const m of ch.multiclase || []) {
    if (!m || !CLASES[m.clase] || out.some(o => o.clase === m.clase)) continue;
    const libre = 20 - out.reduce((n, o) => n + o.nivel, 0); if (libre < 1) break;
    out.push({ clase: m.clase, subclase: m.subclase || '', nivel: clamp(parseInt(m.nivel, 10) || 1, 1, libre), principal: false });
  }
  return out;
}
export const nivelTotal = ch => clasesDe(ch).reduce((n, c) => n + c.nivel, 0);
export const vistaClase = (ch, c) => ({ ...ch, clase: c.clase, subclase: c.subclase, nivel: c.nivel, multiclase: [] });
export const REQ_MULTICLASE = { 'Bárbaro': [['fue']], 'Bardo': [['car']], 'Brujo': [['car']], 'Clérigo': [['sab']], 'Druida': [['sab']], 'Explorador': [['des'], ['sab']],
  'Guerrero': [['fue', 'des']], 'Hechicero': [['car']], 'Mago': [['int']], 'Monje': [['des'], ['sab']], 'Paladín': [['fue'], ['car']], 'Pícaro': [['des']] };
export function requisitosMulticlase(ch) {
  const cs = clasesDe(ch); if (cs.length < 2) return [];
  const N = { fue: 'Fuerza', des: 'Destreza', con: 'Constitución', int: 'Inteligencia', sab: 'Sabiduría', car: 'Carisma' };
  return cs.flatMap(c => (REQ_MULTICLASE[c.clase] || []).filter(alts => !alts.some(k => (ch.stats?.[k] || 0) >= 13))
    .map(alts => ({ clase: c.clase, falta: alts.map(k => `${N[k]} 13`).join(' o ') })));
}
export const clasesTexto = ch => { const cs = clasesDe(ch); return cs.length > 1 ? cs.map(c => `${c.clase} ${c.nivel}`).join(' / ') : `${ch.clase}, nivel ${cs[0].nivel}`; };

const FULL = [[2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
const HALF = [[2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2]];
const THIRD = [[], [], [2], [3], [3], [3], [4, 2], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1]];
const PACT_N = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
const PACT_L = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
const PREP = {
  mago: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
  div: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  hech: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  brujo: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  medio: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  tercio: [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
};
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
export const TRASFONDOS_2024 = {
  'Acólito': [['int', 'sab', 'car'], 'Iniciado en la magia (clérigo)'], 'Animador': [['fue', 'des', 'car'], 'Músico'],
  'Artesano': [['fue', 'des', 'int'], 'Fabricante'], 'Campesino': [['fue', 'con', 'sab'], 'Duro'], 'Charlatán': [['des', 'con', 'car'], 'Habilidoso'],
  'Comerciante': [['con', 'int', 'car'], 'Afortunado'], 'Criminal': [['des', 'con', 'int'], 'Alerta'], 'Ermitaño': [['con', 'sab', 'car'], 'Sanador'],
  'Erudito': [['con', 'int', 'sab'], 'Iniciado en la magia (mago)'], 'Escriba': [['des', 'int', 'sab'], 'Habilidoso'], 'Guardia': [['fue', 'int', 'sab'], 'Alerta'],
  'Guía': [['des', 'con', 'sab'], 'Iniciado en la magia (druida)'], 'Marinero': [['fue', 'des', 'sab'], 'Matón de taberna'], 'Noble': [['fue', 'int', 'car'], 'Habilidoso'],
  'Soldado': [['fue', 'des', 'con'], 'Atacante salvaje'], 'Vagabundo': [['des', 'sab', 'car'], 'Afortunado'],
};
export function dotesDe(ch, trasfondosLib = []) {
  const partir = t => { const m = /^(.+?)\s*\(([^)]+)\)\s*$/.exec(t); return m ? { nombre: m[1], detalle: m[2] } : { nombre: t, detalle: '' }; };
  const n = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const out = [];
  const tr = n(ch.trasfondo) && (trasfondosLib.find(x => n(x.nombre) && n(x.nombre) === n(ch.trasfondo))?.dote || (TRASFONDOS_2024[Object.keys(TRASFONDOS_2024).find(k => n(k) === n(ch.trasfondo))] || [])[1]);
  if (tr) out.push({ ...partir(tr), origen: 'trasfondo' });
  for (const d of ch.dotes || []) { const x = partir(d); if (x.nombre && !out.some(o => n(o.nombre) === n(x.nombre) && n(o.detalle) === n(x.detalle))) out.push({ ...x, origen: 'elegida' }); }
  return out;
}
export const LISTAS = ['Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador', 'Hechicero', 'Mago', 'Paladín'];

export function magiaPara(P, fuente = '') {
  if (!P.cds?.length || (P.cds.length < 2 && P.cd != null)) return P;
  const f = norm(fuente), x = P.cds.find(c => c.claves.some(k => k && f.includes(k))) || P.cds[0];
  return { ...P, apKey: x.ap, mod: x.mod, cd: x.cd, atk: x.atk };
}
function lanzamientoDe(c) {
  const cls = CLASES[c.clase] || {};
  if (cls.cast) return { cast: cls.cast, viaSub: false, nombre: c.clase, lista: c.clase };
  if (cls.subCast && cls.subCast.re.test(c.subclase || '') && c.nivel >= cls.subCast.desde) return { cast: cls.subCast, viaSub: true, nombre: cls.subCast.nombre, lista: 'Mago' };
  return null;
}
const SUB_APTITUD = [{ clase: 'Monje', re: /sombra|elementos/, ap: 'sab' }, { clase: 'Bárbaro', re: /corazon/, ap: 'sab' }, { clase: 'Guerrero', re: /psionic/, ap: 'int' }, { clase: 'Guerrero', re: /abanderad/, ap: 'car' }, { clase: 'Pícaro', re: /vastago|tres/, ap: 'int' }];
const FACTOR = { full: L => L, half: L => Math.ceil(L / 2), third: L => Math.floor(L / 3) };

export function perfil(ch) {
  const clases = clasesDe(ch), lvl = clases.reduce((n, c) => n + c.nivel, 0);
  const lanzan = clases.map(c => ({ c, l: lanzamientoDe(c) })).filter(x => x.l);
  const prim = lanzan[0] || null, c = prim ? prim.l.cast : null;
  const apKey = ch.aptitud || (c ? c.ap : '');
  const pb = competencia(lvl);
  const st = statsEfectivos(ch), mo = bonoMagiaObjetos(ch), mod = apKey ? modOf(st[apKey]) : null;
  const slots = {}; let pact = null;
  if (ch.espaciosManuales) {
    for (let L = 1; L <= 9; L++) { const n = parseInt((ch.espacios || {})[L], 10) || 0; if (n > 0) slots[L] = n; }
  } else {
    const brujo = lanzan.find(x => x.l.cast.tipo === 'pact');
    if (brujo) pact = { level: PACT_L[brujo.c.nivel - 1], n: PACT_N[brujo.c.nivel - 1] };
    const otros = lanzan.filter(x => x.l.cast.tipo !== 'pact');
    let row = [];
    if (otros.length === 1) { const { c: k, l } = otros[0]; row = (l.cast.tipo === 'full' ? FULL : l.cast.tipo === 'half' ? HALF : THIRD)[k.nivel - 1] || []; }
    else if (otros.length > 1) { const nl = otros.reduce((n, { c: k, l }) => n + FACTOR[l.cast.tipo](k.nivel), 0); row = nl > 0 ? FULL[Math.min(20, nl) - 1] : []; }
    row.forEach((n, i) => { if (n) slots[i + 1] = n; });
    if (pact) slots[pact.level] = (slots[pact.level] || 0) + pact.n;
  }
  // Hechicería innata activa: +1 a la CD de los conjuros de hechicero
  const innata = (ch.vida?.efectos || []).some(e => e.k === 'innata') ? 1 : 0;
  const cds = [];
  for (const { c: k, l } of lanzan) {
    const ap = ch.aptitud || l.cast.ap, claves = [norm(k.clase), norm(l.nombre), ...(l.lista === 'Mago' || k.clase === 'Mago' ? ['libro', 'experto'] : []), ...(k.clase === 'Brujo' ? ['pacto'] : [])];
    const x = cds.find(y => y.ap === ap);
    if (x) x.claves.push(...claves);
    else { const m = modOf(st[ap]); cds.push({ ap, mod: m, cd: 8 + pb + m + mo.cd + (parseInt(ch.extraCD, 10) || 0) + (k.clase === 'Hechicero' ? innata : 0), atk: pb + m + mo.atk + (parseInt(ch.extraAtaque, 10) || 0), claves }); }
  }
  // Subclases sin lanzamiento que dan conjuros con su propia característica (monje, bárbaro del corazón salvaje, guerrero psiónico)
  for (const k of clases) {
    const x = SUB_APTITUD.find(a => a.clase === k.clase && a.re.test(norm(k.subclase || ''))); if (!x || cds.some(y => y.claves.includes(norm(k.subclase)))) continue;
    const m = modOf(st[x.ap]); cds.push({ ap: x.ap, mod: m, cd: 8 + pb + m + mo.cd, atk: pb + m + mo.atk, claves: [norm(k.subclase)] });
  }
  // Conjuros de especie (linaje élfico o gnomo, legado infernal): su propia aptitud mágica
  const apEsp = aptitudEspecie(ch, st, prim?.l.cast.ap || '');
  if (apEsp) {
    const claves = FUENTES_APTITUD.map(norm), x = cds.find(y => y.ap === apEsp);
    if (x) x.claves.push(...claves);
    else { const m = modOf(st[apEsp]); cds.push({ ap: apEsp, mod: m, cd: 8 + pb + m + mo.cd, atk: pb + m + mo.atk, claves, especie: true }); }
  }
  const trucos = ({ c: k, l }) => (l.cast.cant ? l.cast.cant[0] + l.cast.cant.slice(1).filter(t => k.nivel >= t).length + (l.viaSub ? 0 : ordenDe(ch, k.clase)?.truco || 0) : 0);
  return {
    c, viaSub: !!prim?.l.viaSub, lvl, pb, apKey, mod, clases, cds, apEspecie: apEsp,
    lista: prim ? prim.l.lista : '',
    listaNombre: prim ? prim.l.nombre : '',
    listas: lanzan.map(x => x.l.lista),
    cd: mod == null ? null : 8 + pb + mod + mo.cd + (parseInt(ch.extraCD, 10) || 0) + (prim?.c.clase === 'Hechicero' ? innata : 0),
    atk: mod == null ? null : pb + mod + mo.atk + (parseInt(ch.extraAtaque, 10) || 0),
    slots, pact, maxSlot: Math.max(0, ...Object.keys(slots).map(Number)),
    maxPrep: lanzan.reduce((n, { c: k, l }) => n + PREP[l.cast.prep][k.nivel - 1], 0),
    maxCant: lanzan.reduce((n, x) => n + trucos(x), 0),
    ritualLibro: clases.some(x => x.clase === 'Mago'),
  };
}
