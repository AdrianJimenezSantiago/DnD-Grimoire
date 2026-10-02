import { esc } from '../../core/util.js';
import { openSheet, closeSheet } from '../componentes/dialog.js';
import { gi } from '../componentes/tema.js';

// Pregunta qué añadir al daño al impactar (maniobra, Castigo divino, Ataque furtivo…). Devuelve las opciones elegidas,
// [] para tirar sin nada, o null si se cierra sin tirar.
let dlg = null;
export function preguntarAlImpactar(ops, { arma = '' } = {}) {
  if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'modal hab-modal ai-modal'; dlg.setAttribute('aria-labelledby', 'aiTitle'); document.body.appendChild(dlg); }
  const d = dlg, sel = new Set();
  const grupos = [...new Set(ops.map(o => o.titulo))];
  return new Promise(resolve => {
    let hecho = false;
    const fin = v => { if (hecho) return; hecho = true; closeSheet(d); resolve(v); };
    const pintar = () => {
      d.innerHTML = `<h2 id="aiTitle">${gi('ca')}¿Algo más al impactar?</h2><p class="md-text">${esc(arma)}: lo que elijas se suma al daño y se gasta de tus recursos.</p>
        ${grupos.map(g => { const xs = ops.filter(o => o.titulo === g);
          return `<section class="ai-g"><h3>${esc(g)}${xs[0].grupo ? ' <small>elige uno</small>' : ''}</h3><div class="ai-ops">${xs.map(o => { const on = sel.has(o.k);
            return `<button type="button" class="ai-op ${on ? 'on' : ''}" data-aio="${esc(o.k)}" aria-pressed="${on}"><b>${esc(o.nombre)}</b>${o.dado ? `<span class="ai-dado">+${esc(o.dado)}</span>` : ''}${o.nota ? `<small>${esc(o.nota)}</small>` : ''}</button>`; }).join('')}</div></section>`; }).join('')}
        <div class="md-btns"><button type="button" data-aifin="nada">Solo el daño</button><button type="button" class="primary" data-aifin="si">${sel.size ? 'Gastar y tirar' : 'Tirar daño'}</button></div>`;
    };
    pintar();
    d.onclick = e => {
      const b = e.target.closest('[data-aio]');
      if (b) { const o = ops.find(x => x.k === b.dataset.aio);
        if (sel.has(o.k)) sel.delete(o.k); else { if (o.grupo) ops.filter(x => x.grupo === o.grupo).forEach(x => sel.delete(x.k)); sel.add(o.k); }
        return pintar(); }
      const f = e.target.closest('[data-aifin]');
      if (f) fin(f.dataset.aifin === 'si' ? ops.filter(o => sel.has(o.k)) : []);
    };
    d.oncancel = e => { e.preventDefault(); fin(null); };
    d.addEventListener('close', () => fin(null), { once: true });
    openSheet(d);
  });
}
