/**
 * Importa un libro en PDF (Manual del Jugador, Guía del Dungeon Master o expansiones en español) en el dispositivo.
 * Recorre todas las páginas y recoge lo que reconozca: conjuros, glosario de reglas, objetos mágicos, dotes,
 * trasfondos, subclases con sus rasgos y los apartados de reglas del DM. Nada sale del dispositivo.
 */
import { abrirPdf } from './pdf.js';
import { analizarLibro } from '../domain/libroCompleto.js';

export async function leerLibro(file, onProgress = () => {}) {
  onProgress({ fase: 'abrir' });
  const doc = await abrirPdf(file);
  const N = doc.numPages;
  let titulo = '';
  try { titulo = (await doc.getMetadata())?.info?.Title?.trim() || ''; } catch { /* sin metadatos */ }
  if (!titulo || /^(untitled|sin t[ií]tulo)$/i.test(titulo)) titulo = file.name.replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const paginas = [];
  for (let p = 1; p <= N; p++) {
    const page = await doc.getPage(p), tc = await page.getTextContent(), w = page.getViewport({ scale: 1 }).width;
    page.cleanup();
    paginas.push({ p, w, items: tc.items.filter(i => i.str).map(i => ({ str: i.str, transform: i.transform, width: i.width, height: i.height })) });
    onProgress({ fase: 'leer', pagina: p, total: N });
  }
  await doc.destroy();
  onProgress({ fase: 'analizar' });
  await new Promise(r => setTimeout(r, 30));   // deja pintar el aviso antes del análisis
  return { titulo, ...analizarLibro(paginas, fase => onProgress({ fase })) };
}
/** Compatibilidad: el importador anterior. */
export const leerManual = leerLibro;
