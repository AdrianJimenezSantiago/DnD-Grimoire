// Menú de acciones de un objeto mágico (recuperar espacios, lanzar conjuros, curar) dentro del inventario.
import { esc, norm } from '../../core/util.js';
import { accionesDe, motivoAccion, opcionesEscala, usarAccion, espaciosRecuperables, recursoDe, libresDe } from '../../domain/equipo/accionesObjeto.js';
import { equipoDe } from '../../domain/equipo/equipo.js';
import { compendio, importSrd, tiradasConjuro } from '../../domain/conjuros/catalogo.js';
import { efectoDeConjuro, lanzadorTira, fmtRondas } from '../../domain/combate/efectos.js';
import { cambiarConc, rondasDeDuracion, ponerEfecto } from '../../domain/combate/vida.js';
import { usosGastados } from '../../domain/clases/rasgos.js';
import { elegir } from '../dialogs/elegir.js';
import { openRollObjeto } from '../dialogs/tiradas.js';
import { previewSpell } from '../dialogs/conjuro.js';
import { toast, undoBtn } from '../componentes/toast.js';
import { golpe } from '../animaciones/golpes.js';
import { haptic } from '../../platform/native.js';
import { registrarGastoObjeto } from '../../app/acciones.js';

const buscar = (ch, id) => equipoDe(ch).objetos.find(o => o.id === id) || null;
const pl = (n, s, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;
// Lo que cuesta, para el botón
export function costeTexto(a) {
  if (a.uso === 'diario') return 'una vez al día';
  if (a.uso === 'largo') return 'una vez por descanso largo';
  if (a.uso === 'libre') return a.tipo === 'conjuro' ? 'a voluntad' : 'sin coste';
  if (a.porNivel) return `1 carga por nivel (hasta ${a.porNivel})`;
  if (a.escala) return `${a.coste}–${a.coste + a.escala - 1} cargas`;
  return a.coste ? pl(a.coste, 'carga') : 'a voluntad';
}
export const conjuroDe = a => (a.tipo === 'conjuro' ? compendio().find(c => norm(c.es) === norm(a.nombre)) || null : null);

// Hace una acción del objeto: pregunta lo que haga falta (cargas, espacio), la aplica y lo cuenta
export async function accionObjeto(S, oid, aid) {
  const ch0 = S.cur(), o0 = buscar(ch0, oid), a = accionesDe(o0).find(x => x.id === aid); if (!a) return;
  const motivo = motivoAccion(ch0, o0, a); if (motivo) { toast(`<b>${esc(a.titulo)}</b>: ${esc(motivo)}`); return; }
  const ops = opcionesEscala(a), libres = libresDe(ch0, recursoDe(ch0, o0, a));
  let op = ops[0];
  if (ops.length > 1) {
    const v = await elegir({ titulo: `${a.nombre || a.titulo}: ¿cuántas cargas?`, sub: `Quedan ${libres} cargas`, libre: false, ico: 'o_varita',
      items: ops.map((x, i) => ({ nombre: x.nivel ? `Nivel ${x.nivel}` : pl(x.cargas, 'carga'), sub: x.nivel ? pl(x.cargas, 'carga') : '', valor: String(i), bloqueado: x.cargas > libres ? 'No quedan cargas suficientes.' : '' })) });
    if (v == null) return; op = ops[+v];
  }
  let L = null;
  if (a.tipo === 'recuperar') {
    const opc = espaciosRecuperables(ch0, a.nivMax);
    if (opc.length > 1) {
      const v = await elegir({ titulo: 'Recuperar un espacio de conjuro', sub: o0.nombre, libre: false, ico: 'esc_evo', items: opc.map(([n, u]) => ({ nombre: `Nivel ${n}`, sub: `${u} gastado${u > 1 ? 's' : ''}`, valor: String(n) })) });
      if (v == null) return; L = +v;
    } else L = opc[0][0];
  }
  const x = conjuroDe(a), nivel = op.nivel || a.nivel || x?.l || null;
  const titulo = a.tipo === 'conjuro' ? `${a.nombre}${nivel && x && nivel > x.l ? ` (nivel ${nivel})` : ''}` : a.titulo;
  let r = null, sid = null, fuera = [];
  const h = S.act(`${o0.nombre}: ${titulo}`, (db, c) => {
    r = usarAccion(c, buscar(c, oid), a, { cargas: op.cargas, L }); if (!r.ok) return;
    if (x) { sid = importSrd(db, x); const s = db.catalog[sid]; if (s.conc) fuera = cambiarConc(c, s.es, rondasDeDuracion(s.duracion)); }
  });
  if (!r?.ok) { S.undo(h); toast(esc(r?.motivo || 'No se puede usar ahora.')); return; }
  haptic();
  const ch = S.cur(), rr = r.recurso && ch.rasgos.find(z => z.id === r.recurso.id);
  const quedan = rr ? (a.uso === 'cargas' ? ` Quedan ${pl(r.recurso.max - usosGastados(ch, r.recurso), 'carga')}.` : '') : '';
  const partes = [], botones = [];
  if (a.tipo === 'recuperar') partes.push(`Recuperas un espacio de conjuro de nivel <b>${r.nivel}</b>.`);
  if (a.tipo === 'curar') { golpe('cura', r.curado); partes.push(`${esc(a.expr)} (${esc(r.tirada.detalle || String(r.tirada.total))}) = <b>${r.tirada.total}</b>. ${r.curado ? `Recuperas <b>${r.curado}</b> PG.` : 'Ya estabas al máximo.'}`); }
  if (a.tipo === 'tirada') partes.push(`${esc(r.tirada.detalle)} = <b>${r.tirada.total}</b> de daño de ${esc(a.dano)}.`);
  if (a.tipo === 'conjuro') {
    partes.push(`Lanzas <b>${esc(titulo)}</b>${r.gastadas ? ` (${pl(r.gastadas, 'carga')})` : ''}.`);
    if (a.cd) partes.push(`CD ${a.cd} del objeto.`); else if (a.atk) partes.push(`Ataque +${a.atk} del objeto.`); else partes.push('Con tu CD y tu ataque de conjuros.');
    if (fuera.length) partes.push(`Terminan sobre ti: ${esc(fuera.map(e => e.nombre).join(', '))}.`);
    if (!x) partes.push('El conjuro no está en el compendio: consulta su texto en el libro.');
    const s = sid && S.db.catalog[sid], ef = s && efectoDeConjuro(s.es);
    if (ef?.bueno) botones.push({ label: 'Me lo aplico', hl: true, fn: () => { const h2 = S.act(`${ef.nombre} sobre ti`, (db, c) => { ponerEfecto(c, ef.k, { conc: s.conc && c.play.conc === s.es ? s.es : '' }); }); golpe('buff'); toast(`<b>${esc(ef.nombre)}</b> sobre ti: ${esc(ef.texto)}${ef.dur ? ` Dura ${esc(fmtRondas(ef.dur))}.` : ''}`, [undoBtn(S, h2)]); } });
    if (x) botones.push({ label: 'Ver conjuro', fn: () => previewSpell(x) });
    if (s && lanzadorTira(s.es, tiradasConjuro(s))) setTimeout(() => openRollObjeto({ sid, nivel, cd: a.cd ?? null, atk: a.atk ?? null, fuente: o0.nombre }), 350);
  }
  if (a.nota) partes.push(`<span class="tnote">${esc(a.nota)}</span>`);
  toast(`<b>${esc(o0.nombre)}</b>: ${partes.join(' ')}${quedan}`, [...botones, undoBtn(S, h)]);
}

// Gastar el contador de un objeto desde la hoja: si el objeto tiene acciones, se elige cuál (o solo gastar)
registrarGastoObjeto(async (S, rid) => {
  const ch = S.cur(), r = (ch.rasgos || []).find(x => x.id === rid); if (!r?.objetoId) return false;
  const o = buscar(ch, r.objetoId); if (!o) return false;
  const acs = accionesDe(o).filter(a => recursoDe(ch, o, a)?.id === rid); if (!acs.length) return false;
  const items = acs.map(a => ({ nombre: a.titulo, sub: costeTexto(a), valor: a.id, bloqueado: motivoAccion(ch, o, a) }));
  const v = acs.length === 1 && !items[0].bloqueado ? acs[0].id
    : await elegir({ titulo: o.nombre, sub: '¿Qué haces con él?', libre: false, ico: 'o_maravilloso', items: [...items, { nombre: 'Solo gastar el uso', sub: 'Sin aplicar nada', valor: '__solo' }] });
  if (v == null) return true;
  if (v === '__solo') return false;
  await accionObjeto(S, o.id, v);
  return true;
});
