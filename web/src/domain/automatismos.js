import { norm } from '../core/util.js';
import { statsEfectivos } from './objetosEfecto.js';
import { clasesDe, modOf, competencia, nivelTotal, perfil as perfilDe } from './reglas2024.js';
import { reglas, recState, usosGastados } from './rasgos.js';
import { vidaDe, curar, ponerTemporales, pgActuales, pgMaximo, estadoVital } from './vida.js';
import { DADO_ARTES } from './equipo.js';
import { nivelHabilidad } from './habilidades.js';
import { linajeDe } from './especies.js';

// Reglas de clase que la app aplica sola en momentos concretos (Manual del Jugador de 2024):
// al tirar iniciativa, al empezar tu turno y al gastar un uso que cura o da puntos de golpe temporales.
const tirarDado = caras => 1 + Math.floor(Math.random() * caras);
export function tirarExpr(expr, tirar = tirarDado) {
  let total = 0; const partes = [];
  for (const m of String(expr).replace(/\s/g, '').matchAll(/([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g)) {
    if (m[3]) { const n = +(m[2] || 1), vals = Array.from({ length: n }, () => tirar(+m[3])), s = vals.reduce((a, b) => a + b, 0); total += m[1] === '-' ? -s : s; partes.push(vals.join('+')); }
    else if (m[5]) { total += m[4] === '-' ? -m[5] : +m[5]; }
  }
  return { total: Math.max(0, total), detalle: partes.join(' ') };
}
const nivelClase = (ch, clase) => clasesDe(ch).find(c => c.clase === clase)?.nivel || 0;
const subDe = (ch, clase, re) => clasesDe(ch).find(c => c.clase === clase && re.test(norm(c.subclase || '')));
const regla = (ch, id) => reglas(ch).find(r => r.id === id) || null;
const libres = (ch, id) => { const r = regla(ch, id); return r ? r.max - usosGastados(ch, r) : 0; };
const gastar = (ch, id, n = 1) => { const st = recState(ch, id); st.used = (st.used || 0) + n; };

// Al tirar iniciativa. Cambia la ficha y devuelve lo que ha pasado, para contarlo.
export function alTirarIniciativa(ch, tirar = tirarDado) {
  const out = [];
  // Furia persistente (bárbaro 15): recuperas todos los usos de Furia, una vez por descanso largo
  const furia = regla(ch, 'tpl:barbaro.furia');
  if (furia && usosGastados(ch, furia) > 0 && libres(ch, 'tpl:barbaro.persistente') > 0) {
    recState(ch, furia.id).used = 0; gastar(ch, 'tpl:barbaro.persistente');
    out.push({ nombre: 'Furia persistente', texto: `Recuperas todos tus usos de Furia (${furia.max}).` });
  }
  // Metabolismo asombroso (monje 2): recuperas los puntos de concentración y te curas nivel + dado de artes marciales
  const foco = regla(ch, 'tpl:monje.concentracion'), monje = nivelClase(ch, 'Monje');
  let metabolismo = false;
  if (foco && usosGastados(ch, foco) > 0 && libres(ch, 'tpl:monje.metabolismo') > 0) {
    const d = +DADO_ARTES(monje).replace('1d', ''), t = tirar(d);
    recState(ch, foco.id).used = 0; gastar(ch, 'tpl:monje.metabolismo'); metabolismo = true;
    const ganado = estadoVital(ch) === 'muerto' ? 0 : curar(ch, monje + t);
    out.push({ nombre: 'Metabolismo asombroso', texto: `Recuperas tus ${foco.max} puntos de concentración y ${ganado} PG (${monje} + d${d}: ${t}).`, cura: ganado });
  }
  // Concentración perfecta (monje 15): si no usas Metabolismo asombroso, recuperas puntos hasta tener 4
  if (foco && monje >= 15 && !metabolismo && foco.max - usosGastados(ch, foco) < 4) {
    recState(ch, foco.id).used = Math.max(0, foco.max - 4);
    out.push({ nombre: 'Concentración perfecta', texto: 'Recuperas puntos de concentración hasta tener 4.' });
  }
  // Inspiración superior (bardo 18): recuperas usos de Inspiración bárdica hasta tener 2
  const insp = regla(ch, 'tpl:bardo.inspiracion');
  if (insp && nivelClase(ch, 'Bardo') >= 18 && insp.max - usosGastados(ch, insp) < 2) {
    recState(ch, insp.id).used = Math.max(0, insp.max - 2);
    out.push({ nombre: 'Inspiración superior', texto: 'Recuperas usos de Inspiración bárdica hasta tener 2.' });
  }
  // Archidruida (druida 20), Forma salvaje perenne: si no te quedan usos de Forma salvaje, recuperas uno
  const forma = regla(ch, 'tpl:druida.forma');
  if (forma && nivelClase(ch, 'Druida') >= 20 && usosGastados(ch, forma) >= forma.max) { recState(ch, forma.id).used = forma.max - 1; out.push({ nombre: 'Archidruida', texto: 'Recuperas un uso de Forma salvaje.' }); }
  // Don del destino: se recupera al tirar iniciativa
  const destino = regla(ch, 'tpl:dote.destino');
  if (destino && usosGastados(ch, destino) > 0) { recState(ch, destino.id).used = 0; out.push({ nombre: 'Don del destino', texto: 'Vuelves a tenerlo disponible.' }); }
  return out;
}

// Al empezar tu turno (al pasar de ronda en combate)
export function alEmpezarTurno(ch) {
  const out = [], v = vidaDe(ch), g = subDe(ch, 'Guerrero', /campeon/);
  if (estadoVital(ch) !== 'vivo') return out;
  // Heroísmo lanzado por ti mismo: PG temporales iguales a tu modificador de aptitud mágica al empezar cada turno
  if (v.efectos.some(e => e.k === 'heroismo') && norm(ch.play?.conc || '') === 'heroismo') {
    const m = perfilDe(ch).mod || 0; if (m > 0 && ponerTemporales(ch, m)) out.push({ nombre: 'Heroísmo', texto: `Tienes ${v.temp} PG temporales.` });
  }
  if (!g) return out;
  // Guerrero heroico (campeón 10): ganas inspiración heroica si no la tienes
  if (g.nivel >= 10 && !v.inspiracion) { v.inspiracion = true; out.push({ nombre: 'Guerrero heroico', texto: 'Ganas inspiración heroica.' }); }
  // Superviviente (campeón 18), Desafiar a la muerte: si estás maltrecho y te queda algún PG, recuperas 5 + Constitución
  const pg = pgActuales(ch), max = pgMaximo(ch);
  if (g.nivel >= 18 && pg > 0 && pg <= Math.floor(max / 2)) {
    const n = curar(ch, Math.max(0, 5 + modOf(statsEfectivos(ch).con)));
    if (n) out.push({ nombre: 'Superviviente', texto: `Recuperas ${n} PG por estar maltrecho.`, cura: n });
  }
  return out;
}

// Usos que curan o dan PG temporales al gastarse. solo: siempre sobre ti (se aplica solo); si no, se ofrece aplicártelo.
export function curacionDeRecurso(ch, id) {
  const L = k => nivelClase(ch, k), m = k => Math.max(1, modOf(statsEfectivos(ch)[k])), pb = competencia(nivelTotal(ch));
  switch (id) {
    case 'tpl:guerrero.energias': return { tipo: 'cura', expr: `1d10+${L('Guerrero')}`, solo: true };
    case 'tpl:fanatico.dioses': return { tipo: 'cura', expr: '1d12', solo: true };
    case 'tpl:dote.vitalidad': return { tipo: 'cura', expr: '1d10', solo: true };
    case 'tpl:manoabierta.plenitud': return { tipo: 'cura', expr: `${DADO_ARTES(L('Monje'))}+${m('sab')}`, solo: true };
    case 'tpl:explorador.infatigable': return { tipo: 'temp', expr: `1d8+${m('sab')}`, solo: true };
    case 'tpl:especie.adrenalina': return { tipo: 'temp', expr: String(pb), solo: true };
    case 'tpl:celestial.luz': return { tipo: 'cura', expr: '1d6', solo: false };
    case 'tpl:especie.manos': return { tipo: 'cura', expr: `${pb}d4`, solo: false };
    default: return null;
  }
}
// Aplica la curación o los temporales de un uso recién gastado
export function aplicarCuracion(ch, c, tirar = tirarDado) {
  const r = tirarExpr(c.expr, tirar);
  const n = c.tipo === 'temp' ? ponerTemporales(ch, r.total) : curar(ch, r.total);
  return { ...r, aplicado: n };
}

// Rango de crítico de tus ataques con arma: Crítico mejorado (campeón 3) y Crítico superior (campeón 15)
export function rangoCritico(ch) {
  const g = subDe(ch, 'Guerrero', /campeon/);
  return !g || g.nivel < 3 ? 20 : g.nivel >= 15 ? 18 : 19;
}
// Talentos fiables (pícaro 7): en las pruebas de habilidad con competencia, un 9 o menos en el d20 cuenta como 10
export const minimoD20Habilidad = (ch, hab) => (nivelClase(ch, 'Pícaro') >= 7 && nivelHabilidad(ch, hab) >= 1 ? 10 : 0);

// Árbol del Mundo (bárbaro 3), Vitalidad del árbol: al entrar en furia ganas PG temporales iguales a tu nivel de bárbaro
export function temporalesAlEnfurecer(ch) {
  const b = subDe(ch, 'Bárbaro', /arbol/); return b && b.nivel >= 3 ? b.nivel : 0;
}
// Poderío indómito (bárbaro 18): en pruebas y salvaciones de Fuerza, si el total es menor que tu Fuerza, usas tu Fuerza
export const totalMinimoFuerza = (ch, ab) => (ab === 'fue' && nivelClase(ch, 'Bárbaro') >= 18 ? parseInt(statsEfectivos(ch).fue, 10) || 0 : 0);

// Efectos de gastar un uso que cambian otros contadores de la ficha. Devuelve lo que ha pasado.
export function alGastarRecurso(ch, id) {
  const out = [];
  const P = perfilDe(ch);
  // Astucia mágica (brujo 2): recuperas espacios de pacto hasta la mitad del máximo (todos con Maestro sobrenatural, 20)
  if (id === 'tpl:brujo.astucia' && P.pact) {
    const L = P.pact.level, usados = Math.min(ch.play.used?.[L] || 0, P.pact.n), n = Math.min(usados, nivelClase(ch, 'Brujo') >= 20 ? P.pact.n : Math.ceil(P.pact.n / 2));
    if (n) { ch.play.used[L] = (ch.play.used[L] || 0) - n; out.push(`Recuperas ${n} ${n === 1 ? 'espacio' : 'espacios'} de pacto.`); }
    else out.push('No tenías espacios de pacto gastados.');
    const celestial = subDe(ch, 'Brujo', /celestial/);
    if (celestial && celestial.nivel >= 10) { const t = celestial.nivel + modOf(statsEfectivos(ch).car); if (ponerTemporales(ch, t)) out.push(`Resiliencia celestial: ${t} PG temporales.`); }
  }
  // Recuperación mágica (hechicero 5): recuperas puntos de hechicería hasta la mitad de tu nivel
  if (id === 'tpl:hechicero.recuperacion') {
    const r = regla(ch, 'tpl:hechicero.puntos');
    if (r) { const n = Math.min(usosGastados(ch, r), Math.floor(nivelClase(ch, 'Hechicero') / 2)); recState(ch, r.id).used = usosGastados(ch, r) - n; out.push(`Recuperas ${n} puntos de hechicería.`); }
  }
  // Ataque de aliento (dracónido): CD 8 + Con + competencia, 1d10 a 4d10 del tipo de su linaje
  if (id === 'tpl:especie.aliento') { const a = alientoDe(ch); out.push(`Salvación de Destreza CD ${a.cd}: ${a.dado}${a.tipo ? ` de ${a.tipo}` : ''}, mitad si la supera.`); }
  // Forma salvaje (druida 2): PG temporales iguales a tu nivel de druida (el triple con Formas del círculo, luna 3)
  if (id === 'tpl:druida.forma') {
    const L = nivelClase(ch, 'Druida'), luna = subDe(ch, 'Druida', /luna/), t = luna && luna.nivel >= 3 ? 3 * L : L;
    if (ponerTemporales(ch, t)) out.push(`Ganas ${t} PG temporales al transformarte.`);
    out.push(`Dura ${Math.floor(L / 2)} ${Math.floor(L / 2) === 1 ? 'hora' : 'horas'}.${luna && luna.nivel >= 3 ? ` Tu CA es al menos ${13 + modOf(statsEfectivos(ch).sab)}.` : ''}`);
  }
  return out;
}
// Armadura de Agathys: 5 PG temporales por nivel del espacio
// Escarcha del cazador (caminante invernal 3): al lanzar Marca del cazador, 1d10 + nivel de explorador
export function temporalesDeConjuro(nombre, L, ch = null, tirar = tirarDado) {
  const n = norm(nombre);
  if (n === 'armadura de agathys') return 5 * Math.max(1, L || 1);
  const inv = ch && subDe(ch, 'Explorador', /invernal/);
  if (n === 'marca del cazador' && inv && inv.nivel >= 3) return tirar(10) + inv.nivel;
  return 0;
}
// Resiliencia celestial (celestial 10): al terminar un descanso corto o largo ganas nivel de brujo + Carisma PG temporales
export function temporalesAlDescansar(ch) {
  const c = subDe(ch, 'Brujo', /celestial/); return c && c.nivel >= 10 ? c.nivel + modOf(statsEfectivos(ch).car) : 0;
}

// Superviviente (campeón 18), Desafiar a la muerte: un 18-20 en la salvación contra muerte cuenta como un 20
export const rangoMuerte = ch => { const g = subDe(ch, 'Guerrero', /campeon/); return g && g.nivel >= 18 ? 18 : 20; };
// Mareas del caos (magia salvaje 3): se restablece al lanzar un conjuro de hechicero con espacio (y entonces tiras en la tabla de sobrecarga)
export function alLanzarConEspacio(ch, fuente = '') {
  const out = [], r = regla(ch, 'tpl:salvaje.mareas');
  if (r && usosGastados(ch, r) > 0 && (!fuente || /hechicer|drac|salvaje/i.test(norm(fuente)) || !/mago|clerigo|druida|bardo|brujo|paladin|explorador|dote/.test(norm(fuente)))) {
    recState(ch, r.id).used = 0; out.push('Mareas del caos se restablece: tira en la tabla de sobrecarga de magia salvaje.');
  }
  return out;
}

export function alientoDe(ch) {
  const L = nivelTotal(ch), pb = competencia(L), tipo = linajeDe(ch, 'especie.draconido')?.dano || '';
  return { cd: 8 + modOf(statsEfectivos(ch).con) + pb, dado: `${[1, 5, 11, 17].filter(x => L >= x).length}d10`, tipo };
}
