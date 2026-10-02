// Portada: rueda de clases, tarjetas de personajes y accesos a crear, libros, biblioteca y copia de seguridad.
import { esc } from '../../core/util.js';
import { $, on, patch } from '../componentes/dom.js';
import { gi, temaDe, aplicarTema } from '../componentes/tema.js';
import { estiloPaleta, paleta } from '../../domain/presentacion/paleta.js';
import { TEMAS } from '../../domain/clases/clases2024.js';
import { icon } from '../componentes/icons.js';
import { claseLinea } from '../../domain/personaje/descripcion.js';
import { estadoVital } from '../../domain/combate/vida.js';
import { avatarHtml } from '../componentes/avatar.js';
import { transicionVista, movimientoReducido } from '../animaciones/fx.js';
import { runaSvg, portalDesde, selloEn } from '../animaciones/magia.js';
import { nexo } from '../animaciones/fondo.js';

let S, cbs, verPruebas = false;
export const portadaVisible = () => document.body.classList.contains('on-landing');

// La rueda de clases ordenada por tono (empieza en el dorado del clérigo, el color de la marca): recorrerla es dar la vuelta al círculo cromático
const RUEDA = Object.entries(TEMAS.clase).map(([nombre, [h, s, icono]]) => ({ nombre, h, s, icono })).sort((a, b) => a.h - b.h);
const TONOS = RUEDA.map(({ h, s }) => ({ h, s: Math.max(s, 42) }));
const PILARES = [
  ['subclase', 'Crea', 'Creación guiada con las 12 clases y sus subclases de 2024'],
  ['libro', 'Conjura', 'Espacios, preparados, concentración y un compendio del SRD'],
  ['combate', 'Combate', 'Ronda, iniciativa y tu turno ordenado por acción'],
  ['d20', 'Tira', 'Dados con ventaja y desventaja, y todo queda en el historial'],
  ['md_pluma', 'Recuerda', 'Diario de sesiones y bestiario de la campaña'],
  ['biblioteca', 'Consulta', 'Tus manuales en PDF, leídos sin salir del dispositivo'],
];
const PASO = 4200;

let giro = 1, activo = 1, hueAcum = RUEDA[1].h, fijo = null, timer = 0;

