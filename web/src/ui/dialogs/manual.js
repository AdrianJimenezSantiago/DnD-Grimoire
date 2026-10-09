// Libros y manuales: importar PDF, ver los libros cargados y aplicar los que vienen incluidos con la app.
import { esc } from '../../core/util.js';
import { rechazar } from '../componentes/validacion.js';
import { cargar, esVersionVieja, recargar } from '../../core/cargar.js';
import { oficializar, numTextosManual } from '../../domain/conjuros/catalogo.js';
import { glosario } from '../../domain/libros/terminos.js';
import { libros, fijarLibros } from '../../domain/libros/biblioteca.js';
import { componerLibro, aceptarPropuestas, hayContenido } from '../../domain/libros/componerLibro.js';
import { CLASES_ES } from '../../domain/libros/libros.js';
import { claveNombre } from '../../domain/libros/manual.js';
import { $, on } from '../componentes/dom.js';
import { abrirDialogo } from '../componentes/dialog.js';
import { toast, botonDeshacer } from '../componentes/toast.js';
import { confirmar } from '../componentes/modal.js';
import { archivos } from '../../platform/native.js';
import { gi } from '../componentes/tema.js';
import { abrirBiblioteca } from './biblioteca.js';

const pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const INDICE = 'libros.json', archivo = id => `libro-${id}.json`;
let S, pendiente = null;
const dlg = () => $('#manualDlg');

async function guardarTodo(lista) {
  await archivos.set(INDICE, JSON.stringify(lista.map(l => ({ id: l.id, titulo: l.titulo, fecha: l.fecha }))));
}
export async function cargarLibros() {
  let lista = [];
  try {
    const idx = JSON.parse((await archivos.get(INDICE)) || 'null');
    if (idx) for (const l of idx) { const raw = await archivos.get(archivo(l.id)); if (raw) lista.push(JSON.parse(raw)); }
    else {
      const viejo = await archivos.get('manual-conjuros.json');
      if (viejo) {
        const lb = { id: 'manual-del-jugador-2024', titulo: 'Manual del Jugador (2024)', fecha: Date.now(), textos: JSON.parse(viejo), nuevos: [],
          glosario: JSON.parse((await archivos.get('manual-glosario.json')) || '[]'), subclases: [] };
        await archivos.set(archivo(lb.id), JSON.stringify(lb)); lista = [lb]; await guardarTodo(lista);
        await archivos.remove('manual-conjuros.json'); await archivos.remove('manual-glosario.json');
      }
    }
  } catch (e) { console.warn('No se pudieron cargar los libros', e); }
  fijarLibros(lista);
  return lista.length > 0;
}

const QUITADOS = 'libros-incluidos-quitados.json';
const quitados = async () => { try { return JSON.parse((await archivos.get(QUITADOS)) || '[]'); } catch { return []; } };
export async function aplicarIncluidos() {
  let idx;
  try { const r = await fetch('libros/indice.json', { cache: 'no-cache' }); if (!r.ok) return []; idx = await r.json(); } catch { return []; }
  const L = libros(), fuera = new Set(await quitados()), nuevos = [];
  for (const e of Array.isArray(idx) ? idx : []) {
    const ya = L.find(l => l.id === e.id);
    if (fuera.has(e.id) || (ya && (!ya.incluido || ya.version === e.version))) continue;
    try { const lb = await (await fetch(`libros/${e.archivo}`)).json(); nuevos.push({ ...lb, fecha: Date.now(), incluido: true, version: e.version }); }
    catch (err) { console.warn('Libro incluido no disponible', e.titulo, err); }
  }
  if (!nuevos.length) return [];
  const ids = new Set(nuevos.map(l => l.id)), lista = L.filter(l => !ids.has(l.id)).concat(nuevos);
  for (const lb of nuevos) await archivos.set(archivo(lb.id), JSON.stringify(lb));
  await guardarTodo(lista); fijarLibros(lista); S?.emit('manual');
  return nuevos;
}

