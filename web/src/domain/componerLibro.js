import { emparejarLibro, subclasesDe } from './catalogo.js';
import { CLASES_ES, idLibro } from './libros.js';
import { claveNombre } from './manual.js';

export function tituloLibro(r) {
  const provisional = emparejarLibro(r.spells, 'x', r.titulo);
  if (Object.keys(provisional.textos).length >= 300 && provisional.nuevos.length <= 5) return 'Manual del Jugador (2024)';
  if (r.objetos.length >= 200 && r.glosario.some(e => e.cat === 'Herramientas del DM')) return 'Guía del Dungeon Master (2024)';
  if (/h[ée]roes de faer[uú]n/i.test(r.titulo) || ['Hojacantante', 'Caminante invernal', 'Abanderado'].every(n => r.subTextos.some(x => x.nombre === n))) return 'Reinos Olvidados: Héroes de Faerûn';
  if (r.criaturas.length >= 150 && !r.spells.length) return 'Manual de Monstruos (2025)';
  return r.titulo;
}
export const hayContenido = r => !!(r.spells.length || r.glosario.length || r.subclases.length || r.objetos.length || r.dotes.length || r.trasfondos.length || r.criaturas.length);

const lev = (a, b) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
export function propuestasSubclase(detectadas) {
  const conocidas = CLASES_ES.flatMap(c => subclasesDe(c)).map(claveNombre);
  return detectadas.filter(sc => {
    const k = claveNombre(sc.nombre);
    return !conocidas.some(c => c === k || lev(c, k) <= 2 || c.startsWith(k));
  }).map(sc => {
    const ws = sc.nombre.split(/\s+/), menores = ['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o'];
    return { ...sc, ok: !!sc.clase && ws.every(w => w.length >= 3 || menores.includes(w.toLowerCase())) && ws.some(w => w.length >= 5) };
  });
}
export function componerLibro(r, fecha = Date.now()) {
  const titulo = tituloLibro(r), id = idLibro(titulo), { textos, nuevos } = emparejarLibro(r.spells, id, titulo);
  const lb = { id, titulo, fecha, textos, nuevos, glosario: r.glosario, subclases: [], objetos: r.objetos, dotes: r.dotes, trasfondos: r.trasfondos,
    subTextos: r.subTextos, rasgosClase: r.rasgosClase, especies: r.especies, criaturas: r.criaturas };
  const props = propuestasSubclase(r.subclases), sinNombre = r.trasfondos.filter(t => t.revisar).length + r.subTextos.filter(t => t.revisar).length;
  return { lb, props, sinNombre };
}
export const aceptarPropuestas = (lb, props) => ({ ...lb, subclases: props.filter(p => p.ok).map(({ clase, nombre }) => ({ clase, nombre })) });
