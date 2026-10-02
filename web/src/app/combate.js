// Casos de uso del modo combate: entrar y salir, iniciativa, pasar de ronda, tiradas de ataque y daño con lo que se
// añade al impactar, acciones comunes (Correr, Esquivar…) y daño o curación rápidos desde la vista de combate.
import { esc, joinY, norm, numLibre } from '../core/util.js';
import { NOMBRE_CAR, modOf, clasesDe } from '../domain/reglas/reglas2024.js';
import { reglas, usosGastados, estadoRecurso } from '../domain/clases/rasgos.js';
import { $ } from '../ui/componentes/dom.js';
import { toast, botonDeshacer } from '../ui/componentes/toast.js';
import { dialogoSuperior } from '../ui/componentes/dialog.js';
import { pop, movimientoReducido } from '../ui/animaciones/fx.js';
import { vibrar } from '../platform/native.js';
import { pedir } from '../ui/componentes/modal.js';
import { danar, sanar } from '../ui/dialogs/vida.js';
import { tirarPrueba, tirarDano } from '../ui/dialogs/dados.js';
import { transicion } from '../ui/pantallas/combate.js';
import { combateDe, empezarCombate, terminarCombate, siguienteTurno, registrarAtaque, ACCION_COMUN, hacerAccionComun, deshacerAccionComun } from '../domain/combate/combate.js';
import { ataquesPorAccion, efectoMaestria } from '../domain/combate/maestria.js';
import { bonoHabilidad, bonoSalvacion, iniciativa, NOMBRE_HAB, abDe } from '../domain/reglas/habilidades.js';
import { statsEfectivos, bonoPruebasObjetos } from '../domain/equipo/objetosEfecto.js';
import { opcionesAlImpactar, gastarAlImpactar, danoSiempre } from '../domain/combate/alImpactar.js';
import { maniobrasDe, dadoSupremacia } from '../domain/clases/maniobras.js';
import { preguntarAlImpactar } from '../ui/selectores/alImpactar.js';
import { ataqueArma, armaCombate, armasCombate } from '../domain/equipo/equipo.js';
import { efectosDe, caEfectiva, velocidadEfectiva, EFECTO, fmtRondas } from '../domain/combate/efectos.js';
import { pasarRonda, vidaDe, ponerEfecto } from '../domain/combate/vida.js';
import { golpe } from '../ui/animaciones/golpes.js';
import { avisar } from '../ui/dialogs/aviso.js';
import { alTirarIniciativa, alEmpezarTurno, rangoCritico } from '../domain/combate/automatismos.js';

let S;
export const initCombate = store => { S = store; };

