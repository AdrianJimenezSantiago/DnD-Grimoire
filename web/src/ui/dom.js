/** Utilidades de vista: selección, parcheo por secciones y delegación de eventos. */
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/**
 * Sustituye el contenido de un contenedor solo si su HTML ha cambiado.
 * La hoja se pinta por secciones (cabecera, recursos, cada nivel…): tocar una vela
 * ya no reconstruye los 30 conjuros, solo la sección afectada.
 */
export function patch(el, html) {
  if (!el || el.__html === html) return false;
  el.innerHTML = html; el.__html = html;
  return true;
}
/** Reconcilia una lista de secciones con clave dentro de un contenedor. */
export function patchKeyed(root, items /* [{key, html, cls}] */) {
  const byKey = new Map([...root.children].map(n => [n.dataset.key, n]));
  let prev = null;
  items.forEach(({ key, html, cls }) => {
    let el = byKey.get(key);
    if (!el) { el = document.createElement('section'); el.dataset.key = key; }
    byKey.delete(key);
    if (cls && el.className !== cls) el.className = cls;
    patch(el, html);
    const next = prev ? prev.nextSibling : root.firstChild;
    if (el !== next) root.insertBefore(el, next);
    prev = el;
  });
  byKey.forEach(n => n.remove());
}
export function on(root, type, selector, fn) {
  root.addEventListener(type, ev => { const t = ev.target.closest?.(selector); if (t && root.contains(t)) fn(ev, t); });
}
