import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { nuevaSesion, nuevaNota, paraRecordar, buscarDiario } from '../../web/src/domain/personaje/diario.js';
import { personajeVacio, normPersonaje } from '../../web/src/domain/personaje/modelo.js';

describe('diario de campaña', () => {
  test('sesiones numeradas, notas y «para recordar»', () => {
    const c = normPersonaje(personajeVacio({ nombre: 'Ana' }));
    const s1 = nuevaSesion(c), s2 = nuevaSesion(c);
    assert.deepEqual([s1.n, s2.n], [1, 2]); assert.equal(c.diario.sesiones[0], s2);
    s1.notas.push(nuevaNota('pendiente', 'Preguntar por el sello'), nuevaNota('nombre', 'Maese Orrin'));
    const orrin = s1.notas[1]; orrin.fijada = true;
    assert.deepEqual(paraRecordar(c).map(n => n.texto), ['Preguntar por el sello', 'Maese Orrin']);
    s1.notas[0].hecho = true;
    assert.deepEqual(paraRecordar(c).map(n => n.texto), ['Maese Orrin']);
    assert.equal(buscarDiario(c, 'orrín').length, 1);
  });
});
