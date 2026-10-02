import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, clone, uid, norm, esc, joinY, plural, numLibre } from '../../web/src/core/util.js';

describe('números', () => {
  test('clamp limita a un intervalo', () => {
    assert.equal(clamp(5, 0, 3), 3); assert.equal(clamp(-1, 0, 3), 0); assert.equal(clamp(2, 0, 3), 2);
  });

  test('numLibre lee el primer número de un texto escrito a mano', () => {
    assert.equal(numLibre('+5'), 5); assert.equal(numLibre(' 12 '), 12); assert.ok(Number.isNaN(numLibre('')));
  });
});

describe('texto', () => {
  test('norm quita tildes y mayúsculas', () => {
    assert.equal(norm('Ácido ÑANDÚ'), 'acido nandu'); assert.equal(norm(null), '');
  });

  test('esc escapa el HTML', () => {
    assert.equal(esc('<b a="1">&</b>'), '&lt;b a=&quot;1&quot;&gt;&amp;&lt;/b&gt;');
  });

  test('joinY y plural', () => {
    assert.equal(joinY(['a', 'b', 'c']), 'a, b y c'); assert.equal(joinY(['a']), 'a');
    assert.equal(plural(1, 'dado', 'dados'), '1 dado'); assert.equal(plural(3, 'dado', 'dados'), '3 dados');
  });
});

describe('objetos', () => {
  test('clone copia en profundidad y uid no se repite', () => {
    const o = { a: { b: [1] } }, c = clone(o); c.a.b.push(2);
    assert.deepEqual(o.a.b, [1]);
    assert.match(uid('h'), /^h_/); assert.notEqual(uid('h'), uid('h'));
  });
});
