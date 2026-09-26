import { burst, reducedMotion } from './fx.js';
import { mediaDist, maxDist } from '../domain/dados.js';
import { haptic } from '../platform/native.js';

// Animación de impacto cuando una tirada de daño o curación sale por encima de la media.
// La forma depende del tipo de daño (y así del arma o de la escuela del conjuro).
const COLOR = { cortante: '#FF6B57', contundente: '#FFB36B', perforante: '#FFE08A', fuego: '#FF7A2E', frio: '#8FD8FF', relampago: '#9EC5FF', trueno: '#C7B8FF',
  acido: '#A6F05A', veneno: '#7BD66A', necrotico: '#A77BE0', radiante: '#FFE9A0', psiquico: '#F08BD8', fuerza: '#B59CFF', curacion: '#6EE0A0' };
const LEMA = { cortante: 'Tajo brutal', contundente: 'Golpe demoledor', perforante: 'Estocada certera', fuego: 'Infierno', frio: 'Escarcha mortal', relampago: 'Descarga',
  trueno: 'Estruendo', acido: 'Corrosión', veneno: 'Veneno letal', necrotico: 'Toque de la muerte', radiante: 'Luz cegadora', psiquico: 'Mente rota', fuerza: 'Impacto arcano', curacion: 'Curación plena' };
const TITULO = { bueno: ['Buen golpe', 'Buena curación'], fuerte: ['Golpe contundente', 'Gran curación'] };
const r = (a, b) => a + Math.random() * (b - a);

export function nivelImpacto(total, dist) {
  if (!dist) return '';
  const med = mediaDist(dist), max = maxDist(dist);
  if (!(total > med) || max <= med) return '';
  const k = (total - med) / (max - med);
  return total >= max || k >= 0.72 ? 'epico' : k >= 0.3 ? 'fuerte' : 'bueno';
}

function forma(clave) {
  const S = (inner, cls = '') => `<svg class="ip-svg ${cls}" viewBox="0 0 100 100" preserveAspectRatio="none">${inner}</svg>`;
  switch (clave) {
    case 'cortante': return S([0, 1, 2].map(i => { const y = 30 + i * 18 + r(-5, 5); return `<path class="ip-trazo" style="animation-delay:${i * 70}ms" d="M-5 ${y + 18} L105 ${y - 18}" pathLength="1"/>`; }).join(''));
    case 'perforante': return S(`<path class="ip-trazo fino" d="M-5 50 L100 ${r(46, 54)}" pathLength="1"/><circle class="ip-chispa" cx="92" cy="50" r="4"/>`);
    case 'relampago': return S(`<path class="ip-trazo rayo" d="M${r(40, 60)} -5 L45 30 L58 34 L40 64 L55 67 L38 105" pathLength="1"/>`);
    case 'contundente': case 'trueno': case 'fuerza': case 'psiquico':
      return `<i class="ip-onda"></i><i class="ip-onda b"></i><i class="ip-onda c"></i>${clave === 'contundente' ? S(Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.283 + r(-.3, .3); return `<path class="ip-trazo fino" d="M50 50 L${50 + Math.cos(a) * 46} ${50 + Math.sin(a) * 46}" pathLength="1"/>`; }).join(''), 'grietas') : ''}`;
    case 'radiante': return `<i class="ip-rayos"></i><i class="ip-onda"></i>`;
    case 'frio': return Array.from({ length: 9 }, (_, i) => `<i class="ip-cristal" style="--a:${i * 40 + r(-12, 12)}deg;--d:${r(40, 80) | 0}px;animation-delay:${i * 25}ms"></i>`).join('');
    case 'acido': case 'veneno': return Array.from({ length: 8 }, () => `<i class="ip-gota" style="left:${r(15, 85)}%;animation-delay:${r(0, 250) | 0}ms"></i>`).join('');
    case 'necrotico': return `<i class="ip-sombra"></i><i class="ip-onda inversa"></i>`;
    case 'curacion': return `<i class="ip-halo"></i>${Array.from({ length: 12 }, () => `<i class="ip-mota" style="left:${r(10, 90)}%;animation-delay:${r(0, 400) | 0}ms"></i>`).join('')}`;
    default: return `<i class="ip-onda"></i>`;
  }
}

export function fxImpacto(el, { clave = 'fuerza', nivel = '', cura = false, caja = null } = {}) {
  if (!el || !nivel) return;
  const k = cura ? 'curacion' : (COLOR[clave] ? clave : 'fuerza');
  haptic(nivel === 'epico' ? 'heavy' : 'medium');
  if (reducedMotion()) return;
  const capa = document.createElement('div');
  capa.className = `ip-fx ip-${k} ip-${nivel}`; capa.setAttribute('aria-hidden', 'true'); capa.style.setProperty('--ip', COLOR[k]);
  const titulo = nivel === 'epico' ? LEMA[k] : TITULO[nivel][cura ? 1 : 0];
  capa.innerHTML = `${forma(k)}<b class="ip-lema">¡${titulo}!</b>`;
  el.style.position ||= 'relative'; el.appendChild(capa);
  const box = el.getBoundingClientRect(), x = box.left + box.width / 2, y = box.top + Math.min(box.height / 2, 70);
  const fuerza = { bueno: .5, fuerte: 1, epico: 1.8 }[nivel];
  burst(x, y, cura ? { color: COLOR[k], n: 18 * fuerza, speed: 1.6, up: 3, life: 1300, size: 2, gravity: -.05 }
    : { color: COLOR[k], n: 20 * fuerza, speed: 2.4 + 2.2 * fuerza, up: k === 'fuego' ? 2.6 : .8, life: 900 + 250 * fuerza, size: 2 + .4 * fuerza, gravity: k === 'fuego' || k === 'radiante' ? -.05 : .05 });
  if (nivel === 'epico' && caja) { caja.classList.remove('ip-sacude'); void caja.offsetWidth; caja.classList.add(cura ? 'ip-brilla' : 'ip-sacude'); setTimeout(() => caja.classList.remove('ip-sacude', 'ip-brilla'), 700); }
  setTimeout(() => capa.remove(), nivel === 'epico' ? 2400 : 2000);
}
