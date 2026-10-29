import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { normCombate, empezarCombate, terminarCombate, siguienteTurno, combateDe } from '../../web/src/domain/combate/combate.js';
import { listaIniciativa, anadirCombatientes, avanzarTurno, quitarCombatiente, cambiarPg, fijarIniciativa, turnoActual, YO } from '../../web/src/domain/combate/orden.js';

const combate = (ini = 14) => { const c = normCombate({ activo: true }); c.iniciativa = ini; return c; };
const nombres = (c, yo) => listaIniciativa(c, yo).map(x => x.nombre);

describe('orden de iniciativa', () => {
  test('tu personaje entra en la lista por su iniciativa; en empate vas antes, y sin iniciativa al final', () => {
    const c = combate(14);
    anadirCombatientes(c, { nombre: 'Lobo', ini: 18 });
    anadirCombatientes(c, { nombre: 'Mira', tipo: 'aliado', ini: 14 });
    anadirCombatientes(c, { nombre: 'Orco', ini: 3 });
    anadirCombatientes(c, { nombre: 'Kael', tipo: 'aliado' });
    assert.deepEqual(nombres(c, { nombre: 'Theo' }), ['Lobo', 'Theo', 'Mira', 'Orco', 'Kael']);
  });

  test('varios iguales se numeran y los nombres repetidos no chocan', () => {
    const c = combate();
    anadirCombatientes(c, { nombre: 'Goblin', ini: 10, cantidad: 3, pgMax: 7 });
    anadirCombatientes(c, { nombre: 'Goblin 1', ini: 9 });
    assert.deepEqual(c.orden.map(x => x.nombre), ['Goblin 1', 'Goblin 2', 'Goblin 3', 'Goblin 1 2']);
    assert.ok(c.orden.slice(0, 3).every(x => x.pg === 7 && x.pgMax === 7));
  });

  test('sin iniciativa escrita, se tira d20 + modificador para cada uno', () => {
    const c = combate(), tiros = [5, 17];
    anadirCombatientes(c, { nombre: 'Esqueleto', cantidad: 2, desempate: 2 }, () => tiros.shift());
    assert.deepEqual(c.orden.map(x => x.ini), [7, 19]);
  });

  test('pasar turno recorre la lista, salta a los caídos y avisa al llegar a ti (salvo tu primer turno)', () => {
    const c = combate(12);
    anadirCombatientes(c, { nombre: 'Lobo', ini: 18, pgMax: 11 });
    anadirCombatientes(c, { nombre: 'Orco', ini: 5 });
    assert.equal(avanzarTurno(c).actual.nombre, 'Lobo');
    const r1 = avanzarTurno(c);
    assert.equal(r1.actual.id, YO); assert.equal(r1.tuTurno, false, 'en la ronda 1 tu turno ya está preparado');
    assert.equal(avanzarTurno(c).actual.nombre, 'Orco');
    cambiarPg(c, c.orden[0].id, -20);
    assert.equal(c.orden[0].fuera, true, 'a 0 PG queda fuera');
    const r2 = avanzarTurno(c);
    assert.equal(r2.actual.id, YO, 'salta al lobo caído'); assert.equal(r2.tuTurno, true, 'ahora sí empieza tu siguiente turno');
  });

  test('«Siguiente turno» de siempre deja el puntero en ti', () => {
    const ch = { combate: { activo: true, iniciativa: 10 } }, c = combateDe(ch);
    anadirCombatientes(c, { nombre: 'Lobo', ini: 18 });
    avanzarTurno(c);
    siguienteTurno(ch);
    assert.equal(c.turnoDe, YO); assert.equal(c.ronda, 2);
    assert.equal(avanzarTurno(c).actual.nombre, 'Lobo');
    assert.equal(avanzarTurno(c).tuTurno, true);
  });

  test('quitar al que tiene el turno pasa el turno al siguiente', () => {
    const c = combate(1);
    const [a] = anadirCombatientes(c, { nombre: 'A', ini: 20 }); anadirCombatientes(c, { nombre: 'B', ini: 15 });
    avanzarTurno(c);
    assert.ok(quitarCombatiente(c, a.id).quitado);
    assert.equal(turnoActual(c).nombre, 'B');
    assert.equal(quitarCombatiente(c, 'no-existe'), null);
  });

  test('los PG no bajan de 0 ni suben del máximo; curar a uno caído lo devuelve', () => {
    const c = combate(); const [o] = anadirCombatientes(c, { nombre: 'Ogro', ini: 8, pgMax: 59 });
    cambiarPg(c, o.id, -70); assert.deepEqual([o.pg, o.fuera], [0, true]);
    cambiarPg(c, o.id, 100); assert.deepEqual([o.pg, o.fuera], [59, false]);
    fijarIniciativa(c, o.id, 99); assert.equal(o.ini, 60);
  });

  test('los aliados se quedan para el siguiente combate (sin iniciativa) y los enemigos se van', () => {
    const ch = { combate: { activo: true, iniciativa: 10 } };
    anadirCombatientes(combateDe(ch), { nombre: 'Mira', tipo: 'aliado', ini: 9, pgMax: 20 });
    anadirCombatientes(combateDe(ch), { nombre: 'Lobo', ini: 18 });
    terminarCombate(ch);
    assert.deepEqual(combateDe(ch).orden.map(x => [x.nombre, x.ini]), [['Mira', null]]);
    empezarCombate(ch);
    assert.deepEqual(combateDe(ch).orden.map(x => x.nombre), ['Mira']);
  });

  test('lo guardado se lee con desconfianza', () => {
    const c = normCombate({ orden: [{ nombre: '<b>X</b>', ini: '12', tipo: 'jefe', id: 'yo' }, { nombre: '' }, 'basura', { nombre: 'Y', pg: 50, pgMax: 10 }], turnoDe: 'fantasma' });
    assert.equal(c.orden.length, 2);
    assert.equal(c.orden[0].nombre, 'bX/b'); assert.equal(c.orden[0].tipo, 'enemigo'); assert.notEqual(c.orden[0].id, YO);
    assert.equal(c.orden[1].pg, 10); assert.equal(c.turnoDe, null);
  });
});
