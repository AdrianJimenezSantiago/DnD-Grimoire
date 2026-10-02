// Segunda lectura OCR de un libro entero con Tesseract, para fusionarla con la capa de texto del PDF al preparar los libros.
// Guarda tools/ocr/lecturas/<id>.json con el texto de cada página (líneas como las de la app) y la huella del PDF.
//   node tools/ocr/segunda-lectura.mjs phb dmg faerun
// Necesita pdftoppm y tesseract con el idioma spa. Tarda (unos 20 s por página y núcleo); se puede cortar y retomar.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DIR, abrir, archivoLibro, textoLibro, itemsDeTsv } from './comun.mjs';
import { paginaAColumnas } from '../../web/src/domain/libros/manualLineas.js';

const ejecutar = promisify(execFile), DPI = 300;
export const huella = f => new Promise((ok, mal) => { const h = crypto.createHash('sha256'); fs.createReadStream(f).on('data', d => h.update(d)).on('end', () => ok(h.digest('hex'))).on('error', mal); });

for (const id of process.argv.slice(2)) {
  const pdf = archivoLibro(id), destino = path.join(DIR, 'lecturas', `${id}.json`), parcial = path.join(DIR, '.cache', `lectura-${id}.json`);
  const sha256 = await huella(pdf), base = await textoLibro(id), doc = await abrir(id);
  const alturas = [];
  for (let p = 1; p <= doc.numPages; p++) alturas.push((await doc.getPage(p)).getViewport({ scale: 1 }));
  await doc.destroy();
  let hecho = {};
  try { const c = JSON.parse(fs.readFileSync(parcial, 'utf8')); if (c.sha256 === sha256) hecho = c.paginas; } catch {}
  // Solo las páginas que tienen capa de texto: sin base no hay nada que fusionar
  const cola = base.map((t, i) => i + 1).filter(p => base[p - 1].trim().length > 40 && hecho[p] == null);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lectura-')), t0 = Date.now(), total = cola.length;
  let n = 0, guardado = Date.now();
  await Promise.all(Array.from({ length: os.cpus().length }, async () => {
    while (cola.length) {
      const p = cola.shift(), img = path.join(tmp, `p${p}`), vp = alturas[p - 1];
      await ejecutar('pdftoppm', ['-f', String(p), '-l', String(p), '-r', String(DPI), '-png', '-singlefile', pdf, img]);
      await ejecutar('tesseract', [img + '.png', img, '-l', 'spa', '--psm', '3', '--dpi', String(DPI), 'tsv'], { env: { ...process.env, OMP_THREAD_LIMIT: '1' } });
      const items = itemsDeTsv(fs.readFileSync(img + '.tsv', 'utf8'), DPI, Math.round(vp.height * DPI / 72));
      hecho[p] = paginaAColumnas(items, vp.width).map(col => col.map(l => l.s).join('\n')).filter(Boolean).join('\n\n');
      fs.rmSync(img + '.png'); fs.rmSync(img + '.tsv');
      n++;
      if (Date.now() - guardado > 60000) { guardado = Date.now(); fs.mkdirSync(path.dirname(parcial), { recursive: true }); fs.writeFileSync(parcial, JSON.stringify({ sha256, paginas: hecho })); }
      process.stdout.write(`\r${id}: ${n}/${total} páginas (${Math.round((Date.now() - t0) / 60000)} min)`);
    }
  }));
  fs.rmSync(tmp, { recursive: true, force: true });
  const { stdout: version } = await ejecutar('tesseract', ['--version']);
  const paginas = base.map((_, i) => hecho[i + 1] || '');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, JSON.stringify({ archivo: path.basename(pdf), sha256, motor: `${version.split('\n')[0]}, spa, ${DPI} ppp, psm 3`, paginas }));
  fs.rmSync(parcial, { force: true });
  console.log(`\n${id}: ${paginas.filter(Boolean).length} páginas → ${path.relative(process.cwd(), destino)}`);
}