function lista() {
  const L = libros();
  $('#mnEstado').innerHTML = L.length ? `<div class="lb-list">${L.map(l => `<div class="lb">
      <div class="lb-t"><b>${esc(l.titulo)}</b><small>${[
        Object.keys(l.textos || {}).length ? pl(Object.keys(l.textos || {}).length, 'descripción', 'descripciones') : '',
        (l.nuevos || []).length ? pl(l.nuevos.length, 'conjuro nuevo', 'conjuros nuevos') : '',
        (l.glosario || []).length ? `${l.glosario.length} términos` : '',
        (l.subclases || []).length ? `${l.subclases.length} subclases` : '',
        (l.objetos || []).length ? `${l.objetos.length} objetos mágicos` : '',
        (l.dotes || []).length ? `${l.dotes.length} dotes` : '',
        (l.trasfondos || []).length ? `${l.trasfondos.length} trasfondos` : '',
        (l.criaturas || []).length ? `${l.criaturas.length} perfiles de criatura` : '',
      ].filter(Boolean).join(' · ')}</small></div>
      ${l.incluido ? '<span class="lb-inc" title="Leído del PDF al compilar la app">Incluido con la app</span>' : ''}<button type="button" class="warn" data-quitar="${esc(l.id)}">Quitar</button></div>`).join('')}</div>`
    : '<p class="note">Aún no has importado ningún libro en este dispositivo.</p>';
  $('#mnBorrar').hidden = true;
}
export function abrirManual() {
  pendiente = null; $('#mnProg').hidden = true; $('#mnRes').innerHTML = ''; lista(); abrirDialogo(dlg());
  import('../../app/importarManual.js').catch(() => {});
}

