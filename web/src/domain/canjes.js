import { perfil } from './reglas2024.js';
import { reglas, recState, usosGastados } from './rasgos.js';

// Rasgos que «también puedes restablecer gastando…» (Manual del Jugador de 2024): un espacio de conjuro de cierto nivel,
// un espacio de pacto, o usos de otro rasgo (Furia, Inspiración bárdica, puntos de hechicería…).
//   espacio: nivel mínimo del espacio   pacto: solo un espacio de pacto   rec/n: otro contador y cuánto cuesta
const C = (rec, coste) => ({ rec, ...coste });
export const CANJES = [
  C('tpl:bardo.inspiracion', { espacio: 1, desde: ['Bardo', 5] }),
  C('tpl:glamour.cautivadora', { rec2: 'tpl:bardo.inspiracion', n: 1 }),
  C('tpl:glamour.manto', { espacio: 3 }),
  C('tpl:berserker.presencia', { rec2: 'tpl:barbaro.furia', n: 1 }),
  C('tpl:fanatico.presencia', { rec2: 'tpl:barbaro.furia', n: 1 }),
  C('tpl:feerico.escape', { pacto: true }), C('tpl:infernal.arrastrar', { pacto: true }), C('tpl:primigenio.combatiente', { pacto: true }),
  C('tpl:conocimiento.precognicion', { espacio: 6 }),
  C('tpl:druida.forma', { espacio: 1, desde: ['Druida', 5], agotado: true }),
  C('tpl:luna.paso', { espacio: 2 }),
  C('tpl:invernal.espectro', { espacio: 4 }),
  C('tpl:maestro.conoce', { rec2: 'tpl:maestro.supremacia', n: 1 }),
  C('tpl:psionico.salto', { rec2: 'tpl:psionico.dados', n: 1 }), C('tpl:psionico.bastion', { rec2: 'tpl:psionico.dados', n: 1 }), C('tpl:psionico.maestro', { rec2: 'tpl:psionico.dados', n: 1 }),
  C('tpl:rebanaalmas.velo', { rec2: 'tpl:rebanaalmas.dados', n: 1 }), C('tpl:rebanaalmas.desgarro', { rec2: 'tpl:rebanaalmas.dados', n: 3 }),
  C('tpl:draconica.alas', { rec2: 'tpl:hechicero.puntos', n: 3 }), C('tpl:fuegomagico.corona', { rec2: 'tpl:hechicero.puntos', n: 5 }),
  C('tpl:mecanica.cabalgata', { rec2: 'tpl:hechicero.puntos', n: 7 }), C('tpl:aberrante.implosion', { rec2: 'tpl:hechicero.puntos', n: 5 }), C('tpl:mecanica.trance', { rec2: 'tpl:hechicero.puntos', n: 5 }),
  C('tpl:hechicero.innata', { rec2: 'tpl:hechicero.puntos', n: 2, desde: ['Hechicero', 7], agotado: true }),
  C('tpl:ilusionista.yo', { espacio: 2 }),
  C('tpl:paladin.cumbre', { espacio: 5 }),
];
const regla = (ch, id) => reglas(ch).find(r => r.id === id) || null;
const nivelClase = (ch, clase) => perfil(ch).clases.find(c => c.clase === clase)?.nivel || 0;
// Espacios libres por nivel (nivel mínimo), con el de pacto aparte
function espaciosLibres(ch, min, soloPacto) {
  const P = perfil(ch), out = [];
  for (let L = Math.max(1, min); L <= 9; L++) {
    const tot = P.slots[L] || 0, libres = tot - Math.min(ch.play.used?.[L] || 0, tot);
    if (!libres || (soloPacto && (!P.pact || P.pact.level !== L))) continue;
    out.push({ L, libres, pacto: !!P.pact && P.pact.level === L });
  }
  return out;
}
// Formas de recuperar un uso de este rasgo ahora mismo
export function canjesDe(ch, id) {
  const r = regla(ch, id); if (!r || usosGastados(ch, r) <= 0) return [];
  const c = CANJES.find(x => x.rec === id); if (!c) return [];
  if (c.desde && nivelClase(ch, c.desde[0]) < c.desde[1]) return [];
  if (c.agotado && usosGastados(ch, r) < r.max) return [];
  if (c.rec2) {
    const r2 = regla(ch, c.rec2); if (!r2 || r2.max - usosGastados(ch, r2) < c.n) return [];
    return [{ k: `rec:${c.rec2}`, texto: `Gastar ${c.n} de ${r2.nombre}`, rec2: c.rec2, n: c.n }];
  }
  return espaciosLibres(ch, c.espacio || 1, c.pacto).map(e => ({ k: `esp:${e.L}`, texto: `Gastar un espacio ${e.pacto ? 'de pacto ' : ''}de nivel ${e.L}`, espacio: e.L }));
}
export function aplicarCanje(ch, id, canje) {
  const st = recState(ch, id); st.used = Math.max(0, (st.used || 0) - 1);
  if (canje.rec2) { const s2 = recState(ch, canje.rec2); s2.used = (s2.used || 0) + canje.n; }
  if (canje.espacio) { ch.play.used ||= {}; ch.play.used[canje.espacio] = (ch.play.used[canje.espacio] || 0) + 1; }
}

// Fuente de magia (hechicero 2): convertir un espacio en puntos de hechicería y crear un espacio con puntos
export const COSTE_ESPACIO = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };
export function fuenteDeMagia(ch) {
  const r = regla(ch, 'tpl:hechicero.puntos'); if (!r) return null;
  const P = perfil(ch), gastados = usosGastados(ch, r), libres = r.max - gastados;
  const aPuntos = espaciosLibres(ch, 1, false).map(e => ({ L: e.L, gana: Math.min(e.L, gastados) })).filter(x => x.gana > 0);
  const crear = Object.entries(COSTE_ESPACIO).map(([L, coste]) => ({ L: +L, coste })).filter(x => (P.slots[x.L] || 0) > 0 && Math.min(ch.play.used?.[x.L] || 0, P.slots[x.L]) > 0 && libres >= x.coste);
  return { aPuntos, crear, libres };
}
export function espacioAPuntos(ch, L) {
  const r = regla(ch, 'tpl:hechicero.puntos'), st = recState(ch, r.id), gana = Math.min(L, usosGastados(ch, r));
  st.used = usosGastados(ch, r) - gana; ch.play.used[L] = (ch.play.used[L] || 0) + 1; return gana;
}
export function puntosAEspacio(ch, L) {
  const r = regla(ch, 'tpl:hechicero.puntos'), st = recState(ch, r.id);
  st.used = usosGastados(ch, r) + COSTE_ESPACIO[L]; ch.play.used[L] = Math.max(0, (ch.play.used[L] || 0) - 1); return COSTE_ESPACIO[L];
}
