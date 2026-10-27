// Calidad de los efectos (altos, medios, bajos): cuánto adorno se permite según el dispositivo y cómo va la app.
// - Nivel de partida: el que aprendió la última vez en este dispositivo o, la primera vez, una estimación con lo que el
//   navegador cuenta del equipo (memoria, núcleos, gráfica y píxeles de pantalla).
// - En automático mide de vez en cuando el ritmo de fotogramas (2 s cada 15 s, solo con la app a la vista) y baja un
//   nivel si va a tirones o sube cuando lleva tiempo sobrada (domain/presentacion/rendimiento.js decide). Con la batería
//   baja y sin cargar no pasa de medios.
// - Publica el nivel en <html data-efectos="alto|medio|bajo"> para el CSS y avisa a quien se suscriba (fondo animado).
//   Las chispas y los golpes preguntan al lanzarse con escalaEfectos().
// - Desde el menú se puede fijar a mano: entonces no se mide nada.
import { almacen } from '../../platform/native.js';
import { NIVELES, MEDIO, ALTO, nivelPorEquipo, veredicto, ajustar, estadoInicial } from '../../domain/presentacion/rendimiento.js';

const PREF = 'theo-grimorio-v1-efectos', APRENDIDO = PREF + '-auto';
const MUESTRA = 2000, CADA = 15000, PRIMERA = 6000;
export const MODOS = ['auto', ...NIVELES];

let modo = 'auto', estado = estadoInicial(MEDIO), nivel = -1, ahorro = false, guardado = '';
const subs = new Set();

export const nivelEfectos = () => nivel;
export const modoEfectos = () => modo;
// Cuántas partículas o adornos de un efecto se pintan: todos en altos, algo más de la mitad en medios y un tercio en bajos
export const escalaEfectos = n => Math.max(1, Math.round(n * ([0.35, 0.6, 1][nivel] ?? 1)));
export function alCambiarEfectos(fn) { subs.add(fn); if (nivel >= 0) fn(nivel); }

function aplicar() {
  const n = modo === 'auto' ? Math.min(estado.nivel, ahorro ? MEDIO : ALTO) : NIVELES.indexOf(modo);
  if (n === nivel) return;
  nivel = n;
  document.documentElement.dataset.efectos = NIVELES[n];
  for (const fn of subs) fn(n);
}
function guardar() {
  const v = JSON.stringify({ nivel: estado.nivel, fallos: estado.fallos });
  if (v !== guardado) { guardado = v; almacen.set(APRENDIDO, v); }
}

// ===== Lo que se sabe del equipo =====
function nombreGpu() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return '';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const n = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return String(n || '');
  } catch { return ''; }
}
export function equipo() {
  const dpr = window.devicePixelRatio || 1;
  return {
    memoria: navigator.deviceMemory, nucleos: navigator.hardwareConcurrency,
    pixeles: Math.round(screen.width * dpr) * Math.round(screen.height * dpr),
    gpu: nombreGpu(), tactil: matchMedia('(pointer: coarse)').matches,
  };
}

// ===== Muestreo de fotogramas =====
let reloj = 0, cuadro = 0;
function programar(ms = CADA) {
  clearTimeout(reloj); reloj = 0;
  if (modo === 'auto' && !document.hidden) reloj = setTimeout(muestrear, ms);
}
function muestrear() {
  const t = [], fin = performance.now() + MUESTRA;
  let prev = 0;
  const paso = ts => {
    if (prev) t.push(ts - prev);
    prev = ts;
    if (ts < fin) { cuadro = requestAnimationFrame(paso); return; }
    cuadro = 0;
    const v = veredicto(t);
    if (v) { estado = ajustar(estado, v, ahorro ? MEDIO : ALTO); guardar(); aplicar(); }
    programar();
  };
  cuadro = requestAnimationFrame(paso);
}
// En segundo plano no hay fotogramas: la muestra a medias no vale
function alVisibilidad() {
  if (cuadro) { cancelAnimationFrame(cuadro); cuadro = 0; }
  programar(document.hidden ? 0 : 3000);
}

export function fijarModoEfectos(m) {
  if (!MODOS.includes(m) || m === modo) return;
  modo = m; almacen.set(PREF, m);
  if (cuadro) { cancelAnimationFrame(cuadro); cuadro = 0; }
  aplicar(); programar(PRIMERA);
}

export async function initEfectos() {
  const [m, aprendido] = await Promise.all([almacen.get(PREF), almacen.get(APRENDIDO)]);
  if (MODOS.includes(m)) modo = m;
  let previo = null;
  try { previo = JSON.parse(aprendido || 'null'); } catch { /* dato viejo o roto: se vuelve a estimar */ }
  if (previo && NIVELES[previo.nivel]) { estado = estadoInicial(previo.nivel, previo.fallos); guardado = aprendido; }
  else { estado = estadoInicial(nivelPorEquipo(equipo())); guardar(); }
  aplicar();
  document.addEventListener('visibilitychange', alVisibilidad);
  programar(PRIMERA);
  navigator.getBattery?.().then(b => {
    const mira = () => { ahorro = !b.charging && b.level <= 0.2; aplicar(); };
    b.addEventListener('levelchange', mira); b.addEventListener('chargingchange', mira); mira();
  }).catch(() => {});
}
