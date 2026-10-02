// Usar un consumible: pociones, venenos y objetos de un solo uso, con su efecto en la vida del personaje.
import { norm } from '../../core/util.js';
import { equipoDe, curacionDe, cambiarCantidad } from './equipo.js';
import { vidaDe, curar, ponerTemporales, ponerEfecto, aplicarDano } from '../combate/vida.js';
import { resistenciasDe } from '../combate/efectos.js';
import { tirarExpr } from '../combate/automatismos.js';
import { ABIL_NAME } from '../reglas/reglas2024.js';

// Qué pasa al beber cada poción de la Guía del Dungeon Master de 2024 (las que la hoja puede aplicar)
const GIGANTE = [[/colinas/, 21], [/escarcha|piedra/, 23], [/fuego/, 25], [/nubes/, 27], [/tormentas/, 29]];
const POCIONES = [
  [/^pocion de heroismo/, { temp: 10, efecto: 'bendicion', rondas: 600, texto: '10 PG temporales y Bendición durante 1 hora, sin concentración.' }],
  [/^pocion de invulnerabilidad/, { efecto: 'invulnerable', texto: 'Resistencia a todo el daño durante 1 minuto.' }],
  [/^pocion de velocidad/, { efecto: 'acelerar', rondas: 10, texto: 'Acelerar durante 1 minuto, sin concentración ni somnolencia al acabar.' }],
  [/^pocion de vuelo/, { efecto: 'volar', rondas: 600, texto: 'Velocidad volando igual a tu velocidad durante 1 hora.' }],
  [/^pocion de invisibilidad mejorada/, { efecto: 'invismejor', rondas: 600, texto: 'Invisible durante 1 hora, aunque ataques o lances conjuros.' }],
  [/^pocion de invisibilidad/, { efecto: 'invisible', rondas: 600, texto: 'Invisible durante 1 hora o hasta que ataques, hagas daño o lances un conjuro.' }],
  [/^pocion de crecimiento/, { efecto: 'agrandar', rondas: 100, texto: 'Agrandar durante 10 minutos, sin concentración.' }],
  [/^pocion de encoger/, { efecto: 'reducir', horas: '1d4', texto: 'Reducir durante 1d4 horas, sin concentración.' }],
  [/^pocion de trepar/, { efecto: 'trepar', texto: 'Velocidad trepando y ventaja en Atletismo para trepar durante 1 hora.' }],
  [/^pocion de pugilismo/, { efecto: 'pugilismo', texto: '+1d6 de daño de fuerza con los golpes sin armas durante 10 minutos.' }],
  [/^pocion de resistencia/, { efecto: 'resistenciapocion', texto: 'Resistencia al tipo de daño de la poción durante 1 hora.' }],
  [/^pocion de fuerza de gigante/, { fuerza: true, texto: 'Tu Fuerza cambia durante 1 hora.' }],
  [/^pocion de veneno/, { dano: '4d6', tipo: 'veneno', texto: 'Era veneno: haz una salvación de Constitución CD 13 o quedas envenenado 1 hora.' }],
  [/^pocion de vitalidad/, { agotamiento: true, quitar: ['envenenado'], texto: 'Sin cansancio ni veneno; 24 horas recuperando el máximo de cada dado de golpe que gastes.' }],
  [/^elixir de salud/, { quitar: ['cegado', 'ensordecido', 'envenenado', 'paralizado'], texto: 'Curas las enfermedades mágicas y dejas de estar cegado, ensordecido, envenenado y paralizado.' }],
  [/^ung(u|ü)ento de keoghtom/, { quitar: ['envenenado'], texto: 'Dejas de estar envenenado.' }],
];
// Manuales y tomos: +2 permanente a una característica, hasta 30; luego pierden su magia durante un siglo
const LIBROS = [[/^manual de la salud corporal/, 'con'], [/^manual de rapidez de accion/, 'des'], [/^manual del ejercicio beneficioso/, 'fue'],
  [/^tomo de entendimiento/, 'sab'], [/^tomo de liderazgo e influencia/, 'car'], [/^tomo de pensamiento claro/, 'int']];
