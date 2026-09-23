/**
 * Apertura de PDF con pdf.js, compartida por el importador del manual y el de historias.
 * Se carga bajo demanda. En el archivo único de Windows (file://) pdf.js trabaja en el hilo principal.
 */
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

async function preparar() {
  if (import.meta.env.MODE === 'windows') {
    if (!globalThis.pdfjsWorker) globalThis.pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
  } else pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
}
export async function abrirPdf(file) {
  await preparar();
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data, disableFontFace: true, isEvalSupported: false }).promise;
}
/** Todas las páginas como fragmentos sencillos {s,x,y,h,w}. */
export async function paginasSimples(file, onProgress = () => {}) {
  const doc = await abrirPdf(file), out = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const pg = await doc.getPage(p), tc = await pg.getTextContent();
    out.push({ items: tc.items.filter(i => i.str).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], h: Math.abs(i.transform[3]) || i.height || 10, w: i.width || 0 })) });
    pg.cleanup(); onProgress(p, doc.numPages);
  }
  await doc.destroy();
  return out;
}
