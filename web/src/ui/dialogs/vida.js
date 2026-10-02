// Vida y estados: daño, curación, PG temporales, salvaciones contra muerte, concentración y estados.
import { esc, norm, numLibre } from '../../core/util.js';
import { rangoMuerte, reduccionArmaduraPesada, reaccionesDano, alCaerA0 } from '../../domain/combate/automatismos.js';
import { sgn, modOf } from '../../domain/reglas/reglas2024.js';
import { vidaDe, ponerEfecto, soltarConc, pgMaximo, pgMaximoBase, aumentarMax, quitarMax, pgActuales, aplicarDano, curar, ponerTemporales, dadosDeGolpe, gastarDadoGolpe, salvacionMuerte, estadoVital, marcarCaida, revivir as revivirDom, cdConcentracion, ESTADOS_INCAP,
  ESTADOS, NOMBRE_ESTADO, RESUMEN_ESTADO } from '../../domain/combate/vida.js';
import { bonoSalvacion } from '../../domain/reglas/habilidades.js';
import { statsEfectivos } from '../../domain/equipo/objetosEfecto.js';
import { glosario } from '../../domain/conjuros/catalogo.js';
import { rngCripto } from '../../domain/reglas/dados.js';
import { combateDe } from '../../domain/combate/combate.js';
import { $, on } from '../componentes/dom.js';
import { gi } from '../componentes/tema.js';
import { icon } from '../componentes/icons.js';
import { avatarHtml } from '../componentes/avatar.js';
import { openSheet } from '../componentes/dialog.js';
import { toast, undoBtn } from '../componentes/toast.js';
import { burstFrom } from '../animaciones/fx.js';
import { haptic } from '../../platform/native.js';
import { tirarPrueba, tirarDano } from './dados.js';
import { abrirTermino } from './biblioteca.js';
import { pctVida, tonoVida, pipsMuerte, vigiliaHtml } from '../pantallas/vitales.js';
import { EFECTOS, EFECTO, efectosDe, normEfectos, fmtRondas, inmunidadesEstado, resistenciasDe } from '../../domain/combate/efectos.js';
import { pedir } from '../componentes/modal.js';
import { golpe } from '../animaciones/golpes.js';

let S;
const dlg = () => $('#vidaDlg'), edlg = () => $('#estadosDlg');
const ch = () => S.cur();

let enDescanso = false;
export function openVida(foco, { descanso = false } = {}) { enDescanso = descanso; render(); openSheet(dlg()); dlg().addEventListener('close', () => { enDescanso = false; }, { once: true }); if (foco !== false) setTimeout(() => $('#vdCant')?.focus({ preventScroll: true }), 280); }

