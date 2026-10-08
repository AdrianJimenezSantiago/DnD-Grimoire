// Diálogos modales genéricos que devuelven una promesa: confirmar, avisar y pedir un texto.
import { esc } from '../../core/util.js';
import { gi } from './tema.js';
import { runaSvg } from '../animaciones/magia.js';
import { abrirDialogo, cerrarDialogo } from './dialog.js';
import { leerNumero } from '../../domain/validacion.js';
import { rechazar } from './validacion.js';

let dlg = null;
const EMBLEMA = { info: 'glosario', reset: 'md_borrar', book: 'libro', hourglass: 'md_tiempo', save: 'md_guardar', quill: 'md_pluma' };
function ensure() {
  if (dlg) return dlg;
  dlg = document.createElement('dialog'); dlg.id = 'modalDlg'; dlg.className = 'modal';
  dlg.setAttribute('aria-labelledby', 'mdTitle');
  document.body.appendChild(dlg);
  return dlg;
}
function abrir({ titulo, texto, icono = 'info', peligro = false, campo = null, botones }) {
  const d = ensure();
  return new Promise(resolve => {
    let hecho = false;
    const fin = v => { if (hecho) return; hecho = true; cerrarDialogo(d); resolve(v); };
    d.classList.toggle('danger', peligro);
    d.innerHTML = `<div class="md-icon">${runaSvg({ n: 14, lados: peligro ? 5 : 6, cls: 'md-runa', semillaInicial: titulo.length * 7 })}${gi(EMBLEMA[icono] || 'glosario')}</div><h2 id="mdTitle">${esc(titulo)}</h2>
      ${texto ? `<p class="md-text">${esc(texto)}</p>` : ''}
      ${campo ? `<input id="mdInput" type="${campo.tipo || 'text'}" inputmode="${campo.tipo === 'number' ? 'numeric' : 'text'}" value="${esc(campo.valor ?? '')}" ${campo.min != null ? `min="${campo.min}"` : ''} ${campo.max != null ? `max="${campo.max}"` : ''} aria-label="${esc(titulo)}">` : ''}
      <div class="md-btns">${botones.map((b, i) => `<button type="button" data-i="${i}" class="${b.cls || ''}">${esc(b.label)}</button>`).join('')}</div>`;
    // Un botón con «valida» no cierra la ventana hasta que lo escrito vale (la burla sale encima)
    const pulsar = b => { if (b.valida && !b.valida(d)) return; fin(b.valor(d)); };
    d.onclick = e => { const b = e.target.closest('[data-i]'); if (b) pulsar(botones[+b.dataset.i]); else if (e.target === d) fin(botones[0].valor(null)); };
    d.oncancel = e => { e.preventDefault(); fin(botones[0].valor(null)); };
    d.addEventListener('close', () => fin(botones[0].valor(null)), { once: true });
    abrirDialogo(d);
    const inp = d.querySelector('#mdInput');
    if (inp) { setTimeout(() => { inp.focus(); inp.select(); }, 60); inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); pulsar(botones[botones.length - 1]); } }; }
    else d.querySelector('.md-btns button:last-child')?.focus();
  });
}
export const confirmar = ({ titulo, texto, ok = 'Aceptar', cancelar = 'Cancelar', peligro = false, icono }) =>
  abrir({ titulo, texto, peligro, icono: icono || (peligro ? 'reset' : 'info'),
    botones: [{ label: cancelar, valor: () => false }, { label: ok, cls: peligro ? 'danger' : 'primary', valor: () => true }] });
export const avisar = ({ titulo, texto, ok = 'Entendido', icono = 'info' }) =>
  abrir({ titulo, texto, icono, botones: [{ label: ok, cls: 'primary', valor: () => true }] });
// numero: { min, max, decimal, obligatorio, tema } para comprobar lo escrito; con tipo 'number' se deduce de min y max.
export const pedir = ({ titulo, texto, valor = '', tipo = 'text', min, max, ok = 'Aceptar', numero = tipo === 'number' ? { min, max } : null }) =>
  abrir({ titulo, texto, icono: 'quill', campo: { valor, tipo, min, max },
    botones: [{ label: 'Cancelar', valor: () => null }, { label: ok, cls: 'primary', valor: d => (d ? d.querySelector('#mdInput').value : null),
      valida: numero && (d => { const i = d.querySelector('#mdInput'), r = leerNumero(i.value, numero); if (!r.ok) rechazar(i, r.motivo, { ...numero, campo: titulo, valor: i.value.trim() }); return r.ok; }) }] });
