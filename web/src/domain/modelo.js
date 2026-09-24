/**
 * Modelo de datos y migraciones.
 *   db = { schema:2, activeId, catalog:{id:conjuro}, chars:[personaje] }
 *   conjuro   = datos compartidos (nombre, nivel, escuela, textos…)
 *   personaje = identidad, características, libro [{sid, prep, always, fuente, gratis, used}], rasgos y estado de juego
 */
import { clamp, clone, uid } from '../core/util.js';
import { perfil } from './reglas2024.js';
import { HOJA_THEO } from './ejemplo.js';
import { limpiarConjuro, usoGratis } from './validar.js';
import { normEquipo } from './equipo.js';

export const SCHEMA = 2;
export const CAT_FIELDS = ['es', 'en', 'escuela', 'tiempo', 'alcance', 'duracion', 'comp', 'coste', 'efecto', 'desc', 'sup'];
export const REL_FIELDS = ['fuente', 'gratis'];
export const THEO = {
  nombre: 'Theo', especie: 'Humano', trasfondo: 'Erudito', clase: 'Mago', subclase: 'Adivino', nivel: 6,
  stats: { fue: 8, des: 14, con: 15, int: 18, sab: 12, car: 8 },
  lema: '«Escribe todo. Tacha lo que se cumpla. _Subraya lo que necesites recordar._» Aldrick',
  campana: 'Crónicas de La Argos, Aequus. Temporada 2026/2027',
};
const STATS0 = { fue: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 };
const PLAY0 = () => ({ used: {}, conc: '', concObj: [], efectos: [], rec: {}, log: [], onlyPrep: false });

export const spellKey = s => `${((s.en || '').trim() || (s.es || '').trim()).toLowerCase()}|${s.level}`;

export function blankChar(over = {}) {
  return {
    id: uid('c'), nombre: '', especie: '', trasfondo: '', clase: 'Mago', subclase: '', nivel: 1,
    stats: { ...STATS0 }, aptitud: '', extraCD: 0, extraAtaque: 0,
    espaciosManuales: false, espacios: {}, lema: '', campana: '', notas: '',
    book: [], rasgos: [], rasgosOff: [], play: PLAY0(), multiclase: [], dotes: [],
    retrato: null, historia: '', diario: { sesiones: [] }, equipo: { objetos: [] }, bestiario: { criaturas: [] },
    ...clone(over),
  };
}

export function normChar(c) {
  c = { ...blankChar(), ...c };
  c.stats = { ...STATS0, ...(c.stats || {}) };
  c.play = { ...PLAY0(), ...(c.play || {}) };
  c.play.used ||= {}; c.play.rec ||= {};
  if (!Array.isArray(c.play.concObj)) c.play.concObj = [];
  if (!Array.isArray(c.play.efectos)) c.play.efectos = [];
  if (!c.play.conc) c.play.concObj = [];
  if (!Array.isArray(c.play.log)) c.play.log = [];
  if (!Array.isArray(c.rasgos)) c.rasgos = [];
  if (!Array.isArray(c.rasgosOff)) c.rasgosOff = [];
  // Versiones anteriores: Presagio y Recuperación arcana eran campos fijos
  if (Array.isArray(c.play.presagio) && c.play.presagio.length && !c.play.rec['tpl:adivino.presagio']) c.play.rec['tpl:adivino.presagio'] = { used: 0, dice: c.play.presagio };
  if (c.play.recupUsed && !c.play.rec['tpl:mago.recuperacion']) c.play.rec['tpl:mago.recuperacion'] = { used: 1, dice: [] };
  delete c.play.presagio; delete c.play.recupUsed;
  if (!c.diario || !Array.isArray(c.diario.sesiones)) c.diario = { sesiones: [] };
  if (typeof c.historia !== 'string') c.historia = '';
  if (!c.equipo || !Array.isArray(c.equipo.objetos)) c.equipo = { objetos: [] };
  normEquipo(c);   // inventario: categorías, cantidades, pesos y monedas (los antiguos solo tenían objetos mágicos)
  if (!c.bestiario || !Array.isArray(c.bestiario.criaturas)) c.bestiario = { criaturas: [] };
  if (c.retrato && !c.retrato.src) c.retrato = null;
  c.nivel = clamp(parseInt(c.nivel, 10) || 1, 1, 20);
  // multiclase: [{clase, subclase, nivel}] sin la clase principal ni repetidas; dotes elegidas: nombres sin repetir
  c.multiclase = (Array.isArray(c.multiclase) ? c.multiclase : []).filter(m => m && m.clase && m.clase !== c.clase)
    .filter((m, i, a) => a.findIndex(x => x.clase === m.clase) === i).map(m => ({ clase: m.clase, subclase: String(m.subclase || ''), nivel: clamp(parseInt(m.nivel, 10) || 1, 1, 19) }));
  c.dotes = [...new Set((Array.isArray(c.dotes) ? c.dotes : []).map(d => String(d || '').trim()).filter(Boolean))];
  c.book = (c.book || []).filter(e => e && e.sid);
  return c;
}

