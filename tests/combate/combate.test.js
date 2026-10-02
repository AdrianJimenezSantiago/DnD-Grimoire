import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { normCombate, empezarCombate, combateDe, limiteEspacio, lanzarEnCombate, terminarCombate, siguienteTurno } from '../../web/src/domain/combate/combate.js';
import { personajeVacio, normPersonaje } from '../../web/src/domain/personaje/modelo.js';

const guerrero = over => normPersonaje(personajeVacio({ clase: 'Guerrero', nivel: 3, stats: { con: 14, des: 14 }, ...over }));
const st = o => ({ fue: 10, des: 10, con: 14, int: 10, sab: 10, car: 10, ...o });
const pj = o => normPersonaje(personajeVacio(o));

describe('iniciativa', () => {
  test('la iniciativa escrita a mano se recuerda y se limpia al empezar otro', () => {
    assert.equal(normCombate({ iniciativa: '17', iniManual: true }).iniManual, true);
    assert.equal(normCombate({ iniciativa: null, iniManual: true }).iniManual, false);
    const ch = guerrero({ combate: { activo: true, iniciativa: 19, iniManual: true } });
    empezarCombate(ch); assert.equal(combateDe(ch).iniciativa, null); assert.equal(combateDe(ch).iniManual, false);
  });
});

describe('limiteEspacio', () => {
  test('un espacio de conjuro por turno (Manual del Jugador 2024): trucos y reacciones en otro turno sí', () => {
    const maga = pj({ clase: 'Mago', nivel: 5, stats: st({ int: 18 }) });
    assert.equal(limiteEspacio(maga, 'Acción'), '');                     // fuera de combate no hay turnos
    empezarCombate(maga);
    lanzarEnCombate(maga, { tiempo: 'Acción', conEspacio: true, nombre: 'Bola de fuego' });
    assert.equal(combateDe(maga).turno.accion, true);
    assert.equal(limiteEspacio(maga, 'Acción adicional'), 'turno');      // Paso brumoso con espacio: no en el mismo turno
    assert.equal(limiteEspacio(maga, 'Reacción'), 'reaccion');           // Escudo: solo si es en el turno de otra criatura
    lanzarEnCombate(maga, { tiempo: 'Reacción', conEspacio: true, nombre: 'Escudo' });
    assert.equal(combateDe(maga).espacio, 'Bola de fuego');             // la reacción en otro turno no cuenta para el tuyo
    siguienteTurno(maga);
    assert.equal(limiteEspacio(maga, 'Acción adicional'), '');           // turno nuevo, espacio nuevo
    lanzarEnCombate(maga, { tiempo: 'Acción adicional' });               // un truco o un conjuro sin espacio no marca nada
    assert.equal(limiteEspacio(maga, 'Acción'), '');
    lanzarEnCombate(maga, { tiempo: 'Acción', conEspacio: true, nombre: 'Relámpago' });
    terminarCombate(maga); assert.equal(combateDe(maga).espacio, '');
  });
});
