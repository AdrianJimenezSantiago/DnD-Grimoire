import { esc } from '../core/util.js';
import { sgn } from '../domain/reglas2024.js';
import { caEfectiva, velocidadEfectiva, efectosDe, fmtRondas, resumenTirada } from '../domain/efectos.js';
import { vidaDe, pgMaximo, pgActuales, dadosDeGolpe, estadoVital, NOMBRE_ESTADO } from '../domain/vida.js';
import { iniciativa, fmtMetros, tablaCaracteristicas, percepcionPasiva, penalizacionAgotamiento } from '../domain/habilidades.js';
import { combateDe } from '../domain/combate.js';
import { gi } from './tema.js';
import { icon } from './icons.js';
import { runaSvg } from './magia.js';

export const pctVida = c => { const m = pgMaximo(c); return m ? Math.max(0, Math.min(100, Math.round(pgActuales(c) / m * 100))) : 0; };
export const tonoVida = c => { const p = pctVida(c); return p <= 0 ? 'cero' : p <= 25 ? 'critico' : p <= 50 ? 'herido' : 'sano'; };

export function pipsMuerte(c, interactivo = false) {
  const m = vidaDe(c).muerte, pip = (tipo, i, on) => interactivo
    ? `<button type="button" class="pip ${tipo} ${on ? 'on' : ''}" data-pip="${tipo}|${i}" aria-pressed="${on}" aria-label="${tipo === 'exito' ? 'Éxito' : 'Fallo'} ${i + 1}"></button>`
    : `<i class="pip ${tipo} ${on ? 'on' : ''}"></i>`;
  return `<span class="pips"><span class="pips-g" title="Éxitos">${[0, 1, 2].map(i => pip('exito', i, i < m.exitos)).join('')}</span><span class="pips-g" title="Fallos">${[0, 1, 2].map(i => pip('fallo', i, i < m.fallos)).join('')}</span></span>`;
}

export function vigiliaHtml(ch) {
  const m = vidaDe(ch).muerte, est = estadoVital(ch);
  const pista = (tipo, n, lbl) => `<div class="vg-pista ${tipo}"><span class="vg-lbl">${lbl}</span><span class="vg-pips">${[0, 1, 2].map(i => `<button type="button" class="vg-pip ${i < n ? 'on' : ''}" data-pip="${tipo}|${i}" aria-pressed="${i < n}" aria-label="${lbl}: ${i + 1}"><i></i></button>`).join('')}</span></div>`;
  const txt = { moribundo: ['A las puertas de la muerte', 'Inconsciente a 0 PG. Al empezar tu turno tira un d20: 10 o más es un éxito; un 1, dos fallos; un 20, vuelves con 1 PG.'],
    estable: ['Estable', 'Inconsciente, pero fuera de peligro. Recupera 1 PG en 1d4 horas si nadie le cura antes.'],
    muerto: ['Ha caído', 'Tres fallos. Solo la magia puede traerle de vuelta.'] }[est] || ['', ''];
  const acc = est === 'moribundo' ? `<button type="button" class="gold vg-tirar" data-cmd="salvmuerte">${gi('d20')}Tirar salvación</button><button type="button" data-cmd="estabilizar">Estabilizar</button>`
    : est === 'estable' ? '<button type="button" data-cmd="vida">Curar</button>' : '<button type="button" data-cmd="revivir">Traer de vuelta (1 PG)</button>';
  return `<div class="vigilia ${est}">
    <span class="vg-emb">${runaSvg({ n: 12, lados: 6, cls: 'vg-runa', semillaInicial: 13 })}${gi('muerte')}</span>
    <div class="vg-cuerpo"><b class="vg-tit">${txt[0]}</b><small>${txt[1]}</small>
      <div class="vg-pistas">${pista('exito', m.exitos, 'Éxitos')}${pista('fallo', m.fallos, 'Fallos')}</div></div>
    <div class="vg-acc">${acc}</div></div>`;
}
export function pgHtml(ch, { compacto = false } = {}) {
  const v = vidaDe(ch), max = pgMaximo(ch), act = pgActuales(ch), est = estadoVital(ch);
  const dg = dadosDeGolpe(ch).map(d => `${d.quedan}${d.dado}`).join(' + ');
  return `<button type="button" class="pg-card ${tonoVida(ch)} ${est}" data-cmd="vida" aria-label="Puntos de golpe: ${act} de ${max}${v.temp ? `, más ${v.temp} temporales` : ''}. Tocar para cambiarlos">
    <span class="pg-top">${gi('pg', 'pg-ico')}<span class="pg-lbl">Puntos de golpe</span>${v.temp ? `<span class="pg-temp">+${v.temp}</span>` : ''}</span>
    <span class="pg-cifra"><b>${act}</b><small>/ ${max}</small></span>
    <span class="pg-barra"><i style="width:${pctVida(ch)}%"></i>${v.temp ? `<em style="width:${Math.min(100, Math.round(v.temp / max * 100))}%"></em>` : ''}</span>
    ${act === 0 && est !== 'vivo' ? `<span class="pg-muerte">${est === 'estable' ? 'Estable' : est === 'muerto' ? 'Muerto' : 'Moribundo'} ${pipsMuerte(ch)}</span>` : compacto ? '' : `<span class="pg-dg">Dados de golpe ${esc(dg)}</span>`}
  </button>`;
}
const placa = (cls, ico, valor, lbl, attrs = '', title = '', extra = '') => `<${attrs ? 'button type="button"' : 'div'} class="vt-placa ${cls}" ${attrs} ${title ? `title="${esc(title)}"` : ''}>${gi(ico, 'vt-ico')}<b>${valor}</b><span>${lbl}</span>${extra}</${attrs ? 'button' : 'div'}>`;

