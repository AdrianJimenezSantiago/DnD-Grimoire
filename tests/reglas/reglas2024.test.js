import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { perfil, clasesDe, nivelTotal, requisitosMulticlase, dotesDe } from '../../web/src/domain/reglas/reglas2024.js';
import { personajeVacio, bdDeEjemplo, normPersonaje } from '../../web/src/domain/personaje/modelo.js';
import { reglas } from '../../web/src/domain/clases/rasgos.js';
import { limiteFormaSalvaje } from '../../web/src/domain/criaturas/monstruos.js';

const pj = o => personajeVacio(o);
const pjMulticlase = (clase, nivel, multiclase = [], extra = {}) => ({ clase, subclase: '', nivel, multiclase, stats: { fue: 14, des: 14, con: 14, int: 14, sab: 14, car: 14 }, play: { rec: {} }, rasgos: [], ...extra });

describe('perfil: lanzadores, CD y espacios', () => {
  test('Theo (mago 6, INT 18): CD 15, ataque +7, espacios 4/3/3, 10 preparados, 4 trucos', () => {
    const theo = bdDeEjemplo().chars[0], P = perfil(theo);
    assert.equal(P.cd, 15); assert.equal(P.atk, 7);
    assert.deepEqual(P.slots, { 1: 4, 2: 3, 3: 3 });
    assert.equal(P.maxPrep, 10); assert.equal(P.maxCant, 4);
  });

  test('brujo 5: magia de pacto, 2 espacios de nivel 3', () => {
    const P = perfil(pj({ clase: 'Brujo', nivel: 5 }));
    assert.deepEqual(P.pact, { level: 3, n: 2 }); assert.deepEqual(P.slots, { 3: 2 });
  });

  test('paladín 1 ya lanza conjuros en 2024 (2 espacios de nivel 1)', () => {
    assert.deepEqual(perfil(pj({ clase: 'Paladín', nivel: 1 })).slots, { 1: 2 });
  });

  test('guerrero solo lanza como Caballero arcano desde nivel 3', () => {
    assert.equal(perfil(pj({ clase: 'Guerrero', nivel: 7 })).c, null);
    const P = perfil(pj({ clase: 'Guerrero', subclase: 'Caballero arcano', nivel: 7 }));
    assert.deepEqual(P.slots, { 1: 4, 2: 2 }); assert.equal(P.maxPrep, 5); assert.equal(P.lista, 'Mago');
  });

  test('espacios a mano sustituyen a las tablas', () => {
    assert.deepEqual(perfil(pj({ clase: 'Mago', nivel: 5, espaciosManuales: true, espacios: { 1: 4, 2: 3, 3: 3, 4: 1 } })).slots, { 1: 4, 2: 3, 3: 3, 4: 1 });
  });
});

describe('competencia', () => {
  test('bonificador de competencia por nivel', () => {
    assert.deepEqual([1, 4, 5, 9, 13, 17, 20].map(n => perfil(pj({ nivel: n })).pb), [2, 2, 3, 4, 5, 6, 6]);
  });
});

describe('multiclase', () => {
  test('nivel total, competencia y clases (sin repetir ni pasar de 20)', () => {
    const ch = pjMulticlase('Bárbaro', 5, [{ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 }, { clase: 'Bárbaro', nivel: 2 }, { clase: 'Inventada', nivel: 1 }]);
    assert.deepEqual(clasesDe(ch).map(c => `${c.clase} ${c.nivel}`), ['Bárbaro 5', 'Guerrero 3']);
    assert.equal(nivelTotal(ch), 8); assert.equal(perfil(ch).pb, 3); assert.deepEqual(perfil(ch).slots, {});
    assert.equal(nivelTotal(pjMulticlase('Mago', 15, [{ clase: 'Clérigo', nivel: 9 }])), 20);
    assert.deepEqual(reglas(ch).map(r => r.nombre), ['Furia', 'Tomar aliento', 'Acción súbita']);
  });

  test('espacios según el Manual del Jugador 2024', () => {
    assert.deepEqual(perfil(pjMulticlase('Mago', 5, [{ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 }])).slots, { 1: 4, 2: 3, 3: 2 });
    assert.deepEqual(perfil(pjMulticlase('Explorador', 5, [{ clase: 'Paladín', nivel: 4 }])).slots, { 1: 4, 2: 3, 3: 2 });
    assert.deepEqual(perfil(pjMulticlase('Guerrero', 3, [{ clase: 'Mago', nivel: 1 }], { subclase: 'Caballero arcano' })).slots, { 1: 3 });
    const P = perfil(pjMulticlase('Paladín', 5, [{ clase: 'Hechicero', nivel: 3 }, { clase: 'Brujo', nivel: 2 }]));
    assert.deepEqual(P.pact, { level: 1, n: 2 }); assert.deepEqual(P.slots, { 1: 6, 2: 3, 3: 3 });
    assert.equal(P.maxPrep, 6 + 6 + 3); assert.deepEqual(P.listas, ['Paladín', 'Hechicero', 'Brujo']);
    assert.equal(perfil(pjMulticlase('Bárbaro', 3, [{ clase: 'Druida', nivel: 2 }])).apKey, 'sab');
  });

  test('requisitos, modelo y nivel de druida para Forma salvaje', () => {
    const ch = pjMulticlase('Bárbaro', 5, [{ clase: 'Mago', nivel: 1 }], { stats: { fue: 15, des: 12, con: 14, int: 10, sab: 10, car: 8 } });
    assert.deepEqual(requisitosMulticlase(ch), [{ clase: 'Mago', falta: 'Inteligencia 13' }]);
    const c = normPersonaje({ nombre: 'X', clase: 'Druida', nivel: 4, multiclase: [{ clase: 'Druida', nivel: 2 }, { clase: 'Monje', nivel: 40 }, { clase: 'Monje', nivel: 1 }, null], dotes: ['Alerta', ' Alerta ', '', 'Duro'] });
    assert.deepEqual(c.multiclase, [{ clase: 'Monje', subclase: '', nivel: 19 }]); assert.deepEqual(c.dotes, ['Alerta', 'Duro']);
    assert.equal(limiteFormaSalvaje(pjMulticlase('Monje', 10, [{ clase: 'Druida', nivel: 4 }])).vd, 0.5);
  });
});

describe('dotesDe', () => {
  test('la de origen sale del trasfondo (también de un libro importado) y se suman las elegidas', () => {
    assert.deepEqual(dotesDe({ trasfondo: 'Erudito', dotes: ['Alerta', 'Iniciado en la magia (mago)'] }),
      [{ nombre: 'Iniciado en la magia', detalle: 'mago', origen: 'trasfondo' }, { nombre: 'Alerta', detalle: '', origen: 'elegida' }]);
    assert.equal(dotesDe({ trasfondo: 'Pescador en hielo', dotes: [] }, [{ nombre: 'Pescador en hielo', dote: 'Alerta' }])[0].nombre, 'Alerta');
  });
});
