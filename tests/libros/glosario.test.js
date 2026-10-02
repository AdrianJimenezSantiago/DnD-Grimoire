import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { juntar, sinCortes, formasDeEstado } from '../../web/src/domain/libros/glosario.js';

describe('formasDeEstado', () => {
  test('formas de los estados para enlazarlos', () => {
    assert.deepEqual(formasDeEstado('Apresado'), ['apresado', 'apresada', 'apresados', 'apresadas']);
    assert.deepEqual(formasDeEstado('Invisible'), ['invisible', 'invisibles']);
  });
});

describe('juntar y sinCortes', () => {
  test('las palabras partidas con guion al final de línea se unen', () => {
    assert.equal(juntar('puede arrastrarte o trans-', 'portarte al moverse'), 'puede arrastrarte o transportarte al moverse');
    assert.equal(juntar('Velocidad 0 -', 'Tu velocidad'), 'Velocidad 0 - Tu velocidad');
    assert.equal(sinCortes('arrastrarte o trans- portarte'), 'arrastrarte o transportarte');
    assert.equal(sinCortes('fuego y frío - en ambos'), 'fuego y frío - en ambos');
  });

  test('erratas del PDF en dados y ceros', () => {
    assert.equal(sinCortes('Si tienes ventaja, tira 2420 y usa el más alto.'), 'Si tienes ventaja, tira 2d20 y usa el más alto.');
    assert.equal(sinCortes('**Velocidad O.** Tu velocidad es O y no puede aumentar.'), '**Velocidad 0.** Tu velocidad es 0 y no puede aumentar.');
    assert.equal(sinCortes('Quedas a O PG.'), 'Quedas a 0 PG.');
    assert.equal(sinCortes('O bien te mueves, o bien atacas.'), 'O bien te mueves, o bien atacas.');
  });
});
