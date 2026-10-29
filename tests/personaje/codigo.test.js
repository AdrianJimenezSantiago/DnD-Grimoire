import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { codificar, decodificar, esCodigo, PREFIJO } from '../../web/src/domain/personaje/codigo.js';
import { bdDeEjemplo } from '../../web/src/domain/personaje/modelo.js';

describe('código de texto de un personaje', () => {
  test('ida y vuelta sin perder nada, y mucho más corto que el JSON', async () => {
    const db = bdDeEjemplo(), paquete = { tipo: 'grimorio-personaje', personaje: db.chars[0], conjuros: db.catalog };
    const c = await codificar(paquete);
    assert.ok(c.startsWith(PREFIJO)); assert.ok(esCodigo(`  ${c}\n`));
    assert.match(c.slice(PREFIJO.length), /^[A-Za-z0-9_-]+$/, 'solo caracteres que sobreviven a un chat');
    assert.ok(c.length < JSON.stringify(paquete).length / 2);
    assert.deepEqual(await decodificar(c), JSON.parse(JSON.stringify(paquete)));
  });
  test('aguanta saltos de línea y espacios que meten los chats al pegar', async () => {
    const c = await codificar({ a: 'ñandú ⚔️' });
    const roto = c.slice(0, 15) + '\n ' + c.slice(15, 30) + '\r\n' + c.slice(30);
    assert.deepEqual(await decodificar(roto), { a: 'ñandú ⚔️' });
  });
  test('lo que no es un código o está roto devuelve null sin lanzar', async () => {
    assert.equal(await decodificar('hola'), null);
    assert.equal(await decodificar(PREFIJO + '!!!'), null);
    assert.equal(await decodificar(PREFIJO + 'AAAA'), null);
    const c = await codificar({ a: 1 });
    assert.equal(await decodificar(c.slice(0, -4)), null);
  });
  test('una bomba de compresión no llega a descomprimirse entera', async () => {
    const c = await codificar({ x: 'a'.repeat(6 * 1024 * 1024) });
    assert.ok(c.length < 20000);
    assert.equal(await decodificar(c), null);
  });
});
