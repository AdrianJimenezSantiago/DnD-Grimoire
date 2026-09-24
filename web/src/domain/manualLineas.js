/**
 * Reconstrucción de líneas a partir de los fragmentos de texto de pdf.js.
 * Separa las dos columnas de la página y ordena de arriba abajo. Puro: se prueba en Node y se usa en la app.
 */
/** Margen de la columna derecha: la x donde más fragmentos empiezan dentro de la franja central. */
export function gutterOf(items, pageWidth) {
  const count = new Map();
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const x = Math.round(it.transform[4]);
    if (x > pageWidth * 0.38 && x < pageWidth * 0.66) count.set(x, (count.get(x) || 0) + 1);
  }
  // se suman vecinos (±2) para tolerar pequeñas variaciones
  const win = x => { let c = 0; for (let d = -2; d <= 2; d++) c += count.get(x + d) || 0; return c; };
  const best = Math.max(0, ...[...count.keys()].map(win));
  if (best < 6) return pageWidth / 2;
  // el margen de la columna es el grupo significativo más a la izquierda (las tablas laterales quedan más a la derecha)
  const at = Math.min(...[...count.keys()].filter(x => win(x) >= Math.max(6, best * 0.2)));
  return at - 8;
}
export function pageToColumns(items, pageWidth) {
  const mid = gutterOf(items, pageWidth);
  const cols = [[], []];
  for (const it of items) {
    if (!it.str) continue;
    const esp = !it.str.trim();   // pdf.js entrega a veces el espacio entre palabras como fragmento propio
    // número de página en el pie: nunca forma parte del texto
    if (!esp && /^\s*\d{1,3}\s*$/.test(it.str) && it.transform[5] < 75) continue;
    const x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
    // rótulos de fila de una tabla de la columna derecha («11-20», «96-00») que caen en el canal entre columnas
    const rotulo = !esp && x < mid && x > mid - pageWidth * 0.075 && /^\s*\d[\d\s–-]{0,6}$/.test(it.str);
    cols[x < mid && !rotulo ? 0 : 1].push({ x, y, h, w: esp ? 0 : it.width || 0, s: esp ? ' ' : it.str, esp });
  }
  return cols.map(col => {
    // Bandas: fragmentos a la misma altura (±45 % del cuerpo) forman una línea, ordenada de izquierda a derecha.
    // Dos fragmentos que se solapan en horizontal nunca comparten línea (título junto a final de párrafo, pies de foto…).
    col.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    for (const it of col) {
      const tol = h => Math.max(2, h * 0.45);
      let dest = null;
      for (let k = lines.length - 1; k >= 0 && k >= lines.length - 3; k--) {
        const L = lines[k];
        if (Math.abs(L.y - it.y) >= tol(Math.min(L.h, it.h))) continue;
        const m = Math.min(L.h, it.h) * 0.6;   // solape real, no el espacio final que pdf.js suma al ancho
        if (!it.esp && L.items.some(o => !o.esp && it.x < o.x + o.w - m && it.x + it.w > o.x + m)) continue;
        dest = L; break;
      }
      if (dest) { dest.items.push(it); if (!it.esp) dest.h = Math.max(dest.h, it.h); }
      else if (!it.esp) lines.push({ y: it.y, h: it.h, items: [it] });
    }
    return lines.map(L => {
      L.items.sort((a, b) => a.x - b.x);
      let s = '', fin = -Infinity;
      // celdas: tramos separados por un hueco grande (columnas de una tabla); el texto justificado nunca deja huecos así
      const cells = [];
      // espacio entre fragmentos si hay hueco visible (el texto justificado deja huecos pequeños entre palabras)
      for (const it of L.items) {
        if (it.esp) { if (s && !s.endsWith(' ')) s += ' '; if (cells.length) cells[cells.length - 1].s += ' '; continue; }
        const hueco = it.x - fin;
        if (!cells.length || hueco > Math.max(it.h * 1.6, 16)) cells.push({ x: it.x, s: '' });
        const c = cells[cells.length - 1];
        c.s += (c.s && hueco > it.h * 0.06 && !c.s.endsWith(' ') && !it.s.startsWith(' ') ? ' ' : '') + it.s;
        s += (s && hueco > it.h * 0.06 && !s.endsWith(' ') && !it.s.startsWith(' ') ? ' ' : '') + it.s; fin = it.x + it.w;
      }
      const segs = L.items.filter(it => !it.esp).map(it => ({ x: it.x, w: it.w, s: it.s }));
      return { x: L.items[0].x, y: L.y, h: L.h, s: s.replace(/\s+/g, ' ').trim(), segs, cells: cells.map(c => ({ x: c.x, s: c.s.replace(/\s+/g, ' ').trim() })).filter(c => c.s) };
    });
  });
}
