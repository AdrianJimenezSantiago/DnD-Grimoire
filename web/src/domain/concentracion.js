/**
 * Concentración y efectos activos con objetivos: sobre quién se mantiene Bendición, Acelerar o Marca del cazador,
 * y rasgos de clase que se ponen sobre una criatura (Voto de enemistad, Inspiración bárdica…). Módulo puro.
 *   play.conc      nombre del conjuro en el que se concentra
 *   play.concObj   objetivos de esa concentración
 *   play.efectos   [{id, nombre, nota, objetivos}] efectos de rasgos que no son de concentración
 */
import { norm, uid } from '../core/util.js';
import { parseArea } from './area.js';
import { progresion } from './clases2024.js';

/** Rasgos de clase que se aplican a criaturas concretas y conviene recordar sobre quién están. */
export const RASGOS_CON_OBJETIVO = {
  'Voto de enemistad': 'Ventaja en tus ataques contra él durante 1 minuto.',
  'Inspiración bárdica': 'Tiene uno de tus dados de inspiración.',
  'Magia cautivadora': 'Asustado o hechizado durante 1 minuto.',
  'Golpe aturdidor': 'Aturdido hasta el principio de tu siguiente turno.',
  'Palma estremecedora': 'Vibraciones activas hasta que decidas terminarlas.',
  'Represalia escalofriante': 'Aturdido y con velocidad 0 hasta el final de tu siguiente turno.',
  'Golpe terrorífico': 'Asustado durante 1 minuto (repite la salvación al final de sus turnos).',
  'Magia mental': 'Afectado por tu conjuro de adivinación.',
};

/** Un conjuro de concentración apunta a criaturas concretas si no tiene área (Bendición, Acelerar, Marca del cazador…). */
export const conObjetivos = (s, textos = []) => !!s?.conc && !parseArea(textos.filter(Boolean).join(' '), s.alcance || '');

/** Empieza (o cambia) la concentración: los objetivos de la anterior se olvidan. */
export function empezarConc(play, nombre) {
  if (play.conc !== nombre) play.concObj = [];
  play.conc = nombre;
}
export function terminarConc(play) { play.conc = ''; play.concObj = []; }

/** Nombres escritos a mano: «Ana, el trol y Bram» → ['Ana', 'el trol', 'Bram'], sin repetir los que ya estaban. */
export function objetivosNuevos(texto, ya = []) {
  const vistos = new Set(ya.map(x => norm(x)));
  return String(texto || '').split(/\s*(?:,|;|\sy\s)\s*/).map(x => x.trim()).filter(x => x && !vistos.has(norm(x)) && vistos.add(norm(x)));
}

/** Rasgos del personaje que admiten objetivos (según su clase, subclase y nivel). */
export const rasgosConObjetivo = ch => [...new Set(progresion(ch).map(r => r.nombre))].filter(n => RASGOS_CON_OBJETIVO[n]);

export function nuevoEfecto(play, nombre, objetivos = []) {
  const e = { id: uid('ef'), nombre, nota: RASGOS_CON_OBJETIVO[nombre] || '', objetivos: [...objetivos] };
  play.efectos.push(e); return e;
}
