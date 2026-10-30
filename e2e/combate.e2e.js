// Modo combate con orden de iniciativa: añadir enemigos y aliados, pasar turnos, vida de los enemigos y aliados que se quedan.
/* global document */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { abrir, abrirHoja, guardado, espera, cerrarDialogos } from './entorno.js';

async function entrarEnCombate(page) {
  await page.click('#dCombate, #bCombate >> visible=true');
  await espera(2600);
  await cerrarDialogos(page);
  await page.waitForSelector('.cb-orden');
}
async function anadir(page, { nombre, ini, pg, cant, aliado }) {
  await page.click('[data-cbord="anadir"]');
  await page.waitForSelector('#ordenDlg[open]');
  if (aliado) await page.click('[data-ortipo="aliado"]');
  await page.fill('#orNombre', nombre);
  if (ini != null) await page.fill('#orIni', String(ini));
  if (pg != null) await page.fill('#orPg', String(pg));
  if (cant != null) await page.fill('#orCant', String(cant));
  await page.click('#orOk');
  await page.waitForFunction(() => !document.querySelector('#ordenDlg[open]'));
  await espera(300);
}
const filas = page => page.$$eval('.cb-or', els => els.map(e => e.querySelector('.cb-or-n b').textContent.trim()));
const actual = page => page.$eval('.cb-or.actual .cb-or-n b', e => e.textContent.trim());

describe('orden de iniciativa en el modo combate', () => {
  test('añadir, ordenar, pasar turnos con la ronda y llevar la vida de un enemigo', async () => {
    const { ctx, page, errores } = await abrir();
    await abrirHoja(page);
    await entrarEnCombate(page);
    await page.click('[data-cbini]');
    await page.fill('#mdInput', '12'); await page.click('#modalDlg .md-btns button:last-child'); await espera(500);
    await anadir(page, { nombre: 'Lobo', ini: 18, pg: 11 });
    await anadir(page, { nombre: 'Mira', ini: 9, aliado: true });
    assert.deepEqual(await filas(page), ['Lobo', 'Theo', 'Mira']);

    await page.click('[data-cbord="siguiente"]'); await espera(300);
    assert.equal(await actual(page), 'Lobo');
    await page.click('[data-cbord="siguiente"]'); await espera(300);
    assert.equal(await actual(page), 'Theo');
    assert.equal((await guardado(page)).chars[0].combate.ronda, 1, 'tu primer turno no cambia de ronda');

    await page.click('.cb-or.t-enemigo [data-cbord="pg"]');
    await page.fill('#mdInput', '11'); await page.click('#modalDlg .md-btns button:last-child'); await espera(500);
    assert.match(await page.textContent('.cb-or.t-enemigo'), /fuera de combate/);

    await page.click('[data-cbord="siguiente"]'); await espera(300);
    assert.equal(await actual(page), 'Mira');
    await page.click('[data-cbord="siguiente"]'); await espera(900);
    await cerrarDialogos(page);
    assert.equal(await actual(page), 'Theo', 'el lobo caído se salta');
    assert.equal((await guardado(page)).chars[0].combate.ronda, 2);
    assert.deepEqual(errores, []);
    await ctx.close();
  });

  test('varios enemigos con iniciativa tirada; al acabar el combate los aliados se quedan', async () => {
    const { ctx, page } = await abrir();
    await abrirHoja(page);
    await entrarEnCombate(page);
    await anadir(page, { nombre: 'Goblin', cant: 3, pg: 7 });
    await anadir(page, { nombre: 'Mira', aliado: true, ini: 5 });
    const c = (await guardado(page)).chars[0].combate;
    assert.deepEqual(c.orden.filter(x => x.tipo === 'enemigo').map(x => x.nombre), ['Goblin 1', 'Goblin 2', 'Goblin 3']);
    assert.ok(c.orden.every(x => x.ini >= 1 && x.ini <= 20 || x.nombre === 'Mira'));
    await page.click('.cb-salir'); await espera(2200);
    await entrarEnCombate(page);
    assert.deepEqual((await filas(page)).filter(n => n !== 'Theo'), ['Mira'], 'los goblins se han ido y Mira sigue');
    assert.deepEqual((await guardado(page)).chars[0].combate.orden.map(x => x.nombre), ['Mira']);
    await ctx.close();
  });
});
