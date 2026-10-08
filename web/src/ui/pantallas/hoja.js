// Hoja de personaje: cabecera, estadísticas, barra de espacios, libro de conjuros y rasgos «En juego».
// pintarHoja() y pintarBarra() repintan la hoja entera a partir del estado.
import { esc, norm } from '../../core/util.js';
import { NOMBRE_CAR, perfil, sgn, clasesDe, clasesTexto } from '../../domain/reglas/reglas2024.js';
import { escuelasAlLanzar, descDisparoLanzar, reglasVisibles, estadoRecurso, etiquetaRecarga, coincideEscuela, usosGastados } from '../../domain/clases/rasgos.js';
import { $, patch, patchKeyed, morph } from '../componentes/dom.js';
import { icon, ASTROLABE } from '../componentes/icons.js';
import { pop } from '../animaciones/fx.js';
import { runaSvg } from '../animaciones/magia.js';
import { aplicarTema, gi, temaDe } from '../componentes/tema.js';
import { tiradasConjuro } from '../../domain/conjuros/catalogo.js';
import { biblioteca } from '../../domain/libros/biblioteca.js';
import { iconoDano } from '../dialogs/tiradas.js';
import { avatarHtml, botonYo } from '../componentes/avatar.js';
import { efectoDeConjuro } from '../../domain/combate/efectos.js';
import { paraRecordar } from '../../domain/personaje/diario.js';
import { notaHtml } from '../dialogs/diario.js';
import { rasgosConObjetivo } from '../../domain/combate/concentracion.js';
import { rasgosEnJuego, agrupar, numerosMarciales, FUENTES } from '../../domain/clases/enJuego.js';
import { vitalesHtml, caracteristicasHtml } from './vitales.js';
import { combateHtml, escuelaIco } from './combate.js';
import { combateDe } from '../../domain/combate/combate.js';
import { vidaDe, esYo } from '../../domain/combate/vida.js';
import { percepcionPasiva } from '../../domain/reglas/habilidades.js';
import { actualizarLuto, memorialHtml } from './luto.js';
import { espaciosDe, espaciosLibres, primerLibreDesde, estaPreparado, numPreparados, numTrucos, conConjuros, claveEscuela } from '../../domain/conjuros/espacios.js';
import { origenLinea } from '../../domain/personaje/descripcion.js';

const lemaHtml = t => esc(t).replace(/_(.+?)_/g, '<span class="u">$1</span>');

function candles(ch, P, L) {
  const s = espaciosDe(P, L), free = espaciosLibres(ch, P, L); let h = '';
  for (let i = 0; i < s; i++) {
    const spent = i >= free;
    h += `<button type="button" class="slotbtn ${spent ? 'spent' : ''}" style="--i:${i}" data-slotbtn="${L}:${i}" aria-label="Espacio de nivel ${L}: ${spent ? 'gastado, toca para recuperarlo' : 'libre, toca para gastarlo'}"><span class="orb"></span></button>`;
  }
  return h;
}
function ce(val, attrs, editing) { return `<span ${editing ? 'contenteditable="true"' : ''} ${attrs}>${esc(val)}</span>`; }

const inspHtml = ch => { const on = !!vidaDe(ch).inspiracion;
  return `<button type="button" class="hero-insp ${on ? 'on' : ''}" data-cmd="inspiracion" aria-pressed="${on}" title="${on ? 'Tienes inspiración heroica: gástala para repetir un d20' : 'Sin inspiración heroica: toca para marcarla'}" aria-label="Inspiración heroica: ${on ? 'la tienes' : 'no la tienes'}">
    <svg class="hi-marco" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 L38 20 L20 38 L2 20 Z"/><path class="hi-in" d="M20 7 L33 20 L20 33 L7 20 Z"/></svg>${gi('inspiracion', 'hi-ico')}<i class="hi-chispa" aria-hidden="true"></i></button>`; };
