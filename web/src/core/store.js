// Estado de la app: la base de datos de personajes, suscripción a cambios, guardado diferido y deshacer.
// act() para acciones de juego (van al historial del personaje), edit() para ediciones, replace() para restaurar copias.
// Si el guardado falla (almacenamiento lleno o bloqueado) se avisa con alFallar y se reintenta en el siguiente cambio.
// Las últimas acciones se pueden guardar aparte (historialGuardable) para deshacerlas también tras cerrar la app.
import { clone, uid } from './util.js';

const MAX_HIST = 60, MAX_LOG = 120, MAX_GUARDABLE = 10;
const instantanea = (db, ch) => (ch ? { ...db, chars: db.chars.map(c => (c === ch ? clone(c) : c)), catalog: { ...db.catalog } } : clone(db));
const enReposo = fn => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 1000 }) : fn());

export function crearEstado({ almacen, clave, db, alFallar = null, alRecuperar = null }) {
  const listeners = new Set();
  const hist = [];
  const escribir = almacen.guardar || almacen.set;
  let timer = null, dirty = false, fallando = false;

  const S = {
    db, editing: false,
    cur: () => S.db.chars.find(c => c.id === S.db.activeId) || null,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    emit(reason) { listeners.forEach(fn => fn(S, reason)); },

    save() { dirty = true; clearTimeout(timer); timer = setTimeout(() => enReposo(S.flush), 200); },
    flush() {
      clearTimeout(timer); if (!dirty) return; dirty = false;
      let p;
      try { p = Promise.resolve(escribir.call(almacen, clave, JSON.stringify(S.db))); } catch (e) { p = Promise.reject(e); }
      return p.then(() => { if (fallando) { fallando = false; alRecuperar?.(); } },
        e => { dirty = true; const primero = !fallando; fallando = true; alFallar?.(e, { primero }); });
    },
    guardadoFallando: () => fallando,

    act(text, fn) {
      const ch = S.cur(), before = instantanea(S.db, ch), id = uid('h');
      fn(S.db, ch);
      const target = ch && S.db.chars.find(c => c.id === ch.id);
      if (text && target) {
        target.play.log.push({ id, t: Date.now(), x: String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() });
        if (target.play.log.length > MAX_LOG) target.play.log.splice(0, target.play.log.length - MAX_LOG);
      }
      hist.push({ id, before, chId: ch?.id ?? null }); if (hist.length > MAX_HIST) hist.shift();
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
      const i = hist.findIndex(x => (h.id && x.id === h.id) || (h.before && x.before === h.before));
      const e = i >= 0 ? hist[i] : h;
      if (i >= 0) hist.length = i;
      S.db = e.ch ? { ...S.db, chars: S.db.chars.map(c => (c.id === e.chId ? e.ch : c)) } : e.before;
      S.save(); S.emit('undo');
    },
    historialGuardable(n = MAX_GUARDABLE) {
      return hist.slice(-n).map(x => ({ id: x.id, chId: x.chId, ch: x.ch || x.before?.chars?.find(c => c.id === x.chId) })).filter(x => x.chId && x.ch);
    },
    recuperarHistorial(lista) {
      const ids = new Set(S.db.chars.map(c => c.id)), log = new Set(S.db.chars.flatMap(c => c.play?.log?.map(l => l.id) || []));
      const validas = (Array.isArray(lista) ? lista : []).filter(x => x && typeof x.id === 'string' && ids.has(x.chId) && log.has(x.id) && x.ch && typeof x.ch === 'object' && x.ch.id === x.chId);
      hist.unshift(...validas.slice(-MAX_GUARDABLE).map(x => ({ id: x.id, chId: x.chId, ch: x.ch })));
      return validas.length;
    },
    history: () => hist,
    undoable: id => hist.some(h => h.id === id),
    entry: id => hist.find(h => h.id === id),
  };
  return S;
}
