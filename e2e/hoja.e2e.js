// La hoja en el ordenador: atajos de teclado, deshacer (también tras cerrar la app) y ficha para imprimir.
/* global dispatchEvent, Event */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { abrir, abrirHoja, guardado, espera } from './entorno.js';

const usados = async page => Object.values((await guardado(page)).chars[0].play.used).reduce((s, n) => s + n, 0);

describe('atajos de teclado', () => {
  test('D abre los dados, ? la ayuda y no se disparan al escribir', async () => {
    const { ctx, page, errores } = await abrir({ movil: false });
    await abrirHoja(page);
    await page.keyboard.press('d');
    await page.waitForSelector('#dadosDlg[open]');
    await page.keyboard.press('Escape'); await espera(400);
    await page.keyboard.press('Shift+?');
    await page.waitForSelector('#modalDlg[open]');
    assert.match(await page.textContent('#modalDlg'), /Ctrl\+Z/);
    await page.keyboard.press('Escape'); await espera(400);
    await page.click('#btnBuscar'); await page.waitForSelector('#buscarDlg[open]');
    await page.keyboard.type('dc');
    assert.equal(await page.$('#dadosDlg[open]'), null);
    assert.deepEqual(errores, []);
    await ctx.close();
  });

  test('Ctrl+Z deshace la última acción, y se puede deshacer aunque se recargue la app', async () => {
    const { ctx, page } = await abrir({ movil: false });
    await abrirHoja(page);
    await page.locator('#sbar [data-slotbtn]').first().click();
    await page.locator('#sbar [data-slotbtn]').first().click();
    await espera(3200);
    assert.equal(await usados(page), 2);
    await page.keyboard.press('Control+z'); await espera(500);
    assert.equal(await usados(page), 1);
    await espera(3000);
    await page.reload(); await page.waitForSelector('html.ready'); await abrirHoja(page);
    await page.keyboard.press('Control+z'); await espera(600);
    assert.equal(await usados(page), 0, 'la acción de antes de recargar también se deshace');
    await ctx.close();
  });
});

describe('imprimir', () => {
  test('al imprimir se prepara la ficha en papel del personaje abierto', async () => {
    const { ctx, page } = await abrir({ movil: false });
    await abrirHoja(page);
    await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
    const txt = await page.textContent('#impresion');
    assert.match(txt, /Theo/); assert.match(txt, /Clase de armadura/); assert.match(txt, /Conjuros/);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.isVisible('#impresion'), true);
    assert.equal(await page.isVisible('#sheet'), false);
    await ctx.close();
  });
});
