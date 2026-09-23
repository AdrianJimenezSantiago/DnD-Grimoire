/**
 * Lee las descripciones de conjuros del PDF del Manual del Jugador del propio usuario, en su dispositivo.
 * Se carga bajo demanda (pdf.js pesa ~1 MB) y el texto se guarda solo en el almacenamiento local.
 */
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { pageToColumns } from '../domain/manualLineas.js';
import { parseSpells } from '../domain/manual.js';

// Android y web: el lector de PDF trabaja en un hilo aparte (worker).
// Archivo único de Windows (abierto desde el disco): los workers no se pueden cargar desde file://,
// así que pdf.js usa su modo en el hilo principal con el mismo código, ya incluido en el HTML.
async function prepararPdf() {
  if (import.meta.env.MODE === 'windows') {
    if (!globalThis.pdfjsWorker) globalThis.pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
  } else pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
}
const HAS = items => items.some(it => /Tiempo de lanza/.test(it.str));

export async function leerManual(file, onProgress = () => {}) {
  onProgress({ fase: 'abrir' });
  await prepararPdf();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, disableFontFace: true, isEvalSupported: false }).promise;
  const N = doc.numPages, cache = new Map();
  const leer = async p => {
    if (cache.has(p)) return cache.get(p);
    const page = await doc.getPage(p), tc = await page.getTextContent(), w = page.getViewport({ scale: 1 }).width;
    page.cleanup(); const r = { p, items: tc.items, w, has: HAS(tc.items) }; cache.set(p, r); return r;
  };
  // Localiza el capítulo de descripciones: desde la mitad del libro hacia delante; si no, desde el principio
  let first = 0, last = 0, miss = 0, visto = 0;
  const barrer = async (desde, hasta) => {
    for (let p = desde; p <= hasta; p++) {
      const r = await leer(p); visto++;
      onProgress({ fase: 'leer', pagina: p, total: N, visto });
      if (r.has) { if (!first) first = p; last = p; miss = 0; } else if (first && ++miss >= 4) break;
    }
  };
  await barrer(Math.max(1, Math.floor(N * 0.45)), N);
  if (!first) await barrer(1, N);
  if (!first) { await doc.destroy(); throw new Error('No encuentro el capítulo de descripciones de conjuros en este PDF.'); }
  const pages = [];
  for (let p = first; p <= last; p++) { const r = await leer(p); pages.push({ p, cols: pageToColumns(r.items, r.w) }); }
  await doc.destroy();
  onProgress({ fase: 'analizar' });
  return parseSpells(pages);
}
