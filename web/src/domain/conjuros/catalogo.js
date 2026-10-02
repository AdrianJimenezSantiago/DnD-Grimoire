// Catálogo de conjuros: compendio del SRD más los conjuros de los libros importados, textos del manual, enlace con
// los conjuros de cada personaje (db.catalog), lista para el buscador y tiradas de cada conjuro.
import { esc, norm, uid } from '../../core/util.js';
import { tiradasDe, tieneTiradas } from './tiradas.js';
import { tiradasBase, ajustarTiradas } from './tiradasBase.js';
import { claveNombre } from '../libros/manual.js';
import { alcance, componentes, duracion, escuelaOficial } from './validar.js';

let SRD = null, BASE = null, SRDK = {}, SRDN = {}, MANUAL = null;
const ALIAS = { "leomund's tiny hut": 'tiny hut' };

let DE_LIBROS = [], NOMBRES = null;
// Los nombres en castellano de todos los conjuros conocidos (para marcarlos en cursiva en los textos)
export const nombresConjuros = () => (NOMBRES ||= (SRD || []).map(x => x.es).filter(Boolean));
function reindexar() {
  const extra = [], vistos = new Set((BASE || []).map(x => claveEs(x.es, x.l)));
  for (const x of DE_LIBROS) { const c = claveEs(x.es, x.l); if (!vistos.has(c)) { vistos.add(c); extra.push(x); } }
  SRD = BASE ? [...BASE, ...extra] : null; SRDK = {}; SRDN = {};
  (SRD || []).forEach(limpiarDatos);
  (SRD || []).forEach(x => { SRDK[x.k] = x; if (x.en) SRDN[norm(x.en) + '|' + x.l] = x; });
  itemsMemo = null; tirMemo.clear(); NOMBRES = null;
}
// Conjuros que traen los libros importados y no están en el compendio (los fija libros/biblioteca.js)
export function fijarConjurosDeLibros(lista) { DE_LIBROS = lista || []; reindexar(); }
const LIMPIOS = new WeakSet();
function limpiarDatos(x) {
  if (LIMPIOS.has(x)) return; LIMPIOS.add(x);
  x.a = alcance(x.a); x.du = duracion(x.du); x.co = componentes(x.co) || x.co; x.esc = escuelaOficial(x.esc) || x.esc;
}
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

export async function cargarCompendio(fuente) {
  try {
    const j = typeof fuente === 'string' ? await (await fetch(fuente)).json() : await fuente;
    BASE = j.conjuros; reindexar();
    return true;
  } catch (e) { SRD = null; console.warn('Compendio SRD no disponible', e); return false; }
}
export const compendio = () => SRD || [];

export const fijarTextosManual = m => { MANUAL = m && Object.keys(m).length ? m : null; };
export const textoManual = x => (MANUAL && x ? MANUAL[x.k] || null : null);
export const numTextosManual = () => (MANUAL ? Object.keys(MANUAL).length : 0);
const claveEs = (nombre, nivel) => `${norm(nombre).replace(/[^a-z0-9]+/g, ' ').trim()}|${nivel}`;
export function oficializar(db) {
  const cambios = [];
  Object.values(db.catalog).forEach(s => {
    const x = delCompendio(s); if (!x) return;
    if (s.es !== x.es) cambios.push([s.es, x.es]);
    Object.assign(s, { es: x.es, escuela: x.esc, tiempo: x.t, alcance: x.a, duracion: x.du, comp: x.co, ritual: !!x.ri, conc: !!x.c, level: x.l, srd: x.k });
    if (x.cs) s.coste = x.cs;
  });
  itemsMemo = null;
  return cambios;
}

export function delCompendio(s) {
  if (!SRD || !s) return null;
  if (s.srd && SRDK[s.srd]) return SRDK[s.srd];
  const en = norm(s.en).trim();
  return SRDN[(ALIAS[en] || en) + '|' + s.level] || null;
}

