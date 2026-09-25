/** Vista de la hoja. Solo pinta: los eventos viven en app/eventos.js. */
import { esc, norm } from '../core/util.js';
import { ABIL_NAME, perfil, sgn, clasesDe, clasesTexto } from '../domain/reglas2024.js';
import { castSchools, castTriggerDesc, reglas, recState, etiquetaRecarga, schoolMatch, usosGastados } from '../domain/rasgos.js';
import { $, patch, patchKeyed } from './dom.js';
import { icon, ASTROLABE } from './icons.js';
import { pop } from './fx.js';
import { runaSvg } from './magia.js';
import { aplicarTema, gi, temaDe } from './tema.js';
import { tiradasConjuro } from '../domain/catalogo.js';
import { iconoDano } from './dialogs/tiradas.js';
import { avatarHtml } from './avatar.js';
import { paraRecordar } from '../domain/diario.js';
import { notaHtml } from './dialogs/diario.js';
import { rasgosConObjetivo } from '../domain/concentracion.js';
import { rasgosEnJuego, agrupar, numerosMarciales, FUENTES } from '../domain/enJuego.js';
import { biblioteca } from '../domain/catalogo.js';
import { claseArmadura } from '../domain/equipo.js';

/* ---------- consultas de la hoja ---------- */
export const slotsOf = (P, n) => P.slots[n] || 0;
export const usedOf = (ch, P, n) => Math.min(ch.play.used[n] || 0, slotsOf(P, n));
export const freeOf = (ch, P, n) => slotsOf(P, n) - usedOf(ch, P, n);
export function firstFreeFrom(ch, P, n) { for (let L = Math.max(1, n); L <= 9; L++) if (freeOf(ch, P, L) > 0) return L; return 0; }
export const isPrepared = e => !!(e.prep || e.always);
export const prepCount = (db, ch) => ch.book.filter(e => { const s = db.catalog[e.sid]; return s && s.level > 0 && e.prep && !e.always; }).length;
export const cantCount = (db, ch) => ch.book.filter(e => { const s = db.catalog[e.sid]; return s && s.level === 0 && !e.always; }).length;
// «Bárbaro (Senda del fanático), nivel 8» o, con multiclase, «Bárbaro 5 (Senda del berserker) / Guerrero 3 (Campeón)»
export const claseLinea = ch => { const cs = clasesDe(ch); return cs.length > 1 ? cs.map(c => `${c.clase} ${c.nivel}${c.subclase ? ` (${c.subclase})` : ''}`).join(' / ') : `${ch.clase}${ch.subclase ? ` (${ch.subclase})` : ''}, nivel ${ch.nivel}`; };
export const origenLinea = ch => [ch.especie, ch.trasfondo].filter(Boolean).join(', ');
const SC = { abj: 'abj', adi: 'adi', con: 'con', enc: 'enc', evo: 'evo', ilu: 'ilu', nig: 'nig', tra: 'tra' };
export const schoolKey = esc2 => SC[norm(esc2).slice(0, 3)] || '';
const lemaHtml = t => esc(t).replace(/_(.+?)_/g, '<span class="u">$1</span>');

/* ---------- piezas ---------- */
function candles(ch, P, L) {
  const s = slotsOf(P, L), free = freeOf(ch, P, L); let h = '';
  for (let i = 0; i < s; i++) {
    const spent = i >= free;
    h += `<button type="button" class="slotbtn ${spent ? 'spent' : ''}" style="--i:${i}" data-slotbtn="${L}:${i}" aria-label="Espacio de nivel ${L}: ${spent ? 'gastado, toca para recuperarlo' : 'libre, toca para gastarlo'}"><span class="orb"></span></button>`;
  }
  return h;
}
function ce(val, attrs, editing) { return `<span ${editing ? 'contenteditable="true"' : ''} ${attrs}>${esc(val)}</span>`; }

