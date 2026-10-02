import { GI } from './gameIcons.js';
import { TEMAS, subclaseDe } from '../../domain/clases/clases2024.js';
import { setEscena } from '../animaciones/fondo.js';
import { paleta } from '../../domain/presentacion/paleta.js';

const CLASE = TEMAS.clase;
const temaSub = ch => { const sc = subclaseDe(ch); return sc ? TEMAS.sub[sc.nombre] || null : null; };
export const DEFECTO = { h: 220, s: 8, icono: 'libro' };
export const PORTADA = { h: 40, s: 62, icono: 'portada' };

export function temaDe(ch) {
  if (!ch) return DEFECTO;
  const [h, s, icono] = CLASE[ch.clase] || [DEFECTO.h, DEFECTO.s, 'libro'];
  const m = temaSub(ch);
  return m ? { h: m[0], s: m[1], icono: m[2] || icono, clase: icono } : { h, s, icono, clase: icono };
}
export function aplicarTema(ch) {
  const t = document.body.classList.contains('on-landing') ? PORTADA : temaDe(ch), r = document.documentElement.style;
  if (r.getPropertyValue('--acc-h') !== String(t.h) || r.getPropertyValue('--acc-s') !== t.s + '%') { r.setProperty('--acc-h', t.h); r.setProperty('--acc-s', t.s + '%'); }
  for (const [k, v] of Object.entries(paleta(t, t === DEFECTO))) if (r.getPropertyValue(k) !== v) r.setProperty(k, v);
  setEscena(t);
  return t;
}
export const gi = (nombre, cls = '') => (GI[nombre] ? `<svg class="gi ${cls}" viewBox="0 0 512 512" aria-hidden="true">${GI[nombre]}</svg>` : '');