function heroHtml(ch, P) {
  const mods = `Competencia ${sgn(P.pb)}${P.apKey ? ` · ${NOMBRE_CAR[P.apKey]} ${sgn(P.mod)} para conjuros` : ''} · Percepción pasiva ${percepcionPasiva(ch)}`;
  const t = temaDe(ch);
  return `${ASTROLABE}${ch.retrato ? '' : gi(t.icono, 'emblem')}
    <div class="hero-id"><span class="hero-retrato"><button type="button" class="hero-av" data-cmd="retrato" aria-label="${ch.retrato ? 'Cambiar' : 'Añadir'} retrato">${runaSvg({ n: 16, lados: t.icono === 'adivino' ? 6 : 5, cls: 'hero-runa', semillaInicial: (ch.nombre || 'x').length * 31 })}${avatarHtml(ch, 'xl')}<span class="av-edit">${icon('quill')}</span></button>
    ${inspHtml(ch)}</span>
    <h1>${esc(ch.nombre)}<svg class="underline" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9 C 60 3, 120 12, 180 7 S 270 5, 297 8"/></svg></h1></div>
    <div class="clase">${clasesDe(ch).length > 1 ? `${clasesDe(ch).map(c => `${esc(c.clase)} ${c.nivel}${c.subclase ? ` <span class="sub">· ${esc(c.subclase)}</span>` : ''}`).join(' <span class="sub">/</span> ')}, <b>nivel ${P.lvl}</b>` : `${esc(ch.clase)}${ch.subclase ? ` <span class="sub">· ${esc(ch.subclase)}</span>` : ''}, nivel ${ch.nivel}`}${origenLinea(ch) ? `<span class="sub">. ${esc(origenLinea(ch))}</span>` : ''}</div>
    <div class="mods">${mods}</div>
    ${ch.lema ? `<div class="motto">${lemaHtml(ch.lema)}</div>` : ''}
    <div class="chips">
      <button type="button" class="chip" data-cmd="editchar">${icon('user')}Editar personaje</button>
      <button type="button" class="chip" data-cmd="rules">${icon('sliders')}Rasgos</button>
      <button type="button" class="chip" data-cmd="equipo">${gi('cofre')}Inventario${(ch.equipo?.objetos || []).length ? `<small class="chip-n">${ch.equipo.objetos.length}</small>` : ''}</button>
      <button type="button" class="chip" data-cmd="historia">${gi('libro')}Historia</button>
      <button type="button" class="chip" data-cmd="diario">${icon('quill')}Diario</button>
      ${P.lvl < 20 ? `<button type="button" class="chip gold" data-cmd="levelup">${icon('star')}Subir a nivel ${P.lvl + 1}</button>` : ''}
    </div>`;
}
function statsHtml(db, ch, P) {
  const pc = numPreparados(db, ch), cc = numTrucos(db, ch);
  const st = (v, l, cls = '') => `<div class="stat ${cls} ${String(v).replace(/<[^>]*>|&[a-z]+;/g, 'x').length > 6 ? 'long' : ''}"><b>${v}</b><span>${l}</span></div>`;
  if (!P.c) {
    // Sin clase lanzadora: la CD y el ataque de los conjuros de especie (linaje élfico o gnomo, legado infernal)
    const esp = !P.apKey && P.cds?.find(x => x.especie);
    const magia = P.apKey ? [{ nombre: 'CD de salvación', valor: String(P.cd) }, { nombre: 'Ataque de conjuro', valor: sgn(P.atk) }]
      : esp ? [{ nombre: 'CD de especie', valor: String(esp.cd) }, { nombre: 'Ataque de especie', valor: sgn(esp.atk) }] : [];
    return [...magia, ...numerosMarciales(ch)].slice(0, 4).map((n, i) => st(esc(n.valor), esc(n.nombre), i < 2 ? 'key' : '')).join('');
  }
  const AB = { fue: 'Fue', des: 'Des', con: 'Con', int: 'Int', sab: 'Sab', car: 'Car' }, varias = (P.cds || []).length > 1;
  const cd = varias ? st(P.cds.map(x => x.cd).join(' · '), `CD (${P.cds.map(x => AB[x.ap]).join(' · ')})`, 'key') : st(P.cd ?? '—', 'CD de salvación', 'key');
  const at = varias ? st(P.cds.map(x => sgn(x.atk)).join(' · '), `Ataque (${P.cds.map(x => AB[x.ap]).join(' · ')})`, 'key') : st(P.atk == null ? '—' : sgn(P.atk), 'Ataque de conjuro', 'key');
  const sinTrucos = !P.maxCant && !cc, marcial = sinTrucos ? numerosMarciales(ch).filter(n => !/^(Competencia|Dado de golpe)$/.test(n.nombre))
    .sort((a, b) => (a.nombre === 'Maestría con armas') - (b.nombre === 'Maestría con armas'))[0] : null;
  return cd + at
    + (marcial ? st(esc(marcial.valor), esc(marcial.nombre)) : st(P.c?.cant ? `${cc}/${P.maxCant}` : cc, 'Trucos', P.c?.cant && cc > P.maxCant ? 'over' : ''))
    + st(P.c ? `${pc}/${P.maxPrep}` : pc, 'Preparados', P.c && pc > P.maxPrep ? 'over' : '');
}

