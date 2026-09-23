/**
 * Catálogo compartido de conjuros y compendio (va dentro de la app):
 * nombres y datos técnicos oficiales del Manual del Jugador 2024, texto en inglés del SRD 5.2 (CC-BY 4.0)
 * y, si el usuario lo importa desde su PDF, las descripciones del manual (se guardan solo en su dispositivo).
 */
import { esc, norm, uid } from '../core/util.js';

let SRD = null, SRDK = {}, SRDN = {}, MANUAL = null;
const ALIAS = { "leomund's tiny hut": 'tiny hut' };

/** Carga el compendio desde una URL (Android/web) o desde datos ya incluidos (archivo único de Windows). */
export async function loadSrd(fuente) {
  try {
    const j = typeof fuente === 'string' ? await (await fetch(fuente)).json() : await fuente;
    SRD = j.conjuros; SRDK = {}; SRDN = {};
    SRD.forEach(x => { SRDK[x.k] = x; SRDN[norm(x.en) + '|' + x.l] = x; });
    itemsMemo = null;
    return true;
  } catch (e) { SRD = null; console.warn('Compendio SRD no disponible', e); return false; }
}
export const srdReady = () => !!SRD;
export const compendio = () => SRD || [];

/* ---- descripciones del manual importadas por el usuario ---- */
export const setManual = m => { MANUAL = m && Object.keys(m).length ? m : null; };
export const manualFor = x => (MANUAL && x ? MANUAL[x.k] || null : null);
export const manualCount = () => (MANUAL ? Object.keys(MANUAL).length : 0);
const claveEs = (nombre, nivel) => `${norm(nombre).replace(/[^a-z0-9]+/g, ' ').trim()}|${nivel}`;
/** Empareja lo leído del PDF con el compendio. Devuelve {mapa:{k:{d,h}}, sinPareja:[nombres]} */
export function emparejarManual(spells) {
  const porClave = new Map((SRD || []).map(x => [claveEs(x.es, x.l), x]));
  const mapa = {}, sinPareja = [];
  spells.forEach(sp => { const x = porClave.get(claveEs(sp.nombre, sp.nivel)); if (x) mapa[x.k] = { d: sp.desc, h: sp.sup }; else sinPareja.push(sp.nombre); });
  return { mapa, sinPareja };
}
/** Pone nombres y datos técnicos oficiales a los conjuros del catálogo enlazados con el compendio. No toca textos propios. */
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

/** Enlaza el catálogo con el compendio y rellena en español lo que siga vacío. */
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

/* Lista unificada catálogo + compendio. Se memoriza: la reconstruimos solo si cambia el catálogo. */
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
export const itemTag = it => (it.src === 'srd' ? (it.x.phb ? 'Manual' : 'SRD') : '');
export const listFilter = (it, cls) => !cls || !it.cl || it.cl.includes(cls);
/** Vista de un conjuro del compendio con la forma de un conjuro del catálogo (para la ficha). */
export const srdAsSpell = x => ({ es: x.es, en: x.en, level: x.l, escuela: x.esc, tiempo: x.t, alcance: x.a, duracion: x.du, comp: x.co, coste: x.cs,
  ritual: !!x.ri, conc: !!x.c, efecto: '', desc: x.dEs || '', sup: x.hEs || '' });
