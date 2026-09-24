/**
 * Selector de subclase: el campo de texto de siempre (se puede escribir cualquiera) con un panel de tarjetas
 * con el emblema y el color de cada subclase, el libro del que sale y su lema si el libro está importado.
 * El mismo dibujo de tarjetas sirve para el paso «Subclase» de la subida de nivel.
 */
import { esc, norm } from '../core/util.js';
import { SUBCLASES, TEMAS } from '../domain/clases2024.js';
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