function heroHtml(ch, P) {
  // CA con lo equipado en el inventario (o la defensa sin armadura)
  const mods = `${P.apKey ? `${ABIL_NAME[P.apKey]} ${sgn(P.mod)}, competencia ${sgn(P.pb)}` : `Competencia ${sgn(P.pb)}`} · CA ${claseArmadura(ch).ca}`;
  const t = temaDe(ch);
  return `${ASTROLABE}${ch.retrato ? '' : gi(t.icono, 'emblem')}
    <div class="hero-id"><button type="button" class="hero-av" data-cmd="retrato" aria-label="${ch.retrato ? 'Cambiar' : 'Añadir'} retrato">${runaSvg({ n: 16, lados: t.icono === 'adivino' ? 6 : 5, cls: 'hero-runa', semillaInicial: (ch.nombre || 'x').length * 31 })}${avatarHtml(ch, 'xl')}<span class="av-edit">${icon('quill')}</span></button>
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
/** ¿Se enseña la parte de conjuros? Si la clase o la subclase lanza, si hay conjuros en el libro o si se pidió al pie de la hoja. */
export const conConjuros = (ch, P) => !!P.apKey || P.maxSlot > 0 || ch.book.length > 0 || !!ch.enJuego?.conjuros;
function statsHtml(db, ch, P) {
  const pc = prepCount(db, ch), cc = cantCount(db, ch);
  // un valor con texto («3 tipos de arma», «15 · 16») va en un cuerpo menor para que la placa no crezca a lo alto
  const st = (v, l, cls = '') => `<div class="stat ${cls} ${String(v).replace(/<[^>]*>|&[a-z]+;/g, 'x').length > 6 ? 'long' : ''}"><b>${v}</b><span>${l}</span></div>`;
  // sin lanzamiento de clase: los números de la clase que se miran en combate (daño de furia, ataque furtivo, artes
  // marciales…); si hay conjuros de especie o dote con su característica, primero su CD y su ataque
  if (!P.c) {
    const magia = P.apKey ? [{ nombre: 'CD de salvación', valor: String(P.cd) }, { nombre: 'Ataque de conjuro', valor: sgn(P.atk) }] : [];
    return [...magia, ...numerosMarciales(ch)].slice(0, 4).map((n, i) => st(esc(n.valor), esc(n.nombre), i < 2 ? 'key' : '')).join('');
  }
  // multiclase con distintas características de lanzamiento: una CD y un ataque por cada una («15 · 16», «Int · Car»)
  const AB = { fue: 'Fue', des: 'Des', con: 'Con', int: 'Int', sab: 'Sab', car: 'Car' }, varias = (P.cds || []).length > 1;
  const cd = varias ? st(P.cds.map(x => x.cd).join(' · '), `CD (${P.cds.map(x => AB[x.ap]).join(' · ')})`, 'key') : st(P.cd ?? '—', 'CD de salvación', 'key');
  const at = varias ? st(P.cds.map(x => sgn(x.atk)).join(' · '), `Ataque (${P.cds.map(x => AB[x.ap]).join(' · ')})`, 'key') : st(P.atk == null ? '—' : sgn(P.atk), 'Ataque de conjuro', 'key');
  // sin trucos en la clase (paladín, explorador) ni en el libro: en su lugar, un número de la clase
  const sinTrucos = !P.maxCant && !cc, marcial = sinTrucos ? numerosMarciales(ch).filter(n => !/^(Competencia|Dado de golpe)$/.test(n.nombre))
    .sort((a, b) => (a.nombre === 'Maestría con armas') - (b.nombre === 'Maestría con armas'))[0] : null;   // el Aura de protección antes que la maestría
  return cd + at
    + (marcial ? st(esc(marcial.valor), esc(marcial.nombre)) : st(P.c?.cant ? `${cc}/${P.maxCant}` : cc, 'Trucos', P.c?.cant && cc > P.maxCant ? 'over' : ''))
    + st(P.c ? `${pc}/${P.maxPrep}` : pc, 'Preparados', P.c && pc > P.maxPrep ? 'over' : '');
}

function recursoHtml(ch, r) {
  const used = usosGastados(ch, r), left = r.max - used;
  const ctl = r.max <= 10
    ? `<span class="rticks">${Array.from({ length: r.max }, (_, i) => `<button type="button" class="rtick ${i >= left ? 'on' : ''}" data-rtick="${r.id}|${i}" aria-label="${esc(r.nombre)}: uso ${i + 1} ${i >= left ? 'gastado' : 'disponible'}"></button>`).join('')}</span>`
    : `<span class="rstep"><button type="button" data-rstep="${r.id}|1" aria-label="Gastar 1 de ${esc(r.nombre)}">−</button><button type="button" class="rleft" data-rset="${r.id}" aria-label="Cambiar lo que queda">${left}<small> / ${r.max}</small></button><button type="button" data-rstep="${r.id}|-1" aria-label="Recuperar 1 de ${esc(r.nombre)}">+</button></span>`;
  // Forma salvaje: acceso directo a las formas conocidas y a las posibles según el nivel
  const formas = r.id === 'tpl:druida.forma' ? `<button type="button" class="ruse" data-cmd="formas">${gi('criatura')}Formas${(ch.formas || []).length + (ch.formasMano || []).length ? ` (${(ch.formas || []).length + (ch.formasMano || []).length})` : ''}</button>` : '';
  return `<div class="res rr ${left === 0 ? 'empty-res' : ''}" data-resid="${esc(r.id)}"><strong>${esc(r.nombre)}</strong>${ctl}${formas}<span class="rnote">${esc(etiquetaRecarga(r))}${r.nota ? '. ' + esc(r.nota) : ''}</span></div>`;
}
function dadosHtml(ch, r) {
  const st = recState(ch, r.id), sides = parseInt(String(r.dado || 'd20').slice(1), 10) || 20; let h = '';
  for (let i = 0; i < r.max; i++) {
    const d = (st.dice || [])[i] || { v: '', used: false };
    h += `<span class="pdie ${d.used ? 'used' : ''}"><input type="text" inputmode="numeric" maxlength="${String(sides).length}" placeholder="${esc(r.dado || 'd20')}" data-dv="${r.id}|${i}|${sides}" value="${esc(d.v)}" ${d.used ? 'readonly' : ''} aria-label="${esc(r.nombre)}: dado ${i + 1}">`
      + `<button type="button" class="tick ${d.used ? 'on' : ''}" data-dused="${r.id}|${i}" aria-pressed="${!!d.used}" aria-label="${esc(r.nombre)}: dado ${i + 1} usado"></button></span>`;
  }
  return `<div class="res pres"><strong>${esc(r.nombre)}</strong>${h}<span class="rnote">Anota ${r.max}${esc(r.dado || 'd20')} al terminar un descanso largo. ${esc(r.nota || '')} Marca la casilla al usar uno.</span></div>`;
}
function recuperarHtml(ch, r) {
  const st = recState(ch, r.id);
  return `<div class="res rr"><strong>${esc(r.nombre)}</strong><button type="button" class="ruse ${st.used ? 'on' : ''}" data-recuse="${r.id}" aria-pressed="${!!st.used}">${st.used ? 'Usada hoy' : 'Usar'}</button>
    <span class="rnote">Hasta ${r.max} niveles de espacios (ninguno de nivel ${(r.nivMax || 5) + 1}+). ${esc(r.nota || '')}</span></div>`;
}
function alLanzarHtml(db, ch, r) {
  let list = '';
  if (r.escuela) {
    const items = [];
    ch.book.forEach(e => {
      const s = db.catalog[e.sid]; if (!s || s.level < 1 || !schoolMatch(s, r.escuela)) return;
      const notes = []; if (r.espacioMin && s.level < r.espacioMin) notes.push(`solo con espacio de nivel ${r.espacioMin}+`); if (r.soloEspacio && s.ritual) notes.push('no como ritual');
      items.push(`<li><span class="aa-lv">${s.level}</span><span><span class="aa-nm">${esc(s.es)}</span>${notes.length ? `<span class="aa-note">${notes.join(', ')}</span>` : ''}</span></li>`);
    });
    list = items.length ? `<ul class="aa-list">${items.join('')}</ul>` : `<div class="aa-note">Aún no hay conjuros de ${esc(r.escuela.toLowerCase())} de nivel 1 o superior en el libro.</div>`;
  }
  return `<div class="res wide"><strong>${esc(r.nombre)}</strong><span class="rnote" style="font-size:var(--fs-s);color:var(--ink)">${esc(castTriggerDesc(r))}</span><div style="flex-basis:100%">${list}</div></div>`;
}
function resourcesHtml(db, ch, P) {
  let h = '';
  const rec = paraRecordar(ch);
  if (rec.length) h += `<div class="res wide rec-card"><strong>${icon('star')} Para recordar</strong><button type="button" class="ruse" data-cmd="diario">Abrir diario</button><ul class="nts">${rec.slice(0, 4).map(n => notaHtml(n, true)).join('')}</ul>${rec.length > 4 ? `<span class="rnote">Y ${rec.length - 4} más en el diario.</span>` : ''}</div>`;
  h += efectosHtml(ch);
  if (P.pact) h += `<div class="res"><strong>Magia de pacto</strong><span class="rnote">${P.pact.n} ${P.pact.n > 1 ? 'espacios' : 'espacio'} de nivel ${P.pact.level}; se recuperan con un descanso corto o largo.</span></div>`;
  reglas(ch).forEach(r => { h += r.tipo === 'recurso' ? recursoHtml(ch, r) : r.tipo === 'dados' ? dadosHtml(ch, r) : r.tipo === 'recuperar' ? recuperarHtml(ch, r) : alLanzarHtml(db, ch, r); });
  return h ? `<div class="resources">${h}</div>` : '';
}
/** Efectos activos: la concentración y los rasgos puestos sobre criaturas, con sus objetivos escritos a mano. */
function efectosHtml(ch) {
  const pl = ch.play, sug = rasgosConObjetivo(ch);
  if (!pl.conc && !pl.efectos.length && !sug.length) return '';
  const chips = (clave, lista) => lista.map((o, i) => `<button type="button" class="obj-chip" data-objdel="${clave}|${i}" aria-label="Quitar ${esc(o)}">${esc(o)}<span aria-hidden="true">×</span></button>`).join('');
  const entrada = (clave, ph) => `<input class="obj-in" data-objin="${clave}" placeholder="${ph}" autocomplete="off" enterkeyhint="done" aria-label="Añadir objetivo">`;
  const fila = (clave, nombre, nota, lista, fin) => `<div class="ef-row"><div class="ef-h"><b>${esc(nombre)}</b>${nota ? `<small>${esc(nota)}</small>` : ''}${fin}</div>
    <div class="objt-list">${chips(clave, lista)}${entrada(clave, lista.length ? 'Añadir otro…' : 'Sobre quién: escribe y pulsa Intro')}</div></div>`;
  let h = '';
  if (pl.conc) h += fila('conc', pl.conc, 'Concentración', pl.concObj, '<button type="button" class="ruse" data-cmd="endconc">Terminar</button>');
  pl.efectos.forEach(e => { h += fila(e.id, e.nombre, e.nota, e.objetivos, `<button type="button" class="ruse" data-eferm="${e.id}">Terminar</button>`); });
  const add = sug.length ? `<div class="ef-add">${sug.map(n => `<button type="button" data-efnuevo="${esc(n)}">${icon('plus')}${esc(n)}</button>`).join('')}</div>` : '';
  return `<div class="res wide ef-card"><strong>${gi('ojo')} Efectos activos</strong>${h || '<span class="rnote">Nada activo. Marca un rasgo cuando lo uses sobre alguien, o concéntrate en un conjuro.</span>'}${add}
    ${pl.conc ? `<label class="chk-line ef-pedir"><input type="checkbox" data-pedirobj ${pl.pedirObjetivos ? 'checked' : ''}> Preguntar sobre quién al concentrarme en un conjuro con objetivos</label>` : ''}</div>`;
}
// Icono de la fuente de cada rasgo: el de su clase, la especie o la dote
const iconoFuente = r => (r.fuente === 'especie' ? 'criatura' : r.fuente === 'dote' ? 'dote' : norm(r.clase || '').replace(/[^a-z]/g, ''));
/** «En juego»: rasgos de clases, subclases, especie y dotes agrupados por cuándo se usan, con resumen, números y recurso. */
function enJuegoHtml(ch, P) {
  const todos = rasgosEnJuego(ch, biblioteca(), reglas(ch)); if (!todos.length) return '';
  // plegada por defecto solo si la clase lanza conjuros (un truco de especie no convierte a un bárbaro en lanzador)
  const lanza = !!P.c, abierto = lanza ? !!ch.enJuego?.abierto : ch.enJuego?.abierto !== false;
  const fij = ch.enJuego?.fijados || [], hay = FUENTES.filter(([k]) => !k || todos.some(r => r.fuente === k));
  const filtro = hay.some(([k]) => k === ch.enJuego?.filtro) ? ch.enJuego.filtro : '';
  const cuenta = hay.filter(([k]) => k).map(([k]) => { const n = todos.filter(r => r.fuente === k).length; return k === 'dote' ? `${n} ${n === 1 ? 'dote' : 'dotes'}` : k === 'especie' ? `${n} de especie` : `${n} de clase`; });
  const tarjeta = r => {
    const rec = r.recurso, left = rec ? rec.max - usosGastados(ch, rec) : 0, fijo = fij.includes(r.clave);
    return `<article class="ej-it f-${r.fuente} o-${r.origen}">
      <button type="button" class="ej-main" data-ejver="${esc(r.clave)}" aria-label="Leer ${esc(r.nombre)}"><b>${esc(r.nombre)}</b>
        <small>${gi(iconoFuente(r), 'ej-ico')}${esc(r.etiqueta)}</small>
        ${r.resumen ? `<span class="ej-res">${esc(r.resumen)}</span>` : ''}</button>
      <div class="ej-side">${r.numeros.map(n => `<span class="ej-num" title="${esc(n.nombre)}">${esc(n.valor)}</span>`).join('')}
        ${rec ? `<button type="button" class="ej-usos ${left ? '' : 'agotado'}" data-irrec="${esc(rec.id)}" aria-label="${esc(rec.nombre)}: quedan ${left} de ${rec.max}. Ir a su contador" title="Los usos se marcan en su tarjeta de recursos">${left}/${rec.max}<small>usos</small></button>` : ''}
        <button type="button" class="ej-star" data-ejfijar="${esc(r.clave)}" aria-pressed="${fijo}" aria-label="${fijo ? 'Quitar de fijados' : 'Fijar arriba'}: ${esc(r.nombre)}" title="${fijo ? 'Quitar de fijados' : 'Fijar arriba'}">★</button></div></article>`;
  };
  const sinTextos = todos.every(r => !r.texto), grupos = agrupar(todos, fij, filtro);
  return `<div class="ej-head"><span class="ej-emb">${gi('dote')}</span><h2>En juego</h2><small>${esc(cuenta.join(' · '))}</small>
      ${abierto ? `<button type="button" class="ruse ej-ajustes" data-cmd="rules" aria-label="Rasgos: progresión de la clase y recursos" title="Progresión y recursos">${icon('sliders')}</button>` : ''}
      <button type="button" class="ruse ej-toggle" data-ej="toggle" aria-expanded="${abierto}">${abierto ? 'Plegar' : 'Desplegar'}</button></div>
    ${abierto ? `${hay.length > 2 ? `<div class="seg sm ej-filtro" role="radiogroup" aria-label="Mostrar rasgos de">${hay.map(([k, t]) => `<button type="button" role="radio" aria-checked="${filtro === k}" data-ejfiltro="${k}">${esc(t)}</button>`).join('')}</div>` : ''}
      ${sinTextos ? `<p class="note ej-note">Importa el Manual del Jugador en <button type="button" class="linkish" data-cmd="manual">Libros y manuales</button> para ver qué hace cada rasgo. Se lee en este dispositivo.</p>` : ''}
      ${grupos.map(g => `<div class="ej-grupo ej-${g.clave}"><h3>${esc(g.titulo)}</h3><div class="ej-grid">${g.rasgos.map(tarjeta).join('')}</div></div>`).join('')}` : ''}`;
}
function legendHtml(ch, P, schools) {
  const ritualTxt = P.ritualLibro ? 'se lanza desde el libro sin preparar (+10 min)' : 'si está preparado, sin gastar espacio (+10 min)';
  return `<span class="howto"><b>Toca</b> un conjuro para lanzarlo. <b>Mantén pulsado</b> para leerlo y elegir nivel, ritual o uso gratis. Las velas encendidas son espacios libres.</span>
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
  const castable = L === 0 || (e.gratis && !e.used) || (s.ritual && (isPrepared(e) || P.ritualLibro)) || firstFreeFrom(ch, P, L) > 0;
  const ritualOnly = ch.play.onlyPrep && L > 0 && !isPrepared(e) && s.ritual && P.ritualLibro;
  const lvlSel = editing ? `<label>nivel <select data-lvl="${bi}">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<option value="${n}" ${n === L ? 'selected' : ''}>${n === 0 ? 'truco' : n}</option>`).join('')}</select></label>` : '';
  const cell = (cls, v, key) => `<span class="${cls}">${editing || v ? ce(v, `${k} data-k="${key}"`, editing) : ''}</span>`;
  // En edición, la escuela se elige de las ocho oficiales y los componentes se marcan: así los colores y los datos siempre cuadran
  const escuela = editing ? `<span class="c-school ${trig ? 'trig' : ''}"><button type="button" class="sch-pick" data-schoolpick="${bi}" aria-haspopup="menu"><i class="sch-dot" aria-hidden="true"></i>${esc(s.escuela || 'Escuela')}${icon('chevron')}</button></span>`
    : cell(`c-school ${trig ? 'trig' : ''}`, s.escuela, 'escuela');
  const comps = editing ? `<span class="c-comp comp-pick" role="group" aria-label="Componentes">${[['V', 'Verbal'], ['S', 'Somático'], ['M', 'Material']].map(([c, t]) => `<button type="button" data-comp="${bi}|${c}" aria-pressed="${(s.comp || '').split(' ').includes(c)}" title="${t}">${c}</button>`).join('')}</span>`
    : cell('c-comp', s.comp, 'comp');
  return `<div class="spell ${castable ? '' : 'dim'}" id="sp-${bi}" data-sc="${schoolKey(s.escuela)}">
    <div class="c-prep">${prep}</div>
    <div class="c-name"><div class="castzone" data-cast="${bi}" ${editing ? '' : 'role="button" tabindex="0"'} aria-label="${editing ? '' : 'Lanzar ' + esc(s.es)}">
      <span class="nm ${e.gratis ? (e.used ? 'spentfree' : 'free') : ''}">${ce(s.es, `${k} data-k="es"`, editing)}</span><span class="badges">
      <span class="bd ${s.ritual ? '' : 'off'}" data-flag="ritual" ${k} title="Ritual">R</span><span class="bd ${s.conc ? '' : 'off'}" data-flag="conc" ${k} title="Concentración">C</span></span>${dmg.map(x => iconoDano(x, 'sm')).join('')}${ritualOnly ? '<span class="tag">solo ritual</span>' : ''}
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
  else if (slotsOf(P, L)) slot = `<span class="lbl">${P.pact && L === P.pact.level ? 'Pacto' : ''}</span>${candles(ch, P, L)}`;
  else if (P.pact && L < P.pact.level) slot = `Con espacios de pacto (nivel ${P.pact.level})`;
  else slot = 'Sin espacios de este nivel';
  const vis = rows.filter(({ e, s }) => editing || !ch.play.onlyPrep || L === 0 || isPrepared(e) || (s.ritual && P.ritualLibro));
  const body = vis.map(({ e, s, bi }) => rowHtml(db, ch, P, e, s, bi, schools, editing)).join('')
    || `<div class="empty-row">${rows.length ? 'Nada preparado de este nivel.' : 'Aún no hay conjuros de este nivel. Añádelos con «Añadir».'}</div>`;
  return `<div class="lvl-head"><span class="lvl-num">${L}</span><span class="lvl-title">${L === 0 ? 'Trucos' : 'Nivel ' + L}</span>
      <button class="addrow" type="button" data-add="${L}">${icon('plus')}Añadir</button><span class="lvl-slots">${slot}</span></div>
    <div class="list"><div class="list-head"><span>Conjuro</span><span>Escuela</span><span>Lanzamiento</span><span>Alcance</span><span>Duración</span><span>Comp.</span><span>Material</span><span>Fuente y usos</span></div>${body}</div>`;
}

