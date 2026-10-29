// Copia de seguridad: exportar e importar todos los personajes como JSON, copias automáticas diarias en el dispositivo,
// fecha de la última copia, espacio usado y recordatorio cuando hace tiempo que no se hace ninguna.
import { clone, esc } from '../../core/util.js';
import { burla } from '../../domain/presentacion/validacion.js';
import { rechazar } from '../componentes/validacion.js';
import { personajeDeV1, normBd, importarPersonaje, ESQUEMA } from '../../domain/personaje/modelo.js';
import { enlazarCatalogo, invalidarItems } from '../../domain/conjuros/catalogo.js';
import { $ } from '../componentes/dom.js';
import { abrirDialogo, cerrarDialogo } from '../componentes/dialog.js';
import { toast, botonDeshacer } from '../componentes/toast.js';
import { compartirJson, almacen, archivos, espacioUsado, pedirPersistencia } from '../../platform/native.js';
import { avisar, confirmar } from '../componentes/modal.js';
import { diaDe, leerIndice, planAutomatica, recordatorioCopia, textoHace, formatoBytes, hayPersonajesPropios, MAX_AUTOMATICAS } from '../../domain/personaje/copias.js';

let S;
const ULTIMA = 'grimorio-ultima-copia', PRIMER_USO = 'grimorio-primer-uso', APLAZADA = 'grimorio-copia-aplazada', INDICE_AUTO = 'copias-auto.json';
const DIA = 864e5;
const name = () => `grimorio-${diaDe(Date.now())}.json`;
const fechaLarga = t => new Date(t).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export function abrirCopia() {
  $('#bkText').value = JSON.stringify(S.db); pintarEstado(); pintarAutomaticas(); abrirDialogo($('#backupDlg'));
  pedirPersistencia();
}
const marcarCopia = () => almacen.set(ULTIMA, String(Date.now())).then(pintarEstado);

async function pintarEstado() {
  const [ultima, espacio] = await Promise.all([almacen.get(ULTIMA), espacioUsado()]);
  const t = +ultima || 0, dias = t ? Math.floor((Date.now() - t) / DIA) : null;
  const tarde = dias == null || dias >= 14;
  $('#bkEstado').innerHTML = `<p class="bk-ultima${tarde ? ' tarde' : ''}">${t ? `Última copia: <b>${textoHace(dias)}</b> (${esc(fechaLarga(t))}).` : '<b>Aún no has guardado ninguna copia</b> desde este dispositivo.'}</p>
    ${espacio ? `<p class="note bk-espacio">Espacio usado por la app en este navegador: <b>${formatoBytes(espacio.usado)}</b>${espacio.total ? ` de ${formatoBytes(espacio.total)}` : ''}.${espacio.persistente ? ' El navegador no borrará estos datos por su cuenta.' : ' El navegador podría borrarlos si se queda sin espacio: guarda copias a menudo.'}</p>` : ''}`;
}

async function leerAutomaticas() { try { return leerIndice(await archivos.get(INDICE_AUTO)); } catch { return []; } }
async function pintarAutomaticas() {
  const L = await leerAutomaticas();
  $('#bkAuto').innerHTML = L.length ? `<h3 class="bk-h">Copias automáticas de este dispositivo</h3>
    <p class="note">La app guarda una al abrirse cada día que juegas y conserva las ${MAX_AUTOMATICAS} más recientes. Restaurar una sustituye a todos los personajes actuales (puedes deshacerlo).</p>
    <div class="lb-list">${L.map(e => `<div class="lb"><div class="lb-t"><b>${esc(fechaLarga(e.t))}</b><small>${pl(e.personajes, 'personaje', 'personajes')}${e.nombres.length ? `: ${e.nombres.map(esc).join(', ')}` : ''}</small></div>
      <button type="button" data-auto="${esc(e.archivo)}">Restaurar</button></div>`).join('')}</div>` : '';
}

export async function copiaAutomatica() {
  try {
    const indice = await leerAutomaticas(), plan = planAutomatica(indice, S.db);
    if (!plan) return;
    await archivos.set(plan.nueva.archivo, JSON.stringify(S.db));
    await archivos.set(INDICE_AUTO, JSON.stringify(plan.indice));
    for (const f of plan.borrar) await archivos.remove(f);
  } catch (e) { console.warn('No se pudo guardar la copia automática', e); }
}
async function restaurarAutomatica(archivo) {
  const e = (await leerAutomaticas()).find(x => x.archivo === archivo); if (!e) return;
  const si = await confirmar({ titulo: '¿Restaurar esta copia?', icono: 'save', ok: 'Restaurar', peligro: true,
    texto: `Vuelves a como estaban tus personajes el ${fechaLarga(e.t)}. Lo que hayas hecho después se pierde, salvo que pulses «Deshacer» justo después.` });
  if (!si) return;
  const raw = await archivos.get(archivo);
  if (!raw) return avisar({ titulo: 'Esa copia ya no está', texto: 'No se encuentra en el dispositivo. Prueba con otra o con un archivo guardado.', icono: 'save' });
  cargarCopia(raw);
}

export async function recordarCopia() {
  const [ultima, primer, aplazado] = await Promise.all([almacen.get(ULTIMA), almacen.get(PRIMER_USO), almacen.get(APLAZADA)]);
  if (!primer && hayPersonajesPropios(S.db)) { almacen.set(PRIMER_USO, String(Date.now())); return; }
  const r = recordatorioCopia({ db: S.db, ultima, primerUso: primer, aplazado });
  if (!r || document.querySelector('dialog[open]') || document.body.classList.contains('touring')) return;
  const si = await confirmar({ titulo: 'Toca hacer una copia', icono: 'save', ok: 'Hacer copia ahora', cancelar: 'Más tarde',
    texto: `${r.nunca ? 'Todavía no has guardado ninguna copia de tus personajes.' : `Tu última copia es de ${textoHace(r.dias)}.`} Si se borran los datos del navegador o cambias de móvil, una copia es lo único que los recupera.` });
  if (si) abrirCopia(); else almacen.set(APLAZADA, String(Date.now()));
}

export function cargarCopia(text) {
  if (!String(text ?? '').trim()) return rechazar($('#bkText'), 'vacio', { campo: 'Copia de seguridad' });
  let d; try { d = JSON.parse(text); } catch { d = null; }
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
    toast('Texto copiado. Pégalo en algún sitio seguro.'); marcarCopia();
  });
  $('#bkSave').addEventListener('click', async () => {
    try { await compartirJson(name(), JSON.stringify(S.db, null, 1)); marcarCopia(); }
    catch (e) { if (!/cancel/i.test(String(e?.message))) toast('No se pudo guardar el archivo. Prueba con «Copiar texto».'); }
  });
  $('#bkOpen').addEventListener('click', () => $('#bkFile').click());
  $('#bkAuto').addEventListener('click', e => { const b = e.target.closest('[data-auto]'); if (b) restaurarAutomatica(b.dataset.auto); });
  $('#bkFile').addEventListener('change', e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { e.target.value = ''; cargarCopia(String(r.result)); }; r.readAsText(f); });
}
