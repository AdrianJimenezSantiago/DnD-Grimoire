/**
 * Importa un libro en PDF (Manual del Jugador o expansiones con el mismo formato) en el dispositivo:
 * recorre todas las páginas y recoge conjuros (formato «Tiempo de lanzamiento / Alcance / Componentes / Duración»),
 * el glosario de reglas si lo tiene y las subclases que detecte. Nada sale del dispositivo.
 */
import { abrirPdf } from './pdf.js';
import { pageToColumns } from '../domain/manualLineas.js';
import { parseSpells } from '../domain/manual.js';
import { parseGlosario } from '../domain/glosario.js';
import { detectarSubclases } from '../domain/libros.js';

const HAS = items => items.some(it => /Tiempo de lanza/.test(it.str));
const SUBC = items => items.some(it => /SUBCLASE DE/i.test(it.str));

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
    const hechizo = HAS(tc.items), subc = SUBC(tc.items);
    const txt = tc.items.map(i => i.str).join(' ');
    paginas.push({ p, hechizo, subc, glosIni: /DEFINICIONES DE LAS REGLAS/.test(txt), glosFin: /ÍNDICE DE TÉRMINOS/.test(txt), items: hechizo || subc || /DEFINICIONES|ÍNDICE DE TÉRMINOS/.test(txt) ? tc.items : null, w });
    onProgress({ fase: 'leer', pagina: p, total: N });
  }
  // Conjuros: del primer al último capítulo con fichas; se incluyen las páginas intermedias (continuaciones, ilustraciones)
  const conHechizo = paginas.filter(x => x.hechizo).map(x => x.p);
  const bloques = [];
  for (const p of conHechizo) { const b = bloques[bloques.length - 1]; if (b && p - b[1] <= 3) b[1] = p; else bloques.push([p, p]); }
  const leer = async p => { const x = paginas[p - 1]; if (x.items) return x; const page = await doc.getPage(p), tc = await page.getTextContent(); page.cleanup(); x.items = tc.items; return x; };
  const spells = [];
  for (const [a, b] of bloques) {
    const pags = [];
    for (let p = a; p <= b; p++) { const x = await leer(p); pags.push({ p, cols: pageToColumns(x.items, x.w) }); }
    spells.push(...parseSpells(pags));
  }
  // Glosario de reglas
  onProgress({ fase: 'glosario' });
  const ini = paginas.find(x => x.glosIni), glos = [];
  if (ini) for (let p = ini.p; p <= N; p++) { const x = await leer(p); if (x.glosFin && glos.length) break; glos.push({ p, cols: pageToColumns(x.items, x.w) }); }
  // Subclases
  const subPags = [];
  for (const x of paginas) if (x.subc || /RASGOS DE/.test((x.items || []).map(i => i.str).join(' '))) subPags.push({ p: x.p, cols: pageToColumns((await leer(x.p)).items, x.w) });
  await doc.destroy();
  onProgress({ fase: 'analizar' });
  return { titulo, spells, glosario: glos.length ? parseGlosario(glos) : [], subclases: detectarSubclases(subPags) };
}
/** Compatibilidad: el importador anterior. */
export const leerManual = leerLibro;
