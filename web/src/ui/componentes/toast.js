// Avisos breves en la parte inferior de la pantalla, con botones de acción como «Deshacer».
import { $ } from './dom.js';
let timer = null;
export function toast(msg, actions = []) {
  const box = $('#toast');
  $('#toastMsg').innerHTML = msg;
  const acts = $('#toastActs'); acts.innerHTML = '';
  actions.filter(Boolean).forEach(a => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = a.label; if (a.hl) b.className = 'hl';
    b.addEventListener('click', () => { hideToast(); a.fn(); }); acts.appendChild(b);
  });
  box.classList.add('show');
  clearTimeout(timer); timer = setTimeout(hideToast, actions.length ? 7000 : 3200);
}
export const hideToast = () => $('#toast').classList.remove('show');
export const toastOpen = () => $('#toast').classList.contains('show');
// Botón «Deshacer» para un aviso: h es lo que devuelven S.act, S.edit o S.replace.
export const undoBtn = (S, h) => ({ label: 'Deshacer', fn: () => S.undo(h) });
