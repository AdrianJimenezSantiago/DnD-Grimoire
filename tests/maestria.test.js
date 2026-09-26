import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { cupoMaestrias, armaElegible, efectoMaestria, ataquesPorAccion, cupoEn } from '../web/src/domain/maestria.js';
import { registrarAtaque, siguienteTurno, empezarCombate } from '../web/src/domain/combate.js';
import { ataqueArma, anadirComun, PREDEFINIDOS } from '../web/src/domain/equipo.js';
import { nivelImpacto } from '../web/src/ui/impacto.js';
import { parsear, distribucion } from '../web/src/domain/dados.js';

const de = n => structuredClone(PREDEFINIDOS.find(p => p.nombre === n));
const pj = o => normChar(blankChar({ clase: 'Guerrero', nivel: 1, stats: { fue: 16, des: 14, con: 14, int: 8, sab: 10, car: 10 }, ...o }));

test('cupo de maestrías por clase y nivel', () => {
  assert.equal(cupoMaestrias(pj()), 3);
  assert.equal(cupoMaestrias(pj({ nivel: 10 })), 5);
  assert.equal(cupoMaestrias(pj({ clase: 'Mago' })), 0);
  assert.equal(cupoMaestrias(pj({ clase: 'Paladín', multiclase: [{ clase: 'Pícaro', nivel: 1 }] })), 4);
  assert.equal(cupoEn('Bárbaro', 4) > cupoEn('Bárbaro', 3), true);
  assert.equal(armaElegible(pj({ clase: 'Bárbaro' }), de('Arco largo')), false);
  assert.equal(armaElegible(pj({ clase: 'Pícaro' }), de('Espadón')), false);
  assert.equal(armaElegible(pj({ clase: 'Pícaro' }), de('Estoque')), true);
});
test('efecto de la maestría con los números del personaje', () => {
  assert.match(efectoMaestria(pj(), 'Derribar', { mod: 3 }).alImpactar, /CD 13/);
  assert.match(efectoMaestria(pj(), 'Rozar', { mod: 3 }).alFallar, /3 de daño/);
  const ch = pj({ maestrias: ['Espadón'] }), a = ataqueArma(ch, anadirComun(ch, de('Espadón')));
  assert.equal(a.domina, true); assert.equal(a.maestria, 'Rozar');
  assert.equal(ataqueArma(ch, anadirComun(ch, de('Maza'))).domina, false);
});
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
test('nivel de la animación de impacto según la media', () => {
  const d = distribucion(parsear('2d6+3'));
  assert.equal(nivelImpacto(10, d), '');
  assert.equal(nivelImpacto(11, d), 'bueno');
  assert.equal(nivelImpacto(13, d), 'fuerte');
  assert.equal(nivelImpacto(15, d), 'epico');
});
