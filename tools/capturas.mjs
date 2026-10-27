// Capturas y animaciones de docs/img para el README: abre la app con unos personajes de ejemplo y recorre sus pantallas.
// Uso (con la app compilada y en marcha, p. ej. `PERSONAJES_PRUEBA=0 npm run build && npx vite preview --config web/vite.config.js`):
//   npm i --no-save playwright-core
//   node tools/capturas.mjs http://localhost:4173/
// Las imágenes se guardan en WebP con ffmpeg. CHROMIUM=/ruta/a/chrome si Playwright no encuentra el navegador.
/* global localStorage, sessionStorage, scrollTo */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bdDeEjemplo } from '../web/src/domain/personaje/modelo.js';
import { cargarCompendio, compendio } from '../web/src/domain/conjuros/catalogo.js';
import { personajePrueba, combinaciones, equipoInicial } from '../web/src/domain/personaje/pruebas.js';

const { chromium } = await import('playwright-core').catch(() => import('playwright'));
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_ = process.argv[2] || 'http://localhost:4173/';
const OUT = path.join(RAIZ, 'docs/img');
const TMP = fs.mkdtempSync(path.join(RAIZ, 'www', 'capturas-'));
const espera = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

await cargarCompendio(Promise.resolve(JSON.parse(fs.readFileSync(path.join(RAIZ, 'web/public/data/compendio.json'), 'utf8'))));
const db = bdDeEjemplo();
const elegidos = [['Paladín', /gloria/, 'Seraphine'], ['Bárbaro', /berserk/, 'Korgan'], ['Pícaro', /ladr/, 'Vex'], ['Clérigo', /vida/, 'Elowen'], ['Brujo', /infernal|demon/, 'Mordaine']];
elegidos.forEach(([clase, re, nombre], i) => {
  const c = combinaciones().find(x => x.clase === clase && re.test(x.sc.nombre.toLowerCase()));
  if (!c) return;
  const { ch } = personajePrueba(db, compendio(), clase, c.sc, i + 3);
  Object.assign(ch, { nombre, prueba: false, lema: '', campana: 'La Costa de la Espada' });
  if (!ch.equipo?.items?.length) equipoInicial(ch);
  db.chars.push(ch);
});
equipoInicial(db.chars[0]);
db.activeId = db.chars[0].id;
const semilla = JSON.stringify(db);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
const MOVIL = { viewport: { width: 412, height: 860 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const PC = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

async function abrir(opciones, { tema = 'dark', datos = true, video } = {}) {
  const ctx = await browser.newContext({ ...opciones, ...(video ? { recordVideo: { dir: TMP, size: opciones.viewport } } : {}) });
  await ctx.addInitScript(({ tema, semilla, datos }) => {
    try {
      localStorage.setItem('theo-grimorio-v1-tema', tema);
      for (const t of ['portada', 'hoja', 'combate', 'edicion', 'creacion', 'inicio']) localStorage.setItem('grimorio-tour-' + t, '1');
      if (datos && !sessionStorage.getItem('sembrado')) { localStorage.setItem('grimorio-v2', semilla); sessionStorage.setItem('sembrado', '1'); }
    } catch {}
  }, { tema, semilla, datos });
  const page = await ctx.newPage(); page.setDefaultTimeout(6000);
  page.on('pageerror', e => console.log('error en la página:', e.message));
  await page.goto(URL_, { waitUntil: 'networkidle' }); await espera(1800); await sinTour(page);
  return { ctx, page };
}
async function sinTour(page) {
  for (let i = 0; i < 8; i++) {
    const s = await page.$('.tour.on [data-tour="skip"]'); if (s) { await s.click(); await espera(400); continue; }
    if (await page.$('#modalDlg[open]')) { await page.keyboard.press('Escape'); await espera(400); continue; }
    return;
  }
}
async function foto(page, nombre, opts = {}) {
  await espera(opts.espera ?? 900);
  const png = path.join(TMP, nombre + '.png'); await page.screenshot({ path: png });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', '82', path.join(OUT, nombre + '.webp')]);
  console.log('·', nombre);
}
async function cerrar(page) {
  for (let i = 0; i < 3; i++) {
    const b = await page.$('dialog[open] [data-close]');
    if (b && await b.isVisible()) await b.click().catch(() => page.keyboard.press('Escape')); else if (await page.$('dialog[open]')) await page.keyboard.press('Escape'); else return;
    await espera(600);
  }
}
const visible = async (page, sel) => { const el = await page.$(sel); return el && await el.isVisible() ? el : null; };
async function clic(page, ...sels) { for (const s of sels) { const el = await visible(page, s); if (el) { await el.click(); return true; } } return false; }
async function abrirHoja(page, nombre = 'Theo') {
  const tarjeta = await page.$(`[data-lopen]:has-text("${nombre}")`) || await page.$('[data-lopen]');
  if (tarjeta) { await tarjeta.click(); await espera(1500); await sinTour(page); }
}

{
  const { ctx, page } = await abrir(MOVIL, { datos: false });
  await foto(page, 'portada-vacia');
  await ctx.close();
}
{
  const { ctx, page } = await abrir(MOVIL);
  await foto(page, 'portada');
  await abrirHoja(page);
  await foto(page, 'hoja');
  if (await clic(page, '#dDados', '#bDados')) { await foto(page, 'dados'); await cerrar(page); }
  const conjuro = await page.$('#sheet .castzone[data-cast]');
  if (conjuro) {
    await conjuro.evaluate(el => el.closest('section, .card, .panel')?.scrollIntoView({ block: 'start' }) ?? el.scrollIntoView({ block: 'center' }));
    await page.mouse.wheel(0, -90); await foto(page, 'conjuros');
    const caja = await conjuro.boundingBox(); await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2); await page.mouse.down(); await espera(700); await page.mouse.up();
    await foto(page, 'conjuro', { espera: 1300 }); await cerrar(page);
    await page.evaluate(() => scrollTo(0, 0));
  }
  if (await clic(page, '#sheet [data-cmd="vida"]')) { await foto(page, 'vida'); await cerrar(page); }
  if (await clic(page, '#dCombate', '#bCombate')) {
    await espera(2500); await sinTour(page);
    if (await page.$('#dadosDlg[open]')) { await foto(page, 'iniciativa', { espera: 300 }); await cerrar(page); }
    await foto(page, 'combate', { espera: 1200 }); await clic(page, '#dCombate', '#bCombate'); await espera(1200); await cerrar(page);
  }
  try { await page.click('#btnMore'); await espera(500); await page.click('[data-mcmd="equipo"]'); await foto(page, 'inventario', { espera: 1300 }); await cerrar(page); } catch { await cerrar(page); }
  try { await page.click('#whoChip'); await espera(1200); await page.click('[data-lcmd="nuevo"]'); await espera(1300); await sinTour(page); await foto(page, 'creacion'); await cerrar(page); } catch { await cerrar(page); }
  await ctx.close();
}
for (const tema of ['dark', 'light']) {
  const { ctx, page } = await abrir(PC, { tema });
  if (tema === 'dark') await foto(page, 'pc-portada');
  await abrirHoja(page, tema === 'dark' ? 'Theo' : 'Seraphine');
  await foto(page, `pc-hoja-${tema === 'dark' ? 'noche' : 'dia'}`);
  await ctx.close();
}

function animacion(video, nombre, { desde = 0, hasta, ancho = 360, fps = 15, calidad = 55 }) {
  const destino = path.join(OUT, nombre + '.webp');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(desde), ...(hasta ? ['-to', String(hasta)] : []), '-i', video,
    '-vf', `fps=${fps},scale=${ancho}:-1:flags=lanczos`, '-c:v', 'libwebp_anim', '-quality', String(calidad), '-compression_level', '6', '-loop', '0', '-an', destino]);
  console.log('·', nombre + '.webp', Math.round(fs.statSync(destino).size / 1024), 'kB');
}
async function grabar(nombre, guion, recorte) {
  const { ctx, page } = await abrir(MOVIL, { video: true });
  const t0 = Date.now(); await guion(page); const dur = (Date.now() - t0) / 1000;
  const v = page.video(); await ctx.close(); const archivo = await v.path();
  const total = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo]).toString());
  animacion(archivo, nombre, { desde: Math.max(0, total - dur), ...recorte });
}
await grabar('recorrido', async page => {
  await espera(2200); await abrirHoja(page); await espera(1800);
  const conjuro = await page.$('#sheet .castzone[data-cast]');
  if (conjuro) { await conjuro.scrollIntoViewIfNeeded(); await espera(1200); await conjuro.click(); await espera(2600); await cerrar(page); await page.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' })); await espera(1200); }
  if (await clic(page, '#dCombate', '#bCombate')) { await espera(3500); await cerrar(page); await espera(1200); await page.mouse.wheel(0, 600); await espera(1500); }
}, { ancho: 320 });
await grabar('tirada', async page => {
  await abrirHoja(page); await clic(page, '#dDados', '#bDados'); await espera(900);
  await clic(page, '#dadosDlg [data-dado="20"]', '#dadosDlg button:has-text("D20")'); await espera(500);
  for (let i = 0; i < 2; i++) { await clic(page, '#dadosDlg button:has-text("Tirar")', '#dadosDlg button:has-text("Volver a tirar")'); await espera(2600); }
}, { ancho: 320 });

await browser.close();
fs.rmSync(TMP, { recursive: true, force: true });
