/**
 * Inventario: lo que lleva el personaje, por categorías, con cantidades, peso y carga, monedas, CA con lo equipado,
 * ataque de cada arma, consumibles que se gastan con un toque, y los objetos mágicos con su sintonización y cargas.
 */
import { esc, norm } from '../../core/util.js';
import { CATEGORIAS, NOMBRE_CAT, MONEDAS, PREDEFINIDOS, MAX_SINTONIA, equipoDe, sintonizados, alternarSintonia, alternarEquipado, cambiarCantidad,
  quitarObjeto, anadirComun, normObjeto, pesoTotal, capacidadCarga, valorMonedas, claseArmadura, ataqueArma } from '../../domain/equipo.js';
import { reglas, usosGastados } from '../../domain/rasgos.js';
import { biblioteca } from '../../domain/catalogo.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { icon } from '../icons.js';
import { avatarHtml } from '../avatar.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { haptic } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { RAR_K, TIPO_I, abrirObjeto, openBiblioteca } from './biblioteca.js';

let S;
// Vista: categoría filtrada, búsqueda, formulario abierto (nuevo o editando un objeto) y monedas desplegadas
const V = { cat: '', q: '', form: null, monedas: false };
const dlg = () => $('#equipoDlg');
const kg = n => `${(Math.round((n || 0) * 100) / 100).toLocaleString('es-ES')} kg`;
const icoCat = k => (CATEGORIAS.find(c => c[0] === k) || [])[2] || 'cofre';
const APILABLE = new Set(['consumible', 'comida', 'tesoro', 'equipo', 'otro', 'herramienta']);

function resumen(ch) {
  const ca = claseArmadura(ch), peso = pesoTotal(ch), cap = capacidadCarga(ch), pct = Math.min(100, Math.round(peso / cap * 100)), sin = sintonizados(ch);
  const eq = equipoDe(ch);
  return `<section class="inv-sum" aria-label="Resumen">
    <div class="inv-card"><small>Clase de armadura</small><b>${ca.ca}</b><span>${esc(ca.detalle)}</span></div>
    <div class="inv-card ${peso > cap ? 'over' : ''}"><small>Carga</small><b>${kg(peso)}</b><span class="inv-bar" role="meter" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${peso}" aria-label="Carga"><i style="width:${pct}%"></i></span><span>${peso > cap ? 'Por encima de tu capacidad' : `de ${kg(cap)} (Fuerza ${ch.stats?.fue || 10})`}</span></div>
    <button type="button" class="inv-card inv-mon" data-inv="monedas" aria-expanded="${V.monedas}"><small>Monedas</small><b>${valorMonedas(ch).toLocaleString('es-ES')} po</b><span>${MONEDAS.filter(([k]) => eq.monedas[k]).map(([k]) => `${eq.monedas[k]} ${k}`).join(' · ') || 'Toca para anotarlas'}</span></button>
    <div class="inv-card"><small>Sintonía</small><b>${sin.length}/${MAX_SINTONIA}</b><span>${sin.map(o => esc(o.nombre)).join(', ') || 'Ningún objeto sintonizado'}</span></div>
  </section>
  ${V.monedas ? `<section class="inv-coins" aria-label="Monedas">${MONEDAS.map(([k, n]) => `<label class="f"><span>${n} (${k})</span><input type="number" inputmode="numeric" min="0" data-moneda="${k}" value="${eq.monedas[k] || 0}"></label>`).join('')}</section>` : ''}`;
}

