import { esc, joinY } from '../core/util.js';
import { perfil } from '../domain/reglas2024.js';
import { reglas, recState, schoolMatch, recuperarEnDescanso, recursoParaConjuro, usosGastados } from '../domain/rasgos.js';
import { firstFreeFrom, freeOf, isPrepared, schoolKey, slotsOf, usedOf } from '../ui/sheet.js';
import { toast } from '../ui/toast.js';
import { castFx, dawn, pop, schoolColor, slotFx } from '../ui/fx.js';
import { haptic } from '../platform/native.js';
import { pedir } from '../ui/modal.js';
import { manualFor, srdFor, tiradasConjuro, biblioteca } from '../domain/catalogo.js';
import { conObjetivos, nuevoEfecto, objetivosNuevos, terminarConc } from '../domain/concentracion.js';
import { openRoll } from '../ui/dialogs/tiradas.js';
import { descansoLargoVida, dadosDeGolpe, pgActuales, pgMaximo, vidaDe, ponerEfecto, soltarConc, cambiarConc, rondasDeDuracion, esYo, sincronizarYo, listaObjetivos, conjuroDeObjetivos } from '../domain/vida.js';
import { openObjetivos } from '../ui/dialogs/objetivos.js';
import { combateDe, limiteEspacio, lanzarEnCombate } from '../domain/combate.js';
import { golpe } from '../ui/golpes.js';
import { opcionesIntercambio, esHumano } from '../domain/intercambios.js';
import { efectosDe, efectoDeConjuro, fmtRondas, EFECTO, EFECTO_DE_RECURSO, lanzadorTira, soloSobreTi } from '../domain/efectos.js';
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

