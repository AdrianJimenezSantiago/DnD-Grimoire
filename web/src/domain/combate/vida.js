// Puntos de golpe, daño, curación, PG temporales, salvaciones contra muerte, estados, agotamiento y duraciones.
import { norm, uid } from '../../core/util.js';
import { statsEfectivos } from '../equipo/objetosEfecto.js';
import { normEfectos, EFECTO, efectoDeConjuro } from './efectos.js';
import { modOf, clasesDe, dotesDe, nivelTotal } from '../reglas/reglas2024.js';
import { CLASES_INFO } from '../clases/clases2024.js';

export const ESTADOS = [
  ['agarrado', 'Agarrado', 'Velocidad 0; desventaja al atacar a quien no te agarra.'],
  ['apresado', 'Apresado', 'Velocidad 0; ataques contra ti con ventaja; tus ataques y salvaciones de Destreza, con desventaja.'],
  ['asustado', 'Asustado', 'Desventaja en pruebas y ataques mientras veas la fuente; no puedes acercarte a ella.'],
  ['aturdido', 'Aturdido', 'Incapacitado; fallas las salvaciones de Fuerza y Destreza; los ataques contra ti tienen ventaja.'],
  ['cegado', 'Cegado', 'Fallas lo que requiere vista; tus ataques con desventaja y los que recibes, con ventaja.'],
  ['derribado', 'Derribado', 'Solo te arrastras; desventaja al atacar; ventaja para quien te ataca a 1,5 m, desventaja si es a distancia.'],
  ['encantado', 'Encantado', 'No puedes atacar a quien te encanta ni dañarlo con rasgos o efectos mágicos; tiene ventaja en sus pruebas para interactuar socialmente contigo.'],
  ['ensordecido', 'Ensordecido', 'No oyes y fallas lo que requiere oído.'],
  ['envenenado', 'Envenenado', 'Desventaja en ataques y pruebas de característica.'],
  ['incapacitado', 'Incapacitado', 'Sin acciones, acciones adicionales ni reacciones; no puedes hablar; se rompe la concentración; desventaja en la iniciativa.'],
  ['inconsciente', 'Inconsciente', 'Incapacitado y derribado; sueltas lo que sostienes; velocidad 0; fallas Fuerza y Destreza; ataques contra ti con ventaja y críticos si impactan a 1,5 m.'],
  ['invisible', 'Invisible', 'Ventaja en iniciativa y en tus ataques; los ataques contra ti, con desventaja.'],
  ['paralizado', 'Paralizado', 'Incapacitado y velocidad 0; fallas Fuerza y Destreza; ataques contra ti con ventaja y críticos si impactan a 1,5 m.'],
  ['petrificado', 'Petrificado', 'Convertido en piedra: incapacitado y velocidad 0; fallas Fuerza y Destreza; ataques contra ti con ventaja; resistencia a todo el daño e inmune al estado envenenado.'],
];
export const NOMBRE_ESTADO = Object.fromEntries(ESTADOS.map(([k, n]) => [k, n]));
export const RESUMEN_ESTADO = Object.fromEntries(ESTADOS.map(([k, , t]) => [k, t]));

