import { esc, joinY } from '../core/util.js';
import { perfil } from '../domain/reglas2024.js';
import { reglas, recState, schoolMatch, recuperarEnDescanso } from '../domain/rasgos.js';
import { firstFreeFrom, freeOf, isPrepared, schoolKey, slotsOf, usedOf } from '../ui/sheet.js';
import { toast } from '../ui/toast.js';
import { castFx, dawn, pop, schoolColor, slotFx } from '../ui/fx.js';
import { haptic } from '../platform/native.js';
import { pedir } from '../ui/modal.js';
import { manualFor, srdFor, tiradasConjuro, biblioteca } from '../domain/catalogo.js';
import { conObjetivos, nuevoEfecto, objetivosNuevos, terminarConc } from '../domain/concentracion.js';
import { tieneTiradas } from '../domain/tiradas.js';
import { openRoll } from '../ui/dialogs/tiradas.js';
import { descansoLargoVida, dadosDeGolpe, pgActuales, pgMaximo, vidaDe, ponerEfecto, soltarConc, cambiarConc } from '../domain/vida.js';
import { combateDe } from '../domain/combate.js';
import { golpe } from '../ui/golpes.js';
import { opcionesIntercambio, esHumano } from '../domain/intercambios.js';
import { efectosDe, efectoDeConjuro, fmtRondas } from '../domain/efectos.js';
import { avisar } from '../ui/dialogs/aviso.js';

export const undoBtn = (S, h) => ({ label: 'Deshacer', fn: () => S.undo(h) });
const row = bi => document.getElementById('sp-' + bi);

function castEffects(S, ch, P, s, mode, L) {
  let msg = ''; const extra = [];
  reglas(ch).filter(r => r.tipo === 'al_lanzar').forEach(r => {
    if (!schoolMatch(s, r.escuela)) return;
    if (r.soloEspacio && mode !== 'slot') return;
    if (r.espacioMin && (mode !== 'slot' || L < r.espacioMin)) return;
    if (r.efecto === 'recuperar') {
      if (mode !== 'slot') return;
      let x = 0; for (let k = Math.min(L - 1, r.efectoN || 5); k >= 1; k--) { if (usedOf(ch, P, k) > 0) { x = k; break; } }
      if (x) extra.push({ label: `${r.nombre}: recuperar nivel ${x}`, hl: true, fn: () => {
        const idx = freeOf(S.cur(), perfil(S.cur()), x);
        const h = S.act(`${r.nombre}: espacio de nivel ${x} recuperado`, (db, c) => { c.play.used[x] = usedOf(c, perfil(c), x) - 1; });
        slotFx(x, idx, 'ignite'); haptic();
        toast(`${esc(r.nombre)}: espacio de nivel ${x} recuperado.`, [undoBtn(S, h)]);
      } });
      else msg += ` ${esc(r.nombre)}: no hay espacios inferiores gastados.`;
    } else if (r.texto) msg += `<span class="tnote"><b>${esc(r.nombre)}.</b> ${esc(r.texto)}</span>`;
  });
  return { msg, extra };
}

