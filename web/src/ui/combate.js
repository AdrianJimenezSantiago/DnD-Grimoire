import { esc, norm } from '../core/util.js';
import { perfil, sgn, magiaPara } from '../domain/reglas2024.js';
import { reglasVisibles, usosGastados } from '../domain/rasgos.js';
import { rasgosEnJuego } from '../domain/enJuego.js';
import { biblioteca } from '../domain/catalogo.js';
import { equipoDe, ataqueArma } from '../domain/equipo.js';
import { combateDe, ECONOMIA, economiaDeTiempo } from '../domain/combate.js';
import { iniciativa, penalizacionAgotamiento, bonoSalvacion } from '../domain/habilidades.js';
import { pgActuales, estadoVital } from '../domain/vida.js';
import { gi } from './tema.js';
import { icon } from './icons.js';
import { runaSvg } from './magia.js';
import { burst, reducedMotion } from './fx.js';
import { pgHtml, estadosHtml, vigiliaHtml, placaCa, placaVel } from './vitales.js';
import { modsTirada, resolverModo, resumenMods, incapacitado, fmtMod } from '../domain/efectos.js';
import { NOMBRE_ESTADO } from '../domain/vida.js';

const ESC_ICO = { abj: 'esc_abj', adi: 'esc_adi', con: 'esc_con', enc: 'esc_enc', evo: 'esc_evo', ilu: 'esc_ilu', nig: 'esc_nig', tra: 'esc_tra' };
export const escuelaIco = esc2 => ESC_ICO[norm(esc2 || '').slice(0, 3)] || '';

function ticks(ch, r) {
  const used = usosGastados(ch, r), left = r.max - used;
  if (r.max > 10) return `<span class="rstep"><button type="button" data-rstep="${r.id}|1" aria-label="Gastar 1 de ${esc(r.nombre)}">−</button><button type="button" class="rleft" data-rset="${r.id}">${left}<small> / ${r.max}</small></button><button type="button" data-rstep="${r.id}|-1" aria-label="Recuperar 1 de ${esc(r.nombre)}">+</button></span>`;
  return `<span class="rticks">${Array.from({ length: r.max }, (_, i) => `<button type="button" class="rtick ${i >= left ? 'on' : ''}" data-rtick="${r.id}|${i}" aria-label="${esc(r.nombre)}: uso ${i + 1} ${i >= left ? 'gastado' : 'disponible'}"></button>`).join('')}</span>`;
}

function acciones(ch, db) {
  const P = perfil(ch), mAt = modsTirada(ch, { sobre: 'ataque' }).filter(m => !/^Agotamiento/.test(m.fuente)), modo = resolverModo(mAt);
  const marca = modo === 'normal' ? mAt.filter(m => m.efecto === 'dado' || m.efecto === 'plano').map(m => `<i class="cb-at-m ${m.mal ? 'mal' : 'bien'}" title="${esc(m.fuente)}">${esc(fmtMod(m))}</i>`).join('')
    : `<i class="cb-at-m ${modo === 'ventaja' ? 'bien' : 'mal'}" title="${esc(mAt.filter(m => m.efecto === modo).map(m => m.fuente).join(', '))}">${modo === 'ventaja' ? '▲' : '▼'}</i>` + mAt.filter(m => m.efecto === 'dado').map(m => `<i class="cb-at-m ${m.mal ? 'mal' : 'bien'}">${esc(fmtMod(m))}</i>`).join('');
  const grupos = { accion: [], adicional: [], reaccion: [] };
  for (const o of equipoDe(ch).objetos.filter(x => x.arma).sort((a, b) => b.equipado - a.equipado)) {
    const a = ataqueArma(ch, o);
    grupos.accion.push(`<div class="cb-it arma ${o.equipado ? 'eq' : ''}"><span class="cb-ico">${gi('o_arma')}</span><span class="cb-t"><b>${esc(o.nombre)}</b><small>${esc([o.arma.distancia, ...(o.arma.props || []).slice(0, 3), o.arma.maestria ? `maestría: ${o.arma.maestria}` : ''].filter(Boolean).join(' · '))}</small></span>
      <span class="cb-bts"><button type="button" class="cb-roll" data-cbataque="${o.id}">${gi('d20')}${esc(a.ataque)}${marca}</button><button type="button" class="cb-roll dano" data-cbdano="${o.id}">${gi('dados')}${esc(a.dano)}</button></span></div>`);
  }
  if (db) ch.book.forEach((e, bi) => {
    const s = db.catalog[e.sid]; if (!s) return;
    if (s.level > 0 && !e.prep && !e.always && !e.gratis) return;
    const g = economiaDeTiempo(s.tiempo); if (!grupos[g]) return;
    const Pm = magiaPara(P, e.fuente), ico = escuelaIco(s.escuela);
    grupos[g].push(`<div class="cb-it conj" data-sc="${ico.slice(4)}"><span class="cb-ico esc">${ico ? gi(ico) : gi('libro')}</span><span class="cb-t"><b>${esc(s.es)}</b><small>${s.level ? `Nivel ${s.level}` : 'Truco'}${s.conc ? ' · concentración' : ''}${s.alcance ? ` · ${esc(s.alcance)}` : ''}${Pm.cd != null ? ` · CD ${Pm.cd}` : ''}</small></span>
      <span class="cb-bts"><button type="button" class="cb-roll lanzar" data-cast="${bi}">${gi(ico || 'libro')}Lanzar</button></span></div>`);
  });
  const lib = biblioteca();
  for (const r of rasgosEnJuego(ch, lib, reglasVisibles(ch))) {
    if (!grupos[r.grupo]) continue;
    grupos[r.grupo].push(`<div class="cb-it rasgo"><span class="cb-ico">${gi(r.fuente === 'especie' ? 'criatura' : r.fuente === 'dote' ? 'dote' : norm(r.clase || '').replace(/[^a-z]/g, '') || 'dote')}</span>
      <button type="button" class="cb-t cb-leer" data-ejver="${esc(r.clave)}"><b>${esc(r.nombre)}</b><small>${esc(r.resumen || r.etiqueta)}</small></button>
      <span class="cb-bts">${r.numeros.map(n => `<span class="ej-num" title="${esc(n.nombre)}">${esc(n.valor)}</span>`).join('')}${r.recurso ? ticks(ch, r.recurso) : ''}</span></div>`);
  }
  return grupos;
}

