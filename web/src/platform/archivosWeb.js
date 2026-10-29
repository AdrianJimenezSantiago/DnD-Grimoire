// Archivos grandes en la web y en Windows (libros importados, retratos originales, copias automáticas): IndexedDB,
// con paso automático desde localStorage, donde vivían antes, y localStorage de reserva si IndexedDB no se puede abrir.
const PREFIJO = 'file:';

export function idbKv({ nombre = 'grimorio', tabla = 'archivos', idb = globalThis.indexedDB } = {}) {
  if (!idb) return null;
  let bd = null;
  const abrir = () => (bd ||= new Promise((ok, mal) => {
    let r;
    try { r = idb.open(nombre, 1); } catch (e) { mal(e); return; }
    r.onupgradeneeded = () => r.result.createObjectStore(tabla);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
    r.onblocked = () => mal(new Error('IndexedDB bloqueada'));
  }));
  const op = (modo, fn) => abrir().then(db => new Promise((ok, mal) => {
    const t = db.transaction(tabla, modo), r = fn(t.objectStore(tabla));
    t.oncomplete = () => ok(r.result);
    t.onerror = () => mal(t.error);
    t.onabort = () => mal(t.error || new Error('Escritura cancelada'));
  }));
  return {
    abrir,
    get: k => op('readonly', s => s.get(k)).then(v => v ?? null),
    set: (k, v) => op('readwrite', s => s.put(v, k)).then(() => {}),
    remove: k => op('readwrite', s => s.delete(k)).then(() => {}),
  };
}

export function crearArchivosWeb({ kv, ls }) {
  let disponible = null;
  const hayKv = () => (disponible ||= kv ? kv.abrir().then(() => true, () => false) : Promise.resolve(false));
  const lsGet = k => { try { return ls?.getItem(PREFIJO + k) ?? null; } catch { return null; } };
  const lsQuitar = k => { try { ls?.removeItem(PREFIJO + k); } catch {} };
  const lsClaves = () => {
    const ks = [];
    try { for (let i = 0; i < (ls?.length || 0); i++) { const k = ls.key(i); if (k?.startsWith(PREFIJO)) ks.push(k.slice(PREFIJO.length)); } } catch {}
    return ks;
  };
  const A = {
    async get(k) {
      if (!(await hayKv())) return lsGet(k);
      const v = await kv.get(k);
      if (v != null) return v;
      const viejo = lsGet(k);
      if (viejo == null) return null;
      try { await kv.set(k, viejo); lsQuitar(k); } catch {}
      return viejo;
    },
    async set(k, v) {
      if (!(await hayKv())) { ls.setItem(PREFIJO + k, v); return; }
      await kv.set(k, v); lsQuitar(k);
    },
    async remove(k) {
      lsQuitar(k);
      if (await hayKv()) await kv.remove(k);
    },
    async migrar() {
      if (!(await hayKv())) return 0;
      let n = 0;
      for (const k of lsClaves()) { await A.get(k); if (lsGet(k) == null) n++; }
      return n;
    },
  };
  return A;
}