function render() {
  const c = ch(); if (!c) return;
  const v = vidaDe(c), max = pgMaximo(c), act = pgActuales(c), est = estadoVital(c);
  $('#vdHead').innerHTML = `${avatarHtml(c, 'md')}<div><h2 id="vdTitle">Puntos de golpe</h2><div class="dsub">${esc(c.nombre)} · Constitución ${sgn(modOf(statsEfectivos(c).con))}</div></div>`;
  let h = `<section class="vd-marcador ${tonoVida(c)}">
    <div class="vd-cifra"><span class="vd-act">${act}</span><span class="vd-max">/ ${max}</span>${v.temp ? `<span class="vd-temp" title="Puntos de golpe temporales">+${v.temp} temp.</span>` : ''}</div>
    <div class="vd-barra" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${act}" aria-label="Puntos de golpe"><i style="width:${pctVida(c)}%"></i>${v.temp ? `<b style="width:${Math.min(100, Math.round(v.temp / max * 100))}%"></b>` : ''}</div>
    <p class="vd-estado">${{ vivo: act === max ? 'Ileso.' : `Le faltan ${max - act} PG.`, moribundo: 'A 0 PG: inconsciente. Tira salvaciones contra muerte al empezar tu turno.', estable: 'Estable a 0 PG: inconsciente, sin tirar salvaciones. Recupera 1 PG en 1d4 horas.', muerto: 'Muerto. Solo la magia puede traerlo de vuelta.' }[est]}</p></section>`;
  h += `<section class="vd-entrada"><label class="f">Cantidad<input id="vdCant" type="text" inputmode="tel" autocomplete="off" placeholder="0" aria-label="Cantidad de puntos de golpe"></label>
    <div class="vd-btns"><button type="button" class="danger" data-vd="dano">${gi('pg')}Daño</button><button type="button" class="vd-cura" data-vd="curar">${gi('curacion')}Curar</button><button type="button" data-vd="temp">${icon('plus')}Temporales</button></div>
    ${act === 0 && est !== 'muerto' ? '<label class="chk-line"><input type="checkbox" id="vdCrit"> Fue un golpe crítico: cuenta como dos fallos</label>' : ''}
    <p class="hint">Los temporales no se suman entre sí: te quedas con los más altos, y el daño los gasta primero.</p></section>`;
  if (act === 0 && est !== 'vivo') {
    h += `<section class="vd-muerte">${vigiliaHtml(c)}</section>`;
  }
  h += `<section class="vd-dados ${enDescanso ? 'descanso' : ''}"><h3>${gi('dado_golpe')}Dados de golpe${enDescanso ? '<small class="vd-dg-tag">Descanso corto</small>' : ''}</h3><div class="vd-dg">${dadosDeGolpe(c).map(d => `<div class="vd-dg-it">
      <b>${d.quedan}<small>/${d.total}</small></b><span>${d.dado}</span>${enDescanso ? `<button type="button" data-vddg="${d.dado}" ${d.quedan && act < max && est !== 'muerto' ? '' : 'disabled'}>Gastar y tirar</button>` : ''}</div>`).join('')}</div>
    ${enDescanso ? `<p class="hint">Cada dado cura su tirada ${sgn(modOf(statsEfectivos(c).con))} (Con), mínimo 1. Gasta los que quieras mientras dure el descanso; con un descanso largo se recuperan todos.</p>`
      : `<p class="hint vd-dg-nota">Solo se gastan durante un descanso corto: cada dado cura su tirada ${sgn(modOf(statsEfectivos(c).con))} (Con), mínimo 1. Con un descanso largo se recuperan todos.</p>${combateDe(c).activo || est === 'muerto' ? '' : '<button type="button" class="ghost vd-dg-corto" data-cmd="short">Hacer un descanso corto</button>'}`}</section>`;
  h += `<section class="vd-max-sec"><h3>${gi('pg')}PG máximos aumentados</h3>
    ${v.maxExtra.length ? `<ul class="vd-mx">${v.maxExtra.map(m => `<li><b>+${m.n}</b><span>${esc(m.nombre)}</span><button type="button" data-vdmxq="${esc(m.id)}">Termina</button></li>`).join('')}</ul>` : ''}
    <div class="vd-mx-add"><input id="vdMxN" type="text" inputmode="tel" autocomplete="off" placeholder="+5" aria-label="Aumento de PG máximos"><input id="vdMxNom" placeholder="Auxilio, Festín de héroes…" aria-label="Origen" autocomplete="off"><button type="button" data-vd="mxadd">${icon('plus')}Aumentar</button></div>
    <p class="hint">No son PG temporales: suben tu máximo y tus PG actuales en la misma cantidad. Al terminar, el máximo vuelve a ${pgMaximoBase(c)} y tus PG se quedan como estén si caben. Tu máximo base se ajusta en «Editar personaje».</p></section>`;
  $('#vdBody').innerHTML = h;
}

