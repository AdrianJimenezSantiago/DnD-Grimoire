// Lectura de PDF con pdf.js: abre el documento y devuelve sus páginas como texto con posiciones.
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
