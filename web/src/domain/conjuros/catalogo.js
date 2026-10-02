import { esc, norm, uid } from '../../core/util.js';
import { tiradasDe, tieneTiradas } from './tiradas.js';
import { tiradasBase, ajustarTiradas } from './tiradasBase.js';
import { formasDeEstado, sinCortes } from '../libros/glosario.js';
import { CLASES } from '../reglas/reglas2024.js';
import { claveNombre } from '../libros/manual.js';
import { alcance, componentes, duracion, escuelaOficial } from './validar.js';

let SRD = null, BASE = null, SRDK = {}, SRDN = {}, MANUAL = null, SUBS = {};
const ALIAS = { "leomund's tiny hut": 'tiny hut' };

let LIBROS = [], NOMBRES = null;
// Los nombres en castellano de todos los conjuros conocidos (para marcarlos en cursiva en los textos)
export const nombresConjuros = () => (NOMBRES ||= (SRD || []).map(x => x.es).filter(Boolean));
function reindexar() {
  const extra = [], vistos = new Set((BASE || []).map(x => claveEs(x.es, x.l)));
  for (const lb of LIBROS) for (const x of lb.nuevos || []) { const c = claveEs(x.es, x.l); if (!vistos.has(c)) { vistos.add(c); extra.push(x); } }
  SRD = BASE ? [...BASE, ...extra] : null; SRDK = {}; SRDN = {};
  (SRD || []).forEach(limpiarDatos);
  (SRD || []).forEach(x => { SRDK[x.k] = x; if (x.en) SRDN[norm(x.en) + '|' + x.l] = x; });
  itemsMemo = null; tirMemo.clear(); NOMBRES = null;
}
const LIMPIOS = new WeakSet();
function limpiarDatos(x) {
  if (LIMPIOS.has(x)) return; LIMPIOS.add(x);
  x.a = alcance(x.a); x.du = duracion(x.du); x.co = componentes(x.co) || x.co; x.esc = escuelaOficial(x.esc) || x.esc;
}
export function setLibros(libros) {
  LIBROS = libros || [];
  const textos = {}, glos = [], vistosG = new Set(); SUBS = {};
  for (const lb of LIBROS) {
    for (const [k, v] of Object.entries(lb.textos || {})) if (!textos[k]) textos[k] = v;
    for (const e of lb.glosario || []) if (!vistosG.has(e.clave)) { vistosG.add(e.clave); glos.push(e); }
    for (const sc of lb.subclases || []) if (sc.clase) (SUBS[sc.clase] ||= new Set()).add(sc.nombre);
  }
  setManual(textos); setGlosario(glos); reindexar();
  const junta = campo => { const m = new Map(); for (const lb of LIBROS) for (const e of lb[campo] || []) { const k = (e.clase ? e.clase + '|' : '') + e.clave; if (e.clave && !m.has(k)) m.set(k, { ...e, fuente: lb.titulo, libro: lb.id }); } return [...m.values()]; };
  BIB = { objetos: junta('objetos'), dotes: junta('dotes'), trasfondos: junta('trasfondos'), subclases: junta('subTextos'), rasgosClase: junta('rasgosClase'), especies: junta('especies'), criaturas: junta('criaturas') };
}
let BIB = { objetos: [], dotes: [], trasfondos: [], subclases: [], rasgosClase: [], especies: [], criaturas: [] };
export const criaturaImportada = k => BIB.criaturas.find(c => c.clave === k) || BIB.criaturas.find(c => norm(c.nombre) === norm(k)) || null;
export const biblioteca = () => BIB;
export const libros = () => LIBROS;
export const subclasesDe = clase => [...new Set([...(CLASES[clase]?.subs || []), ...(SUBS[clase] || [])])];
export function emparejarLibro(spells, idLibro, titulo) {
  const porClave = new Map((BASE || []).map(x => [claveEs(x.es, x.l), x]));
  const textos = {}, nuevos = [];
  for (const sp of spells) {
    const x = porClave.get(claveEs(sp.nombre, sp.nivel));
    if (x) { textos[x.k] = { d: sp.desc, h: sp.sup }; continue; }
    const k = `lib:${idLibro}:${claveNombre(sp.nombre).replace(/\s+/g, '-')}`;
    const dur = sp.duracion.replace(/\b[li](?=\s*(?:minuto|hora|ronda|día))/g, '1').replace(/\s+,/g, ',').replace(/^Concentración,\s*h/, 'H').replace(/(\d+) minutos?/, '$1 min').replace(/(\d+) horas?/, '$1 h');
    nuevos.push({ k, en: '', es: sp.nombre, l: sp.nivel, esc: sp.escuela, t: sp.tiempo.split(',')[0].trim() || 'Acción', a: sp.alcance, du: dur, co: sp.comp,
      cs: /\d\s*po\b/.test(sp.material) ? sp.material : '', ri: sp.ritual ? 1 : 0, c: sp.conc ? 1 : 0, cl: sp.clases, d: '', h: '', fuente: titulo });
    textos[k] = { d: sp.desc, h: sp.sup };
  }
  return { textos, nuevos };
}