export function placaCa(ch, lbl, attrs = '') {
  const ca = caEfectiva(ch);
  return placa(`ca ${ca.cambia ? (ca.ca > ca.base ? 'sube' : 'baja') : ''}`, 'ca', ca.ca, ca.cambia ? `${lbl} <s>${ca.base}</s>` : lbl, attrs, ca.detalle);
}
export function placaVel(ch, lbl, attrs = '') {
  const v = velocidadEfectiva(ch), cas = Math.floor(v.m / 1.5 + 1e-9), nota = v.m === 0 && v.motivo ? v.motivo : v.arrastra ? 'Derribado: te arrastras (cada metro cuesta el doble)' : v.motivo;
  return placa(`vel ${v.cambia ? (v.m > v.base ? 'sube' : 'baja') : ''} ${v.arrastra ? 'baja' : ''}`, 'velocidad', fmtMetros(v.m), v.m === 0 && v.motivo ? `${lbl} · ${v.motivo.toLowerCase()}` : v.arrastra ? `${lbl} · arrastrándote` : lbl, attrs, nota || `${cas} casillas de 1,5 m`,
    `<em class="vt-cas" aria-label="${cas} casillas">${cas}<i>${cas === 1 ? 'casilla' : 'casillas'}</i></em>`);
}
export function estadosHtml(ch) {
  const v = vidaDe(ch), chips = [
    v.inspiracion && combateDe(ch).activo ? `<span class="es-chip insp">${gi('inspiracion')}Inspiración heroica</span>` : '',
    v.agotamiento ? `<span class="es-chip ago">${gi('agotamiento')}Agotamiento ${v.agotamiento}<small>−${penalizacionAgotamiento(ch)} al d20</small></span>` : '',
    ...v.estados.map(k => `<span class="es-chip" data-leer="estado:${k}">${esc(NOMBRE_ESTADO[k])}</span>`),
    ...efectosDe(ch).map(e => `<span data-leer="efecto:${esc(e.id)}" class="es-chip ${e.bueno ? 'buff' : 'debuff'} ${e.rondas != null && e.rondas <= 1 ? 'acaba' : ''}">${gi(e.ico || 'inspiracion')}${esc(e.nombre)}${e.rondas != null ? `<small class="es-dur" title="Duración restante">${esc(fmtRondas(e.rondas))}</small>` : ''}</span>`),
    ...v.maxExtra.map(m => `<span class="es-chip buff">${gi('pg')}+${m.n} PG máx.<small>${esc(m.nombre)}</small></span>`),
  ].filter(Boolean);
  return `<button type="button" class="vt-estados ${chips.length ? 'con' : ''}" data-cmd="estados" aria-label="Estados y efectos">
    ${chips.length ? chips.join('') : `<span class="es-vacio">${gi('estados')}Sin estados ni efectos</span>`}<span class="es-edit">${icon('quill')}</span></button>`;
}

export function vitalesHtml(ch) {
  const ini = iniciativa(ch), ag = penalizacionAgotamiento(ch);
  return `<div class="vt-grid">${pgHtml(ch)}
      ${placaCa(ch, 'Clase de armadura', 'data-cmd="equipo"')}
      ${placa('ini', 'iniciativa', sgn(ini - ag), 'Iniciativa', 'data-tirar="iniciativa"', 'Tocar para tirar iniciativa')}
      ${placaVel(ch, 'Velocidad')}
    </div>${estadosHtml(ch)}`;
}

