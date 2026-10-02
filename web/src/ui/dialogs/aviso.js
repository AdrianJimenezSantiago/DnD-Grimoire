// Diálogo de aviso con secciones e iconos: lo que se recupera al descansar, lo que termina al pasar la ronda…
import { esc } from '../../core/util.js';
import { $, on } from '../componentes/dom.js';
import { gi } from '../componentes/tema.js';
import { runaSvg } from '../animaciones/magia.js';
import { abrirDialogo, cerrarDialogo } from '../componentes/dialog.js';

let acciones = [];
const dlg = () => $('#avisoDlg');

const item = i => `<li class="av-it ${i.tono || ''}" ${i.hue != null ? `style="--av-h:${i.hue}"` : ''}>${gi(i.ico || 'libro', 'av-it-ico')}
  <span class="av-it-t"><b>${esc(i.titulo)}${i.fuente ? `<small>${esc(i.fuente)}</small>` : ''}</b>${i.texto ? `<span>${esc(i.texto)}</span>` : ''}</span></li>`;

export function avisar({ ico = 'vela', tono = 'oro', titulo, sub = '', secciones = [], botones = [] }) {
  const d = dlg(); if (!d) return;
  if (d.open) d.close();
  acciones = botones;
  d.dataset.tono = tono;
  $('#avHead').innerHTML = `<span class="av-emb" aria-hidden="true">${runaSvg({ n: 14, lados: 6, cls: 'av-runa', semillaInicial: titulo.length * 7 })}${gi(ico)}</span>
    <div class="av-tt"><h2 id="avTitle">${esc(titulo)}</h2>${sub ? `<p class="av-sub">${sub}</p>` : ''}</div>`;
  $('#avBody').innerHTML = secciones.filter(s => s.items?.length || s.html || s.nota).map(s => `<section class="av-sec ${s.cls || ''}">${s.titulo ? `<h3>${s.ico ? gi(s.ico) : ''}${esc(s.titulo)}</h3>` : ''}
    ${s.nota ? `<p class="av-nota">${esc(s.nota)}</p>` : ''}${s.items?.length ? `<ul class="av-lista">${s.items.map(item).join('')}</ul>` : ''}${s.html || ''}</section>`).join('');
  $('#avFoot').innerHTML = `${botones.map((b, k) => `<button type="button" data-avb="${k}" class="${b.cls || ''}">${esc(b.label)}</button>`).join('')}<span class="spacer"></span><button type="button" class="gold" data-close>${esc(botones.cierre || 'Entendido')}</button>`;
  abrirDialogo(d);
}

export function init() {
  on($('#avFoot'), 'click', '[data-avb]', (e, b) => { const a = acciones[+b.dataset.avb]; if (!a) return; if (!a.quedarse) cerrarDialogo(dlg()); a.fn?.(); });
}