export function cast(S, bi, mode, L, rec = null, { ajeno = null, forzar = false } = {}) {
  const ch = S.cur(), e = ch.book[bi], s = S.db.catalog[e.sid], P = perfil(ch);
  // Un espacio de conjuro por turno (Manual del Jugador 2024)
  const lim = mode === 'slot' && !forzar ? limiteEspacio(ch, s.tiempo) : '';
  if (lim === 'turno') {
    const alt = [e.gratis && !e.used && { label: 'Usar su uso gratis', hl: true, fn: () => cast(S, bi, 'free') }, s.ritual && { label: 'Como ritual', fn: () => cast(S, bi, 'ritual') },
      { label: 'Lanzar igualmente', fn: () => cast(S, bi, mode, L, rec, { forzar: true }) }].filter(Boolean);
    toast(`<b>${esc(s.es)}</b>: ya gastaste un espacio de conjuro en este turno (${esc(combateDe(ch).espacio)}). Las reglas solo permiten uno por turno; aún puedes lanzar trucos o conjuros sin espacio.`, alt);
    return false;
  }
  if (lim === 'reaccion' && ajeno == null) {
    toast(`<b>${esc(s.es)}</b> gasta un espacio y ya gastaste uno en tu turno. Como reacción solo puedes hacerlo en el turno de otra criatura.`,
      [{ label: 'Es en el turno de otro', hl: true, fn: () => cast(S, bi, mode, L, rec, { ajeno: true }) }, { label: 'Es en mi turno: lanzar igualmente', fn: () => cast(S, bi, mode, L, rec, { ajeno: false, forzar: true }) }]);
    return false;
  }
  let msg = '', snuffIdx = -1;
  if (mode === 'free') msg = `<b>${esc(s.es)}</b>: uso gratis gastado.`;
  else if (mode === 'recurso') msg = `<b>${esc(s.es)}</b> con ${esc(rec.nombre)}, sin gastar espacio (quedan ${rec.max - usosGastados(ch, rec) - 1}).`;
  else if (mode === 'ritual') msg = `<b>${esc(s.es)}</b> como ritual: sin espacio, 10 minutos más.`;
  else {
    const noLeft = freeOf(ch, P, s.level) === 0 && L !== s.level;
    snuffIdx = freeOf(ch, P, L) - 1;
    if (P.pact && L === P.pact.level) msg = `<b>${esc(s.es)}</b>: espacio de pacto gastado (nivel ${L}).`;
    else { msg = `<b>${esc(s.es)}</b>: espacio de nivel ${L} gastado.`;
      if (L > s.level) msg += ` <span style="opacity:.8">(${noLeft && slotsOf(P, s.level) ? 'no quedaban de nivel ' + s.level : 'potenciado'})</span>`; }
  }
  if (s.conc && ch.play.conc && ch.play.conc !== s.es) msg += ` Pierdes la concentración en ${esc(ch.play.conc)}.`;
  if (efectosDe(ch).some(x => x.k === 'furia')) msg += ' <span class="tnote"><b>Estás en Furia</b>: las reglas no te dejan lanzar conjuros ni concentrarte.</span>';
  const fx = castEffects(S, ch, P, s, mode, L), ef = mode !== 'ritual' ? efectoDeConjuro(s.es) : null;
  // Conjuros que solo pueden afectarte a ti (alcance Lanzador): se activan solos al lanzarlos
  const solo = ef && (ef.k === 'escudo' ? combateDe(ch).activo : ef.k === 'pasarsinrastro' || (ef.bueno && soloSobreTi(s.alcance || srdFor(s)?.a)));
  let fuera = [];
  const concRondas = s.conc ? rondasDeDuracion(s.duracion || srdFor(s)?.du) : null;
  if (solo) msg += ` <span class="tnote"><b>${esc(ef.nombre)}</b> te afecta: ${esc(ef.texto.replace(/\.$/, ''))}${ef.dur ? ` (${esc(fmtRondas(ef.dur))})` : ''}.</span>`;
  else msg += notaObjetivo(ef, s);
  const h = S.act(msg, (db, c) => {
    const ee = c.book[bi];
    if (mode === 'free') ee.used = true;
    if (mode === 'recurso') recState(c, rec.id).used = (recState(c, rec.id).used || 0) + 1;
    if (mode === 'slot') c.play.used[L] = usedOf(c, P, L) + 1;
    if (s.level > 0 && mode !== 'ritual') lanzarEnCombate(c, { tiempo: s.tiempo, conEspacio: mode === 'slot', nombre: s.es, enTuTurno: ajeno == null ? null : !ajeno });
    if (s.conc) fuera = cambiarConc(c, s.es, concRondas);
    if (solo) ponerEfecto(c, ef.k, { conc: s.conc ? s.es : '' });
  });
  if (fuera.length) msg += ` Terminan sobre ti: ${esc(joinY(fuera.map(e => e.nombre)))}.`;
  if (solo) setTimeout(() => golpe('buff'), 200);
  const extra = [...fx.extra];
  const x = srdFor(s), apunta = s.conc && conObjetivos(s, [manualFor(x)?.d, s.desc, x?.dEs, x?.d]);
  // Conjuros que ayudan: se pregunta sobre quién con un selector donde marcarte a ti
  const pregunta = ef?.bueno && !solo && ef.k !== 'escudo';
  if (pregunta) setTimeout(() => preguntarObjetivos(S, s, mode === 'slot' ? L : s.level), 420);
  else if (!solo) extra.unshift(...botonAplicarme(S, ef, s, mode === 'slot' ? L : s.level));
  if (!pregunta && apunta && ch.play.pedirObjetivos) setTimeout(() => enfocarObjetivos('conc'), 420);
  else if (!pregunta && apunta) extra.unshift({ label: 'Anotar objetivos', hl: true, fn: () => enfocarObjetivos('conc') });
  if (mode === 'slot' && s.ritual && (isPrepared(e) || P.ritualLibro)) extra.push({ label: 'Era como ritual', fn: () => { S.undo(h); cast(S, bi, 'ritual'); } });
  if (mode === 'recurso' && firstFreeFrom(ch, P, s.level)) extra.push({ label: 'Mejor con un espacio', fn: () => { S.undo(h); cast(S, bi, 'slot', firstFreeFrom(S.cur(), perfil(S.cur()), s.level)); } });
  castFx(row(bi), schoolColor(schoolKey(s.escuela)));
  if (snuffIdx >= 0) slotFx(L, snuffIdx, 'snuff');
  haptic();
  toast(msg + fx.msg, [...extra, undoBtn(S, h)]);
  if (mode !== 'ritual' && lanzadorTira(s.es, tiradasConjuro(s))) setTimeout(() => openRoll(bi, mode === 'slot' || mode === 'recurso' ? L || s.level : null), 350);
  return true;
}

