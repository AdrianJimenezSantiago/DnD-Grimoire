/**
 * Biblioteca: lo que aportan los libros importados, en un solo sitio.
 * Pestañas: Reglas (glosario), Objetos mágicos, Dotes, Trasfondos y Subclases. Cada entrada se lee en la ficha común,
 * con tablas, apartados y enlaces a los estados. Los objetos se añaden al personaje desde su ficha.
 */
import { esc, norm } from '../../core/util.js';
import { biblioteca, glosario, termino, libros } from '../../domain/catalogo.js';
import { RAREZAS, TIPOS_OBJ, ordenRareza } from '../../domain/objetos.js';
import { CLASES } from '../../domain/reglas2024.js';
import { anadirObjeto, tieneObjeto } from '../../domain/equipo.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { icon } from '../icons.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { bloqueHtml, md } from './conjuro.js';
import { TIPOS_BASE, aBestiario, vdTexto } from '../../domain/monstruos.js';
import { bestiarioDe, nuevaCriatura } from '../../domain/bestiario.js';
import { undoBtn } from '../../app/acciones.js';
import { rasgosEnJuego, GRUPOS, resumenClase, resumenSubclase } from '../../domain/enJuego.js';
import { TEMAS } from '../../domain/clases2024.js';
import { reglas } from '../../domain/rasgos.js';

let S;
const V = { tab: 'reglas', q: '', rar: '', tipo: '', sint: false, cat: '', clase: '', orden: 'tipo', ctipo: '', cvd: '' };
const dlg = () => $('#bibDlg');
export const RAR_K = { 'Común': 'comun', Infrecuente: 'infrec', Raro: 'raro', 'Muy raro': 'muyraro', Legendario: 'legend', Artefacto: 'artef', 'Varía': 'varia' };
export const TIPO_I = { Arma: 'o_arma', Armadura: 'o_armadura', Anillo: 'o_anillo', 'Bastón': 'o_baston', 'Objeto maravilloso': 'o_maravilloso', Pergamino: 'o_pergamino', 'Poción': 'o_pocion', Vara: 'o_vara', Varita: 'o_varita' };
const TABS = [['reglas', 'Reglas', 'glosario'], ['objetos', 'Objetos', 'cofre'], ['dotes', 'Dotes', 'dote'], ['trasfondos', 'Trasfondos', 'trasfondo'], ['subclases', 'Subclases', 'subclase'], ['criaturas', 'Criaturas', 'criatura']];
const ORDEN_G = ['Estado', 'Acción', 'Área de efecto', 'Peligro', 'Actitud', '', 'Herramientas del DM', 'Objetos mágicos'];
const TIT_G = { Estado: 'Estados', 'Acción': 'Acciones', 'Área de efecto': 'Áreas de efecto', Peligro: 'Peligros', Actitud: 'Actitudes', '': 'Reglas generales', 'Herramientas del DM': 'Herramientas del DM', 'Objetos mágicos': 'Objetos mágicos: reglas' };
const coincide = (q, ...t) => !q || norm(t.join(' ')).includes(q);
// orden de la lista de objetos: [etiqueta, siguiente]
const ORDEN_OBJ = { tipo: ['Por tipo', 'rar'], rar: ['Por rareza', 'az'], az: ['A–Z', 'tipo'] };
const ORDEN_TIPOS = ['Arma', 'Armadura', 'Anillo', 'Poción', 'Pergamino', 'Varita', 'Vara', 'Bastón', 'Objeto maravilloso'];
const TIT_TIPO = { Arma: 'Armas', Armadura: 'Armaduras', Anillo: 'Anillos', 'Poción': 'Pociones', Pergamino: 'Pergaminos', Varita: 'Varitas', Vara: 'Varas', 'Bastón': 'Bastones', 'Objeto maravilloso': 'Objetos maravillosos' };
const inicial = t => norm(t).charAt(0).toUpperCase() || '#';
const rareza = o => o.rareza === 'Varía' && o.rarezas?.length ? `${o.rarezas[0]} a ${o.rarezas[o.rarezas.length - 1].toLowerCase()}` : o.rareza;

