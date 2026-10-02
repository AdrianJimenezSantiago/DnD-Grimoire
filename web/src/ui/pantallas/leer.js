// Fichas de lectura rápida (mantener pulsado en la hoja): conjuros, armas, rasgos, estados, CA, velocidad
// y acciones, con la regla que aplica a este personaje.
import { esc, norm } from '../../core/util.js';
import { glosario } from '../../domain/libros/terminos.js';
import { ataqueArma, armaCombate } from '../../domain/equipo/equipo.js';
import { caEfectiva, velocidadEfectiva, efectosDe, fmtRondas } from '../../domain/combate/efectos.js';
import { NOMBRE_ESTADO } from '../../domain/combate/vida.js';
import { fmtMetros, NOMBRE_HAB } from '../../domain/reglas/habilidades.js';
import { ACCION_COMUN, accionesAdicionales } from '../../domain/combate/combate.js';
import { ataquesPorAccion } from '../../domain/combate/maestria.js';
import { statsEfectivos } from '../../domain/equipo/objetosEfecto.js';
import { ECONOMIA_INFO, textoPropiedad, textoMaestria, salto } from '../../domain/reglas/referencia.js';
import { ficha, abrirTermino, abrirRasgoJuego, abrirResumenRegla } from '../dialogs/biblioteca.js';
import { abrirConjuro, md, rico } from '../dialogs/conjuro.js';
import { gi } from '../componentes/tema.js';

let S = null;
export const initLeer = store => { S = store; };