function recursoHtml(ch, r) {
  const used = usosGastados(ch, r), left = r.max - used;
  const ctl = r.max <= 10 && !r.reserva
    ? `<span class="rticks">${Array.from({ length: r.max }, (_, i) => `<button type="button" class="rtick ${i >= left ? 'on' : ''}" data-rtick="${r.id}|${i}" aria-label="${esc(r.nombre)}: uso ${i + 1} ${i >= left ? 'gastado' : 'disponible'}"></button>`).join('')}</span>`
    : `<span class="rstep"><button type="button" data-rstep="${r.id}|1" aria-label="Gastar 1 de ${esc(r.nombre)}">−</button><button type="button" class="rleft" data-rset="${r.id}" aria-label="Cambiar lo que queda">${left}<small> / ${r.max}${r.reserva ? ` ${esc(r.reserva)}` : ''}</small></button><button type="button" data-rstep="${r.id}|-1" aria-label="Recuperar 1 de ${esc(r.nombre)}">+</button></span>`;
  const formas = r.id === 'tpl:druida.forma' ? `<button type="button" class="ruse" data-cmd="formas">${gi('criatura')}Formas${(ch.formas || []).length + (ch.formasMano || []).length ? ` (${(ch.formas || []).length + (ch.formasMano || []).length})` : ''}</button>` : '';
  return `<div class="res rr ${left === 0 ? 'empty-res' : ''}" data-resid="${esc(r.id)}"><strong>${esc(r.nombre)}</strong>${ctl}${formas}<span class="rnote">${esc(etiquetaRecarga(r))}${r.nota ? '. ' + esc(r.nota) : ''}</span></div>`;
}
function dadosHtml(ch, r) {
  const st = estadoRecurso(ch, r.id), sides = parseInt(String(r.dado || 'd20').slice(1), 10) || 20; let h = '';
  for (let i = 0; i < r.max; i++) {
    const d = (st.dice || [])[i] || { v: '', used: false };
    h += `<span class="pdie ${d.used ? 'used' : ''}"><input type="text" inputmode="numeric" maxlength="${String(sides).length}" placeholder="${esc(r.dado || 'd20')}" data-dv="${r.id}|${i}|${sides}" value="${esc(d.v)}" ${d.used ? 'readonly' : ''} aria-label="${esc(r.nombre)}: dado ${i + 1}">`
      + `<button type="button" class="tick ${d.used ? 'on' : ''}" data-dused="${r.id}|${i}" aria-pressed="${!!d.used}" aria-label="${esc(r.nombre)}: dado ${i + 1} usado"></button></span>`;
  }
  return `<div class="res pres"><strong>${esc(r.nombre)}</strong>${h}<span class="rnote">Anota ${r.max}${esc(r.dado || 'd20')} al terminar un descanso largo. ${esc(r.nota || '')} Marca la casilla al usar uno.</span></div>`;
}
function recuperarHtml(ch, r) {
  const st = estadoRecurso(ch, r.id);
  return `<div class="res rr"><strong>${esc(r.nombre)}</strong><button type="button" class="ruse ${st.used ? 'on' : ''}" data-recuse="${r.id}" aria-pressed="${!!st.used}">${st.used ? 'Usada hoy' : 'Usar'}</button>
    <span class="rnote">Hasta ${r.max} niveles de espacios (ninguno de nivel ${(r.nivMax || 5) + 1}+). ${esc(r.nota || '')}</span></div>`;
}
function alLanzarHtml(db, ch, r) {
  let list = '';
  if (r.escuela) {
    const items = [];
    ch.book.forEach(e => {
      const s = db.catalog[e.sid]; if (!s || s.level < 1 || !coincideEscuela(s, r.escuela)) return;
      const notes = []; if (r.espacioMin && s.level < r.espacioMin) notes.push(`solo con espacio de nivel ${r.espacioMin}+`); if (r.soloEspacio && s.ritual) notes.push('no como ritual');
      items.push(`<li><span class="aa-lv">${s.level}</span><span><span class="aa-nm">${esc(s.es)}</span>${notes.length ? `<span class="aa-note">${notes.join(', ')}</span>` : ''}</span></li>`);
    });
    list = items.length ? `<ul class="aa-list">${items.join('')}</ul>` : `<div class="aa-note">Aún no hay conjuros de ${esc(r.escuela.toLowerCase())} de nivel 1 o superior en el libro.</div>`;
  }
  return `<div class="res wide"><strong>${esc(r.nombre)}</strong><span class="rnote" style="font-size:var(--fs-s);color:var(--ink)">${esc(descDisparoLanzar(r))}</span><div style="flex-basis:100%">${list}</div></div>`;
}
function resourcesHtml(db, ch, P) {
  let h = '';
  const rec = paraRecordar(ch);
  if (rec.length) h += `<div class="res wide rec-card"><strong>${icon('star')} Para recordar</strong><button type="button" class="ruse" data-cmd="diario">Abrir diario</button><ul class="nts">${rec.slice(0, 4).map(n => notaHtml(n, true)).join('')}</ul>${rec.length > 4 ? `<span class="rnote">Y ${rec.length - 4} más en el diario.</span>` : ''}</div>`;
  h += efectosHtml(ch);
  if (P.pact) h += `<div class="res"><strong>Magia de pacto</strong><span class="rnote">${P.pact.n} ${P.pact.n > 1 ? 'espacios' : 'espacio'} de nivel ${P.pact.level}; se recuperan con un descanso corto o largo.</span></div>`;
  reglasVisibles(ch).forEach(r => { h += r.tipo === 'recurso' ? recursoHtml(ch, r) : r.tipo === 'dados' ? dadosHtml(ch, r) : r.tipo === 'recuperar' ? recuperarHtml(ch, r) : alLanzarHtml(db, ch, r); });
  return h ? `<div class="resources">${h}</div>` : '';
}
function efectosHtml(ch) {
  const pl = ch.play, sug = rasgosConObjetivo(ch);
  if (!pl.conc && !pl.efectos.length && !sug.length) return '';
  const chips = (clave, lista, conYo) => lista.map((o, i) => `<button type="button" class="obj-chip ${conYo && esYo(ch, o) ? 'yo' : ''}" data-objdel="${clave}|${i}" aria-label="Quitar ${esc(o)}">${esc(o)}<span aria-hidden="true">×</span></button>`).join('');
  const yo = (clave, nombre, lista) => (efectoDeConjuro(nombre)?.bueno ? botonYo(ch, lista, `data-objyo="${clave}"`) : '');
  const entrada = (clave, ph) => `<input class="obj-in" maxlength="60" data-objin="${clave}" placeholder="${ph}" autocomplete="off" enterkeyhint="done" aria-label="Añadir objetivo">`;
  const fila = (clave, nombre, nota, lista, fin) => `<div class="ef-row"><div class="ef-h"><b>${esc(nombre)}</b>${nota ? `<small>${esc(nota)}</small>` : ''}${fin}</div>
    <div class="objt-list">${yo(clave, nombre, lista)}${chips(clave, lista, !!efectoDeConjuro(nombre)?.bueno)}${entrada(clave, lista.length ? 'Añadir otro…' : 'Sobre quién: escribe y pulsa Intro')}</div></div>`;
  let h = '';
  if (pl.conc) h += fila('conc', pl.conc, 'Concentración', pl.concObj, '<button type="button" class="ruse" data-cmd="endconc">Terminar</button>');
  pl.efectos.forEach(e => { h += fila(e.id, e.nombre, e.nota, e.objetivos, `<button type="button" class="ruse" data-eferm="${e.id}">Terminar</button>`); });
  const add = sug.length ? `<div class="ef-add">${sug.map(n => `<button type="button" data-efnuevo="${esc(n)}">${icon('plus')}${esc(n)}</button>`).join('')}</div>` : '';
  return `<div class="res wide ef-card"><strong>${gi('ojo')} Efectos activos</strong>${h || '<span class="rnote">Nada activo. Marca un rasgo cuando lo uses sobre alguien, o concéntrate en un conjuro.</span>'}${add}
    ${pl.conc ? `<label class="chk-line ef-pedir"><input type="checkbox" data-pedirobj ${pl.pedirObjetivos ? 'checked' : ''}> Preguntar sobre quién al concentrarme en un conjuro con objetivos</label>` : ''}</div>`;
}
const ICONO_GRUPO = { fijados: 'inspiracion', accion: 'combate', adicional: 'relampago', reaccion: 'ca', pasivo: 'estrellas', fuera: 'vela' };
const iconoFuente = r => (r.fuente === 'especie' ? 'criatura' : r.fuente === 'dote' ? 'dote' : norm(r.clase || '').replace(/[^a-z]/g, ''));
function enJuegoHtml(ch, P) {
  const todos = rasgosEnJuego(ch, biblioteca(), reglasVisibles(ch)); if (!todos.length) return '';
  const lanza = !!P.c, abierto = lanza ? !!ch.enJuego?.abierto : ch.enJuego?.abierto !== false;
  const fij = ch.enJuego?.fijados || [], hay = FUENTES.filter(([k]) => !k || todos.some(r => r.fuente === k));
  const filtro = hay.some(([k]) => k === ch.enJuego?.filtro) ? ch.enJuego.filtro : '';
  const cuenta = hay.filter(([k]) => k).map(([k]) => { const n = todos.filter(r => r.fuente === k).length; return k === 'dote' ? `${n} ${n === 1 ? 'dote' : 'dotes'}` : k === 'especie' ? `${n} de especie` : `${n} de clase`; });
  const tarjeta = (r, i) => {
    const rec = r.recurso, left = rec ? rec.max - usosGastados(ch, rec) : 0, fijo = fij.includes(r.clave);
    return `<article class="ej-it f-${r.fuente} o-${r.origen} ${fijo ? 'fijo' : ''}" style="--i:${Math.min(i, 8)}">
      <button type="button" class="ej-main" data-ejver="${esc(r.clave)}"><span class="visually-hidden">Leer </span><b>${esc(r.nombre)}</b>
        <small>${gi(iconoFuente(r), 'ej-ico')}${esc(r.etiqueta)}</small>
        ${r.resumen ? `<span class="ej-res">${esc(r.resumen)}</span>` : ''}</button>
      <div class="ej-side">${r.eleccion && !r.eleccion.actual && r.eleccion.cambia !== 'uso' ? `<button type="button" class="ej-num ej-pend" data-ejver="${esc(r.clave)}" title="Elige cómo funciona ${esc(r.nombre)}">${r.eleccion?.id ? 'Elegir opción' : 'Elegir variante'}</button>`
          : r.numeros.map(n => `<span class="ej-num" title="${esc(n.nombre)}">${esc(n.valor)}</span>`).join('')}
        ${rec ? `<button type="button" class="ej-usos ${left ? '' : 'agotado'}" data-irrec="${esc(rec.id)}" aria-label="${esc(rec.nombre)}: quedan ${left} de ${rec.max}. Ir a su contador" title="Los usos se marcan en su tarjeta de recursos">${rec.max <= 5
          ? `<span class="ej-pips" aria-hidden="true">${Array.from({ length: rec.max }, (_, i) => `<i class="${i < left ? '' : 'gast'}"></i>`).join('')}</span>` : `${left}<small>/${rec.max}</small>`}</button>` : ''}
        <button type="button" class="ej-star" data-ejfijar="${esc(r.clave)}" aria-pressed="${fijo}" aria-label="${fijo ? 'Quitar de fijados' : 'Fijar arriba'}: ${esc(r.nombre)}" title="${fijo ? 'Quitar de fijados' : 'Fijar arriba'}">★</button></div></article>`;
  };
  const sinTextos = todos.every(r => !r.texto), grupos = agrupar(todos, fij, filtro);
  return `<div class="ej-head"><span class="ej-emb">${gi('dote')}</span><h2>En juego</h2><small>${esc(cuenta.join(' · '))}</small>
      ${abierto ? `<button type="button" class="ruse ej-ajustes" data-cmd="rules" aria-label="Rasgos: progresión de la clase y recursos" title="Progresión y recursos">${icon('sliders')}</button>` : ''}
      <button type="button" class="ruse ej-toggle" data-ej="toggle" aria-expanded="${abierto}">${abierto ? 'Plegar' : 'Desplegar'}</button></div>
    ${abierto ? `${hay.length > 2 ? `<div class="seg sm ej-filtro" role="radiogroup" aria-label="Mostrar rasgos de">${hay.map(([k, t]) => `<button type="button" role="radio" aria-checked="${filtro === k}" data-ejfiltro="${k}"><i class="ej-dot f-${k || 'todo'}" aria-hidden="true"></i>${esc(t)}<small>${k ? todos.filter(r => r.fuente === k).length : todos.length}</small></button>`).join('')}</div>` : ''}
      ${sinTextos ? `<p class="note ej-note">Importa el Manual del Jugador en <button type="button" class="linkish" data-cmd="manual">Libros y manuales</button> para ver qué hace cada rasgo. Se lee en este dispositivo.</p>` : ''}
      ${grupos.map(g => `<div class="ej-grupo ej-${g.clave}"><h3>${gi(ICONO_GRUPO[g.clave] || 'estrellas', 'ej-gico')}<span>${esc(g.titulo)}</span><small>${g.rasgos.length}</small></h3><div class="ej-grid">${g.rasgos.map(tarjeta).join('')}</div></div>`).join('')}` : ''}`;
}
function legendHtml(ch, P, schools) {
  const ritualTxt = P.ritualLibro ? 'se lanza desde el libro sin preparar (+10 min)' : 'si está preparado, sin gastar espacio (+10 min)';
  return `<span class="howto"><b>Toca</b> un conjuro para lanzarlo. <b>Mantén pulsado</b> para leerlo y elegir nivel, ritual o uso gratis. Las gemas encendidas son espacios libres.</span>
    <details><summary>Símbolos de la hoja ${icon('chevron')}</summary><div class="keys">
      <span><b>◆</b> preparado</span><span><b style="color:var(--gold)">◆</b> siempre preparado, no cuenta</span>
      <span><b>R</b> ritual: ${ritualTxt}</span><span><b>C</b> concentración</span>
      <span>Subrayado dorado: uso gratis sin espacio</span><span>Barra de color: escuela de magia</span>
      ${schools.length ? '<span><b style="color:var(--gold)">Escuela en dorado</b>: activa un rasgo al lanzar</span>' : ''}</div></details>`;
}

