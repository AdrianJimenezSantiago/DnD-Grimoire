import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { compendioJson } from '../helpers/fixtures.js';
import { alcance } from '../../web/src/domain/conjuros/validar.js';
import { conObjetivos, empezarConc, objetivosNuevos, rasgosConObjetivo, terminarConc } from '../../web/src/domain/combate/concentracion.js';
import { blankChar } from '../../web/src/domain/personaje/modelo.js';

const { conjuros } = compendioJson();

describe('objetivos de concentración', () => {
  test('objetivos solo en conjuros sin área, y se olvidan al cambiar', () => {
    const bend = { conc: true, alcance: '9 m' }, dormir = { conc: true, alcance: '27 m' };
    assert.equal(conObjetivos(bend, ['Hasta tres criaturas que elijas dentro del alcance.']), true);
    assert.equal(conObjetivos(dormir, ['Cada criatura en una esfera de 1,5 m de radio.']), false);
    assert.equal(conObjetivos({ conc: false }, []), false);
    const play = { conc: '', concObj: [] };
    empezarConc(play, 'Bendición'); play.concObj.push('Ana');
    empezarConc(play, 'Bendición'); assert.deepEqual(play.concObj, ['Ana']);
    empezarConc(play, 'Acelerar'); assert.deepEqual(play.concObj, []);
    terminarConc(play); assert.equal(play.conc, '');
    assert.deepEqual(objetivosNuevos('Ana, el trol y Bram; ana', ['Bram']), ['Ana', 'el trol']);
  });

  test('rasgos con objetivo según la clase y el nivel', () => {
    assert.deepEqual(rasgosConObjetivo(blankChar({ clase: 'Paladín', subclase: 'Juramento de venganza', nivel: 3 })), ['Voto de enemistad']);
    assert.deepEqual(rasgosConObjetivo(blankChar({ clase: 'Monje', nivel: 4 })), []);
    assert.deepEqual(rasgosConObjetivo(blankChar({ clase: 'Monje', nivel: 5 })), ['Golpe aturdidor']);
    assert.ok(rasgosConObjetivo(blankChar({ clase: 'Bardo', nivel: 1 })).includes('Inspiración bárdica'));
  });
});