export function cast(S, bi, mode, L) {
  const ch = S.cur(), e = ch.book[bi], s = S.db.catalog[e.sid], P = perfil(ch);
  let msg = '', snuffIdx = -1;
  if (mode === 'free') msg = `<b>${esc(s.es)}</b>: uso gratis gastado.`;
  else if (mode === 'ritual') msg = `<b>${esc(s.es)}</b> como ritual: sin espacio, 10 minutos más.`;
  else {
    const noLeft = freeOf(ch, P, s.level) === 0 && L !== s.level;
    snuffIdx = freeOf(ch, P, L) - 1;
    if (P.pact && L === P.pact.level) msg = `<b>${esc(s.es)}</b>: espacio de pacto gastado (nivel ${L}).`;
    else { msg = `<b>${esc(s.es)}</b>: espacio de nivel ${L} gastado.`;
      if (L > s.level) msg += ` <span style="opacity:.8">(${noLeft && slotsOf(P, s.level) ? 'no quedaban de nivel ' + s.level : 'potenciado'})</span>`; }
  }
  if (s.conc && ch.play.conc && ch.play.conc !== s.es) msg += ` Pierdes la concentración en ${esc(ch.play.conc)}.`;
  const fx = castEffects(S, ch, P, s, mode, L), ef = mode !== 'ritual' ? efectoDeConjuro(s.es) : null;
  const solo = ef && (ef.k === 'escudo' ? combateDe(ch).activo : ef.k === 'pasarsinrastro');
  let fuera = [];
  if (solo) msg += ` <span class="tnote"><b>${esc(ef.nombre)}</b> te afecta: ${esc(ef.texto.replace(/\.$/, ''))}${ef.dur ? ` (${esc(fmtRondas(ef.dur))})` : ''}.</span>`;
  const h = S.act(msg, (db, c) => {
    const ee = c.book[bi];
    if (mode === 'free') ee.used = true;
    if (mode === 'slot') c.play.used[L] = usedOf(c, P, L) + 1;
    if (s.conc) fuera = cambiarConc(c, s.es);
    if (solo) ponerEfecto(c, ef.k, { conc: s.conc ? s.es : '' });
  });
  if (fuera.length) msg += ` Terminan sobre ti: ${esc(joinY(fuera.map(e => e.nombre)))}.`;
  if (solo) setTimeout(() => golpe('buff'), 200);
  const extra = [...fx.extra];
  if (ef && !solo) extra.unshift({ label: ef.k === 'escudo' ? 'Aplicarme +5 CA' : 'Me lo aplico', hl: true, fn: () => aplicarmeConjuro(S, ef, s, mode === 'slot' ? L : s.level) });
  const x = srdFor(s), apunta = s.conc && conObjetivos(s, [manualFor(x)?.d, s.desc, x?.dEs, x?.d]);
  if (apunta && ch.play.pedirObjetivos) setTimeout(() => enfocarObjetivos('conc'), 420);
  else if (apunta) extra.unshift({ label: 'Anotar objetivos', hl: true, fn: () => enfocarObjetivos('conc') });
  if (mode === 'slot' && s.ritual && (isPrepared(e) || P.ritualLibro)) extra.push({ label: 'Era como ritual', fn: () => { S.undo(h); cast(S, bi, 'ritual'); } });
  castFx(row(bi), schoolColor(schoolKey(s.escuela)));
  if (snuffIdx >= 0) slotFx(L, snuffIdx, 'snuff');
  haptic();
  toast(msg + fx.msg, [...extra, undoBtn(S, h)]);
  if (mode !== 'ritual' && tieneTiradas(tiradasConjuro(s))) setTimeout(() => openRoll(bi, mode === 'slot' ? L : null), 350);
  return true;
}

function aplicarmeConjuro(S, ef, s, L) {
  const n = ef.maxPg ? 5 * Math.max(1, (L || 2) - 1) : 0;
  S.act(`${ef.nombre} sobre ti`, (db, c) => { ponerEfecto(c, ef.k, { conc: s.conc && c.play.conc === s.es ? s.es : '', n }); });
  golpe(n ? 'max' : 'buff', n || null, { max: pgMaximo(S.cur()) });
  haptic('light');
  toast(`<b>${esc(ef.nombre)}</b> sobre ti: ${esc(ef.texto)}${ef.dur ? ` Dura ${esc(fmtRondas(ef.dur))}${s.conc ? ' o hasta que pierdas la concentración' : ''}.` : ''}`);
}

export function quickCast(S, bi, force) {
  const ch = S.cur(), e = ch.book[bi], s = S.db.catalog[e.sid], P = perfil(ch);
  if (s.level === 0) {
    const fx = castEffects(S, ch, P, s, 'truco', 0);
    S.act(`${s.es} (truco)`, () => {});
    castFx(row(bi), schoolColor(schoolKey(s.escuela))); haptic();
    if (tieneTiradas(tiradasConjuro(s))) { openRoll(bi); if (fx.msg) toast(fx.msg.replace(/^\s+/, '')); return true; }
    toast(`<b>${esc(s.es)}</b> es un truco: a voluntad, no gasta espacio.${fx.msg}`); return true;
  }
  if (!force && !isPrepared(e)) {
    if (s.ritual && P.ritualLibro) return cast(S, bi, 'ritual');
    return toast(`<b>${esc(s.es)}</b> no está preparado.`, [{ label: 'Lanzar igualmente', fn: () => quickCast(S, bi, true) }]);
  }
  if (e.gratis && !e.used) return cast(S, bi, 'free');
  const L = firstFreeFrom(ch, P, s.level);
  if (L) return cast(S, bi, 'slot', L);
  if (s.ritual) return toast(`No quedan espacios de nivel ${s.level} o superior.`, [{ label: 'Lanzar como ritual', hl: true, fn: () => cast(S, bi, 'ritual') }]);
  toast(`No quedan espacios de nivel ${s.level} o superior para <b>${esc(s.es)}</b>.`);
}