export const VIDA0 = () => ({ pg: null, temp: 0, maxManual: null, dadosUsados: {}, muerte: { exitos: 0, fallos: 0 }, estable: false, estados: [], agotamiento: 0, inspiracion: false, caida: null, efectos: [], maxExtra: [] });
export function normVida(v) {
  const x = { ...VIDA0(), ...(v && typeof v === 'object' ? v : {}) };
  x.pg = x.pg == null || x.pg === '' ? null : Math.max(0, parseInt(x.pg, 10) || 0);
  x.temp = Math.max(0, parseInt(x.temp, 10) || 0);
  x.maxManual = x.maxManual == null || x.maxManual === '' ? null : Math.max(1, parseInt(x.maxManual, 10) || 1);
  x.dadosUsados = Object.fromEntries(Object.entries(x.dadosUsados || {}).map(([k, n]) => [k, Math.max(0, parseInt(n, 10) || 0)]).filter(([, n]) => n));
  x.muerte = { exitos: Math.max(0, Math.min(3, x.muerte?.exitos | 0)), fallos: Math.max(0, Math.min(3, x.muerte?.fallos | 0)) };
  x.estable = !!x.estable;
  x.estados = [...new Set((Array.isArray(x.estados) ? x.estados : []).filter(k => NOMBRE_ESTADO[k]))];
  x.agotamiento = Math.max(0, Math.min(6, parseInt(x.agotamiento, 10) || 0));
  x.inspiracion = !!x.inspiracion;
  x.efectos = normEfectos(x.efectos);
  x.maxExtra = (Array.isArray(x.maxExtra) ? x.maxExtra : []).filter(m => m && (parseInt(m.n, 10) || 0) > 0).map(m => ({ id: String(m.id || uid('mx')), nombre: String(m.nombre || 'Aumento'), n: parseInt(m.n, 10) }));
  x.caida = x.caida && typeof x.caida === 'object' ? { t: +x.caida.t || 0, causa: String(x.caida.causa || ''), ronda: x.caida.ronda ?? null } : null;
  return x;
}
export const vidaDe = ch => (ch.vida && ch.vida.muerte && ch.vida.dadosUsados && Array.isArray(ch.vida.estados) && Array.isArray(ch.vida.efectos) && Array.isArray(ch.vida.maxExtra) ? ch.vida : (ch.vida = normVida(ch.vida)));

const tieneDote = (ch, nombre) => dotesDe(ch).some(d => norm(d.nombre) === norm(nombre));
export function pgMaximoCalculado(ch) {
  const cs = clasesDe(ch), con = modOf(statsEfectivos(ch).con), L = nivelTotal(ch);
  let pg = 0;
  cs.forEach((c, i) => {
    const dg = CLASES_INFO[c.clase]?.dg || 8;
    for (let n = 1; n <= c.nivel; n++) pg += Math.max(1, (i === 0 && n === 1 ? dg : dg / 2 + 1) + con);
  });
  if (tieneDote(ch, 'Duro')) pg += 2 * L;
  if (tieneDote(ch, 'Don de la fortaleza')) pg += 40;
  if (/^enan/.test(norm(ch.especie || ''))) pg += L;
  // Resistencia dracónica: +3 a nivel 3 de hechicero y +1 por cada nivel de hechicero después
  const drac = cs.find(c => c.clase === 'Hechicero' && /drac[oó]n/i.test(c.subclase || '') && c.nivel >= 3); if (drac) pg += drac.nivel;
  return Math.max(1, pg);
}
export const pgMaximoBase = ch => vidaDe(ch).maxManual ?? pgMaximoCalculado(ch);
export const maxExtra = ch => vidaDe(ch).maxExtra.reduce((s, m) => s + m.n, 0);
export const pgMaximo = ch => pgMaximoBase(ch) + maxExtra(ch);
export function aumentarMax(ch, { id = uid('mx'), nombre = 'Aumento', n }) {
  const v = vidaDe(ch), k = Math.max(0, parseInt(n, 10) || 0); if (!k || estadoVital(ch) === 'muerto') return null;
  const antes = pgActuales(ch), lleno = v.pg == null;
  v.maxExtra = v.maxExtra.filter(m => m.id !== id); v.maxExtra.push({ id, nombre, n: k });
  if (!lleno) v.pg = antes + k;
  if (antes === 0 && v.pg > 0) { v.muerte = { exitos: 0, fallos: 0 }; v.estable = false; }
  return id;
}
export function quitarMax(ch, id) {
  const v = vidaDe(ch), m = v.maxExtra.find(x => x.id === id); if (!m) return null;
  const antes = pgActuales(ch);
  v.maxExtra = v.maxExtra.filter(x => x.id !== id);
  if (v.pg != null) v.pg = Math.min(v.pg, pgMaximo(ch));
  else if (antes > pgMaximo(ch)) v.pg = null;
  return m;
}
export const pgActuales = ch => { const v = vidaDe(ch), max = pgMaximo(ch); return v.pg == null ? max : Math.min(v.pg, max); };

