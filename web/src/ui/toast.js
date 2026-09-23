/** Aviso inferior con acciones (Deshacer, Adivino avezado…). */
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
