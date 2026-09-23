/**
 * Lee las descripciones de conjuros del PDF del Manual del Jugador del propio usuario, en su dispositivo.
 * Se carga bajo demanda (pdf.js pesa ~1 MB) y el texto se guarda solo en el almacenamiento local.
 */
import { abrirPdf } from './pdf.js';
import { pageToColumns } from '../domain/manualLineas.js';
import { parseSpells } from '../domain/manual.js';
import { parseGlosario } from '../domain/glosario.js';

const HAS = items => items.some(it => /Tiempo de lanza/.test(it.str));

export async function leerManual(file, onProgress = () => {}) {
  onProgress({ fase: 'abrir' });
  const doc = await abrirPdf(file);
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
  // Glosario de reglas: desde «Definiciones de las reglas» hasta el índice de términos
  const glos = []; let dentro = false;
  for (let p = last + 1; p <= N; p++) {
    const r = await leer(p), cols = pageToColumns(r.items, r.w);
    const txt = cols.flat().map(l => l.s).join('\n').replace(/\s+/g, ' ');
    onProgress({ fase: 'glosario', pagina: p, total: N });
    // títulos en mayúsculas (el texto normal también menciona «el índice de términos»)
    if (!dentro && /DEFINICIONES DE LAS REGLAS/.test(txt)) dentro = true;
    if (dentro && glos.length && /ÍNDICE DE TÉRMINOS/.test(txt)) break;
    if (dentro) glos.push({ p, cols });
  }
  await doc.destroy();
  onProgress({ fase: 'analizar' });
  return { spells: parseSpells(pages), glosario: glos.length ? parseGlosario(glos) : [] };
}