function vacio(que, libro) {
  return `<div class="bib-empty">${gi('biblioteca')}<p>${que}</p><p class="note">Impórtalo desde tu PDF de ${libro} en Libros y manuales. Se lee en este dispositivo y no sale de él.</p>
    <button type="button" class="gold" data-cmd="manual">${gi('libro')}Importar un libro</button></div>`;
}
function herramientas() {
  const q = `<input type="search" id="bibQ" value="${esc(V.q)}" placeholder="${{ reglas: 'Buscar una regla o un estado', objetos: 'Buscar un objeto mágico', dotes: 'Buscar una dote', trasfondos: 'Buscar un trasfondo', subclases: 'Buscar una subclase', criaturas: 'Buscar una criatura' }[V.tab]}" aria-label="Buscar" autocomplete="off">`;
  let f = '';
  if (V.tab === 'objetos') {
    f = `<div class="bib-rar" role="group" aria-label="Rareza">${RAREZAS.filter(r => r !== 'Varía').map(r => `<button type="button" class="rar-chip r-${RAR_K[r]}" aria-pressed="${V.rar === r}" data-rar="${r}">${r}</button>`).join('')}</div>
      <div class="bib-sel"><select id="bibTipo" aria-label="Tipo de objeto"><option value="">Todos los tipos</option>${TIPOS_OBJ.map(t => `<option ${V.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <button type="button" class="chip" id="bibSint" aria-pressed="${V.sint}">${gi('sintonia')}Sin sintonización</button>
      <button type="button" class="chip" id="bibOrden" title="Cambiar cómo se agrupa la lista">${icon('sliders')}${ORDEN_OBJ[V.orden][0]}</button></div>`;
  }
  if (V.tab === 'dotes') f = `<div class="bib-sel una">${['', 'Origen', 'General', 'Estilo de combate', 'Don épico'].map(c => `<button type="button" class="chip" aria-pressed="${V.cat === c}" data-cat="${c}">${c || 'Todas'}</button>`).join('')}</div>`;
  if (V.tab === 'criaturas') f = `<div class="bib-sel una"><select id="bibCTipo" aria-label="Tipo de criatura"><option value="">Todos los tipos</option>${TIPOS_BASE.map(t => `<option ${V.ctipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <select id="bibCVd" aria-label="Valor de desafío máximo"><option value="">Cualquier VD</option>${[0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 8, 10, 15, 20, 30].map(v => `<option value="${v}" ${String(V.cvd) === String(v) ? 'selected' : ''}>VD ${vdTexto(v)} o menos</option>`).join('')}</select></div>`;
  if (V.tab === 'subclases') f = `<div class="bib-sel"><select id="bibClase" aria-label="Clase"><option value="">Todas las clases</option>${Object.keys(CLASES).map(c => `<option ${V.clase === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>`;
  $('#bibTools').innerHTML = q + f;
}
function cuerpo() {
  const q = norm(V.q.trim()), B = biblioteca();
  let h = '', n = 0;
  if (V.tab === 'reglas') {
    const todo = glosario();
    if (!todo.length) h = vacio('Aquí aparecen el glosario de reglas del Manual del Jugador y las herramientas de la Guía del Dungeon Master.', 'Manual del Jugador o de la Guía del DM');
    else {
      const f = todo.filter(e => coincide(q, e.nombre) || (q.length > 3 && coincide(q, e.texto))); n = f.length;
      h = ORDEN_G.map(c => [c, f.filter(e => (e.cat || '') === c).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))]).filter(([, v]) => v.length)
        .map(([c, v]) => `<h3 class="bib-g">${esc(TIT_G[c] ?? c)}<small>${v.length}</small></h3><div class="gl-grid">${v.map(e => `<button type="button" class="gl-item ${e.cat === 'Estado' ? 'estado' : ''} ${/Herramientas|Objetos/.test(e.cat) ? 'dm' : ''}" data-term="${e.clave}">${esc(e.nombre)}</button>`).join('')}</div>`).join('');
    }
  }
  if (V.tab === 'objetos') {
    if (!B.objetos.length) h = vacio('Aquí aparecen los objetos mágicos, con filtros por rareza, tipo y sintonización.', 'la Guía del Dungeon Master');
    else {
      let f = B.objetos.filter(o => coincide(q, o.nombre, o.tipo, o.subtipo) && (!V.rar || o.rareza === V.rar || o.rarezas?.includes(V.rar)) && (!V.tipo || o.tipo === V.tipo) && (!V.sint || !o.sintonia));
      n = f.length; const ch = S.cur(), rz = o => o.rarezas?.[0] || o.rareza;
      const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es'), porRareza = (a, b) => ordenRareza(rz(a)) - ordenRareza(rz(b)) || porNombre(a, b);
      // por tipo (dentro, de común a artefacto), por rareza (dentro, A–Z) o A–Z por inicial
      const grupos = V.orden === 'rar' ? RAREZAS.map(r => [r, f.filter(o => (RAREZAS.includes(rz(o)) ? rz(o) : 'Varía') === r).sort(porNombre), null, `r-${RAR_K[r]}`])
        : V.orden === 'az' ? [...new Set(f.map(o => inicial(o.nombre)))].sort((a, b) => a.localeCompare(b, 'es')).map(l => [l, f.filter(o => inicial(o.nombre) === l).sort(porNombre), null, ''])
        : [...ORDEN_TIPOS, ''].map(t => [t || 'Otros', f.filter(o => (ORDEN_TIPOS.includes(o.tipo) ? o.tipo : '') === t).sort(porRareza), TIPO_I[t] || 'o_maravilloso', '']);
      const tarjeta = o => `<li><button type="button" class="obj r-${RAR_K[rz(o)] || 'varia'}" data-obj="${esc(o.clave)}">
        <span class="obj-ico">${gi(TIPO_I[o.tipo] || 'o_maravilloso')}</span>
        <span class="obj-t"><b>${esc(o.nombre)}</b><small title="${esc([o.tipo, o.subtipo].filter(Boolean).join(': '))}">${[V.orden === 'rar' && o.rareza !== 'Varía' ? '' : `<span class="rar-txt">${esc(rareza(o))}</span>`, V.orden === 'tipo' ? '' : esc(o.tipo), esc(o.subtipo || '')].filter(Boolean).join(' · ')}</small></span>
        ${o.sintonia ? `<span class="obj-sin" title="Requiere sintonización" aria-label="Requiere sintonización">${gi('sintonia')}</span>` : ''}${ch && tieneObjeto(ch, o.clave) ? `<span class="obj-lo" title="Lo tiene ${esc(ch.nombre)}">${icon('user')}</span>` : ''}</button></li>`;
      h = grupos.filter(([, v]) => v.length).map(([t, v, ico, cls]) => `<h3 class="bib-g obj-g ${cls}">${ico ? gi(ico) : cls ? '<i class="rar-pt"></i>' : ''}${esc(TIT_TIPO[t] || t)}<small>${v.length}</small></h3>
        <ul class="obj-list obj-grid">${v.map(tarjeta).join('')}</ul>`).join('');
    }
  }
  if (V.tab === 'dotes') {
    if (!B.dotes.length) h = vacio('Aquí aparecen las dotes de origen, generales, de estilo de combate y los dones épicos.', 'tu Manual del Jugador o de una expansión');
    else {
      const f = B.dotes.filter(d => coincide(q, d.nombre, d.req) && (!V.cat || d.cat === V.cat)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')); n = f.length;
      h = `<ul class="bib-list">${f.map(d => `<li><button type="button" class="bib-it" data-dote="${esc(d.clave)}"><b>${esc(d.nombre)}</b><small>${esc(d.cat)}${d.req ? ` · ${esc(d.req)}` : ''}</small><span class="bib-src">${esc(corto(d.fuente))}</span></button></li>`).join('')}</ul>`;
    }
  }
  if (V.tab === 'trasfondos') {
    if (!B.trasfondos.length) h = vacio('Aquí aparecen los trasfondos con sus características, dote, competencias y equipo.', 'tu Manual del Jugador o de una expansión');
    else {
      const f = B.trasfondos.filter(t => coincide(q, t.nombre, t.dote, t.habilidades)).sort((a, b) => (a.nombre || '~').localeCompare(b.nombre || '~', 'es')); n = f.length;
      h = `<ul class="bib-list">${f.map(t => `<li><button type="button" class="bib-it" data-tras="${esc(t.clave)}"><b>${esc(t.nombre || 'Trasfondo sin nombre')}</b><small>${esc(t.caracteristicas || '')} · dote: ${esc(t.dote || '—')}</small><span class="bib-src">${esc(corto(t.fuente))}</span></button></li>`).join('')}</ul>`;
    }
  }
  if (V.tab === 'subclases') {
    if (!B.subclases.length) h = vacio('Aquí aparecen las subclases con todos sus rasgos, nivel a nivel.', 'tu Manual del Jugador o de una expansión');
    else {
      const f = B.subclases.filter(s => s.nombre && coincide(q, s.nombre, s.clase, s.lema) && (!V.clase || s.clase === V.clase));
      n = f.length;
      const por = Object.keys(CLASES).map(c => [c, f.filter(s => s.clase === c).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))]).filter(([, v]) => v.length);
      h = por.map(([c, v]) => `<h3 class="bib-g">${gi(norm(c).replace(/[^a-z]/g, ''))}${esc(c)}<small>${v.length}</small></h3><ul class="bib-list">${v.map(s => `<li><button type="button" class="bib-it" data-sub="${esc(s.clase + '|' + s.clave)}"><b>${esc(s.nombre)}</b><small>${esc(s.lema || s.rasgos.map(r => r.nombre).slice(0, 3).join(', '))}</small><span class="bib-src">${esc(corto(s.fuente))}</span></button></li>`).join('')}</ul>`).join('');
    }
  }
  if (V.tab === 'criaturas') {
    if (!B.criaturas.length) h = vacio('Aquí aparecen los perfiles de criaturas: tipo, CA, PG, características, resistencias y acciones.', 'del apéndice de criaturas del Manual del Jugador');
    else {
      const f = B.criaturas.filter(c => coincide(q, c.nombre, c.tipo) && (!V.ctipo || c.tipoBase === V.ctipo) && (V.cvd === '' || (c.vdNum ?? 99) <= +V.cvd))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')); n = f.length;
      h = `<ul class="bib-list">${f.slice(0, 400).map(c => `<li><button type="button" class="bib-it" data-cria="${esc(c.clave)}"><b>${esc(c.nombre)}</b><small>${esc(c.tipo)}${c.vdNum != null ? ` · VD ${vdTexto(c.vdNum)}` : ''}</small><span class="bib-src">${esc(corto(c.fuente))}</span></button></li>`).join('')}</ul>${f.length > 400 ? `<p class="note">Y ${f.length - 400} más: afina la búsqueda.</p>` : ''}`;
    }
  }
  $('#bibBody').innerHTML = h || '<p class="pempty">Nada coincide con la búsqueda. Prueba con menos palabras o quita algún filtro.</p>';
  const libs = libros().length;
  $('#bibSub').textContent = libs ? `${n} ${n === 1 ? 'entrada' : 'entradas'} · de ${libs} ${libs === 1 ? 'libro importado' : 'libros importados'}` : 'Reglas, objetos mágicos y opciones de personaje de tus libros';
}
const corto = t => String(t || '').replace(/^D&D\s*[\d.,]*\s*-?\s*/i, '').replace(/\s*\(.*$/, '').split(/[:–-]/)[0].trim().slice(0, 28);
function pintar() {
  $('#bibTabs').innerHTML = TABS.map(([k, t, ico]) => `<button type="button" role="tab" aria-selected="${V.tab === k}" data-tab="${k}">${gi(ico)}<span>${t}</span></button>`).join('');
  herramientas(); cuerpo(); $('#bibBody').scrollTop = 0;
}
export function openBiblioteca(tab) {
  if (tab) V.tab = tab;
  if (!V.clase && S.cur()) V.clase = '';
  pintar(); openSheet(dlg());
}

/* ------------------------------- ficha común ------------------------------- */
let FICHA = null;
function ficha({ titulo, sub = '', cuerpo: h, pie = '', ico = '', clase = '' }) {
  const d = $('#fichaDlg');
  d.className = `tall ficha ${clase}`;
  $('#fiTitle').innerHTML = (ico ? `<span class="fi-ico">${gi(ico)}</span>` : '') + `<span>${esc(titulo)}</span>`;
  $('#fiSub').innerHTML = sub; $('#fiBody').innerHTML = h;
  $('#fiFoot').innerHTML = `${pie}<span class="spacer"></span><button type="button" class="primary" data-close>Cerrar</button>`;
  openSheet(d); $('#fiBody').scrollTop = 0;
}
const fuente = f => (f ? `<p class="fi-src">${gi('libro')}${esc(f)} · importado de tu PDF</p>` : '');
export function abrirObjeto(clave) {
  const o = biblioteca().objetos.find(x => x.clave === clave); if (!o) return;
  const ch = S.cur(), ya = ch && tieneObjeto(ch, o.clave), rk = RAR_K[o.rarezas?.[0] || o.rareza] || 'varia';
  FICHA = { tipo: 'obj', o };
  ficha({ titulo: o.nombre, ico: TIPO_I[o.tipo] || 'o_maravilloso', clase: `r-${rk}`,
    sub: `<div class="fi-pills"><span class="rar-pill r-${rk}">${esc(rareza(o))}</span><span>${esc(o.tipo)}${o.subtipo ? ` (${esc(o.subtipo)})` : ''}</span>
      ${o.sintonia ? `<span class="sin-pill">${gi('sintonia')}Sintonización${o.sintoniaCon ? ` con ${esc(o.sintoniaCon.replace(/^(parte de |un |una )/, ''))}` : ''}</span>` : ''}
      ${o.cargas ? `<span>${o.cargas.max} cargas${o.cargas.recarga ? ` · recupera ${esc(o.cargas.recarga)} al ${esc(o.cargas.cuando || 'amanecer')}` : ''}</span>` : ''}</div>`,
    cuerpo: `<section class="sp-text">${md(o.texto)}</section>${fuente(o.fuente)}`,
    pie: ch ? (ya ? `<span class="fi-ya">${icon('user')}${esc(ch.nombre)} ya lo lleva</span><button type="button" data-cmd="equipo">Ver sus objetos</button>`
      : `<button type="button" class="gold" data-fi="anadir">${icon('plus')}Añadir a ${esc(ch.nombre)}</button>`) : '' });
}
function abrirDote(clave) {
  const d = biblioteca().dotes.find(x => x.clave === clave); if (!d) return;
  ficha({ titulo: d.nombre, ico: 'dote', sub: `<div class="fi-pills"><span class="rar-pill">${esc(d.cat)}</span>${d.req ? `<span>Requisitos: ${esc(d.req)}</span>` : ''}</div>`, cuerpo: `<section class="sp-text">${md(d.texto)}</section>${fuente(d.fuente)}` });
}
function abrirTrasfondo(clave) {
  const t = biblioteca().trasfondos.find(x => x.clave === clave); if (!t) return;
  const filas = [['Características', t.caracteristicas], ['Dote', t.dote], ['Habilidades', t.habilidades], ['Herramientas', t.herramientas], ['Equipo', t.equipo]].filter(f => f[1]);
  ficha({ titulo: t.nombre || 'Trasfondo sin nombre', ico: 'trasfondo', sub: '',
    cuerpo: `<dl class="fi-dl">${filas.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><section class="sp-text">${md(t.texto)}</section>${fuente(t.fuente)}` });
}
function abrirSubclase(k) {
  const [clase, clave] = k.split('|'), s = biblioteca().subclases.find(x => x.clase === clase && x.clave === clave); if (!s) return;
  const ch = S.cur();
  ficha({ titulo: s.nombre, ico: norm(s.clase).replace(/[^a-z]/g, ''), sub: `<div class="fi-pills"><span class="rar-pill">${esc(s.clase)}</span>${[...new Map(s.rasgos.map(r => [r.nivel, r])).values()].map(r => `<a class="lvl-pill ${ch && ch.clase === s.clase && ch.nivel >= r.nivel ? 'on' : ''}" href="#rs-${r.nivel}-${norm(r.nombre).replace(/\W+/g, '-')}">${r.nivel}</a>`).join('')}</div>${s.lema ? `<p class="fi-lema">${esc(s.lema)}</p>` : ''}`,
    cuerpo: `<section class="sp-text">${md(s.texto).replace(/<h4 class="md-h">Nivel (\d+): ([^<]+)<\/h4>/g, (m, n, t) => `<h4 class="md-h rasgo" id="rs-${n}-${norm(t.replace(/&[a-z]+;/g, '')).replace(/\W+/g, '-')}"><span class="lvl-pill">${n}</span>${t}</h4>`)}</section>${fuente(s.fuente)}` });
}
/** Perfil de criatura importado, con «Añadir al bestiario» del personaje abierto. */
export function abrirCriatura(clave) {
  const c = biblioteca().criaturas.find(x => x.clave === clave); if (!c) return;
  const ch = S.cur(), ya = ch && bestiarioDe(ch).criaturas.find(x => x.perfil === c.clave);
  FICHA = { tipo: 'cria', c };
  ficha({ titulo: c.nombre, ico: 'criatura', sub: `<div class="fi-pills"><span class="rar-pill">${esc(c.tipoBase || 'Criatura')}</span>${c.vdNum != null ? `<span>VD ${vdTexto(c.vdNum)}</span>` : ''}${c.tamano ? `<span>${esc(c.tamano)}</span>` : ''}</div>`,
    cuerpo: `${bloqueHtml(c)}${c.revisar?.length ? `<p class="note">Comprueba en el libro ${esc(c.revisar.filter(x => !/^corregido/.test(x)).join(', ') || 'los valores marcados')}.</p>` : ''}${fuente(c.fuente)}`,
    pie: ch ? (ya ? `<span class="fi-ya">${gi('bestia')}Ya está en el bestiario de ${esc(ch.nombre)}</span>` : `<button type="button" class="gold" data-fi="bestiario">${gi('bestia')}Añadir al bestiario de ${esc(ch.nombre)}</button>`) : '' });
}
/** Término del glosario (también desde los enlaces de las descripciones). */
/**
 * Resumen de una clase o de una subclase antes de elegirla: datos clave y lo que aprende nivel a nivel,
 * con una línea de cada rasgo (si el libro está importado) que se despliega para leerlo entero.
 */
export function abrirResumen(clase, subclase = '') {
  const lib = biblioteca(), rz = subclase ? resumenSubclase(clase, subclase, lib) : resumenClase(clase, lib);
  if (!rz) return toast(`La app no conoce los rasgos de ${esc(subclase || clase)}: si es de otro libro, impórtalo en Libros y manuales.`);
  const [h, sat, ico] = (subclase && TEMAS.sub[rz.subclase]) || TEMAS.clase[clase] || [40, 50, 'subclase'];
  const rasgo = r => r.texto
    ? `<details class="rz-r ${r.sub ? 'sub' : ''}"><summary><b>${esc(r.nombre)}</b>${r.resumen ? `<span>${esc(r.resumen)}</span>` : ''}</summary><div class="sp-text">${md(r.texto)}</div></details>`
    : `<div class="rz-r ${r.sub ? 'sub' : ''}"><b>${esc(r.nombre)}</b>${r.resumen ? `<span>${esc(r.resumen)}</span>` : ''}</div>`;
  const lista = `<ol class="rz-lista">${rz.niveles.map(n => `<li><span class="rz-lv" aria-label="Nivel ${n.nivel}">${n.nivel}</span><div class="rz-rs">${n.rasgos.map(rasgo).join('')}</div></li>`).join('')}</ol>`;
  const conj = rz.conjuros?.length ? `<h3 class="rz-h">Conjuros siempre preparados</h3><dl class="rz-conj">${rz.conjuros.map(c => `<div><dt>Nivel ${c.nivel}</dt><dd>${c.conjuros.map(esc).join(', ')}</dd></div>`).join('')}</dl>` : '';
  const aviso = rz.conTextos ? '' : '<p class="note">Importa el Manual del Jugador (o el libro de esta subclase) en Libros y manuales para leer qué hace cada rasgo. Se lee en este dispositivo.</p>';
  FICHA = { tipo: 'resumen', clase, subclase };
  ficha({ titulo: subclase ? rz.subclase : clase, ico,
    sub: `<div class="fi-pills">${subclase ? `<span class="rar-pill">${esc(clase)}</span>${rz.libro ? `<span>${esc(rz.libro)}</span>` : ''}` : rz.datos.map(([k, v]) => `<span><b>${esc(k)}:</b> ${esc(v)}</span>`).join('')}</div>${rz.lema ? `<p class="rz-lema">${esc(rz.lema)}</p>` : ''}`,
    cuerpo: `${aviso}<h3 class="rz-h">${subclase ? 'Lo que aprende' : 'Lo que aprende nivel a nivel'}</h3>${lista}${conj}`,
    pie: subclase ? `<button type="button" data-rzclase="${esc(clase)}">${gi(ico === 'subclase' ? 'libro' : TEMAS.clase[clase]?.[2] || 'libro')}Ver ${esc(clase)} completo</button>` : '', clase: 'rz' });
  const d = $('#fichaDlg'); d.style.setProperty('--sh', h); d.style.setProperty('--ss', sat + '%');
}
/** Rasgo de «En juego»: el texto completo del libro y dónde se muestra en la hoja (se puede cambiar de grupo). */
export function abrirRasgoJuego(clave) {
  const ch = S.cur(); if (!ch) return;
  const r = rasgosEnJuego(ch, biblioteca(), reglas(ch)).find(x => x.clave === clave); if (!r) return;
  FICHA = { tipo: 'rasgo', clave };
  const grupos = `<div class="ej-mover"><span>Mostrar en</span><div class="seg sm" role="radiogroup" aria-label="Grupo">${GRUPOS.map(([k, t]) => `<button type="button" role="radio" aria-checked="${r.grupo === k}" data-ejgrupo="${k}">${esc(t)}${k === r.auto && r.grupo !== r.auto ? ' ·' : ''}</button>`).join('')}</div></div>`;
  ficha({ titulo: r.nombre, ico: r.fuente === 'especie' ? 'criatura' : r.fuente === 'dote' ? 'dote' : r.origen === 'subclase' ? 'subclase' : norm(r.clase || '').replace(/[^a-z]/g, ''),
    sub: `<div class="fi-pills"><span class="rar-pill">${esc(r.etiqueta)}</span>${r.numeros.map(n => `<span>${esc(n.nombre)}: ${esc(n.valor)}</span>`).join('')}</div>`,
    cuerpo: `${grupos}${r.texto ? `<section class="sp-text">${md(r.texto)}</section>${fuente(r.fuente)}` : `<p class="note">Aún no tienes el texto de este rasgo. Importa el libro que lo trae (el Manual del Jugador o una expansión) en Libros y manuales: se lee en este dispositivo.</p>`}` });
}
export function abrirTermino(clave) {
  const e = termino(clave); if (!e) return;
  const largo = e.texto.length > 2500, apartados = [...e.texto.matchAll(/^### (.+)$/gm)].map(m => m[1]);
  const indice = largo && apartados.length >= 3 ? `<nav class="fi-toc" aria-label="Apartados">${apartados.map((a, i) => `<a href="#ap-${i}">${esc(a)}</a>`).join('')}</nav>` : '';
  let n = 0; const html = md(e.texto).replace(/<h4 class="md-h">/g, () => `<h4 class="md-h" id="ap-${n++}">`);
  ficha({ titulo: e.nombre, ico: 'glosario', sub: e.cat ? `<div class="fi-pills"><span class="rar-pill ${e.cat === 'Estado' ? 'estado' : ''}">${esc(e.cat)}</span></div>` : '', cuerpo: `${indice}<section class="sp-text">${html}</section>` });
}

export function init(store) {
  S = store;
  const d = dlg();
  on(d, 'click', '[data-tab]', (e, b) => { V.tab = b.dataset.tab; V.q = ''; pintar(); });
  on(d, 'click', '[data-rar]', (e, b) => { V.rar = V.rar === b.dataset.rar ? '' : b.dataset.rar; herramientas(); cuerpo(); });
  on(d, 'click', '[data-cat]', (e, b) => { V.cat = b.dataset.cat; herramientas(); cuerpo(); });
  on(d, 'click', '#bibSint', () => { V.sint = !V.sint; herramientas(); cuerpo(); });
  on(d, 'click', '#bibOrden', () => { V.orden = ORDEN_OBJ[V.orden][1]; herramientas(); cuerpo(); });
  on(d, 'click', '[data-obj]', (e, b) => abrirObjeto(b.dataset.obj));
  on(d, 'click', '[data-dote]', (e, b) => abrirDote(b.dataset.dote));
  on(d, 'click', '[data-tras]', (e, b) => abrirTrasfondo(b.dataset.tras));
  on(d, 'click', '[data-sub]', (e, b) => abrirSubclase(b.dataset.sub));
  on(d, 'click', '[data-cria]', (e, b) => abrirCriatura(b.dataset.cria));
  d.addEventListener('input', e => { if (e.target.id === 'bibQ') { V.q = e.target.value; cuerpo(); } });
  d.addEventListener('change', e => {
    const k = { bibTipo: 'tipo', bibClase: 'clase', bibCTipo: 'ctipo', bibCVd: 'cvd' }[e.target.id]; if (!k) return;   // el buscador ya filtra al escribir
    V[k] = e.target.value; cuerpo();
  });
  // índice de apartados de la ficha: salto suave dentro del cuerpo
  on($('#fichaDlg'), 'click', '.fi-toc a, a.lvl-pill', (e, a) => { e.preventDefault(); $('#fiBody').querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  on($('#fichaDlg'), 'click', '[data-rzclase]', (e, b) => abrirResumen(b.dataset.rzclase));
  on($('#fichaDlg'), 'click', '[data-ejgrupo]', (e, b) => {
    if (FICHA?.tipo !== 'rasgo') return; const k = FICHA.clave, g = b.dataset.ejgrupo;
    S.edit((db, ch) => { ch.enJuego ||= {}; ch.enJuego.grupo = { ...(ch.enJuego.grupo || {}) }; ch.enJuego.grupo[k] = g; });
    abrirRasgoJuego(k);
  });
  on($('#fichaDlg'), 'click', '[data-fi]', (e, b) => {
    if (b.dataset.fi === 'bestiario' && FICHA?.tipo === 'cria') {
      const c = FICHA.c;
      const h = S.edit((db, ch) => { Object.assign(nuevaCriatura(ch, c.nombre), aBestiario(c)); });
      toast(`<b>${esc(c.nombre)}</b> en el bestiario de ${esc(S.cur().nombre)}, con sus daños, estados y salvaciones.`, [undoBtn(S, h)]);
      return abrirCriatura(c.clave);
    }
    if (b.dataset.fi !== 'anadir' || FICHA?.tipo !== 'obj') return;
    const o = FICHA.o; let nuevo;
    const h = S.edit((db, ch) => { nuevo = anadirObjeto(ch, o); });
    toast(`<b>${esc(o.nombre)}</b> añadido a ${esc(S.cur().nombre)}.${nuevo.rasgo ? ' Sus cargas ya están en la hoja.' : ''}`, [undoBtn(S, h)]);
    abrirObjeto(o.clave); if (dlg().open) cuerpo();
  });
  d.addEventListener('close', () => { if ($('#fichaDlg').open) closeSheet($('#fichaDlg')); });
}
