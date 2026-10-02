// Utilidades básicas de lectura de un libro: letras, mayúsculas, títulos, bloques de texto y restos del OCR.
import { leerTabla, tablaATexto, arreglarDados } from './tablas.js';

export const letras = s => String(s).replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
export const esMayus = s => { const l = letras(s); return l.length >= 3 && l.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length / l.length >= 0.86; };
export const sinTildes = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export function tituloBonito(caps, propios = []) {
  let s = String(caps).replace(/^[“”"'´`.,:;|\-–\s]+|[“”"'´`,:;|\-–\s]+$/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  s = s.charAt(0).toUpperCase() + s.slice(1);
  for (const p of propios) s = s.replace(new RegExp(`(^|[^\\p{L}])${p.toLowerCase()}(?![\\p{L}])`, 'gu'), (m, a) => a + p);
  s = s.replace(/\(([a-záéíóúñ])/g, (m, c) => '(' + c);
  return s;
}
export const esPie = s => /^\d{1,3}$/.test(s) || /^CAP[ÍI]TULO\s*[\dIl]/i.test(s) || /^\d{1,3}\s*[|.~]?\s*CAP[ÍI]TULO/i.test(s) || /CAP[ÍI]TULO\s*\d+\s*[|I1l]\s*[A-ZÁÉÍÓÚ ]{6,}$/.test(s) || /^AP[ÉE]NDICE\s+[A-Z]/.test(s) || /CAP[ÍI]TULO\s*\d*\s*[|]\s*[A-ZÁÉÍÓÚ]/.test(s);

export function aplanar(pages, extraPie = () => false) {
  const L = [];
  for (const pg of pages) pg.cols.forEach((col, ci) => {
    const body = col.filter(l => !esPie(l.s) && !extraPie(l.s));
    const cuenta = new Map(); body.forEach(l => { const k = Math.round(l.x / 3); cuenta.set(k, (cuenta.get(k) || 0) + 1); });
    const moda = [...cuenta].sort((a, b) => b[1] - a[1])[0];
    const margin = moda ? moda[0] * 3 : 0;
    const largos = body.map(l => l.s.length).sort((a, b) => a - b), tipico = largos[Math.floor(largos.length * 0.7)] || 50;
    const hTip = body.map(l => l.h).sort((a, b) => a - b)[Math.floor(body.length / 2)] || 16;
    body.forEach((l, i) => L.push({ ...l, margin, tipico, hTip, p: pg.p, ci, colStart: i === 0 }));
  });
  return L;
}

export function esBasura(s) {
  if (s.length <= 2 && !/\d/.test(s)) return true;
  const toks = s.split(/\s+/), raros = toks.filter(w => /^[^\p{L}\d]+$/u.test(w) || (/^[[(]?[A-Z]{2,4}[\])]?$/.test(w) && !/^(CD|CA|PG|PX|BC|VD|DJ|DM|PNJ)$/.test(w))).length;
  return toks.length <= 10 && raros >= 2 && raros / toks.length >= 0.45;
}
const ETIQ = /^(?:[A-ZÁÉÍÓÚ][\p{L}.]{1,24}(?: [\p{L}.]{1,14}){0,2}:\s|(?:Fue|Des|Con|Int|Sab|Car)\s?\d)/u;
const LEAD = /^([A-ZÁÉÍÓÚÑ¿][^.:!?]{1,44}[.:])\s/;

export function bloques(L, a, b, opt = {}) {
  const out = []; let para = '', viñeta = false;
  const cierra = () => { if (para) out.push((viñeta ? '• ' : '') + para.trim()); para = ''; viñeta = false; };
  for (let k = a; k < b; k++) {
    const l = L[k];
    const s = l.s.replace(/^[|\[\]]\s*/, '').replace(/\s*[|\[\]]$/, '').replace(/\s[|\[\]]\s/g, ' ').trim();
    if (!s) continue;
    if ((/^\S+\s/.test(s) || (l.cells || []).length > 1) && !/^NIVEL \d{1,2}: [A-ZÁÉÍÓÚÑ]/.test(s)) {
      let hasta = b; for (let j = k + 1; j < b; j++) if (/^NIVEL \d{1,2}: [A-ZÁÉÍÓÚÑ]/.test(L[j].s)) { hasta = j; break; }
      const t = leerTabla(L.slice(0, hasta), k, { margen: l.margin });
      if (t) { cierra(); out.push(tablaATexto(t.filas)); k = t.fin - 1; continue; }
    }
    if (esMayus(s)) {
      const sub = opt.subtitulo ? opt.subtitulo(l, s, k) : (l.h >= (l.hTip || 16) * 1.12 && letras(s).length >= 4 ? tituloBonito(s, opt.propios) : null);
      if (sub) { cierra(); out.push('### ' + sub); }
      continue;
    }
    if (esBasura(s)) continue;
    const vm = /^[+•●·▪◆*]\s*(.*)$/.exec(s);
    if (vm) { cierra(); viñeta = true; para = vm[1]; continue; }
    const prev = L[k - 1], cerrada = /[.:!?»)”…]$/.test(para);
    const indent = l.x - l.margin > 4 && l.x - l.margin < 60, corta = prev && prev.s.length < prev.tipico * 0.75;
    if (para && viñeta && Math.abs(l.x - l.margin) <= 4 && cerrada) cierra();
    else if (para && ((cerrada && (indent || corta)) || (ETIQ.test(s) && cerrada) || (LEAD.test(s) && cerrada && (indent || corta)))) cierra();
    para = para ? (para.endsWith('-') && /^[a-záéíóúñ]/.test(s) ? para.slice(0, -1) + s : para + ' ' + s) : s;
  }
  cierra();
  return out.map(p => (p.startsWith('|') ? p : arreglarDados(limpiarRestos(p)))).filter(p => p && !/^###\s*$/.test(p));
}
export const limpiarRestos = p => p.replace(/([.:!?»)])(?:\s+(?:[|\[\]]|[A-Za-z]{1,2}|[a-z][A-Z]\w?)){1,3}$/, '$1').replace(/\s+/g, ' ').trim();
export const texto = bs => bs.join('\n\n');
