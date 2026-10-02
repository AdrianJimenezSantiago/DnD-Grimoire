import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { compendioJson } from '../helpers/fixtures.js';
import { perfil, nivelTotal } from '../../web/src/domain/reglas/reglas2024.js';
import { conjurosAutomaticos, subclaseDe } from '../../web/src/domain/clases/clases2024.js';
import { reglas } from '../../web/src/domain/clases/rasgos.js';
import { sembrarPruebas, statsPrueba, NIVEL_PRUEBA } from '../../web/src/domain/personaje/pruebas.js';

const { conjuros } = compendioJson();

describe('personajes de prueba', () => {
  test('características con matriz estándar, trasfondo y mejoras', () => {
    const { stats, notas } = statsPrueba(['int', 'con', 'des', 'sab', 'car', 'fue'], 'Erudito', 'Mago', 8);
    assert.deepEqual(stats, { int: 20, con: 16, des: 13, sab: 12, car: 10, fue: 8 });
    assert.equal(notas.length, 2);
    assert.equal(statsPrueba(['fue', 'con', 'des', 'sab', 'int', 'car'], 'Soldado', 'Guerrero', 8).notas.length, 3);
  });

  test('un personaje de nivel 8 por subclase, completos y coherentes con las reglas', () => {
    const db = { schema: 2, catalog: {}, chars: [{ id: 'mio', nombre: 'Theo', clase: 'Mago', nivel: 6, book: [] }], activeId: 'mio' };
    const r = sembrarPruebas(db, conjuros);
    assert.deepEqual(r.faltan, []);
    assert.equal(r.creados, 57);
    assert.equal(db.chars.length, 58); assert.equal(db.activeId, 'mio');
    const pruebas = db.chars.filter(c => c.prueba);
    for (const c of pruebas) {
      const P = perfil(c), libro = c.book.map(e => db.catalog[e.sid]);
      assert.equal(nivelTotal(c), NIVEL_PRUEBA);
      assert.ok(subclaseDe(c), c.subclase);
      assert.ok(Object.values(c.stats).every(v => v >= 8 && v <= 20), c.nombre);
      assert.ok(libro.every(Boolean), `${c.nombre}: conjuro fuera del catálogo`);
      assert.ok(libro.every(s => s.level <= Math.max(P.maxSlot, 2)), `${c.nombre}: conjuro de nivel demasiado alto`);
      if (P.maxPrep) {
        const prep = c.book.filter(e => e.prep && !e.always).length;
        assert.equal(prep, P.maxPrep, `${c.nombre}: preparados`);
        assert.ok(libro.filter(s => s.level === 0).length >= P.maxCant, `${c.nombre}: trucos`);
      }
      for (const a of conjurosAutomaticos(c)) assert.ok(libro.some(s => s.es === a.nombre), `${c.nombre}: falta ${a.nombre}`);
      assert.ok(c.equipo.objetos.some(o => o.sintonizado));
      assert.equal(c.diario.sesiones.length, 1); assert.equal(c.bestiario.criaturas.length, 1);
      assert.match(c.historia, /## Origen/);
      assert.match(c.notas, /Nivel \d/);
    }
    const mago = pruebas.find(c => c.subclase === 'Adivino');
    assert.equal(mago.book.filter(e => e.fuente === 'Libro').length, 20);
    assert.equal(mago.book.filter(e => /^Experto/.test(e.fuente)).length, 4);
    assert.ok(reglas(mago).some(x => x.nombre === 'Presagio'));
    sembrarPruebas(db, conjuros);
    assert.equal(db.chars.length, 58); assert.ok(db.chars.some(c => c.id === 'mio'));
    const multi = db.chars.find(c => c.multiclase?.length);
    assert.deepEqual([multi.clase, multi.nivel, multi.multiclase[0].clase, multi.multiclase[0].nivel, perfil(multi).pb], ['Bárbaro', 5, 'Guerrero', 3, 3]);
  });
});
