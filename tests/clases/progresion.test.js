import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { compendioJson } from '../helpers/fixtures.js';
import { perfil } from '../../web/src/domain/reglas/reglas2024.js';
import { conjurosPendientes, anadirPendientes, levelDiff } from '../../web/src/domain/clases/progresion.js';
import { blankChar } from '../../web/src/domain/personaje/modelo.js';

const { conjuros } = compendioJson();
const ch = (clase, subclase = '', nivel = 8, stats = {}) => blankChar({ clase, subclase, nivel, stats: { fue: 14, des: 14, con: 14, int: 14, sab: 14, car: 14, ...stats } });

describe('conjuros pendientes al subir de nivel', () => {
  test('añadir los conjuros pendientes al subir de nivel', () => {
    const db = { catalog: {}, chars: [] }, c = ch('Clérigo', 'Dominio de la luz', 5);
    const p = conjurosPendientes(db, c, conjuros);
    assert.equal(p.length, 6);
    assert.deepEqual(anadirPendientes(db, c, p), ['Fuego feérico', 'Manos ardientes', 'Rayo abrasador', 'Ver invisibilidad', 'Bola de fuego', 'Luz del día']);
    assert.ok(c.book.every(e => e.always && e.prep));
    assert.equal(conjurosPendientes(db, c, conjuros).length, 0);
  });
});

describe('levelDiff', () => {
  test('levelDiff describe lo que se gana', () => {
    const a = blankChar({ clase: 'Mago', subclase: 'Adivino', nivel: 6 }), b = { ...a, nivel: 7 };
    assert.match(levelDiff(perfil(a), perfil(b), a, b), /prepara 1 conjuro más.*espacios de nivel 4.*Recuperación arcana sube a 4/);
  });
});