function rowHtml(db, ch, P, e, s, bi, schools, editing) {
  const L = s.level, k = `data-bi="${bi}"`;
  let prep;
  if (L === 0) prep = `<div class="prep none ${e.always ? 'gold' : ''}" title="${e.always ? 'De otra fuente, no cuenta' : ''}">–</div>`;
  else if (e.always) prep = `<div class="prep always" title="Siempre preparado" aria-label="Siempre preparado"></div>`;
  else prep = `<button type="button" class="prep ${e.prep ? 'on' : ''}" data-prep="${bi}" aria-pressed="${!!e.prep}" aria-label="Preparado: ${esc(s.es)}"></button>`;
  const free = e.gratis ? `<span class="free-use"><button type="button" class="tick ${e.used ? 'on' : ''}" data-used="${bi}" aria-pressed="${!!e.used}" aria-label="Uso gratis gastado"></button>${ce(e.gratis, `${k} data-k="gratis"`, editing)} gratis</span>`
    : (editing ? `<span class="free-use">${ce('', `${k} data-k="gratis"`, editing)} <small style="font-weight:400;color:var(--ink-2)">uso gratis (p. ej. 1/DL)</small></span>` : '');
  const trig = L > 0 && schools.includes(norm(s.escuela || '').slice(0, 5));
  const tir = tiradasConjuro(s), dmg = tir ? [...new Set([...tir.danos.map(x => x.tipo), ...(tir.curacion ? ['curación'] : [])])].slice(0, 2) : [];
  const castable = L === 0 || (e.gratis && !e.used) || (s.ritual && (estaPreparado(e) || P.ritualLibro)) || primerLibreDesde(ch, P, L) > 0;
  const lvlSel = editing ? `<label>nivel <select data-lvl="${bi}">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<option value="${n}" ${n === L ? 'selected' : ''}>${n === 0 ? 'truco' : n}</option>`).join('')}</select></label>` : '';
  const cell = (cls, v, key) => `<span class="${cls}">${editing || v ? ce(v, `${k} data-k="${key}"`, editing) : ''}</span>`;
  const escuela = editing ? `<span class="c-school ${trig ? 'trig' : ''}"><button type="button" class="sch-pick" data-schoolpick="${bi}" aria-haspopup="menu"><i class="sch-dot" aria-hidden="true"></i>${esc(s.escuela || 'Escuela')}${icon('chevron')}</button></span>`
    : `<span class="c-school ${trig ? 'trig' : ''}">${s.escuela ? `${gi(escuelaIco(s.escuela) || 'libro', 'sch-ico')}<span>${esc(s.escuela)}</span>` : ''}</span>`;
  const comps = editing ? `<span class="c-comp comp-pick" role="group" aria-label="Componentes">${[['V', 'Verbal'], ['S', 'Somático'], ['M', 'Material']].map(([c, t]) => `<button type="button" data-comp="${bi}|${c}" aria-pressed="${(s.comp || '').split(' ').includes(c)}" title="${t}">${c}</button>`).join('')}</span>`
    : cell('c-comp', s.comp, 'comp');
  return `<div class="spell ${castable ? '' : 'dim'}" id="sp-${bi}" data-sc="${claveEscuela(s.escuela)}">
    <div class="c-prep">${prep}</div>
    <div class="c-name"><div class="castzone" data-cast="${bi}" ${editing ? '' : 'role="button" tabindex="0"'}>
      ${editing ? '' : '<span class="visually-hidden">Lanzar </span>'}<span class="nm ${e.gratis ? (e.used ? 'spentfree' : 'free') : ''}">${ce(s.es, `${k} data-k="es"`, editing)}</span><span class="badges">
      <span class="bd ${s.ritual ? '' : 'off'}" data-flag="ritual" ${k} title="Ritual">R</span><span class="bd ${s.conc ? '' : 'off'}" data-flag="conc" ${k} title="Concentración">C</span></span>${dmg.map(x => iconoDano(x, 'sm')).join('')}
      <div class="en">${ce(s.en, `${k} data-k="en"`, editing)}</div></div>
      ${editing ? `<div class="flags edit-only"><label><input type="checkbox" data-always ${k} ${e.always ? 'checked' : ''}> ${L === 0 ? 'de otra fuente, no cuenta' : 'siempre preparado'}</label>${lvlSel}<button type="button" data-text="${bi}">Texto</button><button type="button" class="warn" data-del="${bi}">Quitar</button></div>` : ''}
    </div>
    <div class="meta">${escuela}${cell('c-time', s.tiempo, 'tiempo')}${cell('c-range', s.alcance, 'alcance')}${cell('c-dur', s.duracion, 'duracion')}${comps}${cell('c-cost', s.coste, 'coste')}</div>
    <div class="c-src">${ce(e.fuente, `${k} data-k="fuente"`, editing)}${free}</div>
  </div>`;
}
function levelHtml(db, ch, P, L, rows, schools, editing) {
  let slot;
  if (L === 0) slot = 'A voluntad';
  else if (espaciosDe(P, L)) slot = `<span class="lbl">${P.pact && L === P.pact.level ? 'Pacto' : ''}</span>${candles(ch, P, L)}`;
  else if (P.pact && L < P.pact.level) slot = `Con espacios de pacto (nivel ${P.pact.level})`;
  else slot = 'Sin espacios de este nivel';
  const body = rows.map(({ e, s, bi }) => rowHtml(db, ch, P, e, s, bi, schools, editing)).join('')
    || `<div class="empty-row">${rows.length ? 'Nada preparado de este nivel.' : 'Aún no hay conjuros de este nivel. Añádelos con «Añadir».'}</div>`;
  return `<div class="lvl-head"><span class="lvl-num">${L}</span><span class="lvl-title">${L === 0 ? 'Trucos' : 'Nivel ' + L}</span>
      <button class="addrow" type="button" data-add="${L}">${icon('plus')}Añadir</button><span class="lvl-slots">${slot}</span></div>
    <div class="list"><div class="list-head"><span>Conjuro</span><span>Escuela</span><span>Lanzamiento</span><span>Alcance</span><span>Duración</span><span>Comp.</span><span>Material</span><span>Fuente y usos</span></div>${body}</div>`;
}

let lastChar = null;
export function pintarBarra(S) {
  const ch = S.cur();
  const dockLbl = (id, ic, t) => patch($(id), `${icon(ic)}<span>${t}</span>`);
  const deskLbl = (id, ic, t) => { patch($(id), `${icon(ic)}${t}`); $(id).title = t; $(id).setAttribute('aria-label', t); };
  dockLbl('#dRest', 'moon', 'Descansar'); dockLbl('#dEdit', 'quill', S.editing ? 'Terminar' : 'Editar');
  dockLbl('#dAdd', 'plus', 'Añadir'); dockLbl('#dHist', 'hourglass', 'Historial');
  const combate = !!(ch && combateDe(ch).activo);
  patch($('#dDados'), `${gi('cubilete', 'icon')}<span>Dados</span>`); patch($('#dCombate'), `${gi('combate', 'icon')}<span>${combate ? 'Salir' : 'Combate'}</span>`);
  patch($('#bDados'), `${gi('cubilete', 'icon')}Dados`); patch($('#bCombate'), `${gi('combate', 'icon')}${combate ? 'Terminar combate' : 'Combate'}`);
  $('#bDados').title = 'Dados'; $('#bCombate').title = combate ? 'Terminar combate' : 'Modo combate'; $('#bCombate').setAttribute('aria-label', $('#bCombate').title);
  patch($('#btnBuscar'), gi('buscar', 'icon'));
  ['#dCombate', '#bCombate'].forEach(id => $(id).setAttribute('aria-pressed', combate));
  document.body.classList.toggle('combate', combate);
  deskLbl('#bRest', 'moon', 'Descansar'); deskLbl('#bEdit', 'quill', S.editing ? 'Terminar edición' : 'Editar conjuros');
  deskLbl('#bAdd', 'plus', 'Añadir conjuro');
  patch($('#btnMore'), '<span class="hamb" aria-hidden="true"><i></i><i></i><i></i></span>');
  $('#dAdd').hidden = !S.editing;
  $('#dCombate').hidden = $('#bCombate').hidden = $('#dDados').hidden = !ch;
  if (!ch) { aplicarTema(null); patch($('#whoChip'), `<span class="avatar av-chip">${gi('libro')}</span><span class="nm">Sin personaje</span><span class="visually-hidden">: cambiar de personaje</span>`); patch($('#sbar'), ''); return; }
  const P = perfil(ch);
  const conj = conConjuros(ch, P);
  $('#bAdd').hidden = !conj || combate;
  $('#bRest').hidden = $('#dRest').hidden = combate;
  $('#bEdit').hidden = $('#dEdit').hidden = (!conj && !S.editing) || combate;
  if (combate) $('#dAdd').hidden = true;
  if (!conj) $('#dAdd').hidden = true;
  aplicarTema(ch);
  patch($('#whoChip'), `${avatarHtml(ch, 'av-chip')}<span><span class="nm">${esc(ch.nombre)}</span><br><span class="lv">${esc(clasesTexto(ch))}</span></span><span class="who-cambiar" aria-hidden="true">${icon('users')}</span><span class="visually-hidden">: cambiar de personaje</span>`);
  let h = '';
  Object.keys(P.slots).map(Number).sort((a, b) => a - b).forEach(L => { h += `<span class="sb-l"><b data-jump="${L}" role="button" tabindex="0" aria-label="Ir a los conjuros de nivel ${L}">${L}</b>${candles(ch, P, L)}</span>`; });
  if (h) h = `<span class="sb-slots">${h}</span>`;
  if (ch.play.conc) h += `<span class="conc">Concentrado en <strong>${esc(ch.play.conc)}</strong>${ch.play.concObj.length ? `<span class="conc-obj">sobre ${esc(ch.play.concObj.join(', '))}</span>` : `<button type="button" class="conc-add" data-cmd="objetivos">¿Sobre quién?</button>`}<button type="button" data-cmd="endconc" aria-label="Terminar concentración">Terminar</button></span>`;
  patch($('#sbar'), h);
  medirBarra();
}
// Las medidas de la barra se leen en el siguiente fotograma, cuando ya se ha pintado toda la hoja, y no a mitad del
// render (eso forzaba un cálculo de estilos y de layout extra en cada acción). Solo se escribe --appbar-h si cambia,
// porque tocar una variable de :root recalcula los estilos de todo el documento.
let medida = 0, appbarH = '', vigilada = false;
function medirBarra() {
  if (!vigilada && typeof ResizeObserver === 'function') { vigilada = true; new ResizeObserver(medirBarra).observe($('#appbar')); }
  if (medida) return;
  medida = requestAnimationFrame(() => {
    medida = 0;
    const fila = $('#sbar .sb-slots'); if (fila) fila.classList.toggle('desborda', fila.scrollWidth > fila.clientWidth + 2);
    const bar = $('#appbar'), alto = `${Math.round(bar.getBoundingClientRect().height - (parseFloat(getComputedStyle(bar).paddingTop) || 0))}px`;
    if (alto !== appbarH) { appbarH = alto; document.documentElement.style.setProperty('--appbar-h', alto); }
  });
}

export function pintarHoja(S) {
  const db = S.db, ch = S.cur(), editing = S.editing;
  document.body.classList.toggle('editing', editing);
  if (!ch) {
    patch($('#hero'), `<div class="nochar"><h2>Ningún grimorio abierto</h2><p>Crea un personaje para empezar su libro de conjuros. Los conjuros del catálogo y del compendio se añaden con un toque.</p><button type="button" class="gold" data-cmd="newchar">Nuevo personaje</button></div>`);
    ['#stats', '#res', '#legend', '#levels', '#foot', '#vitales', '#caracs', '#combate', '#memorial'].forEach(id => patch($(id), ''));
    actualizarLuto(null);
    return;
  }
  aplicarTema(ch);
  const P = perfil(ch), schools = escuelasAlLanzar(ch);
  const heroChanged = patch($('#hero'), heroHtml(ch, P));
  if (lastChar !== ch.id) {
    lastChar = ch.id; pop($('#hero'), 'fx-enter');
    $('#hero .underline path')?.classList.add('fx-draw');
  } else if (heroChanged) $('#hero .underline path')?.classList.remove('fx-draw');
  patch($('#memorial'), actualizarLuto(ch) ? memorialHtml(ch) : '');
  const combate = combateDe(ch).activo;
  document.body.classList.toggle('combate', combate);
  // morph y no patch: al marcar una acción o gastar un uso solo cambia lo afectado, y el resto no repite su entrada
  morph($('#combate'), combate ? combateHtml(ch, db) : '');
  morph($('#vitales'), vitalesHtml(ch));
  morph($('#caracs'), caracteristicasHtml(ch));
  morph($('#stats'), statsHtml(db, ch, P));
  morph($('#res'), resourcesHtml(db, ch, P));
  morph($('#enjuego'), enJuegoHtml(ch, P));
  const lanza = conConjuros(ch, P);
  if (!lanza) {
    patch($('#legend'), ''); patchKeyed($('#levels'), []);
    patch($('#foot'), `<div class="foot-conj"><button type="button" class="ruse" data-cmd="verConjuros">${icon('plus')}Añadir conjuros</button><span>Por especie, dote, objeto o multiclase.</span></div>${ch.campana ? `<span>${esc(ch.campana)}</span>` : ''}`);
    return;
  }
  patch($('#legend'), legendHtml(ch, P, schools));
  const byL = {};
  ch.book.forEach((e, bi) => { const s = db.catalog[e.sid]; if (s) (byL[s.level] ||= []).push({ e, s, bi }); });
  const levels = new Set([0, ...Object.keys(byL).map(Number)]);
  for (let L = 1; L <= P.maxSlot; L++) levels.add(L);
  patchKeyed($('#levels'), [...levels].sort((a, b) => a - b).map(L => ({ key: 'L' + L, cls: 'level', html: levelHtml(db, ch, P, L, byL[L] || [], schools, editing) })));
  const foot = [ch.campana, P.c ? 'Componentes sin coste: los cubre el foco de lanzamiento' : ''].filter(Boolean);
  const ocultar = ch.enJuego?.conjuros && !P.apKey && !P.maxSlot && !ch.book.length ? `<div class="foot-conj"><button type="button" class="ruse" data-cmd="verConjuros">Ocultar conjuros</button></div>` : '';
  patch($('#foot'), ocultar + foot.map(t => `<span>${esc(t)}</span>`).join(''));
}
