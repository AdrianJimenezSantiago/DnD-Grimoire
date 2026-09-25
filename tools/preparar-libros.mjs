import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { analizarLibro } from '../web/src/domain/libroCompleto.js';
import { loadSrd } from '../web/src/domain/catalogo.js';
import { componerLibro, aceptarPropuestas, hayContenido } from '../web/src/domain/componerLibro.js';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [origen = path.join(RAIZ, 'tools/resources'), destino = path.join(RAIZ, 'www/libros')] = process.argv.slice(2);
const MUESTRA = 40;

const esPdf = f => { const b = Buffer.alloc(5), fd = fs.openSync(f, 'r'); fs.readSync(fd, b, 0, 5, 0); fs.closeSync(fd); return b.toString() === '%PDF-'; };

async function leer(archivo) {
  const doc = await pdfjs.getDocument({ url: archivo, disableFontFace: true, isEvalSupported: false, verbosity: 0 }).promise;
  let titulo = '';
  try { titulo = (await doc.getMetadata())?.info?.Title?.trim() || ''; } catch {}
  if (!titulo || /^(untitled|sin t[ií]tulo)$/i.test(titulo)) titulo = path.basename(archivo).replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const paginas = [];
  let conTexto = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p), tc = await page.getTextContent(), w = page.getViewport({ scale: 1 }).width;
    page.cleanup();
    const items = tc.items.filter(i => i.str).map(i => ({ str: i.str, transform: i.transform, width: i.width, height: i.height }));
    if (items.some(i => i.str.trim())) conTexto++;
    if (p === MUESTRA && !conTexto) { await doc.destroy(); return null; }
    paginas.push({ p, w, items });
  }
  await doc.destroy();
  return { titulo, ...analizarLibro(paginas) };
}

const compendio = JSON.parse(fs.readFileSync(path.join(RAIZ, 'web/public/data/compendio.json'), 'utf8'));
if (!(await loadSrd(Promise.resolve(compendio)))) throw new Error('No se pudo cargar el compendio');
fs.mkdirSync(destino, { recursive: true });
const indice = [];
for (const nombre of fs.readdirSync(origen).filter(f => /\.pdf$/i.test(f)).sort()) {
  const archivo = path.join(origen, nombre), t0 = Date.now();
  if (!esPdf(archivo)) { console.log(`· ${nombre}: sin descargar (puntero de Git LFS), se salta`); continue; }
  const r = await leer(archivo);
  if (!r || !hayContenido(r)) { console.log(`· ${nombre}: sin texto que leer (PDF escaneado), se salta`); continue; }
  const { lb, props } = componerLibro(r, 0), libro = aceptarPropuestas(lb, props);
  const json = JSON.stringify(libro), version = crypto.createHash('sha256').update(json).digest('hex').slice(0, 16), archivoJson = `${libro.id}.json`;
  fs.writeFileSync(path.join(destino, archivoJson), json);
  indice.push({ id: libro.id, titulo: libro.titulo, archivo: archivoJson, version });
  const n = (k, t) => (libro[k] || []).length ? `${libro[k].length} ${t}` : '';
  console.log(`✓ ${nombre} → ${libro.titulo} (${Math.round((Date.now() - t0) / 1000)} s, ${(json.length / 1e6).toFixed(1)} MB): ${[
    Object.keys(libro.textos).length ? `${Object.keys(libro.textos).length} conjuros` : '', n('glosario', 'reglas'), n('objetos', 'objetos'), n('dotes', 'dotes'),
    n('trasfondos', 'trasfondos'), n('subTextos', 'subclases'), n('especies', 'especies'), n('criaturas', 'criaturas')].filter(Boolean).join(', ')}`);
}
fs.writeFileSync(path.join(destino, 'indice.json'), JSON.stringify(indice));
console.log(`${indice.length} libros en ${path.relative(RAIZ, destino) || destino}`);
