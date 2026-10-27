// Teclado en pantalla: mide lo que tapa con visualViewport, lo publica en CSS y lleva el campo enfocado a la zona visible.
import { tapaTeclado, tecladoAbierto, desplazamiento, repartir } from '../../domain/presentacion/teclado.js';
import { movimientoReducido } from '../animaciones/fx.js';

const NO_TECLEA = /^(checkbox|radio|range|button|submit|reset|file|color|image|hidden|date|time|datetime-local|month|week)$/;
export const esCampo = el => !!el && !el.disabled && !el.readOnly
  && (el.isContentEditable || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !NO_TECLEA.test(el.type)));
const AMBITO = 'dialog[open], .landing';
const CAJA = '.f, label, .stepper';
const NUMERICO = el => el.type === 'number' || /^(numeric|decimal|tel)$/.test(el.inputMode);

const raiz = document.documentElement, vv = window.visualViewport;
const altoBase = new Map();
const pistasPropias = new WeakSet();
let abierto = false, publicado = '', campo = null, cuadro = 0, espera = 0;

function medir() {
  cuadro = 0;
  const ancho = raiz.clientWidth, alto = raiz.clientHeight;
  if (!(altoBase.get(ancho) >= alto)) altoBase.set(ancho, alto);
  const vvTop = vv ? Math.max(0, Math.round(vv.offsetTop)) : 0;
  const tapa = vv ? tapaTeclado({ alto, vvAlto: vv.height, vvTop, escala: vv.scale }) : 0;
  const ahora = tecladoAbierto({ foco: esCampo(document.activeElement), tapa, alto, altoBase: altoBase.get(ancho) });
  const clave = ahora && tapa ? `${vvTop}|${tapa}|${Math.round(vv.height)}` : '';
  if (clave !== publicado) {
    publicado = clave;
    if (clave) {
      raiz.style.setProperty('--vv-top', `${vvTop}px`);
      raiz.style.setProperty('--teclado', `${tapa}px`);
      raiz.style.setProperty('--alto-util', `${Math.round(vv.height)}px`);
    } else for (const v of ['--vv-top', '--teclado', '--alto-util']) raiz.style.removeProperty(v);
  }
  if (ahora !== abierto) { abierto = ahora; raiz.classList.toggle('teclado', ahora); }
}
const pedirMedida = () => { if (!cuadro) cuadro = requestAnimationFrame(medir); };

function zonaDe(el) {
  let arriba = vv ? vv.offsetTop : 0, abajo = arriba + (vv ? vv.height : raiz.clientHeight);
  const scroll = [];
  let fijo = false;
  for (let p = el.parentElement; p && p !== document.body && p !== raiz; p = p.parentElement) {
    const cs = getComputedStyle(p), desplaza = /(auto|scroll)/.test(cs.overflowY);
    fijo = cs.position === 'fixed';
    if (desplaza || fijo) { const r = p.getBoundingClientRect(); arriba = Math.max(arriba, r.top); abajo = Math.min(abajo, r.bottom); }
    if (desplaza && p.scrollHeight > p.clientHeight + 1) scroll.push(p);
    if (fijo) break;
  }
  if (!fijo) {
    const barra = document.getElementById('appbar'), dock = document.querySelector('.dock');
    if (barra?.getClientRects().length) arriba = Math.max(arriba, barra.getBoundingClientRect().bottom);
    if (dock?.getClientRects().length && getComputedStyle(dock).visibility !== 'hidden') abajo = Math.min(abajo, dock.getBoundingClientRect().top);
    scroll.push(document.scrollingElement || raiz);
  }
  return { arriba, abajo, scroll };
}

function asegurar() {
  espera = 0;
  const el = campo;
  if (!el || el !== document.activeElement || !el.isConnected) return;
  const zona = zonaDe(el);
  if (zona.abajo - zona.arriba < 40) return;
  const c = el.closest(CAJA), rc = c?.getBoundingClientRect();
  const r = rc && rc.height <= (zona.abajo - zona.arriba) * 0.5 ? rc : el.getBoundingClientRect();
  const d = desplazamiento({ arriba: r.top, abajo: r.bottom }, zona);
  if (!d) return;
  const pasos = repartir(d, zona.scroll.map(s => ({ pos: s.scrollTop, max: s.scrollHeight - s.clientHeight })));
  const behavior = movimientoReducido() ? 'auto' : 'smooth';
  zona.scroll.forEach((s, i) => { if (pasos[i]) s.scrollBy({ top: pasos[i], behavior }); });
}
function esperar(ms) { clearTimeout(espera); espera = setTimeout(asegurar, ms); }

function camposDe(el) {
  const ambito = el.closest(AMBITO);
  if (!ambito) return [];
  return [...ambito.querySelectorAll('input, textarea, [contenteditable="true"]')]
    .filter(c => esCampo(c) && c.type !== 'search' && c.getClientRects().length && !c.closest('[hidden], [inert]'));
}
const siguienteDe = el => { const lista = camposDe(el), i = lista.indexOf(el); return i >= 0 ? lista[i + 1] || null : null; };

function rotularIntro(el) {
  if (el.tagName !== 'INPUT' || el.type === 'search' || (el.hasAttribute('enterkeyhint') && !pistasPropias.has(el))) return;
  if (!el.closest(AMBITO)) return;
  el.enterKeyHint = el.closest('[data-intro]')?.dataset.intro || (siguienteDe(el) ? 'next' : 'done');
  pistasPropias.add(el);
}

function alIntro(e) {
  if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || !abierto) return;
  const el = e.target;
  if (el.tagName !== 'INPUT' || !esCampo(el) || !el.closest(AMBITO)) return;
  e.preventDefault();
  const sig = el.enterKeyHint === 'next' && siguienteDe(el);
  if (!sig) { el.blur(); return; }
  sig.focus({ preventScroll: true });
  if (sig.tagName === 'INPUT' && NUMERICO(sig)) sig.select?.();
}

export function initTeclado() {
  document.addEventListener('focusin', e => {
    const el = e.target;
    if (!esCampo(el)) return;
    campo = el; rotularIntro(el); pedirMedida();
    esperar(abierto ? 40 : 350);
  });
  document.addEventListener('focusout', () => { campo = null; pedirMedida(); });
  const alCambiar = () => { pedirMedida(); if (campo) esperar(90); };
  document.addEventListener('transitionend', e => { if (campo && e.target.tagName === 'DIALOG' && e.target.contains(campo)) esperar(0); });
  vv?.addEventListener('resize', alCambiar);
  vv?.addEventListener('scroll', pedirMedida, { passive: true });
  addEventListener('resize', alCambiar);
  addEventListener('keydown', alIntro);
  pedirMedida();
}
