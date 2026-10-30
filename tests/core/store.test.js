import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { crearEstado } from '../../web/src/core/store.js';
import { bdDeEjemplo, cargarGuardado } from '../../web/src/domain/personaje/modelo.js';

const mem = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); }, m }; };

describe('crearEstado: acciones, ediciones y deshacer', () => {
  test('act anota en el historial del personaje y se puede deshacer', () => {
    const st = mem(), S = crearEstado({ almacen: st, clave: 'k', db: bdDeEjemplo() });
    let renders = 0; S.subscribe(() => renders++);
    const h1 = S.act('Escudo: espacio de nivel 1 gastado', (db, ch) => { ch.play.used[1] = 1; });
    S.act('Contraconjuro', (db, ch) => { ch.play.used[3] = 1; });
    assert.equal(S.cur().play.log.length, 2); assert.equal(renders, 2);
    assert.ok(S.undoable(h1.id));
    S.undo(h1);
    assert.deepEqual(S.cur().play.used, {}); assert.equal(S.cur().play.log.length, 0);
    assert.equal(S.history().length, 0);
  });

  test('edit no ensucia el historial de juego', () => {
    const S = crearEstado({ almacen: mem(), clave: 'k', db: bdDeEjemplo() });
    S.edit((db, ch) => { ch.lema = 'otro'; });
    assert.equal(S.cur().play.log.length, 0); assert.equal(S.history().length, 0);
  });

  test('note anota una tirada sin crear punto de deshacer', () => {
    const S = crearEstado({ almacen: mem(), clave: 'k', db: bdDeEjemplo() });
    S.note('Descarga de fuego: 7 de daño de fuego');
    assert.equal(S.cur().play.log.length, 1); assert.equal(S.history().length, 0);
  });

  test('act solo copia al personaje activo para deshacer y no toca a los demás', () => {
    const db = bdDeEjemplo(), otro = { ...structuredClone(db.chars[0]), id: 'otro', nombre: 'Otro' };
    db.chars.push(otro);
    const S = crearEstado({ almacen: mem(), clave: 'k', db });
    const h = S.act('Escudo', (d, ch) => { ch.play.used[1] = 1; d.catalog.nuevo = { es: 'Nuevo', level: 1 }; });
    assert.equal(h.before.chars.find(c => c.id === 'otro'), otro, 'el resto de personajes se comparte');
    assert.notEqual(h.before.chars[0], S.cur(), 'el activo se copia');
    S.undo(h);
    assert.deepEqual(S.cur().play.used, {});
    assert.equal(S.db.catalog.nuevo, undefined);
    assert.equal(S.db.chars.find(c => c.id === 'otro'), otro);
  });
});

describe('crearEstado: guardado', () => {
  test('persistencia con retardo y flush inmediato', async () => {
    const st = mem(), S = crearEstado({ almacen: st, clave: 'k', db: bdDeEjemplo() });
    S.act('x', (db, ch) => { ch.play.conc = 'Telaraña'; });
    assert.equal(st.m.has('k'), false);
    await S.flush();
    assert.equal(JSON.parse(st.m.get('k')).chars[0].play.conc, 'Telaraña');
  });
});

describe('cargarGuardado: carga de datos guardados', () => {
  test('v2, v1 y datos corruptos', () => {
    const v2 = JSON.stringify(bdDeEjemplo());
    assert.equal(cargarGuardado(v2, null).migrated, false);
    const v1 = JSON.stringify({ meta: { nombre: 'Theo', sub: 'Mago adivino, nivel 6', cd: '16' }, levels: [{ level: 1, slots: 4, spells: [{ es: 'Escudo', en: 'Shield', prep: true }] }] });
    const r = cargarGuardado(null, v1); assert.equal(r.migrated, true); assert.equal(r.db.chars[0].extraCD, 1);
    const vacio = cargarGuardado('{roto', null).db;
    assert.equal(vacio.chars.length, 0); assert.equal(vacio.activeId, null);
    assert.equal(cargarGuardado(null, null).db.chars.length, 0);
  });
});

