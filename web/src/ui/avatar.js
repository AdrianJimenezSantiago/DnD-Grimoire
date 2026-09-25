import { esc } from '../core/util.js';
import { gi, temaDe } from './tema.js';
export const avatarHtml = (ch, cls = '') => {
  if (ch?.retrato?.src) return `<span class="avatar has-img ${cls}"><img src="${ch.retrato.src}" alt="Retrato de ${esc(ch.nombre || '')}" decoding="async"></span>`;
  return `<span class="avatar ${cls}">${gi(temaDe(ch).icono)}</span>`;
};
