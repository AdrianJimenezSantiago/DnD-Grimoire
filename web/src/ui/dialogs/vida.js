import { esc, norm } from '../../core/util.js';
import { sgn, modOf } from '../../domain/reglas2024.js';
import { vidaDe, pgMaximo, pgMaximoCalculado, pgActuales, aplicarDano, curar, ponerTemporales, fijarPg, dadosDeGolpe, gastarDadoGolpe, salvacionMuerte, estadoVital, marcarCaida, revivir as revivirDom,
  ESTADOS, NOMBRE_ESTADO, RESUMEN_ESTADO } from '../../domain/vida.js';
import { bonoSalvacion } from '../../domain/habilidades.js';
import { glosario } from '../../domain/catalogo.js';
import { terminarConc } from '../../domain/concentracion.js';
import { rngCripto } from '../../domain/dados.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { icon } from '../icons.js';
import { avatarHtml } from '../avatar.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { burstFrom } from '../fx.js';
import { haptic } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { tirarPrueba } from './dados.js';
import { abrirTermino } from './biblioteca.js';
import { pctVida, tonoVida, pipsMuerte, vigiliaHtml } from '../vitales.js';

let S, editarMax = false;
const dlg = () => $('#vidaDlg'), edlg = () => $('#estadosDlg');
const ch = () => S.cur();

export function openVida(foco) { editarMax = false; render(); openSheet(dlg()); if (foco !== false) setTimeout(() => $('#vdCant')?.focus({ preventScroll: true }), 280); }

function render() {
  const c = ch(); if (!c) return;
  const v = vidaDe(c), max = pgMaximo(c), act = pgActuales(c), est = estadoVital(c), calc = pgMaximoCalculado(c);
  $('#vdHead').innerHTML = `${avatarHtml(c, 'md')}<div><h2 id="vdTitle">Puntos de golpe</h2><div class="dsub">${esc(c.nombre)} · Constitución ${sgn(modOf(c.stats?.con))}</div></div>`;
  let h = `<section class="vd-marcador ${tonoVida(c)}">
    <div class="vd-cifra"><span class="vd-act">${act}</span><span class="vd-max">/ ${max}</span>${v.temp ? `<span class="vd-temp" title="Puntos de golpe temporales">+${v.temp} temp.</span>` : ''}</div>
    <div class="vd-barra" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${act}" aria-label="Puntos de golpe"><i style="width:${pctVida(c)}%"></i>${v.temp ? `<b style="width:${Math.min(100, Math.round(v.temp / max * 100))}%"></b>` : ''}</div>
    <p class="vd-estado">${{ vivo: act === max ? 'Ileso.' : `Le faltan ${max - act} PG.`, moribundo: 'A 0 PG: inconsciente. Tira salvaciones contra muerte al empezar tu turno.', estable: 'Estable a 0 PG: inconsciente, sin tirar salvaciones. Recupera 1 PG en 1d4 horas.', muerto: 'Muerto. Solo la magia puede traerlo de vuelta.' }[est]}</p></section>`;
  h += `<section class="vd-entrada"><label class="f">Cantidad<input id="vdCant" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Cantidad de puntos de golpe"></label>
    <div class="vd-btns"><button type="button" class="danger" data-vd="dano">${gi('pg')}Daño</button><button type="button" class="vd-cura" data-vd="curar">${gi('curacion')}Curar</button><button type="button" data-vd="temp">${icon('plus')}Temporales</button></div>
    ${act === 0 && est !== 'muerto' ? '<label class="chk-line"><input type="checkbox" id="vdCrit"> Fue un golpe crítico: cuenta como dos fallos</label>' : ''}
    <p class="hint">Los temporales no se suman entre sí: te quedas con los más altos, y el daño los gasta primero.</p></section>`;
  if (act === 0 && est !== 'vivo') {
    h += `<section class="vd-muerte">${vigiliaHtml(c)}</section>`;
  }
  h += `<section class="vd-dados"><h3>${gi('dado_golpe')}Dados de golpe</h3><div class="vd-dg">${dadosDeGolpe(c).map(d => `<div class="vd-dg-it">
      <b>${d.quedan}<small>/${d.total}</small></b><span>${d.dado}</span><button type="button" data-vddg="${d.dado}" ${d.quedan && act < max && est !== 'muerto' ? '' : 'disabled'}>Gastar y tirar</button></div>`).join('')}</div>
    <p class="hint">En un descanso corto, cada dado cura su tirada ${sgn(modOf(c.stats?.con))} (Con), mínimo 1. Con un descanso largo se recuperan todos.</p></section>`;
  h += `<section class="vd-max-sec"><h3>Máximo</h3>${editarMax
    ? `<div class="vd-max-edit"><input id="vdMax" type="number" inputmode="numeric" min="1" value="${max}" aria-label="Puntos de golpe máximos"><button type="button" class="gold" data-vd="guardarmax">Guardar</button><button type="button" data-vd="cancelarmax">Cancelar</button></div>`
    : `<p class="vd-max-txt"><b>${max}</b> ${v.maxManual != null ? `a mano (la media sería ${calc})` : 'con la media de cada nivel, la Constitución y lo que den tus dotes y tu especie'}.</p>
       <div class="vd-btns"><button type="button" data-vd="editarmax">${icon('quill')}Cambiar</button>${v.maxManual != null ? '<button type="button" data-vd="mediamax">Volver a la media</button>' : ''}<button type="button" data-vd="fijar">Poner los PG actuales</button></div>`}</section>`;
  $('#vdBody').innerHTML = h;
}

