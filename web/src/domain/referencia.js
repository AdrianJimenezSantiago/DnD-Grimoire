// Resúmenes de la app (Manual del Jugador 2024) para cuando no hay manual importado; con él, cada término enlaza a su regla completa
export const ECONOMIA_INFO = {
  accion: { titulo: 'Acción', texto: 'Una por turno. Lo que puedes hacer con ella:', lista: [
    ['Atacar', 'Un ataque con un arma o sin armas (más si tienes Ataque adicional). Con cada ataque puedes desenvainar o envainar un arma.'],
    ['Magia', 'Lanzar un conjuro de 1 acción, usar un objeto mágico o un rasgo mágico.'],
    ['Correr', 'Ganas movimiento extra igual a tu velocidad.'], ['Destrabarse', 'Tu movimiento no provoca ataques de oportunidad este turno.'],
    ['Esquivar', 'Hasta tu siguiente turno, los ataques contra ti tienen desventaja y tus salvaciones de Destreza, ventaja. Se pierde si quedas incapacitado o tu velocidad es 0.'],
    ['Ayudar', 'Das ventaja a un aliado en su próxima prueba con una habilidad o herramienta que domines, o en su ataque contra un enemigo a 1,5 m de ti. También estabiliza a quien está a 0 PG (Medicina CD 10).'],
    ['Esconderse', 'Prueba de Destreza (Sigilo) CD 15, muy oscurecido o tras cobertura de tres cuartos o total y fuera de la vista de tus enemigos.'],
    ['Buscar', 'Prueba de Sabiduría para detectar algo.'], ['Estudiar', 'Prueba de Inteligencia para recordar o analizar algo.'],
    ['Influir', 'Prueba de Carisma (o de Sabiduría con animales) para convencer a alguien.'], ['Preparar', 'Eliges un desencadenante y respondes con tu reacción cuando ocurra.'],
    ['Usar un objeto', 'Usar un objeto no mágico que requiera una acción.']] },
  adicional: { titulo: 'Acción adicional', texto: 'Solo si un rasgo, conjuro u otra regla te lo permite. Como mucho una por turno, y tú decides cuándo dentro del turno.', lista: [
    ['Ataque con dos armas', 'Tras atacar con un arma Ligera con la acción de Ataque, un ataque con otra arma Ligera (sin sumar el modificador al daño salvo que sea negativo).'],
    ['Conjuros', 'Los de 1 acción adicional. En un turno solo puedes gastar un espacio de conjuro: el otro conjuro que lances tendrá que ser un truco o no gastar espacio.'],
    ['Beber una poción', 'Beber una poción o dársela a otra criatura a tu alcance.']] },
  reaccion: { titulo: 'Reacción', texto: 'Una por ronda, en tu turno o en el de otro. La recuperas al empezar tu turno.', lista: [
    ['Ataque de oportunidad', 'Un ataque cuerpo a cuerpo cuando una criatura que ves sale de tu alcance.'], ['Conjuros', 'Los de 1 reacción, como Escudo o Contrahechizo.'], ['Preparar', 'La acción que preparaste se resuelve con tu reacción.']] },
  movimiento: { titulo: 'Movimiento', texto: 'Hasta tu velocidad en cada turno, y puedes repartirlo antes y después de tus acciones.', lista: [
    ['Terreno difícil', 'Cada metro cuesta uno más.'], ['Levantarse', 'Cuesta la mitad de tu velocidad.'], ['Trepar, nadar, arrastrarse', 'Cada metro cuesta uno más si no tienes una velocidad propia para ello.'],
    ['Saltar', 'Largo: 30 cm por cada punto de Fuerza. Alto: 90 cm más 30 cm por cada punto de modificador de Fuerza. Con 3 m de carrerilla; sin ella, la mitad.']] },
};
// Salto con carrerilla en metros (1 pie = 30 cm): largo = Fuerza × 0,3; alto = (3 + mod. de Fuerza) × 0,3
export const salto = fue => ({ largo: Math.max(0, fue) * 0.3, alto: Math.max(0, 3 + Math.floor((fue - 10) / 2)) * 0.3 });

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
  distancia: 'Dos cifras: la distancia normal y la larga. Más allá de la normal atacas con desventaja; más allá de la larga, no puedes.',
  recarga: 'Solo puedes disparar una vez por acción, acción adicional o reacción.',
};
export const MAESTRIAS = {
  debilitar: 'Si impactas, el objetivo tiene desventaja en su siguiente tirada de ataque antes del inicio de tu siguiente turno.',
  derribar: 'Si impactas, el objetivo hace una salvación de Constitución (CD 8 + el modificador de característica del ataque + tu bonificador por competencia) o queda derribado.',
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
