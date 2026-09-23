/** Importar las descripciones desde el PDF del Manual del Jugador del usuario. */
import { esc } from '../../core/util.js';
import { emparejarManual, manualCount, oficializar, setManual, setGlosario, glosario } from '../../domain/catalogo.js';
import { ARCHIVO_GLOS } from './glosario.js';
import { $ } from '../dom.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { fileStore } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { confirmar } from '../modal.js';

const ARCHIVO = 'manual-conjuros.json';
let S;
const dlg = () => $('#manualDlg');

export async function cargarManualGuardado() {
  try { const raw = await fileStore.get(ARCHIVO); if (raw) { setManual(JSON.parse(raw)); return true; } } catch { /* sin datos */ }
  return false;
}
function estado() {
  const n = manualCount();
  $('#mnEstado').innerHTML = n
    ? `<p class="fsum">Tienes <b>${n}</b> descripciones del manual${glosario().length ? ` y <b>${glosario().length}</b> entradas del glosario` : ''} en este dispositivo.</p>`
    : '<p class="note">Aún no has importado el manual en este dispositivo.</p>';
  $('#mnBorrar').hidden = !n;
}
export function openManual() { $('#mnProg').hidden = true; $('#mnRes').innerHTML = ''; estado(); openSheet(dlg()); }

async function importar(file) {
  const bar = $('#mnProg'), msg = $('#mnMsg'), fill = $('#mnFill');
  bar.hidden = false; $('#mnRes').innerHTML = ''; $('#mnElegir').disabled = true;
  const t0 = performance.now();
  try {
    const { leerManual } = await import('../../app/importarManual.js');
    const { spells, glosario: gl } = await leerManual(file, p => {
      if (p.fase === 'abrir') { msg.textContent = 'Abriendo el PDF…'; fill.style.width = '4%'; }
      if (p.fase === 'leer') { msg.textContent = `Buscando el capítulo de conjuros: página ${p.pagina} de ${p.total}`; fill.style.width = `${Math.min(96, 4 + p.visto / 1.4)}%`; }
      if (p.fase === 'glosario') { msg.textContent = `Leyendo el glosario de reglas: página ${p.pagina}`; fill.style.width = '94%'; }
      if (p.fase === 'analizar') { msg.textContent = 'Separando conjuros y términos…'; fill.style.width = '98%'; }
    });
    const { mapa, sinPareja } = emparejarManual(spells);
    const n = Object.keys(mapa).length;
    if (!n) throw new Error('El PDF se ha leído, pero no he reconocido ningún conjuro.');
    await fileStore.set(ARCHIVO, JSON.stringify(mapa));
    setManual(mapa);
    if (gl.length) { await fileStore.set(ARCHIVO_GLOS, JSON.stringify(gl)); setGlosario(gl); }
    fill.style.width = '100%'; msg.textContent = `Listo en ${Math.round((performance.now() - t0) / 1000)} s.`;
    let cambios = [], h = null;
    if ($('#mnOficial').checked) h = S.edit(db => { cambios = oficializar(db); });
    else S.emit('manual');
    $('#mnRes').innerHTML = `<div class="fsum"><p><b>${n}</b> descripciones importadas de ${spells.length} conjuros leídos.</p>${gl.length ? `<p><b>${gl.length}</b> entradas del glosario de reglas, con ${gl.filter(e => e.cat === 'Estado').length} estados enlazados en las descripciones.</p>` : ''}
      ${sinPareja.length ? `<p class="note">Sin emparejar: ${esc(sinPareja.join(', '))}.</p>` : ''}
      ${cambios.length ? `<p>Nombres actualizados en tu catálogo (${cambios.length}): ${cambios.map(([a, b]) => `${esc(a)} → <b>${esc(b)}</b>`).join(', ')}.</p>` : ''}</div>`;
    estado();
    toast(`Manual importado: ${n} descripciones.`, h ? [{ label: 'Deshacer nombres', fn: () => S.undo(h) }] : []);
  } catch (e) {
    msg.textContent = 'No se pudo importar.';
    $('#mnRes').innerHTML = `<p class="ferr">${esc(e.message || e)}</p>`;
  } finally { $('#mnElegir').disabled = false; }
}

export function init(store) {
  S = store;
  $('#mnElegir').addEventListener('click', () => $('#mnFile').click());
  $('#mnFile').addEventListener('change', e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importar(f); });
  $('#mnBorrar').addEventListener('click', async () => {
    if (!(await confirmar({ titulo: '¿Borrar las descripciones del manual?', texto: 'Se quitan de este dispositivo. Puedes volver a importarlas desde tu PDF cuando quieras.', ok: 'Borrar', peligro: true }))) return;
    await fileStore.remove(ARCHIVO); await fileStore.remove(ARCHIVO_GLOS); setManual(null); setGlosario(null); estado(); S.emit('manual'); toast('Descripciones y glosario borrados.');
  });
  $('#mnSoloNombres').addEventListener('click', () => {
    let cambios = []; const h = S.edit(db => { cambios = oficializar(db); });
    toast(cambios.length ? `${cambios.length} conjuros con su nombre oficial.` : 'Tus conjuros ya tenían los nombres oficiales.', cambios.length ? [undoBtn(S, h)] : []);
  });
}