async function guardarLibro(lb) {
  const q = await quitados(); if (q.includes(lb.id)) await archivos.set(QUITADOS, JSON.stringify(q.filter(x => x !== lb.id)));
  const L = libros().filter(l => l.id !== lb.id).concat(lb);
  await archivos.set(archivo(lb.id), JSON.stringify(lb)); await guardarTodo(L);
  fijarLibros(L);
  let cambios = [], h = null;
  if ($('#mnOficial').checked) h = S.edit(db => { cambios = oficializar(db); }); else S.emit('manual');
  const tx = Object.keys(lb.textos).length;
  $('#mnRes').innerHTML = `<div class="fsum"><p><b>${esc(lb.titulo)}</b> importado${tx ? `: <b>${pl(tx, 'descripción', 'descripciones')}</b>` : '.'}${lb.nuevos.length ? `, con <b>${pl(lb.nuevos.length, 'conjuro nuevo', 'conjuros nuevos')}</b> que ya ${lb.nuevos.length === 1 ? 'aparece' : 'aparecen'} en el buscador` : ''}.</p>
    ${lb.glosario.length ? `<p><b>${lb.glosario.length}</b> entradas del glosario de reglas, con ${lb.glosario.filter(e => e.cat === 'Estado').length} estados enlazados en las descripciones.</p>` : ''}
    ${resumenBiblioteca(lb)}
    ${lb.subclases.length ? `<p>Subclases añadidas a las sugerencias: ${lb.subclases.map(s => `${esc(s.nombre)} (${esc(s.clase)})`).join(', ')}.</p>` : ''}
    ${cambios.length ? `<p>Nombres actualizados en tu catálogo (${cambios.length}): ${cambios.map(([a, b]) => `${esc(a)} → <b>${esc(b)}</b>`).join(', ')}.</p>` : ''}</div>`;
  lista(); toast(`<b>${esc(lb.titulo)}</b> importado.`, [{ label: 'Abrir biblioteca', fn: () => abrirBiblioteca() }, ...(h ? [{ label: 'Deshacer nombres', fn: () => S.undo(h) }] : [])]);
}
function resumenBiblioteca(lb) {
  const b = [(lb.objetos || []).length && pl(lb.objetos.length, 'objeto mágico', 'objetos mágicos'), (lb.dotes || []).length && pl(lb.dotes.length, 'dote', 'dotes'),
    (lb.trasfondos || []).length && pl(lb.trasfondos.length, 'trasfondo', 'trasfondos'), (lb.especies || []).length && pl(lb.especies.length, 'especie', 'especies'), (lb.rasgosClase || []).length && pl(lb.rasgosClase.reduce((n, c) => n + c.rasgos.length, 0), 'rasgo de clase', 'rasgos de clase'), (lb.subTextos || []).length && pl(lb.subTextos.length, 'subclase con sus rasgos', 'subclases con sus rasgos'), (lb.criaturas || []).length && pl(lb.criaturas.length, 'perfil de criatura', 'perfiles de criatura')].filter(Boolean);
  return b.length ? `<p>En la biblioteca: <b>${b.join('</b>, <b>')}</b>.</p>` : '';
}
async function importar(file) {
  if (!(/\.pdf$/i.test(file.name) || file.type === 'application/pdf')) return rechazar(null, 'archivo', { tipo: 'un libro en PDF' });
  const bar = $('#mnProg'), msg = $('#mnMsg'), fill = $('#mnFill');
  bar.hidden = false; $('#mnRes').innerHTML = ''; $('#mnElegir').disabled = true;
  const t0 = performance.now();
  try {
    const { leerLibro } = await cargar(() => import('../../app/importarManual.js'));
    const r = await leerLibro(file, p => {
      if (p.fase === 'abrir') { msg.textContent = 'Abriendo el PDF…'; fill.style.width = '3%'; }
      if (p.fase === 'leer') { msg.textContent = `Leyendo página ${p.pagina} de ${p.total}`; fill.style.width = `${3 + 85 * p.pagina / p.total}%`; }
      if (p.fase === 'analizar') { msg.textContent = 'Buscando conjuros…'; fill.style.width = '89%'; }
      if (p.fase === 'glosario') { msg.textContent = 'Leyendo el glosario de reglas…'; fill.style.width = '91%'; }
      if (p.fase === 'objetos') { msg.textContent = 'Leyendo los objetos mágicos…'; fill.style.width = '93%'; }
      if (p.fase === 'personaje') { msg.textContent = 'Leyendo dotes, trasfondos y subclases…'; fill.style.width = '95%'; }
      if (p.fase === 'reglas') { msg.textContent = 'Leyendo las reglas del DM…'; fill.style.width = '97%'; }
      if (p.fase === 'criaturas') { msg.textContent = 'Leyendo los perfiles de criaturas…'; fill.style.width = '99%'; }
    });
    if (!hayContenido(r)) throw new Error('He leído el PDF, pero no reconozco conjuros, reglas, objetos mágicos, criaturas ni opciones de personaje. Comprueba que es un libro de D&D 2024 en español con texto seleccionable (un PDF escaneado, solo con imágenes, no se puede leer).');
    fill.style.width = '100%'; msg.textContent = `Leído en ${Math.round((performance.now() - t0) / 1000)} s.`;
    const { lb, props, sinNombre } = componerLibro(r);
    if (props.some(p => p.ok) || sinNombre) { pendiente = { lb, props }; pedirSubclases(); } else await guardarLibro(aceptarPropuestas(lb, props));
  } catch (e) {
    msg.textContent = esVersionVieja(e) ? 'Hay una versión nueva de la app.' : 'No se pudo importar.';
    $('#mnRes').innerHTML = `<p class="ferr">${esc(e.message || e)}</p>${esVersionVieja(e) ? '<div class="row-btns"><button type="button" class="gold" data-recargar>Recargar la página</button></div>' : ''}`;
  } finally { $('#mnElegir').disabled = false; }
}
function revisarNombres(lb) {
  const tr = lb.trasfondos.map((t, i) => [t, i]).filter(([t]) => t.revisar), sc = lb.subTextos.map((t, i) => [t, i]).filter(([t]) => t.revisar);
  if (!tr.length && !sc.length) return '';
  return `<p>El título de ${tr.length + sc.length === 1 ? 'esta entrada no se lee' : 'estas entradas no se lee'} en el PDF (está dentro de una ilustración). Escríbelo o déjalo en blanco para guardarla sin nombre:</p>
    <div class="sc-list">${tr.map(([t, i]) => `<div class="sc rev"><span class="rev-k">${gi('trasfondo')}Trasfondo</span><input data-rvt="${i}" maxlength="80" placeholder="Nombre del trasfondo" aria-label="Nombre del trasfondo"><small>${esc(t.caracteristicas)} · dote: ${esc(t.dote)}</small></div>`).join('')}
    ${sc.map(([t, i]) => `<div class="sc rev"><span class="rev-k">${gi('subclase')}${esc(t.clase)}</span><input data-rvs="${i}" maxlength="80" list="rvs${i}" placeholder="Nombre de la subclase" aria-label="Nombre de la subclase"><datalist id="rvs${i}">${(t.candidatas || []).map(n => `<option value="${esc(n)}">`).join('')}</datalist><small>Rasgos: ${t.rasgos.map(r => `${r.nivel}: ${esc(r.nombre)}`).join(', ')}</small></div>`).join('')}</div>`;
}
function pedirSubclases() {
  const { lb, props } = pendiente;
  $('#mnRes').innerHTML = `<div class="fsum"><p><b>${esc(lb.titulo)}</b>: ${Object.keys(lb.textos).length} descripciones${lb.nuevos.length ? ` (${lb.nuevos.length} conjuros nuevos)` : ''}${lb.glosario.length ? `, ${lb.glosario.length} términos` : ''}.</p>
    ${revisarNombres(lb)}
    ${props.length ? '<p>He encontrado estas subclases que la app no conoce. Revisa los nombres y marca las que quieras añadir a las sugerencias de subclase:</p>' : ''}
    <div class="sc-list">${props.map((p, i) => `<div class="sc"><input type="checkbox" data-sc="${i}" ${p.ok ? 'checked' : ''} aria-label="Añadir">
      <select data-scc="${i}">${['', ...CLASES_ES].map(c => `<option ${c === p.clase ? 'selected' : ''} value="${c}">${c || 'Clase…'}</option>`).join('')}</select>
      <input data-scn="${i}" maxlength="80" value="${esc(p.nombre)}" aria-label="Nombre de la subclase"></div>`).join('')}</div>
    <div class="row-btns"><button type="button" class="gold" data-guardarlibro>Guardar libro</button></div></div>`;
}
export function init(store) {
  S = store;
  $('#mnElegir').addEventListener('click', () => $('#mnFile').click());
  $('#mnFile').addEventListener('change', e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importar(f); });
  on(dlg(), 'click', '[data-recargar]', () => recargar());
  on(dlg(), 'click', '[data-guardarlibro]', async () => {
    const { lb, props } = pendiente;
    dlg().querySelectorAll('[data-rvt]').forEach(inp => { const t = lb.trasfondos[+inp.dataset.rvt], n = inp.value.trim(); if (n) Object.assign(t, { nombre: n, clave: claveNombre(n), revisar: false }); });
    dlg().querySelectorAll('[data-rvs]').forEach(inp => { const t = lb.subTextos[+inp.dataset.rvs], n = inp.value.trim(); if (n) Object.assign(t, { nombre: n, clave: claveNombre(n), revisar: false }); });
    lb.trasfondos.forEach((t, i) => { if (!t.nombre) t.clave = `sin-nombre-${i}`; });
    lb.subTextos = lb.subTextos.filter(t => t.nombre);
    lb.subclases = props.map((p, i) => ({ clase: $(`[data-scc="${i}"]`).value, nombre: $(`[data-scn="${i}"]`).value.trim(), ok: $(`[data-sc="${i}"]`).checked }))
      .filter(p => p.ok && p.clase && p.nombre).map(({ clase, nombre }) => ({ clase, nombre }));
    pendiente = null; await guardarLibro(lb);
  });
  on(dlg(), 'click', '[data-quitar]', async (e, b) => {
    const lb = libros().find(l => l.id === b.dataset.quitar); if (!lb) return;
    if (!(await confirmar({ titulo: `¿Quitar «${lb.titulo}»?`, texto: 'Se borran de este dispositivo sus descripciones, glosario, subclases y conjuros nuevos. Los conjuros que ya tengas en tu libro siguen ahí.', ok: 'Quitar', peligro: true }))) return;
    const L = libros().filter(l => l.id !== lb.id); await archivos.remove(archivo(lb.id)); await guardarTodo(L); fijarLibros(L);
    if (lb.incluido) await archivos.set(QUITADOS, JSON.stringify([...new Set([...(await quitados()), lb.id])]));
    lista(); S.emit('manual'); toast(`«${esc(lb.titulo)}» quitado.`);
  });
  $('#mnSoloNombres').addEventListener('click', () => {
    let cambios = []; const h = S.edit(db => { cambios = oficializar(db); });
    toast(cambios.length ? `${cambios.length} conjuros con su nombre oficial.` : 'Tus conjuros ya tenían los nombres oficiales.', cambios.length ? [botonDeshacer(S, h)] : []);
  });
}
export { numTextosManual, glosario };
