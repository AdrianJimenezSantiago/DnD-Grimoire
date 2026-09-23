/** Copia de seguridad: archivo (compartir en Android), texto y carga de copias antiguas. */
import { esc } from '../../core/util.js';
import { charFromV1, normDb, SCHEMA } from '../../domain/modelo.js';
import { linkCatalog, invalidateItems } from '../../domain/catalogo.js';
import { $ } from '../dom.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { shareJson } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';

let S;
const name = () => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `grimorio-${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}.json`; };
export function openBackup() { $('#bkText').value = JSON.stringify(S.db); openSheet($('#backupDlg')); }

export function loadBackup(text) {
  let d; try { d = JSON.parse(text); } catch { d = null; }
  if (d?.schema === SCHEMA && Array.isArray(d.chars) && d.catalog) {
    const db = normDb(d); linkCatalog(db); invalidateItems();
    S.editing = false; const h = S.replace(db); closeSheet($('#backupDlg'));
    toast(`Copia cargada: ${d.chars.length === 1 ? '1 personaje' : d.chars.length + ' personajes'} y ${Object.keys(db.catalog).length} conjuros.`, [undoBtn(S, h)]); return;
  }
  if (d?.levels && d?.meta) {
    let nombre = '';
    const h = S.edit(db => { const ch = charFromV1(db, d); if (db.chars.some(c => c.nombre === ch.nombre)) ch.nombre += ' (copia)'; nombre = ch.nombre; db.chars.push(ch); db.activeId = ch.id; normDb(db); linkCatalog(db); });
    invalidateItems(); closeSheet($('#backupDlg'));
    toast(`Hoja antigua añadida como <b>${esc(nombre)}</b>.`, [undoBtn(S, h)]); return;
  }
  alert('Eso no es una copia válida del grimorio. Usa el archivo o el texto completo tal como se guardó.');
}
export function init(store) {
  S = store;
  $('#bkLoad').addEventListener('click', () => loadBackup($('#bkText').value));
  $('#bkCopy').addEventListener('click', async () => {
    const t = $('#bkText'); t.value = JSON.stringify(S.db);
    try { await navigator.clipboard.writeText(t.value); } catch { t.select(); document.execCommand?.('copy'); }
    toast('Texto copiado.');
  });
  $('#bkSave').addEventListener('click', async () => {
    try { await shareJson(name(), JSON.stringify(S.db, null, 1)); }
    catch (e) { if (!/cancel/i.test(String(e?.message))) toast('No se pudo guardar el archivo. Prueba con «Copiar texto».'); }
  });
  $('#bkOpen').addEventListener('click', () => $('#bkFile').click());
  $('#bkFile').addEventListener('change', e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { e.target.value = ''; loadBackup(String(r.result)); }; r.readAsText(f); });
}