function fila(ch, o, R) {
  const r = o.rasgo && R.find(x => x.id === o.rasgo), libres = r ? r.max - usosGastados(ch, r) : 0, conTexto = o.clave && biblioteca().objetos.some(x => x.clave === o.clave);
  const at = o.arma ? ataqueArma(ch, o) : null;
  const meta = [
    at ? `${at.ataque} · ${at.dano}` : '',
    o.arma ? [...(o.arma.props || []), o.arma.maestria ? `maestría: ${o.arma.maestria}` : '', o.arma.distancia].filter(Boolean).join(', ') : '',
    o.armadura ? (o.armadura.tipo === 'escudo' ? `+${o.armadura.base || 2} a la CA` : `CA ${o.armadura.base + (o.armadura.bono || 0)}${o.armadura.dex === 'todo' ? ' + Des' : o.armadura.dex === 'max2' ? ' + Des (máx. 2)' : ''} · ${o.armadura.tipo}`) : '',
    o.rareza ? `<span class="rar-txt">${esc(o.rareza)}</span>` : '',
    r ? `${libres} de ${r.max} cargas` : '',
    o.peso ? kg(o.peso * (o.cantidad || 1)) : '',
    o.valor, o.notas,
  ].filter(Boolean);
  const acts = [
    o.arma || o.armadura ? `<button type="button" class="chip ${o.equipado ? 'gold' : ''}" data-inveq="${o.id}" aria-pressed="${o.equipado}">${o.equipado ? 'Equipado' : 'Equipar'}</button>` : '',
    o.sintonia ? `<button type="button" class="chip ${o.sintonizado ? 'gold' : ''}" data-eqsin="${o.id}" aria-pressed="${o.sintonizado}">${gi('sintonia')}${o.sintonizado ? 'Sintonizado' : 'Sintonizar'}</button>` : '',
    o.cat === 'consumible' || o.cat === 'comida' ? `<button type="button" class="chip" data-invusar="${o.id}" ${o.cantidad ? '' : 'disabled'}>Usar</button>` : '',
    APILABLE.has(o.cat) || o.cantidad > 1 ? `<span class="inv-qty"><button type="button" data-invcant="${o.id}|-1" aria-label="Quitar uno de ${esc(o.nombre)}">−</button><b>${o.cantidad}</b><button type="button" data-invcant="${o.id}|1" aria-label="Añadir uno de ${esc(o.nombre)}">+</button></span>` : '',
    `<button type="button" class="iconbtn sm" data-invedit="${o.id}" aria-label="Editar ${esc(o.nombre)}">${icon('quill')}</button>`,
    `<button type="button" class="iconbtn sm" data-eqdel="${o.id}" aria-label="Quitar ${esc(o.nombre)}">×</button>`,
  ].filter(Boolean).join('');
  return `<li class="inv-it c-${o.cat} ${o.rareza ? 'r-' + (RAR_K[o.rareza] || 'varia') : ''} ${o.equipado || o.sintonizado ? 'on' : ''} ${o.cantidad === 0 ? 'agotado' : ''}">
    <button type="button" class="inv-main" ${conTexto ? `data-eqver="${esc(o.clave)}"` : `data-invedit="${o.id}"`} aria-label="${conTexto ? 'Leer' : 'Editar'} ${esc(o.nombre)}">
      <span class="obj-ico">${gi(o.clave ? TIPO_I[o.tipo] || 'o_maravilloso' : icoCat(o.cat))}</span>
      <span class="obj-t"><b>${esc(o.nombre)}${o.cantidad > 1 ? ` <small class="inv-x">×${o.cantidad}</small>` : ''}</b><small>${meta.map(m => (m.startsWith('<') ? m : esc(m))).join(' · ')}</small></span></button>
    <span class="inv-acts">${acts}</span></li>`;
}