export function toggleSlot(S, L, i) {
  const ch = S.cur(), P = perfil(ch), free = freeOf(ch, P, L), spend = i < free;
  const target = spend ? free - 1 : free;
  S.act(`Espacio de nivel ${L} ${spend ? 'gastado' : 'liberado'} a mano`, (db, c) => { c.play.used[L] = usedOf(c, P, L) + (spend ? 1 : -1); });
  slotFx(L, target, spend ? 'snuff' : 'ignite'); haptic();
}

export function endConc(S) {
  const c = S.cur().play.conc;
  let fuera = [];
  const h = S.act(`Termina la concentración en ${c}`, (db, ch) => { fuera = soltarConc(ch); });
  toast(`Concentración en ${esc(c)} terminada.${fuera.length ? ` Terminan sobre ti: ${esc(joinY(fuera.map(e => e.nombre)))}.` : ''}`, [undoBtn(S, h)]);
}

export function enfocarObjetivos(clave) {
  const i = document.querySelector(`[data-objin="${clave}"]`); if (!i) return;
  i.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => i.focus({ preventScroll: true }), 250);
}
const listaDe = (play, clave) => (clave === 'conc' ? play.concObj : play.efectos.find(e => e.id === clave)?.objetivos);
export function anadirObjetivos(S, clave, texto) {
  const ch = S.cur(), nuevos = objetivosNuevos(texto, listaDe(ch.play, clave) || []); if (!nuevos.length) return false;
  const nombre = clave === 'conc' ? ch.play.conc : ch.play.efectos.find(e => e.id === clave)?.nombre;
  S.act(`${nombre}: sobre ${joinY(nuevos)}`, (db, c) => { listaDe(c.play, clave)?.push(...nuevos); });
  return true;
}
export function quitarObjetivo(S, clave, i) {
  const ch = S.cur(), l = listaDe(ch.play, clave); if (!l?.[i]) return;
  const quien = l[i], nombre = clave === 'conc' ? ch.play.conc : ch.play.efectos.find(e => e.id === clave)?.nombre;
  const h = S.act(`${nombre}: ya no está sobre ${quien}`, (db, c) => { listaDe(c.play, clave).splice(i, 1); });
  toast(`<b>${esc(nombre)}</b> ya no está sobre ${esc(quien)}.`, [undoBtn(S, h)]);
}
export function marcarEfecto(S, nombre) {
  let id = ''; S.act(`Efecto activo: ${nombre}`, (db, c) => { id = nuevoEfecto(c.play, nombre).id; });
  setTimeout(() => enfocarObjetivos(id), 120);
}
export function terminarEfecto(S, id) {
  const e = S.cur().play.efectos.find(x => x.id === id); if (!e) return;
  const h = S.act(`Termina ${e.nombre}`, (db, c) => { c.play.efectos = c.play.efectos.filter(x => x.id !== id); });
  toast(`<b>${esc(e.nombre)}</b> terminado.`, [undoBtn(S, h)]);
}