export function dadosDeGolpe(ch) {
  const v = vidaDe(ch), pool = new Map();
  for (const c of clasesDe(ch)) { const d = `d${CLASES_INFO[c.clase]?.dg || 8}`; pool.set(d, (pool.get(d) || 0) + c.nivel); }
  return [...pool.entries()].sort((a, b) => parseInt(b[0].slice(1), 10) - parseInt(a[0].slice(1), 10))
    .map(([dado, total]) => ({ dado, caras: parseInt(dado.slice(1), 10), total, quedan: Math.max(0, total - (v.dadosUsados[dado] || 0)) }));
}

export const cdConcentracion = dano => Math.min(30, Math.max(10, Math.floor(dano / 2)));

export const CAUSAS = { salvaciones: 'Tres fallos en las salvaciones contra muerte', masivo: 'Daño masivo', agotamiento: 'Agotamiento extremo', dano: 'Heridas recibidas a 0 PG' };
export function marcarCaida(ch, causa) {
  const v = vidaDe(ch); if (v.caida) return;
  v.caida = { t: Date.now(), causa, ronda: ch.combate?.activo ? ch.combate.ronda : null };
}
export function aplicarDano(ch, cantidad, { critico = false } = {}) {
  const v = vidaDe(ch), max = pgMaximo(ch), antes = pgActuales(ch), n = Math.max(0, Math.floor(cantidad) || 0);
  const r = { absorbido: 0, recibido: n, cayo: false, muerte: false, fallo: false, concentracion: null };
  if (!n || estadoVital(ch) === 'muerto') return r;
  r.absorbido = Math.min(v.temp, n); v.temp -= r.absorbido;
  const resto = n - r.absorbido;
  if (antes === 0 && resto > 0) {
    if (resto >= max) { v.muerte.fallos = 3; r.muerte = true; marcarCaida(ch, 'masivo'); }
    else { v.muerte.fallos = Math.min(3, v.muerte.fallos + (critico ? 2 : 1)); r.fallo = true; if (v.muerte.fallos >= 3) { r.muerte = true; marcarCaida(ch, 'dano'); } }
    v.estable = false;
  } else if (resto > 0) {
    const queda = antes - resto;
    if (queda <= 0) { r.cayo = true; if (-queda >= max) { r.muerte = true; v.muerte = { exitos: 0, fallos: 3 }; marcarCaida(ch, 'masivo'); } else v.muerte = { exitos: 0, fallos: 0 }; v.estable = false; }
    v.pg = Math.max(0, queda);
  }
  // Cazador implacable (explorador 13): el daño no rompe la concentración en Marca del cazador
  const implacable = norm(ch.play?.conc || '') === 'marca del cazador' && clasesDe(ch).some(c => c.clase === 'Explorador' && c.nivel >= 13);
  if (ch.play?.conc && n > 0 && !implacable) r.concentracion = { cd: cdConcentracion(n), conjuro: ch.play.conc };
  if (r.cayo || r.muerte) r.concentracion = r.concentracion ? { ...r.concentracion, perdida: true } : null;
  return r;
}
export function curar(ch, cantidad) {
  const v = vidaDe(ch), max = pgMaximo(ch), antes = pgActuales(ch), n = Math.max(0, Math.floor(cantidad) || 0);
  if (!n || estadoVital(ch) === 'muerto') return 0;
  const despues = Math.min(max, antes + n);
  v.pg = despues >= max ? null : despues;
  if (antes === 0 && despues > 0) { v.muerte = { exitos: 0, fallos: 0 }; v.estable = false; }
  return despues - antes;
}
export function ponerTemporales(ch, cantidad) {
  // Don de la salud plena: +5 cada vez que ganas PG temporales
  const v = vidaDe(ch), n0 = Math.max(0, Math.floor(cantidad) || 0), n = n0 && tieneDote(ch, 'Don de la salud plena') ? n0 + 5 : n0;
  const antes = v.temp; v.temp = Math.max(v.temp, n); return v.temp - antes;
}
export function fijarPg(ch, valor) {
  const v = vidaDe(ch), max = pgMaximo(ch), n = Math.max(0, Math.min(max, Math.floor(valor) || 0));
  v.pg = n >= max ? null : n;
  if (n > 0) { v.muerte = { exitos: 0, fallos: 0 }; v.estable = false; }
}