export function danar(S2, n, critico = false) {
  const c = S2.cur(); let r;
  const h = S2.act(`Recibe ${n} de daño${critico ? ' (crítico)' : ''}`, (db, x) => { r = aplicarDano(x, n, { critico }); if (r.concentracion?.perdida) terminarConc(x.play); });
  const c2 = S2.cur(), acts = [undoBtn(S2, h)];
  let msg = `<b>${n}</b> de daño${r.absorbido ? ` (${r.absorbido} a los temporales)` : ''}. Quedan <b>${pgActuales(c2)}</b> PG.`;
  if (r.muerte) msg = `<b>${n}</b> de daño: <b>${esc(c.nombre)} muere</b>${r.fallo ? ' (tercer fallo)' : ' (daño masivo)'}.`;
  else if (r.cayo) msg = `<b>${n}</b> de daño: cae a 0 PG, inconsciente.${r.concentracion?.perdida ? ` Pierde la concentración en ${esc(r.concentracion.conjuro)}.` : ''}`;
  else if (r.fallo) msg = `Daño a 0 PG: un fallo en las salvaciones contra muerte.`;
  if (r.concentracion && !r.concentracion.perdida) {
    const cd = r.concentracion.cd, conj = r.concentracion.conjuro, bono = bonoSalvacion(c2, 'con');
    msg += ` Concentración en <b>${esc(conj)}</b>: salvación de Constitución CD <b>${cd}</b>.`;
    acts.unshift({ label: `Tirar ${sgn(bono)}`, hl: true, fn: () => tirarPrueba({ titulo: 'Concentración', sub: `Salvación de Constitución contra CD ${cd} · ${conj}`, bono, tipo: 'salvacion',
      alTirar: total => { if (total >= cd) return `<b class="ok">Mantienes la concentración</b> en ${esc(conj)}.`;
        if (S2.cur().play.conc === conj) S2.act(`Pierde la concentración en ${conj} (salvación ${total} contra CD ${cd})`, (db, x) => { terminarConc(x.play); });
        return `<b class="ko">Pierdes la concentración</b> en ${esc(conj)}.`; } }) });
    acts.splice(1, 0, { label: 'La pierdo', fn: () => S2.act(`Pierde la concentración en ${conj}`, (db, x) => { terminarConc(x.play); }) });
  }
  haptic(r.cayo || r.muerte ? 'heavy' : 'medium');
  golpeFx('dano');
  toast(msg, acts);
  return r;
}
export function sanar(S2, n) {
  let g = 0; const h = S2.act(`Recupera ${n} PG`, (db, x) => { g = curar(x, n); });
  golpeFx('cura'); haptic('light');
  toast(g ? `Recupera <b>${g}</b> PG. Tiene <b>${pgActuales(S2.cur())}</b>.` : 'Ya estaba al máximo.', [undoBtn(S2, h)]);
}
export function temporales(S2, n) {
  let g = 0; const h = S2.act(`${n} PG temporales`, (db, x) => { g = ponerTemporales(x, n); });
  toast(g ? `<b>${vidaDe(S2.cur()).temp}</b> PG temporales.` : `Ya tenía ${vidaDe(S2.cur()).temp} temporales o más: no se suman.`, [undoBtn(S2, h)]);
}
function golpeFx(tipo) {
  document.querySelectorAll('.pg-card, .vd-marcador').forEach(el => { el.classList.remove('fx-golpe', 'fx-cura'); void el.offsetWidth; el.classList.add(tipo === 'dano' ? 'fx-golpe' : 'fx-cura'); setTimeout(() => el.classList.remove('fx-golpe', 'fx-cura'), 700); });
}
export function tirarSalvacionMuerte(S2) {
  tirarPrueba({ titulo: 'Salvación contra muerte', sub: 'd20 sin modificadores', bono: 0, tipo: 'muerte',
    alTirar: nat => { let r; S2.act(`Salvación contra muerte: ${nat}`, (db, x) => { r = salvacionMuerte(x, nat); });
      if (r === 'revive') { burstFrom($('#daOut'), { n: 50, speed: 5 }); return '<b class="ok">¡Recupera 1 PG y despierta!</b>'; }
      return { muere: '<b class="ko">Tercer fallo: muere.</b>', estable: '<b class="ok">Tercer éxito: queda estable.</b>', exito: 'Un éxito más.', fallo: nat === 1 ? 'Dos fallos.' : 'Un fallo más.' }[r] + ` ${pipsMuerte(S2.cur())}`; } });
}

