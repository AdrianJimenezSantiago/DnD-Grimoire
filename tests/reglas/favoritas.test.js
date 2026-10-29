import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { anadirFavorita, quitarFavorita, normFavoritas, MAX_FAVORITAS } from '../../web/src/domain/reglas/favoritas.js';
import { normPersonaje } from '../../web/src/domain/personaje/modelo.js';

describe('tiradas favoritas', () => {
  test('se guardan con nombre y la tirada normalizada', () => {
    const ch = {};
    assert.deepEqual(anadirFavorita(ch, { nombre: ' Bola de fuego ', expr: '8d6' }), { nombre: 'Bola de fuego', expr: '8d6' });
    anadirFavorita(ch, { nombre: '', expr: '2d6 + 3' });
    assert.deepEqual(ch.tiradasFav.map(f => f.nombre), ['Bola de fuego', '2d6+3'], 'sin nombre, la propia tirada');
  });
  test('mismo nombre sustituye; tiradas que no se entienden o sin dados no se guardan', () => {
    const ch = {};
    anadirFavorita(ch, { nombre: 'Espada', expr: '1d8+3' });
    anadirFavorita(ch, { nombre: 'espada', expr: '1d10+3' });
    assert.deepEqual(ch.tiradasFav, [{ nombre: 'espada', expr: '1d10+3' }]);
    assert.equal(anadirFavorita(ch, { nombre: 'X', expr: 'hola' }), null);
    assert.equal(anadirFavorita(ch, { nombre: 'X', expr: '5' }), null);
  });
  test(`como mucho ${MAX_FAVORITAS}`, () => {
    const ch = {};
    for (let i = 1; i <= MAX_FAVORITAS + 3; i++) anadirFavorita(ch, { nombre: `T${i}`, expr: `${i}d6` });
    assert.equal(ch.tiradasFav.length, MAX_FAVORITAS);
  });
  test('quitar por posición', () => {
    const ch = { tiradasFav: [{ nombre: 'A', expr: '1d4' }, { nombre: 'B', expr: '1d6' }] };
    assert.equal(quitarFavorita(ch, 0).nombre, 'A');
    assert.deepEqual(ch.tiradasFav.map(f => f.nombre), ['B']);
    assert.equal(quitarFavorita(ch, 9), null);
  });
  test('al cargar un personaje se limpian las favoritas raras', () => {
    assert.deepEqual(normFavoritas([{ nombre: '<b>x</b>', expr: '1d20+2' }, { expr: 'mal' }, null, 'x']), [{ nombre: 'bx/b', expr: '1d20+2' }]);
    assert.deepEqual(normPersonaje({ nombre: 'A', tiradasFav: 'basura' }).tiradasFav, []);
  });
});
