import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { pageToColumns } from '../../web/src/domain/libros/manualLineas.js';

describe('pageToColumns', () => {
  test('pageToColumns separa columnas por el margen real de la derecha', () => {
    const it = (x, y, s) => ({ str: s, transform: [1, 0, 0, 16, x, y], width: s.length * 7, height: 16 });
    const items = [it(60, 900, 'izquierda uno'), it(60, 880, 'izquierda dos'), ...Array.from({ length: 8 }, (_, i) => it(524, 900 - i * 20, 'derecha ' + i))];
    const [l, r] = pageToColumns(items, 1073);
    assert.equal(l.length, 2); assert.equal(r.length, 8);
  });
});