export function salvacionMuerte(ch, d20, total = d20) {
  const v = vidaDe(ch), e = estadoVital(ch);
  if (e === 'muerto') return 'muere';
  if (e !== 'moribundo') return 'nada';
  if (d20 === 20) { v.pg = 1; v.muerte = { exitos: 0, fallos: 0 }; v.estable = false; return 'revive'; }
  if (d20 === 1) v.muerte.fallos = Math.min(3, v.muerte.fallos + 2);
  else if (total >= 10) v.muerte.exitos = Math.min(3, v.muerte.exitos + 1);
  else v.muerte.fallos = Math.min(3, v.muerte.fallos + 1);
  if (v.muerte.fallos >= 3) { marcarCaida(ch, 'salvaciones'); return 'muere'; }
  if (v.muerte.exitos >= 3) { v.estable = true; v.muerte = { exitos: 0, fallos: 0 }; return 'estable'; }
  return total >= 10 ? 'exito' : 'fallo';
}
export const estadoVital = ch => {
  const v = vidaDe(ch);
  if (v.muerte.fallos >= 3 || v.agotamiento >= 6) return 'muerto';
  if (pgActuales(ch) > 0) return 'vivo';
  return v.estable ? 'estable' : 'moribundo';
};

export function gastarDadoGolpe(ch, dado, tirada) {
  const v = vidaDe(ch), d = dadosDeGolpe(ch).find(x => x.dado === dado);
  if (!d || !d.quedan) return null;
  v.dadosUsados[dado] = (v.dadosUsados[dado] || 0) + 1;
  // Don de la salud plena: el dado de golpe da su máximo
  const plena = tieneDote(ch, 'Don de la salud plena'), valor = plena ? d.caras : tirada;
  const total = Math.max(1, valor + modOf(statsEfectivos(ch).con));
  const ganado = curar(ch, total);
  return { total, ganado, plena };
}

export function revivir(ch) {
  const v = vidaDe(ch);
  v.muerte = { exitos: 0, fallos: 0 }; v.estable = false; v.pg = 1; v.temp = 0; v.caida = null;
  if (v.agotamiento >= 6) v.agotamiento = 5;
  v.estados = v.estados.filter(k => k !== 'inconsciente');
}
export function descansoLargoVida(ch) {
  const v = vidaDe(ch);
  const antes = { pg: pgActuales(ch), agotamiento: v.agotamiento, dados: Object.values(v.dadosUsados).reduce((a, b) => a + b, 0) };
  if (estadoVital(ch) === 'muerto') return antes;
  v.pg = null; v.temp = 0; v.dadosUsados = {}; v.muerte = { exitos: 0, fallos: 0 }; v.estable = false;
  v.agotamiento = Math.max(0, v.agotamiento - 1); v.efectos = []; v.maxExtra = [];
  return antes;
}

