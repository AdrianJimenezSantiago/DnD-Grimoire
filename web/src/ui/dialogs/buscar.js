// Búsqueda global (Ctrl+K): conjuros, reglas, objetos, rasgos, inventario y diario en una sola lista.
import { esc, norm } from '../../core/util.js';
import { sgn, CARACTERISTICAS } from '../../domain/reglas/reglas2024.js';
import { buscar } from '../../domain/presentacion/busqueda.js';
import { itemsConjuros } from '../../domain/conjuros/catalogo.js';
import { glosario } from '../../domain/libros/terminos.js';
import { biblioteca } from '../../domain/libros/biblioteca.js';
import { rasgosEnJuego } from '../../domain/clases/enJuego.js';
import { reglasVisibles } from '../../domain/clases/rasgos.js';
import { equipoDe } from '../../domain/equipo/equipo.js';
import { diarioDe } from '../../domain/personaje/diario.js';
import { HABILIDADES, bonoHabilidad, bonoSalvacion, iniciativa, penalizacionAgotamiento } from '../../domain/reglas/habilidades.js';
import { ESTADOS } from '../../domain/combate/vida.js';
import { $, on } from '../componentes/dom.js';
import { gi } from '../componentes/tema.js';
import { abrirDialogo, cerrarDialogo } from '../componentes/dialog.js';
import { abrirConjuro, verConjuro } from './conjuro.js';
import { addToBook } from './buscador.js';
import { abrirObjeto, abrirDote, abrirTrasfondo, abrirSubclase, abrirCriatura, abrirRasgoJuego, abrirTermino } from './biblioteca.js';
import { abrirEquipo } from './equipo.js';
import { abrirDiario } from './diario.js';
import { abrirEstados } from './vida.js';
import { tirarPrueba } from './dados.js';
import { escuelaIco } from '../pantallas/combate.js';

let S, RES = [], sel = 0, t = 0;
const dlg = () => $('#buscarDlg');

export function abrirBuscar() { $('#bsQ').value = ''; RES = []; pintar(); abrirDialogo(dlg()); setTimeout(() => $('#bsQ').focus(), 60); }

function fuentes() {
  const ch = S.cur(), db = S.db, lib = biblioteca(), F = [];
  const enLibro = new Map();
  if (ch) {
    ch.book.forEach((e, bi) => { const s = db.catalog[e.sid]; if (s) enLibro.set(s.id, bi); });
    F.push({ clave: 'libro', titulo: `Libro de ${ch.nombre}`, ico: 'libro', peso: 20, items: [...enLibro].map(([sid, bi]) => { const s = db.catalog[sid];
      return { nombre: s.es, texto: s.en, sub: `${s.level ? `Nivel ${s.level}` : 'Truco'} · ${s.escuela || ''}`, ico: escuelaIco(s.escuela) || 'libro', abrir: () => abrirConjuro(bi) }; }) });
    const ag = penalizacionAgotamiento(ch);
    F.push({ clave: 'hab', titulo: 'Tiradas', ico: 'd20', peso: 12, items: [
      ...HABILIDADES.map(([k, n]) => ({ nombre: n, sub: `Prueba · tirar ${sgn(bonoHabilidad(ch, k) - ag)}`, ico: 'd20', abrir: () => tirarPrueba({ titulo: n, sub: 'Prueba de característica', bono: bonoHabilidad(ch, k), tipo: 'prueba', hab: k }) })),
      ...CARACTERISTICAS.map(([k, n]) => ({ nombre: `Salvación de ${n}`, sub: `Tirar ${sgn(bonoSalvacion(ch, k) - ag)}`, ico: 'd20', abrir: () => tirarPrueba({ titulo: `Salvación de ${n}`, sub: 'Tirada de salvación', bono: bonoSalvacion(ch, k), tipo: 'salvacion', ab: k }) })),
      { nombre: 'Iniciativa', sub: `Tirar ${sgn(iniciativa(ch) - ag)}`, ico: 'iniciativa', abrir: () => tirarPrueba({ titulo: 'Iniciativa', sub: 'Prueba de Destreza', bono: iniciativa(ch), tipo: 'iniciativa' }) }] });
    F.push({ clave: 'rasgos', titulo: 'Rasgos de tu personaje', ico: 'dote', peso: 5, items: rasgosEnJuego(ch, lib, reglasVisibles(ch)).map(r => ({ nombre: r.nombre, texto: r.texto, sub: r.etiqueta, ico: 'dote', abrir: () => abrirRasgoJuego(r.clave) })) });
    F.push({ clave: 'inv', titulo: 'Inventario', ico: 'cofre', peso: 4, items: equipoDe(ch).objetos.map(o => ({ nombre: o.nombre, texto: o.notas, sub: `${o.cantidad > 1 ? `${o.cantidad} × ` : ''}${o.equipado ? 'equipado' : o.guardado ? 'en el alijo' : 'en la mochila'}`, ico: 'cofre', abrir: () => abrirEquipo(o.id) })) });
    F.push({ clave: 'diario', titulo: 'Diario', ico: 'glosario', peso: 2, items: diarioDe(ch).sesiones.flatMap(s => [
      { nombre: s.titulo || `Sesión ${s.n}`, texto: s.texto, sub: `Sesión ${s.n}`, ico: 'glosario', abrir: () => abrirDiario(s.id) },
      ...s.notas.map(n => ({ nombre: n.texto, sub: `Nota · sesión ${s.n}`, ico: 'glosario', abrir: () => abrirDiario(s.id) }))]) });
    F.push({ clave: 'estados', titulo: 'Estados', ico: 'estados', peso: 3, items: ESTADOS.map(([, n, r]) => ({ nombre: n, texto: r, sub: r, ico: 'estados', abrir: () => abrirEstados() })) });
  }
  F.push({ clave: 'conj', titulo: 'Conjuros del compendio', ico: 'libro', items: itemsConjuros(db).filter(it => !(it.src === 'cat' && enLibro.has(it.s.id)))
    .map(it => ({ nombre: it.es, texto: it.en, sub: `${it.l ? `Nivel ${it.l}` : 'Truco'} · ${it.esc || ''}`, ico: escuelaIco(it.esc) || 'libro', abrir: () => verConjuro(it, { onAdd: ch ? () => addToBook(it) : null }) })) });
  F.push({ clave: 'reglas', titulo: 'Reglas', ico: 'glosario', items: glosario().map(e => ({ nombre: e.nombre, texto: e.texto.slice(0, 600), sub: e.cat || 'Regla', ico: 'glosario', abrir: () => abrirTermino(e.clave) })) });
  F.push({ clave: 'obj', titulo: 'Objetos mágicos', ico: 'o_maravilloso', items: lib.objetos.map(o => ({ nombre: o.nombre, sub: [o.tipo, o.rareza].filter(Boolean).join(' · '), ico: 'o_maravilloso', abrir: () => abrirObjeto(o.clave) })) });
  F.push({ clave: 'dotes', titulo: 'Dotes', ico: 'dote', items: lib.dotes.map(d => ({ nombre: d.nombre, sub: d.cat, ico: 'dote', abrir: () => abrirDote(d.clave) })) });
  F.push({ clave: 'tras', titulo: 'Trasfondos', ico: 'trasfondo', items: lib.trasfondos.filter(x => x.nombre).map(x => ({ nombre: x.nombre, sub: x.dote || '', ico: 'trasfondo', abrir: () => abrirTrasfondo(x.clave) })) });
  F.push({ clave: 'sub', titulo: 'Subclases', ico: 'subclase', items: lib.subclases.filter(x => x.nombre).map(x => ({ nombre: x.nombre, sub: x.clase, ico: norm(x.clase).replace(/[^a-z]/g, ''), abrir: () => abrirSubclase(`${x.clase}|${x.clave}`) })) });
  F.push({ clave: 'cria', titulo: 'Criaturas', ico: 'criatura', items: lib.criaturas.map(c => ({ nombre: c.nombre, sub: c.tipoBase || '', ico: 'criatura', abrir: () => abrirCriatura(c.clave) })) });
  return F;
}

