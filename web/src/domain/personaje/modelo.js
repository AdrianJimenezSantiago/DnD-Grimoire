// Modelo de datos: forma de un personaje y de la base de datos, normalización de datos antiguos,
// importación y migración desde la primera versión.
import { clamp, clone, uid } from '../../core/util.js';
import { perfil } from '../reglas/reglas2024.js';
import { HOJA_THEO } from './ejemplo.js';
import { limpiarConjuro, usoGratis } from '../conjuros/validar.js';
import { normEquipo } from '../equipo/equipo.js';
import { habilidadesTrasfondo, HABILIDADES } from '../reglas/habilidades.js';
import { normVida } from '../combate/vida.js';
import { normCriatura } from '../criaturas/bestiario.js';
import { TIPOS as TIPOS_NOTA } from './diario.js';
import { normCombate } from '../combate/combate.js';
import { normOrdenes } from '../clases/ordenes.js';
import { normVariantes } from '../clases/variantes.js';
import { normOpciones } from '../clases/opcionesRasgo.js';

export const ESQUEMA = 2;
export const CAMPOS_CATALOGO = ['es', 'en', 'escuela', 'tiempo', 'alcance', 'duracion', 'comp', 'coste', 'efecto', 'desc', 'sup'];
export const CAMPOS_LIBRO = ['fuente', 'gratis'];
export const THEO = {
  nombre: 'Theo', especie: 'Humano', trasfondo: 'Erudito', clase: 'Mago', subclase: 'Adivino', nivel: 6,
  stats: { fue: 8, des: 14, con: 15, int: 18, sab: 12, car: 8 },
  lema: '«Escribe todo. Tacha lo que se cumpla. _Subraya lo que necesites recordar._» Aldrick',
  campana: 'Crónicas de La Argos, Aequus. Temporada 2026/2027',
};
const STATS0 = { fue: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 };
const PLAY0 = () => ({ used: {}, conc: '', concObj: [], concRondas: null, efectos: [], rec: {}, log: [] });

export const claveConjuro = s => `${((s.en || '').trim() || (s.es || '').trim()).toLowerCase()}|${s.level}`;

const esObjeto = x => !!x && typeof x === 'object' && !Array.isArray(x);
export const RETRATO_OK = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

export function personajeVacio(over = {}) {
  return {
    id: uid('c'), nombre: '', especie: '', trasfondo: '', clase: 'Mago', subclase: '', nivel: 1,
    stats: { ...STATS0 }, aptitud: '', extraCD: 0, extraAtaque: 0,
    espaciosManuales: false, espacios: {}, lema: '', campana: '', notas: '',
    book: [], rasgos: [], rasgosOff: [], rasgosOcultos: [], play: PLAY0(), multiclase: [], dotes: [],
    retrato: null, historia: '', diario: { sesiones: [] }, equipo: { objetos: [] }, bestiario: { criaturas: [] },
    habilidades: null, salvacionesExtra: [], vida: null, combate: null, creacion: null, herramientas: [], idiomas: [], maestrias: [], maniobras: [], ordenes: {}, variantes: {}, opciones: {},
    ...clone(over),
  };
}

