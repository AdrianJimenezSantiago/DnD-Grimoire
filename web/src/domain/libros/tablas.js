// Lector de tablas de los libros (tablas de dado y de columnas) y arreglo de dados mal leídos.
const DADO = /^(?:\d{0,2}d\d{1,3}|1[4d](?:100|4|6|8|10|12|20)|d%)$/i;
const ROTULO = /^(?:\d{1,3}(?:\s*[-–]\s*\d{1,3})?|\d{4}|\d{2}\+)$/;
const CAMPO = /^(Tiempo de lanza|Alcance:|Componentes:|Duraci|NIVEL \d{1,2}: [A-ZÁÉÍÓÚÑ])/;
const letras = s => s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
const mayus = s => { const l = letras(s); return l.length >= 4 && l === l.toUpperCase(); };

export function normRotulo(s) {
  s = String(s).replace(/\s+/g, '');
  if (/^\d{4}$/.test(s) && +s.slice(0, 2) < +s.slice(2) + (s.slice(2) === '00' ? 100 : 0)) return s.slice(0, 2) + '–' + s.slice(2);
  return s.replace(/-/g, '–');
}
export const normDado = s => s.replace(/^14(100|4|6|8|10|12|20)$/, '1d$1');
const celda = s => String(s).replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
export const filaTexto = cells => `| ${cells.map(celda).join(' | ')} |`;

export function partirLinea(l, bordes) {
  const cells = bordes.map(() => '');
  const colDe = x => { let k = 0; bordes.forEach((b, i) => { if (x >= b - 10) k = i; }); return k; };
  for (const g of l.segs && l.segs.length ? l.segs : [{ x: l.x, w: 0, s: l.s }]) {
    let txt = g.s, x0 = g.x, k = colDe(x0);
    const per = g.w && txt.length ? g.w / txt.length : 0;
    while (per && k + 1 < bordes.length && x0 + per * txt.trimEnd().length > bordes[k + 1] + per * 2) {
      const ideal = Math.round((bordes[k + 1] - x0) / per);
      let best = -1;
      for (let i = 1; i < txt.length - 1; i++) if (txt[i] === ' ' && (best < 0 || Math.abs(i - ideal) < Math.abs(best - ideal))) best = i;
      if (best < 0 || Math.abs(best - ideal) > Math.max(5, txt.length * 0.3)) break;
      cells[k] += ' ' + txt.slice(0, best); txt = txt.slice(best + 1); x0 = bordes[k + 1]; k++;
    }
    cells[k] += ' ' + txt;
  }
  return cells.map(celda);
}

export function leerTablaDado(L, i) {
  const H = L[i]; if (!H) return null;
  let m = /^(\S+)\s+(.{2,60})$/.exec(H.s);
  if (m && !DADO.test(m[1])) {
    const cab = H.s.length <= 40 && !/[.:,;]$/.test(H.s) && /^[A-ZÁÉÍÓÚÑ]/.test(H.s) && !ROTULO.test(m[1]);
    const conRot = L.slice(i + 1, i + 7).filter(l => ROTULO.test(l.s.split(/\s+/)[0]) && /^\S+\s+[A-ZÁÉÍÓÚÑ¿¡]/.test(l.s)).length;
    if (!cab || conRot < 2 || !ROTULO.test(L[i + 1]?.s.split(/\s+/)[0] || '')) return null;
    const c = H.cells?.length >= 2 ? H.cells : [{ s: m[1] }, { s: m[2] }];
    m = [H.s, c[0].s, c.slice(1).map(x => x.s).join(' ')];
  }
  if (!m || (!DADO.test(m[1]) && !m[2]) || /[.:]$/.test(m[2])) return null;
  const doble = /^(.+?)\s+(\S+)\s+(.+)$/.exec(m[2]);
  if (doble && DADO.test(doble[2]) && DADO.test(m[1])) return leerTablaDoble(L, i, [normDado(m[1]), doble[1], normDado(doble[2]), doble[3]]);
  const filas = [[normDado(m[1]), m[2]]];
  let col2 = null, j = i + 1, ult = H;
  const esRepeticion = l => { const t = l.s.replace(/^\S+\s+/, ''); return t === m[2] || l.s === m[2]; };
  for (; j < L.length; j++) {
    const l = L[j], s = l.s;
    if (CAMPO.test(s)) break;
    const salto = l.y > ult.y + 4 || ult.y - l.y > ult.h * 3.6;
    if (esRepeticion(l)) { ult = l; continue; }
    const r = /^(\S+)(?:\s+(.*))?$/.exec(s);
    if (r && ROTULO.test(r[1]) && (!salto || filas.length > 1) && !(r[2] && /^[a-záéíóúñ]/.test(r[2]) && filas.length > 1)) {
      filas.push([normRotulo(r[1]), r[2] || '']);
      if (col2 == null && l.segs?.length > 1) col2 = l.segs[1].x;
      ult = l; continue;
    }
    if (filas.length < 2) return null;
    const ref = col2 ?? H.x + 22;
    if (!salto && l.x >= ref - 14 && !(mayus(s) && s.length < 50)) { filas[filas.length - 1][1] += ' ' + s; ult = l; continue; }
    break;
  }
  if (filas.length < 3) return null;
  if (!DADO.test(filas[0][0]) && col2 != null && !(H.cells?.length >= 2)) { const c = partirLinea(H, [H.x, col2]); if (c[0] && c[1]) filas[0] = c; }
  filas.forEach(f => { f[1] = f[1].replace(/(\w)- (\w)/g, '$1$2').replace(/\s\d{5,}\s/g, ' ').trim(); });
  return { filas, fin: j };
}
function leerTablaDoble(L, i, cab) {
  const filas = [cab]; let j = i + 1;
  for (; j < L.length; j++) {
    const r = /^(\S+)\s+(.+?)\s+(\S+)\s+(.+)$/.exec(L[j].s), r1 = /^(\S+)\s+(.+)$/.exec(L[j].s);
    if (r && ROTULO.test(r[1]) && ROTULO.test(r[3])) filas.push([normRotulo(r[1]), r[2], normRotulo(r[3]), r[4]]);
    else if (r1 && ROTULO.test(r1[1]) && L[j].s.length < 40) filas.push([normRotulo(r1[1]), r1[2], '', '']);
    else break;
  }
  return filas.length >= 3 ? { filas, fin: j } : null;
}