export function longRest(S) {
  const ch = S.cur(); if (!ch) return;
  const rs = reglas(ch), dados = rs.filter(r => r.tipo === 'dados'), P = perfil(ch), eran = efectosDe(ch).length;
  const tiradas = []; let vida = null, inspira = false;
  const h = S.act('Descanso largo', (db, c) => {
    vida = descansoLargoVida(c);
    if (esHumano(c) && !vidaDe(c).inspiracion) { vidaDe(c).inspiracion = true; inspira = true; }
    c.play.used = {}; terminarConc(c.play); c.play.efectos = []; c.book.forEach(e => { e.used = false; });
    const rec = {};
    reglas(c).forEach(r => { const st = c.play.rec?.[r.id];
      if (r.tipo === 'recurso' && st?.used) { const x = recuperarEnDescanso(r, Math.min(st.used, r.max), 'largo'); if (x.usados) rec[r.id] = { used: x.usados, dice: [] }; if (x.tirada) tiradas.push(`${r.nombre}: recupera ${x.tirada}`); } });
    c.play.rec = rec;
  });
  if (tiradas.length) S.note(tiradas.join('; '));
  dawn(); haptic('medium');
  const c2 = S.cur(), max = pgMaximo(c2), rec = [
    { ico: 'pg', titulo: 'Puntos de golpe al máximo', texto: vida && vida.pg < max ? `De ${vida.pg} a ${max}.` : `${max} de ${max}.` },
    vida?.dados ? { ico: 'dado_golpe', titulo: 'Dados de golpe', texto: `Recuperas ${vida.dados === 1 ? 'el dado gastado' : `los ${vida.dados} dados gastados`}.` } : null,
    P.maxSlot > 0 ? { ico: 'esc_evo', titulo: P.pact ? 'Espacios de pacto' : 'Espacios de conjuro', texto: 'Todos vuelven a estar libres, igual que los usos gratis.' } : null,
    rs.some(r => r.tipo === 'recurso' || r.tipo === 'recuperar') ? { ico: 'dote', titulo: 'Rasgos', texto: tiradas.length ? `${tiradas.join('. ')}.` : 'Los usos de tus rasgos se restauran.' } : null,
    vida?.agotamiento ? { ico: 'agotamiento', titulo: 'Agotamiento', texto: `Baja un nivel: queda en ${vida.agotamiento - 1}.` } : null,
    eran ? { ico: 'estados', titulo: 'Efectos terminados', texto: 'Los efectos temporales sobre ti se han disipado.' } : null,
    inspira ? { ico: 'inspiracion', titulo: 'Inspiración heroica', texto: 'Como humano, recuperas la inspiración heroica (Ingenioso).', tono: 'oro' } : null,
  ].filter(Boolean);
  if (dados.length) setTimeout(() => { document.querySelectorAll('.pdie').forEach(p => p.classList.add('fresh')); }, 400);
  if (inspira) setTimeout(() => document.querySelector('.hero-insp')?.classList.add('gana'), 250);
  const cambios = opcionesIntercambio(c2, 'largo', { trasfondos: biblioteca().trasfondos });
  avisar({ ico: 'vela', titulo: 'Descanso largo', sub: `${esc(c2.nombre || 'Tu personaje')} amanece con fuerzas renovadas.`,
    secciones: [{ titulo: 'Recuperas', ico: 'pg', items: rec },
      dados.length ? { titulo: 'Anota tus dados', ico: 'dados', nota: `Tira de nuevo tus dados de ${joinY(dados.map(r => r.nombre))} y anótalos en la hoja.` } : null,
      { titulo: 'Ahora puedes cambiar', ico: 'libro', cls: 'av-cambios', items: cambios }].filter(Boolean),
    botones: [{ ...undoBtn(S, h), cls: 'ghost' }] });
}

export function shortRest(S, openRecovery, openVida) {
  const ch = S.cur(); if (!ch) return;
  const P = perfil(ch), rs = reglas(ch), bits = [];
  if (P.pact) bits.push('espacios de pacto'); else if (ch.clase === 'Brujo' && ch.espaciosManuales) bits.push('espacios');
  rs.forEach(r => { if (r.tipo !== 'recurso') return; const st = recState(ch, r.id);
    if (r.recarga === 'corto' && st.used) bits.push(r.nombre);
    if (r.recarga === 'corto1' && st.used) bits.push(`1 de ${r.nombre}`); });
  const h = S.act(`Descanso corto${bits.length ? ': ' + bits.join(', ') : ''}`, (db, c) => {
    if (P.pact) c.play.used[P.pact.level] = Math.max(0, (c.play.used[P.pact.level] || 0) - P.pact.n);
    else if (c.clase === 'Brujo' && c.espaciosManuales) Object.keys(P.slots).forEach(L => { c.play.used[L] = 0; });
    reglas(c).forEach(r => { if (r.tipo !== 'recurso') return; const st = recState(c, r.id);
      const x = recuperarEnDescanso(r, Math.min(st.used || 0, r.max), 'corto'); st.used = x.usados; if (x.tirada) bits.push(`${r.nombre} (${x.tirada})`); });
  });
  haptic();
  if (P.pact) document.querySelectorAll(`[data-slotbtn^="${P.pact.level}:"]`).forEach(b => pop(b, 'fx-ignite'));
  const rec = rs.find(r => r.tipo === 'recuperar' && !recState(S.cur(), r.id).used), c2 = S.cur();
  const dg = dadosDeGolpe(c2).reduce((n, d) => n + d.quedan, 0), herido = pgActuales(c2) < pgMaximo(c2);
  const cambios = opcionesIntercambio(c2, 'corto', { trasfondos: biblioteca().trasfondos });
  const botones = [herido && dg && openVida && { label: 'Gastar dados de golpe', cls: rec ? '' : 'primary', fn: () => { openVida(false, { descanso: true }); setTimeout(() => document.querySelector('.vd-dados')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320); } },
    rec && { label: `Usar ${rec.nombre}`, cls: 'primary', fn: () => openRecovery(rec.id) }, { ...undoBtn(S, h), cls: 'ghost' }].filter(Boolean);
  if (!cambios.length && !bits.length) {
    toast(`Descanso corto.${herido && dg ? ` Te quedan ${dg} dados de golpe para curarte.` : ''}`, botones.map(b => ({ label: b.label, hl: b.cls === 'primary', fn: b.fn })));
    return;
  }
  avisar({ ico: 'md_tiempo', tono: 'azul', titulo: 'Descanso corto', sub: herido && dg ? `Te quedan ${dg} dados de golpe para curarte.` : 'Una hora de respiro.',
    secciones: [{ titulo: 'Recuperas', ico: 'pg', items: bits.map(b => ({ ico: 'dote', titulo: b[0].toUpperCase() + b.slice(1) })) },
      { titulo: 'Ahora puedes cambiar', ico: 'libro', cls: 'av-cambios', items: cambios }],
    botones });
}

