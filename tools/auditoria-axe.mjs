// Auditoría de accesibilidad con axe-core: abre la app en Chromium y revisa cada pantalla y ventana en tema de noche y de día, en móvil y en PC.
// Uso (con la app en marcha, p. ej. `npm run dev`):
//   npm i --no-save playwright-core axe-core
//   node tools/auditoria-axe.mjs http://localhost:5173/ axe.json
// CHROMIUM=/ruta/a/chrome si Playwright no encuentra el navegador.
/* global document, localStorage, axe */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const axeSrc = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const URL_ = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || 'axe-out.json';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
const results = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
async function scan(page, name) {
  await wait(900);
  await page.evaluate(axeSrc);
  const r = await page.evaluate(async () => {
    const res = await axe.run(document, { resultTypes: ['violations', 'incomplete'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
    const map = v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ t: n.target.join(' '), html: n.html.slice(0, 160), msg: (n.any[0]?.message || n.all[0]?.message || n.none[0]?.message || '').slice(0, 200), data: n.any[0]?.data })) });
    return { violations: res.violations.map(map), incomplete: res.incomplete.filter(v => v.id === 'color-contrast').map(map) };
  });
  results.push({ name, ...r });
  console.log(`\n=== ${name}: ${r.violations.length} violations`);
  for (const v of r.violations) console.log(` [${v.impact}] ${v.id} (${v.nodes.length}) ${v.help}`);
}
async function skipTour(page) { for (let i = 0; i < 6; i++) { const b = await page.$('.tour.on [data-tour="skip"]'); if (b) { await b.click(); await wait(400); continue; }
  const m = await page.$('#modalDlg[open]'); if (m) { if (!skipTour.vioModal) { skipTour.vioModal = 1; await scan(page, 'modal-aviso'); } await page.keyboard.press('Escape'); await wait(500); continue; } return; } }
async function closeDlg(page) { await page.keyboard.press('Escape'); await wait(500); await page.keyboard.press('Escape').catch(() => {}); await wait(300); }
for (const theme of ['dark', 'light']) for (const vp of [{ n: 'movil', width: 412, height: 915, isMobile: true, hasTouch: true }, { n: 'pc', width: 1366, height: 860 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theo-grimorio-v1-tema', t); } catch {} }, theme);
  const page = await ctx.newPage(); page.setDefaultTimeout(5000);
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(URL_, { waitUntil: 'networkidle' }); await wait(1500);
  const tag = `${theme}/${vp.n}`;
  try {
  if (theme === 'dark' && vp.n === 'movil') await scan(page, `${tag} tour`);
  await skipTour(page);
  await scan(page, `${tag} portada`);
  const card = await page.$('[data-lopen]');
  if (card) { await card.click(); await wait(1500); await skipTour(page); await scan(page, `${tag} hoja`); }
  const steps = [
    ['dados', '#' + (vp.n === 'movil' ? 'dDados' : 'bDados')],
    ['menu-mas', '#btnMore'],
    ['buscar', '#btnBuscar'],
    ['historial', vp.n === 'movil' ? '#dHist' : null],
  ];
  for (const [n, sel] of steps) {
    if (!sel) continue;
    const el = await page.$(sel); if (!el || !(await el.isVisible())) { console.log('skip', n); continue; }
    await el.click(); await wait(800); await skipTour(page);
    await scan(page, `${tag} ${n}`); await closeDlg(page);
  }
  for (const m of ['rules', 'equipo', 'historia', 'diario', 'bestiario', 'biblioteca', 'manual', 'backup', 'about']) {
    try { await page.click('#btnMore'); await wait(600); await page.click(`[data-mcmd="${m}"]`); await wait(1200); await skipTour(page); await scan(page, `${tag} ${m}`); await closeDlg(page); }
    catch (e) { console.log('skip', m, e.message.split('\n')[0]); await closeDlg(page); }
  }
  for (const c of ['vida', 'estados']) {
    try { await page.click(`#sheet [data-cmd="${c}"]`); await wait(1200); await scan(page, `${tag} ${c}`); await closeDlg(page); } catch (e) { console.log('skip', c); await closeDlg(page); }
  }
  // edición
  const ed = await page.$(vp.n === 'movil' ? '#dEdit' : '#bEdit'); if (ed && await ed.isVisible()) { await ed.click(); await wait(800); await skipTour(page); await scan(page, `${tag} edicion`); await ed.click(); await wait(500); }
  const cb = await page.$(vp.n === 'movil' ? '#dCombate' : '#bCombate'); if (cb && await cb.isVisible()) { await cb.click(); await wait(2500); await skipTour(page); await scan(page, `${tag} combate`); await closeDlg(page); await cb.click().catch(()=>{}); await wait(1500); }
  // un conjuro: mantener pulsado = contextmenu
  const cz = await page.$('[data-leer]'); if (cz && await cz.isVisible()) { await cz.click({ button: 'right' }); await wait(1000); await scan(page, `${tag} leer`); await closeDlg(page); }
  } catch (e) { console.log('ERR', tag, e.message.split('\n')[0]); }
  if (vp.n === 'movil') { try { await page.click('#whoChip'); await wait(1500); await page.click('[data-lcmd="nuevo"]'); await wait(1500); await skipTour(page); await scan(page, `${tag} creacion`); } catch (e) { console.log('skip creacion', e.message.split('\n')[0]); } }
  await ctx.close();
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
await browser.close();
