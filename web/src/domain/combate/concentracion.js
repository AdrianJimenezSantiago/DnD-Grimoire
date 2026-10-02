// Concentración: objetivos del conjuro concentrado y rasgos que también fijan un objetivo.
import { norm, uid } from '../../core/util.js';
import { parseArea } from './area.js';
import { progresion } from '../clases/clases2024.js';

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

export const conObjetivos = (s, textos = []) => !!s?.conc && !parseArea(textos.filter(Boolean).join(' '), s.alcance || '');

export function empezarConc(play, nombre) {
  if (play.conc !== nombre) play.concObj = [];
  play.conc = nombre;
}
export function terminarConc(play) { play.conc = ''; play.concObj = []; play.concRondas = null; }

export function objetivosNuevos(texto, ya = []) {
  const vistos = new Set(ya.map(x => norm(x)));
  return String(texto || '').split(/\s*(?:,|;|\sy\s)\s*/).map(x => x.trim()).filter(x => x && !vistos.has(norm(x)) && vistos.add(norm(x)));
}

export const rasgosConObjetivo = ch => [...new Set(progresion(ch).map(r => r.nombre))].filter(n => RASGOS_CON_OBJETIVO[n]);

export function nuevoEfecto(play, nombre, objetivos = []) {
  const e = { id: uid('ef'), nombre, nota: RASGOS_CON_OBJETIVO[nombre] || '', objetivos: [...objetivos] };
  play.efectos.push(e); return e;
}
