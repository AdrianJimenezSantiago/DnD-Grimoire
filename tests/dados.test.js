import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsear, tirar, texto, esD20Simple, media, resolver, distribucion, probAlMenos, mediaDist, maxDist, rango } from '../web/src/domain/dados.js';

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
test('dados: quedarse con los mayores o los menores', () => {
  const p = parsear('4d6kh3');
  assert.deepEqual(p.grupos[0].keep, { n: 3, alto: true }); assert.equal(texto(p), '4d6kh3');
  assert.equal(texto(parsear('2d20k1')), '2d20kh1'); assert.equal(parsear('2d20kl1').grupos[0].keep.alto, false);
  assert.equal(parsear('2d6k5').grupos[0].keep, undefined); assert.equal(parsear('2d6k0'), null);
  const r = tirar(p, { rng: fijo(1, 6, 3, 5) });
  assert.equal(r.total, 14); assert.deepEqual(r.grupos[0].quita, [0]);
  assert.ok(esD20Simple(parsear('1d20k1'))); assert.ok(!esD20Simple(parsear('2d20kh1')));
  assert.ok(Math.abs(media(p) - 12.2446) < 1e-3);
  assert.deepEqual(rango(p), [3, 18]);
});
test('dados: reutilizar dados al cambiar de modo o marcar crítico', () => {
  const p = parsear('1d20+2');
  const a = resolver({ p, rng: fijo(7) });
  assert.equal(a.total, 9); assert.deepEqual(a.r.frescos, [[true]]);
  const b = resolver({ p, modo: 'ventaja', previo: a, rng: fijo(15) });
  assert.deepEqual(b.r.d20, { a: 7, b: 15, usa: 15 }); assert.deepEqual(b.r.frescos, [[false, true]]);
  const c = resolver({ p, modo: 'desventaja', previo: b, rng: () => assert.fail('no debe tirar') });
  assert.equal(c.total, 9);
  const n = resolver({ p, previo: c, rng: () => assert.fail('no debe tirar') });
  assert.equal(n.r.natural, 7);
  const d = parsear('2d6+1'), d1 = resolver({ p: d, rng: fijo(2, 5) }), d2 = resolver({ p: d, critico: true, previo: d1, rng: fijo(6) });
  assert.deepEqual(d2.r.grupos[0].vals, [2, 5, 6, 6]); assert.equal(d2.total, 20);
});
test('dados: modificadores de la tirada se conservan al activarlos y desactivarlos', () => {
  const p = parsear('1d20'), mods = [{ id: 'b', efecto: 'dado', valor: '1d4', on: true }, { id: 'p', efecto: 'plano', valor: -2, on: true }];
  const a = resolver({ p, mods, rng: fijo(10, 3) });
  assert.equal(a.total, 11);
  mods[0].on = false; const b = resolver({ p, mods, previo: a, rng: () => assert.fail() });
  assert.equal(b.total, 8);
  mods[0].on = true; const c = resolver({ p, mods, previo: b, rng: () => assert.fail() });
  assert.equal(c.total, 11);
});
test('dados: distribución exacta', () => {
  const d = distribucion(parsear('2d6'));
  assert.equal(d.min, 2); assert.equal(maxDist(d), 12); assert.ok(Math.abs(d.p[5] - 6 / 36) < 1e-12);
  assert.ok(Math.abs(probAlMenos(distribucion(parsear('1d20+5')), 15) - 0.55) < 1e-12);
  const v = distribucion(parsear('1d20+5'), { modo: 'ventaja' });
  assert.equal(v.min, 6); assert.ok(Math.abs(probAlMenos(v, 25) - 39 / 400) < 1e-12);
  assert.ok(Math.abs(mediaDist(v) - (13.825 + 5)) < 1e-9);
  const b = distribucion(parsear('1d20'), { extras: [{ p: parsear('1d4'), signo: 1 }], plano: 1 });
  assert.equal(b.min, 3); assert.equal(maxDist(b), 25); assert.ok(Math.abs(b.p.reduce((s, x) => s + x, 0) - 1) < 1e-12);
  assert.equal(maxDist(distribucion(parsear('2d6'), { critico: true })), 24);
  assert.equal(distribucion(parsear('100d1000')), null);
  const n = distribucion(parsear('1d20-1d4'));
  assert.equal(n.min, -3); assert.equal(maxDist(n), 19);
});
