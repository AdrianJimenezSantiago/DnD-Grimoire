import { norm } from '../core/util.js';
import { ABILS, TRASFONDOS_2024, clasesDe, dotesDe, nivelTotal } from './reglas2024.js';
import { CLASES_INFO } from './clases2024.js';
import { HABILIDADES, HAB_CLASE, habilidadesTrasfondo, periciasDisponibles } from './habilidades.js';

const KEYS = ABILS.map(([k]) => k);
const TODAS = HABILIDADES.map(([k]) => k);

// Puntuaciones de característica (Manual del Jugador 2024, capítulo 2)
export const MATRIZ = [15, 14, 13, 12, 10, 8];
export const COSTE = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const PUNTOS = 27;
export const METODOS = [
  ['matriz', 'Matriz estándar', '15, 14, 13, 12, 10 y 8 para repartir.'],
  ['compra', 'Compra de puntos', `${PUNTOS} puntos; cada puntuación entre 8 y 15.`],
  ['tiradas', 'Tirar dados', '4d6 seis veces, quitando el dado más bajo.'],
  ['libre', 'A mano', 'Escribe las puntuaciones que ya tengas.'],
];
export const costeCompra = base => KEYS.reduce((n, k) => n + (COSTE[base[k]] ?? 99), 0);

export function tirar4d6(rnd = Math.random) {
  const dados = Array.from({ length: 4 }, () => 1 + Math.floor(rnd() * 6)), quitado = dados.indexOf(Math.min(...dados));
  return { dados, quitado, total: dados.reduce((a, b) => a + b, 0) - dados[quitado] };
}
export const tirarSeis = (rnd = Math.random) => Array.from({ length: 6 }, () => tirar4d6(rnd));

export const prioridad = clase => CLASES_INFO[clase]?.prio || KEYS;
export function repartoSugerido(clase, valores = MATRIZ) {
  const v = [...valores].sort((a, b) => b - a);
  return Object.fromEntries(prioridad(clase).map((k, i) => [k, v[i] ?? 10]));
}

// Aumentos del trasfondo: +2 y +1, o +1 a las tres. Ninguna pasa de 20.
const NOMBRES_AB = { fuerza: 'fue', destreza: 'des', constitucion: 'con', inteligencia: 'int', sabiduria: 'sab', carisma: 'car' };
export function caracteristicasTrasfondo(trasfondo, lib = []) {
  if (!String(trasfondo || '').trim()) return [];
  const k = Object.keys(TRASFONDOS_2024).find(x => norm(x) === norm(trasfondo));
  if (k) return TRASFONDOS_2024[k][0];
  const x = lib.find(t => t.nombre && norm(t.nombre) === norm(trasfondo));
  const t = norm(x?.caracteristicas || '').replace(/1/g, 'i').replace(/[^a-z]/g, '');
  const found = x ? Object.entries(NOMBRES_AB).filter(([n]) => t.includes(n)).map(([, a]) => a) : [];
  return found.length === 3 ? KEYS.filter(a => found.includes(a)) : [];
}
export function limpiarBonos(bonos, permitidas) {
  const ok = permitidas.length ? permitidas : KEYS;
  return Object.fromEntries(Object.entries(bonos || {}).map(([k, n]) => [k, parseInt(n, 10) || 0]).filter(([k, n]) => ok.includes(k) && (n === 1 || n === 2)));
}
export function estadoBonos(bonos, permitidas) {
  const v = Object.values(limpiarBonos(bonos, permitidas)), suma = v.reduce((a, b) => a + b, 0);
  const completo = suma === 3 && (v.length === 3 || (v.length === 2 && v.includes(2)));
  return { completo, suma, faltan: Math.max(0, 3 - suma) };
}
export function bonosSugeridos(clase, permitidas, modo = '21') {
  const orden = prioridad(clase).filter(k => !permitidas.length || permitidas.includes(k));
  return modo === '111' ? Object.fromEntries(orden.slice(0, 3).map(k => [k, 1])) : { [orden[0]]: 2, [orden[1]]: 1 };
}
export const conBonos = (base, bonos) => Object.fromEntries(KEYS.map(k => [k, Math.min(20, Math.max(1, (parseInt(base[k], 10) || 10) + (bonos?.[k] || 0)))]));

