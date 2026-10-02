import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArea, celdasArea, alcanceMetros } from '../../web/src/domain/combate/area.js';

describe('parseArea y celdasArea', () => {
  test('formas en español e inglés, con palabras intermedias', () => {
    assert.deepEqual(parseArea('Creas una esfera de niebla de 6 m de radio.'), { forma: 'esfera', r: 6 });
    assert.deepEqual(parseArea('', 'Lanzador (cono de 4,5 m)'), { forma: 'cono', largo: 4.5 });
    assert.deepEqual(parseArea('una línea de 30 m de largo y 1,5 m de ancho'), { forma: 'linea', largo: 30, ancho: 1.5 });
    assert.deepEqual(parseArea('a 20-foot-radius Sphere'), { forma: 'esfera', r: 6 });
    assert.equal(alcanceMetros('45 m'), 45); assert.equal(alcanceMetros('Toque'), null);
  });

  test('casillas con la regla de la mitad cubierta', () => {
    assert.equal(celdasArea({ forma: 'linea', largo: 30, ancho: 1.5 }).celdas.length, 20);
    assert.equal(celdasArea({ forma: 'cubo', lado: 6 }).celdas.length, 16);
    const esfera = celdasArea({ forma: 'esfera', r: 6 }).celdas.length; assert.ok(esfera >= 48 && esfera <= 56, String(esfera));
  });
});
