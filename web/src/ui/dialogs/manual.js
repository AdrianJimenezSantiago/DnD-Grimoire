/** Importar las descripciones desde el PDF del Manual del Jugador del usuario. */
import { esc } from '../../core/util.js';
import { emparejarManual, manualCount, oficializar, setManual } from '../../domain/catalogo.js';
import { $ } from '../dom.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { fileStore } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';

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
    ? `<p class="fsum">Tienes <b>${n}</b> descripciones del manual en este dispositivo. Aparecen en la ficha de cada conjuro.</p>`
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
    const spells = await leerManual(file, p => {
      if (p.fase === 'abrir') { msg.textContent = 'Abriendo el PDF…'; fill.style.width = '4%'; }
      if (p.fase === 'leer') { msg.textContent = `Buscando el capítulo de conjuros: página ${p.pagina} de ${p.total}`; fill.style.width = `${Math.min(96, 4 + p.visto / 1.4)}%`; }
      if (p.fase === 'analizar') { msg.textContent = 'Separando conjuros…'; fill.style.width = '98%'; }
    });
    const { mapa, sinPareja } = emparejarManual(spells);
    const n = Object.keys(mapa).length;
    if (!n) throw new Error('El PDF se ha leído, pero no he reconocido ningún conjuro.');
    await fileStore.set(ARCHIVO, JSON.stringify(mapa));
    setManual(mapa);
    fill.style.width = '100%'; msg.textContent = `Listo en ${Math.round((performance.now() - t0) / 1000)} s.`;
    let cambios = [], h = null;
    if ($('#mnOficial').checked) h = S.edit(db => { cambios = oficializar(db); });
    else S.emit('manual');
    $('#mnRes').innerHTML = `<div class="fsum"><p><b>${n}</b> descripciones importadas de ${spells.length} conjuros leídos.</p>
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
    if (!confirm('¿Borrar de este dispositivo las descripciones importadas del manual?')) return;
    await fileStore.remove(ARCHIVO); setManual(null); estado(); S.emit('manual'); toast('Descripciones del manual borradas.');
  });
  $('#mnSoloNombres').addEventListener('click', () => {
    let cambios = []; const h = S.edit(db => { cambios = oficializar(db); });
    toast(cambios.length ? `${cambios.length} conjuros con su nombre oficial.` : 'Tus conjuros ya tenían los nombres oficiales.', cambios.length ? [undoBtn(S, h)] : []);
  });
}
