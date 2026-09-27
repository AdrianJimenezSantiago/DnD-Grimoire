import { norm } from '../core/util.js';
import { clasesDe, competencia, modOf, nivelTotal } from './reglas2024.js';

// Maniobras del Maestro del combate (guerrero, Manual del Jugador de 2024). «Dado» es un dado de supremacía.
// El grupo dice cuándo se usa, como en «En juego».
export const MANIOBRAS = [
  { nombre: 'Ataque amenazador', grupo: 'pasivo', texto: 'Cuando impactes a una criatura con una tirada de ataque, gastas un dado y lo sumas al daño. El objetivo hace una salvación de Sabiduría o queda asustado de ti hasta el final de tu siguiente turno.' },
  { nombre: 'Ataque con finta', grupo: 'adicional', texto: 'Como acción adicional, gastas un dado para tener ventaja en tu siguiente tirada de ataque este turno contra una criatura a 1,5 m o menos. Si impacta, sumas el dado al daño.' },
  { nombre: 'Ataque de barrido', grupo: 'pasivo', texto: 'Cuando impactes a una criatura con un ataque cuerpo a cuerpo, gastas un dado y eliges otra criatura a 1,5 m o menos del objetivo y a tu alcance. Si la tirada original le habría impactado, sufre daño igual al dado, del mismo tipo que el del ataque.' },
  { nombre: 'Ataque de maniobra', grupo: 'pasivo', texto: 'Cuando impactes a una criatura con una tirada de ataque, gastas un dado y lo sumas al daño. Un aliado que te vea o te oiga puede usar su reacción para moverse hasta la mitad de su velocidad sin provocar ataques de oportunidad del objetivo.' },
  { nombre: 'Ataque de precisión', grupo: 'pasivo', texto: 'Cuando falles una tirada de ataque, gastas un dado y lo sumas a la tirada, con lo que puede impactar.' },
  { nombre: 'Ataque en estocada', grupo: 'adicional', texto: 'Como acción adicional, gastas un dado y realizas la acción de Correr. Si te mueves al menos 1,5 m en línea recta justo antes de impactar con un ataque cuerpo a cuerpo este turno, sumas el dado al daño.' },
  { nombre: 'Ataque para derribar', grupo: 'pasivo', texto: 'Cuando impactes a una criatura con una tirada de ataque, gastas un dado y lo sumas al daño. Si es Grande o menor, hace una salvación de Fuerza o queda derribada.' },
  { nombre: 'Ataque para desarmar', grupo: 'pasivo', texto: 'Cuando impactes a una criatura con una tirada de ataque, gastas un dado y lo sumas al daño. El objetivo hace una salvación de Fuerza o suelta un objeto que sujete, a tu elección; el objeto cae a sus pies.' },
  { nombre: 'Ataque para empujar', grupo: 'pasivo', texto: 'Cuando impactes a una criatura con una tirada de ataque, gastas un dado y lo sumas al daño. Si es Grande o menor, hace una salvación de Fuerza o la empujas hasta 4,5 m en línea recta alejándola de ti.' },
  { nombre: 'Ataque provocador', grupo: 'pasivo', texto: 'Cuando impactes a una criatura con una tirada de ataque, gastas un dado y lo sumas al daño. El objetivo hace una salvación de Sabiduría o tiene desventaja en las tiradas de ataque contra objetivos que no seas tú hasta el final de tu siguiente turno.' },
  { nombre: 'Cambio de posición', grupo: 'pasivo', texto: 'En tu turno, estando a 1,5 m o menos de una criatura voluntaria, gastas un dado e intercambiáis vuestras posiciones (te cuesta 1,5 m de movimiento). Tú o ella sumáis el dado a la CA hasta el inicio de tu siguiente turno.' },
  { nombre: 'Contraataque', grupo: 'reaccion', texto: 'Como reacción, cuando una criatura falle una tirada de ataque cuerpo a cuerpo contra ti, gastas un dado y haces un ataque cuerpo a cuerpo contra ella con un arma o un golpe sin armas. Si impacta, sumas el dado al daño.' },
  { nombre: 'Emboscada', grupo: 'pasivo', texto: 'Cuando hagas una prueba de Destreza (Sigilo) o una tirada de iniciativa, gastas un dado y lo sumas a la tirada, salvo si estás incapacitado.' },
  { nombre: 'Evaluación táctica', grupo: 'fuera', texto: 'Cuando hagas una prueba de Inteligencia (Historia o Investigación) o de Sabiduría (Perspicacia), gastas un dado y lo sumas a la prueba.' },
  { nombre: 'Golpe de distracción', grupo: 'pasivo', texto: 'Cuando impactes a una criatura con una tirada de ataque, gastas un dado y lo sumas al daño. La siguiente tirada de ataque contra el objetivo de otra criatura que no seas tú tiene ventaja si se hace antes del inicio de tu siguiente turno.' },
  { nombre: 'Golpe del comandante', grupo: 'accion', texto: 'Cuando realices la acción de Atacar, renuncias a uno de tus ataques y usas una acción adicional para que un aliado que te vea o te oiga haga un ataque con un arma o sin armas usando su reacción. Gastas un dado y el aliado lo suma al daño si impacta.' },
  { nombre: 'Juego de pies evasivo', grupo: 'pasivo', texto: 'Al moverte, gastas un dado y lo sumas a tu CA hasta que dejes de moverte.' },
  { nombre: 'Parada', grupo: 'reaccion', texto: 'Como reacción, cuando otra criatura te haga daño con una tirada de ataque cuerpo a cuerpo, gastas un dado y reduces el daño en lo que saques más tu modificador de Fuerza o de Destreza, a tu elección.' },
  { nombre: 'Presencia autoritaria', grupo: 'fuera', texto: 'Cuando hagas una prueba de Carisma (Interpretación, Intimidación o Persuasión), gastas un dado y lo sumas a la prueba.' },
  { nombre: 'Reagrupar', grupo: 'adicional', texto: 'Como acción adicional, gastas un dado para animar a un aliado que te vea o te oiga: gana puntos de golpe temporales iguales a lo que saques más la mitad de tu nivel de guerrero (redondeando hacia abajo).' },
];