const ruleOf = (ch, id) => reglas(ch).find(x => x.id === id);
export function tickResource(S, id, i) {
  const ch = S.cur(), r = ruleOf(ch, id), used = Math.min(recState(ch, id).used || 0, r.max), left = r.max - used, spend = i < left;
  S.act(`${r.nombre}: ${spend ? 'usa 1' : 'recupera 1'} (quedan ${left + (spend ? -1 : 1)})`, (db, c) => { recState(c, id).used = used + (spend ? 1 : -1); });
  haptic();
}
export function stepResource(S, id, d) {
  const ch = S.cur(), r = ruleOf(ch, id), used = Math.min(recState(ch, id).used || 0, r.max), next = Math.max(0, Math.min(r.max, used + d));
  if (next === used) return;
  S.act(`${r.nombre}: ${d > 0 ? 'gasta 1' : 'recupera 1'} (quedan ${r.max - next})`, (db, c) => { recState(c, id).used = next; });
  haptic();
}
export async function setResource(S, id) {
  const ch = S.cur(), r = ruleOf(ch, id), used = Math.min(recState(ch, id).used || 0, r.max);
  const v = await pedir({ titulo: r.nombre, texto: `¿Cuántos te quedan? Entre 0 y ${r.max}.`, valor: String(r.max - used), tipo: 'number', min: 0, max: r.max, ok: 'Guardar' }); if (v == null) return;
  const n = parseInt(v, 10); if (isNaN(n)) return;
  const left = Math.max(0, Math.min(r.max, n));
  const h = S.act(`${r.nombre}: quedan ${left}`, (db, c) => { recState(c, id).used = r.max - left; });
  toast(`${esc(r.nombre)}: quedan ${left}.`, [undoBtn(S, h)]);
}
export function useDie(S, id, i) {
  const ch = S.cur(), r = ruleOf(ch, id), st = recState(ch, id), d = (st.dice || [])[i] || { v: '', used: false };
  if (!d.used && !d.v) { toast('Anota primero el resultado del dado.'); document.querySelector(`[data-dv^="${id}|${i}|"]`)?.focus(); return; }
  const h = S.act(d.used ? `${r.nombre}: se desmarca el ${d.v}` : `${r.nombre}: usa el ${d.v}`, (db, c) => {
    const s2 = recState(c, id); s2.dice ||= []; s2.dice[i] = { v: d.v, used: !d.used };
  });
  haptic();
  if (!d.used) toast(`${esc(r.nombre)}: ${esc(d.v)} usado.`, [undoBtn(S, h)]);
}
export function setDie(S, id, i, value) {
  const ch = S.cur(), st = recState(ch, id); st.dice ||= [];
  st.dice[i] = { ...(st.dice[i] || { used: false }), v: value };
  S.touch();
}