const delGlosario = nombre => glosario().find(e => norm(e.nombre) === norm(String(nombre).replace(/\s*\(.*$/, '')));
const pills = xs => `<div class="fi-pills">${xs.filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
const lista = xs => `<dl class="lr-lista">${xs.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${d}</dd></div>`).join('')}</dl>`;
// Como lista(), pero el nombre enlaza a la regla completa si el manual importado la trae
const listaReglas = xs => `<dl class="lr-lista">${xs.map(([t, d]) => { const g = delGlosario(t);
  return `<div><dt>${g ? `<button type="button" class="term" data-term="${g.clave}">${esc(t)}</button>` : esc(t)}</dt><dd>${d}</dd></div>`; }).join('')}</dl>`;
const fmtM = m => `${String(Math.round(m * 10) / 10).replace('.', ',')}\u00a0m`;

function arma(id) {
  const ch = S.cur(), o = armaCombate(ch, id); if (!o?.arma) return;
  const a = ataqueArma(ch, o), props = o.arma.props || [];
  const texto = n => { const g = delGlosario(n); return g ? md(g.texto) : rico(textoPropiedad(n) || 'Sin descripción: importa el Manual del Jugador para leerla.'); };
  const m = o.arma.maestria, gm = m && delGlosario(m);
  ficha({ titulo: o.nombre, ico: 'o_arma', sub: pills([`Ataque ${a.ataque}`, `Daño ${a.dano}`, o.arma.distancia, o.equipado ? 'Equipada' : '']),
    cuerpo: `${props.length || o.arma.distancia ? `<h4 class="md-h">Propiedades</h4>${lista([...props, ...(o.arma.distancia ? [`Distancia (${o.arma.distancia})`] : [])].map(p => [p, texto(p)]))}` : ''}
      ${m ? `<h4 class="md-h">Maestría</h4>${lista([[m, gm ? md(gm.texto) : rico(textoMaestria(m) || 'Sin descripción.')]])}<p class="note">Solo si tu clase te da la maestría de esta arma.</p>` : ''}
      ${a.estilos?.length ? `<h4 class="md-h">Estilo de combate y rasgos</h4><p class="sp-text">${esc(a.estilos.join('. '))}.</p>` : ''}
      ${a.notas?.length ? `<h4 class="md-h">Cómo se calcula</h4><p class="sp-text">${esc(a.notas.join('. '))}.</p>` : ''}
      ${o.sinArmas ? '<p class="note">Todo el mundo puede dar un golpe sin armas: 1 + tu modificador de Fuerza de daño contundente, o lo que den tus rasgos y dotes.</p>' : ''}
      ${o.notas ? `<h4 class="md-h">Notas</h4><div class="sp-text">${md(o.notas)}</div>` : ''}` });
}
function estado(k) {
  const g = glosario().find(e => e.cat === 'Estado' && norm(e.nombre) === norm(NOMBRE_ESTADO[k]));
  if (g) return abrirTermino(g.clave);
  abrirResumenRegla(NOMBRE_ESTADO[k], 'Estado');
}
function efecto(id) {
  const e = efectosDe(S.cur()).find(x => x.id === id); if (!e) return;
  ficha({ titulo: e.nombre, ico: e.ico || 'inspiracion', sub: pills([e.bueno ? 'Beneficioso' : 'Perjudicial', e.rondas != null ? `Quedan ${fmtRondas(e.rondas)}` : 'Sin límite de rondas', e.conc ? `Concentración: ${e.conc}` : '']),
    cuerpo: `<div class="sp-text"><p>${rico(e.texto)}</p></div>${e.conc ? '<p class="note">Termina si se pierde la concentración.</p>' : ''}` });
}
function economia(k) {
  const x = ECONOMIA_INFO[k]; if (!x) return;
  const ch = S.cur(), g = delGlosario(x.titulo);
  // Lo que cambia para este personaje: cuántos ataques da su acción de Ataque y qué acciones puede hacer como adicional
  const at = k === 'accion' ? ataquesPorAccion(ch) : 1, ads = k === 'adicional' ? accionesAdicionales(ch) : [];
  const tuyo = at > 1 ? `<aside class="rg-resumen"><span class="rg-lbl">${esc(ch.nombre)}</span><p>Tu acción de Atacar te da <b>${at} ataques</b>.</p></aside>`
    : ads.length ? `<aside class="rg-resumen"><span class="rg-lbl">${esc(ch.nombre)}</span><p>Como acción adicional también puedes: ${ads.map(a => `<b>${esc(ACCION_COMUN[a.k].nombre)}</b> <small>(${esc(a.rasgo)})</small>`).join(', ')}.</p></aside>` : '';
  ficha({ titulo: x.titulo, ico: k === 'movimiento' ? 'velocidad' : k === 'reaccion' ? 'md_tiempo' : 'combate', clase: 'regla', sub: pills(['Tu turno']),
    cuerpo: `<p class="lr-intro">${rico(x.texto)}</p>${tuyo}${listaReglas(x.lista.map(([t, d]) => [t, rico(d)]))}
      <p class="note">Toca el botón para marcarla como gastada; se renueva al pasar de turno.</p>${g ? `<button type="button" class="rg-mas" data-term="${g.clave}">${gi('libro')}Leer la regla completa de ${esc(x.titulo.toLowerCase())}</button>` : ''}` });
}
function ca() {
  const c = caEfectiva(S.cur());
  ficha({ titulo: `Clase de armadura ${c.ca}`, ico: 'ca', sub: pills([c.cambia ? `Base ${c.base}` : 'Sin modificar']), cuerpo: `${lista(c.detalle.split(', ').filter(Boolean).map(p => { const m = /^(.*?)\s*([+−-]\d+|\(mín\. \d+\))?$/.exec(p); return [m[1] || p, esc(m[2] || '')]; }))}` });
}
function vel() {
  const ch = S.cur(), v = velocidadEfectiva(ch), sj = salto(statsEfectivos(ch).fue || 10);
  ficha({ titulo: `Velocidad ${fmtMetros(v.m)}`, ico: 'velocidad', clase: 'regla', sub: pills([`${Math.floor(v.m / 1.5 + 1e-9)} casillas`, v.cambia ? `Base ${fmtMetros(v.base)}` : '']),
    cuerpo: `${v.motivo ? `<p class="lr-intro">${esc(v.motivo)}.</p>` : ''}
      <aside class="rg-resumen"><span class="rg-lbl">Tus saltos</span><p>Largo: <b>${fmtM(sj.largo)}</b> con carrerilla (${fmtM(sj.largo / 2)} sin ella). Alto: <b>${fmtM(sj.alto)}</b> con carrerilla (${fmtM(sj.alto / 2)} sin ella).</p></aside>
      ${listaReglas(ECONOMIA_INFO.movimiento.lista.map(([t, d]) => [t, rico(d)]))}` });
}
function conc() {
  const ch = S.cur(), bi = ch.book.findIndex(e => S.db.catalog[e.sid]?.es === ch.play.conc);
  if (bi >= 0) abrirConjuro(bi);
}

// Acciones de combate: la regla del manual importado si la hay; si no, el resumen de la app
function accionComun(k) {
  const a = ACCION_COMUN[k]; if (!a) return;
  const g = glosario().find(e => [a.nombre, ...(a.alias || [])].some(n => norm(e.nombre) === norm(n) || norm(e.nombre) === norm(`${n} (acción)`)));
  if (g) return abrirTermino(g.clave);
  const ad = accionesAdicionales(S.cur()).find(x => x.k === k);
  ficha({ titulo: a.nombre, ico: a.ico, sub: pills([a.via === 'reaccion' ? 'Reacción' : 'Acción', ad ? `adicional con ${ad.rasgo}` : ''].filter(Boolean)),
    cuerpo: `<p class="lr-intro">${rico(a.texto)}</p>${a.tirar ? `<p class="note">Suele pedir: ${esc(a.tirar.map(h => NOMBRE_HAB[h]).join(', '))}.</p>` : ''}<p class="note">Tócala en la vista de combate para gastar ${a.via === 'reaccion' ? 'tu reacción' : 'tu acción'}; vuelve a tocarla para desmarcarla.</p>` });
}

export function leer(clave) {
  if (!S?.cur()) return false;
  const [tipo, ...r] = clave.split(':'), v = r.join(':');
  if (tipo === 'conj') abrirConjuro(+v);
  else if (tipo === 'arma') arma(v);
  else if (tipo === 'rasgo') abrirRasgoJuego(v);
  else if (tipo === 'estado') estado(v);
  else if (tipo === 'efecto') efecto(v);
  else if (tipo === 'eco') economia(v);
  else if (tipo === 'accom') accionComun(v);
  else if (tipo === 'ca') ca();
  else if (tipo === 'vel') vel();
  else if (tipo === 'conc') conc();
  else return false;
  return true;
}