export async function loadSrd(fuente) {
  try {
    const j = typeof fuente === 'string' ? await (await fetch(fuente)).json() : await fuente;
    BASE = j.conjuros; reindexar();
    return true;
  } catch (e) { SRD = null; console.warn('Compendio SRD no disponible', e); return false; }
}
export const compendio = () => SRD || [];

export const setManual = m => { MANUAL = m && Object.keys(m).length ? m : null; };
export const manualFor = x => (MANUAL && x ? MANUAL[x.k] || null : null);
export const manualCount = () => (MANUAL ? Object.keys(MANUAL).length : 0);
const claveEs = (nombre, nivel) => `${norm(nombre).replace(/[^a-z0-9]+/g, ' ').trim()}|${nivel}`;
export function oficializar(db) {
  const cambios = [];
  Object.values(db.catalog).forEach(s => {
    const x = srdFor(s); if (!x) return;
    if (s.es !== x.es) cambios.push([s.es, x.es]);
    Object.assign(s, { es: x.es, escuela: x.esc, tiempo: x.t, alcance: x.a, duracion: x.du, comp: x.co, ritual: !!x.ri, conc: !!x.c, level: x.l, srd: x.k });
    if (x.cs) s.coste = x.cs;
  });
  itemsMemo = null;
  return cambios;
}

export function srdFor(s) {
  if (!SRD || !s) return null;
  if (s.srd && SRDK[s.srd]) return SRDK[s.srd];
  const en = norm(s.en).trim();
  return SRDN[(ALIAS[en] || en) + '|' + s.level] || null;
}

export function linkCatalog(db) {
  if (!SRD) return 0; let n = 0;
  Object.values(db.catalog).forEach(s => {
    const x = srdFor(s); if (!x) return;
    if (s.srd !== x.k) { s.srd = x.k; n++; }
    if (!s.desc && x.dEs) { s.desc = x.dEs; s.sup = x.hEs || ''; n++; }
  });
  if (n) itemsMemo = null;
  return n;
}

export function importSrd(db, x) {
  const hit = Object.values(db.catalog).find(s => s.srd === x.k || (norm(s.en) === norm(x.en) && s.level === x.l));
  if (hit) { hit.srd ||= x.k; return hit.id; }
  const id = uid('s');
  db.catalog[id] = { id, level: x.l, es: x.es, en: x.en, escuela: x.esc, tiempo: x.t, alcance: x.a, duracion: x.du, comp: x.co, coste: x.cs,
    ritual: !!x.ri, conc: !!x.c, efecto: '', desc: x.dEs || '', sup: x.hEs || '', srd: x.k };
  itemsMemo = null;
  return id;
}