export function alternarCombate(el) {
  const ch = S.cur(); if (!ch) return;
  const c = combateDe(ch), activo = c.activo, ronda = c.ronda;
  transicion(activo ? 'salir' : 'entrar', el, () => {
    S.editing = false;
    S.act(activo ? `Fin del combate tras ${ronda} ${ronda === 1 ? 'ronda' : 'rondas'}` : 'Empieza el combate', (db, x) => { if (activo) terminarCombate(x); else empezarCombate(x); });
    const el2 = activo ? $('#sheet') : $('#combate'), cls = activo ? 'fx-paz' : 'fx-entra';
    if (!movimientoReducido()) { el2.classList.add(cls); setTimeout(() => el2.classList.remove(cls), 1300); }
  }, { ronda });
  vibrar(activo ? 'light' : 'heavy');
  if (!activo) setTimeout(() => { const x = S.cur(); if (x && combateDe(x).activo && combateDe(x).iniciativa == null && !dialogoSuperior()) tirarDesde('iniciativa'); }, movimientoReducido() ? 200 : 1900);
}
export async function iniciativaManual() {
  const ch = S.cur(); if (!ch) return;
  const c = combateDe(ch), alerta = (ch.dotes || []).some(d => /^alerta/i.test(d)) || /alerta/i.test(JSON.stringify(ch.trasfondo || ''));
  const r = await pedir({ titulo: 'Iniciativa a mano', texto: `Escribe tu iniciativa para este combate.${alerta ? ' Con la dote Alerta puedes intercambiarla con un aliado dispuesto: pon aquí la suya.' : ' Útil si la intercambias con un aliado o tu DJ la ajusta.'}`,
    valor: c.iniciativa != null ? String(c.iniciativa) : '', tipo: 'number', min: -10, max: 60, ok: 'Guardar' });
  if (r == null || r === '') return;
  const n = parseInt(r, 10); if (!Number.isFinite(n)) return;
  const antes = c.iniciativa;
  let auto = [];
  const h = S.act(`Iniciativa a mano: ${n}${antes != null ? ` (antes ${antes})` : ''}`, (db, x) => { combateDe(x).iniciativa = n; combateDe(x).iniManual = true; if (antes == null) auto = alTirarIniciativa(x); });
  pop(document.querySelector('.cb-ini-v'), 'fx-pop'); vibrar('light');
  toast(`Iniciativa: <b>${n}</b>${antes != null ? ` (antes ${antes})` : ''}.${textoAuto(auto)}`, [botonDeshacer(S, h)]);
}
export function nuevoTurno() {
  const ch = S.cur(); if (!ch) return;
  if (combateDe(ch).iniciativa == null) { toast('Antes de pasar de ronda, tira tu iniciativa (o escríbela con el lápiz).'); tirarDesde('iniciativa'); return; }
  let fuera = [];
  const ronda = combateDe(ch).ronda + 1;
  let auto = [];
  const h = S.act(`Ronda ${ronda}`, (db, x) => { siguienteTurno(x); fuera = pasarRonda(x); auto = alEmpezarTurno(x); });
  if (auto.length) { S.note(auto.map(a => `${a.nombre}: ${a.texto}`).join(' ')); if (!fuera.length) toast(textoAuto(auto).trim(), [botonDeshacer(S, h)]); }
  if (fuera.length) {
    S.note(`Terminan: ${fuera.map(e => (e.finConc ? `concentración en ${e.nombre}` : e.nombre)).join(', ')}`);
    setTimeout(() => avisoFinEfectos(fuera, ronda, h), 380);
  }
  pop(document.querySelector('.cb-ronda'), 'fx-ronda'); pop(document.querySelector('.cb-eco'), 'fx-renueva'); vibrar('medium');
}
const textoAuto = auto => auto.map(a => ` <b>${esc(a.nombre)}</b>: ${esc(a.texto)}`).join('');
function avisoFinEfectos(fuera, ronda, h) {
  const buenos = fuera.filter(e => e.bueno), malos = fuera.filter(e => !e.bueno);
  const ca = caEfectiva(S.cur()), vel = velocidadEfectiva(S.cur());
  const fin = fuera.find(e => e.finConc);
  const cierra = e => ({ ico: e.ico, titulo: e.finConc ? `Concentración en ${e.nombre}` : e.nombre, texto: e.finConc ? 'Se agota la duración del conjuro: dejas de concentrarte.' : e.conc && fin?.conc === e.conc ? `Terminaba con tu concentración en ${e.conc}.` : e.k === 'escudo' ? `Tu CA vuelve a ${ca.ca}.` : EFECTO[e.k]?.ca ? `Tu CA queda en ${ca.ca}.` : EFECTO[e.k]?.vel || EFECTO[e.k]?.velX ? `Tu velocidad queda en ${String(vel.m).replace('.', ',')} m.` : EFECTO[e.k]?.maxPg ? 'Tus PG máximos vuelven a su valor.' : 'Su duración se ha agotado.', tono: `fin ${e.bueno ? 'buena' : 'mala'}` });
  avisar({ ico: 'md_tiempo', tono: malos.length && !buenos.length ? 'verde' : 'azul', titulo: fin ? `Termina ${fin.nombre}` : fuera.length === 1 ? `Termina ${fuera[0].nombre}` : 'Terminan tus efectos',
    sub: `Empieza la ronda ${ronda}: ${fin ? `se agota la duración de ${fin.nombre} y dejas de concentrarte` : fuera.length === 1 ? 'se agota la duración de un efecto' : `se agota la duración de ${fuera.length} efectos`}.`,
    secciones: [{ titulo: 'Ya no te ayuda', ico: 'inspiracion', items: buenos.map(cierra) }, { titulo: 'Te libras de', ico: 'estados', items: malos.map(cierra) },
      { titulo: 'Sigue activo', ico: 'md_tiempo', items: [...(S.cur().play.conc ? [{ ico: 'esc_adi', titulo: `Concentración en ${S.cur().play.conc}`, texto: S.cur().play.concRondas != null ? `Quedan ${fmtRondas(S.cur().play.concRondas)}.` : 'Hasta que la termines o la pierdas.' }] : []), ...efectosDe(S.cur()).map(e => ({ ico: e.ico, titulo: e.nombre, texto: e.rondas != null ? `Quedan ${fmtRondas(e.rondas)}.` : 'Hasta que lo quites o descanses.' }))] }],
    botones: [{ ...botonDeshacer(S, h), label: 'Deshacer la ronda', cls: 'ghost' }] });
  vibrar('light');
}
export function tirarDesde(clave) {
  const ch = S.cur(); if (!ch) return;
  if (clave === 'iniciativa') return tirarPrueba({ titulo: 'Iniciativa', sub: 'Prueba de Destreza', bono: iniciativa(ch), tipo: 'iniciativa', repetible: true,
    alTirar: total => { if (!combateDe(S.cur()).activo) return ''; let auto = [];
      S.act(`Iniciativa: ${total}`, (db, x) => { const primera = combateDe(x).iniciativa == null; combateDe(x).iniciativa = total; combateDe(x).iniManual = false; if (primera) auto = alTirarIniciativa(x); });
      if (auto.length) S.note(auto.map(a => `${a.nombre}: ${a.texto}`).join(' '));
      return `Guardada como tu iniciativa en este combate. Puedes cambiarla a mano con el lápiz junto a ella.${auto.length ? ` ${auto.map(a => `${a.nombre}: ${a.texto}`).join(' ')}` : ''}`; } });
  const [tipo, k] = clave.split(':');
  if (tipo === 'car') return tirarPrueba({ titulo: `Prueba de ${NOMBRE_CAR[k]}`, sub: 'Prueba de característica', bono: modOf(statsEfectivos(ch)[k]) + bonoPruebasObjetos(ch), tipo: 'prueba', ab: k });
  if (tipo === 'salv') return tirarPrueba({ titulo: `Salvación de ${NOMBRE_CAR[k]}`, sub: 'Tirada de salvación', bono: bonoSalvacion(ch, k), tipo: 'salvacion', ab: k });
  if (tipo === 'hab') return tirarPrueba({ titulo: NOMBRE_HAB[k], sub: `Prueba de ${NOMBRE_CAR[abDe(k)]}`, bono: bonoHabilidad(ch, k), tipo: 'prueba', hab: k });
}