const MAESTRO = /maestro del combate|batalla|battle/i;
const maestroDe = ch => clasesDe(ch).find(c => c.clase === 'Guerrero' && MAESTRO.test(c.subclase || '')) || null;
// Tres maniobras a nivel 3 y dos más a niveles 7, 10 y 15
export const cupoManiobrasEn = L => (L >= 15 ? 9 : L >= 10 ? 7 : L >= 7 ? 5 : L >= 3 ? 3 : 0);
export function cupoManiobras(ch) { const c = maestroDe(ch); return c ? cupoManiobrasEn(c.nivel) : 0; }
export const dadoSupremacia = L => (L >= 18 ? 'd12' : L >= 10 ? 'd10' : 'd8');
// CD de las maniobras: 8 + Fuerza o Destreza (la mayor) + competencia
export const cdManiobras = ch => 8 + competencia(nivelTotal(ch)) + Math.max(modOf(ch.stats?.fue), modOf(ch.stats?.des));
export const maniobraDe = nombre => MANIOBRAS.find(m => norm(m.nombre) === norm(nombre)) || null;
// Las que tiene el personaje, con su texto; las que no están en la lista (de otro manual) salen sin texto
export function maniobrasDe(ch) {
  const c = maestroDe(ch); if (!c) return [];
  return (ch.maniobras || []).map(n => maniobraDe(n) || { nombre: n, grupo: 'pasivo', texto: '' });
}
export function alternarManiobra(sel, nombre, cupo) {
  if (sel.includes(nombre)) return sel.filter(x => x !== nombre);
  return sel.length < cupo ? [...sel, nombre] : sel;
}
