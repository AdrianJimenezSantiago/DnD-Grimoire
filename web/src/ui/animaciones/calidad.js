// Calidad de los efectos (alto, medio, bajo) según el dispositivo y el ritmo de fotogramas; se publica en <html data-efectos>.
import { almacen } from '../../platform/native.js';
import { NIVELES, MEDIO, ALTO, nivelPorEquipo, veredicto, ajustar, estadoInicial } from '../../domain/presentacion/rendimiento.js';

const PREF = 'theo-grimorio-v1-efectos', APRENDIDO = PREF + '-auto';
const MUESTRA = 2000, CADA = 15000, PRIMERA = 6000;
export const MODOS = ['auto', ...NIVELES];

let modo = 'auto', estado = estadoInicial(MEDIO), nivel = -1, ahorro = false, guardado = '';
const subs = new Set();

export const nivelEfectos = () => nivel;
export const modoEfectos = () => modo;
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
  try { previo = JSON.parse(aprendido || 'null'); } catch {}
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