const notaObjetivo = (ef, s) => (ef?.tiraObjetivo ? ` <span class="tnote"><b>${esc(ef.nombre)}</b> en marcha${s.conc ? ' mientras te concentres' : ''}: el dado lo tira cada objetivo al hacer su tirada, no tú.${ef.bueno ? ' Si te incluyes, la app te lo suma sola a tus tiradas.' : ''}</span>` : '');
function preguntarObjetivos(S, s, L) {
  const ch = S.cur(); if (!ch) return;
  const clave = s.conc ? (ch.play.conc === s.es ? 'conc' : null) : ch.play.efectos.find(e => e.nombre === s.es)?.id || null;
  openObjetivos({ clave, conjuro: s.es, L });
}
const botonAplicarme = (S, ef, s, L) => (ef?.bueno ? [{ label: ef.k === 'escudo' ? 'Aplicarme +5 CA' : ef.tiraObjetivo ? 'Me incluyo' : 'Me lo aplico', hl: true, fn: () => aplicarmeConjuro(S, ef, s, L) }] : []);

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
    const fx = castEffects(S, ch, P, s, 'truco', 0), ef = efectoDeConjuro(s.es), antes = ch.play.conc;
    // Guía y Resistencia son trucos de concentración
    let fuera = [];
    const h = S.act(`${s.es} (truco)`, (db, c) => { lanzarEnCombate(c, { tiempo: s.tiempo }); if (s.conc) fuera = cambiarConc(c, s.es, rondasDeDuracion(s.duracion || srdFor(s)?.du)); });
    castFx(row(bi), schoolColor(schoolKey(s.escuela))); haptic();
    if (lanzadorTira(s.es, tiradasConjuro(s))) { openRoll(bi); if (fx.msg) toast(fx.msg.replace(/^\s+/, '')); return true; }
    const conc = s.conc ? `${antes && antes !== s.es ? ` Pierdes la concentración en ${esc(antes)}.` : ''}${fuera.length ? ` Terminan sobre ti: ${esc(joinY(fuera.map(x => x.nombre)))}.` : ''}` : '';
    toast(`<b>${esc(s.es)}</b> es un truco: a voluntad, no gasta espacio.${conc}${notaObjetivo(ef, s)}${fx.msg}`, [undoBtn(S, h)]);
    if (ef?.bueno) setTimeout(() => preguntarObjetivos(S, s, 0), 420);
    return true;
  }
  if (!force && !isPrepared(e)) {
    if (s.ritual && P.ritualLibro) return cast(S, bi, 'ritual');
    return toast(`<b>${esc(s.es)}</b> no está preparado.`, [{ label: 'Lanzar igualmente', fn: () => quickCast(S, bi, true) }]);
  }
  if (e.gratis && !e.used) return cast(S, bi, 'free');
  const rec = recursoParaConjuro(ch, s.es, e.fuente);
  if (rec) return cast(S, bi, 'recurso', s.level, rec);
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
const listaDe = listaObjetivos;
// Si entre los objetivos estás tú, el efecto se te aplica; si te quitas, deja de afectarte
function avisoYo(S, cambio, nombre) {
  const ef = efectoDeConjuro(nombre); if (!cambio || !ef) return;
  if (cambio === 'pone') { golpe(ef.bueno ? 'buff' : 'debuff'); toast(`<b>${esc(ef.nombre)}</b> también sobre ti: ${esc(ef.texto)}`); }
  else toast(`<b>${esc(ef.nombre)}</b> ya no te afecta.`);
  haptic('light');
}
export function anadirObjetivos(S, clave, texto, { L } = {}) {
  const ch = S.cur(), nuevos = objetivosNuevos(texto, listaDe(ch.play, clave) || []); if (!nuevos.length) return false;
  const nombre = conjuroDeObjetivos(ch.play, clave); let cambio = '';
  S.act(`${nombre}: sobre ${joinY(nuevos)}`, (db, c) => { listaDe(c.play, clave)?.push(...nuevos); cambio = sincronizarYo(c, clave, { L }); });
  avisoYo(S, cambio, nombre);
  return true;
}
export function quitarObjetivo(S, clave, i) {
  const ch = S.cur(), l = listaDe(ch.play, clave); if (!l?.[i]) return;
  const quien = l[i], nombre = conjuroDeObjetivos(ch.play, clave); let cambio = '';
  const h = S.act(`${nombre}: ya no está sobre ${quien}`, (db, c) => { listaDe(c.play, clave).splice(i, 1); cambio = sincronizarYo(c, clave); });
  if (cambio) avisoYo(S, cambio, nombre); else toast(`<b>${esc(nombre)}</b> ya no está sobre ${esc(quien)}.`, [undoBtn(S, h)]);
}
export function alternarYo(S, clave, { L } = {}) {
  const ch = S.cur(), l = listaDe(ch.play, clave); if (!l) return;
  const nombre = conjuroDeObjetivos(ch.play, clave), yo = l.some(o => esYo(ch, o)); let cambio = '';
  S.act(yo ? `${nombre}: ya no está sobre ti` : `${nombre}: también sobre ti`, (db, c) => {
    const ll = listaDe(c.play, clave);
    if (yo) ll.splice(0, ll.length, ...ll.filter(o => !esYo(c, o))); else ll.push(c.nombre || 'Yo');
    cambio = sincronizarYo(c, clave, { L });
  });
  avisoYo(S, cambio, nombre);
}
// Conjuros sin concentración (Auxilio, Armadura de mago…): sus objetivos van en una entrada de «Efectos activos»
export function claveObjetivos(S, nombre) {
  const ya = S.cur().play.efectos.find(e => e.nombre === nombre); if (ya) return ya.id;
  let id = ''; S.act(`${nombre}: objetivos`, (db, c) => { id = nuevoEfecto(c.play, nombre).id; });
  return id;
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
// Furia y Canción de la hoja: al gastar el uso, el efecto queda puesto (la furia además rompe la concentración)
function alGastar(c, id) {
  const k = EFECTO_DE_RECURSO[id]; if (!k) return [];
  const fuera = k === 'furia' && c.play?.conc ? soltarConc(c) : [];
  ponerEfecto(c, k); return fuera;
}
function avisoGasto(S, id, h, fuera) {
  const k = EFECTO_DE_RECURSO[id]; if (!k) return;
  golpe('buff'); toast(`<b>${esc(EFECTO[k].nombre)}</b> activa: ${esc(EFECTO[k].texto)}${fuera.length ? ` Pierdes la concentración.` : ''}`, [undoBtn(S, h)]);
}
export function tickResource(S, id, i) {
  const ch = S.cur(), r = ruleOf(ch, id), used = Math.min(recState(ch, id).used || 0, r.max), left = r.max - used, spend = i < left;
  let fuera = [];
  const h = S.act(`${r.nombre}: ${spend ? 'usa 1' : 'recupera 1'} (quedan ${left + (spend ? -1 : 1)})`, (db, c) => { recState(c, id).used = used + (spend ? 1 : -1); if (spend) fuera = alGastar(c, id); });
  haptic(); if (spend) avisoGasto(S, id, h, fuera);
}
export async function stepResource(S, id, d) {
  const ch = S.cur(), r = ruleOf(ch, id), used = Math.min(recState(ch, id).used || 0, r.max);
  if (r.reserva && d > 0) {
    if (used >= r.max) return;
    const v = await pedir({ titulo: r.nombre, texto: `¿Cuántos ${r.reserva} gastas? Te quedan ${r.max - used}.`, valor: String(Math.min(5, r.max - used)), tipo: 'number', min: 1, max: r.max - used, ok: 'Gastar' }); if (v == null) return;
    d = Math.max(1, Math.min(r.max - used, parseInt(v, 10) || 0));
    const h = S.act(`${r.nombre}: gasta ${d} ${r.reserva} (quedan ${r.max - used - d})`, (db, c) => { recState(c, id).used = used + d; });
    haptic(); toast(`${esc(r.nombre)}: gastas ${d} ${esc(r.reserva)}. Quedan ${r.max - used - d}.`, [undoBtn(S, h)]); return;
  }
  const next = Math.max(0, Math.min(r.max, used + d));
  if (next === used) return;
  let fuera = [];
  const h = S.act(`${r.nombre}: ${d > 0 ? 'gasta 1' : 'recupera 1'} (quedan ${r.max - next})`, (db, c) => { recState(c, id).used = next; if (d > 0) fuera = alGastar(c, id); });
  haptic(); if (d > 0) avisoGasto(S, id, h, fuera);
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
