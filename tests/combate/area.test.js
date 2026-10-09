import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { leerArea, celdasArea, alcanceMetros } from '../../web/src/domain/combate/area.js';

describe('leerArea y celdasArea', () => {
  test('formas en español e inglés, con palabras intermedias', () => {
    assert.deepEqual(leerArea('Creas una esfera de niebla de 6 m de radio.'), { forma: 'esfera', r: 6 });
    assert.deepEqual(leerArea('', 'Lanzador (cono de 4,5 m)'), { forma: 'cono', largo: 4.5 });
    assert.deepEqual(leerArea('una línea de 30 m de largo y 1,5 m de ancho'), { forma: 'linea', largo: 30, ancho: 1.5 });
    assert.deepEqual(leerArea('a 20-foot-radius Sphere'), { forma: 'esfera', r: 6 });
    assert.equal(alcanceMetros('45 m'), 45); assert.equal(alcanceMetros('Toque'), null);
    assert.equal(alcanceMetros('Lanzador (cubo de 4,5 m)'), null);
  });

  test('casillas con la regla de la mitad cubierta', () => {
    assert.equal(celdasArea({ forma: 'linea', largo: 30, ancho: 1.5 }).celdas.length, 20);
    assert.equal(celdasArea({ forma: 'cubo', lado: 6 }).celdas.length, 16);
    const esfera = celdasArea({ forma: 'esfera', r: 6 }).celdas.length; assert.ok(esfera >= 48 && esfera <= 56, String(esfera));
  });

  test('cobertura de cada casilla y casillas que solo roza', () => {
    const cubo = celdasArea({ forma: 'cubo', lado: 6 });
    assert.equal(cubo.cob.length, cubo.celdas.length); assert.ok(cubo.cob.every(c => c === 1)); assert.equal(cubo.roces.length, 0);
    const cono = celdasArea({ forma: 'cono', largo: 4.5 }, 45);
    assert.ok(cono.cob.some(c => c < 1) && cono.cob.every(c => c >= 0.5));
    assert.ok(cono.roces.length > 0 && cono.roces.every(([x, y]) => !cono.celdas.some(([a, b]) => a === x && b === y)));
  });
});