export function estabilizar(S2) { S2.act('Estabilizado a 0 PG', (db, x) => { const v = vidaDe(x); v.estable = true; v.muerte = { exitos: 0, fallos: 0 }; }); haptic('light'); }
export function revivir(S2) { S2.act('Vuelve a la vida con 1 PG', (db, x) => { revivirDom(x); }); }
export function openEstados() { renderEstados(); openSheet(edlg()); }
function renderEstados() {
  const c = ch(); if (!c) return; const v = vidaDe(c), glos = glosario();
  const regla = k => glos.find(e => e.cat === 'Estado' && norm(e.nombre) === norm(NOMBRE_ESTADO[k]))?.clave;
  $('#esSub').textContent = `${c.nombre}: lo que le afecta ahora. Se quita tocándolo de nuevo.`;
  const ago = v.agotamiento;
  $('#esBody').innerHTML = `<section class="es-top">
      <button type="button" class="es-insp ${v.inspiracion ? 'on' : ''}" data-es="inspiracion" aria-pressed="${v.inspiracion}">${gi('inspiracion')}<span><b>Inspiración heroica</b><small>${v.inspiracion ? 'La tienes: gástala para repetir un d20.' : 'Sin inspiración.'}</small></span></button>
      <div class="es-ago"><span class="es-ago-t">${gi('agotamiento')}<span><b>Agotamiento</b><small>${ago ? `Nivel ${ago}: −${ago * 2} a las pruebas de d20 y −${String(ago * 1.5).replace('.', ',')} m de velocidad.${ago >= 6 ? ' Nivel 6: muerte.' : ''}` : 'Sin agotamiento.'}</small></span></span>
        <div class="stepper"><button type="button" data-esago="-1" aria-label="Quitar un nivel" ${ago ? '' : 'disabled'}>−</button><output>${ago}</output><button type="button" data-esago="1" aria-label="Añadir un nivel" ${ago >= 6 ? 'disabled' : ''}>+</button></div></div></section>
    <section class="es-lista">${ESTADOS.map(([k, n]) => { const on = v.estados.includes(k), cl = regla(k);
      return `<div class="es-it ${on ? 'on' : ''}"><button type="button" class="es-tog" data-estado="${k}" aria-pressed="${on}"><i class="es-marca" aria-hidden="true"></i><span><b>${esc(n)}</b><small>${esc(RESUMEN_ESTADO[k])}</small></span></button>${cl ? `<button type="button" class="linkish es-regla" data-esregla="${esc(cl)}">Regla</button>` : ''}</div>`; }).join('')}</section>
    ${glos.length ? '' : '<p class="note">Resúmenes de la app. Importa el Manual del Jugador para leer cada regla completa.</p>'}`;
}
export function alternarEstado(S2, k) {
  const on = vidaDe(S2.cur()).estados.includes(k);
  S2.act(`${on ? 'Deja de estar' : 'Queda'} ${NOMBRE_ESTADO[k].toLowerCase()}`, (db, x) => { const v = vidaDe(x); v.estados = on ? v.estados.filter(e => e !== k) : [...v.estados, k]; });
  haptic('light');
}