export function combateHtml(ch, db) {
  const c = combateDe(ch), P = perfil(ch), ag = penalizacionAgotamiento(ch), est = estadoVital(ch), incap = incapacitado(ch);
  const lineas = resumenMods(ch), modsHtml = lineas.length || incap.length ? `<section class="cb-mods" aria-label="Lo que te afecta">
      ${incap.length ? `<p class="cb-incap">${gi('estados')}<span><b>${esc(incap.map(k => NOMBRE_ESTADO[k]).join(', '))}</b>: no puedes llevar a cabo acciones, acciones adicionales ni reacciones.</span></p>` : ''}
      ${lineas.map(l => `<div class="cb-mod-l"><span>${esc(l.titulo)}</span>${l.piezas.map(p => `<b class="cb-mod ${p.mal ? 'mal' : 'bien'}" title="${esc(p.cond ? `Solo ${p.cond}` : p.fuente)}">${esc(p.texto)}<small>${esc(p.fuente)}${p.cond ? ' *' : ''}</small></b>`).join('')}</div>`).join('')}</section>` : '';
  const g = acciones(ch, db), pasivos = rasgosEnJuego(ch, biblioteca(), reglasVisibles(ch)).filter(r => r.grupo === 'pasivo');
  const eco = ECONOMIA.map(([k, t]) => `<button type="button" class="cb-eco-b ${c.turno[k] || (incap.length && k !== 'movimiento') ? 'gastada' : ''}" data-eco="${k}" aria-pressed="${c.turno[k]}" ${incap.length && k !== 'movimiento' ? 'disabled' : ''}><i aria-hidden="true"></i>${t}</button>`).join('');
  const conc = ch.play.conc ? `<div class="cb-conc"><span>${gi('esc_adi')}Concentración en <b>${esc(ch.play.conc)}</b></span>
    <button type="button" data-tirar="salv:con">Salvación ${sgn(bonoSalvacion(ch, 'con') - ag)}</button><button type="button" data-cmd="endconc">Terminar</button></div>` : '';
  const col = (k, t) => `<section class="cb-col cb-${k} ${c.turno[k] ? 'gastada' : ''}"><h3><span>${t}</span><small>${c.turno[k] ? 'usada este turno' : 'disponible'}</small></h3>
    ${g[k].length ? g[k].join('') : `<p class="cb-vacio">${k === 'accion' ? 'Atacar, lanzar, esquivar, correr, ayudar, esconderse, buscar, usar un objeto…' : k === 'adicional' ? 'Nada que la use ahora mismo.' : 'Ataque de oportunidad cuando un enemigo sale de tu alcance.'}</p>`}</section>`;
  return `<header class="cb-cab">
      <span class="cb-emb">${runaSvg({ n: 12, lados: 5, cls: 'cb-runa', semillaInicial: 11 })}${gi('combate')}</span>
      <div class="cb-tit"><h2>Combate</h2><span class="cb-ronda">Ronda <b data-ronda="${c.ronda}">${c.ronda}</b></span></div>
      <div class="cb-ini">${c.iniciativa == null ? `<button type="button" class="gold" data-tirar="iniciativa">${gi('iniciativa')}Tirar iniciativa ${sgn(iniciativa(ch) - ag)}</button>`
        : `<button type="button" class="cb-ini-v" data-tirar="iniciativa" title="Volver a tirar">${gi('iniciativa')}<b>${c.iniciativa}</b><small>iniciativa</small></button>`}</div>
      <button type="button" class="cb-turno" data-cmd="turno">${gi('md_tiempo')}Siguiente turno</button>
    </header>
    <div class="cb-eco" role="group" aria-label="Lo que has usado este turno">${eco}</div>
    <div class="cb-vital">${pgHtml(ch, { compacto: true })}
      <div class="cb-rapido"><input id="cbCant" type="number" inputmode="numeric" min="0" placeholder="PG" aria-label="Cantidad de puntos de golpe">
        <button type="button" class="danger" data-cbpg="dano">${gi('pg')}Daño</button><button type="button" class="vd-cura" data-cbpg="curar">${gi('curacion')}Curar</button></div>
      ${placaCa(ch, 'CA')}
      ${placaVel(ch, 'Velocidad')}
      ${P.cd != null ? `<div class="vt-placa cd">${gi('ojo', 'vt-ico')}<b>${P.cd}</b><span>CD · ataque ${sgn(P.atk)}</span></div>` : ''}
    </div>
    ${est !== 'vivo' && pgActuales(ch) === 0 ? vigiliaHtml(ch) : ''}
    ${conc}${estadosHtml(ch)}${modsHtml}
    <div class="cb-cols">${col('accion', 'Acción')}${col('adicional', 'Acción adicional')}${col('reaccion', 'Reacción')}</div>
    ${pasivos.length ? `<details class="cb-pasivos"><summary>Siempre activo <small>${pasivos.length}</small>${icon('chevron')}</summary><div>${pasivos.map(r => `<button type="button" class="cb-pasivo" data-ejver="${esc(r.clave)}"><b>${esc(r.nombre)}</b>${r.numeros.map(n => `<span class="ej-num">${esc(n.valor)}</span>`).join('')}</button>`).join('')}</div></details>` : ''}
    <div class="cb-fin"><button type="button" class="cb-salir" data-cmd="combate">${gi('gloria')}Terminar combate</button></div>`;
}

