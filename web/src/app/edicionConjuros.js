// Edición del libro de conjuros en la hoja (modo edición): textos en línea, dados de los recursos, escuela,
// componentes, nivel y «siempre preparado». Los cambios del catálogo afectan a todos los personajes que tienen el conjuro.
import { esc } from '../core/util.js';
import { rechazar, avisarCampo } from '../ui/componentes/validacion.js';
import { burla } from '../domain/validacion.js';
import { ESCUELAS } from '../domain/reglas/reglas2024.js';
import { campo } from '../domain/conjuros/validar.js';
import { claveEscuela } from '../domain/conjuros/espacios.js';
import { CAMPOS_LIBRO } from '../domain/personaje/modelo.js';
import { invalidarItems } from '../domain/conjuros/catalogo.js';
import { $, on } from '../ui/componentes/dom.js';
import { toast, botonDeshacer } from '../ui/componentes/toast.js';
import { vibrar } from '../platform/native.js';
import * as A from './acciones.js';
import { abrirMenu, cerrarMenu } from '../ui/componentes/menu.js';

export function enlazarEdicion(S, sheet) {
  sheet.addEventListener('input', e => {
    const t = e.target, ch = S.cur(); if (!ch) return;
    if (t.dataset.dv !== undefined) {
      const [id, i, sides] = t.dataset.dv.split('|'), max = +sides;
      const v = t.value.replace(/\D/g, '').slice(0, String(max).length), n = parseInt(v, 10);
      // Lo que no cabe en el dado se corrige y se avisa: letras fuera, y del 1 a sus caras
      const motivo = /\D/.test(t.value) ? 'letras' : v && n < 1 ? 'cero' : v && n > max ? 'alto' : '';
      t.value = v && (n < 1 || n > max) ? String(Math.min(max, Math.max(1, n))) : v;
      if (motivo) rechazar(t, motivo, { min: 1, max, campo: `d${max}` });
      t.closest('.pdie')?.classList.remove('fresh');
      return A.fijarDado(S, id, +i, t.value);
    }
    if (t.dataset.k) {
      const lim = ['es', 'en'].includes(t.dataset.k) ? 80 : 120;
      if (t.textContent.length > lim) { t.textContent = t.textContent.slice(0, lim); rechazar(t, 'largo', { max: lim }); }
      const e2 = ch.book[+t.dataset.bi], val = t.textContent.trim();
      if (CAMPOS_LIBRO.includes(t.dataset.k)) e2[t.dataset.k] = val; else { S.db.catalog[e2.sid][t.dataset.k] = val; invalidarItems(); }
      S.touch();
    }
  });
  let previo = null;
  sheet.addEventListener('focusin', e => { const k = e.target.dataset?.k; if (!k) return; const e2 = S.cur()?.book[+e.target.dataset.bi]; if (!e2) return;
    previo = CAMPOS_LIBRO.includes(k) ? e2[k] : S.db.catalog[e2.sid][k]; });
  sheet.addEventListener('focusout', e => {
    const t = e.target, k = t.dataset?.k; if (!k || t.dataset.bi == null) return;
    const ch = S.cur(), e2 = ch?.book[+t.dataset.bi]; if (!e2) return;
    const { valor, aviso } = campo(k, t.textContent), rel = CAMPOS_LIBRO.includes(k);
    const final = valor == null ? (previo ?? '') : valor;
    if (rel) { e2[k] = final; if (k === 'gratis' && !final) e2.used = false; } else { S.db.catalog[e2.sid][k] = final; invalidarItems(); }
    if (t.textContent !== final) t.textContent = final;
    S.touch(); S.emit('edit'); previo = null;
    if (aviso) avisarCampo(t, `${k === 'es' ? burla('vacio', { campo: 'Nombre' }) : k === 'escuela' ? 'Esa escuela no la enseñan en ninguna academia.' : k === 'comp' ? 'Un conjuro sin componentes es un truco de feria.' : 'Corregido.'} ${aviso}`);
  });
  let escuelaBi = null;
  on(sheet, 'click', '[data-schoolpick]', (e, b) => {
    escuelaBi = +b.dataset.schoolpick; const actual = S.db.catalog[S.cur().book[escuelaBi].sid].escuela;
    abrirMenu($('#schoolMenu'), b, `<p class="sch-menu-h">Escuela de magia</p>` + ESCUELAS.map(sc => `<button type="button" role="menuitemradio" aria-checked="${sc === actual}" data-school="${sc}" style="--sc:var(--sc-${claveEscuela(sc)})"><i class="sch-dot" aria-hidden="true"></i>${sc}</button>`).join(''));
  });
  on(document, 'click', '[data-school]', (e, b) => {
    cerrarMenu(); const ch = S.cur(); if (escuelaBi == null || !ch) return;
    const sid = ch.book[escuelaBi].sid, s = S.db.catalog[sid], antes = s.escuela, nueva = b.dataset.school; if (antes === nueva) return;
    const otros = S.db.chars.filter(c => c !== ch && c.book.some(x => x.sid === sid)).length;
    const h = S.edit(db => { db.catalog[sid].escuela = nueva; }); invalidarItems();
    toast(`<b>${esc(s.es)}</b>: ${esc(nueva.toLowerCase())}.${otros ? ` También cambia en ${otros === 1 ? 'otro personaje' : otros + ' personajes'}.` : ''}`, [botonDeshacer(S, h)]);
  });
  on(sheet, 'click', '[data-comp]', (e, b) => {
    const [bi, c] = b.dataset.comp.split('|'), sid = S.cur().book[+bi].sid, act = (S.db.catalog[sid].comp || '').split(' ').filter(Boolean);
    const sig = act.includes(c) ? act.filter(x => x !== c) : [...act, c], { valor } = campo('comp', sig.join(' '));
    if (!valor) return toast('Todo conjuro tiene al menos un componente: verbal (V), somático (S) o material (M).');
    S.edit(db => { db.catalog[sid].comp = valor; if (!valor.includes('M')) db.catalog[sid].coste = ''; }); vibrar('light');
  });
  sheet.addEventListener('change', e => {
    const t = e.target;
    if (t.hasAttribute('data-pedirobj')) { S.edit((db, ch) => { ch.play.pedirObjetivos = t.checked; }); return; }
    if (t.hasAttribute('data-always')) { const bi = +t.dataset.bi; S.edit((db, ch) => { ch.book[bi].always = t.checked; if (t.checked) ch.book[bi].prep = false; }); return; }
    if (t.dataset.lvl !== undefined) {
      const ch = S.cur(), sid = ch.book[+t.dataset.lvl].sid, s = S.db.catalog[sid], others = S.db.chars.filter(c => c !== ch && c.book.some(b => b.sid === sid)).length;
      S.edit(db => { db.catalog[sid].level = +t.value; }); invalidarItems();
      toast(`<b>${esc(s.es)}</b> ahora es ${+t.value === 0 ? 'un truco' : 'de nivel ' + t.value}.${others ? ` También cambia en ${others === 1 ? 'otro personaje' : others + ' personajes'}.` : ''}`);
    }
  });
}