const marca = (texto, q) => { const n = norm(texto), i = n.indexOf(norm(q)); return i < 0 ? esc(texto) : `${esc(texto.slice(0, i))}<mark>${esc(texto.slice(i, i + q.length))}</mark>${esc(texto.slice(i + q.length))}`; };
function pintar() {
  const q = $('#bsQ').value.trim();
  if (q.length < 2) { $('#bsBody').innerHTML = `<div class="bs-vacio">${gi('buscar')}<p>Busca en todo el grimorio a la vez: tus conjuros y los del compendio, las reglas y los estados, los objetos mágicos, las dotes, tus rasgos, tu inventario y tu diario.</p></div>`; return; }
  let i = 0;
  $('#bsBody').innerHTML = RES.length ? RES.map(g => `<section class="bs-g"><h3>${gi(g.ico)}${esc(g.titulo)}${g.mas ? `<small>+${g.mas} más</small>` : ''}</h3><ul>${g.items.map(it => `<li><button type="button" class="bs-it ${i === sel ? 'sel' : ''}" data-bs="${i++}" role="option"><span class="bs-ico-w" ${it.ico?.startsWith('esc_') ? `style="--sc:var(--sc-${it.ico.slice(4)})"` : ''}>${gi(it.ico, 'bs-ico')}</span><span><b>${marca(it.nombre, q)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button></li>`).join('')}</ul></section>`).join('')
    : `<div class="bs-vacio">${gi('buscar')}<p>Nada coincide con «${esc(q)}».</p></div>`;
}
const planos = () => RES.flatMap(g => g.items);
function abrir(i) { const it = planos()[i]; if (!it) return; cerrarDialogo(dlg()); setTimeout(() => it.abrir(), 200); }

export function init(store) {
  S = store;
  $('#bsQ').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { RES = buscar($('#bsQ').value, fuentes()); sel = 0; pintar(); }, 90); });
  $('#bsQ').addEventListener('keydown', e => {
    const n = planos().length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); sel = (sel + 1) % n; pintar(); $('#bsBody .bs-it.sel')?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'ArrowUp' && n) { e.preventDefault(); sel = (sel - 1 + n) % n; pintar(); $('#bsBody .bs-it.sel')?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter') { e.preventDefault(); abrir(sel); }
  });
  on($('#bsBody'), 'click', '[data-bs]', (e, b) => abrir(+b.dataset.bs));
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase(), escribiendo = /input|textarea|select/i.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
    if (((e.ctrlKey || e.metaKey) && k === 'k') || (k === '/' && !escribiendo && !document.querySelector('dialog[open]'))) {
      if (document.body.classList.contains('on-landing') && !S.db.chars.length) return;
      if (document.body.classList.contains('caido') && !document.body.classList.contains('on-landing')) return;
      e.preventDefault(); if (!dlg().open) abrirBuscar();
    }
  });
}
