import { clasesDe, dotesDe } from './reglas2024.js';

const n = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const MAESTRIA = { 'Bárbaro': 'las armas cuyas maestrías usas', Guerrero: 'una de las armas cuyas maestrías usas', 'Paladín': 'las armas cuyas maestrías usas', Explorador: 'las armas cuyas maestrías usas', 'Pícaro': 'las armas cuyas maestrías usas' };
const TRUCO_NIVEL = ['Bardo', 'Clérigo', 'Druida', 'Hechicero', 'Brujo'];
const ESTILO = { Guerrero: 1, 'Paladín': 2, Explorador: 2 };

export const esHumano = ch => /^humano/.test(n(ch?.especie));

export function opcionesIntercambio(ch, momento, { clase = null, trasfondos = [] } = {}) {
  const out = [], add = (ico, titulo, texto, fuente) => out.push({ ico, titulo, texto, fuente });
  const cs = clasesDe(ch).filter(c => !clase || c.clase === clase);
  for (const { clase: k, nivel: L, subclase } of cs) {
    const sub = n(subclase);
    if (momento === 'largo') {
      if (k === 'Mago') {
        add('libro', 'Cambiar tus preparados', 'Puedes cambiar toda tu lista de conjuros preparados por otros de tu libro.', 'Mago');
        add('o_varita', 'Cambiar un truco', 'Puedes sustituir uno de tus trucos por otro truco de mago.', 'Mago');
      }
      if (k === 'Clérigo' || k === 'Druida') add('libro', 'Cambiar tus preparados', `Puedes cambiar toda tu lista de conjuros preparados por otros de la lista de ${k === 'Druida' ? 'druida' : 'clérigo'}.`, k);
      if (k === 'Paladín' || k === 'Explorador') add('libro', 'Cambiar un conjuro preparado', `Puedes sustituir uno de tus conjuros preparados por otro de ${k === 'Paladín' ? 'paladín' : 'explorador'}.`, k);
      if (k === 'Druida' && L >= 2) add('bestia', 'Cambiar una forma conocida', 'Puedes sustituir una de las formas de Forma salvaje que conoces por otra que cumpla los requisitos.', 'Druida');
      if (MAESTRIA[k]) add('o_arma', 'Cambiar maestrías de armas', `Puedes cambiar ${MAESTRIA[k]}.`, k);
    }
    if (momento === 'corto' && k === 'Mago' && L >= 5) add('libro', 'Memorizar conjuro', 'Puedes estudiar tu libro y sustituir uno de tus conjuros preparados de nivel 1 o más por otro de tu libro.', 'Mago');
    if (momento === 'nivel') {
      if (['Bardo', 'Hechicero', 'Brujo'].includes(k)) add('libro', 'Cambiar un conjuro', `Puedes sustituir uno de tus conjuros por otro de ${n(k)} para el que tengas espacios.`, k);
      if (TRUCO_NIVEL.includes(k)) add('o_varita', 'Cambiar un truco', `Puedes sustituir uno de tus trucos por otro de ${n(k)}.`, k);
      if (k === 'Brujo' && L >= 2) add('brujo', 'Cambiar una invocación', 'Puedes sustituir una de tus invocaciones sobrenaturales por otra cuyos requisitos cumplas.', 'Brujo');
      if (k === 'Brujo' && L >= 12) add('brujo', 'Cambiar un arcano místico', 'Puedes sustituir uno de tus conjuros de Arcano místico por otro de brujo del mismo nivel.', 'Brujo');
      if (k === 'Hechicero' && L >= 3) add('hechicero', 'Cambiar una metamagia', 'Puedes sustituir una de tus opciones de Metamagia por otra.', 'Hechicero');
      if (ESTILO[k] && L >= ESTILO[k]) add('ca', 'Cambiar el estilo de combate', 'Puedes sustituir tu dote de estilo de combate por otra.', k);
      if ((k === 'Guerrero' || k === 'Pícaro') && /arcan|eldritch|trickster/.test(sub)) {
        add('libro', 'Cambiar un conjuro', 'Puedes sustituir uno de tus conjuros por otro de mago para el que tengas espacios.', subclase);
        add('o_varita', 'Cambiar un truco', 'Puedes sustituir uno de tus trucos por otro de mago.', subclase);
      }
      if (k === 'Guerrero' && /maestro|battle/.test(sub)) add('o_arma', 'Cambiar una maniobra', 'Puedes sustituir una de las maniobras que conoces por otra.', subclase);
    }
  }
  if (!clase || momento !== 'nivel') {
    for (const d of dotesDe(ch, trasfondos)) {
      const dn = n(d.nombre);
      if (momento === 'nivel' && /iniciado en la magia|magic initiate/.test(dn)) add('dote', 'Cambiar un conjuro de la dote', `Puedes sustituir uno de los conjuros de Iniciado en la magia${d.detalle ? ` (${d.detalle})` : ''} por otro del mismo nivel y la misma lista.`, d.nombre);
      if ((momento === 'largo' || momento === 'corto') && /^musico|musician/.test(dn)) add('inspiracion', 'Canción alentadora', 'Al terminar el descanso puedes tocar para dar inspiración heroica a tantos aliados como tu bonificador de competencia.', d.nombre);
    }
    if (momento === 'largo' && /alto elfo|high elf/.test(n(ch.especie))) add('o_varita', 'Cambiar tu truco élfico', 'Puedes sustituir Prestidigitación por otro truco de mago.', ch.especie);
  }
  return out;
}

export const nivelCambia = (ch, clase, trasfondos) => [...opcionesIntercambio(ch, 'nivel', { clase, trasfondos }), ...opcionesIntercambio(ch, 'nivel', { trasfondos }).filter(o => o.ico === 'dote')];
