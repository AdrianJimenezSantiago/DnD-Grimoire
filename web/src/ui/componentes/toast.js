// Avisos breves en la parte inferior de la pantalla, con botones de acción como «Deshacer».
import { $ } from './dom.js';
let timer = null;
export function toast(msg, actions = []) {
  const box = $('#toast');
  $('#toastMsg').innerHTML = msg;
  const acts = $('#toastActs'); acts.innerHTML = '';
  actions.filter(Boolean).forEach(a => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = a.label; if (a.hl) b.className = 'hl';
    b.addEventListener('click', () => { ocultarToast(); a.fn(); }); acts.appendChild(b);
  });
  const dura = actions.length ? 7000 : 3200;
  // La mecha de abajo se consume en lo que dura el aviso; se reinicia con cada aviso nuevo
  box.style.setProperty('--dura', dura + 'ms');
  box.classList.remove('arde'); void box.offsetWidth; box.classList.add('show', 'arde');
  clearTimeout(timer); timer = setTimeout(ocultarToast, dura);
}
export const ocultarToast = () => $('#toast').classList.remove('show');
export const toastAbierto = () => $('#toast').classList.contains('show');
// Botón «Deshacer» para un aviso: h es lo que devuelven S.act, S.edit o S.replace.
export const botonDeshacer = (S, h) => ({ label: 'Deshacer', fn: () => S.undo(h) });
