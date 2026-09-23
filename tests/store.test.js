import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../web/src/core/store.js';
import { seedDb, fromStored } from '../web/src/domain/modelo.js';

const mem = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); }, m }; };

test('act anota en el historial del personaje y se puede deshacer', () => {
  const st = mem(), S = createStore({ storage: st, key: 'k', db: seedDb() });
  let renders = 0; S.subscribe(() => renders++);
  const h1 = S.act('Escudo: espacio de nivel 1 gastado', (db, ch) => { ch.play.used[1] = 1; });
  S.act('Contraconjuro', (db, ch) => { ch.play.used[3] = 1; });
  assert.equal(S.cur().play.log.length, 2); assert.equal(renders, 2);
  assert.ok(S.undoable(h1.id));
  S.undo(h1);                                   // deshace esta y la posterior
  assert.deepEqual(S.cur().play.used, {}); assert.equal(S.cur().play.log.length, 0);
  assert.equal(S.history().length, 0);
});
test('edit no ensucia el historial de juego', () => {
  const S = createStore({ storage: mem(), key: 'k', db: seedDb() });
  S.edit((db, ch) => { ch.lema = 'otro'; });
  assert.equal(S.cur().play.log.length, 0); assert.equal(S.history().length, 0);
});
test('persistencia con retardo y flush inmediato', async () => {
  const st = mem(), S = createStore({ storage: st, key: 'k', db: seedDb() });
  S.act('x', (db, ch) => { ch.play.conc = 'Telaraña'; });
  assert.equal(st.m.has('k'), false);
  await S.flush();
  assert.equal(JSON.parse(st.m.get('k')).chars[0].play.conc, 'Telaraña');
});
test('fromStored: v2, v1 y datos corruptos', () => {
  const v2 = JSON.stringify(seedDb());
  assert.equal(fromStored(v2, null).migrated, false);
  const v1 = JSON.stringify({ meta: { nombre: 'Theo', sub: 'Mago adivino, nivel 6', cd: '16' }, levels: [{ level: 1, slots: 4, spells: [{ es: 'Escudo', en: 'Shield', prep: true }] }] });
  const r = fromStored(null, v1); assert.equal(r.migrated, true); assert.equal(r.db.chars[0].extraCD, 1);
  const vacio = fromStored('{roto', null).db;            // la app empieza sin personajes
  assert.equal(vacio.chars.length, 0); assert.equal(vacio.activeId, null);
  assert.equal(fromStored(null, null).db.chars.length, 0);
});

test('note anota una tirada sin crear punto de deshacer', () => {
  const S = createStore({ storage: mem(), key: 'k', db: seedDb() });
  S.note('Descarga de fuego: 7 de daño de fuego');
  assert.equal(S.cur().play.log.length, 1); assert.equal(S.history().length, 0);
});
