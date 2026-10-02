import { test } from 'node:test';
import assert from 'node:assert/strict';
import { perfil } from '../web/src/domain/reglas/reglas2024.js';
import { blankChar, seedDb } from '../web/src/domain/personaje/modelo.js';

const pj = o => blankChar(o);

test('Theo (mago 6, INT 18): CD 15, ataque +7, espacios 4/3/3, 10 preparados, 4 trucos', () => {
  const theo = seedDb().chars[0], P = perfil(theo);
  assert.equal(P.cd, 15); assert.equal(P.atk, 7);
  assert.deepEqual(P.slots, { 1: 4, 2: 3, 3: 3 });
  assert.equal(P.maxPrep, 10); assert.equal(P.maxCant, 4);
});
test('brujo 5: magia de pacto, 2 espacios de nivel 3', () => {
  const P = perfil(pj({ clase: 'Brujo', nivel: 5 }));
  assert.deepEqual(P.pact, { level: 3, n: 2 }); assert.deepEqual(P.slots, { 3: 2 });
});
test('paladín 1 ya lanza conjuros en 2024 (2 espacios de nivel 1)', () => {
  assert.deepEqual(perfil(pj({ clase: 'Paladín', nivel: 1 })).slots, { 1: 2 });
});
test('guerrero solo lanza como Caballero arcano desde nivel 3', () => {
  assert.equal(perfil(pj({ clase: 'Guerrero', nivel: 7 })).c, null);
  const P = perfil(pj({ clase: 'Guerrero', subclase: 'Caballero arcano', nivel: 7 }));
  assert.deepEqual(P.slots, { 1: 4, 2: 2 }); assert.equal(P.maxPrep, 5); assert.equal(P.lista, 'Mago');
});
test('bonificador de competencia por nivel', () => {
  assert.deepEqual([1, 4, 5, 9, 13, 17, 20].map(n => perfil(pj({ nivel: n })).pb), [2, 2, 3, 4, 5, 6, 6]);
});
test('espacios a mano sustituyen a las tablas', () => {
  assert.deepEqual(perfil(pj({ clase: 'Mago', nivel: 5, espaciosManuales: true, espacios: { 1: 4, 2: 3, 3: 3, 4: 1 } })).slots, { 1: 4, 2: 3, 3: 3, 4: 1 });
});