function formulario() {
  const f = V.form, o = f.o, cat = o.cat;
  const catOpts = CATEGORIAS.map(([k, t]) => `<option value="${k}" ${k === cat ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const arma = o.arma || {}, arm = o.armadura || {};
  return `<section class="inv-form" aria-label="${f.id ? 'Editar objeto' : 'Añadir objeto'}"><h3>${f.id ? `Editar ${esc(o.nombre)}` : 'Añadir objeto'}</h3>
    <div class="frow"><label class="f wide">Nombre<input id="ivNom" list="ivSug" value="${esc(o.nombre || '')}" placeholder="Escribe o elige: espada larga, raciones, cuerda…" autocomplete="off"></label>
      <datalist id="ivSug">${PREDEFINIDOS.map(p => `<option value="${esc(p.nombre)}">${esc(NOMBRE_CAT[p.cat])}</option>`).join('')}</datalist></div>
    <div class="frow"><label class="f">Categoría<select id="ivCat">${catOpts}</select></label>
      <label class="f">Cantidad<input id="ivCant" type="number" inputmode="numeric" min="0" value="${o.cantidad ?? 1}"></label>
      <label class="f">Peso (kg, cada uno)<input id="ivPeso" inputmode="decimal" value="${o.peso ? String(o.peso).replace('.', ',') : ''}" placeholder="0"></label>
      <label class="f">Valor<input id="ivValor" value="${esc(o.valor || '')}" placeholder="15 po" autocomplete="off"></label></div>
    ${cat === 'arma' ? `<div class="frow"><label class="f">Daño<input id="ivDano" value="${esc(arma.dano || '')}" placeholder="1d8" autocomplete="off"></label>
      <label class="f">Tipo de daño<input id="ivTipo" value="${esc(arma.tipo || '')}" placeholder="cortante" autocomplete="off"></label>
      <label class="f">Bonificador mágico<input id="ivBonoA" type="number" inputmode="numeric" value="${arma.bono || 0}"></label>
      <label class="f wide">Propiedades<input id="ivProps" value="${esc((arma.props || []).join(', '))}" placeholder="Sutil, Ligera, Arrojadiza" autocomplete="off"></label>
      <label class="f">Maestría<input id="ivMaes" value="${esc(arma.maestria || '')}" placeholder="Irritar" autocomplete="off"></label>
      <label class="f">Alcance<input id="ivDist" value="${esc(arma.distancia || '')}" placeholder="24/96 m" autocomplete="off"></label></div>` : ''}
    ${cat === 'armadura' ? `<div class="frow"><label class="f">Tipo<select id="ivArmT">${[['ligera', 'Ligera'], ['media', 'Media'], ['pesada', 'Pesada'], ['escudo', 'Escudo']].map(([k, t]) => `<option value="${k}" ${arm.tipo === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="f">${arm.tipo === 'escudo' ? 'Bonificador a la CA' : 'CA base'}<input id="ivBase" type="number" inputmode="numeric" value="${arm.base ?? (arm.tipo === 'escudo' ? 2 : 11)}"></label>
      <label class="f">Destreza<select id="ivDex">${[['todo', 'Suma toda'], ['max2', 'Máximo +2'], ['no', 'No suma']].map(([k, t]) => `<option value="${k}" ${arm.dex === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="f">Bonificador mágico<input id="ivBonoR" type="number" inputmode="numeric" value="${arm.bono || 0}"></label></div>` : ''}
    <label class="f wide">Notas<input id="ivNotas" value="${esc(o.notas || '')}" placeholder="Dónde lo guarda, efectos, usos…" autocomplete="off"></label>
    <div class="inv-form-acts"><button type="button" data-inv="cancelar">Cancelar</button><span class="spacer"></span><button type="button" class="gold" data-inv="guardar">${f.id ? 'Guardar' : 'Añadir al inventario'}</button></div></section>`;
}
/** Lee el formulario y devuelve los datos del objeto. */
function leerFormulario() {
  const v = id => ($(id)?.value ?? '').trim(), o = { ...V.form.o };
  Object.assign(o, { nombre: v('#ivNom'), cat: v('#ivCat') || o.cat, cantidad: v('#ivCant'), peso: v('#ivPeso'), valor: v('#ivValor'), notas: v('#ivNotas') });
  if (o.cat === 'arma' && $('#ivDano')) o.arma = { ...(o.arma || {}), dano: v('#ivDano'), tipo: v('#ivTipo'), bono: parseInt(v('#ivBonoA'), 10) || 0, props: v('#ivProps').split(',').map(x => x.trim()).filter(Boolean), maestria: v('#ivMaes'), distancia: v('#ivDist') };
  if (o.cat === 'armadura' && $('#ivBase')) o.armadura = { ...(o.armadura || {}), tipo: v('#ivArmT'), base: parseInt(v('#ivBase'), 10) || 0, dex: v('#ivDex'), bono: parseInt(v('#ivBonoR'), 10) || 0 };
  if (o.cat !== 'arma') delete o.arma; if (o.cat !== 'armadura') delete o.armadura;
  return o;
}

function render() {
  const ch = S.cur(); if (!ch) return;
  const eq = equipoDe(ch), R = reglas(ch), n = eq.objetos.reduce((s, o) => s + (o.cantidad || 0), 0);
  $('#eqHead').innerHTML = `${avatarHtml(ch, 'md')}<div><h2 id="eqTitle">Inventario de ${esc(ch.nombre)}</h2><div class="dsub">${eq.objetos.length ? `${n} ${n === 1 ? 'objeto' : 'objetos'} · ${kg(pesoTotal(ch))}` : 'Lo que lleva encima: armas, armadura, equipo, provisiones y tesoros'}</div></div>`;
  const hay = CATEGORIAS.filter(([k]) => eq.objetos.some(o => o.cat === k));
  if (V.cat && !hay.some(([k]) => k === V.cat)) V.cat = '';
  const q = norm(V.q.trim());
  const lista = eq.objetos.filter(o => (!V.cat || o.cat === V.cat) && (!q || norm(`${o.nombre} ${o.notas} ${o.tipo || ''}`).includes(q)));
  let h = resumen(ch);
  h += V.form ? formulario() : `<div class="inv-bar-add"><button type="button" class="gold" data-inv="nuevo">${icon('plus')}Añadir objeto</button><button type="button" data-eq="bib">${gi('biblioteca')}Objetos mágicos</button></div>`;
  if (eq.objetos.length) h += `<div class="inv-tools"><input type="search" id="ivQ" value="${esc(V.q)}" placeholder="Buscar en el inventario" aria-label="Buscar en el inventario" autocomplete="off">
    ${hay.length > 1 ? `<div class="seg sm inv-cats" role="radiogroup" aria-label="Categoría"><button type="button" role="radio" aria-checked="${!V.cat}" data-invcat="">Todo</button>${hay.map(([k, t]) => `<button type="button" role="radio" aria-checked="${V.cat === k}" data-invcat="${k}">${esc(t)}</button>`).join('')}</div>` : ''}</div>`;
  if (!eq.objetos.length) h += `<div class="bib-empty">${gi('cofre')}<p>El inventario está vacío.</p><p class="note">Añade lo que lleva: elige de la lista de objetos comunes (con su peso y, en las armas y armaduras, su daño y su CA) o escríbelo a mano. Los objetos mágicos se añaden desde la biblioteca, con sus cargas.</p></div>`;
  else h += CATEGORIAS.filter(([k]) => lista.some(o => o.cat === k)).map(([k, t, ico]) => {
    const items = lista.filter(o => o.cat === k).sort((a, b) => (b.equipado - a.equipado) || a.nombre.localeCompare(b.nombre, 'es'));
    const peso = items.reduce((s, o) => s + (o.peso || 0) * o.cantidad, 0);
    return `<section class="inv-grupo"><h3>${gi(ico)}${esc(t)}<small>${items.length}${peso ? ` · ${kg(peso)}` : ''}</small></h3><ul class="inv-list">${items.map(o => fila(ch, o, R)).join('')}</ul></section>`;
  }).join('') || '<p class="pempty">Nada coincide con la búsqueda.</p>';
  $('#eqBody').innerHTML = h;
  $('#eqFoot').innerHTML = `<span class="spacer"></span><button type="button" data-close>Cerrar</button>`;
}
export function openEquipo() { if (!S.cur()) return; V.form = null; render(); openSheet(dlg()); }

export function init(store) {
  S = store;
  const d = dlg();
  const repintar = () => { const b = $('#eqBody'), y = b.scrollTop; render(); b.scrollTop = y; };
  on(d, 'click', '[data-eq="bib"]', () => openBiblioteca('objetos'));
  on(d, 'click', '[data-eqver]', (e, b) => abrirObjeto(b.dataset.eqver));
  on(d, 'click', '[data-invcat]', (e, b) => { V.cat = b.dataset.invcat; repintar(); });
  on(d, 'click', '[data-inv]', (e, b) => {
    const a = b.dataset.inv;
    if (a === 'monedas') { V.monedas = !V.monedas; return repintar(); }
    if (a === 'nuevo') { V.form = { id: null, o: { cat: V.cat || 'equipo', cantidad: 1 } }; render(); return $('#ivNom')?.focus(); }
    if (a === 'cancelar') { V.form = null; return repintar(); }
    if (a === 'guardar') {
      const o = leerFormulario(); if (!o.nombre) { $('#ivNom').focus(); return toast('Escribe el nombre del objeto.'); }
      const id = V.form.id;
      const h = S.edit((db, ch) => { const eq = equipoDe(ch);
        if (id) { const i = eq.objetos.findIndex(x => x.id === id); if (i >= 0) eq.objetos[i] = normObjeto({ ...eq.objetos[i], ...o, id }); } else anadirComun(ch, o); });
      V.form = null; repintar(); haptic();
      toast(`<b>${esc(o.nombre)}</b> ${id ? 'guardado' : 'añadido al inventario'}.`, [undoBtn(S, h)]);
    }
  });
  on(d, 'click', '[data-invedit]', (e, b) => { const o = equipoDe(S.cur()).objetos.find(x => x.id === b.dataset.invedit); if (!o) return;
    V.form = { id: o.id, o: JSON.parse(JSON.stringify(o)) }; render(); $('#eqBody').scrollTop = 0; $('#ivNom')?.focus(); });
  on(d, 'click', '[data-inveq]', (e, b) => { S.edit((db, ch) => alternarEquipado(ch, b.dataset.inveq)); haptic(); repintar(); });
  on(d, 'click', '[data-invcant]', (e, b) => { const [id, n] = b.dataset.invcant.split('|'); S.edit((db, ch) => cambiarCantidad(ch, id, +n)); repintar(); });
  on(d, 'click', '[data-invusar]', (e, b) => { let o; const h = S.edit((db, ch) => { o = cambiarCantidad(ch, b.dataset.invusar, -1); }); haptic(); repintar();
    toast(`<b>${esc(o?.nombre || 'Objeto')}</b>: ${o?.cantidad ? `quedan ${o.cantidad}` : 'se ha acabado'}.`, [undoBtn(S, h)]); });
  on(d, 'click', '[data-eqsin]', (e, b) => {
    let ok = true; S.edit((db, ch) => { ok = alternarSintonia(ch, b.dataset.eqsin); });
    if (!ok) toast(`Ya hay ${MAX_SINTONIA} objetos sintonizados. Deja de sintonizar uno antes (lleva un descanso corto).`); else haptic();
    repintar();
  });
  on(d, 'click', '[data-eqdel]', (e, b) => {
    let o; const h = S.edit((db, ch) => { o = quitarObjeto(ch, b.dataset.eqdel); });
    repintar(); toast(`<b>${esc(o?.nombre || 'Objeto')}</b> quitado.`, [undoBtn(S, h)]);
  });
  d.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'ivQ') { V.q = t.value; const pos = t.selectionStart; render(); const i = $('#ivQ'); i.focus(); i.setSelectionRange(pos, pos); }
    // al elegir un objeto común se rellenan su categoría, peso, valor y datos de arma o armadura
    if (t.id === 'ivNom' && !V.form?.id) { const p = PREDEFINIDOS.find(x => norm(x.nombre) === norm(t.value)); if (p) { V.form.o = { ...JSON.parse(JSON.stringify(p)), cantidad: parseInt($('#ivCant')?.value, 10) || 1 }; render(); $('#ivNom').focus(); } }
  });
  d.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.moneda) { const k = t.dataset.moneda, v = Math.max(0, parseInt(t.value, 10) || 0); S.edit((db, ch) => { equipoDe(ch).monedas[k] = v; }); repintar(); }
    // cambiar de categoría o de tipo de armadura muestra sus campos (arma: daño; armadura: CA)
    if (t.id === 'ivCat' || t.id === 'ivArmT') { V.form.o = leerFormulario(); if (t.id === 'ivArmT') V.form.o.armadura.tipo = t.value; render(); }
  });
  d.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest?.('.inv-form') && e.target.tagName === 'INPUT') { e.preventDefault(); d.querySelector('[data-inv="guardar"]')?.click(); } });
  S.subscribe?.(() => { if (d.open && !V.form) render(); });
}
