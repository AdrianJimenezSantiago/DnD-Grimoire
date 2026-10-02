// Pantalla de luto cuando el personaje muere: memorial, órdenes permitidas y resurrección.
import { esc } from '../../core/util.js';
import { clasesTexto } from '../../domain/reglas/reglas2024.js';
import { vidaDe, estadoVital, CAUSAS } from '../../domain/combate/vida.js';
import { gi } from '../componentes/tema.js';
import { avatarHtml } from '../componentes/avatar.js';
import { runaSvg } from '../animaciones/magia.js';
import { chispas, ascender, movimientoReducido } from '../animaciones/fx.js';
import { cerrarDialogo } from '../componentes/dialog.js';
import { ocultarToast } from '../componentes/toast.js';

export const estaMuerto = ch => !!ch && estadoVital(ch) === 'muerto';
const PERMITIDOS = new Set(['home', 'more', 'chars', 'theme', 'backup', 'manual', 'biblioteca', 'glosario', 'about', 'tutorial', 'awake', 'reset', 'revivido', 'newchar', 'hist', 'print']);
export const ordenPermitida = cmd => PERMITIDOS.has(cmd);

const fecha = t => { try { return new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
export function memorialHtml(ch) {
  const v = vidaDe(ch), c = v.caida, causa = c?.causa ? CAUSAS[c.causa] : v.agotamiento >= 6 ? CAUSAS.agotamiento : CAUSAS.salvaciones;
  return `<div class="mm-lapida">
      <span class="mm-sello">${runaSvg({ n: 20, lados: 7, cls: 'mm-runa', semillaInicial: (ch.nombre || 'x').length * 17 })}${avatarHtml(ch, 'xl')}</span>
      <p class="mm-aqui">Aquí yace</p>
      <h1 class="mm-nombre">${esc(ch.nombre || 'Sin nombre')}</h1>
      <p class="mm-clase">${esc(clasesTexto(ch))}${ch.especie ? ` · ${esc(ch.especie)}` : ''}</p>
      <div class="mm-orla" aria-hidden="true"><i></i>${gi('muerte')}<i></i></div>
      <p class="mm-causa">${esc(causa)}${c?.ronda ? `, en la ronda ${c.ronda} del combate` : ''}.</p>
      ${c?.t ? `<p class="mm-fecha">${esc(fecha(c.t))}</p>` : ''}
      ${ch.lema ? `<blockquote class="mm-lema">${esc(ch.lema.replace(/_/g, ''))}</blockquote>` : ''}
      <p class="mm-nota">Mientras está caído, su hoja queda sellada: no se lanzan conjuros, no se descansa ni se tira. Si un conjuro o un milagro lo trae de vuelta, vuelve con 1 punto de golpe.</p>
    </div>
    <div class="mm-acc"><button type="button" class="mm-revivir" data-cmd="revivido">${gi('inspiracion')}He sido revivido</button>
      <button type="button" class="mm-otro" data-cmd="home">Elegir otro personaje</button></div>`;
}

let ultimo = { id: null, muerto: false };
export function actualizarLuto(ch) {
  const muerto = estaMuerto(ch), cambia = ch && ultimo.id === ch.id && muerto !== ultimo.muerto;
  document.body.classList.toggle('caido', muerto);
  if (cambia && muerto) caer(ch);
  ultimo = { id: ch?.id ?? null, muerto };
  return muerto;
}

function capa(cls, html) {
  const el = document.createElement('div'); el.className = cls; el.innerHTML = html; document.body.appendChild(el); return el;
}
function caer(ch) {
  document.querySelectorAll('dialog[open]').forEach(d => cerrarDialogo(d));
  ocultarToast();
  if (movimientoReducido()) return;
  document.body.classList.add('cayendo');
  const el = capa('caida-fx', `<div class="cf-velo"></div><div class="cf-centro">
      ${runaSvg({ n: 18, lados: 7, cls: 'cf-runa', semillaInicial: 66 })}<span class="cf-ico">${gi('muerte')}</span>
      <b class="cf-tit">Ha caído</b><span class="cf-nombre">${esc(ch.nombre || '')}</span></div><div class="cf-humo"></div>`);
  const r = el.querySelector('.cf-ico').getBoundingClientRect();
  setTimeout(() => chispas(r.left + r.width / 2, r.top + r.height / 2, { color: '#9aa0b3', n: 26, speed: 1.2, up: 3, life: 2200, size: 3, gravity: -0.035 }), 900);
  const fin = () => { el.classList.add('fuera'); setTimeout(() => { el.remove(); document.body.classList.remove('cayendo'); }, 700); };
  const t = setTimeout(fin, 3600);
  el.addEventListener('click', () => { clearTimeout(t); fin(); }, { once: true });
}

export function resucitar(origen, alRevivir) {
  const r = origen?.getBoundingClientRect?.(), x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2;
  if (movimientoReducido()) { alRevivir(); return; }
  const el = capa('revive-fx', `<div class="rv-luz"></div>${runaSvg({ n: 22, lados: 6, cls: 'rv-runa', semillaInicial: 7 })}`);
  el.style.setProperty('--x', `${x}px`); el.style.setProperty('--y', `${y}px`);
  chispas(x, y, { color: '#F4D27A', n: 70, speed: 5.5, up: 1.4, life: 1500, size: 2.6, gravity: 0.01 });
  const luto = document.querySelector('.luto'); luto?.style.setProperty('--rx', `${x}px`); luto?.style.setProperty('--ry', `${y}px`);
  document.body.classList.add('reviviendo');
  setTimeout(() => {
    alRevivir();
    setTimeout(() => { const h = document.querySelector('#hero .hero-av'); if (h) ascender(h); }, 380);
    const sheet = document.getElementById('sheet'); sheet.classList.add('fx-paz'); setTimeout(() => sheet.classList.remove('fx-paz'), 1300);
  }, 650);
  setTimeout(() => { el.remove(); document.body.classList.remove('reviviendo'); }, 2100);
}
