import { esc, norm } from '../core/util.js';
import { perfil, sgn, magiaPara, nivelTotal } from '../domain/reglas2024.js';
import { reglas, reglasVisibles, usosGastados, schoolMatch } from '../domain/rasgos.js';
import { rasgosEnJuego } from '../domain/enJuego.js';
import { biblioteca, tiradasConjuro } from '../domain/catalogo.js';
import { tieneTiradas, dadosPara } from '../domain/tiradas.js';
import { slotsOf, freeOf, firstFreeFrom } from './sheet.js';
import { equipoDe, ataqueArma } from '../domain/equipo.js';
import { combateDe, ECONOMIA, economiaDeTiempo } from '../domain/combate.js';
import { iniciativa, penalizacionAgotamiento, bonoSalvacion } from '../domain/habilidades.js';
import { pgActuales, pgMaximo, estadoVital, vidaDe } from '../domain/vida.js';
import { gi } from './tema.js';
import { icon } from './icons.js';
import { runaSvg } from './magia.js';
import { burst, reducedMotion } from './fx.js';
import { estadosHtml, vigiliaHtml, placaCa, placaVel, pruebasCombateHtml, pctVida, tonoVida, pipsMuerte } from './vitales.js';
import { modsTirada, resolverModo, resumenMods, incapacitado, fmtMod, fmtRondas } from '../domain/efectos.js';
import { NOMBRE_ESTADO } from '../domain/vida.js';

const ESC_ICO = { abj: 'esc_abj', adi: 'esc_adi', con: 'esc_con', enc: 'esc_enc', evo: 'esc_evo', ilu: 'esc_ilu', nig: 'esc_nig', tra: 'esc_tra' };
export const escuelaIco = esc2 => ESC_ICO[norm(esc2 || '').slice(0, 3)] || '';

function ticks(ch, r) {
  const used = usosGastados(ch, r), left = r.max - used;
  if (r.max > 10 || r.reserva) return `<span class="rstep"><button type="button" data-rstep="${r.id}|1" aria-label="Gastar 1 de ${esc(r.nombre)}">−</button><button type="button" class="rleft" data-rset="${r.id}">${left}<small> / ${r.max}${r.reserva ? ` ${esc(r.reserva)}` : ''}</small></button><button type="button" data-rstep="${r.id}|-1" aria-label="Recuperar 1 de ${esc(r.nombre)}">+</button></span>`;
  return `<span class="rticks">${Array.from({ length: r.max }, (_, i) => `<button type="button" class="rtick ${i >= left ? 'on' : ''}" data-rtick="${r.id}|${i}" aria-label="${esc(r.nombre)}: uso ${i + 1} ${i >= left ? 'gastado' : 'disponible'}"></button>`).join('')}</span>`;
}

const AB3 = { fuerza: 'Fue', destreza: 'Des', 'constitución': 'Con', inteligencia: 'Int', 'sabiduría': 'Sab', carisma: 'Car', fue: 'Fue', des: 'Des', con: 'Con', int: 'Int', sab: 'Sab', car: 'Car' };
const dadoTxt = d => `${d.n}d${d.caras}${d.bono ? (d.bono > 0 ? `+${d.bono}` : d.bono) : ''}`;
function datosConjuro(ch, P, s, Pm) {
  const r = tiradasConjuro(s); if (!r || !tieneTiradas(r)) return { clave: Pm.cd != null && /salvaci|saving/i.test(s.desc || '') ? `CD ${Pm.cd}` : '', dano: '' };
  const clave = r.ataque ? `${sgn(Pm.atk ?? P.atk)} ataque` : r.salvacion ? `CD ${Pm.cd ?? P.cd} ${AB3[norm(r.salvacion)] || AB3[String(r.salvacion).toLowerCase()] || ''}`.trim() : '';
  const ds = dadosPara(r, { nivelPj: nivelTotal(ch), nivelConjuro: s.level, nivelEspacio: s.level || null });
  const dano = ds.length ? `${dadoTxt(ds[0])}${ds[0].tipo ? ` ${ds[0].tipo}` : ''}${ds.length > 1 ? ' +' : ''}` : '';
  return { clave, dano, cura: !!r.curacion && !r.danos.length, mitad: r.mitad };
}
function pipsEspacio(ch, P, L) {
  const tot = slotsOf(P, L); if (!tot) return '';
  const libres = freeOf(ch, P, L);
  return `<span class="cb-pips" title="${libres} de ${tot} espacios de nivel ${L} libres">${Array.from({ length: tot }, (_, i) => `<i class="${i < libres ? 'on' : ''}"></i>`).join('')}</span>`;
}

