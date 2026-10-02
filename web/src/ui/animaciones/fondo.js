import { tinteDe } from '../../domain/presentacion/paleta.js';
import { reducedMotion } from './fx.js';
import FondoWorker from './fondoWorker.js?worker&inline';

const ESCENA = {
  adivino: 'astral', mago: 'astral', estrellas: 'astral', luna: 'astral', libro: 'astral', lunabardo: 'astral', conocimiento: 'astral', invernal: 'astral',
  evocador: 'ascuas', hechicero: 'ascuas', draconica: 'ascuas', barbaro: 'ascuas', infernal: 'ascuas', berserker: 'ascuas', fuegomagico: 'ascuas', elementos: 'ascuas', venganza: 'ascuas',
  brujo: 'vacio', aberrante: 'vacio', sombra: 'vacio', picaro: 'vacio', primigenio: 'vacio', engano: 'vacio', acechador: 'vacio', psionico: 'vacio',
  asesino: 'vacio', ladron: 'vacio', rebanaalmas: 'vacio', vastago: 'vacio',
  clerigo: 'halo', luz: 'halo', celestial: 'halo', paladin: 'halo', vida: 'halo', fanatico: 'halo', abanderado: 'halo', entrega: 'halo', gloria: 'halo',
  druida: 'arboleda', explorador: 'arboleda', tierra: 'arboleda', feerico: 'arboleda', arbol: 'arboleda', corazon: 'arboleda', cazador: 'arboleda',
  errante: 'arboleda', bestias: 'arboleda', antiguos: 'arboleda',
  bardo: 'cancion', danza: 'cancion', saber: 'cancion', glamour: 'cancion', valor: 'cancion',
  monje: 'calma', manoabierta: 'calma', misericordia: 'calma', mar: 'calma',
  guerrero: 'forja', mecanica: 'forja', guerra: 'forja', campeon: 'forja', maestro: 'forja',
  portada: 'nexo',
  abjurador: 'guarda', caballero: 'guarda', ilusionista: 'prisma', salvaje: 'prisma', hojacantante: 'prisma', genios: 'prisma', embaucador: 'prisma',
};
export const escenaDe = t => ESCENA[t?.icono] || ESCENA[t?.clase] || 'astral';

const oscuro = () => {
  const r = document.documentElement;
  return r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

// El dibujo se hace en un Worker con OffscreenCanvas cuando se puede; si no, el mismo motor corre en la página.
// motor(op, ...args) llama a la función del motor esté donde esté (y guarda las órdenes mientras se carga).
let cv = null, worker = null, local = null, cola = [];
const motor = (op, ...args) => {
  if (worker) worker.postMessage({ op, args });
  else if (local) local[op](...args);
  else cola.push([op, args]);
};
async function usarLocal() {
  worker = null;
  const m = await import('./fondoMotor.js');
  m.iniciar(cv); local = m;
  for (const [op, args] of cola) m[op](...args);
  cola = [];
}
function arrancarMotor() {
  if (import.meta.env.MODE !== 'windows' && cv.transferControlToOffscreen && typeof Worker === 'function' && typeof OffscreenCanvas === 'function') {
    try {
      const off = cv.transferControlToOffscreen();
      worker = new FondoWorker();
      worker.postMessage({ op: 'iniciar', lienzo: off }, [off]);
      // Si el worker falla, el lienzo transferido ya no sirve aquí: se cambia por uno nuevo y se dibuja en la página.
      worker.addEventListener('error', () => {
        worker.terminate(); const n = cv.cloneNode(); cv.replaceWith(n); cv = n;
        cola = [['estado', [{ oculto: document.hidden, tapado, quieto, animar: !reducedMotion() }]], ['tamano', [W, innerHeight, ratio()]]];
        if (E.nombre) cola.push(['escena', [E.nombre, E.h, E.s, E.dark]]);
        usarLocal();
      }, { once: true });
      return;
    } catch { worker = null; }
  }
  usarLocal();
}

// En pantallas táctiles el lienzo va a menos resolución: son brillos difusos y así cada fotograma pesa un tercio menos.
const tactil = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const ratio = () => Math.min(tactil ? 1.25 : 1.5, window.devicePixelRatio || 1);
let W = 0;
function tamano() {
  W = innerWidth;
  motor('tamano', W, innerHeight, ratio());
  revisarTapado();
}

// Con una ventana a pantalla completa (móvil) el fondo no se ve y se para. Se comprueba solo al abrir o cerrar ventanas.
let dialogos = null, tapado = false;
function revisarTapado() {
  dialogos ||= document.getElementsByTagName('dialog');
  let t = false;
  if (W < 700) for (const d of dialogos) if (d.open && d.classList.contains('tall')) { t = true; break; }
  if (t !== tapado) { tapado = t; motor('estado', { tapado }); }
}
// Mientras se desplaza la página (o una ventana) el fondo se queda quieto y deja la GPU libre para el scroll;
// sigue 180 ms después de que el dedo pare.
let quieto = false, quietoT = 0;
function desplazando() {
  if (!quieto) { quieto = true; motor('estado', { quieto }); }
  clearTimeout(quietoT); quietoT = setTimeout(() => { quieto = false; motor('estado', { quieto }); }, 180);
}

let E = { nombre: '', h: 40, s: 78, dark: true };
export function nexo(datos = {}) { motor('nexo', datos); }
export function setEscena(t) {
  if (!cv) return;
  const nombre = escenaDe(t), dark = oscuro(), h = t?.h ?? 220, s = Math.round((t?.s ?? 8) * (0.45 + 0.55 * tinteDe(h)));
  if (nombre === E.nombre && h === E.h && dark === E.dark) return;
  const cambiaEscena = nombre !== E.nombre;
  E = { nombre, h, s, dark };
  document.documentElement.dataset.escena = nombre;
  if (cambiaEscena) { cv.classList.remove('in'); void cv.offsetWidth; cv.classList.add('in'); }
  motor('escena', nombre, h, s, dark);
}
export function initFondo() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.className = 'fondo-vivo'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  arrancarMotor();
  motor('estado', { oculto: document.hidden, animar: !reducedMotion() });
  tamano();
  addEventListener('resize', () => { clearTimeout(tamano.t); tamano.t = setTimeout(tamano, 120); });
  document.addEventListener('scroll', desplazando, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => motor('estado', { oculto: document.hidden }));
  new MutationObserver(revisarTapado).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  const re = () => { const n = E.nombre; E.nombre = ''; setEscena({ h: E.h, s: E.s, icono: Object.keys(ESCENA).find(k => ESCENA[k] === n) }); };
  new MutationObserver(re).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', re); } catch {}
  try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => motor('estado', { animar: !reducedMotion() })); } catch {}
}
