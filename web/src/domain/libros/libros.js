import { claveNombre } from './manual.js';

export const CLASES_ES = ['Bárbaro', 'Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador', 'Guerrero', 'Hechicero', 'Mago', 'Monje', 'Paladín', 'Pícaro'];
const sinT = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const letras = s => s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
const mayus = s => { const l = letras(s); return l.length >= 3 && l.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length / l.length >= 0.85; };
const titulo = s => { const t = s.toLowerCase().replace(/\s+/g, ' ').trim(); return t.charAt(0).toUpperCase() + t.slice(1); };
const FAMILIA = [[/^SENDA/, 'Bárbaro'], [/^COLEGIO/, 'Bardo'], [/^PATRON/, 'Brujo'], [/^DOMINIO/, 'Clérigo'], [/^CIRCULO/, 'Druida'],
  [/^JURAMENTO/, 'Paladín'], [/^HECHICERIA/, 'Hechicero'], [/^GUERRERO DE (LA|LOS|LAS) /, 'Monje']];

export function detectarSubclases(paginas) {
  const out = [], vistos = new Set(); let clase = null;
  for (const pg of paginas) for (const col of pg.cols) for (let i = 0; i < col.length; i++) {
    const s = col[i].s.replace(/^[|>\s]+|[|<>\s]+$/g, ''), S = sinT(s);
    const cap = /^RASGOS DE(?:L)? (BARBARO|BARDO|BRUJO|CLERIGO|DRUIDA|EXPLORADOR|GUERRERO|HECHICERO|MAGO|MONJE|PALADIN|PICARO)\b/.exec(S);
    if (cap) { clase = CLASES_ES.find(c => sinT(c) === cap[1]); continue; }
    const m = /^SUBCLASE DE(?:L|\s+LA|\s+LAS|\s+LOS)?\b\s*(.*)$/.exec(S); if (!m) continue;
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
    nombre = nombre.replace(/^(DEL|DE LA|LA|EL)\s+/i, '');
    const fam = FAMILIA.find(([re]) => re.test(sinT(nombre)))?.[1];
    const k = claveNombre(nombre); if (vistos.has(k)) continue; vistos.add(k);
    out.push({ clase: fam || clase || '', nombre: titulo(nombre) });
  }
  return out;
}
export const idLibro = t => claveNombre(t).replace(/\s+/g, '-').slice(0, 60) || 'libro';
