import { $ } from '../dom.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { confirmar } from '../modal.js';
import { fileStore } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';

const MINI = 320, MAXORIG = 1280;
let S, E = null;
const dlg = () => $('#retDlg');
const archivo = id => `retrato-${id}.txt`;

const cargarImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
function reducir(img, max) {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88);
}
const base = lado => lado / Math.min(E.iw, E.ih);
function limitar(lado) {
  E.z = Math.max(1, Math.min(6, E.z));
  const s = base(lado) * E.z, mx = lado / 2 / s;
  E.cx = Math.max(mx, Math.min(E.iw - mx, E.cx)); E.cy = Math.max(mx, Math.min(E.ih - mx, E.cy));
}
function pintar(canvas, lado) {
  const ctx = canvas.getContext('2d'), s = base(lado) * E.z;
  ctx.clearRect(0, 0, lado, lado);
  ctx.drawImage(E.img, lado / 2 - E.cx * s, lado / 2 - E.cy * s, E.iw * s, E.ih * s);
}
function dibujar() {
  const c = $('#retCanvas'), dpr = Math.min(2, devicePixelRatio || 1), lado = c.clientWidth;
  if (c.width !== Math.round(lado * dpr)) { c.width = c.height = Math.round(lado * dpr); }
  c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!E?.img) { c.getContext('2d').clearRect(0, 0, lado, lado); return; }
  limitar(lado); pintar(c, lado);
  $('#retZoom').value = E.z;
}
function estadoUi() {
  const hay = !!E?.img;
  $('#retVacio').hidden = hay; $('#retStage').classList.toggle('empty', !hay);
  $('#retZoom').disabled = !hay; $('#retGuardar').disabled = !hay;
  $('#retQuitar').hidden = !S.db.chars.find(c => c.id === E.id)?.retrato;
}
async function usarFuente(src, params) {
  const img = await cargarImg(src);
  E.img = img; E.iw = img.naturalWidth; E.ih = img.naturalHeight;
  E.z = params?.z || 1; E.cx = (params?.x ?? 0.5) * E.iw; E.cy = (params?.y ?? 0.5) * E.ih;
  estadoUi(); requestAnimationFrame(dibujar);
}
export async function openRetrato(id) {
  const ch = S.db.chars.find(c => c.id === id); if (!ch) return;
  E = { id, img: null, nueva: false, dataOrig: null };
  $('#retTitle').textContent = `Retrato de ${ch.nombre}`;
  estadoUi(); openSheet(dlg());
  if (ch.retrato) {
    const orig = await fileStore.get(archivo(id));
    await usarFuente(orig || ch.retrato.src, orig ? ch.retrato : { x: .5, y: .5, z: 1 });
  } else requestAnimationFrame(dibujar);
}
async function elegir(file) {
  if (!file || !/^image\//.test(file.type)) { toast('Elige un archivo de imagen (JPG, PNG, WebP…).'); return; }
  const url = URL.createObjectURL(file);
  try { const img = await cargarImg(url); E.dataOrig = reducir(img, MAXORIG); E.nueva = true; await usarFuente(E.dataOrig, null); }
  catch { toast('No se pudo leer esa imagen.'); }
  finally { URL.revokeObjectURL(url); }
}
async function guardar() {
  const c = document.createElement('canvas'); c.width = c.height = MINI;
  const lado = $('#retCanvas').clientWidth, k = MINI / lado, s0 = { ...E };
  const ctx = c.getContext('2d'), s = base(lado) * E.z * k;
  ctx.drawImage(E.img, MINI / 2 - E.cx * s, MINI / 2 - E.cy * s, E.iw * s, E.ih * s);
  let src = c.toDataURL('image/webp', 0.86); if (!src.startsWith('data:image/webp')) src = c.toDataURL('image/jpeg', 0.86);
  if (E.nueva) await fileStore.set(archivo(E.id), E.dataOrig);
  const retrato = { src, x: s0.cx / s0.iw, y: s0.cy / s0.ih, z: s0.z, v: Date.now() };
  const h = S.edit(db => { db.chars.find(c2 => c2.id === E.id).retrato = retrato; });
  closeSheet(dlg()); toast('Retrato guardado.', [undoBtn(S, h)]);
}
async function quitar() {
  const ch = S.db.chars.find(c => c.id === E.id);
  if (!(await confirmar({ titulo: '¿Quitar el retrato?', texto: `${ch.nombre} volverá a mostrar el emblema de su clase.`, ok: 'Quitar', peligro: true }))) return;
  const h = S.edit(db => { db.chars.find(c2 => c2.id === E.id).retrato = null; });
  closeSheet(dlg()); toast('Retrato quitado.', [undoBtn(S, h)]);
}
export function init(store) {
  S = store;
  const stage = $('#retStage'), ptrs = new Map(); let ult = null, dist0 = 0, z0 = 1;
  stage.addEventListener('pointerdown', e => { if (!E?.img) return; stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); ult = [e.clientX, e.clientY];
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = E.z; } });
  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId) || !E?.img) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    const lado = $('#retCanvas').clientWidth;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; E.z = z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / (dist0 || 1); }
    else { const s = base(lado) * E.z; E.cx -= (e.clientX - ult[0]) / s; E.cy -= (e.clientY - ult[1]) / s; ult = [e.clientX, e.clientY]; }
    dibujar();
  });
  const fin = e => { ptrs.delete(e.pointerId); ult = ptrs.size ? [...ptrs.values()][0] : null; };
  stage.addEventListener('pointerup', fin); stage.addEventListener('pointercancel', fin);
  stage.addEventListener('wheel', e => { if (!E?.img) return; e.preventDefault(); E.z *= e.deltaY < 0 ? 1.08 : 1 / 1.08; dibujar(); }, { passive: false });
  $('#retZoom').addEventListener('input', e => { if (!E?.img) return; E.z = +e.target.value; dibujar(); });
  $('#retElegir').addEventListener('click', () => $('#retFile').click());
  $('#retVacio').addEventListener('click', () => $('#retFile').click());
  $('#retFile').addEventListener('change', e => { const f = e.target.files?.[0]; e.target.value = ''; elegir(f); });
  $('#retGuardar').addEventListener('click', guardar);
  $('#retQuitar').addEventListener('click', quitar);
  addEventListener('resize', () => { if (dlg().open) dibujar(); });
}
