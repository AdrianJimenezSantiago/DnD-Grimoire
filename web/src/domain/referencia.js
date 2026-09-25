export const ECONOMIA_INFO = {
  accion: { titulo: 'Acción', texto: 'Una por turno. Lo que puedes hacer con ella:', lista: [
    ['Atacar', 'Un ataque con un arma o sin armas (más si tienes Ataque adicional).'], ['Magia', 'Lanzar un conjuro de 1 acción o usar un objeto mágico.'],
    ['Correr', 'Ganas movimiento extra igual a tu velocidad.'], ['Destrabarse', 'Tu movimiento no provoca ataques de oportunidad este turno.'],
    ['Esquivar', 'Los ataques contra ti tienen desventaja y tus salvaciones de Destreza, ventaja, hasta tu siguiente turno.'],
    ['Ayudar', 'Das ventaja a un aliado en su próxima prueba o en su ataque contra un enemigo a 1,5 m de ti.'], ['Esconderse', 'Prueba de Destreza (Sigilo) CD 15 sin que te vean.'],
    ['Buscar', 'Prueba de Sabiduría para detectar algo.'], ['Estudiar', 'Prueba de Inteligencia para recordar o analizar algo.'],
    ['Influir', 'Prueba de Carisma (o Sabiduría con animales) para convencer a alguien.'], ['Preparar', 'Eliges un desencadenante y respondes con tu reacción cuando ocurra.'],
    ['Usar un objeto', 'Usar un objeto no mágico que requiera una acción.']] },
  adicional: { titulo: 'Acción adicional', texto: 'Solo si un rasgo, conjuro u otra regla te lo permite. Como mucho una por turno, y tú decides cuándo dentro del turno.', lista: [
    ['Ataque con dos armas', 'Tras atacar con un arma Ligera, un ataque con otra arma Ligera (sin sumar el modificador al daño).'], ['Conjuros', 'Los de 1 acción adicional; ese turno solo puedes lanzar además un truco de 1 acción.']] },
  reaccion: { titulo: 'Reacción', texto: 'Una por ronda, en tu turno o en el de otro. La recuperas al empezar tu turno.', lista: [
    ['Ataque de oportunidad', 'Un ataque cuerpo a cuerpo cuando un enemigo que ves sale de tu alcance.'], ['Conjuros', 'Los de 1 reacción, como Escudo o Contrahechizo.'], ['Preparar', 'La acción que preparaste se resuelve con tu reacción.']] },
  movimiento: { titulo: 'Movimiento', texto: 'Hasta tu velocidad en cada turno, y puedes repartirlo antes y después de tus acciones.', lista: [
    ['Terreno difícil', 'Cada metro cuesta uno más.'], ['Levantarse', 'Cuesta la mitad de tu velocidad.'], ['Trepar, nadar, arrastrarse', 'Cada metro cuesta uno más si no tienes una velocidad propia para ello.'],
    ['Saltar', 'Largo: tanto como tu Fuerza en pies (con carrerilla de 3 m). Alto: 3 + mod. de Fuerza en pies.']] },
};

export const PROPIEDADES = {
  alcance: 'Suma 1,5 m a tu alcance cuando atacas con ella, también en los ataques de oportunidad.',
  arrojadiza: 'Puedes lanzarla para hacer un ataque a distancia con la misma característica que en cuerpo a cuerpo. Sacarla forma parte del ataque.',
  carga: 'Solo puedes hacer un ataque con ella por acción, acción adicional o reacción, aunque tengas más ataques.',
  'dos manos': 'Necesitas las dos manos para atacar con ella.',
  ligera: 'Al atacar con ella con la acción de Ataque, puedes hacer un ataque extra como acción adicional con otra arma Ligera, sin sumar tu modificador al daño salvo que sea negativo.',
  municion: 'Necesitas munición para atacar; sacarla forma parte del ataque. Tras el combate recuperas la mitad de la gastada dedicando un minuto.',
  pesada: 'Tienes desventaja si tu Fuerza (cuerpo a cuerpo) o tu Destreza (a distancia) es menor que 13.',
  sutil: 'Usas Fuerza o Destreza, a tu elección, para el ataque y el daño.',
  versatil: 'Con las dos manos usa el dado de daño que aparece entre paréntesis.',
  recarga: 'Solo puedes disparar una vez por acción, acción adicional o reacción.',
};
export const MAESTRIAS = {
  debilitar: 'Si impactas, el objetivo tiene desventaja en su siguiente tirada de ataque antes del inicio de tu siguiente turno.',
  derribar: 'Si impactas, el objetivo hace una salvación de Constitución (CD 8 + el modificador del ataque + tu competencia) o queda derribado.',
  empujar: 'Si impactas, puedes empujar al objetivo hasta 3 m en línea recta alejándolo de ti, si es Grande o más pequeño.',
  hendir: 'Si impactas en cuerpo a cuerpo, puedes atacar a otra criatura a 1,5 m de la primera y a tu alcance, sin sumar tu modificador al daño salvo que sea negativo. Una vez por turno.',
  irritar: 'Si impactas y haces daño, tienes ventaja en tu siguiente ataque contra esa criatura antes del final de tu siguiente turno.',
  mella: 'El ataque extra de la propiedad Ligera forma parte de la acción de Ataque en vez de gastar tu acción adicional. Una vez por turno.',
  ralentizar: 'Si impactas y haces daño, la velocidad del objetivo baja 3 m hasta el inicio de tu siguiente turno (no se acumula).',
  rozar: 'Si fallas, el objetivo recibe igualmente daño igual al modificador de la característica del ataque, del mismo tipo que el arma.',
};
const clave = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s*\(.*$/, '').trim();
export const textoPropiedad = p => PROPIEDADES[clave(p)] || '';
export const textoMaestria = m => MAESTRIAS[clave(m)] || '';
