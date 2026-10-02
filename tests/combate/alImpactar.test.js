import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { arma } from '../helpers/fixtures.js';
import { blankChar, normChar } from '../../web/src/domain/personaje/modelo.js';
import { opcionesAlImpactar, gastarAlImpactar } from '../../web/src/domain/combate/alImpactar.js';
import { golpeSinArmas } from '../../web/src/domain/equipo/equipo.js';
import { empezarCombate, siguienteTurno, combateDe } from '../../web/src/domain/combate/combate.js';

const stats = { fue: 16, des: 14, con: 14, int: 10, sab: 12, car: 16 };
const ch = o => normChar(blankChar({ stats, ...o }));

describe('opcionesAlImpactar', () => {
  test('paladín: Castigo divino con uso gratis y con cada espacio libre, solo cuerpo a cuerpo', () => {
    const c = ch({ clase: 'Paladín', nivel: 5 });
    const ops = opcionesAlImpactar(c, arma('Espada larga'));
    assert.deepEqual(ops.map(o => [o.k, o.dado]), [['castigo:gratis', '2d8'], ['castigo:1', '2d8'], ['castigo:2', '3d8']]);
    assert.equal(opcionesAlImpactar(c, arma('Arco largo')).length, 0);
    gastarAlImpactar(c, [ops[2]]);
    assert.equal(c.play.used[2], 1);
    gastarAlImpactar(c, [ops[0]]);
    assert.equal(opcionesAlImpactar(c, golpeSinArmas(c)).some(o => o.k === 'castigo:gratis'), false, 'el uso gratis ya se gastó');
  });

  test('Maestro del combate: maniobras de daño mientras queden dados de supremacía', () => {
    const c = ch({ clase: 'Guerrero', subclase: 'Maestro del combate', nivel: 3, maniobras: ['Ataque para derribar', 'Parada', 'Ataque de precisión'] });
    const ops = opcionesAlImpactar(c, arma('Espada larga'));
    assert.deepEqual(ops.map(o => o.nombre), ['Ataque para derribar']);
    assert.equal(ops[0].dado, '1d8'); assert.match(ops[0].nota, /CD 13/);
    for (let i = 0; i < 4; i++) gastarAlImpactar(c, ops);
    assert.equal(opcionesAlImpactar(c, arma('Espada larga')).length, 0, 'sin dados no se ofrece');
  });

  test('Ataque furtivo y Golpe divino: una vez por turno en combate', () => {
    const c = ch({ clase: 'Pícaro', nivel: 5 }); empezarCombate(c);
    const [f] = opcionesAlImpactar(c, arma('Estoque'));
    assert.equal(f.dado, '3d6');
    assert.equal(opcionesAlImpactar(c, arma('Maza')).length, 0, 'solo arma sutil o a distancia');
    gastarAlImpactar(c, [f]);
    assert.equal(opcionesAlImpactar(c, arma('Estoque')).length, 0);
    siguienteTurno(c); assert.equal(opcionesAlImpactar(c, arma('Estoque')).length, 1);
    const cl = ch({ clase: 'Clérigo', nivel: 7, variantes: { 'Clérigo': 'Golpe divino' } });
    assert.equal(opcionesAlImpactar(cl, arma('Maza'))[0].dado, '1d8');
    assert.deepEqual(combateDe(cl).unaVez, []);
  });
});