export function normPersonaje(c) {
  const sinOcultos = !Array.isArray(c?.rasgosOcultos), sinHabilidades = !c?.habilidades || typeof c.habilidades !== 'object';
  c = { ...personajeVacio(), ...c };
  c.stats = { ...STATS0, ...(c.stats || {}) };
  c.play = { ...PLAY0(), ...(c.play || {}) };
  c.play.used ||= {}; c.play.rec ||= {};
  if (!Array.isArray(c.play.concObj)) c.play.concObj = [];
  c.play.concObj = c.play.concObj.filter(o => typeof o === 'string');
  c.play.conc = typeof c.play.conc === 'string' ? c.play.conc : '';
  c.play.efectos = (Array.isArray(c.play.efectos) ? c.play.efectos : []).filter(e => esObjeto(e) && e.id != null && typeof e.nombre === 'string')
    .map(e => ({ ...e, nota: typeof e.nota === 'string' ? e.nota : '', objetivos: (Array.isArray(e.objetivos) ? e.objetivos : []).filter(o => typeof o === 'string') }));
  if (!c.play.conc) c.play.concObj = [];
  c.play.concRondas = c.play.conc && c.play.concRondas != null ? Math.max(1, parseInt(c.play.concRondas, 10) || 1) : null;
  c.play.log = (Array.isArray(c.play.log) ? c.play.log : []).filter(esObjeto);
  if (!Array.isArray(c.rasgos)) c.rasgos = [];
  if (!Array.isArray(c.rasgosOff)) c.rasgosOff = [];
  if (sinOcultos) {
    const sust = id => c.rasgos.some(r => r.desde === id);
    c.rasgosOcultos = c.rasgosOff.filter(id => !sust(id)); c.rasgosOff = c.rasgosOff.filter(sust);
  }
  if (Array.isArray(c.play.presagio) && c.play.presagio.length && !c.play.rec['tpl:adivino.presagio']) c.play.rec['tpl:adivino.presagio'] = { used: 0, dice: c.play.presagio };
  if (c.play.recupUsed && !c.play.rec['tpl:mago.recuperacion']) c.play.rec['tpl:mago.recuperacion'] = { used: 1, dice: [] };
  delete c.play.presagio; delete c.play.recupUsed; delete c.play.onlyPrep;
  if (!c.diario || !Array.isArray(c.diario.sesiones)) c.diario = { sesiones: [] };
  c.diario.sesiones = c.diario.sesiones.filter(esObjeto).map((s, i) => ({ ...s, n: Math.max(1, parseInt(s.n, 10) || i + 1), fecha: String(s.fecha || ''), titulo: String(s.titulo || ''), texto: String(s.texto || ''),
    notas: (Array.isArray(s.notas) ? s.notas : []).filter(esObjeto).map(nt => ({ ...nt, tipo: TIPOS_NOTA[nt.tipo] ? nt.tipo : 'nota', texto: String(nt.texto || ''), hecho: !!nt.hecho, fijada: !!nt.fijada })) }));
  if (typeof c.historia !== 'string') c.historia = '';
  if (!c.equipo || !Array.isArray(c.equipo.objetos)) c.equipo = { objetos: [] };
  normEquipo(c);
  c.bestiario = { ...(esObjeto(c.bestiario) ? c.bestiario : {}), criaturas: (Array.isArray(c.bestiario?.criaturas) ? c.bestiario.criaturas : []).map(normCriatura).filter(Boolean) };
  // El retrato solo puede ser una imagen incrustada (la que guarda la app); ni enlaces externos ni nada que no sea imagen
  if (!esObjeto(c.retrato) || !RETRATO_OK.test(String(c.retrato.src || ''))) c.retrato = null;
  c.nivel = clamp(parseInt(c.nivel, 10) || 1, 1, 20);
  c.multiclase = (Array.isArray(c.multiclase) ? c.multiclase : []).filter(m => m && m.clase && m.clase !== c.clase)
    .filter((m, i, a) => a.findIndex(x => x.clase === m.clase) === i).map(m => ({ clase: m.clase, subclase: String(m.subclase || ''), nivel: clamp(parseInt(m.nivel, 10) || 1, 1, 19) }));
  c.dotes = [...new Set((Array.isArray(c.dotes) ? c.dotes : []).map(d => String(d || '').trim()).filter(Boolean))];
  c.book = (c.book || []).filter(e => e && e.sid);
  if (sinHabilidades) c.habilidades = Object.fromEntries(habilidadesTrasfondo(c).map(k => [k, 1]));
  c.habilidades = Object.fromEntries(HABILIDADES.map(([k]) => [k, Math.max(0, Math.min(2, parseInt(c.habilidades[k], 10) || 0))]).filter(([, n]) => n));
  c.salvacionesExtra = [...new Set((Array.isArray(c.salvacionesExtra) ? c.salvacionesExtra : []).filter(k => ['fue', 'des', 'con', 'int', 'sab', 'car'].includes(k)))];
  c.creacion = normCreacion(c.creacion);
  for (const k of ['herramientas', 'idiomas', 'maestrias', 'maniobras']) c[k] = [...new Set((Array.isArray(c[k]) ? c[k] : []).map(x => String(x || '').trim()).filter(Boolean))];
  c.vida = normVida(c.vida);
  c.ordenes = normOrdenes(c.ordenes);
  c.variantes = normVariantes(c.variantes);
  c.opciones = normOpciones(c.opciones);
  c.combate = normCombate(c.combate);
  return c;
}

