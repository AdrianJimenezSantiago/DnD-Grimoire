// Retrato del personaje (o su emblema de clase) en miniatura.
import { esc } from '../../core/util.js';
import { gi, temaDe } from './tema.js';
import { esYo } from '../../domain/combate/vida.js';
export const avatarHtml = (ch, cls = '') => {
  if (ch?.retrato?.src) return `<span class="avatar has-img ${cls}"><img src="${ch.retrato.src}" alt="Retrato de ${esc(ch.nombre || '')}" decoding="async"></span>`;
  return `<span class="avatar ${cls}">${gi(temaDe(ch).icono)}</span>`;
};

// Chip con tu retrato para marcarte o desmarcarte como objetivo (también en la hoja y en la tirada)
export function botonYo(ch, lista, attrs) {
  const on = (lista || []).some(o => esYo(ch, o));
  return `<button type="button" class="obj-yo ${on ? 'on' : ''}" ${attrs} aria-pressed="${on}" title="${on ? 'Quitarte de los objetivos' : 'Incluirte entre los objetivos'}">${avatarHtml(ch, 'obj-yo-av')}<span>${on ? 'Tú' : 'Soy yo'}</span></button>`;
}
