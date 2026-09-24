/**
 * Libros y manuales: importa PDFs (Manual del Jugador y expansiones con el mismo formato) en el dispositivo.
 * Cada libro aporta textos de conjuros, conjuros nuevos, glosario y subclases. Se pueden quitar uno a uno.
 */
import { esc } from '../../core/util.js';
import { emparejarLibro, libros, setLibros, oficializar, manualCount, glosario, subclasesDe } from '../../domain/catalogo.js';
import { CLASES_ES, idLibro } from '../../domain/libros.js';
import { claveNombre } from '../../domain/manual.js';
import { $, on } from '../dom.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { confirmar } from '../modal.js';
import { fileStore } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { gi } from '../tema.js';
import { openBiblioteca } from './biblioteca.js';

const pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const INDICE = 'libros.json', archivo = id => `libro-${id}.json`;
let S, pendiente = null;   // libro leído a la espera de confirmar subclases
const dlg = () => $('#manualDlg');

async function guardarTodo(lista) {
  await fileStore.set(INDICE, JSON.stringify(lista.map(l => ({ id: l.id, titulo: l.titulo, fecha: l.fecha }))));
}
/** Carga los libros guardados (y convierte el formato anterior del manual si existe). */
export async function cargarLibros() {
  let lista = [];
  try {
    const idx = JSON.parse((await fileStore.get(INDICE)) || 'null');
    if (idx) for (const l of idx) { const raw = await fileStore.get(archivo(l.id)); if (raw) lista.push(JSON.parse(raw)); }
    else {
      const viejo = await fileStore.get('manual-conjuros.json');
      if (viejo) {
        const lb = { id: 'manual-del-jugador-2024', titulo: 'Manual del Jugador (2024)', fecha: Date.now(), textos: JSON.parse(viejo), nuevos: [],
          glosario: JSON.parse((await fileStore.get('manual-glosario.json')) || '[]'), subclases: [] };
        await fileStore.set(archivo(lb.id), JSON.stringify(lb)); lista = [lb]; await guardarTodo(lista);
        await fileStore.remove('manual-conjuros.json'); await fileStore.remove('manual-glosario.json');
      }
    }
  } catch (e) { console.warn('No se pudieron cargar los libros', e); }
  setLibros(lista);
  return lista.length > 0;
}
export const cargarManualGuardado = cargarLibros;   // compatibilidad

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
      <button type="button" class="warn" data-quitar="${esc(l.id)}">Quitar</button></div>`).join('')}</div>`
    : '<p class="note">Aún no has importado ningún libro en este dispositivo.</p>';
  $('#mnBorrar').hidden = true;
}
export function openManual() { pendiente = null; $('#mnProg').hidden = true; $('#mnRes').innerHTML = ''; lista(); openSheet(dlg()); }

