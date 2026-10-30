// Entorno de las pruebas de extremo a extremo: sirve la web compilada (www/) y abre Chromium con unos personajes sembrados.
/* global localStorage, sessionStorage */
import { after, before } from 'node:test';
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { bdDeEjemplo } from '../web/src/domain/personaje/modelo.js';

export const espera = ms => new Promise(r => setTimeout(r, ms));
export const TOURS = ['portada', 'hoja', 'combate', 'edicion', 'creacion', 'inicio'];
export const semilla = () => bdDeEjemplo();

let servidor, navegador;
export let URL_APP = '';
before(async () => {
  servidor = await preview({ configFile: new URL('../web/vite.config.js', import.meta.url).pathname, logLevel: 'silent', preview: { port: 0, host: '127.0.0.1' } });
  URL_APP = servidor.resolvedUrls.local[0];
  navegador = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
});
after(async () => { await navegador?.close(); await servidor?.close(); });

export async function abrir({ db = semilla(), extra = {}, movil = true, antes } = {}) {
  const ctx = await navegador.newContext(movil ? { viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  await ctx.addInitScript(({ db, extra, tours }) => {
    if (sessionStorage.getItem('sembrado')) return;
    sessionStorage.setItem('sembrado', '1');
    for (const t of tours) localStorage.setItem('grimorio-tour-' + t, '1');
    localStorage.setItem('grimorio-libros-ofrecido', '1');
    localStorage.setItem('theo-grimorio-v1-efectos', 'bajo');
    if (db) localStorage.setItem('grimorio-v2', JSON.stringify(db));
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v);
  }, { db, extra, tours: TOURS });
  if (antes) await antes(ctx);
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  await page.goto(URL_APP, { waitUntil: 'load' });
  await page.waitForSelector('html.ready');
  return { ctx, page, errores };
}

export async function abrirHoja(page, nombre = 'Theo') {
  await page.locator('[data-lopen]', { hasText: nombre }).first().click();
  await page.waitForSelector('body:not(.on-landing)');
  await espera(400);
}

export const guardado = page => page.evaluate(() => JSON.parse(localStorage.getItem('grimorio-v2') || 'null'));
export async function cerrarDialogos(page) {
  for (let i = 0; i < 4 && await page.$('dialog[open]'); i++) { await page.keyboard.press('Escape'); await espera(350); }
}
