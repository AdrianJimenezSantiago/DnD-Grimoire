// Rasgos de clase con dos variantes a elegir: Golpes benditos (clérigo) y Furia elemental (druida).
import { norm } from '../../core/util.js';
import { statsEfectivos } from '../equipo/objetosEfecto.js';
import { clasesDe, modOf } from '../reglas/reglas2024.js';

// Rasgos de clase con dos variantes que se eligen al aprenderlos (Manual del Jugador de 2024):
// Golpes benditos (clérigo 7) y Furia elemental (druida 7). La mejora de nivel 14/15 sigue a la variante elegida.
export const VARIANTES = {
  'Clérigo': { rasgo: 'Golpes benditos', nivel: 7, mejora: 14, opciones: [
    { nombre: 'Golpe divino', ef: 'golpe', tipos: 'necrótico o radiante',
      texto: 'Una vez en cada uno de tus turnos, cuando impactes a una criatura con una tirada de ataque con un arma, puedes hacerle 1d8 de daño necrótico o radiante adicional (a tu elección). A nivel 14 pasa a 2d8.' },
    { nombre: 'Lanzamiento potente', ef: 'potente',
      texto: 'Sumas tu modificador de Sabiduría al daño que hagas con cualquier truco de clérigo. A nivel 14, cuando hagas daño con uno, también puedes dar puntos de golpe temporales iguales al doble de tu modificador de Sabiduría a ti o a una criatura a 18 m.' },
  ] },
  'Druida': { rasgo: 'Furia elemental', nivel: 7, mejora: 15, opciones: [
    { nombre: 'Lanzamiento potente', ef: 'potente',
      texto: 'Sumas tu modificador de Sabiduría al daño que hagas con cualquier truco de druida. A nivel 15, tus trucos con alcance de 3 m o más ganan 90 m de alcance.' },
    { nombre: 'Golpe primigenio', ef: 'golpe', tipos: 'de frío, fuego, relámpago o trueno',
      texto: 'Una vez en cada uno de tus turnos, cuando impactes a una criatura con una tirada de ataque con un arma o con el ataque de una bestia en Forma salvaje, puedes hacerle 1d8 de daño de frío, fuego, relámpago o trueno adicional (a tu elección). A nivel 15 pasa a 2d8.' },
  ] },
};

export function normVariantes(x) {
  const out = {};
  for (const [clase, v] of Object.entries(x && typeof x === 'object' ? x : {})) {
    const o = VARIANTES[clase]?.opciones.find(op => norm(op.nombre) === norm(v));
    if (o) out[clase] = o.nombre;
  }
  return out;
}
export const varianteDe = (ch, clase) => VARIANTES[clase]?.opciones.find(o => o.nombre === ch.variantes?.[clase]) || null;
// Clases del personaje que ya tienen el rasgo y aún no han elegido variante
export const variantesPendientes = ch => clasesDe(ch).filter(c => VARIANTES[c.clase] && c.nivel >= VARIANTES[c.clase].nivel && !varianteDe(ch, c.clase)).map(c => c.clase);

// Golpe divino / Golpe primigenio: el dado extra que se añade una vez por turno a los ataques con arma
export function golpeExtra(ch) {
  const out = [];
  for (const c of clasesDe(ch)) {
    const def = VARIANTES[c.clase], v = varianteDe(ch, c.clase);
    if (!def || c.nivel < def.nivel || v?.ef !== 'golpe') continue;
    out.push({ nombre: v.nombre, dado: c.nivel >= def.mejora ? '2d8' : '1d8', tipos: v.tipos });
  }
  return out;
}

// Lanzamiento potente: suma la Sabiduría al daño de los trucos de esa clase.
// Un truco es de la clase si su fuente la nombra o no nombra otra (dotes, especie u otra lista).
const OTRAS = /bardo|brujo|pacto|hechicer|mago|libro|explorador|paladin|guerrero|picaro|caballero|embaucador|dote|iniciado|especie|estilo|guerrero bendito|guerrero druidico|elfo|gnomo|tiefling|aasimar|drac/;
export function trucoPotente(ch, fuente = '') {
  const f = norm(fuente);
  for (const c of clasesDe(ch)) {
    const def = VARIANTES[c.clase], v = varianteDe(ch, c.clase);
    if (!def || c.nivel < def.nivel || v?.ef !== 'potente') continue;
    const clase = norm(c.clase);
    if (f.includes(clase) || !(OTRAS.test(f) || /clerigo|druida/.test(f))) return { bono: modOf(statsEfectivos(ch).sab), fuente: `${v.nombre} (${def.rasgo})` };
  }
  return null;
}
