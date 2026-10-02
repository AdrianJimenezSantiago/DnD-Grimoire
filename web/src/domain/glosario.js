import { claveNombre } from './manual.js';

const letters = s => s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
const ARREGLOS = { macia: 'magia', hosril: 'hostil', cubo: 'cubo' };
const CATS = { estado: 'Estado', accion: 'Acción', peligro: 'Peligro', 'area de efecto': 'Área de efecto', actitud: 'Actitud' };
const isFooter = s => /^AP[ÉE]NDICE/i.test(s) || /^\d{1,3}$/.test(s) || /GLOSARIO DE REGLAS/i.test(s);

// Une dos líneas del PDF; una palabra partida con guion al final de línea («trans-» + «portarte») se junta sin guion
export const juntar = (a, b) => (/\p{Ll}-$/u.test(a) && /^\p{Ll}/u.test(b) ? a.slice(0, -1) + b : a + ' ' + b);
// Lo mismo en un texto ya importado, donde las líneas quedaron unidas con un espacio
export const sinCortes = t => String(t || '').replace(/(\p{Ll})- (\p{Ll})/gu, '$1$2');
export function parseGlosario(pages) {
  const L = [];
  for (const pg of pages) pg.cols.forEach(col => {
    const body = col.filter(l => !isFooter(l.s));
    const margin = Math.min(...body.map(l => l.x).filter(Number.isFinite));
    body.forEach(l => L.push({ ...l, margin }));
  });
  const start = L.findIndex(l => /DEFINICIONES DE LAS REGLAS/i.test(l.s));
  const esCabecera = l => l.s.length < 60 && letters(l.s).length >= 4 && /^[“"]?[A-ZÁÉÍÓÚÑ]/.test(l.s) && !/[.,;:]$/.test(l.s)
    && (l.h >= 19.5 || /^[“"]?[A-ZÁÉÍÓÚÑ ]{3,}\s*\[[A-Za-zÁÉÍÓÚáéíóú ]{4,20}\]$/.test(l.s));
  const entradas = []; let cur = null, para = '';
  const cerrar = () => { if (!cur) return; if (para) cur.paras.push(para); para = ''; if (cur.paras.join(' ').length >= 30) entradas.push(cur); };
  for (let i = Math.max(0, start + 1); i < L.length; i++) {
    const l = L[i];
    if (esCabecera(l)) {
      cerrar();
      const m = /^[“"]?(.+?)\s*\[([^\]]+)\]\s*$/.exec(l.s);
      let nombre = (m ? m[1] : l.s).replace(/^[“"]/, '').toLowerCase().trim();
      nombre = ARREGLOS[nombre] || nombre;
      const cat = m ? CATS[claveNombre(m[2])] || '' : '';
      cur = { nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1), cat, paras: [] };
      continue;
    }
    if (!cur) continue;
    const indent = l.x - l.margin > 4;
    if (para && indent) { cur.paras.push(para); para = ''; }
    para = para ? juntar(para, l.s) : l.s;
  }
  cerrar();
  return entradas.map(e => ({ clave: claveNombre(e.nombre), nombre: e.nombre, cat: e.cat, texto: e.paras.join('\n\n') }));
}

export function formasDeEstado(nombre) {
  const base = claveNombre(nombre);
  if (/o$/.test(base)) { const r = base.slice(0, -1); return [r + 'o', r + 'a', r + 'os', r + 'as']; }
  if (/e$/.test(base)) return [base, base + 's'];
  return [base];
}
