/** Trasfondo / historia del personaje: lectura con índice y búsqueda, edición e importación (PDF, TXT, Markdown). */
import { esc } from '../../core/util.js';
import { capitulos, textoAMarkdown, pdfAMarkdown } from '../../domain/historia.js';
import { $, on } from '../dom.js';
import { avatarHtml } from '../avatar.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { confirmar } from '../modal.js';
import { mdDoc } from '../mdDoc.js';
import { undoBtn } from '../../app/acciones.js';

let S, V = { editando: false, q: '' };
const dlg = () => $('#trasDlg');
const ch = () => S.cur();

function render() {
  const c = ch(); if (!c) return;
  const md = c.historia || '', caps = capitulos(md).filter(x => x.nivel <= 2);
  $('#trHead').innerHTML = `${avatarHtml(c, 'md')}<div><h2 id="trTitle">Historia de ${esc(c.nombre)}</h2><div class="dsub">${md ? `${caps.length} capítulos · ${Math.max(1, Math.round(md.split(/\s+/).length / 230))} min de lectura` : 'Trasfondo del personaje'}</div></div>`;
  $('#trTools').hidden = V.editando || !md;
  if (V.editando) {
    $('#trBody').innerHTML = `<p class="note">Escribe o pega la historia. <b>## Título</b> crea un capítulo, <b>### Título</b> un apartado, <b>---</b> un cambio de escena, <b>&gt;</b> al principio una cita, y el texto entre *asteriscos* va en cursiva.</p>
      <textarea id="trTxt" class="tr-edit" spellcheck="true">${esc(md)}</textarea>`;
    $('#trFoot').innerHTML = '<button type="button" data-tr="cancelar">Cancelar</button><span class="spacer"></span><button type="button" class="primary" data-tr="guardar">Guardar historia</button>';
    return;
  }
  $('#trToc').innerHTML = caps.map(x => `<button type="button" class="chip" data-toc="${x.id}">${esc(x.titulo)}</button>`).join('');
  if (!md) {
    $('#trBody').innerHTML = `<div class="tr-empty">${avatarHtml(c, 'lg')}<p>Aún no hay historia para ${esc(c.nombre)}.</p><p class="note">Escríbela aquí o impórtala desde un PDF, un texto o un Markdown. Se guarda con el personaje y viaja en las copias de seguridad.</p>
      <div class="row-btns" style="justify-content:center"><button type="button" data-tr="editar">Escribir</button><button type="button" class="gold" data-tr="importar">Importar archivo</button></div></div>`;
  } else {
    $('#trBody').innerHTML = `<article class="doc">${mdDoc(md, V.q)}</article>`;
    const n = $('#trBody').querySelectorAll('mark').length;
    $('#trCount').textContent = V.q.trim().length >= 2 ? (n ? `${n} ${n === 1 ? 'coincidencia' : 'coincidencias'}` : 'Sin coincidencias') : '';
  }
  $('#trFoot').innerHTML = `${md ? '<button type="button" class="warn" data-tr="borrar">Borrar</button>' : ''}<button type="button" data-tr="importar">Importar</button>${md ? '<button type="button" data-tr="editar">Editar</button>' : ''}<span class="spacer"></span><button type="button" class="primary" data-close>Cerrar</button>`;
}
export function openTrasfondo() { if (!ch()) return; V = { editando: false, q: '' }; $('#trQ').value = ''; render(); openSheet(dlg()); }

async function importar(file) {
  if (!file) return;
  let md = '';
  try {
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
      toast('Leyendo el PDF…');
      const { paginasSimples } = await import('../../app/pdf.js');
      md = pdfAMarkdown(await paginasSimples(file));
    } else {
      const txt = await file.text();
      md = /\.(md|markdown)$/i.test(file.name) || /^#{1,3}\s/m.test(txt) ? txt.trim() : textoAMarkdown(txt);
    }
  } catch (e) { toast('No se pudo leer ese archivo.'); return; }
  if (!md.trim()) { toast('El archivo no tiene texto que se pueda leer.'); return; }
  const c = ch();
  if (c.historia && !(await confirmar({ titulo: '¿Sustituir la historia?', texto: `${c.nombre} ya tiene una historia. La importada ocupará su lugar; podrás deshacerlo justo después.`, ok: 'Sustituir' }))) return;
  const h = S.edit((db, cc) => { cc.historia = md; });
  V.editando = false; render();
  toast(`Historia importada: ${capitulos(md).filter(x => x.nivel <= 2).length} capítulos. Revísala con «Editar» si algo no ha quedado bien.`, [undoBtn(S, h)]);
}
export function init(store) {
  S = store;
  on($('#trasDlg'), 'click', '[data-tr]', async (e, b) => {
    const a = b.dataset.tr;
    if (a === 'editar') { V.editando = true; render(); setTimeout(() => $('#trTxt')?.focus(), 60); }
    if (a === 'cancelar') { V.editando = false; render(); }
    if (a === 'guardar') { const txt = $('#trTxt').value; const h = S.edit((db, c) => { c.historia = txt.trim(); }); V.editando = false; render(); toast('Historia guardada.', [undoBtn(S, h)]); }
    if (a === 'importar') $('#trFile').click();
    if (a === 'borrar') { if (!(await confirmar({ titulo: '¿Borrar la historia?', texto: 'Se quita el texto de este personaje. Podrás deshacerlo justo después.', ok: 'Borrar', peligro: true }))) return;
      const h = S.edit((db, c) => { c.historia = ''; }); render(); toast('Historia borrada.', [undoBtn(S, h)]); }
  });
  on($('#trToc'), 'click', '[data-toc]', (e, b) => $('#doc-' + b.dataset.toc)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  $('#trQ').addEventListener('input', e => { V.q = e.target.value; render(); $('#trBody mark')?.scrollIntoView({ block: 'center' }); });
  $('#trFile').addEventListener('change', e => { const f = e.target.files?.[0]; e.target.value = ''; importar(f); });
}
