import { norm } from '../../core/util.js';
import { clasesDe } from '../reglas/reglas2024.js';

// Dotes de estilo de combate (Manual del Jugador de 2024) y sus alternativas de paladín y explorador
export const ESTILOS = [
  { nombre: 'Tiro con arco', ef: 'arqueria', re: /arquer|archery|tiro con arco/, texto: 'Obtienes un bonificador de +2 a las tiradas de ataque que hagas con armas a distancia.' },
  { nombre: 'Lucha a ciegas', ef: 'ciegas', re: /ciegas|blind/, texto: 'Tienes vista ciega con un alcance de 3 m.' },
  { nombre: 'Defensa', ef: 'defensa', re: /^defensa$|^defense$/, texto: 'Mientras lleves armadura ligera, media o pesada, obtienes un bonificador de +1 a la CA.' },
  { nombre: 'Duelo', ef: 'duelo', re: /duel/, texto: 'Cuando empuñes un arma cuerpo a cuerpo en una mano y ninguna otra arma, obtienes un bonificador de +2 a las tiradas de daño con ella.' },
  { nombre: 'Combate con armas a dos manos', ef: 'grandes', re: /grandes|dos manos|great weapon/, texto: 'Cuando tires daño con un arma cuerpo a cuerpo que empuñes con dos manos, puedes tratar cualquier 1 o 2 de un dado de daño como un 3. El arma debe tener la propiedad Dos manos o Versátil.' },
  { nombre: 'Intercepción', ef: 'intercepcion', re: /intercep/, texto: 'Reacción: cuando una criatura que puedas ver impacte a otra que esté a 1,5 m o menos de ti, reduces el daño en 1d10 + tu bonificador de competencia. Debes empuñar un escudo o un arma sencilla o marcial.' },
  { nombre: 'Protección', ef: 'proteccion', re: /^protec/, texto: 'Reacción: cuando una criatura que puedas ver ataque a otra que esté a 1,5 m o menos de ti, impones desventaja a esa tirada y a las demás contra ese objetivo hasta tu siguiente turno. Debes empuñar un escudo.' },
  { nombre: 'Combate con armas arrojadizas', ef: 'arrojadizas', re: /arrojadiz|thrown/, texto: 'Cuando impactes con un ataque a distancia usando un arma con la propiedad Arrojadiza, obtienes un bonificador de +2 a la tirada de daño.' },
  { nombre: 'Combate con dos armas', ef: 'dosarmas', re: /dos armas|two.weapon/, texto: 'Cuando hagas un ataque adicional por atacar con un arma Ligera, puedes sumar tu modificador de característica al daño de ese ataque.' },
  { nombre: 'Combate sin armas', ef: 'sinarmas', re: /sin armas|unarmed/, texto: 'Tus golpes sin armas hacen 1d6 + tu modificador de Fuerza (1d8 si no empuñas armas ni escudo). Al empezar tu turno puedes hacer 1d4 de daño contundente a una criatura que tengas agarrada.' },
];
export const ALTERNATIVAS = {
  'Paladín': { nombre: 'Guerrero bendito', lista: 'Clérigo', texto: 'En lugar de una dote de estilo de combate, aprendes dos trucos de clérigo a tu elección. Cuentan como conjuros de paladín para ti y usan Carisma.' },
  'Explorador': { nombre: 'Guerrero druídico', lista: 'Druida', texto: 'En lugar de una dote de estilo de combate, aprendes dos trucos de druida a tu elección. Cuentan como conjuros de explorador para ti y usan Sabiduría.' },
};
export const NIVEL_ESTILO = { 'Guerrero': 1, 'Paladín': 2, 'Explorador': 2 };

const baseNombre = t => norm(String(t || '').replace(/\s*\([^)]*\)\s*$/, ''));
export function estiloDe(nombre, lib = []) {
  const n = baseNombre(nombre); if (!n) return null;
  const x = lib.find(d => baseNombre(d.nombre) === n);
  const base = ESTILOS.find(e => e.re.test(n));
  if (x && x.cat !== 'Estilo de combate' && !base) return null;
  if (x?.cat === 'Estilo de combate' || base) return { nombre: x?.nombre || base?.nombre || nombre, ef: base?.ef || '', texto: x?.texto || base?.texto || '' };
  return null;
}
export const esAlternativa = nombre => Object.values(ALTERNATIVAS).find(a => baseNombre(a.nombre) === baseNombre(nombre)) || null;
export const estilosDe = (ch, lib = []) => (ch.dotes || []).map(d => estiloDe(d, lib)).filter(Boolean);
export const tieneEstilo = (ch, ef) => estilosDe(ch).some(e => e.ef === ef);

// Cuántos estilos da la clase (o su alternativa) y cuántos lleva el personaje
export function estadoEstilo(ch, lib = []) {
  const fuentes = clasesDe(ch).filter(c => NIVEL_ESTILO[c.clase] && c.nivel >= NIVEL_ESTILO[c.clase]);
  // Cada clase con el rasgo da un estilo, y el Campeón otro a nivel 7 (Estilo de combate adicional)
  const campeon = clasesDe(ch).some(c => c.clase === 'Guerrero' && /campe[oó]n/i.test(c.subclase || '') && c.nivel >= 7);
  const elegidos = estilosDe(ch, lib).length + (ch.dotes || []).filter(esAlternativa).length, total = fuentes.length + (campeon ? 1 : 0);
  return { fuentes: [...fuentes.map(c => c.clase), ...(campeon ? ['Campeón'] : [])], puede: fuentes.length > 0, faltan: Math.max(0, total - elegidos), total, elegidos };
}
export const trucosAlternativa = ch => (ch.dotes || []).map(esAlternativa).filter(Boolean);

// Opciones para elegir: las del libro importado si las hay, si no las del manual
export function opcionesEstilo(ch, lib = [], clase = '') {
  const tiene = new Set((ch.dotes || []).map(baseNombre));
  const delLibro = lib.filter(d => d.cat === 'Estilo de combate');
  const lista = (delLibro.length ? delLibro.map(d => ({ nombre: d.nombre, texto: d.texto, fuente: d.fuente })) : ESTILOS.map(e => ({ nombre: e.nombre, texto: e.texto })));
  const alt = ALTERNATIVAS[clase];
  return [...lista.map(e => ({ ...e, ya: tiene.has(baseNombre(e.nombre)) })), ...(alt ? [{ ...alt, alternativa: true, ya: tiene.has(baseNombre(alt.nombre)) }] : [])];
}
export const dotesSinEstilo = (ch, lib = []) => (ch.dotes || []).filter(d => !estiloDe(d, lib) && !esAlternativa(d));
