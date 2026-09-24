/**
 * Tema según clase y subclase: tono de acento (HSL) y emblema.
 * Los tokens de color derivan de --acc-h / --acc-s, así que cambiar de personaje recolorea toda la app.
 * El Adivino conserva el dorado de vela original.
 */
import { GI } from './gameIcons.js';
import { TEMAS, subclaseDe } from '../domain/clases2024.js';
import { setEscena } from './fondo.js';
import { paleta } from '../domain/paleta.js';

// Cada clase y cada subclase (Manual del Jugador y Héroes de Faerûn) tiene su tono y su emblema: domain/clases2024.js → TEMAS.
// Las subclases escritas a mano se reconocen por su patrón dentro de la clase.
const CLASE = TEMAS.clase;
const temaSub = ch => { const sc = subclaseDe(ch); return sc ? TEMAS.sub[sc.nombre] || null : null; };
// Sin personaje elegido (portada, biblioteca desde la portada…): gris plata, que no es el tono de ninguna clase ni subclase
// (la menos saturada es el Pícaro, con 20 %).
export const DEFECTO = { h: 220, s: 8, icono: 'libro' };

export function temaDe(ch) {
  if (!ch) return DEFECTO;
  const [h, s, icono] = CLASE[ch.clase] || [DEFECTO.h, DEFECTO.s, 'libro'];
  const m = temaSub(ch);
  return m ? { h: m[0], s: m[1], icono: m[2] || icono, clase: icono } : { h, s, icono, clase: icono };
}
/** Colorea la app con el personaje; mientras se ve la portada no hay personaje elegido y manda el tono neutro. */
export function aplicarTema(ch) {
  const t = temaDe(document.body.classList.contains('on-landing') ? null : ch), r = document.documentElement.style;
  if (r.getPropertyValue('--acc-h') !== String(t.h) || r.getPropertyValue('--acc-s') !== t.s + '%') { r.setProperty('--acc-h', t.h); r.setProperty('--acc-s', t.s + '%'); }
  // tinte de la estructura y luminosidad del acento según el tono (domain/paleta.js); el neutro apaga los tintes
  for (const [k, v] of Object.entries(paleta(t, t === DEFECTO))) if (r.getPropertyValue(k) !== v) r.setProperty(k, v);
  setEscena(t);
  return t;
}
/** Icono de game-icons como SVG en línea (toma el color del texto). */
export const gi = (nombre, cls = '') => (GI[nombre] ? `<svg class="gi ${cls}" viewBox="0 0 512 512" aria-hidden="true">${GI[nombre]}</svg>` : '');
