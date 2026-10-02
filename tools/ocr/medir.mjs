// Mide los errores del texto que lee la app frente a las páginas de referencia corregidas a mano.
//   node tools/ocr/medir.mjs                 OCR tal cual
//   node tools/ocr/medir.mjs --corregir      tras pasar el corrector (web/src/domain/libros/corrector.js)
//   node tools/ocr/medir.mjs --errores 40    además, las 40 confusiones de palabra más frecuentes
//   node tools/ocr/medir.mjs --conjunto desarrollo|prueba
//   node tools/ocr/medir.mjs --corregir --fusionar tess-fast   base del PDF fusionada con otro OCR (web/src/domain/libros/fusion.js)
//   node tools/ocr/medir.mjs --motor tess-best   texto de otro OCR (lo deja reocr.mjs en .cache/motores/<motor>/)
// CER: distancia de edición entre caracteres / caracteres de la referencia.
// WER: lo mismo contando palabras. Los saltos de línea cuentan como un espacio.
import fs from 'node:fs';
import path from 'node:path';
import { pageToColumns } from '../../web/src/domain/libros/manualLineas.js';
import { DIR, abrir, textoPagina, textoLibro, leerPaginas, nombreRef } from './comun.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const motor = arg('--motor'), conFusion = arg('--fusionar'), conCorrector = process.argv.includes('--corregir'), nErrores = +(arg('--errores') || 0), soloConjunto = arg('--conjunto');
let corregir = lineas => lineas;
if (conCorrector) {
  // Vocabulario de los libros con texto: es lo que tendría la app con los libros incluidos
  const { crearVocabulario, corregirLineas } = await import('../../web/src/domain/libros/corrector.js'), textos = [];
  for (const id of ['phb', 'dmg', 'faerun']) textos.push(...await textoLibro(id));
  const voc = crearVocabulario(textos);
  if (process.argv.includes('--traza')) voc.traza = [];
  globalThis.__voc = voc;
  corregir = lineas => corregirLineas(lineas, voc);
  if (conFusion) { const { fusionar } = await import('../../web/src/domain/libros/fusion.js'); globalThis.__fusionar = (l, o) => fusionar(l, o, voc); }
}
const textoMotor = (m, pg) => { const { w, items } = JSON.parse(fs.readFileSync(path.join(DIR, '.cache/motores', m, nombreRef(pg).replace(/\.txt$/, '.json')), 'utf8'));
  return pageToColumns(items, w).map(col => col.map(l => l.s).join('\n')).filter(Boolean).join('\n\n'); };
const normal = t => corregir(t.split('\n')).join(' ').replace(/\s+/g, ' ').trim();

function distancia(a, b) {
  let prev = new Uint32Array(b.length + 1), cur = new Uint32Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

// Alineación por palabras para listar sustituciones (ocr → referencia)
function sustituciones(a, b) {
  const n = a.length, m = b.length, D = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = 0; i <= n; i++) D[i][0] = i;
  for (let j = 0; j <= m; j++) D[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const out = [];
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) { if (a[i - 1] !== b[j - 1]) out.push(`${a[i - 1]} → ${b[j - 1]}`); i--; j--; }
    else if (D[i][j] === D[i - 1][j] + 1) { out.push(`${a[i - 1]} → ∅`); i--; }
    else { out.push(`∅ → ${b[j - 1]}`); j--; }
  }
  while (i > 0) out.push(`${a[--i]} → ∅`);
  while (j > 0) out.push(`∅ → ${b[--j]}`);
  return out;
}

const soloLibro = arg('--libro');
const paginas = leerPaginas().filter(pg => (!soloConjunto || pg.conjunto === soloConjunto) && (!soloLibro || pg.libro === soloLibro)), docs = {}, filas = [], confusiones = new Map();
for (const pg of paginas) {
  let crudo;
  if (motor) crudo = textoMotor(motor, pg);
  else crudo = await textoPagina(docs[pg.libro] ||= await abrir(pg.libro), pg.pagina);
  let fundida = null;
  if (conFusion) { fundida = corregir(crudo.split('\n')); for (const m of conFusion.split(',')) fundida = globalThis.__fusionar(fundida, corregir(textoMotor(m, pg).split('\n')).join(' ')); }
  const ocr = fundida ? fundida.join(' ').replace(/\s+/g, ' ').trim() : normal(crudo), ref = fs.readFileSync(path.join(DIR, 'referencia', nombreRef(pg)), 'utf8').replace(/\s+/g, ' ').trim();
  const po = ocr.split(' '), pr = ref.split(' ');
  filas.push({ ...pg, c: distancia(ocr, ref), nc: ref.length, w: distancia(po, pr), nw: pr.length });
  if (nErrores) for (const s of sustituciones(po, pr)) confusiones.set(s, (confusiones.get(s) || 0) + 1);
}
for (const d of Object.values(docs)) await d.destroy();

const pct = (a, b) => (100 * a / b).toFixed(2).padStart(6) + ' %';
const resumen = (nombre, fs_) => {
  const s = k => fs_.reduce((t, f) => t + f[k], 0);
  console.log(`${nombre.padEnd(24)} CER ${pct(s('c'), s('nc'))}   WER ${pct(s('w'), s('nw'))}   (${fs_.length} págs., ${s('nw')} palabras)`);
};
console.log(`${motor ? `Motor ${motor}` : 'OCR original'}, ${conCorrector ? 'con corrector' : 'sin corregir'}`);
if (process.argv.includes('--paginas')) for (const f of filas) console.log(`  ${f.libro} p.${f.pagina} ${f.conjunto} CER ${pct(f.c, f.nc)} WER ${pct(f.w, f.nw)}`);
for (const f of filas.sort((a, b) => b.w / b.nw - a.w / a.nw).slice(0, 8)) console.log(`  peor: ${f.libro} p.${f.pagina} (${f.tipo})  CER ${pct(f.c, f.nc)}  WER ${pct(f.w, f.nw)}`);
for (const l of [...new Set(filas.map(f => f.libro))]) resumen(l, filas.filter(f => f.libro === l));
for (const c of ['desarrollo', 'prueba']) if (filas.some(f => f.conjunto === c)) resumen(c, filas.filter(f => f.conjunto === c));
resumen('TOTAL', filas);
if (nErrores) {
  console.log(`\nConfusiones más frecuentes (OCR → referencia):`);
  for (const [s, n] of [...confusiones].sort((a, b) => b[1] - a[1]).slice(0, nErrores)) console.log(String(n).padStart(4), s);
}
if (globalThis.__voc?.traza) {
  console.log('\nCambios del corrector por regla:');
  const por = new Map(); for (const [r, a, b] of globalThis.__voc.traza) { const k = `${r}: ${a} → ${b}`; por.set(k, (por.get(k) || 0) + 1); }
  for (const [k, n] of [...por].sort()) console.log(String(n).padStart(3), k);
}
