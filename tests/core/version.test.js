import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { siguienteVersion } from '../../tools/siguiente-version.mjs';

describe('versión de cada publicación', () => {
  const viejas = ['v1.0.95', 'v1.0.111'];
  test('la primera sale de package.json y las etiquetas antiguas no cuentan', () => {
    assert.equal(siguienteVersion({ base: '2.3.0', etiquetas: viejas }), '2.3.0');
  });
  test('cada push sube el parche', () => {
    assert.equal(siguienteVersion({ base: '2.3.0', etiquetas: [...viejas, 'v2.3.0'] }), '2.3.1');
    assert.equal(siguienteVersion({ base: '2.3.0', etiquetas: ['v2.3.9', 'v2.3.10', 'v2.3.2'] }), '2.3.11');
  });
  test('[menor] y [mayor] en un mensaje suben esa parte', () => {
    assert.equal(siguienteVersion({ base: '2.3.0', etiquetas: ['v2.3.7'], mensajes: ['Merge pull request #9', 'Diario nuevo [menor]'] }), '2.4.0');
    assert.equal(siguienteVersion({ base: '2.3.0', etiquetas: ['v2.4.1'], mensajes: ['Rehacer la hoja [major]'] }), '3.0.0');
  });
  test('subir package.json a mano manda sobre las etiquetas anteriores', () => {
    assert.equal(siguienteVersion({ base: '3.0.0', etiquetas: ['v2.4.1'] }), '3.0.0');
    assert.equal(siguienteVersion({ base: '3.0.0', etiquetas: ['v2.4.1', 'v3.0.0'] }), '3.0.1');
  });
  test('una versión de package.json mal escrita para la publicación', () => {
    assert.throws(() => siguienteVersion({ base: 'dos' }));
  });
});
