import { norm } from '../core/util.js';
import { modOf, clasesDe, dotesDe, nivelTotal } from './reglas2024.js';
import { CLASES_INFO } from './clases2024.js';

export const ESTADOS = [
  ['agarrado', 'Agarrado', 'Velocidad 0; desventaja al atacar a quien no te agarra.'],
  ['apresado', 'Apresado', 'Velocidad 0; ataques contra ti con ventaja; tus ataques y salvaciones de Destreza, con desventaja.'],
  ['asustado', 'Asustado', 'Desventaja en pruebas y ataques mientras veas la fuente; no puedes acercarte a ella.'],
  ['aturdido', 'Aturdido', 'Incapacitado; fallas las salvaciones de Fuerza y Destreza; ataques contra ti con ventaja.'],
  ['cegado', 'Cegado', 'Fallas lo que requiere vista; tus ataques con desventaja y los que recibes, con ventaja.'],
  ['derribado', 'Derribado', 'Solo te arrastras; desventaja al atacar; ventaja para quien te ataca a 1,5 m, desventaja si es a distancia.'],
  ['encantado', 'Encantado', 'No puedes atacar a quien te encanta; tiene ventaja en sus pruebas sociales contigo.'],
  ['ensordecido', 'Ensordecido', 'No oyes y fallas lo que requiere oído.'],
  ['envenenado', 'Envenenado', 'Desventaja en ataques y pruebas de característica.'],
  ['incapacitado', 'Incapacitado', 'Sin acciones, acciones adicionales ni reacciones; se rompe la concentración.'],
  ['inconsciente', 'Inconsciente', 'Incapacitado y derribado; fallas Fuerza y Destreza; los golpes a 1,5 m son críticos.'],
  ['invisible', 'Invisible', 'Ventaja en iniciativa y en tus ataques; los ataques contra ti, con desventaja.'],
  ['paralizado', 'Paralizado', 'Incapacitado y velocidad 0; fallas Fuerza y Destreza; los golpes a 1,5 m son críticos.'],
  ['petrificado', 'Petrificado', 'Convertido en piedra: incapacitado, resistencia a todo el daño, inmune a veneno.'],
];
export const NOMBRE_ESTADO = Object.fromEntries(ESTADOS.map(([k, n]) => [k, n]));
export const RESUMEN_ESTADO = Object.fromEntries(ESTADOS.map(([k, , t]) => [k, t]));

export const VIDA0 = () => ({ pg: null, temp: 0, maxManual: null, dadosUsados: {}, muerte: { exitos: 0, fallos: 0 }, estable: false, estados: [], agotamiento: 0, inspiracion: false, caida: null });
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
  x.caida = x.caida && typeof x.caida === 'object' ? { t: +x.caida.t || 0, causa: String(x.caida.causa || ''), ronda: x.caida.ronda ?? null } : null;
  return x;
}
export const vidaDe = ch => (ch.vida && ch.vida.muerte && ch.vida.dadosUsados && Array.isArray(ch.vida.estados) ? ch.vida : (ch.vida = normVida(ch.vida)));

const tieneDote = (ch, nombre) => dotesDe(ch).some(d => norm(d.nombre) === norm(nombre));
export function pgMaximoCalculado(ch) {
  const cs = clasesDe(ch), con = modOf(ch.stats?.con), L = nivelTotal(ch);
  let pg = 0;
  cs.forEach((c, i) => {
    const dg = CLASES_INFO[c.clase]?.dg || 8;
    for (let n = 1; n <= c.nivel; n++) pg += Math.max(1, (i === 0 && n === 1 ? dg : dg / 2 + 1) + con);
  });
  if (tieneDote(ch, 'Duro')) pg += 2 * L;
  if (/^enan/.test(norm(ch.especie || ''))) pg += L;
  return Math.max(1, pg);
}
export const pgMaximo = ch => vidaDe(ch).maxManual ?? pgMaximoCalculado(ch);
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
  if (ch.play?.conc && n > 0) r.concentracion = { cd: cdConcentracion(n), conjuro: ch.play.conc };
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
  const v = vidaDe(ch), n = Math.max(0, Math.floor(cantidad) || 0);
  const antes = v.temp; v.temp = Math.max(v.temp, n); return v.temp - antes;
}
export function fijarPg(ch, valor) {
  const v = vidaDe(ch), max = pgMaximo(ch), n = Math.max(0, Math.min(max, Math.floor(valor) || 0));
  v.pg = n >= max ? null : n;
  if (n > 0) { v.muerte = { exitos: 0, fallos: 0 }; v.estable = false; }
}

export function salvacionMuerte(ch, d20) {
  const v = vidaDe(ch), e = estadoVital(ch);
  if (e === 'muerto') return 'muere';
  if (e !== 'moribundo') return 'nada';
  if (d20 === 20) { v.pg = 1; v.muerte = { exitos: 0, fallos: 0 }; v.estable = false; return 'revive'; }
  if (d20 === 1) v.muerte.fallos = Math.min(3, v.muerte.fallos + 2);
  else if (d20 >= 10) v.muerte.exitos = Math.min(3, v.muerte.exitos + 1);
  else v.muerte.fallos = Math.min(3, v.muerte.fallos + 1);
  if (v.muerte.fallos >= 3) { marcarCaida(ch, 'salvaciones'); return 'muere'; }
  if (v.muerte.exitos >= 3) { v.estable = true; v.muerte = { exitos: 0, fallos: 0 }; return 'estable'; }
  return d20 >= 10 ? 'exito' : 'fallo';
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
  const total = Math.max(1, tirada + modOf(ch.stats?.con));
  const ganado = curar(ch, total);
  return { total, ganado };
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
  v.agotamiento = Math.max(0, v.agotamiento - 1);
  return antes;
}