export function ponerEfecto(ch, k, { rondas, conc = '', n = 0, nombre } = {}) {
  const v = vidaDe(ch), e = EFECTO[k]; if (!e) return null;
  const previo = v.efectos.find(x => x.k === k);
  if (previo && e.maxPg) quitarMax(ch, previo.id);
  const id = uid('ef'), r = rondas === undefined ? e.dur ?? null : rondas;
  v.efectos = normEfectos([...v.efectos.filter(x => x.k !== k), { id, k, nombre: nombre || e.nombre, rondas: r, conc }]);
  if (n && e.maxPg) aumentarMax(ch, { id, nombre: e.nombre, n });
  return id;
}
function quitarEfectos(ch, fuera) {
  const v = vidaDe(ch), ids = new Set(fuera.map(e => e.id));
  for (const e of fuera) quitarMax(ch, e.id);
  v.efectos = v.efectos.filter(e => !ids.has(e.id));
  return fuera.map(e => ({ id: e.id, k: e.k, nombre: e.nombre, bueno: EFECTO[e.k]?.bueno ?? true, ico: EFECTO[e.k]?.ico || 'inspiracion', conc: e.conc || '' }));
}
export function pasarRonda(ch) {
  const v = vidaDe(ch), fuera = [];
  for (const e of v.efectos) { if (e.rondas == null) continue; e.rondas -= 1; if (e.rondas <= 0) fuera.push(e); }
  const out = quitarEfectos(ch, fuera), pl = ch.play;
  if (pl?.conc && pl.concRondas != null) {
    pl.concRondas -= 1;
    if (pl.concRondas <= 0) { const nombre = pl.conc; out.unshift({ id: 'conc', k: '', nombre, bueno: true, ico: 'esc_adi', conc: nombre, finConc: true }, ...soltarConc(ch)); }
  }
  return out;
}
const UNIDAD = [[/^(asaltos?|rondas?|rounds?)$/, 1], [/^(min|minutos?|minutes?)$/, 10], [/^(h|horas?|hours?)$/, 600], [/^(d[ií]as?|days?)$/, 14400]];
export function rondasDeDuracion(texto) {
  const m = String(texto || '').toLowerCase().replace(/\b[li](?=\s*(?:min|h\b|hora|ronda|asalto|d[ií]a))/g, '1').match(/(\d+)\s*([a-záéíóúñ]+)/); if (!m) return null;
  const u = UNIDAD.find(([re]) => re.test(m[2]));
  return u ? parseInt(m[1], 10) * u[1] : null;
}
export const ESTADOS_INCAP = ['incapacitado', 'aturdido', 'inconsciente', 'paralizado', 'petrificado'];
export function efectosDeConc(ch, conjuro) { return vidaDe(ch).efectos.filter(e => e.conc && (conjuro == null || e.conc === conjuro)); }
export function soltarConc(ch) {
  const c = ch.play?.conc || '';
  if (ch.play) { ch.play.conc = ''; ch.play.concObj = []; ch.play.concRondas = null; }
  return c ? quitarEfectos(ch, efectosDeConc(ch, c)) : [];
}
export function cambiarConc(ch, nombre, rondas = null) {
  const antes = ch.play.conc, fuera = antes && antes !== nombre ? quitarEfectos(ch, efectosDeConc(ch, antes)) : [];
  if (antes !== nombre) ch.play.concObj = [];
  ch.play.conc = nombre; ch.play.concRondas = rondas;
  return fuera;
}

// Objetivos de un conjuro: si entre ellos estás tú (tu nombre, o «yo»), el efecto se te aplica solo
const PALABRAS_YO = new Set(['yo', 'mi', 'mi mismo', 'mi misma', 'yo mismo', 'yo misma', 'tu', 'tu mismo', 'tu misma']);
export function esYo(ch, texto) {
  const t = norm(texto).replace(/\(.*?\)/g, '').replace(/[.!¡¿?]/g, '').replace(/\s+/g, ' ').trim(); if (!t) return false;
  if (PALABRAS_YO.has(t)) return true;
  const nom = norm(ch?.nombre).replace(/\s+/g, ' ').trim(); if (!nom) return false;
  return t === nom || t === nom.split(' ')[0];
}
export const listaObjetivos = (play, clave) => (clave === 'conc' ? play?.concObj : play?.efectos?.find(e => e.id === clave)?.objetivos);
export const conjuroDeObjetivos = (play, clave) => (clave === 'conc' ? play?.conc : play?.efectos?.find(e => e.id === clave)?.nombre) || '';
// Devuelve 'pone', 'quita' o '' según haya cambiado el efecto sobre ti
// L: nivel del espacio, para los efectos que suben los PG máximos (Auxilio)
export function sincronizarYo(ch, clave, { L } = {}) {
  const pl = ch.play, lista = listaObjetivos(pl, clave), nombre = conjuroDeObjetivos(pl, clave), ef = efectoDeConjuro(nombre);
  if (!lista || !ef) return '';
  const yo = lista.some(o => esYo(ch, o)), conc = clave === 'conc' ? nombre : '', ya = vidaDe(ch).efectos.find(e => e.k === ef.k);
  if (yo && !ya) { ponerEfecto(ch, ef.k, { conc, rondas: conc && pl.concRondas != null ? pl.concRondas : undefined, n: ef.maxPg ? ef.maxPg * Math.max(1, (L || 2) - 1) : 0 }); return 'pone'; }
  if (!yo && ya && ya.conc === conc) { quitarEfectos(ch, [ya]); return 'quita'; }
  return '';
}
