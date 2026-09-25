import { uid } from '../core/util.js';
import { claseArmadura } from './equipo.js';
import { velocidad, abDe } from './habilidades.js';

const R = (sobre, efecto, extra = {}) => ({ sobre, efecto, ...extra });
export const REGLAS_ESTADO = {
  agarrado: { vel0: true, reglas: [R('ataque', 'desventaja', { cond: 'si atacas a alguien que no sea quien te agarra' })] },
  apresado: { vel0: true, reglas: [R('ataque', 'desventaja'), R('salvacion', 'desventaja', { ab: 'des' })] },
  asustado: { reglas: [R('ataque', 'desventaja', { cond: 'mientras veas la fuente de tu miedo' }), R('prueba', 'desventaja', { cond: 'mientras veas la fuente de tu miedo' })] },
  aturdido: { incap: true, reglas: [R('salvacion', 'falla', { ab: 'fue' }), R('salvacion', 'falla', { ab: 'des' })] },
  cegado: { reglas: [R('ataque', 'desventaja')] },
  derribado: { arrastra: true, reglas: [R('ataque', 'desventaja')] },
  encantado: { reglas: [] },
  ensordecido: { reglas: [] },
  envenenado: { reglas: [R('ataque', 'desventaja'), R('prueba', 'desventaja')] },
  incapacitado: { incap: true, reglas: [R('iniciativa', 'desventaja')] },
  inconsciente: { incap: true, vel0: true, reglas: [R('salvacion', 'falla', { ab: 'fue' }), R('salvacion', 'falla', { ab: 'des' })] },
  invisible: { reglas: [R('ataque', 'ventaja'), R('iniciativa', 'ventaja')] },
  paralizado: { incap: true, vel0: true, reglas: [R('salvacion', 'falla', { ab: 'fue' }), R('salvacion', 'falla', { ab: 'des' })] },
  petrificado: { incap: true, vel0: true, reglas: [R('salvacion', 'falla', { ab: 'fue' }), R('salvacion', 'falla', { ab: 'des' })] },
};

export const EFECTOS = [
  { k: 'bendicion', nombre: 'Bendición', bueno: true, ico: 'inspiracion', texto: '+1d4 a tus tiradas de ataque y de salvación.', reglas: [R('ataque', 'dado', { valor: '1d4' }), R('salvacion', 'dado', { valor: '1d4' })] },
  { k: 'guia', nombre: 'Guía', bueno: true, ico: 'inspiracion', texto: '+1d4 a las pruebas de la habilidad elegida.', reglas: [R('prueba', 'dado', { valor: '1d4', cond: 'si es de la habilidad elegida' })] },
  { k: 'acelerar', nombre: 'Acelerar', bueno: true, ico: 'velocidad', texto: '+2 a la CA, ventaja en salvaciones de Destreza, velocidad doble y una acción más (limitada).', ca: 2, velX: 2, reglas: [R('salvacion', 'ventaja', { ab: 'des' })] },
  { k: 'escudofe', nombre: 'Escudo de la fe', bueno: true, ico: 'ca', texto: '+2 a la CA.', ca: 2, reglas: [] },
  { k: 'escudo', nombre: 'Escudo', bueno: true, ico: 'ca', texto: '+5 a la CA hasta el inicio de tu siguiente turno.', ca: 5, reglas: [] },
  { k: 'pielrobliza', nombre: 'Piel robliza', bueno: true, ico: 'ca', texto: 'Tu CA no puede ser inferior a 17.', caMin: 17, reglas: [] },
  { k: 'agrandar', nombre: 'Agrandar', bueno: true, ico: 'fuerza', texto: 'Ventaja en pruebas y salvaciones de Fuerza y +1d4 al daño con armas.', danoArma: '1d4',
    reglas: [R('prueba', 'ventaja', { ab: 'fue' }), R('salvacion', 'ventaja', { ab: 'fue' })] },
  { k: 'zancada', nombre: 'Zancada prodigiosa', bueno: true, ico: 'velocidad', texto: '+3 m de velocidad.', vel: 3, reglas: [] },
  { k: 'pasarsinrastro', nombre: 'Pasar sin rastro', bueno: true, ico: 'ojo', texto: '+10 a las pruebas de Destreza (Sigilo).', reglas: [R('prueba', 'plano', { valor: 10, hab: 'sigilo' })] },
  { k: 'heroismo', nombre: 'Heroísmo', bueno: true, ico: 'inspiracion', texto: 'Inmune a asustado; al empezar cada turno ganas PG temporales iguales al modificador de quien lo lanzó.', reglas: [] },
  { k: 'auxilio', nombre: 'Auxilio', bueno: true, ico: 'pg', texto: 'Tus PG máximos y actuales aumentan en 5 (5 más por cada nivel de espacio por encima de 2).', maxPg: 5, reglas: [] },
  { k: 'proteccion', nombre: 'Protección contra el bien y el mal', bueno: true, ico: 'esc_abj', texto: 'Aberraciones, celestiales, elementales, feéricos, infernales y muertos vivientes tienen desventaja al atacarte y no pueden encantarte, asustarte ni poseerte.', reglas: [] },
  { k: 'perdicion', nombre: 'Perdición', bueno: false, ico: 'muerte', texto: '−1d4 a tus tiradas de ataque y de salvación.', reglas: [R('ataque', 'dado', { valor: '-1d4' }), R('salvacion', 'dado', { valor: '-1d4' })] },
  { k: 'ralentizar', nombre: 'Ralentizar', bueno: false, ico: 'md_tiempo', texto: '−2 a la CA y a las salvaciones de Destreza, velocidad a la mitad y sin reacciones.', ca: -2, velX: 0.5, reglas: [R('salvacion', 'plano', { valor: -2, ab: 'des' })] },
  { k: 'maleficio', nombre: 'Maleficio', bueno: false, ico: 'esc_nig', texto: 'Desventaja en las pruebas de la característica que elija quien lo lanzó.', reglas: [R('prueba', 'desventaja', { cond: 'si es de la característica elegida' })] },
];
export const EFECTO = Object.fromEntries(EFECTOS.map(e => [e.k, e]));