export function danar(S2, n, critico = false) {
  const c = S2.cur(), desde = pgActuales(c); let r;
  const h = S2.act(`Recibe ${n} de daño${critico ? ' (crítico)' : ''}`, (db, x) => { r = aplicarDano(x, n, { critico }); if (r.concentracion?.perdida) soltarConc(x); });
  const c2 = S2.cur(), acts = [undoBtn(S2, h)], res = resistenciasDe(c2);
  // Resistencias: si el daño es de uno de esos tipos, rehace el golpe con la mitad
  // Reacciones que reducen el daño: Esquiva asombrosa, Desviar ataques, Salvaguarda arcana, Parada
  for (const op of reaccionesDano(c2)) if (n > 0) acts.push({ label: op.label, fn: () => { S2.undo(h); let n2 = n; S2.act(op.label, (db, x) => { n2 = op.aplica(x, n); }); danar(S2, n2, critico);
    // Trueno de la tormenta: no reduce el daño, se lo devuelves a quien te lo hizo
    if (op.tirada) tirarDano({ titulo: op.tirada.titulo, sub: `de daño ${op.tirada.tipo}`, expr: op.tirada.expr, clave: op.tirada.tipo }); } });
  // Aguante incansable (orco): en vez de caer a 0 PG te quedas a 1 (sin perder la concentración: tiras la salvación)
  if (r.cayo && !r.muerte) for (const op of alCaerA0(c2)) acts.unshift({ label: op.label, hl: true, fn: () => {
    S2.undo(h); let r2 = null; const h2 = S2.act(op.label, (db, x) => { r2 = aplicarDano(x, n, { critico }); op.aplica(x); });
    golpeFx('cura', 1, { desde: 0, hasta: 1 }); haptic('medium');
    toast(`<b>${n}</b> de daño, pero te quedas a <b>1 PG</b> (Aguante incansable).${r2?.concentracion ? ` Concentración en <b>${esc(r2.concentracion.conjuro)}</b>: salvación de Constitución CD <b>${r2.concentracion.cd}</b>.` : ''}`, [undoBtn(S2, h2)]);
    if (r2?.concentracion) setTimeout(() => tirarConcentracion(S2, n), 450); } });
  const red = reduccionArmaduraPesada(c2);
  if (red && n > 0) acts.push({ label: `Maestro en armaduras pesadas: −${red}`, fn: () => { S2.undo(h); danar(S2, Math.max(0, n - red), critico); } });
  if (res.length && n > 1) acts.push({ label: 'Tengo resistencia: la mitad', fn: () => { S2.undo(h); danar(S2, Math.floor(n / 2), critico); } });
  let msg = `<b>${n}</b> de daño${r.absorbido ? ` (${r.absorbido} a los temporales)` : ''}. Quedan <b>${pgActuales(c2)}</b> PG.${res.length ? ` <span class="tnote">Resistes: ${esc(res.map(x => `${x.tipo} (${x.fuente})`).join(', '))}.</span>` : ''}`;
  if (r.muerte) msg = `<b>${n}</b> de daño: <b>${esc(c.nombre)} muere</b>${r.fallo ? ' (tercer fallo)' : ' (daño masivo)'}.`;
  else if (r.cayo) msg = `<b>${n}</b> de daño: cae a 0 PG, inconsciente.${r.concentracion?.perdida ? ` Pierde la concentración en ${esc(r.concentracion.conjuro)}.` : ''}`;
  else if (r.fallo) msg = `Daño a 0 PG: un fallo en las salvaciones contra muerte.`;
  if (r.concentracion && !r.concentracion.perdida) {
    const { cd, conjuro: conj } = r.concentracion;
    msg += ` Concentración en <b>${esc(conj)}</b>: salvación de Constitución CD <b>${cd}</b>.`;
    acts.unshift({ label: `Tirar ${sgn(bonoSalvacion(c2, 'con'))}`, hl: true, fn: () => tirarConcentracion(S2, n) });
    acts.splice(1, 0, { label: 'La pierdo', fn: () => S2.act(`Pierde la concentración en ${conj}`, (db, x) => { soltarConc(x); }) });
    setTimeout(() => { if (S2.cur()?.play.conc === conj) tirarConcentracion(S2, n); }, 450);
  }
  haptic(r.cayo || r.muerte ? 'heavy' : 'medium');
  golpeFx('dano', n, { desde, hasta: pgActuales(S2.cur()), cae: r.cayo || r.muerte });
  toast(msg, acts);
  return r;
}
export function tirarConcentracion(S2, dano) {
  const c = S2.cur(), conj = c?.play.conc; if (!conj) return;
  const cd = cdConcentracion(dano);
  tirarPrueba({ titulo: 'Concentración', sub: `Salvación de Constitución CD ${cd} (${dano} de daño) · ${conj}`, bono: bonoSalvacion(c, 'con'), tipo: 'salvacion', ab: 'con', cd, motivo: 'concentracion',
    alTirar: total => { if (total >= cd) return `<b class="ok">Mantienes la concentración</b> en ${esc(conj)}.`;
      if (S2.cur().play.conc === conj) S2.act(`Pierde la concentración en ${conj} (salvación ${total} contra CD ${cd})`, (db, x) => { soltarConc(x); });
      return `<b class="ko">Pierdes la concentración</b> en ${esc(conj)}.`; } });
}
export async function pedirConcentracion(S2) {
  const conj = S2.cur()?.play.conc; if (!conj) return;
  const r = await pedir({ titulo: `Concentración en ${conj}`, texto: '¿Cuánto daño has recibido? La CD es la mitad del daño (redondeando hacia abajo), mínimo 10 y máximo 30. Si el daño viene de varias fuentes, tira una salvación por cada una.',
    tipo: 'number', min: 1, max: 999, ok: 'Tirar' });
  const n = numLibre(r); if (!(n > 0)) return;
  tirarConcentracion(S2, n);
}
export function sanar(S2, n) {
  const desde = pgActuales(S2.cur()); let g = 0; const h = S2.act(`Recupera ${n} PG`, (db, x) => { g = curar(x, n); });
  golpeFx('cura', g || n, { desde, hasta: pgActuales(S2.cur()) }); haptic('light');
  toast(g ? `Recupera <b>${g}</b> PG. Tiene <b>${pgActuales(S2.cur())}</b>.` : 'Ya estaba al máximo.', [undoBtn(S2, h)]);
}
export function temporales(S2, n) {
  let g = 0; const h = S2.act(`${n} PG temporales`, (db, x) => { g = ponerTemporales(x, n); });
  golpeFx('temp', vidaDe(S2.cur()).temp); haptic('light');
  toast(g ? `<b>${vidaDe(S2.cur()).temp}</b> PG temporales.` : `Ya tenía ${vidaDe(S2.cur()).temp} temporales o más: no se suman.`, [undoBtn(S2, h)]);
}
function golpeFx(tipo, n = null, opts = {}) { golpe(tipo, n, { max: pgMaximo(S.cur()), ...opts }); }
export function tirarSalvacionMuerte(S2) {
  tirarPrueba({ titulo: 'Salvación contra muerte', sub: 'd20 sin modificadores', bono: 0, tipo: 'muerte', critMin: rangoMuerte(S2.cur()),
    alTirar: (nat, total = nat) => { let r; S2.act(`Salvación contra muerte: ${total}${total !== nat ? ` (d20 ${nat})` : ''}`, (db, x) => { r = salvacionMuerte(x, nat >= rangoMuerte(x) ? 20 : nat, total); });
      if (r === 'revive') { burstFrom($('#daOut'), { n: 50, speed: 5 }); return '<b class="ok">¡Recupera 1 PG y despierta!</b>'; }
      return { muere: '<b class="ko">Tercer fallo: muere.</b>', estable: '<b class="ok">Tercer éxito: queda estable.</b>', exito: 'Un éxito más.', fallo: nat === 1 ? 'Dos fallos.' : 'Un fallo más.' }[r] + ` ${pipsMuerte(S2.cur())}`; } });
}

