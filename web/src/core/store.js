import { clone, uid } from './util.js';

const MAX_HIST = 60, MAX_LOG = 120;
// Serializar y guardar toda la base de datos se hace cuando el navegador está libre, no en mitad de una animación.
// Al pausar la app o cerrar la página se sigue guardando al instante con flush().
// Las acciones de juego (act) solo modifican al personaje activo y, como mucho, añaden conjuros al catálogo. Para poder
// deshacerlas basta con copiar ese personaje y el índice del catálogo; el resto de personajes se comparte con el estado
// actual en lugar de clonar toda la base de datos en cada toque. Las ediciones (edit) siguen copiándolo todo.
const instantanea = (db, ch) => (ch ? { ...db, chars: db.chars.map(c => (c === ch ? clone(c) : c)), catalog: { ...db.catalog } } : clone(db));
const enReposo = fn => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 1000 }) : fn());

export function createStore({ storage, key, db }) {
  const listeners = new Set();
  const hist = [];
  let timer = null, dirty = false;

  const S = {
    db, editing: false,
    cur: () => S.db.chars.find(c => c.id === S.db.activeId) || null,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    emit(reason) { listeners.forEach(fn => fn(S, reason)); },

    save() { dirty = true; clearTimeout(timer); timer = setTimeout(() => enReposo(S.flush), 200); },
    flush() { clearTimeout(timer); if (!dirty) return; dirty = false; return storage.set(key, JSON.stringify(S.db)); },

    act(text, fn) {
      const ch = S.cur(), before = instantanea(S.db, ch), id = uid('h');
      fn(S.db, ch);
      const target = ch && S.db.chars.find(c => c.id === ch.id);
      if (text && target) {
        target.play.log.push({ id, t: Date.now(), x: String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() });
        if (target.play.log.length > MAX_LOG) target.play.log.splice(0, target.play.log.length - MAX_LOG);
      }
      hist.push({ id, before }); if (hist.length > MAX_HIST) hist.shift();
      S.save(); S.emit('act');
      return { id, before };
    },
    edit(fn) {
      const before = clone(S.db);
      fn(S.db, S.cur());
      S.save(); S.emit('edit');
      return { id: null, before };
    },
    touch() { S.save(); },
    note(text) { const ch = S.cur(); if (!ch) return; ch.play.log.push({ id: uid('n'), t: Date.now(), x: String(text) }); if (ch.play.log.length > MAX_LOG) ch.play.log.splice(0, ch.play.log.length - MAX_LOG); S.save(); },
    replace(db) { const before = clone(S.db); S.db = db; S.save(); S.emit('replace'); return { id: null, before }; },

    undo(h) {
      const i = hist.findIndex(x => x.before === h.before);
      if (i >= 0) hist.length = i;
      S.db = h.before; S.save(); S.emit('undo');
    },
    history: () => hist,
    undoable: id => hist.some(h => h.id === id),
    entry: id => hist.find(h => h.id === id),
  };
  return S;
}