export const libroDe = o => LIBROS.find(([r]) => r.test(norm(o?.nombre || '')))?.[1] || '';
const pocionDe = o => POCIONES.find(([r]) => r.test(norm(o?.nombre || '')))?.[1] || null;
// Lo que la hoja aplica sola al usarlo ('' si solo se gasta y el efecto se consulta)
export const efectoAlUsar = o => (curacionDe(o) ? `cura ${curacionDe(o)}${pocionDe(o)?.texto ? `; ${pocionDe(o).texto}` : ''}` : pocionDe(o)?.texto || '');

// Cómo se usa: beber (pociones y curación), leer (manuales) o gastar uno (consumibles); null si no se gasta
export function usoDe(o) {
  if (!o || o.guardado) return null;
  const k = libroDe(o);
  if (k) return o.gastado ? null : { accion: 'leer', etiqueta: `Leer (+2 ${ABIL_NAME[k]})` };
  if (curacionDe(o)) return { accion: 'beber', etiqueta: /^ung/.test(norm(o.nombre)) ? `Aplicar (${curacionDe(o)})` : `Beber (${curacionDe(o)})` };
  if (o.cat === 'consumible' && /^(pocion|elixir|filtro|aceite)/.test(norm(o.nombre))) return { accion: 'beber', etiqueta: /^aceite/.test(norm(o.nombre)) ? 'Usar' : 'Beber' };
  if (o.cat === 'consumible' || o.cat === 'comida') return { accion: 'usar', etiqueta: 'Usar uno' };
  return null;
}

// Gasta el objeto y aplica lo que la hoja sabe aplicar. Devuelve qué ha pasado, para contarlo.
export function usarObjeto(ch, id, tirar) {
  const o = equipoDe(ch).objetos.find(x => x.id === id); if (!o) return null;
  const uso = usoDe(o); if (!uso || (uso.accion !== 'leer' && !o.cantidad)) return null;
  const out = { o, accion: uso.accion, curado: 0, tirada: null, temp: 0, efecto: '', dano: 0, quitados: [], stat: null, texto: '' };
  const k = libroDe(o);
  if (k) {
    const antes = parseInt(ch.stats?.[k], 10) || 10;
    ch.stats = { ...(ch.stats || {}), [k]: Math.min(30, antes + 2) };
    o.gastado = true; o.notas = [o.notas, 'Leído: pierde su magia durante un siglo.'].filter(Boolean).join(' ');
    out.stat = { k, antes, despues: ch.stats[k] };
    out.texto = `${ABIL_NAME[k]} ${antes} → ${ch.stats[k]} (máximo 30).`;
    return out;
  }
  cambiarCantidad(ch, id, -1);
  const cura = curacionDe(o);
  if (cura) { out.tirada = tirarExpr(cura, tirar); out.curado = curar(ch, out.tirada.total); }
  const p = pocionDe(o); if (!p) return out;
  const v = vidaDe(ch), n = norm(o.nombre);
  if (p.temp) out.temp = ponerTemporales(ch, p.temp);
  if (p.fuerza) { const g = GIGANTE.find(([r]) => r.test(n)); if (g) { out.efecto = `pfg${g[1]}`; ponerEfecto(ch, out.efecto); out.texto = `Tu Fuerza es ${g[1]} durante 1 hora.`; } else out.texto = 'Elige el tipo de gigante en el nombre de la poción para aplicarla.'; }
  if (p.efecto) {
    out.efecto = p.efecto;
    const rondas = p.horas ? tirarExpr(p.horas, tirar).total * 600 : p.rondas;
    ponerEfecto(ch, p.efecto, { ...(rondas ? { rondas } : {}), ...(p.efecto === 'resistenciapocion' ? { nombre: o.nombre } : {}) });
  }
  if (p.dano) {
    const t = tirarExpr(p.dano, tirar), res = resistenciasDe(ch).some(r => r.tipo === p.tipo && !/inmunidad/.test(r.fuente)), inm = resistenciasDe(ch).some(r => r.tipo === p.tipo && /inmunidad/.test(r.fuente));
    out.dano = inm ? 0 : res ? Math.floor(t.total / 2) : t.total; out.tirada = t;
    if (out.dano) aplicarDano(ch, out.dano);
  }
  if (p.agotamiento) v.agotamiento = 0;
  if (p.quitar) { out.quitados = v.estados.filter(e => p.quitar.includes(e)); v.estados = v.estados.filter(e => !p.quitar.includes(e)); }
  out.texto ||= p.texto;
  return out;
}