const METODOS_CAR = ['matriz', 'compra', 'tiradas', 'libre'];
function normCreacion(x) {
  if (!x || typeof x !== 'object' || !x.base) return null;
  const n = (v, lo, hi, d) => clamp(parseInt(v, 10) || d, lo, hi);
  return { metodo: METODOS_CAR.includes(x.metodo) ? x.metodo : 'libre', base: Object.fromEntries(Object.keys(STATS0).map(k => [k, n(x.base[k], 1, 30, 10)])),
    bonos: Object.fromEntries(Object.entries(x.bonos || {}).filter(([k, v]) => k in STATS0 && (v === 1 || v === 2))),
    tiradas: (Array.isArray(x.tiradas) ? x.tiradas : []).slice(0, 6).map(t => n(t, 3, 18, 10)) };
}

// Lo que llega de fuera (una copia, un personaje exportado, lo guardado) puede venir manipulado. Los identificadores
// van en atributos del HTML y en nombres de archivo (retrato-<id>.txt), así que todo id con caracteres que podrían salirse
// de un atributo o de la carpeta de la app (< > " ' ` & / \ o de control) se cambia por uno nuevo, el mismo en toda la
// base para que las referencias sigan enlazando. Los ids que crea la app («s_…», «tpl:mago.recuperacion») no cambian.
const ID_OK = /^[^<>"'`&\\/\u0000-\u001f]{1,120}$/;
function sanearIds(d) {
  const malos = new Map();
  const recoger = o => {
    if (Array.isArray(o)) return o.forEach(x => recoger(x));
    if (!esObjeto(o)) return;
    for (const [kk, v] of Object.entries(o)) {
      if ((kk === 'id' || kk === 'sid') && typeof v === 'string' && !ID_OK.test(v) && !malos.has(v)) malos.set(v, uid('x'));
      else if ((kk === 'id' || kk === 'sid') && v != null && typeof v !== 'string' && typeof v !== 'number') o[kk] = uid('x');
      recoger(v);
    }
  };
  for (const k of Object.keys(d.catalog)) if (!ID_OK.test(k) && !malos.has(k)) malos.set(k, uid('x'));
  recoger(d.chars); recoger(d.catalog);
  if (!malos.size) return;
  const cambiar = o => {
    if (Array.isArray(o)) { o.forEach((v, i) => { if (typeof v === 'string' && malos.has(v)) o[i] = malos.get(v); else cambiar(v); }); return; }
    if (!esObjeto(o)) return;
    for (const [k, v] of Object.entries(o)) { if (typeof v === 'string' && malos.has(v)) o[k] = malos.get(v); else cambiar(v); }
  };
  d.catalog = Object.fromEntries(Object.entries(d.catalog).map(([k, s]) => [malos.get(k) || k, s]));
  cambiar(d.chars); cambiar(d.catalog);
  if (typeof d.activeId === 'string' && malos.has(d.activeId)) d.activeId = malos.get(d.activeId);
}

export function normBd(d) {
  d.schema = ESQUEMA;
  if (!esObjeto(d.catalog)) d.catalog = {};
  d.catalog = Object.fromEntries(Object.entries(d.catalog).filter(([, s]) => esObjeto(s)));
  d.chars = (Array.isArray(d.chars) ? d.chars : []).filter(esObjeto);
  sanearIds(d);
  Object.values(d.catalog).forEach(s => { CAMPOS_CATALOGO.forEach(f => { if (s[f] == null) s[f] = ''; }); limpiarConjuro(s); });
  Object.values(d.catalog).forEach(s => {
    if (s.es === 'Guía' && s.en === 'True Strike') { s.en = 'Guidance'; s.srd = 'srd-2024_guidance'; }
    else if (s.es === 'Impacto certero' && s.en === 'Guidance') { s.en = 'True Strike'; s.srd = 'srd-2024_true-strike'; }
  });
  d.chars = d.chars.map(normPersonaje);
  d.chars.forEach(c => c.book.forEach(e => { e.gratis = usoGratis(e.gratis); if (!e.gratis) e.used = false; }));
  d.chars.forEach(c => { c.book = c.book.filter(e => d.catalog[e.sid]); });
  if (!d.chars.some(c => c.id === d.activeId)) d.activeId = d.chars[0]?.id ?? null;
  return d;
}

export function guardarConjuro(d, s) {
  const k = claveConjuro(s);
  const hit = Object.values(d.catalog).find(x => claveConjuro(x) === k);
  if (hit) return hit.id;
  const id = uid('s');
  d.catalog[id] = { id, level: s.level, ritual: !!s.ritual, conc: !!s.conc };
  CAMPOS_CATALOGO.forEach(f => { d.catalog[id][f] = s[f] || ''; });
  return id;
}

export function personajeDeV1(d, v1) {
  const m = v1.meta || {};
  const nivel = parseInt((String(m.sub || '').match(/nivel\s+(\d+)/i) || [])[1], 10) || THEO.nivel;
  const ch = personajeVacio({ ...THEO, nombre: (m.nombre || THEO.nombre).trim(), nivel });
  (v1.levels || []).forEach(l => (l.spells || []).forEach(s => {
    const sid = guardarConjuro(d, { ...s, level: l.level });
    ch.book.push({ sid, prep: !!s.prep, always: !!s.always || (l.level === 0 && /iniciado|dote|especie/i.test(s.fuente || '')),
      fuente: s.fuente || '', gratis: s.gratis || '', used: !!s.used });
  }));
  ch.play = { ...PLAY0(), used: { ...(v1.used || {}) }, conc: v1.conc || '', recupUsed: !!v1.recupUsed };
  const P = perfil(ch);
  const oldSlots = {};
  (v1.levels || []).forEach(l => { const n = parseInt(l.slots, 10) || 0; if (l.level > 0 && n > 0) oldSlots[l.level] = n; });
  if (Object.keys(oldSlots).length && JSON.stringify(oldSlots) !== JSON.stringify(P.slots)) { ch.espaciosManuales = true; ch.espacios = oldSlots; }
  const cd = parseInt(m.cd, 10), at = parseInt(String(m.ataque || '').replace('+', ''), 10);
  if (!isNaN(cd) && P.cd != null && cd !== P.cd) ch.extraCD = cd - P.cd;
  if (!isNaN(at) && P.atk != null && at !== P.atk) ch.extraAtaque = at - P.atk;
  return normPersonaje(ch);
}

export function importarPersonaje(db, paquete) {
  const mapa = {};
  for (const [sid, x] of Object.entries(paquete.conjuros || {})) if (x) mapa[sid] = guardarConjuro(db, x);
  const c = normPersonaje({ ...clone(paquete.personaje), id: uid('c'), prueba: false });
  c.book = c.book.filter(e => mapa[e.sid]).map(e => ({ ...e, sid: mapa[e.sid] }));
  if (db.chars.some(x => x.nombre === c.nombre)) c.nombre += ' (importado)';
  db.chars.push(c); db.activeId = c.id;
  return c;
}

export const bdVacia = () => ({ schema: ESQUEMA, catalog: {}, chars: [], activeId: null });
export function bdDeEjemplo() {
  const d = { schema: ESQUEMA, catalog: {}, chars: [] };
  const ch = personajeDeV1(d, HOJA_THEO);
  d.chars.push(ch); d.activeId = ch.id;
  return normBd(d);
}

export function cargarGuardado(rawV2, rawV1) {
  // Si lo guardado no se puede leer, se avisa con «fallo» para apartarlo antes de que el primer guardado lo pise
  let fallo = false;
  try { if (rawV2) { const d = JSON.parse(rawV2); if (d?.schema === ESQUEMA) return { db: normBd(d), migrated: false }; fallo = true; } } catch { fallo = true; }
  try {
    if (rawV1) { const v1 = JSON.parse(rawV1);
      if (v1?.levels) { const d = { schema: ESQUEMA, catalog: {}, chars: [] }; const ch = personajeDeV1(d, v1); d.chars.push(ch); d.activeId = ch.id; return { db: normBd(d), migrated: true, fallo }; } }
  } catch {}
  return { db: bdVacia(), migrated: false, fallo };
}