// Competencias en habilidades: de dónde sale cada una y cuántas quedan por elegir.
// pericia: las elegidas quedan con pericia; fijas: no se eligen, son todas las de la lista; herramientas: puede cambiarlas por herramientas.
const DOTE_HAB = { habilidoso: [3, TODAS, { herramientas: true }], 'experto en habilidades': [1, TODAS], 'mente aguda': [1, ['arcanos', 'historia', 'investigacion', 'naturaleza', 'religion']],
  observador: [1, ['investigacion', 'percepcion', 'perspicacia']], 'don de la habilidad': [18, TODAS, { fijas: true }] };
// Subclases que dan competencias en habilidades a nivel 3
export const HAB_SUBCLASE = {
  'Bardo': [{ re: /conocimiento/i, nombre: 'Competencias adicionales (bardo)', n: 3, lista: TODAS }],
  'Clérigo': [{ re: /conocimiento/i, nombre: 'Bendiciones del conocimiento', n: 2, lista: ['arcanos', 'historia', 'naturaleza', 'religion'], pericia: true }],
  'Explorador': [{ re: /errante/i, nombre: 'Glamur sobrenatural', n: 1, lista: ['engano', 'interpretacion', 'persuasion'] }],
  'Guerrero': [{ re: /abanderad/i, nombre: 'Caballero emisario', n: 1, lista: ['interpretacion', 'intimidacion', 'perspicacia', 'persuasion'] },
    { re: /maestro del combate|batalla/i, nombre: 'Estudioso de la guerra', n: 1, lista: HAB_CLASE['Guerrero'][1] }],
  'Mago': [{ re: /hojacantante|cantante/i, nombre: 'Hojacantante', n: 1, lista: ['acrobacias', 'atletismo', 'interpretacion', 'persuasion'] }],
  'Monje': [{ re: /misericordia/i, nombre: 'Instrumentos de misericordia', n: 2, lista: ['perspicacia', 'medicina'], fijas: true }],
};
const EXTRA_ESPECIE = { humano: [1, TODAS, 'Humano (Habilidoso)'], elfo: [1, ['perspicacia', 'percepcion', 'supervivencia'], 'Elfo (Sentidos agudos)'] };
const EXTRA_MULTICLASE = { 'Bardo': [1, TODAS], 'Explorador': [1, HAB_CLASE['Explorador'][1]], 'Pícaro': [1, HAB_CLASE['Pícaro'][1]] };
export function fuentesExtra(ch) {
  const out = [], especie = norm(ch.especie || '').split(/[\s(]/)[0];
  if (EXTRA_ESPECIE[especie]) { const [n, lista, nombre] = EXTRA_ESPECIE[especie]; out.push({ nombre, n, lista }); }
  for (const d of dotesDe(ch)) { const x = DOTE_HAB[norm(d.nombre)]; if (x) out.push({ nombre: `${d.nombre} (dote)`, n: x[0], lista: x[1], ...(x[2] || {}) }); }
  for (const c of clasesDe(ch)) for (const r of HAB_SUBCLASE[c.clase] || []) if (r.re.test(c.subclase || '') && c.nivel >= 3) out.push({ nombre: r.nombre, n: r.n, lista: r.lista, ...(r.pericia ? { pericia: true } : {}), ...(r.fijas ? { fijas: true } : {}) });
  for (const c of clasesDe(ch).slice(1)) if (EXTRA_MULTICLASE[c.clase]) { const [n, lista] = EXTRA_MULTICLASE[c.clase]; out.push({ nombre: `${c.clase} (multiclase)`, n, lista }); }
  return out;
}
export function repartoHabilidades(ch) {
  const hab = ch.habilidades || {}, tras = habilidadesTrasfondo(ch), [nClase, lista] = HAB_CLASE[ch.clase] || [0, []];
  const extras = fuentesExtra(ch), nExtra = extras.reduce((n, f) => n + f.n, 0);
  const fuente = {}; let deClase = 0, deExtra = 0;
  for (const k of tras) if (hab[k] >= 1) fuente[k] = 'trasfondo';
  for (const k of TODAS) {
    if (!(hab[k] >= 1) || fuente[k]) continue;
    if (lista.includes(k) && deClase < nClase) { fuente[k] = 'clase'; deClase++; } else { fuente[k] = 'extra'; deExtra++; }
  }
  const nPer = periciasDisponibles(ch), per = TODAS.filter(k => hab[k] === 2).length;
  return {
    fuente, trasfondo: tras,
    clase: { n: nClase, lista, llevas: deClase, faltan: Math.max(0, nClase - deClase) },
    extra: { n: nExtra, fuentes: extras, llevas: deExtra, faltan: Math.max(0, nExtra - deExtra), sobran: Math.max(0, deExtra - nExtra) },
    pericia: { n: nPer, llevas: per, faltan: Math.max(0, nPer - per), sobran: Math.max(0, per - nPer) },
    faltanTrasfondo: tras.filter(k => !(hab[k] >= 1)),
  };
}
export function completarHabilidades(ch) {
  const hab = { ...(ch.habilidades || {}) };
  for (const k of habilidadesTrasfondo(ch)) hab[k] ||= 1;
  const r = repartoHabilidades({ ...ch, habilidades: hab }), prio = prioridad(ch.clase);
  const orden = [...r.clase.lista].sort((a, b) => prio.indexOf(abDe(a)) - prio.indexOf(abDe(b)));
  let n = r.clase.faltan;
  for (const k of orden) { if (n <= 0) break; if (!hab[k]) { hab[k] = 1; n--; } }
  const porPrio = lista => [...lista].sort((a, b) => prio.indexOf(abDe(a)) - prio.indexOf(abDe(b)));
  let extra = repartoHabilidades({ ...ch, habilidades: hab }).extra.faltan;
  for (const f of r.extra.fuentes) for (const k of porPrio(f.lista)) { if (extra <= 0) break; if (!hab[k]) { hab[k] = 1; extra--; } }
  let per = repartoHabilidades({ ...ch, habilidades: hab }).pericia.faltan;
  for (const k of porPrio(TODAS)) { if (per <= 0) break; if (hab[k] === 1) { hab[k] = 2; per--; } }
  return hab;
}
const abDe = k => HABILIDADES.find(h => h[0] === k)?.[2] || 'des';

// Dotes: la de origen del trasfondo, la de Humano (Versátil) y las que no se pueden repetir
export const DOTES_ORIGEN = ['Alerta', 'Afortunado', 'Atacante salvaje', 'Duro', 'Fabricante', 'Habilidoso', 'Iniciado en la magia', 'Matón de taberna', 'Músico', 'Sanador'];
const REPETIBLES = ['iniciado en la magia', 'habilidoso', 'adepto elemental', 'versado en un elemento', 'mejora de caracteristica'];
const baseDote = t => norm(String(t || '').replace(/\s*\([^)]*\)\s*$/, ''));
export function esRepetible(nombre, lib = []) {
  const n = baseDote(nombre);
  if (REPETIBLES.includes(n)) return true;
  const x = lib.find(d => baseDote(d.nombre) === n);
  return !!x && /\b(repetible|repeatable)\b/i.test(`${x.req || ''} ${x.texto || ''}`);
}
export function doteRepetida(ch, nombre, lib = [], trasfondosLib = []) {
  const tiene = dotesDe(ch, trasfondosLib);
  if (esRepetible(nombre, lib)) return tiene.some(d => norm(d.detalle ? `${d.nombre} (${d.detalle})` : d.nombre) === norm(nombre));
  return tiene.some(d => baseDote(d.nombre) === baseDote(nombre));
}
export function esDoteOrigen(nombre, lib = []) {
  const n = baseDote(nombre), x = lib.find(d => baseDote(d.nombre) === n);
  return x ? x.cat === 'Origen' : DOTES_ORIGEN.some(d => norm(d) === n);
}
const MEJORA = 'Mejora de característica', EPICO = 'Don épico';
export function mejorasHasta(ch) {
  let asi = 0, epico = 0;
  for (const c of clasesDe(ch)) {
    const r = CLASES_INFO[c.clase]?.rasgos || {};
    for (let L = 1; L <= c.nivel; L++) { asi += (r[L] || []).filter(x => x === MEJORA).length; epico += (r[L] || []).filter(x => x === EPICO).length; }
  }
  return { asi, epico, nivel: nivelTotal(ch) };
}
export function versatilPendiente(ch, lib = []) {
  if (norm(ch.especie || '').split(/[\s(]/)[0] !== 'humano') return false;
  return !(ch.dotes || []).some(d => esDoteOrigen(d, lib));
}
