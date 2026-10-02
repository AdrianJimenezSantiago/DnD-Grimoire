import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { nivelImpacto } from '../../web/src/ui/animaciones/impacto.js';
import { parsear, distribucion } from '../../web/src/domain/reglas/dados.js';

describe('nivel de impacto', () => {
  test('nivel de la animación de impacto según la media', () => {
    const d = distribucion(parsear('2d6+3'));
    assert.equal(nivelImpacto(10, d), '');
    assert.equal(nivelImpacto(11, d), 'bueno');
    assert.equal(nivelImpacto(13, d), 'fuerte');
    assert.equal(nivelImpacto(15, d), 'epico');
  });
});