const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
export function normEfectos(lista) {
  return (Array.isArray(lista) ? lista : []).filter(e => e && (EFECTO[e.k] || e.propio)).map(e => ({ id: e.id || uid('ef'), k: e.k, nombre: String(e.nombre || EFECTO[e.k]?.nombre || 'Efecto'),
    propio: e.propio ? { ca: num(e.propio.ca), vel: num(e.propio.vel), ataque: String(e.propio.ataque || ''), salvacion: String(e.propio.salvacion || ''), prueba: String(e.propio.prueba || '') } : null }));
}
const esDado = v => /^[+-]?\d*d\d+$/i.test(String(v).replace(/\s/g, ''));
function reglasPropias(p) {
  const out = [];
  for (const sobre of ['ataque', 'salvacion', 'prueba']) {
    const v = String(p[sobre] || '').replace(/\s/g, ''); if (!v) continue;
    if (esDado(v)) out.push(R(sobre, 'dado', { valor: v.replace(/^\+/, '') })); else if (num(v)) out.push(R(sobre, 'plano', { valor: num(v) }));
  }
  return out;
}
export function efectosDe(ch) {
  const v = ch.vida || {};
  return (v.efectos || []).map(e => { const d = EFECTO[e.k]; return d ? { ...d, id: e.id } : { k: e.k || 'propio', id: e.id, nombre: e.nombre, bueno: true, ico: 'inspiracion', propio: e.propio,
    texto: [e.propio?.ca && `CA ${e.propio.ca > 0 ? '+' : ''}${e.propio.ca}`, e.propio?.ataque && `ataques ${e.propio.ataque}`, e.propio?.salvacion && `salvaciones ${e.propio.salvacion}`, e.propio?.prueba && `pruebas ${e.propio.prueba}`, e.propio?.vel && `velocidad ${e.propio.vel > 0 ? '+' : ''}${e.propio.vel} m`].filter(Boolean).join(', ') || 'Efecto propio.',
    ca: e.propio?.ca || 0, vel: e.propio?.vel || 0, reglas: reglasPropias(e.propio || {}) }; });
}
const estadosActivos = ch => (ch.vida?.estados || []).filter(k => REGLAS_ESTADO[k]);
export const incapacitado = ch => estadosActivos(ch).filter(k => REGLAS_ESTADO[k].incap);

