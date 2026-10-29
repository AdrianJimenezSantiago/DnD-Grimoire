// Datos del usuario: guardado, aviso si no se puede guardar, libros en IndexedDB y copias de seguridad.
/* global localStorage, indexedDB, Storage, document */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { abrir, abrirHoja, guardado, espera } from './entorno.js';

const gastarEspacio = page => page.locator('#sbar [data-slotbtn]').first().click();
const idbGet = (page, k) => page.evaluate(k => new Promise(ok => {
  const r = indexedDB.open('grimorio', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('archivos');
  r.onsuccess = () => { const g = r.result.transaction('archivos').objectStore('archivos').get(k); g.onsuccess = () => ok(g.result ?? null); g.onerror = () => ok(null); };
  r.onerror = () => ok(null);
}), k);

describe('guardado de los personajes', () => {
  test('arranca sin errores, abre la hoja y lo que se gasta sigue ahí al recargar', async () => {
    const { ctx, page, errores } = await abrir();
    await abrirHoja(page);
    await gastarEspacio(page);
    await espera(900);
    const usados = (await guardado(page)).chars[0].play.used;
    assert.ok(Object.values(usados).some(n => n > 0), 'el espacio gastado está guardado');
    await page.reload(); await page.waitForSelector('html.ready');
    assert.deepEqual((await guardado(page)).chars[0].play.used, usados);
    assert.deepEqual(errores, []);
    await ctx.close();
  });

  test('si el navegador no deja guardar, la app lo dice y ofrece la copia', async () => {
    const { ctx, page } = await abrir();
    await abrirHoja(page);
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (k === 'grimorio-v2') throw new DOMException('lleno', 'QuotaExceededError'); return orig.call(this, k, v); };
    });
    await gastarEspacio(page);
    await page.waitForSelector('#modalDlg[open]', { timeout: 4000 });
    assert.match(await page.textContent('#modalDlg'), /No se ha podido guardar/);
    await page.click('#modalDlg .md-btns button:last-child');
    await page.waitForSelector('#backupDlg[open]');
    await ctx.close();
  });
});

describe('libros e imágenes grandes en IndexedDB', () => {
  test('un libro guardado en localStorage por una versión anterior pasa a IndexedDB y se sigue viendo', async () => {
    const libro = { id: 'mio', titulo: 'Libro de pruebas', fecha: 1, textos: {}, nuevos: [], glosario: [], subclases: [] };
    const { ctx, page, errores } = await abrir({ extra: { 'file:libros.json': JSON.stringify([{ id: 'mio', titulo: libro.titulo, fecha: 1 }]), 'file:libro-mio.json': JSON.stringify(libro) } });
    await page.waitForFunction(() => !localStorage.getItem('file:libro-mio.json'), null, { timeout: 8000 });
    assert.equal(JSON.parse(await idbGet(page, 'libro-mio.json')).titulo, 'Libro de pruebas');
    await page.reload(); await page.waitForSelector('html.ready'); await espera(1500);
    await page.click('[data-lcmd="manual"]');
    await page.waitForSelector('#manualDlg[open]');
    assert.match(await page.textContent('#mnEstado'), /Libro de pruebas/);
    assert.deepEqual(errores, []);
    await ctx.close();
  });
});

describe('copia de seguridad', () => {
  test('copia automática del día, aviso de que nunca se hizo copia y fecha al guardarla', async () => {
    const { ctx, page } = await abrir();
    await page.waitForFunction(() => new Promise(ok => {
      const r = indexedDB.open('grimorio', 1);
      r.onsuccess = () => { try { const g = r.result.transaction('archivos').objectStore('archivos').get('copias-auto.json'); g.onsuccess = () => ok(!!g.result); } catch { ok(false); } };
      r.onerror = () => ok(false);
    }), null, { timeout: 10000 });
    await abrirHoja(page);
    await page.click('#btnMore'); await page.click('[data-mcmd="backup"]');
    await page.waitForSelector('#backupDlg[open]');
    assert.match(await page.textContent('#bkEstado'), /Aún no has guardado ninguna copia/);
    assert.match(await page.textContent('#bkAuto'), /Copias automáticas/);
    assert.match(await page.textContent('#bkAuto'), /Theo/);
    const descarga = page.waitForEvent('download');
    await page.click('#bkSave');
    assert.match((await descarga).suggestedFilename(), /^grimorio-\d{4}-\d{2}-\d{2}\.json$/);
    await page.waitForFunction(() => /Última copia: hoy/.test(document.querySelector('#bkEstado').textContent));
    await ctx.close();
  });

  test('restaurar una copia automática devuelve los personajes y se puede deshacer', async () => {
    const { ctx, page } = await abrir();
    await page.waitForFunction(() => document.querySelectorAll('[data-lopen]').length > 0);
    await espera(2500);
    await abrirHoja(page);
    await gastarEspacio(page); await espera(600);
    await page.click('#btnMore'); await page.click('[data-mcmd="backup"]');
    await page.click('#bkAuto [data-auto]');
    await page.click('#modalDlg .md-btns button:last-child');
    await page.waitForFunction(() => !document.querySelector('#backupDlg[open]'));
    await espera(600);
    const usados = (await guardado(page)).chars[0].play.used;
    assert.ok(!Object.values(usados).some(n => n > 0), 'vuelve al estado del inicio del día');
    await ctx.close();
  });
});
