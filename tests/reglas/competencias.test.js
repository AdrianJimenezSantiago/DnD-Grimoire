import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { SENCILLAS, MARCIALES_PHB, esSencilla, esMarcial } from '../../web/src/domain/reglas/competencias.js';
import { PREDEFINIDOS } from '../../web/src/domain/equipo/equipo.js';

describe('armas sencillas y marciales', () => {
  test('cada arma de las listas existe en el equipo predefinido con el mismo nombre', () => {
    const nombres = new Set(PREDEFINIDOS.map(p => p.nombre));
    assert.deepEqual([...SENCILLAS, ...MARCIALES_PHB].filter(n => !nombres.has(n)), []);
  });

  test('cada arma predefinida es sencilla o marcial, nunca las dos', () => {
    const armas = PREDEFINIDOS.filter(p => p.cat === 'arma');
    assert.deepEqual(armas.filter(a => esSencilla(a) === esMarcial(a)).map(a => a.nombre), []);
  });
});
