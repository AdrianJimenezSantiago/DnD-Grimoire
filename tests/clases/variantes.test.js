import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../../web/src/domain/personaje/modelo.js';
import { varianteDe, variantesPendientes, golpeExtra, trucoPotente } from '../../web/src/domain/clases/variantes.js';
import { escalas } from '../../web/src/domain/clases/clases2024.js';
import { ataqueArma, golpeSinArmas } from '../../web/src/domain/equipo/equipo.js';

const ch = (o = {}) => normChar(blankChar({ stats: { fue: 16, des: 14, con: 14, int: 10, sab: 16, car: 10 }, ...o }));

describe('variantes de rasgo', () => {
  test('Golpes benditos: la variante se elige y cambia el daño de armas o de trucos', () => {
    const c = ch({ clase: 'Clérigo', nivel: 7 });
    assert.deepEqual(variantesPendientes(c), ['Clérigo']);
    assert.deepEqual(variantesPendientes({ ...c, nivel: 6 }), []);
    const golpe = ch({ clase: 'Clérigo', nivel: 7, variantes: { 'Clérigo': 'Golpe divino' } });
    assert.equal(varianteDe(golpe, 'Clérigo').nombre, 'Golpe divino');
    assert.deepEqual(golpeExtra(golpe).map(g => g.dado), ['1d8']);
    assert.deepEqual(golpeExtra({ ...golpe, nivel: 14 }).map(g => g.dado), ['2d8']);
    assert.ok(ataqueArma(golpe, golpeSinArmas(golpe)).estilos.some(t => /Golpe divino.*1d8/.test(t)));
    assert.equal(trucoPotente(golpe, 'Clérigo'), null);
    const pot = ch({ clase: 'Clérigo', nivel: 7, variantes: { 'Clérigo': 'Lanzamiento potente' } });
    assert.equal(trucoPotente(pot, 'Clérigo').bono, 3);
    assert.equal(trucoPotente(pot, 'Iniciado en la magia'), null, 'un truco de dote no es de clérigo');
    assert.equal(golpeExtra(pot).length, 0);
    assert.match(escalas(pot).find(e => e.nombre === 'Golpes benditos').valor, /\+3 a trucos/);
    assert.deepEqual(normChar({ ...pot, variantes: { 'Clérigo': 'Inventada' } }).variantes, {});
  });

  test('Furia elemental del druida: Golpe primigenio o Lanzamiento potente', () => {
    const d = ch({ clase: 'Druida', nivel: 15, variantes: { 'Druida': 'Golpe primigenio' } });
    assert.deepEqual(golpeExtra(d).map(g => g.dado), ['2d8']);
    assert.ok(escalas(d).some(e => e.nombre === 'Furia elemental'));
  });
});
