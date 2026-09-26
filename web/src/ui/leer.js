import { esc, norm } from '../core/util.js';
import { glosario } from '../domain/catalogo.js';
import { equipoDe, ataqueArma } from '../domain/equipo.js';
import { caEfectiva, velocidadEfectiva, efectosDe, fmtRondas, REGLAS_ESTADO } from '../domain/efectos.js';
import { NOMBRE_ESTADO, RESUMEN_ESTADO } from '../domain/vida.js';
import { fmtMetros } from '../domain/habilidades.js';
import { ECONOMIA_INFO, textoPropiedad, textoMaestria } from '../domain/referencia.js';
import { ficha, abrirTermino, abrirRasgoJuego } from './dialogs/biblioteca.js';
import { openSpell } from './dialogs/conjuro.js';
import { md } from './dialogs/conjuro.js';

let S = null;
export const initLeer = store => { S = store; };

const delGlosario = nombre => glosario().find(e => norm(e.nombre) === norm(String(nombre).replace(/\s*\(.*$/, '')));
const pills = xs => `<div class="fi-pills">${xs.filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
const lista = xs => `<dl class="lr-lista">${xs.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${d}</dd></div>`).join('')}</dl>`;

function arma(id) {
  const ch = S.cur(), o = equipoDe(ch).objetos.find(x => x.id === id); if (!o?.arma) return;
  const a = ataqueArma(ch, o), props = o.arma.props || [];
  const texto = n => { const g = delGlosario(n); return g ? md(g.texto) : esc(textoPropiedad(n) || 'Sin descripción: importa el Manual del Jugador para leerla.'); };
  const m = o.arma.maestria, gm = m && delGlosario(m);
  ficha({ titulo: o.nombre, ico: 'o_arma', sub: pills([`Ataque ${a.ataque}`, `Daño ${a.dano}`, o.arma.distancia, o.equipado ? 'Equipada' : '']),
    cuerpo: `${props.length ? `<h4 class="md-h">Propiedades</h4>${lista(props.map(p => [p, texto(p)]))}` : ''}
      ${m ? `<h4 class="md-h">Maestría</h4>${lista([[m, gm ? md(gm.texto) : esc(textoMaestria(m) || 'Sin descripción.')]])}<p class="note">Solo si tu clase te da la maestría de esta arma.</p>` : ''}
      ${a.estilos?.length ? `<h4 class="md-h">Estilo de combate</h4><p class="sp-text">${esc(a.estilos.join('. '))}.</p>` : ''}
      ${o.notas ? `<h4 class="md-h">Notas</h4><div class="sp-text">${md(o.notas)}</div>` : ''}` });
}
function estado(k) {
  const g = glosario().find(e => e.cat === 'Estado' && norm(e.nombre) === norm(NOMBRE_ESTADO[k]));
  if (g) return abrirTermino(g.clave);
  ficha({ titulo: NOMBRE_ESTADO[k], ico: 'estados', sub: pills(['Estado', REGLAS_ESTADO[k]?.incap ? 'Incapacitado' : '']), cuerpo: `<div class="sp-text"><p>${esc(RESUMEN_ESTADO[k])}</p></div><p class="note">Resumen de la app. Importa el Manual del Jugador para leer la regla completa.</p>` });
}
function efecto(id) {
  const e = efectosDe(S.cur()).find(x => x.id === id); if (!e) return;
  ficha({ titulo: e.nombre, ico: e.ico || 'inspiracion', sub: pills([e.bueno ? 'Beneficioso' : 'Perjudicial', e.rondas != null ? `Quedan ${fmtRondas(e.rondas)}` : 'Sin límite de rondas', e.conc ? `Concentración: ${e.conc}` : '']),
    cuerpo: `<div class="sp-text"><p>${esc(e.texto)}</p></div>${e.conc ? '<p class="note">Termina si se pierde la concentración.</p>' : ''}` });
}
function economia(k) {
  const x = ECONOMIA_INFO[k]; if (!x) return;
  ficha({ titulo: x.titulo, ico: k === 'movimiento' ? 'velocidad' : k === 'reaccion' ? 'md_tiempo' : 'combate', sub: pills(['Tu turno']),
    cuerpo: `<p class="lr-intro">${esc(x.texto)}</p>${lista(x.lista.map(([t, d]) => [t, esc(d)]))}<p class="note">Toca el botón para marcarla como gastada; se renueva al pasar de turno.</p>` });
}
function ca() {
  const c = caEfectiva(S.cur());
  ficha({ titulo: `Clase de armadura ${c.ca}`, ico: 'ca', sub: pills([c.cambia ? `Base ${c.base}` : 'Sin modificar']), cuerpo: `${lista(c.detalle.split(', ').filter(Boolean).map(p => { const m = /^(.*?)\s*([+−-]\d+|\(mín\. \d+\))?$/.exec(p); return [m[1] || p, esc(m[2] || '')]; }))}` });
}
function vel() {
  const v = velocidadEfectiva(S.cur());
  ficha({ titulo: `Velocidad ${fmtMetros(v.m)}`, ico: 'velocidad', sub: pills([`${Math.floor(v.m / 1.5 + 1e-9)} casillas`, v.cambia ? `Base ${fmtMetros(v.base)}` : '']),
    cuerpo: `${v.motivo ? `<p class="lr-intro">${esc(v.motivo)}.</p>` : ''}${lista(ECONOMIA_INFO.movimiento.lista.map(([t, d]) => [t, esc(d)]))}` });
}
function conc() {
  const ch = S.cur(), bi = ch.book.findIndex(e => S.db.catalog[e.sid]?.es === ch.play.conc);
  if (bi >= 0) openSpell(bi);
}

export function leer(clave) {
  if (!S?.cur()) return false;
  const [tipo, ...r] = clave.split(':'), v = r.join(':');
  if (tipo === 'conj') openSpell(+v);
  else if (tipo === 'arma') arma(v);
  else if (tipo === 'rasgo') abrirRasgoJuego(v);
  else if (tipo === 'estado') estado(v);
  else if (tipo === 'efecto') efecto(v);
  else if (tipo === 'eco') economia(v);
  else if (tipo === 'ca') ca();
  else if (tipo === 'vel') vel();
  else if (tipo === 'conc') conc();
  else return false;
  return true;
}
