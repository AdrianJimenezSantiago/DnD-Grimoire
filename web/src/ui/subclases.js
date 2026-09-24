/**
 * Selectores de clase y de subclase con tarjetas.
 * Clase: un <select> de siempre (oculto, lo que lee el formulario) con un botón y un panel de tarjetas.
 * Subclase: el campo de texto de siempre (se puede escribir cualquiera) con un panel de tarjetas
 * con el emblema y el color de cada subclase, el libro del que sale y su lema si el libro está importado.
 * El mismo dibujo de tarjetas sirve para el paso «Subclase» de la subida de nivel.
 */
import { esc, norm } from '../core/util.js';
import { SUBCLASES, TEMAS, CLASES_INFO } from '../domain/clases2024.js';
import { CLASES } from '../domain/reglas2024.js';
import { biblioteca, subclasesDe } from '../domain/catalogo.js';
import { gi } from './tema.js';
import { icon } from './icons.js';
import { abrirResumen } from './dialogs/biblioteca.js';

/** Datos para pintar una subclase: tono, saturación, icono, libro y lema. */
function datos(clase, nombre) {
  const [h, s, ico] = TEMAS.sub[nombre] || TEMAS.clase[clase] || [40, 50, 'subclase'];
  const def = (SUBCLASES[clase] || []).find(x => x.nombre === nombre);
  const imp = biblioteca().subclases.find(x => x.clase === clase && norm(x.nombre) === norm(nombre));
  return { h, s, ico, libro: def?.libro || imp?.fuente || 'Importada', lema: imp?.lema || '' };
}
/** Tarjetas de las subclases de una clase. attr: nombre del atributo que lleva el valor (data-scp-v o data-lvsub). */
export function tarjetasSubclase(clase, actual = '', attr = 'data-scp-v', filtro = '') {
  const q = norm(filtro.trim());
  const lista = subclasesDe(clase).filter(n => !q || norm(n).includes(q));
  if (!lista.length) return `<p class="scp-vacio">Ninguna coincide: se guardará tal cual la escribas.</p>`;
  return lista.map(n => {
    const d = datos(clase, n), on = norm(n) === norm(actual);
    // la tarjeta elige; «Ver» abre lo que aprende nivel a nivel sin elegirla
    return `<div class="scp-item" style="--sh:${d.h};--ss:${d.s}%"><button type="button" class="scp-card ${on ? 'on' : ''}" ${attr}="${esc(n)}" role="option" aria-selected="${on}">
      <span class="scp-emb">${gi(d.ico)}</span><span class="scp-t"><b>${esc(n)}</b>${d.lema ? `<i>${esc(d.lema)}</i>` : ''}<small>${esc(d.libro)}</small></span>${on ? '<span class="scp-ok" aria-hidden="true">✓</span>' : ''}</button>
      <button type="button" class="scp-info" data-scp-info="${esc(n)}" data-scp-clase-info="${esc(clase)}" aria-label="Ver qué aprende ${esc(n)}">Ver</button></div>`;
  }).join('');
}
/** Campo de subclase con su panel. attrs: atributos extra del input (id, data-mc…). */
export function campoSubclase(clase, valor, attrs) {
  const d = valor ? datos(clase, valor) : null, conocida = valor && subclasesDe(clase).some(n => norm(n) === norm(valor));
  return `<div class="scp" data-scp-clase="${esc(clase)}">
    <span class="scp-sello" ${conocida ? `style="--sh:${d.h};--ss:${d.s}%"` : ''} aria-hidden="true">${gi(conocida ? d.ico : 'subclase')}</span>
    <input ${attrs} value="${esc(valor || '')}" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list" placeholder="Elige o escribe una subclase">
    <button type="button" class="scp-abrir" tabindex="-1" aria-label="Ver subclases">${icon('chevron')}</button>
    <div class="scp-panel" role="listbox" hidden></div></div>`;
}