// El tono de destino (--lnd-*) se pone solo en los bloques de la portada que no tienen paleta propia, nunca en el
// contenedor: así cambiar de tono no recalcula los estilos de todas las tarjetas de personaje (ver portada.css).
let tinte = {};
function aplicarTinte() {
  const el = $('#landing'); if (!el) return;
  for (const b of el.children) if (!b.classList.contains('l-grid')) for (const [k, x] of Object.entries(tinte)) b.style.setProperty(k, x);
}
function tintar({ h, s }) {
  hueAcum += ((((h - hueAcum) % 360) + 540) % 360) - 180;
  const sa = Math.max(s, 42), p = paleta({ h, s: sa });
  tinte = { '--lnd-h': hueAcum.toFixed(1), '--lnd-s': sa + '%', '--lnd-sg': p['--acc-sg'], '--lnd-k': p['--acc-k'], '--lnd-gl-d': p['--gl-d'], '--lnd-gl2-d': p['--gl2-d'], '--lnd-gl-l': p['--gl-l'], '--lnd-gl2-l': p['--gl2-l'] };
  aplicarTinte();
  nexo({ h, s: sa });
}
function marcar(i) {
  const n = RUEDA.length, nuevo = ((i % n) + n) % n;
  giro += ((((nuevo - activo) % n) + n + n / 2) % n) - n / 2; activo = nuevo;
  $('#landing .l-rueda')?.style.setProperty('--act', giro);
  $('#landing').querySelectorAll('.l-clase').forEach((b, k) => b.classList.toggle('on', k === activo));
  if (!fijo) tintar(RUEDA[activo]);
}
function latir() {
  clearInterval(timer); timer = 0;
  if (movimientoReducido() || !portadaVisible()) return;
  timer = setInterval(() => { if (!document.hidden && !fijo) marcar(activo + 1); }, PASO);
}
function centrar() {
  const m = $('#landing .l-mark'); if (!m) return;
  const r = m.getBoundingClientRect(); nexo({ cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
}

const aro = `conic-gradient(${RUEDA.map((c, k) => `hsl(${c.h} ${Math.max(c.s, 50)}% 60%) ${(k * 360) / RUEDA.length}deg`).join(', ')}, hsl(${RUEDA[0].h} ${Math.max(RUEDA[0].s, 50)}% 60%) 360deg)`;
function rueda() {
  const n = RUEDA.length;
  return `<div class="l-rueda" style="--n:${n};--act:${giro}">
    <div class="l-orbita"><span class="l-aro" style="--aro:${aro}"></span><span class="l-rayo"></span>${RUEDA.map((c, k) => `<span class="l-pos" style="--k:${k}"><button type="button" class="l-clase paleta-local ${k === activo ? 'on' : ''}" data-no-onda data-lclase="${esc(c.nombre)}" style="${estiloPaleta(c)}"
      aria-label="Nuevo personaje: ${esc(c.nombre)}" title="${esc(c.nombre)}"><span>${gi(c.icono)}</span></button></span>`).join('')}</div>
    <span class="l-mark">${runaSvg({ n: 22, lados: 7, cls: 'l-runa', semillaInicial: 42 })}<span class="l-nucleo">${gi('libro')}</span></span>
  </div>`;
}

function render() {
  const chars = S.db.chars, ult = S.db.activeId;
  const orden = [...chars].sort((a, b) => (b.id === ult) - (a.id === ult));
  const propios = orden.filter(c => !c.prueba), pruebas = orden.filter(c => c.prueba);
  const hayLista = propios.length || (pruebas.length && verPruebas);
  const card = (c, i) => {
    const t = temaDe(c), n = c.book.length;
    const caido = estadoVital(c) === 'muerto';
    return `<button type="button" class="lcard paleta-local ${c.id === ult ? 'last' : ''} ${caido ? 'caido' : ''}" data-lopen="${c.id}" data-h="${t.h}" data-s="${t.s}" style="${estiloPaleta(t)};--i:${i}">
      ${c.retrato ? `<span class="lc-av">${avatarHtml(c, 'lg')}<span class="lc-badge">${gi(t.icono)}</span></span>` : `<span class="lc-emb">${gi(t.icono)}</span>`}
      <span class="lc-txt"><span class="lc-name">${esc(c.nombre || 'Sin nombre')}</span><span class="lc-cls">${esc(claseLinea(c))}</span>
      <span class="lc-meta">${[c.especie, n === 1 ? '1 conjuro' : n + ' conjuros'].filter(Boolean).map(esc).join(' · ')}</span></span>
      <span class="lc-marca" aria-hidden="true">${gi(t.icono)}</span>
      ${caido ? `<span class="lc-caido">${gi('muerte')}Caído</span>` : c.id === ult ? '<span class="lc-cont">Continuar</span>' : ''}</button>`;
  };
  const pilares = `<ul class="l-pilares paleta-local" aria-label="Qué hay dentro">${PILARES.map(([ico, t, d], k) => {
    const c = RUEDA[(k * 2 + 1) % RUEDA.length];
    return `<li class="paleta-local" style="${estiloPaleta({ h: c.h, s: Math.max(c.s, 50) })};--i:${k}"><span class="lp-ico">${gi(ico)}</span><b>${t}</b><small>${d}</small></li>`;
  }).join('')}</ul>`;
  const nuevo = patch($('#landing'), `<div class="l-cielo" aria-hidden="true"></div><header class="l-head paleta-local ${hayLista ? 'compacta' : ''}">
      ${rueda()}
      <h1><span>Grimorio</span></h1>
      <p class="l-lema">Tu compañero de mesa para D&amp;D 2024</p>
    </header>
    ${propios.length ? `<h2 class="l-h2 paleta-local">Elige personaje</h2><div class="l-grid">${propios.map(card).join('')}</div>` : ''}
    ${pruebas.length && verPruebas ? `<h2 class="l-h2 paleta-local">Clases de prueba <small>(${pruebas.length}, nivel ${pruebas[0].nivel})</small></h2>
      <p class="l-pruebas-nota paleta-local">Un personaje por subclase, montado solo con las reglas. Sirven para revisar colores, emblemas, recursos y progresión.
        <button type="button" class="ghost" data-lcmd="pruebas">${gi('dados')}Regenerar</button><button type="button" class="ghost" data-lcmd="quitarPruebas">${icon('reset')}Quitar</button></p>
      <div class="l-grid">${pruebas.map((c, i) => card(c, propios.length + i)).join('')}</div>` : ''}
    ${hayLista ? '' : `<div class="l-empty paleta-local"><p>Hoja de personaje, libro de conjuros, combate, dados y diario de campaña. Todo en tu dispositivo, también sin conexión.</p>
      <p class="note">Toca una clase de la rueda para empezar con ella, o carga una copia si ya tienes personajes en otro sitio.</p></div>`}
    <div class="l-actions paleta-local">
      <button type="button" class="${chars.length ? '' : 'gold'}" data-lcmd="nuevo">${icon('plus')}Nuevo personaje</button>
      <button type="button" data-lcmd="copia">${icon('save')}Cargar copia</button>
      <button type="button" data-lcmd="biblioteca">${gi('biblioteca')}Biblioteca</button>
      <button type="button" data-lcmd="manual">${gi('libro')}Libros y manuales</button>
      ${chars.length ? `<button type="button" data-lcmd="gestionar">${icon('users')}Gestionar personajes</button>` : ''}
    </div>
    ${hayLista ? '' : pilares}
    <footer class="l-foot paleta-local"><button type="button" class="ghost" data-lcmd="tutorial">${icon('info')}Ver tutorial</button>
      <button type="button" class="ghost" data-lcmd="revisarPruebas" aria-pressed="${!!(pruebas.length && verPruebas)}">${gi('dados')}${pruebas.length && verPruebas ? 'Ocultar clases de prueba' : 'Revisar clases de prueba'}</button></footer>`);
  if (nuevo) aplicarTinte();
  requestAnimationFrame(centrar); setTimeout(centrar, 700);
}
export function mostrarPortada() {
  document.body.classList.add('on-landing'); $('#landing').hidden = false;
  render(); aplicarTema(null); nexo({ tonos: TONOS });
  $('#landing').scrollTop = 0; fijo = null; marcar(activo);
  document.body.classList.remove('landing-in'); void document.body.offsetWidth; document.body.classList.add('landing-in');
  latir();
  cbs.onShow?.();
}
export function ocultarPortada() {
  clearInterval(timer); timer = 0;
  document.body.classList.remove('on-landing'); $('#landing').hidden = true;
  aplicarTema(S.cur()); S.emit('ui');
}
export function init(store, callbacks) {
  S = store; cbs = callbacks; verPruebas = !!callbacks.pruebasAuto;
  const L = $('#landing');
  S.subscribe(() => { if (portadaVisible()) render(); });
  on(L, 'click', '[data-lopen]', (e, b) => {
    const r = b.getBoundingClientRect();
    selloEn(b.querySelector('.lc-emb, .lc-av'), { size: 150, dur: 700 });
    portalDesde(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
    setTimeout(() => abrir(b), 120);
  });
  const abrir = b => transicionVista(() => { S.editing = false; S.edit(db => { db.activeId = b.dataset.lopen; }); ocultarPortada(); window.scrollTo({ top: 0 }); cbs.onOpen?.(); });
  on(L, 'click', '[data-lclase]', (e, b) => {
    selloEn(b, { size: 120, dur: 650 });
    setTimeout(() => cbs.cmd('nuevo', b.dataset.lclase), 90);
  });
  on(L, 'click', '[data-lcmd]', (e, b) => {
    const c = b.dataset.lcmd;
    if (c !== 'revisarPruebas') return cbs.cmd(c);
    if (!S.db.chars.some(x => x.prueba)) { verPruebas = true; cbs.cmd('pruebas'); } else { verPruebas = !verPruebas; render(); }
    if (verPruebas) setTimeout(() => $('#landing .l-pruebas-nota')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  });
  // La portada toma el color de lo que miras: una clase de la rueda o la tarjeta de un personaje
  const mirar = e => {
    const c = e.target.closest?.('.lcard, .l-clase'); if (!c) return;
    if (c.matches('.l-clase')) { fijo = RUEDA.find(x => x.nombre === c.dataset.lclase); marcar([...L.querySelectorAll('.l-clase')].indexOf(c)); }
    else fijo = { h: +c.dataset.h, s: +c.dataset.s };
    tintar(fijo);
  };
  const soltar = e => {
    const c = e.target.closest?.('.lcard, .l-clase'); if (!c || c.contains(e.relatedTarget)) return;
    fijo = null; tintar(RUEDA[activo]);
  };
  L.addEventListener('pointerover', e => e.pointerType === 'mouse' && mirar(e));
  L.addEventListener('pointerout', e => e.pointerType === 'mouse' && soltar(e));
  L.addEventListener('focusin', mirar); L.addEventListener('focusout', soltar);
  L.addEventListener('scroll', centrar, { passive: true });
  addEventListener('resize', () => portadaVisible() && requestAnimationFrame(centrar));
  try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', latir); } catch {}
}