export function normDb(d) {
  d.schema = SCHEMA; d.catalog ||= {};
  Object.values(d.catalog).forEach(s => { CAT_FIELDS.forEach(f => { if (s[f] == null) s[f] = ''; }); limpiarConjuro(s); });
  // El compendio anterior emparejaba Guía con True Strike e Impacto certero con Guidance
  Object.values(d.catalog).forEach(s => {
    if (s.es === 'Guía' && s.en === 'True Strike') { s.en = 'Guidance'; s.srd = 'srd-2024_guidance'; }
    else if (s.es === 'Impacto certero' && s.en === 'Guidance') { s.en = 'True Strike'; s.srd = 'srd-2024_true-strike'; }
  });
  d.chars = (d.chars || []).map(normChar);
  d.chars.forEach(c => c.book.forEach(e => { e.gratis = usoGratis(e.gratis); if (!e.gratis) e.used = false; }));
  d.chars.forEach(c => { c.book = c.book.filter(e => d.catalog[e.sid]); });
  if (!d.chars.some(c => c.id === d.activeId)) d.activeId = d.chars[0]?.id ?? null;
  return d;
}

export function upsertSpell(d, s) {
  const k = spellKey(s);
  const hit = Object.values(d.catalog).find(x => spellKey(x) === k);
  if (hit) return hit.id;
  const id = uid('s');
  d.catalog[id] = { id, level: s.level, ritual: !!s.ritual, conc: !!s.conc };
  CAT_FIELDS.forEach(f => { d.catalog[id][f] = s[f] || ''; });
  return id;
}

/** Convierte la hoja antigua de un solo personaje (v1) en un personaje; sus conjuros entran al catálogo. */
export function charFromV1(d, v1) {
  const m = v1.meta || {};
  const nivel = parseInt((String(m.sub || '').match(/nivel\s+(\d+)/i) || [])[1], 10) || THEO.nivel;
  const ch = blankChar({ ...THEO, nombre: (m.nombre || THEO.nombre).trim(), nivel });
  (v1.levels || []).forEach(l => (l.spells || []).forEach(s => {
    const sid = upsertSpell(d, { ...s, level: l.level });
    ch.book.push({ sid, prep: !!s.prep, always: !!s.always || (l.level === 0 && /iniciado|dote|especie/i.test(s.fuente || '')),
      fuente: s.fuente || '', gratis: s.gratis || '', used: !!s.used });
  }));
  ch.play = { ...PLAY0(), used: { ...(v1.used || {}) }, conc: v1.conc || '', recupUsed: !!v1.recupUsed, onlyPrep: !!v1.onlyPrep };
  // Si la hoja antigua tenía espacios, CD o ataque distintos a las reglas, se respetan
  const P = perfil(ch);
  const oldSlots = {};
  (v1.levels || []).forEach(l => { const n = parseInt(l.slots, 10) || 0; if (l.level > 0 && n > 0) oldSlots[l.level] = n; });
  if (Object.keys(oldSlots).length && JSON.stringify(oldSlots) !== JSON.stringify(P.slots)) { ch.espaciosManuales = true; ch.espacios = oldSlots; }
  const cd = parseInt(m.cd, 10), at = parseInt(String(m.ataque || '').replace('+', ''), 10);
  if (!isNaN(cd) && P.cd != null && cd !== P.cd) ch.extraCD = cd - P.cd;
  if (!isNaN(at) && P.atk != null && at !== P.atk) ch.extraAtaque = at - P.atk;
  return normChar(ch);
}

export const emptyDb = () => ({ schema: SCHEMA, catalog: {}, chars: [], activeId: null });
/** Hoja de ejemplo de Theo: ya no se usa al instalar (la app empieza vacía); se conserva para pruebas. */
export function seedDb() {
  const d = { schema: SCHEMA, catalog: {}, chars: [] };
  const ch = charFromV1(d, HOJA_THEO);
  d.chars.push(ch); d.activeId = ch.id;
  return normDb(d);
}

/** Lee lo guardado en cualquier versión. Devuelve {db, migrated}. */
export function fromStored(rawV2, rawV1) {
  try { if (rawV2) { const d = JSON.parse(rawV2); if (d?.schema === SCHEMA) return { db: normDb(d), migrated: false }; } } catch { /* datos corruptos: se ignoran */ }
  try {
    if (rawV1) { const v1 = JSON.parse(rawV1);
      if (v1?.levels) { const d = { schema: SCHEMA, catalog: {}, chars: [] }; const ch = charFromV1(d, v1); d.chars.push(ch); d.activeId = ch.id; return { db: normDb(d), migrated: true }; } }
  } catch { /* idem */ }
  return { db: emptyDb(), migrated: false };
}
