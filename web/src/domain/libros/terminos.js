// Glosario cargado: los términos de reglas del manual importado (estados, luz, coberturas…) y la expresión
// regular que los encuentra en cualquier texto para enlazarlos a su definición.
import { formasDeEstado, sinCortes } from './glosario.js';

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