const arma = id => { const ch = S.cur(), o = armaCombate(ch, id); return o ? { o, a: ataqueArma(ch, o) } : null; };
// Al impactar pregunta por maniobras, Castigo divino, Ataque furtivo… y gasta lo elegido (con deshacer)
const danoArma = async (x, critico = false, aviso = '') => {
  const ops = opcionesAlImpactar(S.cur(), x.o); let mas = [];
  if (ops.length) {
    const sel = await preguntarAlImpactar(ops, { arma: x.o.nombre }); if (sel == null) return;
    if (sel.length) {
      const txt = sel.map(o => o.grupo === 'maniobra' ? o.nombre : o.grupo === 'castigo' ? `Castigo divino (${o.nombre.toLowerCase()})` : o.titulo);
      const h = S.act(`${x.o.nombre}: ${txt.join(', ')}`, (db, c) => gastarAlImpactar(c, sel));
      toast(`<b>${esc(joinY(txt))}</b>: gastado.`, [botonDeshacer(S, h)]);
      mas = sel.filter(o => o.dado).map(o => ({ fuente: o.grupo === 'maniobra' ? o.nombre : o.titulo, valor: o.dado }));
    }
  }
  tirarDano({ titulo: x.o.nombre, sub: `de daño ${x.a.tipo}`.trim(), expr: x.a.expr, critico, aviso, clave: norm(x.a.tipo || ''), extras: [...efectosDe(S.cur()).filter(e => e.danoArma).map(e => ({ fuente: e.nombre, valor: e.danoArma })), ...danoSiempre(S.cur(), x.o), ...mas] });
};
const TXT_ATAQUE = { mella: 'Mella: el ataque con arma ligera entra en tu acción de Ataque', adicional: 'Ataque con arma ligera: gasta tu acción adicional', agotado: 'Ya has gastado tu acción y tus ataques de este turno' };
// Ataque de precisión: si conoces la maniobra y te quedan dados de supremacía, se ofrece al fallar
const precisionDe = ch => {
  // Golpe guiado (dominio de la guerra 3): al fallar, +10 a la tirada gastando Canalizar divinidad
  const guerra = clasesDe(ch).some(c => c.clase === 'Clérigo' && c.nivel >= 3 && /guerra/i.test(c.subclase || '')), cd = reglas(ch).find(x => x.id === 'tpl:clerigo.canalizar');
  const guiado = guerra && cd && cd.max - usosGastados(ch, cd) > 0 ? { nombre: 'Golpe guiado', fijo: 10, quedan: cd.max - usosGastados(ch, cd), texto: 'gasta Canalizar divinidad y suma +10 a la tirada',
    fn: () => { const h = S.act('Golpe guiado: gasta Canalizar divinidad', (db, c) => { estadoRecurso(c, cd.id).used = (estadoRecurso(c, cd.id).used || 0) + 1; }); toast('Golpe guiado: Canalizar divinidad gastado.', [botonDeshacer(S, h)]); } } : null;
  if (!maniobrasDe(ch).some(m => m.nombre === 'Ataque de precisión')) return guiado;
  const r = reglas(ch).find(x => x.id === 'tpl:maestro.supremacia'); if (!r) return null;
  const quedan = r.max - usosGastados(ch, r); if (quedan < 1) return null;
  return { dado: dadoSupremacia(clasesDe(ch).find(c => c.clase === 'Guerrero').nivel), quedan,
    fn: () => { const h = S.act('Ataque de precisión: gasta un dado de supremacía', (db, c) => { estadoRecurso(c, r.id).used = (estadoRecurso(c, r.id).used || 0) + 1; }); toast('Ataque de precisión: dado de supremacía gastado.', [botonDeshacer(S, h)]); } };
};
const tirarAtaque = (x, eco = '') => {
  const maestria = x.a.domina ? efectoMaestria(S.cur(), x.a.maestria, { mod: x.a.mod }) : null;
  tirarPrueba({ titulo: x.o.nombre, sub: ['Tirada de ataque', eco, maestria ? `maestría: ${maestria.nombre}` : ''].filter(Boolean).join(' · '), bono: parseInt(x.a.ataque, 10) || 0, tipo: 'ataque', critMin: rangoCritico(S.cur()),
    impacto: { maestria, clave: norm(x.a.tipo || ''), precision: precisionDe(S.cur()) }, siguiente: x.a.expr ? { texto: 'Tirar daño', fn: (critico, aviso) => danoArma(x, critico, aviso) } : null });
};
// Correr, Destrabarse, Esquivar, Esconderse…: gastan la acción (o la adicional o la reacción) y dejan su efecto hasta tu siguiente turno
const VIA_TXT = { accion: 'tu acción', adicional: 'tu acción adicional', reaccion: 'tu reacción' };
export const accionComun = (k, via, forzar = false) => {
  const ch = S.cur(), a = ACCION_COMUN[k], c = combateDe(ch); if (!ch || !a) return;
  if (c.hechas.some(h => h.k === k && h.via === via)) {
    const h = S.act(`Deshace ${a.nombre}`, (db, x) => { deshacerAccionComun(x, k, via); if (a.efecto) vidaDe(x).efectos = vidaDe(x).efectos.filter(e => e.k !== a.efecto); });
    vibrar('light'); toast(`<b>${esc(a.nombre)}</b> desmarcada: ${esc(VIA_TXT[via])} vuelve a estar libre.`, [botonDeshacer(S, h)]); return;
  }
  if (c.turno[via] && !forzar) {
    toast(`Ya has gastado ${esc(VIA_TXT[via])} este turno.`, [{ label: 'Hacerlo igualmente', hl: true, fn: () => accionComun(k, via, true) }]); return;
  }
  const h = S.act(`${a.nombre}${via !== 'accion' ? ` (${via === 'adicional' ? 'acción adicional' : 'reacción'})` : ''}`, (db, x) => { hacerAccionComun(x, k, via); if (a.efecto) ponerEfecto(x, a.efecto); });
  vibrar('light');
  if (a.efecto) golpe('buff');
  const extra = [];
  if (k === 'oportunidad') {
    const ch2 = S.cur(), o = armasCombate(ch2).filter(Boolean).sort((p, q) => q.equipado - p.equipado).find(w => !(w.arma.props || []).some(p => norm(p).startsWith('municion')));
    if (o) setTimeout(() => tirarAtaque(arma(o.id), 'ataque de oportunidad · gasta tu reacción'), 200);
  } else if (a.tirar?.length === 1) setTimeout(() => tirarDesde(`hab:${a.tirar[0]}`), 250);
  else if (a.tirar) extra.push(...a.tirar.slice(0, 3).map((hk, i) => ({ label: NOMBRE_HAB[hk], hl: i === 0, fn: () => tirarDesde(`hab:${hk}`) })));
  toast(`<b>${esc(a.nombre)}</b>: gasta ${esc(VIA_TXT[via])}. ${esc(a.texto)}`, [...extra, botonDeshacer(S, h)]);
};
export const pgRapido = tipo => { const i = document.getElementById('cbCant'), n = numLibre(i?.value); if (!(n > 0)) { i?.focus(); toast('Escribe primero cuántos puntos de golpe.'); return; }
  if (tipo === 'dano') danar(S, n); else sanar(S, n); const j = document.getElementById('cbCant'); if (j) j.value = ''; };
// Tirada de ataque con un arma; en combate cuenta el ataque en la economía del turno (acción, Mella, adicional)
export function atacar(id) {
  const x = arma(id); if (!x) return;
  let reg = null;
  if (combateDe(S.cur()).activo) S.edit((db, c) => { reg = registrarAtaque(c, { max: ataquesPorAccion(c), ligera: x.a.ligera, mella: x.a.domina && norm(x.a.maestria) === 'mella' }); });
  const eco = !reg ? '' : reg.tipo === 'accion' ? (reg.max > 1 ? `ataque ${reg.n} de ${reg.max} de tu acción` : 'gasta tu acción') : TXT_ATAQUE[reg.tipo];
  if (reg?.tipo === 'agotado') toast(`${TXT_ATAQUE.agotado}. La tirada no se descuenta.`);
  tirarAtaque(x, eco);
}
// Tirada de daño de un arma (botón de daño de la vista de combate)
export function danoCon(id) { const x = arma(id); if (x) danoArma(x); }
