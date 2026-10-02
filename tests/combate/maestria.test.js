import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { arma } from '../helpers/fixtures.js';
import { blankChar, normChar } from '../../web/src/domain/personaje/modelo.js';
import { esSencilla } from '../../web/src/domain/reglas/competencias.js';
import { cupoMaestrias, armaElegible, efectoMaestria, ataquesPorAccion, cupoEn } from '../../web/src/domain/combate/maestria.js';
import { registrarAtaque, siguienteTurno, empezarCombate } from '../../web/src/domain/combate/combate.js';
import { ataqueArma, anadirComun } from '../../web/src/domain/equipo/equipo.js';

const pj = o => normChar(blankChar({ clase: 'Guerrero', nivel: 1, stats: { fue: 16, des: 14, con: 14, int: 8, sab: 10, car: 10 }, ...o }));

describe('armaElegible', () => {
  test('el pícaro domina cualquier arma sencilla, aunque no sea sutil ni ligera (Manual del Jugador 2024)', () => {
    const picaro = pj({ clase: 'Pícaro' });
    for (const n of ['Garrote grande', 'Honda', 'Martillo ligero', 'Dardo', 'Bastón']) assert.equal(armaElegible(picaro, arma(n)), true, n);
    assert.equal(armaElegible(picaro, arma('Hacha a dos manos')), false);
  });

  test('las armas sencillas se reconocen también con bonificador o nombre de objeto mágico', () => {
    assert.equal(esSencilla(arma('Garrote grande')), true);
    assert.equal(esSencilla({ nombre: 'Honda +1' }), true);
    assert.equal(esSencilla({ nombre: 'Martillo del trueno', arma: { base: 'Martillo ligero' } }), true);
    assert.equal(esSencilla(arma('Espada larga')), false);
  });
});

describe('cupo y efecto', () => {
  test('cupo de maestrías por clase y nivel', () => {
    assert.equal(cupoMaestrias(pj()), 3);
    assert.equal(cupoMaestrias(pj({ nivel: 10 })), 5);
    assert.equal(cupoMaestrias(pj({ clase: 'Mago' })), 0);
    assert.equal(cupoMaestrias(pj({ clase: 'Paladín', multiclase: [{ clase: 'Pícaro', nivel: 1 }] })), 4);
    assert.equal(cupoEn('Bárbaro', 4) > cupoEn('Bárbaro', 3), true);
    assert.equal(armaElegible(pj({ clase: 'Bárbaro' }), arma('Arco largo')), false);
    assert.equal(armaElegible(pj({ clase: 'Pícaro' }), arma('Espadón')), false);
    assert.equal(armaElegible(pj({ clase: 'Pícaro' }), arma('Estoque')), true);
  });

  test('efecto de la maestría con los números del personaje', () => {
    assert.match(efectoMaestria(pj(), 'Derribar', { mod: 3 }).alImpactar, /CD 13/);
    assert.match(efectoMaestria(pj(), 'Rozar', { mod: 3 }).alFallar, /3 de daño/);
    const ch = pj({ maestrias: ['Espadón'] }), a = ataqueArma(ch, anadirComun(ch, arma('Espadón')));
    assert.equal(a.domina, true); assert.equal(a.maestria, 'Rozar');
    assert.equal(ataqueArma(ch, anadirComun(ch, arma('Maza'))).domina, false);
  });
});

describe('ataquesPorAccion', () => {
  test('acción de Ataque: ataque adicional, arma ligera y Mella', () => {
    assert.equal(ataquesPorAccion(pj({ nivel: 5 })), 2);
    assert.equal(ataquesPorAccion(pj({ nivel: 11 })), 3);
    assert.equal(ataquesPorAccion(pj({ clase: 'Mago', subclase: 'Hojacantante', nivel: 6 })), 2);
    const ch = pj({ nivel: 5 }); empezarCombate(ch);
    assert.deepEqual(registrarAtaque(ch, { max: 2, ligera: true }), { tipo: 'accion', n: 1, max: 2 });
    assert.equal(registrarAtaque(ch, { max: 2, ligera: true }).n, 2);
    assert.equal(registrarAtaque(ch, { max: 2, ligera: true }).tipo, 'adicional');
    assert.equal(ch.combate.turno.adicional, true);
    assert.equal(registrarAtaque(ch, { max: 2 }).tipo, 'agotado');
    siguienteTurno(ch);
    registrarAtaque(ch, { max: 1, ligera: true });
    assert.equal(registrarAtaque(ch, { max: 1, ligera: true, mella: true }).tipo, 'mella');
    assert.equal(ch.combate.turno.adicional, false);
  });
});
