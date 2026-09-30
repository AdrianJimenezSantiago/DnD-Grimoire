import { campoElegible, ponerValor, elegirDote } from '../elecciones.js';
import { clone, esc, joinY, norm } from '../../core/util.js';
import { NOMBRE_HAB as HAB_NOMBRE } from '../../domain/habilidades.js';
import { ABILS, ABIL_NAME, CLASES, perfil, sgn, clasesDe, vistaClase, nivelTotal, REQ_MULTICLASE } from '../../domain/reglas2024.js';
import { anadirPendientes, conjurosPendientes, esMejora, featuresAt, levelDiff, savantSchool } from '../../domain/progresion.js';
import { allSpellItems, compendio, itemMeta, itemToSid, listFilter, biblioteca } from '../../domain/catalogo.js';
import { nivelCambia } from '../../domain/intercambios.js';
import { $, on } from '../dom.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { ascend } from '../fx.js';
import { haptic } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { previewSpell } from './conjuro.js';
import { tarjetasSubclase, campoClase, initSubclases } from '../subclases.js';
import { gi } from '../tema.js';
import { aumentoDeDote, faltaRequisito } from '../../domain/origen.js';
import { AUMENTO_DOTE } from '../../domain/dotesDatos.js';
import { NIVEL_ESTILO, ALTERNATIVAS, opcionesEstilo, estilosDe, esAlternativa } from '../../domain/estilos.js';
import { md, mdPlano } from './conjuro.js';
import { cupoEn, cupoMaestrias } from '../../domain/maestria.js';
import { ORDENES, ordenDe } from '../../domain/ordenes.js';
import { conjurosDeDote, filtroEleccion } from '../../domain/conjurosDote.js';
import { maestriasHtml, alternar as alternarMaes } from '../maestrias.js';
import { fuentesExtra, repartoHabilidades } from '../../domain/creacion.js';
import { periciasDisponibles } from '../../domain/habilidades.js';
import { fuenteHtml, periciaHtml, alternarHab, aplicarFuente, faltanDe } from '../habilidadesElegir.js';
import { VARIANTES, varianteDe } from '../../domain/variantes.js';
import { cupoManiobras, alternarManiobra } from '../../domain/maniobras.js';
import { maniobrasHtml } from '../maniobras.js';

let S, LV = null;
const dlg = () => $('#lvlDlg');
const TITLE = { orden: 'Orden de tu clase', doteConj: 'Conjuros de la dote', maestria: 'Maestría con armas', estilo: 'Estilo de combate', estiloTrucos: 'Trucos de tu estilo', clase: 'En qué clase subes', resumen: 'Qué ganas', subclase: 'Subclase', mejora: 'Mejora o dote', experto: 'Conjuro gratis de tu escuela', libro: 'Conjuros para el libro', preparados: 'Nuevos conjuros preparados', trucos: 'Trucos nuevos', habilidades: 'Habilidades', variante: 'Elige la variante', maniobras: 'Maniobras', confirmar: 'Confirmar' };
const char = () => S.db.chars.find(c => c.id === LV.id);
const objetivo = () => { const ch = char(), c = clasesDe(ch).find(x => x.clase === LV.clase); return c || { clase: LV.clase, subclase: '', nivel: 0, principal: false, nueva: true }; };
const listaDe = (clase, subclase) => { const cls = CLASES[clase] || {}; return cls.cast ? clase : cls.subCast && cls.subCast.re.test(subclase || '') ? 'Mago' : ''; };

