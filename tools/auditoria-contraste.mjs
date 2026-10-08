// Contraste medido en píxeles, para lo que axe no puede calcular (degradados, velos, pseudoelementos, opacidad heredada).
// Hace dos capturas, con el texto y con el texto transparente: la segunda da el fondo real de cada letra.
// El contraste de un texto es el percentil 90 de sus píxeles (el núcleo del trazo, no el suavizado). Umbral AA: 4,5 (3 en texto grande).
// Uso (con la app en marcha): npm i --no-save playwright-core && node tools/auditoria-contraste.mjs http://localhost:5173/ contraste.json
// TEMAS=dark,light · CARDS=1,4,8 (abre esos personajes de la portada) · NSC=6 (pantallas de desplazamiento por vista)
/* global document, localStorage, innerWidth, innerHeight, NodeFilter, getComputedStyle, Image, OffscreenCanvas, scrollY, scrollBy, scrollTo */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const URL_ = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || 'contraste.json';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
const wait = ms => new Promise(r => setTimeout(r, ms));
const all = [];
const HIDE = `*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important;text-decoration-color:transparent!important}`;
async function medir(page, name) {
  await wait(1200);
  const pausa = await page.addStyleTag({ content: 'canvas{visibility:hidden!important} *{animation-play-state:paused!important;transition:none!important}' });
  await wait(200);
  // elementos con texto propio visible
  const els = await page.evaluate(() => {
    const out = []; let id = 0;
    const vw = innerWidth, vh = innerHeight;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const t = walker.currentNode; if (!t.textContent.trim()) continue;
      const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      const range = document.createRange(); range.selectNodeContents(t);
      const r = range.getBoundingClientRect();
      if (r.width < 2 || r.height < 4 || r.bottom <= 0 || r.right <= 0 || r.top >= vh || r.left >= vw) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
      // Decoración (aria-hidden) y texto con degradado recortado (background-clip: text) no se pueden medir así
      if (el.closest('[aria-hidden="true"]') || cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') continue;
      // ¿lo que hay en el centro es este elemento? (descarta lo tapado)
      const cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(vh - 1, Math.max(0, r.top + r.height / 2));
      const top = document.elementFromPoint(cx, cy); if (!top || !(el.contains(top) || top.contains(el) || top === el)) continue;
      const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight) || 400;
      const sel = (() => { let p = el, s = []; for (let i = 0; i < 4 && p && p !== document.body; i++, p = p.parentElement) s.unshift(p.tagName.toLowerCase() + (p.id ? '#' + p.id : '') + (p.classList.length ? '.' + [...p.classList].slice(0, 2).join('.') : '')); return s.join(' > '); })();
      out.push({ id: id++, x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(vw, r.right) - Math.max(0, r.left), h: Math.min(vh, r.bottom) - Math.max(0, r.top), fs, fw, txt: t.textContent.trim().slice(0, 40), sel, color: cs.color });
    }
    return out;
  });
  const shotA = await page.screenshot({ type: 'png' });
  const st = await page.addStyleTag({ content: HIDE }); await wait(150);
  const shotB = await page.screenshot({ type: 'png' });
  await st.evaluate(n => n.remove());
  const res = await page.evaluate(async ({ a, b, els }) => {
    const load = async src => { const im = new Image(); im.src = 'data:image/png;base64,' + src; await im.decode(); const c = new OffscreenCanvas(im.width, im.height); const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height); };
    const A = await load(a), B = await load(b); const k = A.width / innerWidth;
    const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const out = [];
    for (const e of els) {
      const x0 = Math.round(e.x * k), y0 = Math.round(e.y * k), x1 = Math.round((e.x + e.w) * k), y1 = Math.round((e.y + e.h) * k);
      let diffs = [], bgL = [];
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * A.width + x) * 4;
        const lb = lum(B.data[i], B.data[i + 1], B.data[i + 2]); bgL.push(lb);
        const d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]);
        if (d > 30) diffs.push([lum(A.data[i], A.data[i + 1], A.data[i + 2]), lb]);
      }
      if (diffs.length < 6) continue;
      // contraste de cada píxel de texto con su propio fondo; percentil 90 (el núcleo del trazo, no el antialias)
      const cr = diffs.map(([lt, lb]) => (Math.max(lt, lb) + .05) / (Math.min(lt, lb) + .05)).sort((p, q) => p - q);
      const ratio = cr[Math.floor(cr.length * .9)];
      const big = e.fs >= 24 || (e.fs >= 18.66 && e.fw >= 700);
      out.push({ ...e, ratio: +ratio.toFixed(2), need: big ? 3 : 4.5 });
    }
    return out;
  }, { a: shotA.toString('base64'), b: shotB.toString('base64'), els });
  await pausa.evaluate(n => n.remove());
  const bad = res.filter(r => r.ratio < r.need);
  all.push({ name, total: res.length, bad });
  console.log(`\n=== ${name}: ${res.length} textos, ${bad.length} por debajo de AA`);
  for (const b of bad.sort((p, q) => p.ratio - q.ratio).slice(0, 40)) console.log(`  ${b.ratio.toFixed(2)}/${b.need} ${b.fs}px ${b.fw} «${b.txt}» ${b.sel}`);
}
async function skip(page) { for (let i = 0; i < 6; i++) { const b = await page.$('.tour.on [data-tour="skip"]'); if (b) { await b.click(); await wait(400); continue; } if (await page.$('#modalDlg[open]')) { await page.keyboard.press('Escape'); await wait(500); continue; } return; } }
const esc = async page => { await page.keyboard.press('Escape'); await wait(600); };
const scrolls = async (page, name, sc) => { for (let i = 0; i < Number(process.env.NSC || 3); i++) { await medir(page, `${name} #${i}`); const more = await page.evaluate(sc); if (!more) break; } };
const scWin = () => { const y = scrollY; scrollBy(0, innerHeight * .85); return scrollY !== y; };
const scLanding = () => { const L = document.querySelector('#landing'); const y = L.scrollTop; L.scrollTop += innerHeight * .85; return L.scrollTop !== y; };
const scDlg = () => { const d = [...document.querySelectorAll('dialog[open] .dbody')].pop(); if (!d) return false; const y = d.scrollTop; d.scrollTop += d.clientHeight * .85; return d.scrollTop !== y; };
const themes = (process.env.TEMAS || 'dark,light').split(',');
for (const theme of themes) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theo-grimorio-v1-tema', t); } catch {} }, theme);
  const page = await ctx.newPage(); page.setDefaultTimeout(5000);
  await page.goto(URL_, { waitUntil: 'networkidle' }); await wait(1500); await skip(page);
  try {
    await scrolls(page, `${theme} portada`, scLanding);
    await page.evaluate(() => { document.querySelector('#landing').scrollTop = 0; });
    const cards = await page.$$('[data-lopen]');
    if (process.env.CARDS) { for (const k of process.env.CARDS.split(',').map(Number)) { await page.evaluate(() => { document.querySelector('#landing').scrollTop = 0; });
        const c = (await page.$$('[data-lopen]'))[k]; if (!c) continue; await c.scrollIntoViewIfNeeded(); await c.click(); await wait(1500); await skip(page);
        const nom = await page.evaluate(() => document.querySelector('.hero h1')?.textContent.trim());
        await scrolls(page, `${theme} hoja[${k} ${nom}]`, scWin); await page.evaluate(() => scrollTo(0, 0)); await page.click('#whoChip'); await wait(1500); }
      throw new Error('fin'); }
    await cards[Number(process.env.CARD || 0)].click(); await wait(1500); await skip(page);
    await scrolls(page, `${theme} hoja`, scWin);
    await page.evaluate(() => scrollTo(0, 0));
    for (const [n, sel] of [['dados', '#dDados'], ['mas', '#btnMore'], ['buscar', '#btnBuscar'], ['historial', '#dHist'], ['descanso', '#dRest']]) {
      await page.click(sel); await wait(900); await skip(page); await scrolls(page, `${theme} ${n}`, scDlg); await esc(page);
    }
    const cz = await page.$('[data-leer]'); if (cz) { await cz.click({ button: 'right' }); await wait(1000); await scrolls(page, `${theme} leer`, scDlg); await esc(page); }
    await page.click('#dEdit'); await wait(800); await skip(page); await medir(page, `${theme} edicion`); await page.click('#dEdit'); await wait(600);
    await page.click('#dCombate'); await wait(2800); await skip(page); await scrolls(page, `${theme} combate`, scWin);
  } catch (e) { console.log('ERR', theme, e.message.split('\n')[0]); }
  await ctx.close();
}
fs.writeFileSync(OUT, JSON.stringify(all, null, 1));
await browser.close();