export function transicion(tipo, origen, alCubrir, { ronda = 1 } = {}) {
  if (reducedMotion()) { alCubrir(); return; }
  const r = origen?.getBoundingClientRect?.(), x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight - 60;
  const entrar = tipo === 'entrar';
  const velo = document.createElement('div');
  velo.className = `cb-velo ${entrar ? 'guerra' : 'paz'}`;
  velo.style.setProperty('--x', `${x}px`); velo.style.setProperty('--y', `${y}px`);
  velo.innerHTML = `<div class="cb-tinta"></div><div class="cb-aro"></div>
    <div class="cb-anuncio">${runaSvg({ n: 18, lados: entrar ? 5 : 6, cls: 'cb-anuncio-runa', semillaInicial: entrar ? 23 : 41 })}<span class="cb-anuncio-ico">${gi(entrar ? 'combate' : 'gloria')}</span>
      <b>${entrar ? '¡A las armas!' : 'Fin del combate'}</b><small>${entrar ? 'Ronda 1 · tira iniciativa' : `${ronda} ${ronda === 1 ? 'ronda' : 'rondas'}`}</small></div>`;
  document.body.appendChild(velo);
  document.body.classList.add('en-transicion');
  if (entrar) burst(x, y, { color: '#FF7A3D', n: 34, speed: 4.2, up: 2, life: 1100, size: 2.4, gravity: -0.03 });
  else burst(x, y, { color: '#E7C98A', n: 22, speed: 2.4, up: 2.6, life: 1300, size: 2, gravity: -0.02 });
  setTimeout(() => { alCubrir(); window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' }); velo.classList.add('revela'); }, 560);
  setTimeout(() => { velo.remove(); document.body.classList.remove('en-transicion'); }, 1750);
}
