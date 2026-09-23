/**
 * Estado único de la app (patrón Store + Command).
 *
 * Toda mutación pasa por aquí:
 *   act(texto, fn)  acción de juego: se anota en el historial del personaje y se puede deshacer.
 *   edit(fn)        edición de datos: se puede deshacer, pero no se anota.
 *   touch()         cambio ya aplicado que no necesita repintar (texto mientras se escribe).
 * Cada cambio guarda con retardo y avisa a los suscriptores (la vista repinta lo que cambió).
 */
import { clone, uid } from './util.js';

const MAX_HIST = 60, MAX_LOG = 120;

export function createStore({ storage, key, db }) {
  const listeners = new Set();
  const hist = [];              // [{id, before}] instantáneas en memoria para deshacer
  let timer = null, dirty = false;

  const S = {
    db, editing: false,
    cur: () => S.db.chars.find(c => c.id === S.db.activeId) || null,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    emit(reason) { listeners.forEach(fn => fn(S, reason)); },

    save() { dirty = true; clearTimeout(timer); timer = setTimeout(S.flush, 200); },
    flush() { clearTimeout(timer); if (!dirty) return; dirty = false; return storage.set(key, JSON.stringify(S.db)); },

    act(text, fn) {
      const before = clone(S.db), ch = S.cur(), id = uid('h');
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
    /** Anota en el historial algo que no cambia la hoja (una tirada, por ejemplo). */
    note(text) { const ch = S.cur(); if (!ch) return; ch.play.log.push({ id: uid('n'), t: Date.now(), x: String(text) }); if (ch.play.log.length > MAX_LOG) ch.play.log.splice(0, ch.play.log.length - MAX_LOG); S.save(); },
    replace(db) { const before = clone(S.db); S.db = db; S.save(); S.emit('replace'); return { id: null, before }; },

    /** Vuelve al estado anterior a una acción (y descarta todo lo posterior). */
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