function acciones(ch, db) {
  const P = perfil(ch), mAt = modsTirada(ch, { sobre: 'ataque' }).filter(m => !/^Agotamiento/.test(m.fuente)), modo = resolverModo(mAt);
  const marca = modo === 'normal' ? mAt.filter(m => m.efecto === 'dado' || m.efecto === 'plano').map(m => `<i class="cb-at-m ${m.mal ? 'mal' : 'bien'}" title="${esc(m.fuente)}">${esc(fmtMod(m))}</i>`).join('')
    : `<i class="cb-at-m ${modo === 'ventaja' ? 'bien' : 'mal'}" title="${esc(mAt.filter(m => m.efecto === modo).map(m => m.fuente).join(', '))}">${modo === 'ventaja' ? '▲' : '▼'}</i>` + mAt.filter(m => m.efecto === 'dado').map(m => `<i class="cb-at-m ${m.mal ? 'mal' : 'bien'}">${esc(fmtMod(m))}</i>`).join('');
  const nuevo = () => ({ armas: [], trucos: [], niveles: {}, rasgos: [] });
  const grupos = { accion: nuevo(), adicional: nuevo(), reaccion: nuevo() };
  let n = 0;
  for (const o of equipoDe(ch).objetos.filter(x => x.arma).sort((a, b) => b.equipado - a.equipado)) {
    const a = ataqueArma(ch, o), props = (o.arma.props || []).map(x => x.replace(/\s*\(.*$/, ''));
    grupos.accion.armas.push(`<div class="cb-arma ${o.equipado ? 'eq' : ''}" style="--i:${n++}" data-leer="arma:${o.id}">
      <span class="cb-a-ico">${gi('o_arma')}</span>
      <span class="cb-a-t"><b>${esc(o.nombre)}</b><small>${o.equipado ? '<em class="cb-eq">en mano</em>' : ''}${esc([o.arma.distancia, ...props.slice(0, 3)].filter(Boolean).join(' · '))}</small>
        ${o.arma.maestria ? `<span class="cb-maes" title="Maestría">${gi('dote')}${esc(o.arma.maestria)}</span>` : ''}${a.estilos.length ? `<span class="cb-maes cb-estilo" title="Estilo de combate">${gi('ca')}${esc(a.estilos[0])}</span>` : ''}</span>
      <span class="cb-a-bts"><button type="button" class="cb-tir at" data-cbataque="${o.id}"><small>Ataque</small><b>${esc(a.ataque)}</b>${marca}</button><button type="button" class="cb-tir dn" data-cbdano="${o.id}"><small>Daño</small><b>${esc(a.dano.replace(/\s+\S+$/, ''))}</b><em>${esc(a.tipo || '')}</em></button></span></div>`);
  }
  const conj = [];
  if (db) ch.book.forEach((e, bi) => {
    const s = db.catalog[e.sid]; if (!s) return;
    if (s.level > 0 && !e.prep && !e.always && !e.gratis) return;
    const g = economiaDeTiempo(s.tiempo); if (!grupos[g]) return;
    conj.push({ e, bi, s, g });
  });
  conj.sort((a, b) => a.s.level - b.s.level || a.s.es.localeCompare(b.s.es, 'es'));
  const recupera = reglas(ch).filter(r => r.tipo === 'al_lanzar' && r.efecto === 'recuperar');
  for (const { e, bi, s, g } of conj) {
    const Pm = magiaPara(P, e.fuente), ico = escuelaIco(s.escuela), d = datosConjuro(ch, P, s, Pm);
    const rec = s.level > 0 && recupera.find(r => schoolMatch(s, r.escuela));
    const gratis = e.gratis && !e.used, sinEsp = s.level > 0 && !gratis && !firstFreeFrom(ch, P, s.level);
    const flags = [s.conc ? '<i class="hz-f conc" title="Concentración">C</i>' : '', s.ritual ? '<i class="hz-f rit" title="Ritual">R</i>' : '', gratis ? '<i class="hz-f gratis" title="Uso gratis disponible">gratis</i>' : '',
      rec ? `<i class="hz-f rec" title="${esc(`${rec.nombre}: con un espacio de nivel ${rec.espacioMin || 1} o más recuperas un espacio gastado de nivel inferior (máximo ${rec.efectoN || 5}).`)}">${icon('reset')}espacio</i>` : ''].join('');
    const html = `<button type="button" class="cb-hz ${sinEsp ? 'agotado' : ''} ${ch.play.conc === s.es ? 'activo' : ''}" style="--i:${n++}" data-sc="${ico.slice(4)}" data-cast="${bi}" data-leer="conj:${bi}" aria-label="Lanzar ${esc(s.es)}${sinEsp ? ' (sin espacios)' : ''}">
      <span class="hz-ico">${ico ? gi(ico) : gi('libro')}<i class="cb-niv ${s.level ? '' : 'truco'}">${s.level || 'T'}</i></span>
      <span class="hz-t"><b>${esc(s.es)}</b><small><em class="cb-esc">${esc(s.escuela || '')}</em>${s.alcance ? ` · ${esc(s.alcance)}` : ''}</small><span class="hz-flags">${flags}</span></span>
      <span class="hz-dato">${d.clave ? `<b>${esc(d.clave)}</b>` : ''}${d.dano ? `<small class="${d.cura ? 'cura' : ''}">${esc(d.dano)}${d.mitad ? ' · ½' : ''}</small>` : ''}${sinEsp ? '<small class="sin">sin espacios</small>' : ''}</span>
      <span class="hz-go" aria-hidden="true">${gi(ico || 'libro')}</span></button>`;
    if (s.level) (grupos[g].niveles[s.level] ||= []).push(html); else grupos[g].trucos.push(html);
  }
  const lib = biblioteca();
  for (const r of rasgosEnJuego(ch, lib, reglasVisibles(ch))) {
    if (!grupos[r.grupo]) continue;
    const agot = r.recurso && usosGastados(ch, r.recurso) >= r.recurso.max;
    grupos[r.grupo].rasgos.push(`<div class="cb-rg ${agot ? 'agotado' : ''}" style="--i:${n++}" data-leer="rasgo:${esc(r.clave)}"><span class="cb-rg-ico">${gi(r.fuente === 'especie' ? 'criatura' : r.fuente === 'dote' ? 'dote' : norm(r.clase || '').replace(/[^a-z]/g, '') || 'dote')}</span>
      <button type="button" class="cb-rg-t" data-ejver="${esc(r.clave)}"><b>${esc(r.nombre)}</b><small>${esc(r.resumen || r.etiqueta)}</small></button>
      ${r.numeros.length || r.recurso ? `<span class="cb-rg-num">${r.numeros.map(x => `<span class="ej-num" title="${esc(x.nombre)}">${esc(x.valor)}</span>`).join('')}${r.recurso ? ticks(ch, r.recurso) : ''}</span>` : ''}</div>`);
  }
  return grupos;
}
function ataquesPorAccion(ch) {
  const r = rasgosEnJuego(ch, biblioteca(), []).find(x => /^ataque (adicional|extra)/.test(norm(x.nombre)));
  if (!r) return 1;
  const v = parseInt(r.numeros.find(x => /ataques/i.test(x.nombre))?.valor, 10);
  return v > 1 ? v : 2;
}
const SIGILO = { accion: 'e-accion', adicional: 'e-adicional', reaccion: 'e-reaccion' };
const VACIO = { accion: 'Atacar, esquivar, correr, destrabarse, ayudar, esconderse, buscar, usar un objeto…', adicional: 'Nada que la use ahora mismo.', reaccion: 'Ataque de oportunidad cuando un enemigo sale de tu alcance.' };
function grupoHtml(ch, P, c, k, t, g, extra = '') {
  const subs = [];
  if (g.armas.length) subs.push(['Armas', 'armas', g.armas, `${ataquesPorAccion(ch) > 1 ? `<span class="cb-sub-n">${ataquesPorAccion(ch)} ataques por acción</span>` : ''}`]);
  if (g.trucos.length) subs.push(['Trucos', '', g.trucos, '<span class="cb-sub-n">a voluntad</span>']);
  for (const L of Object.keys(g.niveles).map(Number).sort((a, b) => a - b)) subs.push([`Nivel ${L}`, `n${L}`, g.niveles[L], pipsEspacio(ch, P, L)]);
  if (g.rasgos.length) subs.push(['Rasgos', 'rasgos', g.rasgos, '']);
  const gastada = c.turno[k];
  return `<section class="cb-grupo g-${k} ${gastada ? 'gastada' : ''}" aria-label="${t}">
    <header class="cb-g-cab"><i class="cb-g-sig ${SIGILO[k]}" aria-hidden="true"></i><h3>${t}</h3>${extra}
      <button type="button" class="cb-g-estado" data-eco="${k}" aria-pressed="${gastada}" title="Marcar como ${gastada ? 'disponible' : 'usada'}">${gastada ? 'usada' : 'disponible'}</button></header>
    ${subs.length ? subs.map(([tt, cls, items, cola]) => `<div class="cb-sub ${cls}"><h4><span>${tt}</span>${cola}</h4><div class="cb-sub-g">${items.join('')}</div></div>`).join('') : `<p class="cb-vacio">${VACIO[k]}</p>`}</section>`;
}

const ECO_CORTO = { adicional: 'Adicional', movimiento: 'Mover' };
function orbeHtml(ch) {
  const v = vidaDe(ch), max = pgMaximo(ch), act = pgActuales(ch), est = estadoVital(ch), pct = pctVida(ch), temp = v.temp ? Math.min(100, Math.round(v.temp / max * 100)) : 0;
  return `<button type="button" class="cb-orbe ${tonoVida(ch)} ${est}" data-cmd="vida" aria-label="Puntos de golpe: ${act} de ${max}${v.temp ? `, más ${v.temp} temporales` : ''}. Tocar para cambiarlos">
    <svg class="cb-anillo" viewBox="0 0 120 120" aria-hidden="true"><circle class="a-marcas" cx="60" cy="60" r="44" pathLength="100"/><circle class="a-pista" cx="60" cy="60" r="52"/>
      <circle class="a-vida" cx="60" cy="60" r="52" pathLength="100" style="stroke-dasharray:${pct} 100"/>${temp ? `<circle class="a-temp" cx="60" cy="60" r="58" pathLength="100" style="stroke-dasharray:${temp} 100"/>` : ''}</svg>
    <span class="pg-cifra"><b>${act}</b><small>/ ${max}</small></span>
    <span class="cb-orbe-l">${act === 0 && est !== 'vivo' ? `${est === 'estable' ? 'Estable' : est === 'muerto' ? 'Muerto' : 'Moribundo'}` : 'Puntos de golpe'}</span>
    ${v.temp ? `<span class="cb-orbe-t">+${v.temp}</span>` : ''}${act === 0 && est !== 'vivo' ? `<span class="cb-orbe-p">${pipsMuerte(ch)}</span>` : ''}</button>`;
}
export function combateHtml(ch, db) {
  const c = combateDe(ch), P = perfil(ch), ag = penalizacionAgotamiento(ch), est = estadoVital(ch), incap = incapacitado(ch);
  const lineas = resumenMods(ch), modsHtml = lineas.length || incap.length ? `<section class="cb-mods" aria-label="Lo que te afecta">
      ${incap.length ? `<p class="cb-incap">${gi('estados')}<span><b>${esc(incap.map(k => NOMBRE_ESTADO[k]).join(', '))}</b>: no puedes llevar a cabo acciones, acciones adicionales ni reacciones.</span></p>` : ''}
      ${lineas.map(l => `<div class="cb-mod-l"><span>${esc(l.titulo)}</span>${l.piezas.map(p => `<b class="cb-mod ${p.mal ? 'mal' : 'bien'}" title="${esc(p.cond ? `Solo ${p.cond}` : p.fuente)}">${esc(p.texto)}<small>${esc(p.fuente)}${p.cond ? ' *' : ''}</small></b>`).join('')}</div>`).join('')}</section>` : '';
  const g = acciones(ch, db), pasivos = rasgosEnJuego(ch, biblioteca(), reglasVisibles(ch)).filter(r => r.grupo === 'pasivo');
  const eco = ECONOMIA.map(([k, t]) => `<button type="button" class="cb-eco-b e-${k} ${c.turno[k] || (incap.length && k !== 'movimiento') ? 'gastada' : ''}" data-eco="${k}" data-leer="eco:${k}" aria-pressed="${c.turno[k]}" aria-label="${t}${c.turno[k] ? ': gastada' : ''}" ${incap.length && k !== 'movimiento' ? 'disabled' : ''}><i aria-hidden="true"></i><span>${ECO_CORTO[k] ? `<em class="l-larga">${t}</em><em class="l-corta">${ECO_CORTO[k]}</em>` : t}</span></button>`).join('');
  const conc = ch.play.conc ? `<div class="cb-conc"><span data-leer="conc">${gi('esc_adi')}Concentración en <b>${esc(ch.play.conc)}</b>${ch.play.concRondas != null ? `<small class="cb-conc-q">· quedan ${fmtRondas(ch.play.concRondas)}</small>` : ''}</span>
    <button type="button" data-cmd="tiraconc" aria-label="Salvación de concentración: te pedirá el daño recibido">Salvación ${sgn(bonoSalvacion(ch, 'con') - ag)}</button><button type="button" data-cmd="endconc">Terminar</button></div>` : '';
  return `<section class="cb-mando" aria-label="Estado del combate">
    ${orbeHtml(ch)}
    <header class="cb-m-cab">
      <span class="cb-emb">${runaSvg({ n: 12, lados: 5, cls: 'cb-runa', semillaInicial: 11 })}${gi('combate')}</span>
      <div class="cb-tit"><h2>Combate</h2><span class="cb-ronda">Ronda <b data-ronda="${c.ronda}">${c.ronda}</b></span></div>
      <div class="cb-ini ${c.iniciativa == null ? 'falta' : ''}">${c.iniciativa == null ? `<button type="button" class="gold" data-tirar="iniciativa">${gi('iniciativa')}Tirar iniciativa ${sgn(iniciativa(ch) - ag)}</button>`
        : `<button type="button" class="cb-ini-v" data-tirar="iniciativa" title="Iniciativa${c.iniManual ? ' escrita a mano' : ''}: toca para volver a tirar"><b>${c.iniciativa}</b><small>${c.iniManual ? 'a mano' : 'inic.'}</small></button>`}<button type="button" class="cb-ini-e" data-cbini aria-label="Escribir la iniciativa a mano" title="Escribir la iniciativa a mano (por ejemplo, si la intercambias con un aliado)">${icon('quill')}</button></div>
      <button type="button" class="cb-turno" data-cmd="turno">${gi('md_tiempo')}<span>Siguiente turno</span></button>
    </header>
    <div class="cb-eco" role="group" aria-label="Lo que has usado este turno">${eco}</div>
    <div class="cb-base">
      <div class="cb-rapido"><input id="cbCant" type="text" inputmode="tel" autocomplete="off" placeholder="PG" aria-label="Cantidad de puntos de golpe">
        <button type="button" class="danger" data-cbpg="dano" aria-label="Daño">${gi('pg')}<span>Daño</span></button><button type="button" class="vd-cura" data-cbpg="curar" aria-label="Curar">${gi('curacion')}<span>Curar</span></button></div>
      <div class="cb-sellos">${placaCa(ch, 'CA', 'data-leer="ca" aria-label="Clase de armadura: mantén pulsado para ver el desglose"')}
        ${placaVel(ch, 'Velocidad', 'data-leer="vel"')}
        ${P.cd != null ? `<div class="vt-placa cd">${gi('ojo', 'vt-ico')}<b>${P.cd}</b><span>CD · ataque ${sgn(P.atk)}</span></div>` : ''}</div>
    </div>
  </section>
    ${est !== 'vivo' && pgActuales(ch) === 0 ? vigiliaHtml(ch) : ''}
    ${conc}<section class="cb-cond">${estadosHtml(ch)}${modsHtml}</section>
    ${pruebasCombateHtml(ch)}
    <div class="cb-ars-cab"><h3>${gi('combate')}Qué puedes hacer</h3><span class="cb-pista"><b>Toca</b> para usar · <b>mantén</b> para leer</span></div>
    <div class="cb-ars">${grupoHtml(ch, P, c, 'accion', 'Acción', g.accion)}${grupoHtml(ch, P, c, 'adicional', 'Acción adicional', g.adicional)}${grupoHtml(ch, P, c, 'reaccion', 'Reacción', g.reaccion, '<span class="cb-g-nota">también en turnos ajenos</span>')}</div>
    ${pasivos.length ? `<section class="cb-siempre"><h3>${gi('estrellas')}Siempre activo</h3><div>${pasivos.map(r => `<button type="button" class="cb-pasivo" data-ejver="${esc(r.clave)}" data-leer="rasgo:${esc(r.clave)}"><b>${esc(r.nombre)}</b>${r.numeros.map(x => `<span class="ej-num">${esc(x.valor)}</span>`).join('')}</button>`).join('')}</div></section>` : ''}
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
