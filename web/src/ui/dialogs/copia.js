// Copia de seguridad: exportar e importar todos los personajes como JSON.
import { clone, esc } from '../../core/util.js';
import { burla } from '../../domain/validacion.js';
import { rechazar } from '../componentes/validacion.js';
import { personajeDeV1, normBd, importarPersonaje, ESQUEMA } from '../../domain/personaje/modelo.js';
import { enlazarCatalogo, invalidarItems } from '../../domain/conjuros/catalogo.js';
import { $ } from '../componentes/dom.js';
import { abrirDialogo, cerrarDialogo } from '../componentes/dialog.js';
import { toast, botonDeshacer } from '../componentes/toast.js';
import { compartirJson } from '../../platform/native.js';
import { avisar } from '../componentes/modal.js';

let S;
const name = () => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `grimorio-${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}.json`; };
export function abrirCopia() { $('#bkText').value = JSON.stringify(S.db); abrirDialogo($('#backupDlg')); }

export function cargarCopia(text) {
  if (!String(text ?? '').trim()) return rechazar($('#bkText'), 'vacio', { campo: 'Copia de seguridad' });
  let d; try { d = JSON.parse(text); } catch { d = null; }
  // Todo se prepara sobre una copia: si el archivo viene roto o manipulado, falla aquí sin tocar lo que ya hay
  let r = null;
  try { r = leerCopia(d); } catch { r = null; }
  if (!r) return avisar({ titulo: 'Esa copia no se puede leer', texto: `${burla('copia')} Usa el archivo o el texto completo tal como se guardó.`, icono: 'save' });
  invalidarItems(); S.editing = false; const h = S.replace(r.db); cerrarDialogo($('#backupDlg'));
  if (r.abierto) document.dispatchEvent(new CustomEvent('grimorio:abierto'));
  toast(r.msg, [botonDeshacer(S, h)]);
}
function leerCopia(d) {
  if (d?.schema === ESQUEMA && Array.isArray(d.chars) && d.catalog && typeof d.catalog === 'object') {
    const db = normBd(d); enlazarCatalogo(db);
    return { db, msg: `Copia cargada: ${db.chars.length === 1 ? '1 personaje' : db.chars.length + ' personajes'} y ${Object.keys(db.catalog).length} conjuros.` };
  }
  if (d?.tipo === 'grimorio-personaje' && d.personaje && typeof d.personaje === 'object') {
    const db = clone(S.db), nombre = importarPersonaje(db, d).nombre; normBd(db); enlazarCatalogo(db);
    return { db, abierto: true, msg: `<b>${esc(nombre)}</b> añadido a tus personajes.` };
  }
  if (d?.levels && d?.meta) {
    const db = clone(S.db), ch = personajeDeV1(db, d);
    if (db.chars.some(c => c.nombre === ch.nombre)) ch.nombre += ' (copia)';
    db.chars.push(ch); db.activeId = ch.id; normBd(db); enlazarCatalogo(db);
    return { db, msg: `Hoja antigua añadida como <b>${esc(ch.nombre)}</b>.` };
  }
  return null;
}
export function init(store) {
  S = store;
  $('#bkLoad').addEventListener('click', () => cargarCopia($('#bkText').value));
  $('#bkCopy').addEventListener('click', async () => {
    const t = $('#bkText'); t.value = JSON.stringify(S.db);
    try { await navigator.clipboard.writeText(t.value); } catch { t.select(); document.execCommand?.('copy'); }
    toast('Texto copiado.');
  });
  $('#bkSave').addEventListener('click', async () => {
    try { await compartirJson(name(), JSON.stringify(S.db, null, 1)); }
    catch (e) { if (!/cancel/i.test(String(e?.message))) toast('No se pudo guardar el archivo. Prueba con «Copiar texto».'); }
  });
  $('#bkOpen').addEventListener('click', () => $('#bkFile').click());
  $('#bkFile').addEventListener('change', e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { e.target.value = ''; cargarCopia(String(r.result)); }; r.readAsText(f); });
}
