// Copia de seguridad: exportar e importar todos los personajes como JSON.
import { esc } from '../../core/util.js';
import { charFromV1, normDb, importarPersonaje, SCHEMA } from '../../domain/personaje/modelo.js';
import { linkCatalog, invalidateItems } from '../../domain/conjuros/catalogo.js';
import { $ } from '../componentes/dom.js';
import { openSheet, closeSheet } from '../componentes/dialog.js';
import { toast, undoBtn } from '../componentes/toast.js';
import { shareJson } from '../../platform/native.js';
import { avisar } from '../componentes/modal.js';

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
  if (d?.tipo === 'grimorio-personaje' && d.personaje) {
    let nombre = '';
    const h = S.edit(db => {
      nombre = importarPersonaje(db, d).nombre; normDb(db); linkCatalog(db);
    });
    invalidateItems(); closeSheet($('#backupDlg'));
    document.dispatchEvent(new CustomEvent('grimorio:abierto'));
    toast(`<b>${esc(nombre)}</b> añadido a tus personajes.`, [undoBtn(S, h)]); return;
  }
  if (d?.levels && d?.meta) {
    let nombre = '';
    const h = S.edit(db => { const ch = charFromV1(db, d); if (db.chars.some(c => c.nombre === ch.nombre)) ch.nombre += ' (copia)'; nombre = ch.nombre; db.chars.push(ch); db.activeId = ch.id; normDb(db); linkCatalog(db); });
    invalidateItems(); closeSheet($('#backupDlg'));
    toast(`Hoja antigua añadida como <b>${esc(nombre)}</b>.`, [undoBtn(S, h)]); return;
  }
  avisar({ titulo: 'Esa copia no se puede leer', texto: 'No es una copia válida del grimorio. Usa el archivo o el texto completo tal como se guardó.', icono: 'save' });
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