/** Subclases detectadas que no son ya conocidas (o casi iguales a una conocida) → propuestas para confirmar. */
function propuestas(detectadas) {
  const lev = (a, b) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
  return detectadas.filter(sc => {
    const k = claveNombre(sc.nombre), conocidas = CLASES_ES.flatMap(c => subclasesDe(c)).map(claveNombre);
    return !conocidas.some(c => c === k || lev(c, k) <= 2 || c.startsWith(k));
  }).map(sc => {
    const ws = sc.nombre.split(/\s+/), menores = ['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o'];
    return { ...sc, ok: !!sc.clase && ws.every(w => w.length >= 3 || menores.includes(w.toLowerCase())) && ws.some(w => w.length >= 5) };
  });
}
async function guardarLibro(lb) {
  const L = libros().filter(l => l.id !== lb.id).concat(lb);
  await fileStore.set(archivo(lb.id), JSON.stringify(lb)); await guardarTodo(L);
  setLibros(L);
  let cambios = [], h = null;
  if ($('#mnOficial').checked) h = S.edit(db => { cambios = oficializar(db); }); else S.emit('manual');
  const tx = Object.keys(lb.textos).length;
  $('#mnRes').innerHTML = `<div class="fsum"><p><b>${esc(lb.titulo)}</b> importado${tx ? `: <b>${pl(tx, 'descripción', 'descripciones')}</b>` : '.'}${lb.nuevos.length ? `, con <b>${pl(lb.nuevos.length, 'conjuro nuevo', 'conjuros nuevos')}</b> que ya ${lb.nuevos.length === 1 ? 'aparece' : 'aparecen'} en el buscador` : ''}.</p>
    ${lb.glosario.length ? `<p><b>${lb.glosario.length}</b> entradas del glosario de reglas, con ${lb.glosario.filter(e => e.cat === 'Estado').length} estados enlazados en las descripciones.</p>` : ''}
    ${resumenBiblioteca(lb)}
    ${lb.subclases.length ? `<p>Subclases añadidas a las sugerencias: ${lb.subclases.map(s => `${esc(s.nombre)} (${esc(s.clase)})`).join(', ')}.</p>` : ''}
    ${cambios.length ? `<p>Nombres actualizados en tu catálogo (${cambios.length}): ${cambios.map(([a, b]) => `${esc(a)} → <b>${esc(b)}</b>`).join(', ')}.</p>` : ''}</div>`;
  lista(); toast(`<b>${esc(lb.titulo)}</b> importado.`, [{ label: 'Abrir biblioteca', fn: () => openBiblioteca() }, ...(h ? [{ label: 'Deshacer nombres', fn: () => S.undo(h) }] : [])]);
}
function resumenBiblioteca(lb) {
  const b = [(lb.objetos || []).length && pl(lb.objetos.length, 'objeto mágico', 'objetos mágicos'), (lb.dotes || []).length && pl(lb.dotes.length, 'dote', 'dotes'),
    (lb.trasfondos || []).length && pl(lb.trasfondos.length, 'trasfondo', 'trasfondos'), (lb.subTextos || []).length && pl(lb.subTextos.length, 'subclase con sus rasgos', 'subclases con sus rasgos'), (lb.criaturas || []).length && pl(lb.criaturas.length, 'perfil de criatura', 'perfiles de criatura')].filter(Boolean);
  return b.length ? `<p>En la biblioteca: <b>${b.join('</b>, <b>')}</b>.</p>` : '';
}
async function importar(file) {
  const bar = $('#mnProg'), msg = $('#mnMsg'), fill = $('#mnFill');
  bar.hidden = false; $('#mnRes').innerHTML = ''; $('#mnElegir').disabled = true;
  const t0 = performance.now();
  try {
    const { leerLibro } = await import('../../app/importarManual.js');
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
    if (!r.spells.length && !r.glosario.length && !r.subclases.length && !r.objetos.length && !r.dotes.length && !r.trasfondos.length && !r.criaturas.length) throw new Error('He leído el PDF, pero no reconozco conjuros, reglas, objetos mágicos, criaturas ni opciones de personaje. Comprueba que es un libro de D&D 2024 en español con texto seleccionable (un PDF escaneado sin texto hay que pasarlo antes por OCR: tools/ocr_pdf.py).');
    let titulo = r.titulo;
    const provisional = emparejarLibro(r.spells, 'x', titulo);
    if (Object.keys(provisional.textos).length >= 300 && provisional.nuevos.length <= 5) titulo = 'Manual del Jugador (2024)';
    else if (r.objetos.length >= 200 && r.glosario.some(e => e.cat === 'Herramientas del DM')) titulo = 'Guía del Dungeon Master (2024)';
    else if (/h[ée]roes de faer[uú]n/i.test(titulo)) titulo = 'Reinos Olvidados: Héroes de Faerûn';
    else if (r.criaturas.length >= 150 && !r.spells.length) titulo = 'Manual de Monstruos (2025)';
    const id = idLibro(titulo), { textos, nuevos } = emparejarLibro(r.spells, id, titulo);
    fill.style.width = '100%'; msg.textContent = `Leído en ${Math.round((performance.now() - t0) / 1000)} s.`;
    const lb = { id, titulo, fecha: Date.now(), textos, nuevos, glosario: r.glosario, subclases: [], objetos: r.objetos, dotes: r.dotes, trasfondos: r.trasfondos, subTextos: r.subTextos, criaturas: r.criaturas };
    const props = propuestas(r.subclases), sinNombre = r.trasfondos.filter(t => t.revisar).length + r.subTextos.filter(t => t.revisar).length;
    if (props.some(p => p.ok) || sinNombre) { pendiente = { lb, props }; pedirSubclases(); } else { lb.subclases = props.filter(p => p.ok).map(({ clase, nombre }) => ({ clase, nombre })); await guardarLibro(lb); }
  } catch (e) {
    msg.textContent = 'No se pudo importar.'; $('#mnRes').innerHTML = `<p class="ferr">${esc(e.message || e)}</p>`;
  } finally { $('#mnElegir').disabled = false; }
}
/* Entradas cuyo título no se pudo leer (en el PDF está dentro de una ilustración): se piden a mano, con una pista. */
function revisarNombres(lb) {
  const tr = lb.trasfondos.map((t, i) => [t, i]).filter(([t]) => t.revisar), sc = lb.subTextos.map((t, i) => [t, i]).filter(([t]) => t.revisar);
  if (!tr.length && !sc.length) return '';
  return `<p>El título de ${tr.length + sc.length === 1 ? 'esta entrada no se lee' : 'estas entradas no se lee'} en el PDF (está dentro de una ilustración). Escríbelo o déjalo en blanco para guardarla sin nombre:</p>
    <div class="sc-list">${tr.map(([t, i]) => `<div class="sc rev"><span class="rev-k">${gi('trasfondo')}Trasfondo</span><input data-rvt="${i}" placeholder="Nombre del trasfondo" aria-label="Nombre del trasfondo"><small>${esc(t.caracteristicas)} · dote: ${esc(t.dote)}</small></div>`).join('')}
    ${sc.map(([t, i]) => `<div class="sc rev"><span class="rev-k">${gi('subclase')}${esc(t.clase)}</span><input data-rvs="${i}" list="rvs${i}" placeholder="Nombre de la subclase" aria-label="Nombre de la subclase"><datalist id="rvs${i}">${(t.candidatas || []).map(n => `<option value="${esc(n)}">`).join('')}</datalist><small>Rasgos: ${t.rasgos.map(r => `${r.nivel}: ${esc(r.nombre)}`).join(', ')}</small></div>`).join('')}</div>`;
}
function pedirSubclases() {
  const { lb, props } = pendiente;
  $('#mnRes').innerHTML = `<div class="fsum"><p><b>${esc(lb.titulo)}</b>: ${Object.keys(lb.textos).length} descripciones${lb.nuevos.length ? ` (${lb.nuevos.length} conjuros nuevos)` : ''}${lb.glosario.length ? `, ${lb.glosario.length} términos` : ''}.</p>
    ${revisarNombres(lb)}
    ${props.length ? '<p>He encontrado estas subclases que la app no conoce. Revisa los nombres y marca las que quieras añadir a las sugerencias de subclase:</p>' : ''}
    <div class="sc-list">${props.map((p, i) => `<div class="sc"><input type="checkbox" data-sc="${i}" ${p.ok ? 'checked' : ''} aria-label="Añadir">
      <select data-scc="${i}">${['', ...CLASES_ES].map(c => `<option ${c === p.clase ? 'selected' : ''} value="${c}">${c || 'Clase…'}</option>`).join('')}</select>
      <input data-scn="${i}" value="${esc(p.nombre)}" aria-label="Nombre de la subclase"></div>`).join('')}</div>
    <div class="row-btns"><button type="button" class="gold" data-guardarlibro>Guardar libro</button></div></div>`;
}
export function init(store) {
  S = store;
  $('#mnElegir').addEventListener('click', () => $('#mnFile').click());
  $('#mnFile').addEventListener('change', e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importar(f); });
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
    const L = libros().filter(l => l.id !== lb.id); await fileStore.remove(archivo(lb.id)); await guardarTodo(L); setLibros(L);
    lista(); S.emit('manual'); toast(`«${lb.titulo}» quitado.`);
  });
  $('#mnSoloNombres').addEventListener('click', () => {
    let cambios = []; const h = S.edit(db => { cambios = oficializar(db); });
    toast(cambios.length ? `${cambios.length} conjuros con su nombre oficial.` : 'Tus conjuros ya tenían los nombres oficiales.', cambios.length ? [undoBtn(S, h)] : []);
  });
}
export { manualCount, glosario };
