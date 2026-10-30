import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { personajeVacio, normPersonaje, guardarConjuro, importarPersonaje, bdVacia, migrarBd, ESQUEMA, cargarGuardado, bdDeEjemplo } from '../../web/src/domain/personaje/modelo.js';

describe('normPersonaje', () => {
  test('campos nuevos con valores por defecto', () => {
    const c = normPersonaje({ nombre: 'X', retrato: { x: 1 } });
    assert.equal(c.retrato, null); assert.equal(c.historia, ''); assert.deepEqual(c.diario, { sesiones: [] });
  });
});

describe('importarPersonaje', () => {
  test('exportar e importar un personaje suelto, con sus conjuros', () => {
    const a = bdVacia(), sid = guardarConjuro(a, { es: 'Escudo', en: 'Shield', level: 1 });
    const ch = normPersonaje(personajeVacio({ nombre: 'Orla', book: [{ sid, prep: true }], vida: { pg: 7 } }));
    const paquete = { tipo: 'grimorio-personaje', personaje: ch, conjuros: { [sid]: a.catalog[sid] } };
    const b = bdVacia(); b.chars.push(normPersonaje(personajeVacio({ nombre: 'Orla' })));
    const c = importarPersonaje(b, paquete);
    assert.equal(c.nombre, 'Orla (importado)'); assert.notEqual(c.id, ch.id);
    assert.equal(b.catalog[c.book[0].sid].es, 'Escudo'); assert.equal(c.vida.pg, 7); assert.equal(b.activeId, c.id);
  });
});

describe('migraciones del esquema guardado', () => {
  test('se aplican en orden hasta el esquema actual', () => {
    const pasos = [];
    const r = migrarBd({ schema: 2, chars: [] }, { 2: d => { pasos.push(2); d.x = 1; }, 3: d => { pasos.push(3); return { ...d, y: 2 }; } }, 4);
    assert.deepEqual(pasos, [2, 3]); assert.equal(r.schema, 4); assert.equal(r.x, 1); assert.equal(r.y, 2);
  });
  test('sin el paso que falta, o con un esquema imposible, no se inventa nada', () => {
    assert.equal(migrarBd({ schema: 2 }, {}, 3), null);
    assert.equal(migrarBd({ schema: 1 }), null);
    assert.equal(migrarBd({ schema: 'x' }), null);
    assert.equal(migrarBd({ schema: ESQUEMA + 1 }), null);
    assert.equal(migrarBd({ schema: ESQUEMA }).schema, ESQUEMA);
  });
  test('datos de una versión más nueva se cargan como se puede y se avisa, sin perder la copia original', () => {
    const d = bdDeEjemplo(); d.schema = ESQUEMA + 1; d.campoNuevo = 1;
    const r = cargarGuardado(JSON.stringify(d), null);
    assert.equal(r.versionNueva, true); assert.equal(r.fallo, true, 'main guarda el original como rescate');
    assert.equal(r.db.chars[0].nombre, 'Theo');
  });
  test('los datos actuales cargan sin marcarse como migrados', () => {
    const r = cargarGuardado(JSON.stringify(bdDeEjemplo()), null);
    assert.equal(r.migrated, false); assert.ok(!r.fallo);
  });
});