export function leerTablaColumnas(L, i, opt = {}) {
  const H = L[i]; if (!H || H.s.length > 80 || /[.;]$/.test(H.s) || CAMPO.test(H.s)) return null;
  const xs = [];
  for (let j = i; j < Math.min(L.length, i + 9); j++) {
    if (j > i && (L[j].y > L[j - 1].y + 4 || L[j - 1].y - L[j].y > L[j - 1].h * 3.6)) break;
    for (const g of L[j].segs || []) if (g.x > H.x + 40) xs.push(g.x);
    if (L[j].x > H.x + 40) xs.push(L[j].x);
  }
  let conHueco = 0;
  for (let j = i; j < Math.min(L.length, i + 9); j++) if ((L[j].cells || []).length >= 2) conHueco++;
  if (conHueco < 2) return null;
  const grupos = [];
  xs.sort((a, b) => a - b).forEach(x => { const g = grupos.find(g => Math.abs(g.x - x) <= 9); if (g) { g.n++; g.x = (g.x * (g.n - 1) + x) / g.n; } else grupos.push({ x, n: 1 }); });
  const cols = grupos.filter(g => g.n >= 3).map(g => g.x);
  if (!cols.length) return null;
  const bordes = [H.x, ...cols];
  const filas = [partirLinea(H, bordes)];
  if (filas[0].filter(Boolean).length < 2) return null;
  let j = i + 1, ult = H, llenas = 0;
  for (; j < L.length; j++) {
    const l = L[j];
    if (l.y > ult.y + 4 || ult.y - l.y > ult.h * 3.2 || CAMPO.test(l.s)) break;
    if (/^(Con un espacio de conjuro|Usar un espacio de conjuro|Mejora de truco)/.test(l.s) || /^[+•]\s/.test(l.s)) break;
    if (/^[A-ZÁÉÍÓÚ][\p{L} ]{2,30}\.\s+\S/u.test(partirLinea(l, bordes)[0])) break;
    const c = partirLinea(l, bordes), llenasAqui = c.filter(Boolean).length;
    const enPrimera = Math.abs(l.x - bordes[0]) <= 10;
    if (enPrimera && llenasAqui >= 2) { filas.push(c); llenas++; ult = l; continue; }
    if (!enPrimera && bordes.slice(1).some(b => Math.abs(l.x - b) <= 12)) {
      const f = filas[filas.length - 1]; c.forEach((t, k) => { if (t) f[k] = (f[k] + ' ' + t).trim(); }); ult = l; continue;
    }
    if (enPrimera && llenasAqui === 1 && l.s.length < 34 && !/\.$/.test(l.s) && filas.length > 1 && !mayus(l.s)) { filas[filas.length - 1][0] += ' ' + l.s; ult = l; continue; }
    break;
  }
  if (llenas < 2) return null;
  const celdas = filas.flat().filter(Boolean);
  const basura = celdas.filter(c => letras(c).length < 2 && !/\d/.test(c)).length;
  const minus = filas.slice(1).filter(f => /^[a-záéíóúñ]/.test(f.find(Boolean) || '')).length;
  const etiquetas = filas.filter(f => /^[\p{L} ]{2,14}:$/u.test(f[0]) || /^(CA|PG|VD|Fue|Des|Con|Int|Sab|Car)\b/i.test(f[0])
    || /\b(CA|PG|Velocidad|VD|Inmunidades|Sentidos|Idiomas):/.test(f[0]) || /^[/|\[l]\s/.test(f[0])).length;
  if (basura / celdas.length > 0.15 || minus / (filas.length - 1) > 0.25 || etiquetas >= 2) return null;
  const usadas = bordes.map((_, k) => filas.some(f => f[k]));
  const limpias = filas.map(f => f.filter((_, k) => usadas[k]));
  if (limpias[0].length < 2) return null;
  return { filas: limpias, fin: j };
}

export function leerTabla(L, i, opt) {
  return leerTablaDado(L, i) || (opt?.columnas === false ? null : leerTablaColumnas(L, i, opt));
}
export const tablaATexto = filas => filas.map(filaTexto).join('\n');

export function intervalo(rot) {
  const m = /^(\d{1,3})(?:\s*[–-]\s*(\d{1,3}))?$/.exec(String(rot).trim()); if (!m) return null;
  const a = +m[1] || (m[1] === '00' ? 100 : 0);
  let b = m[2] != null ? +m[2] : a; if (m[2] === '00') b = 100;
  return [a === 0 && m[1] === '00' ? 100 : a, b];
}

export const arreglarDados = t => String(t)
  .replace(/\b(\d{1,2})4(4|6|8|10|12|20)\b(?=\s*(?:\+\s*\d|de daño|puntos de golpe|de curación))/g, '$1d$2')
  .replace(/(\b[Tt]ira(?:r|s)?\s+(?:un\s+)?)(\d)[4d](4|6|8|10|12|20|100)\b/g, '$1$2d$3');