export function modsTirada(ch, { sobre, ab = '', hab = '' }) {
  const abEf = ab || (hab ? abDe(hab) : sobre === 'iniciativa' ? 'des' : '');
  const aplica = r => {
    if (r.hab && r.hab !== hab) return false;
    if (r.ab && r.ab !== abEf) return false;
    if (r.sobre === sobre) return true;
    return r.sobre === 'prueba' && sobre === 'iniciativa';
  };
  const out = [];
  for (const k of estadosActivos(ch)) for (const r of REGLAS_ESTADO[k].reglas) if (aplica(r)) out.push({ fuente: k.charAt(0).toUpperCase() + k.slice(1), mal: r.efecto !== 'ventaja', ...r });
  for (const e of efectosDe(ch)) for (const r of e.reglas) if (aplica(r)) out.push({ fuente: e.nombre, mal: !e.bueno, ...r });
  const ago = Math.max(0, Math.min(6, parseInt(ch.vida?.agotamiento, 10) || 0));
  if (ago && sobre !== 'dano') out.push({ fuente: `Agotamiento ${ago}`, efecto: 'plano', valor: -2 * ago, mal: true });
  return out.map((m, i) => ({ ...m, id: `${m.fuente}|${m.efecto}|${i}`, on: true }));
}
export function resolverModo(mods) {
  const act = mods.filter(m => m.on), v = act.some(m => m.efecto === 'ventaja'), d = act.some(m => m.efecto === 'desventaja');
  return v && d ? 'normal' : v ? 'ventaja' : d ? 'desventaja' : 'normal';
}
export const falloAutomatico = mods => mods.find(m => m.on && m.efecto === 'falla') || null;

export function caEfectiva(ch) {
  const base = claseArmadura(ch), efs = efectosDe(ch);
  let ca = base.ca + efs.reduce((s, e) => s + (e.ca || 0), 0);
  const min = Math.max(0, ...efs.map(e => e.caMin || 0));
  const extra = efs.filter(e => e.ca || e.caMin).map(e => e.caMin ? `${e.nombre} (mín. ${e.caMin})` : `${e.nombre} ${e.ca > 0 ? '+' : ''}${e.ca}`);
  if (min > ca) ca = min;
  return { ca, base: base.ca, detalle: [base.detalle, ...extra].filter(Boolean).join(', '), cambia: ca !== base.ca };
}
export function velocidadEfectiva(ch) {
  const base = velocidad(ch), efs = efectosDe(ch), cero = estadosActivos(ch).filter(k => REGLAS_ESTADO[k].vel0);
  if (cero.length) return { m: 0, base, motivo: cero.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', '), cambia: base !== 0 };
  let m = base + efs.reduce((s, e) => s + (e.vel || 0), 0);
  for (const e of efs) if (e.velX) m *= e.velX;
  const arrastra = estadosActivos(ch).includes('derribado');
  return { m: Math.max(0, Math.round(m * 10) / 10), base, arrastra, motivo: efs.filter(e => e.vel || e.velX).map(e => e.nombre).join(', '), cambia: Math.abs(m - base) > 0.01 };
}
export const danoArmaExtra = ch => efectosDe(ch).map(e => e.danoArma).filter(Boolean);

export function resumenMods(ch) {
  const lineas = [];
  for (const [sobre, t] of [['ataque', 'Ataques'], ['salvacion', 'Salvaciones'], ['prueba', 'Pruebas'], ['iniciativa', 'Iniciativa']]) {
    const ms = modsTirada(ch, { sobre }).filter(m => !m.hab);
    const conAb = [...new Set([...estadosActivos(ch).flatMap(k => REGLAS_ESTADO[k].reglas), ...efectosDe(ch).flatMap(e => e.reglas)].filter(r => r.sobre === sobre && (r.ab || r.hab)).map(r => r.ab || r.hab))];
    for (const ab of conAb) for (const m of modsTirada(ch, { sobre, ab: ['fue', 'des', 'con', 'int', 'sab', 'car'].includes(ab) ? ab : '', hab: ['fue', 'des', 'con', 'int', 'sab', 'car'].includes(ab) ? '' : ab })) if ((m.ab || m.hab) && !ms.some(x => x.id === m.id)) ms.push(m);
    const piezas = ms.filter(m => !/^Agotamiento/.test(m.fuente)).map(m => ({ texto: fmtMod(m), mal: m.mal, fuente: m.fuente, cond: m.cond }));
    if (piezas.length) lineas.push({ sobre, titulo: t, piezas });
  }
  return lineas;
}
const AB = { fue: 'Fue', des: 'Des', con: 'Con', int: 'Int', sab: 'Sab', car: 'Car' };
export function fmtMod(m) {
  const que = m.efecto === 'ventaja' ? 'ventaja' : m.efecto === 'desventaja' ? 'desventaja' : m.efecto === 'falla' ? 'fallo automático' : m.efecto === 'dado' ? (String(m.valor).startsWith('-') ? `−${String(m.valor).slice(1)}` : `+${m.valor}`) : `${m.valor > 0 ? '+' : '−'}${Math.abs(m.valor)}`;
  return `${que}${m.ab ? ` (${AB[m.ab]})` : ''}${m.hab ? ` (${m.hab === 'sigilo' ? 'Sigilo' : m.hab})` : ''}`;
}

export function maxExtraTotal(ch) { return (ch.vida?.maxExtra || []).reduce((s, x) => s + (x.n || 0), 0); }
