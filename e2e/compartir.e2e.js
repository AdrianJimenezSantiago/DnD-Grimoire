// Tiradas favoritas, pasar un personaje como código de texto y exportar el diario.
/* global navigator, document */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { abrir, abrirHoja, guardado, espera, cerrarDialogos } from './entorno.js';

describe('tiradas favoritas', () => {
  test('guardar una tirada con nombre, tirarla desde su ficha y quitarla', async () => {
    const { ctx, page, errores } = await abrir({ movil: false });
    await abrirHoja(page);
    await page.keyboard.press('d'); await page.waitForSelector('#dadosDlg[open]');
    await page.fill('#daExpr', '8d6'); await espera(300);
    await page.click('[data-dafavmas]');
    await page.fill('#mdInput', 'Bola de fuego'); await page.click('#modalDlg .md-btns button:last-child'); await espera(500);
    assert.deepEqual((await guardado(page)).chars[0].tiradasFav, [{ nombre: 'Bola de fuego', expr: '8d6' }]);
    await page.click('[data-dalimpiar]');
    await page.click('[data-dafav="0"]'); await espera(1500);
    assert.match(await page.textContent('#daHist'), /Bola de fuego/);
    await page.click('[data-dafavx="0"]'); await espera(400);
    assert.deepEqual((await guardado(page)).chars[0].tiradasFav, []);
    assert.deepEqual(errores, []);
    await ctx.close();
  });
});

describe('pasar un personaje por un chat', () => {
  test('exportar como código y cargarlo en otro grimorio vacío', async () => {
    const a = await abrir({ movil: false });
    await a.ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    await a.page.click('[data-lcmd="gestionar"]'); await a.page.waitForSelector('#charsDlg[open]');
    await a.page.click('[data-expc]');
    await a.page.click('#modalDlg .md-btns button:nth-child(2)');
    await a.page.waitForFunction(() => /copiado/.test(document.querySelector('#toastMsg').textContent));
    const codigo = await a.page.evaluate(() => navigator.clipboard.readText());
    assert.match(codigo, /^GRIMORIO1:[\w-]+$/);
    await a.ctx.close();

    const b = await abrir({ db: null, movil: false });
    await b.page.click('[data-lcmd="copia"]'); await b.page.waitForSelector('#backupDlg[open]');
    await b.page.fill('#bkText', codigo.slice(0, 40) + '\n' + codigo.slice(40));
    await b.page.click('#bkLoad'); await espera(900);
    const db = await guardado(b.page);
    assert.deepEqual(db.chars.map(c => c.nombre), ['Theo']);
    assert.ok(db.chars[0].book.length > 10 && db.chars[0].book.every(e => db.catalog[e.sid]), 'llegan sus conjuros');
    await b.ctx.close();
  });
});

describe('diario', () => {
  test('se exporta en Markdown con sus sesiones', async () => {
    const { ctx, page } = await abrir({ movil: false });
    await abrirHoja(page);
    await page.keyboard.press('n'); await page.waitForSelector('#diaDlg[open]');
    await page.click('[data-di="nueva"]'); await espera(300);
    await page.fill('#diTit', 'El puerto de Luskan'); await page.press('#diTit', 'Tab'); await espera(400);
    await page.click('[data-di="volver"]'); await espera(300);
    const descarga = page.waitForEvent('download');
    await page.click('[data-di="exportar"]');
    const d = await descarga;
    assert.equal(d.suggestedFilename(), 'diario-theo.md');
    const md = fs.readFileSync(await d.path(), 'utf8');
    assert.match(md, /^# Diario de campaña de Theo/); assert.match(md, /## Sesión 1: El puerto de Luskan/);
    await cerrarDialogos(page);
    await ctx.close();
  });
});
