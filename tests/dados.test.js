import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsear, tirar, texto, esD20Simple, media } from '../web/src/domain/dados.js';

const fijo = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };
test('dados: expresiones válidas e inválidas', () => {
  assert.deepEqual(parsear('2d6 + 3'), { grupos: [{ n: 2, caras: 6, signo: 1 }], bono: 3 });
  assert.deepEqual(parsear('d20-1'), { grupos: [{ n: 1, caras: 20, signo: 1 }], bono: -1 });
  assert.equal(parsear('2d'), null); assert.equal(parsear('hola'), null); assert.equal(parsear('0d6'), null);
  assert.equal(texto(parsear('1d8+2d6-1')), '1d8+2d6−1');
  assert.ok(esD20Simple(parsear('1d20+5'))); assert.ok(!esD20Simple(parsear('2d20')));
});
test('dados: ventaja, desventaja y crítico', () => {
  assert.equal(tirar(parsear('1d20+5'), { modo: 'ventaja', rng: fijo(4, 17) }).total, 22);
  assert.equal(tirar(parsear('1d20+5'), { modo: 'desventaja', rng: fijo(4, 17) }).total, 9);
  const c = tirar(parsear('2d6+3'), { critico: true, rng: fijo(6) });
  assert.equal(c.grupos[0].vals.length, 4); assert.equal(c.total, 27);
  assert.equal(media(parsear('2d6+3')), 10);
});
