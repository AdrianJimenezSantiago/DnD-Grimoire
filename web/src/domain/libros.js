/**
 * Libros importados (Manual del Jugador y futuras expansiones). Puro.
 * Un libro aporta: textos de conjuros ya conocidos, conjuros nuevos (con sus datos técnicos),
 * entradas de glosario y subclases detectadas. Todo se guarda solo en el dispositivo.
 */
import { claveNombre } from './manual.js';

export const CLASES_ES = ['Bárbaro', 'Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador', 'Guerrero', 'Hechicero', 'Mago', 'Monje', 'Paladín', 'Pícaro'];
const sinT = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const letras = s => s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
const mayus = s => { const l = letras(s); return l.length >= 3 && l.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length / l.length >= 0.85; };
const titulo = s => { const t = s.toLowerCase().replace(/\s+/g, ' ').trim(); return t.charAt(0).toUpperCase() + t.slice(1); };
// familias de nombre de subclase por clase (ayudan cuando el capítulo no se detecta)
const FAMILIA = [[/^SENDA/, 'Bárbaro'], [/^COLEGIO/, 'Bardo'], [/^PATRON/, 'Brujo'], [/^DOMINIO/, 'Clérigo'], [/^CIRCULO/, 'Druida'],
  [/^JURAMENTO/, 'Paladín'], [/^HECHICERIA/, 'Hechicero'], [/^GUERRERO DE (LA|LOS|LAS) /, 'Monje']];

/**
 * Subclases: etiqueta «SUBCLASE DE…» seguida del nombre en mayúsculas (a veces partido en varias líneas).
 * La clase sale del capítulo en curso («RASGOS DE <CLASE>») o de la familia del nombre.
 */
export function detectarSubclases(paginas) {
  const out = [], vistos = new Set(); let clase = null;
  for (const pg of paginas) for (const col of pg.cols) for (let i = 0; i < col.length; i++) {
    const s = col[i].s.replace(/^[|>\s]+|[|<>\s]+$/g, ''), S = sinT(s);
    const cap = /^RASGOS DE(?:L)? (BARBARO|BARDO|BRUJO|CLERIGO|DRUIDA|EXPLORADOR|GUERRERO|HECHICERO|MAGO|MONJE|PALADIN|PICARO)\b/.exec(S);
    if (cap) { clase = CLASES_ES.find(c => sinT(c) === cap[1]); continue; }
    const m = /^SUBCLASE DE(?:L|\s+LA|\s+LAS|\s+LOS)?\b\s*(.*)$/.exec(S); if (!m) continue;
    // resto de la etiqueta + líneas siguientes en mayúsculas (hasta 2)
    const partes = [];
    const resto = s.replace(/^\S+\s+\S+(\s+(DEL|LA|LAS|LOS)\b)?/i, '').trim();
    if (resto && !CLASES_ES.some(c => sinT(c) === sinT(resto))) partes.push(resto);
    for (let j = i + 1; j < Math.min(col.length, i + 4) && partes.join(' ').length < 45; j++) {
      const t = col[j].s.replace(/^[|>\s]+|[|<>\s]+$/g, '').replace(/^U(?=[A-ZÁÉÍÓÚ]{3})/, '');
      if (!mayus(t) || /^SUBCLASE/i.test(t)) break;
      partes.push(t);
    }
    let nombre = partes.join(' ').replace(/\s+/g, ' ').trim();
    if (!nombre || letras(nombre).length < 4) continue;
    // artículo que quedó en la etiqueta: «SUBCLASE DEL» + «COLEGIO…» o «SUBCLASE DE LA» + «SENDA…»
    nombre = nombre.replace(/^(DEL|DE LA|LA|EL)\s+/i, '');
    const fam = FAMILIA.find(([re]) => re.test(sinT(nombre)))?.[1];
    const k = claveNombre(nombre); if (vistos.has(k)) continue; vistos.add(k);
    out.push({ clase: fam || clase || '', nombre: titulo(nombre) });
  }
  return out;
}
/** Identificador estable de un libro a partir de su título. */
export const idLibro = t => claveNombre(t).replace(/\s+/g, '-').slice(0, 60) || 'libro';
