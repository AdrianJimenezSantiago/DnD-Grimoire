import { norm } from '../../core/util.js';

// Orden divina (clérigo) y Orden primigenia (druida), Manual del Jugador de 2024: se eligen a nivel 1 de la clase
export const ORDENES = {
  'Clérigo': { rasgo: 'Orden divina', opciones: [
    { nombre: 'Protector', marciales: true, armadura: 'pesada', texto: 'Competencia con armas marciales y entrenamiento con armaduras pesadas.' },
    { nombre: 'Taumaturgo', truco: 1, habilidades: ['arcanos', 'religion'], texto: 'Un truco de clérigo más, y sumas tu modificador de Sabiduría (mínimo +1) a las pruebas de Inteligencia (Conocimiento arcano y Religión).' },
  ] },
  'Druida': { rasgo: 'Orden primigenia', opciones: [
    { nombre: 'Guardián', marciales: true, armadura: 'media', texto: 'Competencia con armas marciales y entrenamiento con armaduras medias.' },
    { nombre: 'Naturalista', truco: 1, habilidades: ['arcanos', 'naturaleza'], texto: 'Un truco de druida más, y sumas tu modificador de Sabiduría (mínimo +1) a las pruebas de Inteligencia (Conocimiento arcano y Naturaleza).' },
  ] },
};

export function normOrdenes(x) {
  const out = {};
  for (const [clase, v] of Object.entries(x && typeof x === 'object' ? x : {})) {
    const o = ORDENES[clase]?.opciones.find(op => norm(op.nombre) === norm(v));
    if (o) out[clase] = o.nombre;
  }
  return out;
}
export const ordenDe = (ch, clase) => ORDENES[clase]?.opciones.find(o => o.nombre === ch.ordenes?.[clase]) || null;
// Clases del personaje que tienen orden y aún no la han elegido
export const ordenesPendientes = (ch, clases) => clases.filter(c => ORDENES[c] && !ordenDe(ch, c));
