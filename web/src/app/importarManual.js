import { abrirPdf } from '../platform/pdf.js';
import { analizarLibro } from '../domain/libros/libroCompleto.js';

// Frecuencias de palabras de los manuales para corregir el OCR; si no se puede cargar, se corrige solo con el propio libro
async function vocabularioBase() {
  try {
    if (import.meta.env.MODE === 'windows') return (await import('../../public/data/vocabulario.json')).default;
    return await (await fetch('data/vocabulario.json')).json();
  } catch { return {}; }
}

export async function leerLibro(file, onProgress = () => {}) {
  onProgress({ fase: 'abrir' });
  const doc = await abrirPdf(file);
  const N = doc.numPages;
  let titulo = '';
  try { titulo = (await doc.getMetadata())?.info?.Title?.trim() || ''; } catch {}
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
  await new Promise(r => setTimeout(r, 30));
  return { titulo, ...analizarLibro(paginas, fase => onProgress({ fase }), { vocabulario: await vocabularioBase() }) };
}
