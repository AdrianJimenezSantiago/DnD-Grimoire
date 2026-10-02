// Libros importados: la lista de libros cargados y lo que traen (objetos, dotes, trasfondos, subclases, especies,
// criaturas). fijarLibros() reparte su contenido: textos y conjuros nuevos al catálogo, términos al glosario.
import { norm } from '../../core/util.js';
import { CLASES } from '../reglas/reglas2024.js';
import { fijarTextosManual, fijarConjurosDeLibros } from '../conjuros/catalogo.js';
import { fijarGlosario } from './terminos.js';

let LIBROS = [], SUBS = {};
let BIB = { objetos: [], dotes: [], trasfondos: [], subclases: [], rasgosClase: [], especies: [], criaturas: [] };
export function fijarLibros(libros) {
  LIBROS = libros || [];
  const textos = {}, glos = [], vistosG = new Set(); SUBS = {};
  for (const lb of LIBROS) {
    for (const [k, v] of Object.entries(lb.textos || {})) if (!textos[k]) textos[k] = v;
    for (const e of lb.glosario || []) if (!vistosG.has(e.clave)) { vistosG.add(e.clave); glos.push(e); }
    for (const sc of lb.subclases || []) if (sc.clase) (SUBS[sc.clase] ||= new Set()).add(sc.nombre);
  }
  fijarTextosManual(textos); fijarGlosario(glos); fijarConjurosDeLibros(LIBROS.flatMap(lb => lb.nuevos || []));
  const junta = campo => { const m = new Map(); for (const lb of LIBROS) for (const e of lb[campo] || []) { const k = (e.clase ? e.clase + '|' : '') + e.clave; if (e.clave && !m.has(k)) m.set(k, { ...e, fuente: lb.titulo, libro: lb.id }); } return [...m.values()]; };
  BIB = { objetos: junta('objetos'), dotes: junta('dotes'), trasfondos: junta('trasfondos'), subclases: junta('subTextos'), rasgosClase: junta('rasgosClase'), especies: junta('especies'), criaturas: junta('criaturas') };
}
export const criaturaImportada = k => BIB.criaturas.find(c => c.clave === k) || BIB.criaturas.find(c => norm(c.nombre) === norm(k)) || null;
export const biblioteca = () => BIB;
export const libros = () => LIBROS;
export const subclasesDe = clase => [...new Set([...(CLASES[clase]?.subs || []), ...(SUBS[clase] || [])])];
