import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { nuevaCriatura, notasConjuro, resumenCriatura } from '../../web/src/domain/criaturas/bestiario.js';

describe('notasConjuro', () => {
  test('notas al pie del conjuro por tipo de daño o anotadas a mano', () => {
    const ch = {}, c = nuevaCriatura(ch, 'Trol'); c.danos = { fuego: 'vul', 'frío': 'res' };
    assert.equal(resumenCriatura(c), 'vulnerable a fuego · resiste frío');
    assert.equal(notasConjuro(ch, { tipos: ['fuego'] })[0].rel, 'vul');
    c.conjuros.s1 = 'ineficaz'; assert.equal(notasConjuro(ch, { sid: 's1', tipos: ['fuego'] })[0].rel, 'ineficaz');
    assert.equal(notasConjuro(ch, { tipos: ['trueno'] }).length, 0);
  });
});