const cambiosHtml = xs => xs.length ? `<section class="av-sec av-cambios lv-cambios"><h3>${gi('libro')}Al subir también puedes cambiar</h3><ul class="av-lista">${xs.map(i => `<li class="av-it">${gi(i.ico, 'av-it-ico')}<span class="av-it-t"><b>${esc(i.titulo)}${i.fuente ? `<small>${esc(i.fuente)}</small>` : ''}</b><span>${esc(i.texto)}</span></span></li>`).join('')}</ul></section>` : '';
const doteLib = n => biblioteca().dotes.find(x => norm(x.nombre) === norm(String(n || '').replace(/\s*\([^)]*\)\s*$/, '')));
const aumentosDote = n => { const x = doteLib(n); return (x && aumentoDeDote(x.texto)) || AUMENTO_DOTE[norm(String(n || '').replace(/\s*\([^)]*\)\s*$/, ''))] || null; };
// Tope de la característica que sube una dote: 30 en los dones épicos, 20 en el resto
const topeDote = n => { const x = doteLib(n); return (x ? x.cat === 'Don épico' || /m[aá]ximo de 30/i.test(x.texto) : /^don /i.test(String(n || '').trim())) ? 30 : 20; };
// Dotes cuya característica elegida cambia algo más (Resiliente da la salvación): se guardan con ella entre paréntesis
const conDetalle = (n, k) => /^resiliente$/i.test(norm(n)) && k ? `${n} (${ABIL_NAME[k]})` : n;
// Nivel 20: Campeón primordial (bárbaro) y Cuerpo y mente (monje) suben dos características en 4, hasta 25
const CUMBRE = { 'Bárbaro': ['fue', 'con'], 'Monje': ['des', 'sab'] };
function draft(conDote = true) {
  const d = clone(char()), o = objetivo();
  if (o.principal) { d.nivel = LV.to; d.subclase = LV.subclase; }
  else { d.multiclase = d.multiclase || []; const m = d.multiclase.find(x => x.clase === o.clase); if (m) Object.assign(m, { nivel: LV.to, subclase: LV.subclase }); else d.multiclase.push({ clase: o.clase, subclase: LV.subclase, nivel: LV.to }); }
  const a = LV.asi, up = (k, n, tope = 20) => { if (k) d.stats[k] = Math.max(d.stats[k], Math.min(tope, d.stats[k] + n)); };
  if (LV.steps?.includes('mejora') || esMejora(o.clase, LV.to) || LV.to === 19) {
    if (a.modo === 'dos') up(a.a, 2);
    if (a.modo === 'uno') { up(a.a, 1); if (a.b !== a.a) up(a.b, 1); }
    if (a.modo === 'dote') up(a.c, 1, topeDote(a.dote));
  }
  if (LV.to === 20 && CUMBRE[o.clase]) CUMBRE[o.clase].forEach(k => up(k, 4, 25));
  if (LV.orden) d.ordenes = { ...(d.ordenes || {}), [o.clase]: LV.orden };
  const e = LV.estilo || {};
  if (e.nuevo) d.dotes = [...(d.dotes || []).filter(x => x !== e.quitar), e.nuevo];
  // La dote elegida ya cuenta para lo que dé (Habilidoso pide habilidades, por ejemplo)
  if (conDote && (LV.steps?.includes('mejora') || esMejora(o.clase, LV.to) || LV.to === 19) && a.modo === 'dote' && a.dote) {
    const n = conDetalle(a.dote, a.c); if (!(d.dotes || []).includes(n)) d.dotes = [...(d.dotes || []), n]; }
  if (LV.variante) d.variantes = { ...(d.variantes || {}), [o.clase]: LV.variante };
  if (LV.man) d.maniobras = [...LV.man];
  return d;
}
// Habilidades tras lo elegido en el paso de habilidades (sin las pericias)
function habTras() {
  let hab = { ...(char().habilidades || {}) };
  for (const f of LV.fuentes || []) hab = aplicarFuente(hab, f, LV.habSel[f.clave] || []);
  return hab;
}
function faltaHabilidades() {
  let hab = { ...(char().habilidades || {}) };
  for (const f of LV.fuentes) {
    const sel = LV.habSel[f.clave] || [], n = f.herramientas || f.opcional ? 0 : faltanDe(f, hab, sel);
    if (n) return `${f.nombre}: elige ${n} ${n === 1 ? 'habilidad' : 'habilidades'} más.`;
    hab = aplicarFuente(hab, f, sel);
  }
  const posibles = Object.keys(hab).filter(k => hab[k] === 1).length, n = Math.min(LV.nPer - LV.perPend, posibles + LV.perSel.length) - LV.perSel.length;
  return n > 0 ? `Elige ${n} ${n === 1 ? 'pericia' : 'pericias'} más.` : '';
}
function plan() {
  const ch = char(), d = draft(), A = perfil(ch), B = perfil(d), to = LV.to, o = objetivo(), cls = CLASES[o.clase] || {};
  const steps = [...(LV.elegirClase ? ['clase'] : []), 'resumen'];
  if (to === 1 && ORDENES[o.clase] && !ordenDe(ch, o.clase)) steps.push('orden');
  if (to === 3 && (cls.subs || []).length) steps.push('subclase');
  if (esMejora(o.clase, to) || to === 19) steps.push('mejora');
  LV.cupoMaes = cupoMaestrias(d); if (!LV.maes) LV.maes = [...(ch.maestrias || [])];
  if (cupoEn(o.clase, to) > cupoEn(o.clase, to - 1)) steps.push('maestria');
  const nEst = NIVEL_ESTILO[o.clase], suyos = [...estilosDe(ch, biblioteca().dotes).map(x => (ch.dotes || []).find(n => norm(n).startsWith(norm(x.nombre))) || x.nombre), ...(ch.dotes || []).filter(esAlternativa)];
  // El Campeón gana otro estilo de combate a nivel 7 (Estilo de combate adicional)
  LV.estiloGana = (!!nEst && to === nEst) || (o.clase === 'Guerrero' && /campe[oó]n/i.test(LV.subclase || '') && to === 7); LV.estiloSuyos = suyos;
  if (LV.estiloGana || (nEst && to > nEst && suyos.length)) steps.push('estilo');
  // Golpes benditos (clérigo 7) y Furia elemental (druida 7): se elige variante al ganarlos, o después si quedó sin elegir
  const vdef = VARIANTES[o.clase]; if (vdef && to >= vdef.nivel && !varianteDe(ch, o.clase)) steps.push('variante');
  // Maniobras del Maestro del combate: 3 a nivel 3 y 2 más a niveles 7, 10 y 15
  if (!LV.man) LV.man = [...(ch.maniobras || [])];
  LV.cupoMan = cupoManiobras(d);
  if (LV.cupoMan && (LV.cupoMan > cupoManiobras(ch) || LV.man.length < LV.cupoMan)) steps.push('maniobras');
  // Habilidades nuevas: dote (Habilidoso…), subclase (Bendiciones del conocimiento…) o multiclase, y las pericias que ganas
  const cuenta = xs => xs.reduce((m, f) => m.set(f.nombre, (m.get(f.nombre) || 0) + 1), new Map()), antes = cuenta(fuentesExtra(ch)), vistas = new Map();
  LV.fuentes = fuentesExtra(d).map(f => { const k = (vistas.get(f.nombre) || 0) + 1; vistas.set(f.nombre, k); return { ...f, clave: `${f.nombre}#${k}`, nueva: k > (antes.get(f.nombre) || 0) }; }).filter(f => f.nueva);
  LV.nPer = Math.max(0, periciasDisponibles(d) - periciasDisponibles(ch) - LV.fuentes.filter(f => f.pericia).reduce((n, f) => n + f.n, 0));
  // Lo que quedó sin elegir en niveles anteriores (por ejemplo, una subclase elegida antes de que la app lo pidiera): opcional
  const r0 = repartoHabilidades(ch), listaPend = [...new Set(r0.extra.fuentes.filter(f => !f.fijas).flatMap(f => f.lista))];
  if (r0.extra.faltan && listaPend.length) LV.fuentes.unshift({ nombre: 'Competencias que te faltan', n: r0.extra.faltan, lista: listaPend, clave: 'pendientes#1', opcional: true,
    nota: `Te las dan ${joinY(r0.extra.fuentes.filter(f => !f.fijas).map(f => f.nombre))} y aún no las has marcado.` });
  LV.perPend = r0.pericia.faltan; LV.nPer += LV.perPend;
  for (const k of Object.keys(LV.habSel)) if (!LV.fuentes.some(f => f.clave === k)) delete LV.habSel[k];
  { const hab = habTras(); LV.perSel = LV.perSel.filter(k => hab[k] === 1).slice(0, LV.nPer); }
  if (LV.fuentes.length || LV.nPer) steps.push('habilidades');
  const alt = esAlternativa(LV.estilo?.nuevo || '');
  const vista = vistaClase(d, { clase: o.clase, subclase: LV.subclase, nivel: to }), sch = savantSchool(vista);
  Object.assign(LV, { A, B, d, sch,
    o, vista, lista: listaDe(o.clase, LV.subclase),
    nLibro: o.clase === 'Mago' ? (to === 1 ? 6 : 2) : 0,
    nSavant: !sch ? 0 : (to === 3 ? 2 : (B.maxSlot > A.maxSlot ? 1 : 0)),
    savantMax: to === 3 ? 2 : B.maxSlot, savantExact: to !== 3,
    nPrep: (B.c && o.clase !== 'Mago') ? Math.max(0, B.maxPrep - A.maxPrep) : 0,
    nTrucos: Math.max(0, B.maxCant - A.maxCant) });
  LV.nEstTrucos = alt ? 2 : 0; LV.estLista = alt?.lista || '';
  if (LV.nEstTrucos) steps.push('estiloTrucos');
  // La dote elegida da conjuros (Iniciado en la magia, Influencia feérica…)
  const pd = /^(.+?)\s*(?:\(([^)]+)\))?\s*$/.exec(LV.asi.modo === 'dote' && steps.includes('mejora') ? LV.asi.dote || '' : '');
  LV.doteConj = pd && pd[1] ? conjurosDeDote({ nombre: pd[1], detalle: pd[2] || '' }) : null;
  if (LV.doteConj) { for (const e of LV.doteConj.elegir) LV[`dc:${e.k}`] = (LV[`dc:${e.k}`] || []).slice(0, e.n); steps.push('doteConj'); }
  if (LV.nSavant) steps.push('experto');
  if (LV.nLibro) steps.push('libro');
  if (LV.nPrep) steps.push('preparados');
  if (LV.nTrucos) steps.push('trucos');
  steps.push('confirmar');
  LV.steps = steps;
  LV.estTrucos = LV.estTrucos.slice(0, LV.nEstTrucos); LV.libro = LV.libro.slice(0, LV.nLibro); LV.savant = LV.savant.slice(0, LV.nSavant); LV.prep = LV.prep.slice(0, LV.nPrep); LV.trucos = LV.trucos.slice(0, LV.nTrucos);
}
export function openLevelUp() {
  const ch = S.cur(); if (!ch || nivelTotal(ch) >= 20) return;
  LV = { orden: '', id: ch.id, i: 0, elegirClase: (ch.multiclase || []).length > 0, libro: [], savant: [], prep: [], trucos: [], estTrucos: [], estilo: { nuevo: '', quitar: '' }, q: {}, habSel: {}, perSel: [], variante: '', man: null };
  elegirClase(ch.clase);
  render(); openSheet(dlg());
}
function elegirClase(clase) {
  LV.clase = clase; const o = objetivo();
  Object.assign(LV, { orden: '', to: o.nivel + 1, subclase: o.subclase || '', maes: null, asi: { modo: o.nivel + 1 === 19 ? 'dote' : 'dos', a: '', b: '', c: '', dote: '' }, libro: [], savant: [], prep: [], trucos: [], estTrucos: [], estilo: { nuevo: '', quitar: '' }, habSel: {}, perSel: [], variante: '', man: null });
}
function chooser(key, n, filterFn, hint) {
  const chosen = LV[key] ||= [], others = new Set(['libro', 'savant', 'prep', 'trucos', 'estTrucos', ...Object.keys(LV).filter(k => k.startsWith('dc:'))].filter(k => k !== key).flatMap(k => LV[k] || []));
  const have = new Set(char().book.map(e => 'c:' + e.sid)), q = norm(LV.q[key] || '');
  const items = allSpellItems(S.db).filter(it => !have.has(it.id) && !others.has(it.id) && filterFn(it) && (!q || norm(it.es).includes(q) || norm(it.en).includes(q)))
    .sort((a, b) => (chosen.includes(b.id) - chosen.includes(a.id)) || b.l - a.l || a.es.localeCompare(b.es, 'es'));
  const full = chosen.length >= n;
  return `<div class="chooser"><div class="ch-head"><span>${hint}</span><b class="ch-count ${full ? 'ok' : ''}">${chosen.length} de ${n}</b></div>
    <input type="search" data-chq="${key}" placeholder="Buscar" value="${esc(LV.q[key] || '')}" aria-label="Buscar conjuro">
    <div>${items.length ? items.map(it => { const onx = chosen.includes(it.id);
      return `<div class="pitem ${onx ? 'on' : ''}"><label class="pmain"><input type="checkbox" data-chk="${key}" value="${esc(it.id)}" ${onx ? 'checked' : ''} ${!onx && full ? 'disabled' : ''}>
        <span class="pl">${it.l}</span><span><span class="pn">${esc(it.es)}</span><span class="pm">${itemMeta(it)}</span></span></label>
        <button type="button" class="pview" data-lvview="${esc(it.id)}">Ver</button></div>`; }).join('')
      : '<p class="pempty">No hay conjuros que encajen. Si falta alguno de otro manual, créalo después con «Añadir conjuro».</p>'}</div></div>`;
}
function names(key) { const all = allSpellItems(S.db); return (LV[key] || []).map(id => all.find(i => i.id === id)?.es).filter(Boolean); }
function render() {
  plan();
  const ch = char(), step = LV.steps[LV.i], { A, B, d, to } = { ...LV, to: LV.to };
  const total = nivelTotal(ch), o = LV.o, multi = LV.elegirClase || !o.principal;
  $('#lvTitle').textContent = `${ch.nombre} sube a nivel ${total + 1}`;
  $('#lvSub').textContent = `Paso ${LV.i + 1} de ${LV.steps.length}: ${TITLE[step]}`;
  $('#lvSteps').innerHTML = LV.steps.map((s, i) => `<i class="${i < LV.i ? 'done' : i === LV.i ? 'now' : ''}"></i>`).join('');
  let h = '';
  if (step === 'clase') {
    const mias = clasesDe(ch), nuevas = Object.keys(CLASES).filter(k => !mias.some(c => c.clase === k));
    const req = k => (REQ_MULTICLASE[k] || []).filter(alts => !alts.some(a => (ch.stats[a] || 0) >= 13)).map(alts => alts.map(a => ABIL_NAME[a]).join(' o ') + ' 13');
    h = `<p class="note">Subes un nivel de personaje en una de tus clases o empiezas una nueva (multiclase). Los rasgos, recursos y conjuros de cada clase van a su propio nivel.</p>
      <div class="opts">${mias.map(c => `<button type="button" data-lvclase="${esc(c.clase)}" aria-pressed="${LV.clase === c.clase}">${esc(c.clase)} ${c.nivel} → ${c.nivel + 1}${c.subclase ? `<small>${esc(c.subclase)}</small>` : ''}</button>`).join('')}</div>
      <div class="f wide" style="margin-top:14px"><span>O empieza una clase nueva</span>${campoClase('id="lvNueva" aria-label="Clase nueva"', nuevas.includes(LV.clase) ? LV.clase : '', nuevas, 'Elige una clase')}
      <span class="hint">Para la multiclase, el manual pide 13 en la característica principal de cada clase. La app lo avisa pero no lo impide: tu mesa decide.</span></div>
      ${LV.clase && !mias.some(c => c.clase === LV.clase) ? `${req(LV.clase).length ? `<p class="note warn-txt">${esc(LV.clase)} pide ${esc(req(LV.clase).join(', '))} para la multiclase.</p>` : ''}
        <button type="button" class="ghost" data-verclase="${esc(LV.clase)}">${gi('libro')}Ver qué aprende ${esc(LV.clase)}</button>` : ''}`;
  }
  if (step === 'resumen') {
    const feats = featuresAt(LV.vista, { subclase: LV.subclase }, to), diff = levelDiff(A, B, ch, d), auto = conjurosPendientes(S.db, d, compendio()).map(c => c.x.es);
    h = `<div class="lv-big" aria-hidden="true"><span>${total}</span><i>→</i><b>${total + 1}</b></div><div class="fsum"><p><b>${esc(o.clase)}, nivel ${to}${multi ? ` (nivel de personaje ${total + 1})` : ''}.</b> Competencia ${sgn(B.pb)}${B.pb > A.pb ? ' (sube)' : ''}.</p>
      ${diff ? `<p>${esc(diff.replace(/^Al subir de nivel gana: /, 'Ganas: '))}</p>` : '<p>Sin cambios en espacios, preparados ni trucos.</p>'}
      ${feats.length ? `<p>Rasgos de este nivel: ${esc(joinY(feats))}.</p>` : ''}
      ${auto.length ? `<p>Siempre preparados desde ahora: ${esc(joinY(auto))}.</p>` : ''}</div>
      <p class="note">Puntos de golpe: suma la media o tira el dado de golpe, como indique tu DJ; esta app no los lleva. La progresión completa está en Rasgos.</p>
      <p class="note">Los siguientes pasos te piden solo lo que cambia. Nada se guarda hasta el último.</p>
      ${LV.elegirClase ? '' : `<button type="button" class="ghost" data-lvmulti>${'¿Multiclase? Subir en otra clase'}</button>`}`;
  }
  if (step === 'orden') {
    const def = ORDENES[o.clase];
    h = `<p class="note">${esc(o.clase)} empieza con el rasgo ${esc(def.rasgo)}: elige a qué función te consagras.</p>
      <div class="lv-estilos">${def.opciones.map(x => `<button type="button" class="lv-estilo ${LV.orden === x.nombre ? 'on' : ''}" data-lvorden="${esc(x.nombre)}" aria-pressed="${LV.orden === x.nombre}">
        <span class="lv-estilo-ico">${gi(x.marciales ? 'ca' : 'libro')}</span><b>${esc(x.nombre)}</b><span class="sp-text">${esc(x.texto)}</span></button>`).join('')}</div>`;
  }
  if (step === 'subclase') {
    h = `<p class="note">A nivel 3 eliges la subclase. Puedes escribir otra si tu mesa usa más manuales.</p>
      <div class="scp-grid" role="listbox" aria-label="Subclases de ${esc(o.clase)}">${tarjetasSubclase(o.clase, LV.subclase, 'data-lvsub')}</div>
      <label class="f wide" style="margin-top:14px">Subclase<input id="lvSubIn" value="${esc(LV.subclase)}" autocomplete="off"></label>`;
  }
  if (step === 'mejora') {
    const a = LV.asi, sel = (id, v, skip) => `<select id="${id}"><option value="">Elige</option>${ABILS.filter(([k]) => k !== skip).map(([k, n]) => `<option value="${k}" ${v === k ? 'selected' : ''} ${ch.stats[k] >= 20 ? 'disabled' : ''}>${n} (${ch.stats[k]})</option>`).join('')}</select>`;
    h = `<p class="note">${to === 19 ? 'A nivel 19 ganas un Don épico (una dote especial). ' : ''}La mejora de característica es una dote: +2 a una o +1 a dos, sin pasar de 20. También puedes elegir otra dote.</p>
      <div class="radios">
        <label class="chk-line"><input type="radio" name="lvasi" value="dos" ${a.modo === 'dos' ? 'checked' : ''}> +2 a una característica</label>${a.modo === 'dos' ? `<div class="frow">${sel('lvA', a.a)}</div>` : ''}
        <label class="chk-line"><input type="radio" name="lvasi" value="uno" ${a.modo === 'uno' ? 'checked' : ''}> +1 a dos características</label>${a.modo === 'uno' ? `<div class="frow">${sel('lvA', a.a)}${sel('lvB', a.b, a.a)}</div>` : ''}
        <label class="chk-line"><input type="radio" name="lvasi" value="dote" ${a.modo === 'dote' ? 'checked' : ''}> ${to === 19 ? 'Don épico u otra dote' : 'Otra dote'}</label>
        ${a.modo === 'dote' ? `<div class="f wide"><span>Dote</span>${campoElegible('id="lvDote" aria-label="Nombre de la dote"', a.dote, 'dote', 'dote', 'Por ejemplo, Iniciado en la magia')}${(() => {
          if (!a.dote) return ''; const ops = aumentosDote(a.dote), x = doteLib(a.dote), falta = x ? faltaRequisito(x.req, draft()) : '';
          const tope = topeDote(a.dote), lista = (ops || ABILS.map(([k]) => k)).map(k => `<option value="${k}" ${a.c === k ? 'selected' : ''} ${ch.stats[k] >= tope ? 'disabled' : ''}>${ABIL_NAME[k]} (${ch.stats[k]} → ${Math.min(tope, ch.stats[k] + 1)})</option>`).join('');
          return `${falta ? `<p class="note warn-txt">${esc(falta)}</p>` : ''}<label class="f lv-aum">${ops ? `${esc(x.nombre)} sube en 1 una característica. ¿Cuál?` : 'Si la dote sube una característica, elige cuál (+1)'}<select id="lvC"><option value="">${ops ? 'Elige' : 'Ninguna'}</option>${lista}</select></label>`; })()}<span class="hint">Aparecerá en «En juego». Si da conjuros o cambia características, añádelos luego en la ficha y en la hoja.</span></div>` : ''}
      </div>${B.apKey && B.mod !== A.mod ? `<div class="fsum" style="margin-top:14px">Tu ${ABIL_NAME[B.apKey]} pasa a ${sgn(B.mod)}: CD ${B.cd} y ataque ${sgn(B.atk)}.</div>` : ''}`;
  }
  if (step === 'estilo') {
    const e = LV.estilo, ops = opcionesEstilo(ch, biblioteca().dotes, o.clase), cambia = !LV.estiloGana;
    h = `<p class="note">${cambia ? `Cada vez que subes de nivel en ${esc(o.clase.toLowerCase())} puedes cambiar tu dote de estilo de combate por otra. Es opcional.` : `A nivel ${to}, ${esc(o.clase.toLowerCase())} gana el rasgo Estilo de combate: eliges una dote de estilo de combate.${ALTERNATIVAS[o.clase] ? ` También puedes elegir ${esc(ALTERNATIVAS[o.clase].nombre)} y aprender dos trucos.` : ''}`}</p>
      ${cambia ? `<div class="opts lv-estilo-q">${LV.estiloSuyos.map(n => `<button type="button" data-lvquitar="${esc(n)}" aria-pressed="${e.quitar === n}">Cambiar ${esc(n)}</button>`).join('')}<button type="button" data-lvquitar="" aria-pressed="${!e.quitar}">Mantener mi estilo</button></div>` : ''}
      ${!cambia || e.quitar ? `<div class="lv-estilos">${ops.map(x => { const on = e.nuevo === x.nombre, bloq = x.ya && x.nombre !== e.quitar;
        return `<button type="button" class="lv-estilo ${on ? 'on' : ''} ${x.alternativa ? 'alt' : ''}" data-lvestilo="${esc(x.nombre)}" aria-pressed="${on}" ${bloq ? 'disabled' : ''}>
          <span class="lv-estilo-ico">${gi(x.alternativa ? 'libro' : 'ca')}</span><b>${esc(x.nombre)}${bloq ? ' <small>la tienes</small>' : ''}</b><span class="sp-text">${mdPlano(x.texto)}</span></button>`; }).join('')}</div>` : ''}`;
  }
  if (step === 'variante') {
    const def = VARIANTES[o.clase];
    h = `<p class="note">${to === def.nivel ? `A nivel ${def.nivel}, ${esc(o.clase.toLowerCase())} gana ${esc(def.rasgo)}` : `Aún no has elegido cómo funciona tu ${esc(def.rasgo)}`}: elige una de sus dos variantes. La mejora de nivel ${def.mejora} sigue a la que elijas.</p>
      <div class="lv-estilos">${def.opciones.map(x => `<button type="button" class="lv-estilo ${LV.variante === x.nombre ? 'on' : ''}" data-lvvar="${esc(x.nombre)}" aria-pressed="${LV.variante === x.nombre}">
        <span class="lv-estilo-ico">${gi(x.ef === 'golpe' ? 'ca' : 'libro')}</span><b>${esc(x.nombre)}</b><span class="sp-text">${esc(x.texto)}</span></button>`).join('')}</div>`;
  }
  if (step === 'maniobras') {
    const nuevas = LV.cupoMan - (char().maniobras || []).length;
    h = `<p class="note">${nuevas > 0 ? `Supremacía en combate: aprendes ${nuevas} ${nuevas === 1 ? 'maniobra' : 'maniobras'}${(char().maniobras || []).length ? ' más' : ''}.` : 'Elige tus maniobras.'} Cada vez que subes de nivel en guerrero también puedes cambiar una de las que conoces por otra.</p>`
      + maniobrasHtml(LV.man, { attr: 'data-lvman', cupo: LV.cupoMan });
  }
  if (step === 'habilidades') {
    let hab = { ...(ch.habilidades || {}) };
    h = `<p class="note">Lo que ganas a este nivel te da competencias: elígelas aquí y quedan marcadas en tu ficha.</p>`
      + LV.fuentes.map(f => { const x = fuenteHtml(f, { hab, sel: LV.habSel[f.clave] || [], attr: `data-lvhf="${esc(f.clave)}" data-lvhab` }); hab = aplicarFuente(hab, f, LV.habSel[f.clave] || []); return x; }).join('')
      + (LV.nPer ? periciaHtml(LV.nPer, { hab, sel: LV.perSel, attr: 'data-lvper' }) : '');
  }
  if (step === 'maestria') h = `<p class="note">${esc(o.clase)} ${to === 1 ? 'te da' : 'amplía'} la Maestría con armas: ahora dominas ${LV.cupoMaes} ${LV.cupoMaes === 1 ? 'arma' : 'armas'}. Elige ${LV.cupoMaes - LV.maes.length > 0 ? `${LV.cupoMaes - LV.maes.length} más` : 'las que quieras cambiar'}.</p>`
    + maestriasHtml(d, LV.maes, { attr: 'data-lvmaes', cupo: LV.cupoMaes, destacar: (ch.equipo?.objetos || []).filter(x => x.arma).map(x => x.nombre) });
  if (step === 'doteConj') {
    const dc = LV.doteConj;
    h = dc.elegir.map(e => chooser(`dc:${e.k}`, e.n, filtroEleccion(e), `${esc(dc.fuente)}: ${e.nivel ? `${e.n === 1 ? 'un conjuro' : `${e.n} conjuros`} de nivel ${e.nivel}${e.escuelas ? ` de ${e.escuelas.join(' o ').toLowerCase()}` : e.lista ? ` de ${e.lista.toLowerCase()}` : ''}` : `${e.n} trucos de ${(e.lista || '').toLowerCase()}`}. Siempre preparados; el de nivel 1 lo lanzas una vez sin espacio por descanso largo.`)).join('')
      + (dc.fijos.length ? `<p class="note">Además tienes siempre preparado: ${esc(joinY(dc.fijos))}.</p>` : '');
  }
  if (step === 'estiloTrucos') h = chooser('estTrucos', LV.nEstTrucos, it => it.l === 0 && listFilter(it, LV.estLista), `${esc(LV.estilo.nuevo)}: aprendes dos trucos de ${LV.estLista.toLowerCase()}. Cuentan como conjuros de ${o.clase.toLowerCase()} y no ocupan preparados.`);
  const escL = LV.sch.toLowerCase();
  if (step === 'experto') h = chooser('savant', LV.nSavant, it => it.l > 0 && (LV.savantExact ? it.l === LV.savantMax : it.l <= LV.savantMax) && it.esc === LV.sch && listFilter(it, 'Mago'),
    to === 3 ? `Experto en ${escL}: 2 conjuros de mago de ${escL}, de nivel 2 o inferior, gratis.` : `Experto en ${escL}: acabas de acceder a espacios de nivel ${LV.savantMax}; añade gratis un conjuro de ${escL} de ese nivel.`);
  if (step === 'libro') h = chooser('libro', LV.nLibro, it => it.l > 0 && it.l <= B.maxSlot && listFilter(it, 'Mago'), (to === 1 ? `Tu libro de conjuros empieza con 6 conjuros de mago de nivel 1.` : `Cada nivel de mago añade 2 conjuros de mago al libro, de nivel ${B.maxSlot} o inferior.`));
  const lista = LV.lista || B.lista;
  if (step === 'preparados') h = chooser('prep', LV.nPrep, it => it.l > 0 && it.l <= B.maxSlot && listFilter(it, lista), `Ahora preparas ${B.maxPrep} conjuros (antes ${A.maxPrep}). Elige los nuevos de la lista de ${lista.toLowerCase()}, de nivel ${B.maxSlot} o inferior. Es opcional.`);
  if (step === 'trucos') h = chooser('trucos', LV.nTrucos, it => it.l === 0 && listFilter(it, lista), `Aprendes ${LV.nTrucos === 1 ? 'un truco nuevo' : LV.nTrucos + ' trucos nuevos'} de la lista de ${(lista || o.clase).toLowerCase()}.`);
  if (step === 'confirmar') {
    const L = [multi ? `${o.clase} ${o.nivel} → ${to} (nivel de personaje ${total + 1}).` : `Nivel ${ch.nivel} → ${to}.`];
    if (LV.subclase !== (o.subclase || '')) L.push(`Subclase: ${LV.subclase || 'ninguna'}.`);
    if (LV.steps.includes('mejora')) {
      const a = LV.asi;
      if (a.modo === 'dote') L.push(a.dote ? `Dote: ${a.dote}${a.c ? ` (${ABIL_NAME[a.c]} ${ch.stats[a.c]} → ${d.stats[a.c]})` : ''}.` : 'Dote sin nombre: puedes anotarla después en la ficha.');
      else { const bits = ABILS.filter(([k]) => d.stats[k] !== ch.stats[k]).map(([k, n]) => `${n} ${ch.stats[k]} → ${d.stats[k]}`); L.push(bits.length ? `Mejora de característica: ${bits.join(', ')}.` : 'Mejora de característica sin elegir.'); }
    }
    if (LV.steps.includes('maestria')) L.push(`Maestría con armas: ${LV.maes.length ? LV.maes.join(', ') : 'sin elegir'}.`);
    if (LV.orden) L.push(`${ORDENES[o.clase].rasgo}: ${LV.orden}.`);
    if (to === 20 && CUMBRE[o.clase]) L.push(`${o.clase === 'Bárbaro' ? 'Campeón primordial' : 'Cuerpo y mente'}: ${CUMBRE[o.clase].map(k => `${ABIL_NAME[k]} ${ch.stats[k]} → ${d.stats[k]}`).join(', ')}.`);
    if (LV.variante && LV.steps.includes('variante')) L.push(`${VARIANTES[o.clase].rasgo}: ${LV.variante}.`);
    if (LV.steps.includes('maniobras')) L.push(`Maniobras: ${LV.man.length ? LV.man.join(', ') : 'sin elegir'}.`);
    if (LV.steps.includes('habilidades')) { const nuevas = nuevasHabilidades(); if (nuevas) L.push(nuevas); }
    if (LV.estilo.nuevo) L.push(`Estilo de combate: ${LV.estilo.quitar ? `${LV.estilo.quitar} → ` : ''}${LV.estilo.nuevo}.`);
    if (LV.estTrucos.length) L.push(`Trucos de ${LV.estilo.nuevo}: ${names('estTrucos').join(', ')}.`);
    if (LV.libro.length) L.push(`Al libro: ${names('libro').join(', ')}.`);
    if (LV.savant.length) L.push(`Gratis por Experto en ${escL}: ${names('savant').join(', ')}.`);
    if (LV.prep.length) L.push(`Nuevos preparados: ${names('prep').join(', ')}.`);
    if (LV.trucos.length) L.push(`Trucos: ${names('trucos').join(', ')}.`);
    if (LV.doteConj) L.push(`Conjuros de ${LV.doteConj.fuente}: ${[...LV.doteConj.elegir.flatMap(e => names(`dc:${e.k}`)), ...LV.doteConj.fijos].join(', ') || 'sin elegir'}.`);
    const pend = []; if (LV.libro.length < LV.nLibro) pend.push(`${LV.nLibro - LV.libro.length} conjuro(s) de libro`); if (LV.savant.length < LV.nSavant) pend.push(`${LV.nSavant - LV.savant.length} de Experto`); if (LV.trucos.length < LV.nTrucos) pend.push(`${LV.nTrucos - LV.trucos.length} truco(s)`);
    h = `<div class="fsum">${L.map(t => `<p>${esc(t)}</p>`).join('')}</div>
      ${pend.length ? `<p class="note">Quedan por elegir: ${esc(pend.join(', '))}. Puedes añadirlos más tarde desde «Añadir conjuro».</p>` : ''}
      ${o.clase === 'Mago' && B.maxPrep > A.maxPrep ? `<p class="note">Ahora preparas ${B.maxPrep}: los conjuros nuevos del libro quedan preparados mientras quepan; los cambias con ◆ en la hoja.</p>` : ''}
      ${cambiosHtml(o.nueva ? [] : nivelCambia(d, o.clase, biblioteca().trasfondos))}
      <p class="note">Todo queda anotado en «Dotes y notas» de la ficha, y se puede deshacer.</p>`;
  }
  $('#lvBody').innerHTML = h;
  $('#lvBack').hidden = LV.i === 0;
  $('#lvNext').textContent = LV.i === LV.steps.length - 1 ? `Subir a nivel ${total + 1}` : 'Siguiente';
}
function habilidadesFinales() {
  const hab = habTras();
  for (const k of LV.perSel) if (hab[k] === 1) hab[k] = 2;
  return hab;
}
function nuevasHabilidades() {
  const antes = char().habilidades || {}, hab = habilidadesFinales();
  const comp = Object.keys(hab).filter(k => hab[k] >= 1 && !(antes[k] >= 1)), per = Object.keys(hab).filter(k => hab[k] === 2 && antes[k] !== 2);
  const n = k => HAB_NOMBRE[k] || k, bits = [];
  if (comp.length) bits.push(`competencia en ${joinY(comp.map(n))}`);
  if (per.length) bits.push(`pericia en ${joinY(per.map(n))}`);
  return bits.length ? `Habilidades: ${bits.join('; ')}.` : '';
}
function apply() {
  const ch = char(), d = draft(), to = LV.to, o = objetivo(), notes = [], total = nivelTotal(ch) + 1;
  if (!o.principal) notes.push(o.nueva ? `multiclase: ${o.clase} 1` : `${o.clase} ${to}`);
  if (LV.subclase !== (o.subclase || '')) notes.push(`subclase ${LV.subclase}`);
  if (LV.estilo.nuevo) notes.push(`estilo de combate ${LV.estilo.quitar ? `${LV.estilo.quitar} → ` : ''}${LV.estilo.nuevo}`);
  if (LV.steps.includes('mejora')) {
    if (LV.asi.modo === 'dote') { if (LV.asi.dote) notes.push(`dote ${LV.asi.dote}${LV.asi.c ? ` (+1 ${ABIL_NAME[LV.asi.c]})` : ''}`); }
    else { const bits = ABILS.filter(([k]) => d.stats[k] !== ch.stats[k]).map(([k, n]) => `${n} +${d.stats[k] - ch.stats[k]}`); if (bits.length) notes.push(`mejora de característica (${bits.join(', ')})`); }
  }
  const B = perfil(d), all = allSpellItems(S.db), picks = { libro: LV.libro, savant: LV.savant, prep: LV.prep, trucos: LV.trucos }, sch = LV.sch;
  const h = S.act(`Sube a nivel ${total}${notes.length ? ': ' + notes.join('; ') : ''}`, (db, c) => {
    const add = (ids, rel) => ids.forEach(id => { const it = all.find(x => x.id === id); if (!it) return; const sid = itemToSid(db, it);
      if (!c.book.some(e => e.sid === sid)) c.book.push({ sid, prep: false, always: false, gratis: '', used: false, ...rel }); });
    add(LV.estTrucos, { fuente: LV.estilo.nuevo, always: true, prep: true });
    if (LV.doteConj) { const dc = LV.doteConj;
      for (const e of dc.elegir) add(LV[`dc:${e.k}`] || [], { fuente: dc.fuente, always: true, prep: true });
      for (const n of dc.fijos) { const it = all.find(x => norm(x.es) === norm(n)); if (it) add([it.id], { fuente: dc.fuente, always: true, prep: true }); } }
    if (LV.estilo.nuevo) c.dotes = d.dotes;
    if (LV.steps.includes('maestria')) c.maestrias = [...LV.maes];
    // El mago prepara del libro: los conjuros nuevos quedan preparados mientras haya hueco
    const huecos = () => B.maxPrep - c.book.filter(e => e.prep && !e.always && (db.catalog[e.sid]?.level || 0) > 0).length;
    for (const id of picks.libro) add([id], { fuente: 'Libro', prep: o.clase === 'Mago' && huecos() > 0 });
    add(picks.savant, { fuente: `Experto en ${sch.toLowerCase()}` });
    add(picks.prep, { fuente: B.listaNombre, prep: true });
    add(picks.trucos, { fuente: `${LV.lista ? (LV.lista === 'Mago' && o.clase !== 'Mago' ? B.listaNombre : o.clase) : (B.listaNombre || c.clase)} (nivel ${to})` });
    c.nivel = d.nivel; c.subclase = d.subclase; c.multiclase = d.multiclase || []; c.stats = d.stats;
    const dote = LV.asi.dote && conDetalle(LV.asi.dote, LV.asi.c);
    if (LV.steps.includes('mejora') && LV.asi.modo === 'dote' && dote && !(c.dotes || []).includes(dote)) c.dotes = [...(c.dotes || []), dote];
    if (LV.orden) c.ordenes = d.ordenes;
    if (LV.variante && LV.steps.includes('variante')) { c.variantes = { ...(c.variantes || {}), [o.clase]: LV.variante }; notes.push(`${VARIANTES[o.clase].rasgo}: ${LV.variante}`); }
    if (LV.steps.includes('maniobras')) { c.maniobras = [...LV.man]; if (LV.man.length) notes.push(`maniobras ${LV.man.join(', ')}`); }
    if (LV.steps.includes('habilidades')) { const txt = nuevasHabilidades(); c.habilidades = habilidadesFinales(); if (txt) notes.push(txt.replace(/\.$/, '').replace(/^./, x => x.toLowerCase())); }
    if (to === 20 && CUMBRE[o.clase]) notes.push(o.clase === 'Bárbaro' ? 'Campeón primordial (+4 Fuerza y Constitución)' : 'Cuerpo y mente (+4 Destreza y Sabiduría)');
    const auto = anadirPendientes(db, c, conjurosPendientes(db, c, compendio()));
    if (auto.length) notes.push(`siempre preparados ${auto.join(', ')}`);
    if (notes.length) c.notas = `${(c.notas || '').trim()}\nNivel ${total}: ${notes.join('; ')}.`.trim();
  });
  closeSheet(dlg()); window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => { ascend($('#hero h1')); haptic('heavy'); }, 260);
  toast(`<b>${esc(ch.nombre)}</b> ya es nivel ${total}${o.principal ? '' : ` (${esc(o.clase)} ${to})`}.`, [undoBtn(S, h)]);
}

