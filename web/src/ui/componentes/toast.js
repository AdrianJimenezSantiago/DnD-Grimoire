// Avisos breves en la parte inferior de la pantalla, con botones de acción como «Deshacer».
import { $ } from './dom.js';
import { alFrente } from '../animaciones/fx.js';
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
  box.style.setProperty('--dura', dura + 'ms');
  if (document.querySelector('dialog[open]')) alFrente(box);
  box.classList.remove('arde'); void box.offsetWidth; box.classList.add('show', 'arde');
  clearTimeout(timer); timer = setTimeout(ocultarToast, dura);
}
export const ocultarToast = () => $('#toast').classList.remove('show');
export const toastAbierto = () => $('#toast').classList.contains('show');
export const botonDeshacer = (S, h) => ({ label: 'Deshacer', fn: () => S.undo(h) });
