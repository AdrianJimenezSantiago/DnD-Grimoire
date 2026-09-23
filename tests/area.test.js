import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArea, celdasArea, alcanceMetros } from '../web/src/domain/area.js';
import { recuperarEnDescanso, etiquetaRecarga } from '../web/src/domain/rasgos.js';

test('áreas: formas en español e inglés, con palabras intermedias', () => {
  assert.deepEqual(parseArea('Creas una esfera de niebla de 6 m de radio.'), { forma: 'esfera', r: 6 });
  assert.deepEqual(parseArea('', 'Lanzador (cono de 4,5 m)'), { forma: 'cono', largo: 4.5 });
  assert.deepEqual(parseArea('una línea de 30 m de largo y 1,5 m de ancho'), { forma: 'linea', largo: 30, ancho: 1.5 });
  assert.deepEqual(parseArea('a 20-foot-radius Sphere'), { forma: 'esfera', r: 6 });
  assert.equal(alcanceMetros('45 m'), 45); assert.equal(alcanceMetros('Toque'), null);
});
test('áreas: casillas con la regla de la mitad cubierta', () => {
  assert.equal(celdasArea({ forma: 'linea', largo: 30, ancho: 1.5 }).celdas.length, 20);
  assert.equal(celdasArea({ forma: 'cubo', lado: 6 }).celdas.length, 16);
  const esfera = celdasArea({ forma: 'esfera', r: 6 }).celdas.length; assert.ok(esfera >= 48 && esfera <= 56, String(esfera));
});
test('recursos: recarga con dados y consumibles', () => {
  const varita = { recarga: 'dado', recDado: '1d3', recBono: 0, recMomento: 'largo' };
  assert.deepEqual(recuperarEnDescanso(varita, 5, 'largo', () => 2), { usados: 3, tirada: '1d3 = 2' });
  assert.equal(recuperarEnDescanso(varita, 5, 'corto', () => 2).usados, 5);
  assert.equal(recuperarEnDescanso({ recarga: 'nunca' }, 3, 'largo').usados, 3);
  assert.equal(recuperarEnDescanso({ recarga: 'corto1' }, 3, 'corto').usados, 2);
  assert.match(etiquetaRecarga({ ...varita, recBono: 1 }), /1d3\+1 al amanecer/);
});