let abierta = null;
export const alternarCaracteristica = k => { abierta = abierta === k ? null : k; };
const marcaComp = n => `<i class="cr-m n${n}" aria-hidden="true" title="${['Sin competencia', 'Competencia', 'Pericia'][n]}"></i>`;
const marcasTirada = r => `${r.falla ? '<i class="cr-v falla" title="Fallo automático">falla</i>' : r.modo !== 'normal' ? `<i class="cr-v ${r.modo}" title="${r.modo === 'ventaja' ? 'Ventaja' : 'Desventaja'}">${r.modo === 'ventaja' ? '▲' : '▼'}</i>` : ''}${r.dados.map(d => `<i class="cr-d">${esc(d)}</i>`).join('')}${r.cond ? '<i class="cr-cond" title="Hay modificadores que solo se aplican a veces: se eligen al tirar">*</i>' : ''}`;
export function filaTirada(ch, { tirar, sobre, ab = '', hab = '', nombre, bono, comp = 0, cls = '', aria = '' }) {
  const r = resumenTirada(ch, sobre, { ab, hab }, bono), cambia = r.total !== bono || r.modo !== 'normal' || r.dados.length || r.falla;
  return `<button type="button" class="cr-fila ${comp ? 'comp' : ''} ${cls} ${cambia ? 'mod' : ''}" data-tirar="${tirar}" ${aria ? `aria-label="${esc(aria)}"` : ''} ${r.fuentes.length ? `title="${esc(r.fuentes.join(', '))}"` : ''}>${marcaComp(comp)}<span>${esc(nombre)}</span><em class="cr-mk">${marcasTirada(r)}</em><b>${sgn(r.total)}</b></button>`;
}
const filasCar = (ch, c) => [
  filaTirada(ch, { tirar: `car:${c.k}`, sobre: 'prueba', ab: c.k, nombre: 'Prueba', bono: c.mod, cls: 'cr-prueba', aria: `Tirar prueba de ${c.nombre}` }),
  filaTirada(ch, { tirar: `salv:${c.k}`, sobre: 'salvacion', ab: c.k, nombre: 'Salvación', bono: c.salvacion.bono, comp: c.salvacion.competente ? 1 : 0, cls: 'cr-salv', aria: `Tirar salvación de ${c.nombre}` }),
  ...c.habilidades.map(h => filaTirada(ch, { tirar: `hab:${h.k}`, sobre: 'prueba', hab: h.k, nombre: h.nombre, bono: h.bono, comp: h.nivel, aria: `Tirar ${h.nombre}` })),
].join('');
export function caracteristicasHtml(ch) {
  const t = tablaCaracteristicas(ch), ag = penalizacionAgotamiento(ch);
  const tarjeta = c => { const r = resumenTirada(ch, 'prueba', { ab: c.k }, c.mod);
    return `<article class="cr-car ${abierta === c.k ? 'abierta' : ''} ${c.salvacion.competente ? 'salv' : ''}" data-car="${c.k}">
      <button type="button" class="cr-cab" data-crab="${c.k}" aria-expanded="${abierta === c.k}" aria-controls="cr-det-${c.k}">
        <span class="cr-nom">${c.corto}<small>${esc(c.nombre)}</small></span><b class="cr-mod">${sgn(c.mod)}</b><span class="cr-val">${c.valor}</span>${r.modo !== 'normal' || r.dados.length ? `<em class="cr-mk cr-mk-cab">${marcasTirada(r)}</em>` : ''}</button>
      <div class="cr-det" id="cr-det-${c.k}">${filasCar(ch, c)}</div></article>`; };
  return `<div class="cr-head"><span class="cr-emb">${gi('d20')}</span><h2>Características</h2>
      <small>Percepción pasiva <b>${percepcionPasiva(ch)}</b>${ag ? ` · agotamiento −${ag}` : ''}</small>
      <button type="button" class="ruse cr-ed" data-cmd="editchar" aria-label="Editar características y competencias" title="Editar">${icon('quill')}</button></div>
    <div class="cr-grid">${t.map(tarjeta).join('')}</div>
    ${abierta ? (c => `<div class="cr-panel" data-car="${c.k}"><h3>${esc(c.nombre)} <small>${c.valor} · ${sgn(c.mod)}</small></h3>${filasCar(ch, c)}</div>`)(t.find(x => x.k === abierta)) : ''}
    <p class="cr-leyenda"><span>${marcaComp(1)}competencia</span><span>${marcaComp(2)}pericia</span><span><i class="cr-v ventaja">▲</i><i class="cr-v desventaja">▼</i>ventaja o desventaja por estados y efectos</span><span>Toca una tirada para lanzar el d20.</span></p>`;
}
let pruebasAbiertas = false;
export const abrirPruebas = v => { pruebasAbiertas = v; };
export function pruebasCombateHtml(ch) {
  const t = tablaCaracteristicas(ch);
  return `<details class="cb-pruebas" ${pruebasAbiertas ? 'open' : ''}><summary>${gi('d20')}Pruebas y salvaciones<small>con tus estados y efectos</small>${icon('chevron')}</summary>
    <div class="cb-pr-grid">${t.map(c => `<section class="cb-pr-car"><h4>${c.corto}<small>${c.valor}</small></h4>${filasCar(ch, c)}</section>`).join('')}</div></details>`;
}
export const enCombate = ch => !!combateDe(ch).activo;