export function init(store) {
  S = store; initSubclases();
  const body = $('#lvBody');
  on(body, 'click', '[data-elegir="dote"]', async (e, b) => { const inp = b.closest('.elg').querySelector('input'), v = await elegirDote(draft(false), { titulo: LV.to === 19 ? 'Don épico u otra dote' : 'Elegir dote', grupoInicial: LV.to === 19 ? 'Dones épicos' : 'Dotes generales', excluirOrigen: false }); if (v != null) ponerValor(inp, v); });
  body.addEventListener('input', ev => {
    const t = ev.target;
    if (t.dataset.chq) { LV.q[t.dataset.chq] = t.value; const pos = t.selectionStart; render(); const n = body.querySelector(`[data-chq="${t.dataset.chq}"]`); n?.focus(); n?.setSelectionRange(pos, pos); return; }
    if (t.id === 'lvSubIn') { LV.subclase = t.value.trim(); body.querySelectorAll('[data-lvsub]').forEach(b => { b.classList.toggle('on', b.dataset.lvsub === LV.subclase); b.setAttribute('aria-selected', b.dataset.lvsub === LV.subclase); }); plan();
      $('#lvSub').textContent = `Paso ${LV.i + 1} de ${LV.steps.length}: ${TITLE[LV.steps[LV.i]]}`; return; }
    if (t.id === 'lvDote') LV.asi.dote = t.value.trim();
  });
  body.addEventListener('change', ev => {
    const t = ev.target;
    if (t.name === 'lvasi') { LV.asi = { ...LV.asi, modo: t.value, a: '', b: '', c: '' }; return render(); }
    if (t.id === 'lvA') { LV.asi.a = t.value; if (LV.asi.b === t.value) LV.asi.b = ''; return render(); }
    if (t.id === 'lvB') { LV.asi.b = t.value; return render(); }
    if (t.id === 'lvC') { LV.asi.c = t.value; return render(); }
    if (t.id === 'lvDote') { LV.asi.dote = t.value.trim(); const ops = aumentosDote(LV.asi.dote); LV.asi.c = ops?.length === 1 ? ops[0] : ''; return render(); }
    if (t.dataset.chk) { const k = t.dataset.chk; LV[k] ||= []; LV[k] = t.checked ? [...new Set([...LV[k], t.value])] : LV[k].filter(x => x !== t.value);
      const y = body.scrollTop; render(); body.scrollTop = y; haptic(); }
  });
  on(body, 'click', '[data-lvmaes]', (ev, b) => { LV.maes = alternarMaes(LV.maes, b.dataset.lvmaes, LV.cupoMaes); const y = body.scrollTop; render(); body.scrollTop = y; haptic(); });
  on(body, 'click', '[data-lvestilo]', (ev, b) => { LV.estilo.nuevo = LV.estilo.nuevo === b.dataset.lvestilo ? '' : b.dataset.lvestilo; LV.estTrucos = []; const y = body.scrollTop; render(); body.scrollTop = y; haptic(); });
  on(body, 'click', '[data-lvquitar]', (ev, b) => { LV.estilo = { nuevo: '', quitar: b.dataset.lvquitar }; LV.estTrucos = []; render(); });
  on(body, 'click', '[data-lvclase]', (ev, b) => { elegirClase(b.dataset.lvclase); render(); });
  const repinta = () => { const y = body.scrollTop; render(); body.scrollTop = y; haptic(); };
  on(body, 'click', '[data-lvhab]', (ev, b) => { const f = LV.fuentes.find(x => x.clave === b.dataset.lvhf); if (!f) return; LV.habSel[f.clave] = alternarHab(LV.habSel[f.clave] || [], b.dataset.lvhab, f.n); repinta(); });
  on(body, 'click', '[data-lvper]', (ev, b) => { LV.perSel = alternarHab(LV.perSel, b.dataset.lvper, LV.nPer); repinta(); });
  on(body, 'click', '[data-lvvar]', (ev, b) => { LV.variante = b.dataset.lvvar; repinta(); });
  on(body, 'click', '[data-lvman]', (ev, b) => { LV.man = alternarManiobra(LV.man, b.dataset.lvman, LV.cupoMan); repinta(); });
  on(body, 'click', '[data-lvorden]', (ev, b) => { LV.orden = b.dataset.lvorden; render(); haptic(); });
  on(body, 'click', '[data-lvmulti]', () => { LV.elegirClase = true; LV.i = 0; render(); body.scrollTop = 0; });
  body.addEventListener('change', ev => { if (ev.target.id === 'lvNueva' && ev.target.value) { elegirClase(ev.target.value); render(); } });
  on(body, 'click', '[data-lvsub],[data-lvview]', (ev, b) => {
    if (b.dataset.lvsub) { LV.subclase = b.dataset.lvsub; return render(); }
    const it = allSpellItems(S.db).find(x => x.id === b.dataset.lvview); if (it) previewSpell(it);
  });
  $('#lvNext').addEventListener('click', () => {
    const step = LV.steps[LV.i];
    if (step === 'mejora' && LV.asi.modo !== 'dote' && !LV.asi.a) { toast('Elige qué característica mejora, o marca «Otra dote».'); return; }
    if (step === 'mejora' && LV.asi.modo === 'dote' && LV.asi.dote && aumentosDote(LV.asi.dote) && !LV.asi.c) { toast('Esa dote sube una característica: elige cuál.'); return; }
    if (step === 'clase' && !LV.clase) { toast('Elige la clase en la que subes.'); return; }
    if (step === 'subclase' && !LV.subclase) { toast('Elige tu subclase (o escribe la de otro manual).'); return; }
    if (step === 'variante' && !LV.variante) { toast(`Elige una variante de ${VARIANTES[LV.o.clase].rasgo}.`); return; }
    if (step === 'maniobras' && LV.man.length < LV.cupoMan) { const n = LV.cupoMan - LV.man.length; toast(`Elige ${n} ${n === 1 ? 'maniobra' : 'maniobras'} más.`); return; }
    if (step === 'habilidades') { const falta = faltaHabilidades(); if (falta) { toast(falta); return; } }
    if (step === 'orden' && !LV.orden) { toast(`Elige tu ${ORDENES[LV.o.clase].rasgo.toLowerCase()}.`); return; }
    if (step === 'maestria' && LV.maes.length < LV.cupoMaes) { toast(`Elige ${LV.cupoMaes - LV.maes.length} ${LV.cupoMaes - LV.maes.length === 1 ? 'arma' : 'armas'} más para tu maestría.`); return; }
    if (step === 'estilo' && LV.estiloGana && !LV.estilo.nuevo) { toast('Elige tu estilo de combate.'); return; }
    if (step === 'estilo' && LV.estilo.quitar && !LV.estilo.nuevo) { toast('Elige el estilo nuevo, o marca «Mantener mi estilo».'); return; }
    if (LV.i === LV.steps.length - 1) return apply();
    LV.i++; render(); body.scrollTop = 0;
  });
  $('#lvBack').addEventListener('click', () => { if (LV.i > 0) { LV.i--; render(); } });
}
