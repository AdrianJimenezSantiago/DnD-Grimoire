import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { crearArchivosWeb } from '../../web/src/platform/archivosWeb.js';

const lsFalso = (inicial = {}, cuota = Infinity) => {
  const m = new Map(Object.entries(inicial));
  return {
    m, get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, removeItem: k => { m.delete(k); },
    setItem: (k, v) => { if (String(v).length > cuota) throw new Error('QuotaExceededError'); m.set(k, String(v)); },
  };
};
const kvFalso = ({ abre = true, falla = false } = {}) => {
  const m = new Map();
  return { m, abrir: async () => { if (!abre) throw new Error('sin IndexedDB'); }, get: async k => m.get(k) ?? null,
    set: async (k, v) => { if (falla) throw new Error('QuotaExceededError'); m.set(k, v); }, remove: async k => { m.delete(k); } };
};

describe('archivos de la web: IndexedDB con paso desde localStorage', () => {
  test('lo que se guarda va a IndexedDB y no ocupa localStorage', async () => {
    const kv = kvFalso(), ls = lsFalso(), A = crearArchivosWeb({ kv, ls });
    await A.set('libro-x.json', '{"a":1}');
    assert.equal(kv.m.get('libro-x.json'), '{"a":1}'); assert.equal(ls.m.size, 0);
    assert.equal(await A.get('libro-x.json'), '{"a":1}');
    await A.remove('libro-x.json'); assert.equal(await A.get('libro-x.json'), null);
  });

  test('un libro guardado antes en localStorage se lee igual y se mueve a IndexedDB', async () => {
    const kv = kvFalso(), ls = lsFalso({ 'file:libros.json': '[1]', 'grimorio-v2': '{}' }), A = crearArchivosWeb({ kv, ls });
    assert.equal(await A.get('libros.json'), '[1]');
    assert.equal(kv.m.get('libros.json'), '[1]');
    assert.equal(ls.getItem('file:libros.json'), null, 'libera el espacio de localStorage');
    assert.equal(ls.getItem('grimorio-v2'), '{}', 'los personajes no se tocan');
  });

  test('migrar mueve de una vez todos los archivos viejos', async () => {
    const kv = kvFalso(), ls = lsFalso({ 'file:a.json': 'A', 'file:retrato-c1.txt': 'R', otra: 'x' }), A = crearArchivosWeb({ kv, ls });
    assert.equal(await A.migrar(), 2);
    assert.deepEqual([...ls.m.keys()], ['otra']);
    assert.equal(kv.m.size, 2);
  });

  test('si IndexedDB no acepta la copia, el archivo viejo se sigue leyendo y no se borra', async () => {
    const kv = kvFalso({ falla: true }), ls = lsFalso({ 'file:a.json': 'A' }), A = crearArchivosWeb({ kv, ls });
    assert.equal(await A.get('a.json'), 'A');
    assert.equal(ls.getItem('file:a.json'), 'A');
  });

  test('sin IndexedDB (navegador antiguo o bloqueado) usa localStorage como antes', async () => {
    const ls = lsFalso(), A = crearArchivosWeb({ kv: kvFalso({ abre: false }), ls });
    await A.set('a.json', 'A');
    assert.equal(ls.getItem('file:a.json'), 'A');
    assert.equal(await A.get('a.json'), 'A');
    assert.equal(await A.migrar(), 0);
    const sinKv = crearArchivosWeb({ kv: null, ls });
    assert.equal(await sinKv.get('a.json'), 'A');
  });

  test('un fallo al escribir llega a quien guarda, para poder avisar', async () => {
    await assert.rejects(crearArchivosWeb({ kv: kvFalso({ falla: true }), ls: lsFalso() }).set('a', 'b'));
    await assert.rejects(crearArchivosWeb({ kv: null, ls: lsFalso({}, 1) }).set('a', 'muy largo'));
  });
});