/* ---------- render principal ---------- */
let lastChar = null;
export function renderBar(S) {
  const ch = S.cur();
  const dockLbl = (id, ic, t) => patch($(id), `${icon(ic)}<span>${t}</span>`);
  const deskLbl = (id, ic, t) => patch($(id), `${icon(ic)}${t}`);
  dockLbl('#dRest', 'moon', 'Descansar'); dockLbl('#dFilter', 'book', 'Preparados'); dockLbl('#dEdit', 'quill', S.editing ? 'Terminar' : 'Editar');
  dockLbl('#dAdd', 'plus', 'Añadir'); dockLbl('#dHist', 'hourglass', 'Historial');
  deskLbl('#bRest', 'moon', 'Descansar'); deskLbl('#bFilter', 'book', 'Solo preparados'); deskLbl('#bEdit', 'quill', S.editing ? 'Terminar edición' : 'Editar conjuros');
  deskLbl('#bAdd', 'plus', 'Añadir conjuro'); deskLbl('#bHist', 'hourglass', 'Historial');
  patch($('#btnMore'), '<span class="hamb" aria-hidden="true"><i></i><i></i><i></i></span>');
  ['#dFilter', '#bFilter'].forEach(id => $(id).setAttribute('aria-pressed', !!ch?.play.onlyPrep));
  $('#dAdd').hidden = !S.editing;
  if (!ch) { aplicarTema(null); patch($('#whoChip'), `<span class="avatar av-chip">${gi('libro')}</span><span class="nm">Sin personaje</span>`); patch($('#sbar'), ''); return; }
  const P = perfil(ch);
  // sin conjuros, «Solo preparados» y «Añadir conjuro» no dicen nada: se ocultan (la hoja ofrece «Añadir conjuros» al pie)
  const conj = conConjuros(ch, P);
  // «Solo preparados» solo tiene sentido si hay conjuros de nivel 1 o más (un truco de especie no se prepara)
  const preparables = P.maxSlot > 0 || ch.book.some(e => (S.db.catalog[e.sid]?.level || 0) > 0);
  $('#bFilter').hidden = $('#dFilter').hidden = !conj || !preparables; $('#bAdd').hidden = !conj;
  // el modo edición solo toca los conjuros: sin ellos, el botón no haría nada (el personaje se edita desde «Editar personaje»)
  $('#bEdit').hidden = $('#dEdit').hidden = !conj && !S.editing;
  if (!conj) $('#dAdd').hidden = true;
  const tema = aplicarTema(ch);
  patch($('#whoChip'), `${avatarHtml(ch, 'av-chip')}<span><span class="nm">${esc(ch.nombre)}</span><br><span class="lv">${esc(clasesTexto(ch))}</span></span><span class="who-cambiar" title="Cambiar de personaje">${icon('users')}</span>`);
  let h = '';
  Object.keys(P.slots).map(Number).sort((a, b) => a - b).forEach(L => { h += `<span class="sb-l"><b data-jump="${L}" role="button" tabindex="0" aria-label="Ir a los conjuros de nivel ${L}">${L}</b>${candles(ch, P, L)}</span>`; });
  // en el móvil los espacios van en una sola fila que se desliza de lado: la barra no se come media pantalla
  if (h) h = `<span class="sb-slots">${h}</span>`;
  if (ch.play.conc) h += `<span class="conc">Concentrado en <strong>${esc(ch.play.conc)}</strong>${ch.play.concObj.length ? `<span class="conc-obj">sobre ${esc(ch.play.concObj.join(', '))}</span>` : `<button type="button" class="conc-add" data-cmd="objetivos">¿Sobre quién?</button>`}<button type="button" data-cmd="endconc" aria-label="Terminar concentración">Terminar</button></span>`;
  patch($('#sbar'), h);
  const fila = $('#sbar .sb-slots'); if (fila) fila.classList.toggle('desborda', fila.scrollWidth > fila.clientWidth + 2);
  document.documentElement.style.setProperty('--appbar-h', `${Math.round($('#appbar').getBoundingClientRect().height - (parseFloat(getComputedStyle($('#appbar')).paddingTop) || 0))}px`);
}

