// Vuelve a pasar OCR a las páginas de referencia con otro motor y deja un JSON por página ({ w, items } como los de pdf.js)
// en .cache/motores/<motor>/,
// para medirlo con el mismo lector que usa la app: node tools/ocr/medir.mjs --motor <motor>
//   node tools/ocr/reocr.mjs --motor tesseract [--modelo /ruta/tessdata] [--dpi 300] [--psm 3] [--nombre tess-best]
// Necesita pdftoppm y tesseract (con el idioma spa).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DIR, abrir, archivoLibro, leerPaginas, nombreRef, itemsDeTsv } from './comun.mjs';

const ejecutar = promisify(execFile);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const motor = arg('--motor', 'tesseract'), modelo = arg('--modelo'), dpi = arg('--dpi', '300'), psm = arg('--psm', '3');
const nombre = arg('--nombre', `${motor}${modelo ? '-' + path.basename(modelo) : ''}-${dpi}-psm${psm}`);
const soloLibro = arg('--libro'), soloPagina = arg('--pagina');
const destino = path.join(DIR, '.cache/motores', nombre), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reocr-'));
fs.mkdirSync(destino, { recursive: true });

async function tesseract(pg) {
  const base = path.join(tmp, nombreRef(pg).replace(/\.txt$/, '')), salida = path.join(destino, nombreRef(pg).replace(/\.txt$/, ''));
  if (fs.existsSync(salida + '.json')) return;
  await ejecutar('pdftoppm', ['-f', String(pg.pagina), '-l', String(pg.pagina), '-r', dpi, '-png', '-singlefile', archivoLibro(pg.libro), base]);
  await ejecutar('tesseract', [base + '.png', base, '-l', 'spa', '--psm', psm, '--dpi', dpi, ...(modelo ? ['--tessdata-dir', modelo] : []), 'tsv'],
    { env: { ...process.env, OMP_THREAD_LIMIT: '1' } });
  const doc = await abrir(pg.libro), vp = (await doc.getPage(pg.pagina)).getViewport({ scale: 1 });
  await doc.destroy();
  const items = itemsDeTsv(fs.readFileSync(base + '.tsv', 'utf8'), +dpi, Math.round(vp.height * +dpi / 72));
  fs.writeFileSync(salida + '.json', JSON.stringify({ w: vp.width, items }));
  fs.rmSync(base + '.png'); fs.rmSync(base + '.tsv');
}

// PaddleOCR (PP-OCRv4, el modelo que trae rapidocr_onnxruntime): una caja por línea de texto
async function paddle(pg) {
  const base = path.join(tmp, nombreRef(pg).replace(/\.txt$/, '')), salida = path.join(destino, nombreRef(pg).replace(/\.txt$/, ''));
  if (fs.existsSync(salida + '.json')) return;
  await ejecutar('pdftoppm', ['-f', String(pg.pagina), '-l', String(pg.pagina), '-r', dpi, '-png', '-singlefile', archivoLibro(pg.libro), base]);
  await ejecutar('python3', [path.join(DIR, 'paddle.py'), base + '.png', base + '.json'], { env: { ...process.env, OMP_NUM_THREADS: '1' }, maxBuffer: 1 << 26 });
  const doc = await abrir(pg.libro), vp = (await doc.getPage(pg.pagina)).getViewport({ scale: 1 });
  await doc.destroy();
  const k = 72 / +dpi, H = vp.height, items = JSON.parse(fs.readFileSync(base + '.json', 'utf8')).map(({ caja, texto }) => {
    const xs = caja.map(p => p[0]), ys = caja.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), fs_ = (y1 - y0) * k * 0.8;
    return { str: texto, transform: [fs_, 0, 0, fs_, x0 * k, H - y1 * k + fs_ * 0.2], width: (x1 - x0) * k, height: fs_ };
  });
  fs.writeFileSync(salida + '.json', JSON.stringify({ w: vp.width, items }));
  fs.rmSync(base + '.png'); fs.rmSync(base + '.json');
}

const MOTORES = { tesseract, paddle };
if (!MOTORES[motor]) throw new Error(`Motor desconocido: ${motor}`);
const cola = leerPaginas().filter(pg => (!soloLibro || pg.libro === soloLibro) && (!soloPagina || pg.pagina === +soloPagina));
const t0 = Date.now();
let hechas = 0;
await Promise.all(Array.from({ length: Math.max(1, os.cpus().length) }, async () => {
  while (cola.length) { const pg = cola.shift(); await MOTORES[motor](pg); hechas++; process.stdout.write(`\r${nombre}: ${hechas} páginas`); }
}));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(` (${Math.round((Date.now() - t0) / 1000)} s) → ${path.relative(process.cwd(), destino)}`);
