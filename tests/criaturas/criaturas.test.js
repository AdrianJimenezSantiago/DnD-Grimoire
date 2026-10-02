import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { compendioJson } from '../helpers/fixtures.js';
import { ESPIRITUS, PERFILES, caracteristicas, criaturasDe, perfilDe } from '../../web/src/domain/criaturas/criaturas.js';

const { conjuros } = compendioJson();

describe('perfiles de criaturas', () => {
  test('familiares, Pacto de la cadena y monturas con perfil completo', () => {
    const f = criaturasDe('Encontrar familiar');
    assert.equal(f.familiar.length, 11); assert.equal(f.cadena.length, 8);
    for (const id of [...f.familiar, ...f.cadena, 'caballo', 'zombi']) {
      const p = perfilDe(id);
      assert.ok(p.nombre && p.tipo && p.ca > 0 && p.pg && p.vel && p.car.length === 6 && p.vd, id);
      assert.ok(p.acciones?.length, `${id} sin acciones`);
    }
    assert.deepEqual(caracteristicas(PERFILES.gato).find(c => c.k === 'des'), { k: 'des', v: 15, mod: 2, salv: 4 });
    assert.deepEqual(criaturasDe('Animar a los muertos').fijos, ['esqueleto', 'zombi']);
    assert.equal(criaturasDe('Bola de fuego'), null);
  });

  test('los espíritus escalan con el espacio y usan tu ataque y tu CD', () => {
    const b = perfilDe('bestia', { n: 4, v: 'aire', atk: 8, cd: 16 });
    assert.equal(b.ca, 15); assert.equal(b.pg, '30'); assert.match(b.vel, /volar 18 m/);
    assert.match(b.acciones[0][1], /2 ataques/); assert.match(b.acciones[1][1], /\+8/); assert.match(b.acciones[1][1], /1d8 \+ 8/);
    assert.equal(perfilDe('bestia', { n: 2, v: 'tierra' }).pg, '30');
    assert.equal(perfilDe('infernal', { n: 7, v: 'yugoloth' }).pg, '75');
    assert.match(perfilDe('dragon', { n: 5, cd: 15 }).acciones[2][1], /CD 15/);
    assert.equal(perfilDe('celestial', { n: 5, v: 'defensor' }).ca, 18);
    assert.equal(perfilDe('corcel', { n: 4, v: 'feérico' }).vel, '18 m, volar 18 m');
    assert.equal(perfilDe('elemental', { n: 1 }).n, 4);
    for (const [id, e] of Object.entries(ESPIRITUS)) for (const v of e.variantes.length ? e.variantes : [undefined]) assert.ok(perfilDe(id, { n: 9, v }).acciones.length, `${id} ${v}`);
    for (const n of ['Encontrar familiar', 'Hallar corcel', 'Corcel fantasma', 'Animar a los muertos', 'Invocar bestia', 'Invocar feérico', 'Invocar muerto viviente', 'Invocar aberración',
      'Invocar autómata', 'Invocar elemental', 'Invocar celestial', 'Invocar dragón', 'Invocar infernal']) { assert.ok(conjuros.some(c => c.es === n), n); assert.ok(criaturasDe(n), n); }
  });
});