export function renderSheet(S) {
  const db = S.db, ch = S.cur(), editing = S.editing;
  document.body.classList.toggle('editing', editing);
  if (!ch) {
    patch($('#hero'), `<div class="nochar"><h2>Ningún grimorio abierto</h2><p>Crea un personaje para empezar su libro de conjuros. Los conjuros del catálogo y del compendio se añaden con un toque.</p><button type="button" class="gold" data-cmd="newchar">Nuevo personaje</button></div>`);
    ['#stats', '#res', '#legend', '#levels', '#foot'].forEach(id => patch($(id), ''));
    return;
  }
  aplicarTema(ch);
  const P = perfil(ch), schools = castSchools(ch);
  const heroChanged = patch($('#hero'), heroHtml(ch, P));
  if (lastChar !== ch.id) {
    lastChar = ch.id; pop($('#hero'), 'fx-enter');
    $('#hero .underline path')?.classList.add('fx-draw');
  } else if (heroChanged) $('#hero .underline path')?.classList.remove('fx-draw');
  patch($('#stats'), statsHtml(db, ch, P));
  patch($('#res'), resourcesHtml(db, ch, P));
  patch($('#enjuego'), enJuegoHtml(ch, P));
  const lanza = conConjuros(ch, P);
  if (!lanza) {
    // sin ninguna fuente de conjuros: la parte de conjuros queda al pie, a un toque, por si llega por especie, dote o multiclase
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
  // conjuros mostrados a mano y aún vacíos: se pueden volver a esconder
  const ocultar = ch.enJuego?.conjuros && !P.apKey && !P.maxSlot && !ch.book.length ? `<div class="foot-conj"><button type="button" class="ruse" data-cmd="verConjuros">Ocultar conjuros</button></div>` : '';
  patch($('#foot'), ocultar + foot.map(t => `<span>${esc(t)}</span>`).join(''));
}
