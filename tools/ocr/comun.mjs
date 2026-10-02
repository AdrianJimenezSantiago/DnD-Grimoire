// Utilidades compartidas por las herramientas de medición del OCR de los manuales.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { paginaAColumnas } from '../../web/src/domain/libros/manualLineas.js';

export const RAIZ = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
export const DIR = path.join(RAIZ, 'tools/ocr');
export const LIBROS = {
  phb: /Manual_del_Jugador/i,
  dmg: /DMG/i,
  faerun: /Faerun/i,
  mm: /Monstruos/i
};

export function archivoLibro(id) {
  const dir = path.join(RAIZ, 'tools/resources'), f = fs.readdirSync(dir).find(n => LIBROS[id].test(n));
  if (!f) throw new Error(`No está el PDF de «${id}» en tools/resources`);
  const ruta = path.join(dir, f), b = Buffer.alloc(5), fd = fs.openSync(ruta, 'r');
  fs.readSync(fd, b, 0, 5, 0); fs.closeSync(fd);
  if (b.toString() !== '%PDF-') throw new Error(`${f} es un puntero de Git LFS: descárgalo con «git lfs pull»`);
  return ruta;
}

export const abrir = id => pdfjs.getDocument({ url: archivoLibro(id), disableFontFace: true, isEvalSupported: false, verbosity: 0 }).promise;

// Texto de una página tal y como lo ve la app: líneas de cada columna (paginaAColumnas), columnas separadas por una línea en blanco
export async function textoPagina(doc, p) {
  const page = await doc.getPage(p), tc = await page.getTextContent(), w = page.getViewport({ scale: 1 }).width;
  page.cleanup();
  const items = tc.items.filter(i => i.str).map(i => ({ str: i.str, transform: i.transform, width: i.width, height: i.height }));
  return paginaAColumnas(items, w).map(col => col.map(l => l.s).join('\n')).filter(Boolean).join('\n\n');
}

export const leerPaginas = () => JSON.parse(fs.readFileSync(path.join(DIR, 'paginas.json'), 'utf8')).paginas;
export const nombreRef = pg => `${pg.libro}-${String(pg.pagina).padStart(3, '0')}.txt`;

// Texto de todas las páginas de un libro (para el vocabulario), guardado en .cache/ porque leer el PDF entero tarda
export async function textoLibro(id) {
  const st = fs.statSync(archivoLibro(id)), dir = path.join(DIR, '.cache'), f = path.join(dir, `${id}.json`), clave = `${st.size}-${st.mtimeMs}`;
  try { const c = JSON.parse(fs.readFileSync(f, 'utf8')); if (c.clave === clave) return c.paginas; } catch {}
  const doc = await abrir(id), paginas = [];
  for (let p = 1; p <= doc.numPages; p++) paginas.push(await textoPagina(doc, p));
  await doc.destroy();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ clave, paginas }));
  return paginas;
}

// Elementos de texto (como los de pdf.js) a partir de la salida TSV de Tesseract: las palabras de cada línea se agrupan en
// frases y solo se cortan en huecos grandes (celdas de tabla), para que paginaAColumnas vea lo mismo que con un PDF normal
export function itemsDeTsv(tsv, dpi, altoPx) {
  const k = 72 / dpi, lineas = new Map();
  for (const fila of tsv.split('\n').slice(1)) {
    const c = fila.split('\t');
    if (c.length < 12 || c[0] !== '5' || !c[11].trim()) continue;
    const [blo, par, lin, x, y, w, h] = [c[2], c[3], c[4], +c[6], +c[7], +c[8], +c[9]];
    const id = `${blo}.${par}.${lin}`;
    if (!lineas.has(id)) lineas.set(id, []);
    lineas.get(id).push({ x, y, w, h, s: c[11].trim() });
  }
  const items = [];
  for (const ps of lineas.values()) {
    ps.sort((a, b) => a.x - b.x);
    const alto = ps.map(p => p.h).sort((a, b) => a - b)[Math.floor(ps.length / 2)];
    let frase = [ps[0]];
    const cierra = () => {
      const x0 = frase[0].x, x1 = Math.max(...frase.map(p => p.x + p.w)), abajo = Math.max(...frase.map(p => p.y + p.h)), arriba = Math.min(...frase.map(p => p.y));
      const fs = (abajo - arriba) * k * 0.8;
      items.push({ str: frase.map(p => p.s).join(' '), transform: [fs, 0, 0, fs, x0 * k, (altoPx - abajo) * k + fs * 0.2], width: (x1 - x0) * k, height: fs });
    };
    for (let i = 1; i < ps.length; i++) {
      const prev = frase[frase.length - 1];
      if (ps[i].x - (prev.x + prev.w) > alto * 1.8) { cierra(); frase = [ps[i]]; } else frase.push(ps[i]);
    }
    cierra();
  }
  return items;
}