/* ---------------------------------- clase ---------------------------------- */
const AB = { fue: 'Fuerza', des: 'Destreza', con: 'Constitución', int: 'Inteligencia', sab: 'Sabiduría', car: 'Carisma' };
const TIPO = { full: 'Lanzador completo', half: 'Medio lanzador', pact: 'Magia de pacto' };
/** Una línea de la clase: dado de golpe, característica principal y cómo lanza conjuros. */
export function lineaClase(clase) {
  const info = CLASES_INFO[clase], c = CLASES[clase] || {};
  if (!info) return '';
  const magia = c.cast ? `${TIPO[c.cast.tipo]} (${AB[c.cast.ap]})` : c.subCast ? `Marcial · magia con ${c.subCast.nombre}` : 'Marcial';
  return `d${info.dg} · ${AB[info.prio[0]]} · ${magia}`;
}
const tema = clase => TEMAS.clase[clase] || [40, 50, 'libro'];
function contenidoBoton(clase, vacio) {
  if (!clase) return `<span class="scp-emb">${gi('libro')}</span><span class="ccp-t"><b>${esc(vacio || 'Elige una clase')}</b></span>`;
  return `<span class="scp-emb">${gi(tema(clase)[2])}</span><span class="ccp-t"><b>${esc(clase)}</b><small>${esc(lineaClase(clase))}</small></span>`;
}
/** Tarjetas de clase para el panel. opciones: nombres de clase (los del <select>). */
function tarjetasClase(opciones, actual) {
  return opciones.map(n => {
    const [h, s, ico] = tema(n), on = n === actual;
    return `<div class="scp-item" style="--sh:${h};--ss:${s}%"><button type="button" class="scp-card ${on ? 'on' : ''}" data-ccp-v="${esc(n)}" role="option" aria-selected="${on}">
      <span class="scp-emb">${gi(ico)}</span><span class="scp-t"><b>${esc(n)}</b><small>${esc(lineaClase(n))}</small></span>${on ? '<span class="scp-ok" aria-hidden="true">✓</span>' : ''}</button>
      <button type="button" class="scp-info" data-verclase="${esc(n)}" aria-label="Ver qué aprende ${esc(n)}">Ver</button></div>`;
  }).join('');
}
/**
 * Campo de clase: el <select> (attrs: id o data-mc…) queda oculto y es el que guarda el valor; el botón abre las tarjetas.
 * opciones: clases que se pueden elegir; vacio: texto de la opción vacía (si se permite no elegir).
 */
