import { on } from '../componentes/dom.js';
import { abrirTermino } from './biblioteca.js';

export function init() {
  on(document, 'click', '[data-term]', (e, b) => { e.preventDefault(); e.stopPropagation(); abrirTermino(b.dataset.term, { apilar: true }); });
}
