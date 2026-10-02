import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { puntuar, buscar } from '../../web/src/domain/presentacion/busqueda.js';

describe('puntuar y buscar', () => {
  test('exacto, prefijo, palabra, dentro y en el texto', () => {
    assert.equal(puntuar('bola', 'Bola de fuego'), 80);
    assert.equal(puntuar('fuego', 'Bola de fuego'), 65);
    assert.equal(puntuar('ola', 'Bola de fuego'), 50);
    assert.equal(puntuar('explota', 'Bola de fuego', 'Una bola que explota'), 20);
    assert.equal(puntuar('escudo', 'Escudo'), 100);
    assert.equal(puntuar('x', 'Escudo'), 0);
  });

  test('grupos ordenados por su mejor resultado', () => {
    const r = buscar('esc', [
      { clave: 'a', titulo: 'Reglas', items: [{ nombre: 'Cobertura', texto: 'un escudo' }] },
      { clave: 'b', titulo: 'Objetos', items: [{ nombre: 'Escudo +1' }, { nombre: 'Escoba voladora' }] },
    ]);
    assert.deepEqual(r.map(g => g.clave), ['b', 'a']);
    assert.equal(buscar('e', [{ clave: 'a', items: [{ nombre: 'Escudo' }] }]).length, 0);
  });
});