export function campoClase(attrs, valor, opciones, vacio = '') {
  const [h, s] = tema(valor);
  return `<div class="ccp" data-ccp-vacio="${esc(vacio)}">
    <select ${attrs} class="ccp-nativo" tabindex="-1" aria-hidden="true">${vacio ? `<option value="">${esc(vacio)}</option>` : ''}${opciones.map(k => `<option ${k === valor ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
    <button type="button" class="ccp-btn" aria-haspopup="listbox" aria-expanded="false" style="--sh:${h};--ss:${s}%">${contenidoBoton(valor, vacio)}${icon('chevron')}</button>
    <div class="scp-panel" role="listbox" hidden></div></div>`;
}

let listo = false;
/** Comportamiento de todos los campos de subclase (una sola vez, por delegación). */
export function initSubclases() {
  if (listo) return; listo = true;
  const abrir = (w, filtrar = false) => {
    const inp = w.querySelector('input'), p = w.querySelector('.scp-panel');
    p.innerHTML = tarjetasSubclase(w.dataset.scpClase, inp.value, 'data-scp-v', filtrar ? inp.value : '');
    p.hidden = false; inp.setAttribute('aria-expanded', 'true'); w.classList.add('abierto');
  };
  const cerrar = w => { const p = w?.querySelector('.scp-panel'); if (!p || p.hidden) return; p.hidden = true; w.querySelector('input').setAttribute('aria-expanded', 'false'); w.classList.remove('abierto'); };
  const elegir = (w, v) => {
    const inp = w.querySelector('input'); inp.value = v; cerrar(w);
    inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
    const d = datos(w.dataset.scpClase, v), s = w.querySelector('.scp-sello');
    s.style.setProperty('--sh', d.h); s.style.setProperty('--ss', d.s + '%'); s.innerHTML = gi(d.ico);
  };
  // clase: abrir/cerrar el panel del botón y elegir una tarjeta (cambia el <select> y avisa al formulario)
  const abrirC = w => { const sel = w.querySelector('select'), p = w.querySelector('.scp-panel');
    p.innerHTML = tarjetasClase([...sel.options].map(o => o.value).filter(Boolean), sel.value); p.hidden = false; w.classList.add('abierto'); w.querySelector('.ccp-btn').setAttribute('aria-expanded', 'true'); };
  const cerrarC = w => { const p = w?.querySelector('.scp-panel'); if (!p || p.hidden) return; p.hidden = true; p.innerHTML = ''; w.classList.remove('abierto'); w.querySelector('.ccp-btn').setAttribute('aria-expanded', 'false'); };
  const elegirC = (w, v) => { const sel = w.querySelector('select'), b = w.querySelector('.ccp-btn'); sel.value = v; cerrarC(w);
    const [h, s2] = tema(v); b.style.setProperty('--sh', h); b.style.setProperty('--ss', s2 + '%'); b.innerHTML = contenidoBoton(v, w.dataset.ccpVacio) + icon('chevron');
    sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); b.focus(); };
  document.addEventListener('click', e => {
    const card = e.target.closest?.('[data-ccp-v]'); if (card) { e.preventDefault(); return elegirC(card.closest('.ccp'), card.dataset.ccpV); }
    const b = e.target.closest?.('.ccp-btn'); if (b) { const w = b.closest('.ccp'); document.querySelectorAll('.ccp.abierto').forEach(x => x !== w && cerrarC(x)); return w.classList.contains('abierto') ? cerrarC(w) : abrirC(w); }
    document.querySelectorAll('.ccp.abierto').forEach(w => { if (!w.contains(e.target)) cerrarC(w); });
  });
  document.addEventListener('keydown', e => {
    const w = e.target.closest?.('.ccp'); if (!w) return;
    const cards = [...w.querySelectorAll('[data-ccp-v]')], i = cards.indexOf(document.activeElement);
    if (e.key === 'Escape' && w.classList.contains('abierto')) { e.preventDefault(); e.stopPropagation(); cerrarC(w); w.querySelector('.ccp-btn').focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!w.classList.contains('abierto')) abrirC(w); (w.querySelectorAll('[data-ccp-v]')[i + 1] || w.querySelector('[data-ccp-v].on') || w.querySelector('[data-ccp-v]'))?.focus(); }
    if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); (cards[i - 1] || w.querySelector('.ccp-btn')).focus(); }
  }, true);
  document.addEventListener('focusin', e => { const w = e.target.closest?.('.scp'); if (w && e.target.tagName === 'INPUT') abrir(w); });
  document.addEventListener('input', e => { const w = e.target.closest?.('.scp'); if (w && e.target.tagName === 'INPUT' && e.isTrusted) abrir(w, true); });
  document.addEventListener('click', e => {
    // resumen de una subclase (desde su tarjeta) o de una clase (botones «Ver qué aprende»)
    const info = e.target.closest?.('[data-scp-info]'); if (info) { e.preventDefault(); return abrirResumen(info.dataset.scpClaseInfo, info.dataset.scpInfo); }
    const vc = e.target.closest?.('[data-verclase]'); if (vc) { e.preventDefault(); const c = vc.dataset.verclase.startsWith('#') ? document.querySelector(vc.dataset.verclase)?.value : vc.dataset.verclase; return c && abrirResumen(c); }
    const card = e.target.closest?.('[data-scp-v]'); if (card) { e.preventDefault(); return elegir(card.closest('.scp'), card.dataset.scpV); }
    const b = e.target.closest?.('.scp-abrir'); if (b) { const w = b.closest('.scp'); return w.classList.contains('abierto') ? cerrar(w) : (abrir(w), w.querySelector('input').focus()); }
    document.querySelectorAll('.scp.abierto').forEach(w => { if (!w.contains(e.target)) cerrar(w); });
  });
  document.addEventListener('keydown', e => {
    const w = e.target.closest?.('.scp'); if (!w) return;
    const cards = [...w.querySelectorAll('[data-scp-v]')], i = cards.indexOf(document.activeElement);
    if (e.key === 'Escape' && w.classList.contains('abierto')) { e.preventDefault(); e.stopPropagation(); cerrar(w); w.querySelector('input').focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!w.classList.contains('abierto')) abrir(w); (w.querySelectorAll('[data-scp-v]')[i + 1] || w.querySelector('[data-scp-v]'))?.focus(); }
    if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); (cards[i - 1] || w.querySelector('input')).focus(); }
    if (e.key === 'Tab' && i < 0) cerrar(w);
  }, true);
}
