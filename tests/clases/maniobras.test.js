import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../../web/src/domain/personaje/modelo.js';
import { cupoManiobras, cdManiobras, maniobrasDe, alternarManiobra, MANIOBRAS } from '../../web/src/domain/clases/maniobras.js';
import { rasgosEnJuego } from '../../web/src/domain/clases/enJuego.js';
import { reglas } from '../../web/src/domain/clases/rasgos.js';

const ch = (o = {}) => normChar(blankChar({ stats: { fue: 16, des: 14, con: 14, int: 10, sab: 16, car: 10 }, ...o }));

describe('maniobras del Maestro del combate', () => {
  test('3/5/7/9 según el nivel de guerrero, CD con Fuerza o Destreza y en «En juego»', () => {
    const g = L => ch({ clase: 'Guerrero', subclase: 'Maestro del combate', nivel: L });
    assert.deepEqual([2, 3, 7, 10, 15, 20].map(L => cupoManiobras(g(L))), [0, 3, 5, 7, 9, 9]);
    assert.equal(cupoManiobras(ch({ clase: 'Guerrero', subclase: 'Campeón', nivel: 10 })), 0);
    assert.equal(cdManiobras(g(5)), 8 + 3 + 3);
    assert.equal(MANIOBRAS.length, 20);
    let sel = [];
    for (const m of MANIOBRAS.slice(0, 4)) sel = alternarManiobra(sel, m.nombre, 3);
    assert.equal(sel.length, 3);
    const c = { ...g(3), maniobras: ['Parada', 'Ataque de precisión', 'Ataque con finta'] };
    assert.equal(maniobrasDe(c).length, 3);
    const ej = rasgosEnJuego(c, {}, reglas(c));
    assert.equal(ej.find(r => r.nombre === 'Parada').grupo, 'reaccion');
    assert.equal(ej.find(r => r.nombre === 'Ataque con finta').grupo, 'adicional');
    assert.ok(ej.find(r => r.nombre === 'Parada').recurso, 'enlaza con los dados de supremacía');
    assert.deepEqual(normChar({ ...c, maniobras: ['Parada', 'Parada', ''] }).maniobras, ['Parada']);
  });
});
