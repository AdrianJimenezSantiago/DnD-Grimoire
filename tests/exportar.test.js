import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar, upsertSpell, importarPersonaje, emptyDb } from '../web/src/domain/personaje/modelo.js';

test('exportar e importar un personaje suelto, con sus conjuros', () => {
  const a = emptyDb(), sid = upsertSpell(a, { es: 'Escudo', en: 'Shield', level: 1 });
  const ch = normChar(blankChar({ nombre: 'Orla', book: [{ sid, prep: true }], vida: { pg: 7 } }));
  const paquete = { tipo: 'grimorio-personaje', personaje: ch, conjuros: { [sid]: a.catalog[sid] } };
  const b = emptyDb(); b.chars.push(normChar(blankChar({ nombre: 'Orla' })));
  const c = importarPersonaje(b, paquete);
  assert.equal(c.nombre, 'Orla (importado)'); assert.notEqual(c.id, ch.id);
  assert.equal(b.catalog[c.book[0].sid].es, 'Escudo'); assert.equal(c.vida.pg, 7); assert.equal(b.activeId, c.id);
});