export function estabilizar(S2) { S2.act('Estabilizado a 0 PG', (db, x) => { const v = vidaDe(x); v.estable = true; v.muerte = { exitos: 0, fallos: 0 }; }); haptic('light'); }
export function revivir(S2) { S2.act('Vuelve a la vida con 1 PG', (db, x) => { revivirDom(x); }); }
export function openEstados() { Q = ''; $('#esQ').value = ''; renderEstados(); openSheet(edlg()); }
let Q = '';
const marca = (texto, q) => { const t = String(texto || ''); if (!q) return esc(t); const i = norm(t).indexOf(q); return i < 0 ? esc(t) : `${esc(t.slice(0, i))}<mark>${esc(t.slice(i, i + q.length))}</mark>${esc(t.slice(i + q.length))}`; };
function renderEstados() {
  const c = ch(); if (!c) return; const v = vidaDe(c), glos = glosario(), q = norm(Q.trim()), ve = t => !q || t.some(x => norm(x).includes(q));
  const regla = k => glos.find(e => e.cat === 'Estado' && norm(e.nombre) === norm(NOMBRE_ESTADO[k]))?.clave;
  $('#esSub').textContent = `${c.nombre}: lo que le afecta ahora. Se quita tocándolo de nuevo.`;
  const ago = v.agotamiento, txtAgo = ago ? `Nivel ${ago}: −${ago * 2} a las pruebas de d20 y −${String(ago * 1.5).replace('.', ',')} m de velocidad.${ago >= 6 ? ' Nivel 6: muerte.' : ''}` : 'Sin agotamiento.';
  const insp = ve(['Inspiración heroica', 'repetir d20']) ? `<button type="button" class="es-insp ${v.inspiracion ? 'on' : ''}" data-es="inspiracion" aria-pressed="${v.inspiracion}">${gi('inspiracion')}<span><b>${marca('Inspiración heroica', q)}</b><small>${v.inspiracion ? 'La tienes: gástala para repetir un d20.' : 'Sin inspiración.'}</small></span></button>` : '';
  const agoH = ve(['Agotamiento', txtAgo, 'cansancio']) ? `<div class="es-ago"><span class="es-ago-t">${gi('agotamiento')}<span><b>${marca('Agotamiento', q)}</b><small>${txtAgo}</small></span></span>
        <div class="stepper"><button type="button" data-esago="-1" aria-label="Quitar un nivel" ${ago ? '' : 'disabled'}>−</button><output>${ago}</output><button type="button" data-esago="1" aria-label="Añadir un nivel" ${ago >= 6 ? 'disabled' : ''}>+</button></div></div>` : '';
  const inm = inmunidadesEstado(c);
  const estados = ESTADOS.filter(([k, n]) => ve([n, RESUMEN_ESTADO[k]])).map(([k, n]) => { const on = v.estados.includes(k), cl = regla(k);
    return `<div class="es-it ${on ? 'on' : ''}"><button type="button" class="es-tog" data-estado="${k}" aria-pressed="${on}"><i class="es-marca" aria-hidden="true"></i><span><b>${marca(n, q)}</b><small>${inm.has(k) ? `<b>Inmune (${esc(inm.get(k))})</b>: no te afecta. ` : ''}${marca(RESUMEN_ESTADO[k], q)}</small></span></button>${cl ? `<button type="button" class="linkish es-regla" data-esregla="${esc(cl)}">Regla</button>` : ''}</div>`; });
  const efectos = [[true, 'Beneficiosos'], [false, 'Perjudiciales']].map(([bueno, t]) => { const xs = EFECTOS.filter(e => e.bueno === bueno && (!e.pocion || v.efectos.some(y => y.k === e.k)) && ve([e.nombre, e.texto]));
    return xs.length ? `<h4 class="es-sub">${t}</h4><section class="es-lista ef">${xs.map(e => { const x = v.efectos.find(y => y.k === e.k), on = !!x;
      return `<div class="es-it ${on ? 'on' : ''} ${bueno ? 'bueno' : 'malo'}"><button type="button" class="es-tog" data-efk="${e.k}" aria-pressed="${on}"><i class="es-marca" aria-hidden="true"></i><span><b>${gi(e.ico, 'es-ico')}${marca(e.nombre, q)}${on && x.rondas != null ? `<em class="es-dur">quedan ${esc(fmtRondas(x.rondas))}</em>` : !on && e.dur ? `<em class="es-dur apag">${esc(fmtRondas(e.dur))}</em>` : ''}${x?.conc ? '<em class="es-dur conc">concentración</em>' : ''}</b><small>${marca(e.texto, q)}</small></span></button></div>`; }).join('')}</section>` : ''; }).join('');
  const propios = v.efectos.filter(x => x.propio && ve([x.nombre])).map(x => `<div class="es-it on bueno"><div class="es-tog"><i class="es-marca" aria-hidden="true"></i><span><b>${marca(x.nombre, q)}</b><small>${esc(efectosDe(c).find(e => e.id === x.id)?.texto || '')}</small></span></div><button type="button" class="linkish es-regla" data-efq="${esc(x.id)}">Quitar</button></div>`).join('');
  const nada = q && !insp && !agoH && !estados.length && !efectos && !propios;
  $('#esCuenta').textContent = q ? (nada ? 'Sin coincidencias' : `${estados.length + (efectos.match(/data-efk/g) || []).length + (propios.match(/data-efq/g) || []).length + (insp ? 1 : 0) + (agoH ? 1 : 0)} coincidencias`) : '';
  $('#esBody').innerHTML = nada ? `<p class="el-vacio">Nada coincide con «${esc(Q.trim())}». Prueba con parte del nombre o con lo que hace, como «velocidad» o «ventaja».</p>` : `${insp || agoH ? `<section class="es-top">${insp}${agoH}</section>` : ''}
    ${estados.length ? `${q ? `<h3 class="es-h">${gi('estados')}Estados</h3>` : ''}<section class="es-lista">${estados.join('')}</section>` : ''}
    ${!q && !glos.length ? '<p class="note">Resúmenes de la app. Importa el Manual del Jugador para leer cada regla completa.</p>' : ''}
    ${efectos || propios || !q ? `<h3 class="es-h">${gi('inspiracion')}Efectos sobre ti</h3>` : ''}
    ${q ? '' : '<p class="hint">Conjuros y rasgos que te han lanzado (tú u otro). La hoja los suma sola a tus tiradas, a tu CA y a tu velocidad. Cada uno dura lo que dice su conjuro: en combate se descuenta al pasar de ronda y te avisa al terminar. También se quitan con un descanso largo o tocándolos.</p>'}
    ${efectos}
    ${propios || !q ? '<h4 class="es-sub">Propios</h4>' : ''}${propios}
    ${q ? '' : `<div class="ef-form"><input id="efNom" placeholder="Nombre: Aura del paladín, Anillo…" aria-label="Nombre del efecto" autocomplete="off">
      <label>CA<input id="efCa" inputmode="numeric" placeholder="+2"></label><label>Ataques<input id="efAt" placeholder="1d4 o +1"></label>
      <label>Salvaciones<input id="efSv" placeholder="+3"></label><label>Pruebas<input id="efPr" placeholder="1d4"></label><label>Velocidad (m)<input id="efVel" inputmode="decimal" placeholder="+3"></label><label>Rondas<input id="efRd" inputmode="numeric" placeholder="∞" title="Duración en rondas de combate (10 = 1 minuto). Vacío: hasta que lo quites."></label>
      <button type="button" data-efadd>${icon('plus')}Añadir efecto</button></div>`}`;
}
export async function alternarEfecto(S2, k) {
  const c = S2.cur(), v = vidaDe(c), ya = v.efectos.find(x => x.k === k), e = EFECTO[k];
  if (ya) { S2.act(`Termina ${e.nombre}`, (db, x) => { const vv = vidaDe(x); vv.efectos = vv.efectos.filter(y => y.k !== k); if (e.maxPg) quitarMax(x, ya.id); }); haptic('light'); return; }
  let n = 0;
  if (e.maxPg) { const r2 = await pedir({ titulo: e.nombre, texto: '¿Cuánto aumentan tus PG máximos? 5 con un espacio de nivel 2, y 5 más por cada nivel por encima.', valor: String(e.maxPg), tipo: 'number', min: 1, ok: 'Aplicar' }); n = parseInt(r2, 10); if (!(n > 0)) return; }
  S2.act(`Efecto: ${e.nombre}`, (db, x) => { ponerEfecto(x, k, { n }); });
  if (n) golpeFx('max', n); else golpeFx(e.bueno ? 'buff' : 'debuff');
  haptic('light');
}
export function alternarEstado(S2, k) {
  const on = vidaDe(S2.cur()).estados.includes(k);
  const conj = !on && ESTADOS_INCAP.includes(k) ? S2.cur().play.conc : '';
  S2.act(`${on ? 'Deja de estar' : 'Queda'} ${NOMBRE_ESTADO[k].toLowerCase()}`, (db, x) => { const v = vidaDe(x); v.estados = on ? v.estados.filter(e => e !== k) : [...v.estados, k]; if (conj) soltarConc(x); });
  if (conj) toast(`${esc(NOMBRE_ESTADO[k])}: pierdes la concentración en <b>${esc(conj)}</b>.`);
  haptic('light');
}