describe('crearEstado: fallos al guardar', () => {
  const lleno = () => { let falla = true; return { arreglar: () => { falla = false; }, guardado: null, async guardar(k, v) { if (falla) throw new Error('QuotaExceededError'); this.guardado = v; }, set: async () => {} }; };

  test('si el guardado falla avisa una vez, reintenta en el siguiente cambio y avisa al recuperarse', async () => {
    const st = lleno(), avisos = [];
    const S = crearEstado({ almacen: st, clave: 'k', db: bdDeEjemplo(), alFallar: (e, x) => avisos.push(x.primero ? 'primero' : 'otra vez'), alRecuperar: () => avisos.push('recuperado') });
    S.edit((db, ch) => { ch.lema = 'uno'; }); await S.flush();
    assert.deepEqual(avisos, ['primero']); assert.ok(S.guardadoFallando());
    await S.flush();
    assert.deepEqual(avisos, ['primero', 'otra vez'], 'sigue pendiente aunque no haya cambios nuevos');
    st.arreglar(); S.edit((db, ch) => { ch.lema = 'dos'; }); await S.flush();
    assert.deepEqual(avisos, ['primero', 'otra vez', 'recuperado']);
    assert.equal(JSON.parse(st.guardado).chars[0].lema, 'dos'); assert.ok(!S.guardadoFallando());
  });

  test('con un almacén que solo tiene set (como antes) sigue funcionando', async () => {
    const st = mem(), S = crearEstado({ almacen: st, clave: 'k', db: bdDeEjemplo() });
    S.edit((db, ch) => { ch.lema = 'x'; }); await S.flush();
    assert.equal(JSON.parse(st.m.get('k')).chars[0].lema, 'x');
  });
});

describe('crearEstado: deshacer tras cerrar la app', () => {
  test('las últimas acciones se guardan por personaje y se pueden deshacer en otra sesión', () => {
    const S1 = crearEstado({ almacen: mem(), clave: 'k', db: bdDeEjemplo() });
    S1.act('Uno', (db, ch) => { ch.play.used[1] = 1; });
    const h2 = S1.act('Dos', (db, ch) => { ch.play.used[2] = 1; });
    const guardado = JSON.parse(JSON.stringify(S1.historialGuardable()));
    assert.equal(guardado.length, 2);

    const S2 = crearEstado({ almacen: mem(), clave: 'k', db: JSON.parse(JSON.stringify(S1.db)) });
    assert.equal(S2.recuperarHistorial(guardado), 2);
    assert.ok(S2.undoable(h2.id));
    S2.undo(S2.history()[1]);
    assert.deepEqual(S2.cur().play.used, { 1: 1 });
    assert.equal(S2.history().length, 1);
    S2.undo(S2.history()[0]);
    assert.deepEqual(S2.cur().play.used, {});
  });

  test('deshacer una acción guardada solo toca a su personaje', () => {
    const db = bdDeEjemplo(); db.chars.push({ ...structuredClone(db.chars[0]), id: 'otro', nombre: 'Otro' });
    const S1 = crearEstado({ almacen: mem(), clave: 'k', db });
    S1.act('Uno', (d, ch) => { ch.play.used[1] = 1; });
    const lista = JSON.parse(JSON.stringify(S1.historialGuardable()));
    const S2 = crearEstado({ almacen: mem(), clave: 'k', db: JSON.parse(JSON.stringify(S1.db)) });
    S2.edit(d => { d.chars[1].lema = 'cambiado después'; });
    S2.recuperarHistorial(lista); S2.undo(S2.history()[0]);
    assert.equal(S2.db.chars[1].lema, 'cambiado después');
    assert.deepEqual(S2.cur().play.used, {});
  });

  test('lo guardado se lee con desconfianza: personajes que ya no están o entradas sin anotar fuera', () => {
    const S = crearEstado({ almacen: mem(), clave: 'k', db: bdDeEjemplo() }), ch = S.cur();
    assert.equal(S.recuperarHistorial([{ id: 'x', chId: 'nadie', ch: {} }, { id: 'sin-log', chId: ch.id, ch: { id: ch.id } }, null, 'basura']), 0);
    assert.equal(S.recuperarHistorial('no es lista'), 0);
    assert.equal(S.history().length, 0);
  });
});