export function enlazarCatalogo(db) {
  if (!SRD) return 0; let n = 0;
  Object.values(db.catalog).forEach(s => {
    const x = delCompendio(s); if (!x) return;
    if (s.srd !== x.k) { s.srd = x.k; n++; }
    if (!s.desc && x.dEs) { s.desc = x.dEs; s.sup = x.hEs || ''; n++; }
  });
  if (n) itemsMemo = null;
  return n;
}

export function importarDelCompendio(db, x) {
  const hit = Object.values(db.catalog).find(s => s.srd === x.k || (norm(s.en) === norm(x.en) && s.level === x.l));
  if (hit) { hit.srd ||= x.k; return hit.id; }
  const id = uid('s');
  db.catalog[id] = { id, level: x.l, es: x.es, en: x.en, escuela: x.esc, tiempo: x.t, alcance: x.a, duracion: x.du, comp: x.co, coste: x.cs,
    ritual: !!x.ri, conc: !!x.c, efecto: '', desc: x.dEs || '', sup: x.hEs || '', srd: x.k };
  itemsMemo = null;
  return id;
}

let itemsMemo = null, memoKey = '';
export function itemsConjuros(db) {
  const key = Object.keys(db.catalog).length + '|' + Object.values(db.catalog).reduce((a, s) => a + (s.es || '').length + s.level, 0);
  if (itemsMemo && key === memoKey) return itemsMemo;
  const items = [], linked = new Set();
  Object.values(db.catalog).forEach(s => {
    const x = delCompendio(s); if (x) linked.add(x.k);
    items.push({ id: 'c:' + s.id, src: 'cat', s, es: s.es, en: s.en, l: s.level, esc: s.escuela, ri: s.ritual, c: s.conc, cl: x ? x.cl : null });
  });
  (SRD || []).forEach(x => { if (!linked.has(x.k)) items.push({ id: 's:' + x.k, src: 'srd', x, es: x.es, en: x.en, l: x.l, esc: x.esc, ri: !!x.ri, c: !!x.c, cl: x.cl }); });
  itemsMemo = items; memoKey = key;
  return items;
}
export const invalidarItems = () => { itemsMemo = null; };
export const idDeItem = (db, it) => (it.src === 'cat' ? it.s.id : importarDelCompendio(db, it.x));
export const metaItem = it => [it.en !== it.es ? it.en : '', it.l === 0 ? 'Truco' : 'Nivel ' + it.l, it.esc, it.ri ? 'ritual' : '', it.c ? 'concentración' : ''].filter(Boolean).map(esc).join(', ');
export const etiquetaItem = it => (it.src === 'srd' ? (it.x.fuente ? it.x.fuente.split(/[:(]/)[0].trim().slice(0, 18) : it.x.phb ? 'Manual' : 'SRD') : '');
export const filtroLista = (it, cls) => !cls || !it.cl || it.cl.includes(cls);
export const conjuroDelCompendio = x => ({ es: x.es, en: x.en, level: x.l, escuela: x.esc, tiempo: x.t, alcance: x.a, duracion: x.du, comp: x.co, coste: x.cs,
  ritual: !!x.ri, conc: !!x.c, efecto: '', desc: x.dEs || '', sup: x.hEs || '' });

const tirMemo = new Map();
export function tiradasConjuro(s) {
  if (!s) return null;
  const x = delCompendio(s), man = textoManual(x);
  const k = `${s.id || s.es}|${man ? 1 : 0}|${(s.desc || '').length}`;
  if (tirMemo.has(k)) return tirMemo.get(k);
  let r = tiradasDe([[man?.d, man?.h], [s.desc, s.sup], [x?.dEs, x?.hEs], [x?.d, x?.h]]);
  // Conjuros del manual que no están en el SRD: sus datos mecánicos mientras no se importe el libro
  if (!tieneTiradas(r) && !r?.salvacion) r = tiradasBase(s.en || x?.en) || r;
  r = ajustarTiradas(r, s.en || x?.en);
  tirMemo.set(k, r); return r;
}