export function init(store) {
  S = store;
  const body = $('#vdBody');
  const cant = () => { const n = numLibre($('#vdCant')?.value); if (!(n > 0)) { $('#vdCant')?.focus(); toast('Escribe primero una cantidad.'); return 0; } return n; };
  on(body, 'click', '[data-vd]', (e, b) => {
    const a = b.dataset.vd;
    if (a === 'dano') { const n = cant(); if (n) { danar(S, n, !!$('#vdCrit')?.checked); render(); } }
    if (a === 'curar') { const n = cant(); if (n) { sanar(S, n); render(); } }
    if (a === 'temp') { const n = cant(); if (n) { temporales(S, n); render(); } }
    if (a === 'mxadd') { const n = numLibre($('#vdMxN').value), nom = $('#vdMxNom').value.trim() || 'Aumento'; if (!(n > 0)) { $('#vdMxN').focus(); return; }
      const desde = pgActuales(S.cur()); S.act(`PG máximos +${n} (${nom})`, (db, x) => { aumentarMax(x, { nombre: nom, n }); }); render(); golpeFx('max', n, { desde, hasta: pgActuales(S.cur()) }); }
    if (['dano', 'curar', 'temp'].includes(a) && $('#vdCant')) { $('#vdCant').value = ''; $('#vdCant').focus({ preventScroll: true }); }
  });
  on(body, 'click', '[data-vdmxq]', (e, b) => { const id = b.dataset.vdmxq; let m; const h = S.act('Termina un aumento de PG máximos', (db, x) => { m = quitarMax(x, id); x.vida.efectos = x.vida.efectos.filter(e2 => e2.id !== id); }); render(); if (m) toast(`${esc(m.nombre)} termina: tu máximo vuelve a ${pgMaximo(S.cur())}.`, [undoBtn(S, h)]); });
  on(body, 'click', '[data-vddg]', (e, b) => {
    const dado = b.dataset.vddg, caras = parseInt(dado.slice(1), 10), t = rngCripto(caras); let g;
    const h = S.act(`Gasta un dado de golpe (${dado}): ${t}`, (db, x) => { g = gastarDadoGolpe(x, dado, t); });
    if (!g) return; render(); golpeFx('cura', g.ganado, { desde: pgActuales(S.cur()) - g.ganado, hasta: pgActuales(S.cur()) }); haptic('light');
    toast(`Dado de golpe ${dado}: <b>${t}</b> ${sgn(modOf(statsEfectivos(S.cur()).con))} = recupera <b>${g.ganado}</b> PG.`, [undoBtn(S, h)]);
  });
  on(document, 'click', '[data-pip]', (e, b) => {
    const [tipo, i] = b.dataset.pip.split('|'), k = tipo === 'exito' ? 'exitos' : 'fallos';
    S.act(`Salvaciones contra muerte: ${tipo === 'exito' ? 'éxitos' : 'fallos'}`, (db, x) => { const v = vidaDe(x), m = v.muerte; m[k] = m[k] === +i + 1 ? +i : +i + 1; v.estable = m.exitos >= 3 && m.fallos < 3; if (m.fallos >= 3) marcarCaida(x, 'salvaciones'); });
    haptic('light');
  });
  body.addEventListener('keydown', e => { if (['vdMxN', 'vdMxNom'].includes(e.target.id) && e.key === 'Enter') { e.preventDefault(); body.querySelector('[data-vd=mxadd]')?.click(); return; } if (e.target.id === 'vdCant' && e.key === 'Enter') { e.preventDefault(); const n = cant(); if (n) { danar(S, n); render(); e.target.value = ''; } } });
  S.subscribe(() => { if (dlg().open) { const f = document.activeElement?.id === 'vdCant', val = $('#vdCant')?.value; render(); if (f) { $('#vdCant').value = val; $('#vdCant').focus({ preventScroll: true }); } } if (edlg().open) renderEstados(); });

  const eb = $('#esBody');
  $('#esQ').addEventListener('input', e => { Q = e.target.value; renderEstados(); eb.scrollTop = 0; });
  on(eb, 'click', '[data-estado]', (e, b) => alternarEstado(S, b.dataset.estado));
  on(eb, 'click', '[data-efk]', (e, b) => alternarEfecto(S, b.dataset.efk));
  on(eb, 'click', '[data-efq]', (e, b) => { const id = b.dataset.efq; S.act('Quita un efecto propio', (db, x) => { const vv = vidaDe(x); vv.efectos = vv.efectos.filter(y => y.id !== id); }); });
  on(eb, 'click', '[data-efadd]', () => {
    const val = id => $(id).value.trim(), nom = val('#efNom'), propio = { ca: val('#efCa'), ataque: val('#efAt'), salvacion: val('#efSv'), prueba: val('#efPr'), vel: val('#efVel') };
    if (!nom) { $('#efNom').focus(); return toast('Ponle un nombre al efecto.'); }
    S.act(`Efecto: ${nom}`, (db, x) => { const vv = vidaDe(x); vv.efectos = normEfectos([...vv.efectos, { nombre: nom, propio, rondas: parseInt(val('#efRd'), 10) || null }]); }); golpeFx('buff');
  });
  on(eb, 'click', '[data-esregla]', (e, b) => abrirTermino(b.dataset.esregla));
  on(eb, 'click', '[data-es="inspiracion"]', () => { const v = vidaDe(S.cur()); S.act(v.inspiracion ? 'Gasta la inspiración heroica' : 'Gana inspiración heroica', (db, x) => { vidaDe(x).inspiracion = !vidaDe(x).inspiracion; }); haptic('light'); });
  on(eb, 'click', '[data-esago]', (e, b) => { const d = +b.dataset.esago; S.act(`Agotamiento ${d > 0 ? '+1' : '−1'}`, (db, x) => { const v = vidaDe(x); v.agotamiento = Math.max(0, Math.min(6, v.agotamiento + d)); if (v.agotamiento >= 6) marcarCaida(x, 'agotamiento'); }); });
}
