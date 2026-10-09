// Prepara las páginas de referencia: copia el texto que lee la app de cada página de paginas.json
// en referencia/ (solo si aún no existe, para no pisar lo ya corregido a mano).
// Con --imagenes <dir> también renderiza cada página en cuatro cuartos legibles para revisarla.
//   node tools/ocr/extraer.mjs [--imagenes /tmp/ocr] [--libro phb] [--pagina 240]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { DIR, abrir, archivoLibro, textoPagina, leerPaginas, nombreRef } from './comun.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const dirImg = arg('--imagenes'), soloLibro = arg('--libro'), soloPagina = arg('--pagina');
const refs = path.join(DIR, 'referencia');
fs.mkdirSync(refs, { recursive: true });

const paginas = leerPaginas().filter(pg => (!soloLibro || pg.libro === soloLibro) && (!soloPagina || pg.pagina === +soloPagina));
const docs = {};
for (const pg of paginas) {
  const doc = docs[pg.libro] ||= await abrir(pg.libro), destino = path.join(refs, nombreRef(pg));
  if (!fs.existsSync(destino)) { fs.writeFileSync(destino, (await textoPagina(doc, pg.pagina)) + '\n'); console.log('borrador', path.relative(DIR, destino)); }
  if (dirImg) {
    fs.mkdirSync(dirImg, { recursive: true });
    const vp = (await doc.getPage(pg.pagina)).getViewport({ scale: 1 }), r = Math.round(1640 * 72 / vp.width);
    const W = Math.round(vp.width * r / 72), H = Math.round(vp.height * r / 72), base = path.join(dirImg, nombreRef(pg).replace(/\.txt$/, ''));
    // Cuartos solapados un poco para no cortar líneas: columna izquierda/derecha × mitad superior/inferior
    for (const [k, x, y] of [['a', 0, 0], ['b', 0, 1], ['c', 1, 0], ['d', 1, 1]])
      execFileSync('pdftoppm', ['-f', String(pg.pagina), '-l', String(pg.pagina), '-r', String(r), '-png', '-singlefile',
        '-x', String(x * Math.round(W / 2 - 20)), '-y', String(y * Math.round(H / 2 - 30)), '-W', String(Math.round(W / 2 + 20)), '-H', String(Math.round(H / 2 + 30)),
        archivoLibro(pg.libro), `${base}-${k}`]);
  }
}
for (const d of Object.values(docs)) await d.loadingTask.destroy();