export function init(store) {
  S = store;
  const body = $('#vdBody');
  const cant = () => { const n = parseInt($('#vdCant')?.value, 10); if (!(n > 0)) { $('#vdCant')?.focus(); toast('Escribe primero una cantidad.'); return 0; } return n; };
  on(body, 'click', '[data-vd]', (e, b) => {
    const a = b.dataset.vd;
    if (a === 'dano') { const n = cant(); if (n) { danar(S, n, !!$('#vdCrit')?.checked); render(); } }
    if (a === 'curar') { const n = cant(); if (n) { sanar(S, n); render(); } }
    if (a === 'temp') { const n = cant(); if (n) { temporales(S, n); render(); } }
    if (a === 'editarmax') { editarMax = true; render(); $('#vdMax')?.select(); }
    if (a === 'cancelarmax') { editarMax = false; render(); }
    if (a === 'guardarmax') { const n = Math.max(1, parseInt($('#vdMax').value, 10) || 1); S.act(`PG máximos: ${n}`, (db, x) => { vidaDe(x).maxManual = n === pgMaximoCalculado(x) ? null : n; }); editarMax = false; render(); }
    if (a === 'mediamax') { S.act('PG máximos: la media', (db, x) => { vidaDe(x).maxManual = null; }); render(); }
    if (a === 'fijar') { const n = parseInt($('#vdCant')?.value, 10); if (!(n >= 0) || $('#vdCant').value === '') { $('#vdCant')?.focus(); toast('Escribe en «Cantidad» los PG que tiene ahora.'); return; }
      S.act(`PG actuales: ${n}`, (db, x) => { fijarPg(x, n); }); render(); }
    if (['dano', 'curar', 'temp'].includes(a) && $('#vdCant')) { $('#vdCant').value = ''; $('#vdCant').focus({ preventScroll: true }); }
  });
  on(body, 'click', '[data-vddg]', (e, b) => {
    const dado = b.dataset.vddg, caras = parseInt(dado.slice(1), 10), t = rngCripto(caras); let g;
    const h = S.act(`Gasta un dado de golpe (${dado}): ${t}`, (db, x) => { g = gastarDadoGolpe(x, dado, t); });
    if (!g) return; golpeFx('cura'); haptic('light'); render();
    toast(`Dado de golpe ${dado}: <b>${t}</b> ${sgn(modOf(S.cur().stats?.con))} = recupera <b>${g.ganado}</b> PG.`, [undoBtn(S, h)]);
  });
  on(document, 'click', '[data-pip]', (e, b) => {
    const [tipo, i] = b.dataset.pip.split('|'), k = tipo === 'exito' ? 'exitos' : 'fallos';
    S.act(`Salvaciones contra muerte: ${tipo === 'exito' ? 'éxitos' : 'fallos'}`, (db, x) => { const v = vidaDe(x), m = v.muerte; m[k] = m[k] === +i + 1 ? +i : +i + 1; v.estable = m.exitos >= 3 && m.fallos < 3; if (m.fallos >= 3) marcarCaida(x, 'salvaciones'); });
    haptic('light');
  });
  body.addEventListener('keydown', e => { if (e.target.id === 'vdCant' && e.key === 'Enter') { e.preventDefault(); const n = cant(); if (n) { danar(S, n); render(); e.target.value = ''; } } });
  S.subscribe(() => { if (dlg().open && !editarMax) { const f = document.activeElement?.id === 'vdCant', val = $('#vdCant')?.value; render(); if (f) { $('#vdCant').value = val; $('#vdCant').focus({ preventScroll: true }); } } if (edlg().open) renderEstados(); });

  const eb = $('#esBody');
  on(eb, 'click', '[data-estado]', (e, b) => alternarEstado(S, b.dataset.estado));
  on(eb, 'click', '[data-esregla]', (e, b) => abrirTermino(b.dataset.esregla));
  on(eb, 'click', '[data-es="inspiracion"]', () => { const v = vidaDe(S.cur()); S.act(v.inspiracion ? 'Gasta la inspiración heroica' : 'Gana inspiración heroica', (db, x) => { vidaDe(x).inspiracion = !vidaDe(x).inspiracion; }); haptic('light'); });
  on(eb, 'click', '[data-esago]', (e, b) => { const d = +b.dataset.esago; S.act(`Agotamiento ${d > 0 ? '+1' : '−1'}`, (db, x) => { const v = vidaDe(x); v.agotamiento = Math.max(0, Math.min(6, v.agotamiento + d)); if (v.agotamiento >= 6) marcarCaida(x, 'agotamiento'); }); });
}
