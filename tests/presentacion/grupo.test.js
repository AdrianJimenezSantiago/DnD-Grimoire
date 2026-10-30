import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { bdDeEjemplo } from '../../web/src/domain/personaje/modelo.js';
import { resumenGrupo, filaGrupo } from '../../web/src/domain/presentacion/grupo.js';

describe('vista de grupo', () => {
  test('una fila por personaje con CA, PG, pasivas, salvaciones y CD', () => {
    const db = bdDeEjemplo(), f = filaGrupo(db.chars[0]);
    assert.equal(f.nombre, 'Theo'); assert.equal(f.ca, 12); assert.deepEqual([f.pg, f.pgMax], [38, 38]);
    assert.deepEqual(f.pasivas, { percepcion: 11, investigacion: 14, perspicacia: 11 });
    assert.equal(f.salvaciones.length, 6); assert.ok(f.salvaciones.find(s => s.corto === 'Int').competente);
    assert.equal(f.cd, '15');
  });
  test('los personajes de prueba solo salen si no hay otros, y marca la mejor pasiva', () => {
    const db = bdDeEjemplo(), otro = { ...structuredClone(db.chars[0]), id: 'x', nombre: 'Prueba', prueba: true };
    db.chars.push(otro);
    assert.deepEqual(resumenGrupo(db).filas.map(f => f.nombre), ['Theo']);
    assert.deepEqual(resumenGrupo({ chars: [otro] }).filas.map(f => f.nombre), ['Prueba']);
    assert.equal(resumenGrupo(db).mejores.investigacion, null, 'con un solo personaje no se resalta nada');
    const dos = bdDeEjemplo(), b = structuredClone(dos.chars[0]); b.id = 'b'; b.stats.int = 10; dos.chars.push(b);
    assert.deepEqual(resumenGrupo(dos).mejores, { percepcion: null, investigacion: 14, perspicacia: null }, 'solo donde alguien destaca');
    assert.deepEqual(resumenGrupo({ chars: [] }), { filas: [], mejores: { percepcion: null, investigacion: null, perspicacia: null } });
  });
  test('estados, agotamiento, concentración e inspiración a la vista', () => {
    const ch = structuredClone(bdDeEjemplo().chars[0]);
    ch.vida.estados = ['envenenado']; ch.vida.agotamiento = 2; ch.vida.inspiracion = true; ch.play.conc = 'Bendición';
    const f = filaGrupo(ch);
    assert.deepEqual(f.estados, ['Envenenado', 'Agotamiento 2']); assert.equal(f.concentracion, 'Bendición'); assert.ok(f.inspiracion);
  });
});
