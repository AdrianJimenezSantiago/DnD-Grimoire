/**
 * Tema según clase y subclase: tono de acento (HSL) y emblema.
 * Los tokens de color derivan de --acc-h / --acc-s, así que cambiar de personaje recolorea toda la app.
 * El Adivino conserva el dorado de vela original.
 */
import { GI } from './gameIcons.js';
import { norm } from '../core/util.js';

const CLASE = {
  'Bárbaro': [12, 78, 'barbaro'], 'Bardo': [318, 62, 'bardo'], 'Brujo': [272, 58, 'brujo'], 'Clérigo': [44, 80, 'clerigo'],
  'Druida': [105, 48, 'druida'], 'Explorador': [150, 45, 'explorador'], 'Guerrero': [205, 30, 'guerrero'], 'Hechicero': [352, 70, 'hechicero'],
  'Mago': [222, 68, 'mago'], 'Monje': [172, 52, 'monje'], 'Paladín': [196, 66, 'paladin'], 'Pícaro': [240, 20, 'picaro'],
};
// [patrón, tono, saturación, icono]
const SUB = [
  [/adivin/, 40, 78, 'adivino'], [/evoca/, 18, 80, 'evocador'], [/abjur/, 205, 62, 'abjurador'], [/ilusion/, 285, 52, 'ilusionista'],
  [/drac/, 8, 74, 'draconica'], [/mecan/, 38, 36, 'mecanica'], [/aberra/, 290, 45, 'aberrante'], [/salvaje/, 330, 70, 'salvaje'],
  [/celestial/, 48, 82, 'celestial'], [/infernal/, 4, 70, 'infernal'], [/feeric/, 150, 58, 'feerico'], [/primigenio/, 182, 40, null],
  [/\bluz\b/, 48, 86, 'luz'], [/vida/, 140, 48, 'vida'], [/guerra\b/, 0, 58, null], [/engano/, 300, 45, 'sombra'],
  [/luna/, 230, 42, 'luna'], [/tierra/, 92, 44, 'tierra'], [/estrellas/, 248, 55, 'estrellas'], [/\bmar\b/, 192, 60, null],
  [/sombra|penumbra/, 250, 30, 'sombra'],
];
export const DEFECTO = { h: 40, s: 78, icono: 'libro' };

export function temaDe(ch) {
  if (!ch) return DEFECTO;
  const [h, s, icono] = CLASE[ch.clase] || [DEFECTO.h, DEFECTO.s, 'libro'];
  const sub = norm(ch.subclase || '');
  const m = sub && SUB.find(([re]) => re.test(sub));
  return m ? { h: m[1], s: m[2], icono: m[3] || icono, clase: icono } : { h, s, icono, clase: icono };
}
export function aplicarTema(ch) {
  const t = temaDe(ch), r = document.documentElement.style;
  if (r.getPropertyValue('--acc-h') !== String(t.h)) { r.setProperty('--acc-h', t.h); r.setProperty('--acc-s', t.s + '%'); }
  return t;
}
/** Icono de game-icons como SVG en línea (toma el color del texto). */
export const gi = (nombre, cls = '') => (GI[nombre] ? `<svg class="gi ${cls}" viewBox="0 0 512 512" aria-hidden="true">${GI[nombre]}</svg>` : '');
