// Utilidades compartidas por las herramientas de medición del OCR de los manuales.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pageToColumns } from '../../web/src/domain/manualLineas.js';

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

// Texto de una página tal y como lo ve la app: líneas de cada columna (pageToColumns), columnas separadas por una línea en blanco
export async function textoPagina(doc, p) {
  const page = await doc.getPage(p), tc = await page.getTextContent(), w = page.getViewport({ scale: 1 }).width;
  page.cleanup();
  const items = tc.items.filter(i => i.str).map(i => ({ str: i.str, transform: i.transform, width: i.width, height: i.height }));
  return pageToColumns(items, w).map(col => col.map(l => l.s).join('\n')).filter(Boolean).join('\n\n');
}

export const leerPaginas = () => JSON.parse(fs.readFileSync(path.join(DIR, 'paginas.json'), 'utf8')).paginas;
export const nombreRef = pg => `${pg.libro}-${String(pg.pagina).padStart(3, '0')}.txt`;
