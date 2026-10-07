// Ayudas del DOM: selectores, delegación de eventos y repintado que solo toca lo que cambia (patch, patchKeyed, morph).
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export function patch(el, html) {
  if (!el || el.__html === html) return false;
  el.innerHTML = html; el.__html = html;
  return true;
}
// Como patch, pero sin rehacer el contenido: compara el HTML nuevo con el DOM que ya hay y solo cambia los
// atributos, textos y nodos que difieren. Lo que sigue igual se conserva, así que no repite su animación de entrada,
// no pierde el hover ni el foco y una transición (un selector que se desliza) va del valor viejo al nuevo.
// Los nodos se emparejan por posición, o por data-key / id cuando los tienen.
export function morph(el, html) {
  if (!el || el.__html === html) return false;
  const t = document.createElement('template'); t.innerHTML = html;
  morfarHijos(el, t.content); el.__html = html;
  return true;
}
// Lo que pone una animación por su cuenta (la onda de un toque, un sello) no está en el HTML: se deja en paz
const efimero = n => n.nodeType === 1 && (n.classList.contains('onda') || n.classList.contains('sello-fx'));
const claveDe = n => n.nodeType === 1 ? (n.dataset?.key ?? (n.id || null)) : null;
// Un control solo se reutiliza si hace lo mismo (mismos data-*): si no, un clic que repinta a mitad del evento
// convertiría el botón pulsado en otro y el resto de manejadores del clic verían la acción equivocada.
const firma = n => [...n.attributes].filter(x => x.name.startsWith('data-')).map(x => `${x.name}=${x.value}`).join('&');
const CONTROL = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL)$/;
const compatibles = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && claveDe(a) === claveDe(b) && (!CONTROL.test(a.tagName) || firma(a) === firma(b))));
function morfarHijos(viejo, nuevo) {
  const porClave = new Map();
  for (const n of viejo.childNodes) { const k = claveDe(n); if (k != null) porClave.set(k, n); }
  let cur = viejo.firstChild;
  const saltar = () => { while (cur && efimero(cur)) cur = cur.nextSibling; };
  for (const n of [...nuevo.childNodes]) {
    saltar();
    const k = claveDe(n);
    let par = k != null ? porClave.get(k) : (cur && claveDe(cur) == null && compatibles(cur, n) ? cur : null);
    if (par && !compatibles(par, n)) par = null;
    if (par) { porClave.delete(k); if (par === cur) cur = cur.nextSibling; else viejo.insertBefore(par, cur); morfarNodo(par, n); }
    else viejo.insertBefore(n, cur);
  }
  while (cur) { const sig = cur.nextSibling; if (!efimero(cur)) cur.remove(); cur = sig; }
}
function morfarNodo(a, b) {
  if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  for (const at of [...a.attributes]) if (!b.hasAttribute(at.name)) {
    // Las clases fx-… las pone una animación en marcha: se conservan hasta que ella misma las quite
    if (at.name === 'class') { const fx = [...a.classList].filter(c => c.startsWith('fx-')); fx.length ? a.setAttribute('class', fx.join(' ')) : a.removeAttribute('class'); }
    else if (!(at.name === 'open' && a.tagName === 'DETAILS')) a.removeAttribute(at.name);
  }
  for (const at of b.attributes) {
    let v = at.value;
    if (at.name === 'class') { const fx = [...a.classList].filter(c => c.startsWith('fx-') && !b.classList.contains(c)); if (fx.length) v = `${v} ${fx.join(' ')}`; }
    if (a.getAttribute(at.name) !== v) a.setAttribute(at.name, v);
  }
  // Los campos guardan lo escrito en propiedades: se ponen al día salvo el que tiene el foco (se está escribiendo en él)
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && document.activeElement !== a) {
    if (a.type === 'checkbox' || a.type === 'radio') a.checked = b.hasAttribute('checked');
    else if (a.tagName === 'TEXTAREA') { if (a.value !== b.value) a.value = b.value; return; }
    else if (a.tagName === 'INPUT' && a.value !== (b.getAttribute('value') ?? '')) a.value = b.getAttribute('value') ?? '';
  }
  if (a.tagName === 'SELECT') { morfarHijos(a, b); if (document.activeElement !== a) a.value = b.value; return; }
  morfarHijos(a, b);
}
export function patchKeyed(root, items) {
  const byKey = new Map([...root.children].map(n => [n.dataset.key, n]));
  let prev = null;
  items.forEach(({ key, html, cls }) => {
    let el = byKey.get(key);
    if (!el) { el = document.createElement('section'); el.dataset.key = key; }
    byKey.delete(key);
    if (cls && el.className !== cls) el.className = cls;
    morph(el, html);
    const next = prev ? prev.nextSibling : root.firstChild;
    if (el !== next) root.insertBefore(el, next);
    prev = el;
  });
  byKey.forEach(n => n.remove());
}
export function on(root, type, selector, fn) {
  root.addEventListener(type, ev => { const t = ev.target.closest?.(selector); if (t && root.contains(t)) fn(ev, t); });
}
