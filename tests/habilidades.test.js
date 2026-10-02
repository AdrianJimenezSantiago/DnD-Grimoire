import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';
import { bonoHabilidad, bonoSalvacion, iniciativa, percepcionPasiva, competenciasIniciales, velocidad, periciasDisponibles, tablaCaracteristicas } from '../web/src/domain/reglas/habilidades.js';

const pj = over => normChar(blankChar({ nivel: 5, stats: { fue: 8, des: 14, con: 12, int: 18, sab: 12, car: 10 }, ...over }));

test('habilidades: característica, competencia y pericia', () => {
  const ch = pj({ clase: 'Pícaro', habilidades: { sigilo: 2, percepcion: 1 } });
  assert.equal(bonoHabilidad(ch, 'sigilo'), 2 + 6);
  assert.equal(bonoHabilidad(ch, 'percepcion'), 1 + 3);
  assert.equal(bonoHabilidad(ch, 'atletismo'), -1);
  assert.equal(percepcionPasiva(ch), 14);
});
test('habilidades: Aprendiz de mucho del bardo suma la mitad de la competencia a las pruebas de habilidad, no a la iniciativa (2024)', () => {
  const ch = pj({ clase: 'Bardo', habilidades: {} });
  assert.equal(bonoHabilidad(ch, 'historia'), 4 + 1);
  assert.equal(iniciativa(ch), 2);
});
test('salvaciones de la clase principal y extra', () => {
  const ch = pj({ clase: 'Mago', multiclase: [{ clase: 'Guerrero', nivel: 1 }], salvacionesExtra: ['con'] });
  assert.equal(bonoSalvacion(ch, 'int'), 4 + 3);
  assert.equal(bonoSalvacion(ch, 'fue'), -1);
  assert.equal(bonoSalvacion(ch, 'con'), 1 + 3);
});
test('iniciativa con la dote Alerta', () => {
  assert.equal(iniciativa(pj({ clase: 'Mago', trasfondo: 'Criminal' })), 2 + 3);
  assert.equal(iniciativa(pj({ clase: 'Mago', trasfondo: 'Erudito' })), 2);
});
test('datos antiguos: el trasfondo da sus habilidades', () => {
  const ch = normChar({ nombre: 'X', clase: 'Mago', trasfondo: 'Erudito' });
  assert.deepEqual(ch.habilidades, { arcanos: 1, historia: 1 });
});
test('competencias iniciales: trasfondo y las de la clase según sus prioridades', () => {
  const c = competenciasIniciales(blankChar({ clase: 'Pícaro', trasfondo: 'Criminal' }));
  assert.equal(Object.keys(c).length, 6);
  assert.ok(c.juegomanos && c.sigilo);
});
test('velocidad: especie, rasgos de clase y agotamiento', () => {
  assert.equal(velocidad(pj({ clase: 'Mago' })), 9);
  assert.equal(velocidad(pj({ clase: 'Bárbaro', especie: 'Goliat' })), 13.5);
  assert.equal(velocidad(pj({ clase: 'Monje', nivel: 6 })), 13.5);
  assert.equal(velocidad(pj({ clase: 'Mago', vida: { agotamiento: 2 } })), 6);
});
test('pericias disponibles por clase y nivel', () => {
  assert.equal(periciasDisponibles(pj({ clase: 'Pícaro', nivel: 6 })), 4);
  assert.equal(periciasDisponibles(pj({ clase: 'Mago', nivel: 1 })), 0);
});
test('tabla de características con sus habilidades', () => {
  const t = tablaCaracteristicas(pj({ clase: 'Mago' }));
  assert.equal(t.length, 6);
  assert.equal(t.find(x => x.k === 'int').habilidades.length, 5);
  assert.equal(t.find(x => x.k === 'con').habilidades.length, 0);
});