let itemsMemo = null, memoKey = '';
export function allSpellItems(db) {
  const key = Object.keys(db.catalog).length + '|' + Object.values(db.catalog).reduce((a, s) => a + (s.es || '').length + s.level, 0);
  if (itemsMemo && key === memoKey) return itemsMemo;
  const items = [], linked = new Set();
  Object.values(db.catalog).forEach(s => {
    const x = srdFor(s); if (x) linked.add(x.k);
    items.push({ id: 'c:' + s.id, src: 'cat', s, es: s.es, en: s.en, l: s.level, esc: s.escuela, ri: s.ritual, c: s.conc, cl: x ? x.cl : null });
  });
  (SRD || []).forEach(x => { if (!linked.has(x.k)) items.push({ id: 's:' + x.k, src: 'srd', x, es: x.es, en: x.en, l: x.l, esc: x.esc, ri: !!x.ri, c: !!x.c, cl: x.cl }); });
  itemsMemo = items; memoKey = key;
  return items;
}
export const invalidateItems = () => { itemsMemo = null; };
export const itemToSid = (db, it) => (it.src === 'cat' ? it.s.id : importSrd(db, it.x));
export const itemMeta = it => [it.en !== it.es ? it.en : '', it.l === 0 ? 'Truco' : 'Nivel ' + it.l, it.esc, it.ri ? 'ritual' : '', it.c ? 'concentración' : ''].filter(Boolean).map(esc).join(', ');
export const itemTag = it => (it.src === 'srd' ? (it.x.fuente ? it.x.fuente.split(/[:(]/)[0].trim().slice(0, 18) : it.x.phb ? 'Manual' : 'SRD') : '');
export const listFilter = (it, cls) => !cls || !it.cl || it.cl.includes(cls);
export const srdAsSpell = x => ({ es: x.es, en: x.en, level: x.l, escuela: x.esc, tiempo: x.t, alcance: x.a, duracion: x.du, comp: x.co, coste: x.cs,
  ritual: !!x.ri, conc: !!x.c, efecto: '', desc: x.dEs || '', sup: x.hEs || '' });

let GLOS = null, RE_EST = null;
export function setGlosario(lista) {
  GLOS = lista && lista.length ? new Map(lista.map(e => [e.clave, { ...e, texto: sinCortes(e.texto) }])) : null; RE_EST = null;
}
export const glosario = () => (GLOS ? [...GLOS.values()] : []);
export const termino = clave => GLOS?.get(clave) || null;
const CURADOS = {
  'vision ciega': ['visión ciega'], 'vision verdadera': ['visión verdadera'], 'vision en la oscuridad': ['visión en la oscuridad'],
  'sentir vibraciones': ['sentir vibraciones'], 'luz brillante': ['luz brillante'], 'luz tenue': ['luz tenue'], 'oscuridad': ['oscuridad'],
  'muy oscuro': ['muy oscuro', 'muy oscura', 'muy oscuros', 'muy oscuras'], 'terreno dificil': ['terreno difícil'], 'cobertura': ['cobertura'],
  'puntos de golpe temporales': ['puntos de golpe temporales'], 'concentracion': ['concentración'], 'ventaja': ['ventaja', 'desventaja'], 'desventaja': ['desventaja'],
  'maltrecho': ['maltrecho', 'maltrecha', 'maltrechos', 'maltrechas'], 'teletransporte': ['teletransporte'], 'resistencia': ['resistencia'],
  'inmunidad': ['inmunidad'], 'esfera': ['esfera'], 'cubo': ['cubo'], 'cono': ['cono'], 'linea': ['línea'], 'emanacion': ['emanación'],
  'cilindro': ['cilindro'], 'area de efecto': ['área de efecto'], 'critico': ['crítico'], 'invisible': ['invisible', 'invisibles'],
  // El glosario de 2024 trae también estos; solo se enlazan si el manual importado tiene la entrada
  'ataque de oportunidad': ['ataque de oportunidad', 'ataques de oportunidad'], 'descanso largo': ['descanso largo'], 'descanso corto': ['descanso corto'],
  'inspiracion heroica': ['inspiración heroica'], 'impacto critico': ['impacto crítico'], 'salvacion contra muerte': ['salvación contra muerte', 'salvaciones contra muerte'],
  'sorpresa': ['sorpresa'], 'accion adicional': ['acción adicional'], 'reaccion': ['reacción'],
};
const tolerante = s => s.replace(/[aá]/g, '[aá]').replace(/[eé]/g, '[eé]').replace(/[ií]/g, '[ií]').replace(/[oó]/g, '[oó]').replace(/[uúü]/g, '[uúü]').replace(/[nñ]/g, '[nñ]').replace(/ /g, '\\s+');
export function estadosRegex() {
  if (!GLOS) return null;
  if (RE_EST) return RE_EST;
  const formas = new Map();
  for (const e of GLOS.values()) if (e.cat === 'Estado') for (const f of formasDeEstado(e.nombre)) formas.set(f, e.clave);
  for (const [clave, fs] of Object.entries(CURADOS)) if (GLOS.has(clave)) for (const f of fs) formas.set(sinTildes(f), clave);
  if (!formas.size) return null;
  const alt = [...formas.keys()].sort((a, b) => b.length - a.length).map(tolerante).join('|');
  RE_EST = { re: new RegExp('(^|[^\\p{L}])(' + alt + ')(?![\\p{L}])', 'giu'), formas };
  return RE_EST;
}
const sinTildes = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');
export const claveDeForma = palabra => RE_EST?.formas.get(sinTildes(palabra)) || null;

const tirMemo = new Map();
export function tiradasConjuro(s) {
  if (!s) return null;
  const x = srdFor(s), man = manualFor(x);
  const k = `${s.id || s.es}|${man ? 1 : 0}|${(s.desc || '').length}`;
  if (tirMemo.has(k)) return tirMemo.get(k);
  let r = tiradasDe([[man?.d, man?.h], [s.desc, s.sup], [x?.dEs, x?.hEs], [x?.d, x?.h]]);
  // Conjuros del manual que no están en el SRD: sus datos mecánicos mientras no se importe el libro
  if (!tieneTiradas(r) && !r?.salvacion) r = tiradasBase(s.en || x?.en) || r;
  r = ajustarTiradas(r, s.en || x?.en);
  tirMemo.set(k, r); return r;
}
