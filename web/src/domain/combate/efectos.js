// Efectos activos (conjuros, estados, rasgos) y lo que cambian: ventaja, desventaja, CA, velocidad, daño extra.
import { norm, uid } from '../../core/util.js';
import { statsEfectivos, pasivosObjetos, resistenciasObjetos } from '../equipo/objetosEfecto.js';
import { claseArmadura, penalizacionArmadura } from '../equipo/equipo.js';
import { velocidad, abDe } from '../reglas/habilidades.js';
import { clasesDe, modOf, dotesDe, competencia, nivelTotal } from '../reglas/reglas2024.js';
import { armadurasDe } from '../reglas/competencias.js';
import { resistenciasEspecie } from '../origen/especies.js';
import { pgMaximo, pgActuales } from './vida.js';
import { opcionDe } from '../clases/opcionesRasgo.js';

const R = (sobre, efecto, extra = {}) => ({ sobre, efecto, ...extra });
export const REGLAS_ESTADO = {
  agarrado: { vel0: true, reglas: [R('ataque', 'desventaja', { cond: 'si atacas a alguien que no sea quien te agarra' })] },
  apresado: { vel0: true, reglas: [R('ataque', 'desventaja'), R('salvacion', 'desventaja', { ab: 'des' })] },
  asustado: { reglas: [R('ataque', 'desventaja', { cond: 'mientras veas la fuente de tu miedo' }), R('prueba', 'desventaja', { cond: 'mientras veas la fuente de tu miedo' })] },
  aturdido: { incap: true, reglas: [R('salvacion', 'falla', { ab: 'fue' }), R('salvacion', 'falla', { ab: 'des' })] },
  cegado: { reglas: [R('ataque', 'desventaja')] },
  derribado: { arrastra: true, reglas: [R('ataque', 'desventaja')] },
  encantado: { reglas: [] },
  ensordecido: { reglas: [] },
  envenenado: { reglas: [R('ataque', 'desventaja'), R('prueba', 'desventaja')] },
  incapacitado: { incap: true, reglas: [R('iniciativa', 'desventaja')] },
  inconsciente: { incap: true, vel0: true, reglas: [R('salvacion', 'falla', { ab: 'fue' }), R('salvacion', 'falla', { ab: 'des' })] },
  invisible: { reglas: [R('ataque', 'ventaja'), R('iniciativa', 'ventaja')] },
  paralizado: { incap: true, vel0: true, reglas: [R('salvacion', 'falla', { ab: 'fue' }), R('salvacion', 'falla', { ab: 'des' })] },
  petrificado: { incap: true, vel0: true, reglas: [R('salvacion', 'falla', { ab: 'fue' }), R('salvacion', 'falla', { ab: 'des' })] },
};

export const EFECTOS = [
  { k: 'bendicion', dur: 10, conjuro: /^bendici[oó]n$/i, nombre: 'Bendición', bueno: true, tiraObjetivo: true, ico: 'inspiracion', texto: '+1d4 a tus tiradas de ataque y de salvación.', reglas: [R('ataque', 'dado', { valor: '1d4' }), R('salvacion', 'dado', { valor: '1d4' })] },
  { k: 'guia', dur: 10, conjuro: /^gu[ií]a$/i, nombre: 'Guía', bueno: true, tiraObjetivo: true, ico: 'inspiracion', texto: '+1d4 a las pruebas de la habilidad elegida.', reglas: [R('prueba', 'dado', { valor: '1d4', cond: 'si es de la habilidad elegida' })] },
  { k: 'acelerar', dur: 10, conjuro: /^acelerar$/i, nombre: 'Acelerar', bueno: true, ico: 'velocidad', texto: '+2 a la CA, ventaja en salvaciones de Destreza, velocidad doble y una acción más (limitada).', ca: 2, velX: 2, reglas: [R('salvacion', 'ventaja', { ab: 'des' })] },
  { k: 'escudofe', dur: 100, conjuro: /^escudo de (la )?fe$/i, nombre: 'Escudo de la fe', bueno: true, ico: 'ca', texto: '+2 a la CA.', ca: 2, reglas: [] },
  { k: 'escudo', dur: 1, conjuro: /^escudo$/i, nombre: 'Escudo', bueno: true, ico: 'ca', texto: '+5 a la CA hasta el inicio de tu siguiente turno.', ca: 5, reglas: [] },
  { k: 'pielrobliza', dur: 600, conjuro: /^piel (robliza|de corteza)$/i, nombre: 'Piel robliza', bueno: true, ico: 'ca', texto: 'Tu CA no puede ser inferior a 17.', caMin: 17, reglas: [] },
  { k: 'agrandar', dur: 10, conjuro: /^agrandar(\/reducir)?$/i, nombre: 'Agrandar', bueno: true, ico: 'fuerza', texto: 'Ventaja en pruebas y salvaciones de Fuerza y +1d4 al daño con armas.', danoArma: '1d4',
    reglas: [R('prueba', 'ventaja', { ab: 'fue' }), R('salvacion', 'ventaja', { ab: 'fue' })] },
  { k: 'zancada', dur: 600, conjuro: /^zancada prodigiosa$/i, nombre: 'Zancada prodigiosa', bueno: true, ico: 'velocidad', texto: '+3 m de velocidad.', vel: 3, reglas: [] },
  { k: 'pasarsinrastro', dur: 600, conjuro: /^pasar sin rastro$/i, nombre: 'Pasar sin rastro', bueno: true, ico: 'ojo', texto: '+10 a las pruebas de Destreza (Sigilo).', reglas: [R('prueba', 'plano', { valor: 10, hab: 'sigilo' })] },
  { k: 'heroismo', dur: 10, conjuro: /^hero[ií]smo$/i, nombre: 'Heroísmo', bueno: true, ico: 'inspiracion', texto: 'Inmune a asustado; al empezar cada turno ganas PG temporales iguales al modificador de quien lo lanzó.', reglas: [] },
  { k: 'auxilio', dur: 4800, conjuro: /^auxilio$/i, nombre: 'Auxilio', bueno: true, ico: 'pg', texto: 'Tus PG máximos y actuales aumentan en 5 (5 más por cada nivel de espacio por encima de 2).', maxPg: 5, reglas: [] },
  { k: 'proteccion', dur: 100, conjuro: /^protecci[oó]n contra el bien y el mal$/i, nombre: 'Protección contra el bien y el mal', bueno: true, ico: 'esc_abj', texto: 'Aberraciones, celestiales, elementales, feéricos, infernales y muertos vivientes tienen desventaja al atacarte y no pueden encantarte, asustarte ni poseerte.', reglas: [] },
  { k: 'furia', dur: 100, nombre: 'Furia', bueno: true, ico: 'fuerza', texto: 'Resistencia al daño contundente, cortante y perforante; ventaja en pruebas y salvaciones de Fuerza; daño por furia en los ataques con Fuerza. No puedes concentrarte ni lanzar conjuros.',
    reglas: [R('prueba', 'ventaja', { ab: 'fue' }), R('salvacion', 'ventaja', { ab: 'fue' })] },
  { k: 'cancion', dur: 10, nombre: 'Canción de la hoja', bueno: true, ico: 'velocidad', texto: 'Suma tu Inteligencia a la CA, +3 m de velocidad, ventaja en Acrobacias, atacas con Inteligencia y la sumas a las salvaciones de concentración.',
    caAb: 'int', vel: 3, reglas: [R('prueba', 'ventaja', { hab: 'acrobacias' })] },
  { k: 'armaduramago', dur: 4800, conjuro: /^armadura de mago$/i, nombre: 'Armadura de mago', bueno: true, ico: 'ca', texto: 'Sin armadura, tu CA base es 13 + tu modificador de Destreza.', caBase: 13, reglas: [] },
  { k: 'borroso', dur: 10, conjuro: /^contorno borroso$/i, nombre: 'Contorno borroso', bueno: true, ico: 'ojo', texto: 'Quien te ataque tiene desventaja, salvo que no dependa de la vista.', reglas: [] },
  { k: 'esperanza', dur: 10, conjuro: /^se[ñn]al de esperanza$/i, nombre: 'Señal de esperanza', bueno: true, ico: 'inspiracion', texto: 'Ventaja en salvaciones de Sabiduría y contra muerte; cuando te curan, recuperas el máximo posible.',
    reglas: [R('salvacion', 'ventaja', { ab: 'sab' }), R('salvacion', 'ventaja', { motivo: 'muerte' })] },
  { k: 'potenciar', dur: 600, conjuro: /^potenciar caracter[ií]stica$/i, nombre: 'Potenciar característica', bueno: true, ico: 'inspiracion', texto: 'Ventaja en las pruebas de la característica elegida.', reglas: [R('prueba', 'ventaja', { cond: 'si es de la característica elegida' })] },
  { k: 'invisible', dur: 600, conjuro: /^invisibilidad$/i, nombre: 'Invisibilidad', bueno: true, ico: 'ojo', texto: 'Tienes el estado de invisible hasta que ataques, hagas daño o lances un conjuro.', reglas: [R('ataque', 'ventaja'), R('iniciativa', 'ventaja')] },
  { k: 'invismejor', dur: 10, conjuro: /^invisibilidad mejorada$/i, nombre: 'Invisibilidad mejorada', bueno: true, ico: 'ojo', texto: 'Tienes el estado de invisible mientras dure: ventaja al atacar y desventaja para quien te ataque.', reglas: [R('ataque', 'ventaja'), R('iniciativa', 'ventaja')] },
  { k: 'volar', dur: 100, conjuro: /^volar$/i, nombre: 'Volar', bueno: true, ico: 'velocidad', texto: 'Velocidad volando de 18 m y puedes levitar.', reglas: [] },
  { k: 'pielpetrea', dur: 600, conjuro: /^piel p[eé]trea$/i, nombre: 'Piel pétrea', bueno: true, ico: 'ca', texto: 'Resistencia al daño contundente, cortante y perforante.', reglas: [] },
  { k: 'protenergia', dur: 600, conjuro: /^protecci[oó]n contra (la )?energ[ií]a$/i, nombre: 'Protección contra energía', bueno: true, ico: 'esc_abj', texto: 'Resistencia al tipo de daño elegido: ácido, frío, fuego, relámpago o trueno.', reglas: [] },
  { k: 'guardamuerte', dur: 4800, conjuro: /^guarda contra la muerte$/i, nombre: 'Guarda contra la muerte', bueno: true, ico: 'pg', texto: 'La primera vez que fueras a caer a 0 PG, te quedas a 1; o anula un efecto que te mataría al instante.', reglas: [] },
  { k: 'santuario', dur: 10, conjuro: /^santuario$/i, nombre: 'Santuario', bueno: true, ico: 'esc_abj', texto: 'Quien quiera atacarte o afectarte con un conjuro debe superar una salvación de Sabiduría o elegir otro objetivo. Termina si atacas o haces daño.', reglas: [] },
  { k: 'resistenciat', dur: 10, conjuro: /^resistencia$/i, nombre: 'Resistencia', bueno: true, tiraObjetivo: true, ico: 'esc_abj', texto: 'Una vez por turno, reduces en 1d4 el daño que recibas del tipo elegido.', reglas: [] },
  { k: 'escudofuego', dur: 100, conjuro: /^escudo de fuego$/i, nombre: 'Escudo de fuego', bueno: true, ico: 'esc_evo', texto: 'Resistencia al frío o al fuego; quien te acierte cuerpo a cuerpo a 1,5 m sufre 2d8 de daño de fuego o de frío.', reglas: [] },
  { k: 'libertad', dur: 600, conjuro: /^libertad de movimiento$/i, nombre: 'Libertad de movimiento', bueno: true, ico: 'velocidad', texto: 'El terreno difícil no te frena y la magia no puede reducir tu velocidad ni dejarte paralizado o apresado.', reglas: [] },
  { k: 'retirada', dur: 100, conjuro: /^retirada expeditiva$/i, nombre: 'Retirada expeditiva', bueno: true, ico: 'velocidad', texto: 'Puedes correr como acción adicional.', reglas: [] },
  { k: 'imagen', dur: 10, conjuro: /^imagen m[uú]ltiple$/i, nombre: 'Imagen múltiple', bueno: true, ico: 'ojo', texto: 'Tres duplicados ilusorios: cada ataque que te alcance puede dar a uno de ellos.', reglas: [] },
  { k: 'desplazamiento', dur: 10, conjuro: /^desplazamiento$/i, nombre: 'Desplazamiento', bueno: true, ico: 'ojo', texto: 'Al final de cada turno tiras 1d6: con 4-6 pasas al Plano Etéreo hasta tu siguiente turno.', reglas: [] },
  { k: 'favordivino', dur: 10, conjuro: /^favor divino$/i, nombre: 'Favor divino', bueno: true, ico: 'radiante', texto: 'Tus ataques con arma hacen 1d4 de daño radiante adicional al impactar.', danoArma: '1d4', reglas: [] },
  { k: 'armamagica', dur: 600, conjuro: /^arma m[aá]gica$/i, nombre: 'Arma mágica', bueno: true, ico: 'cortante', texto: '+1 a las tiradas de ataque y de daño con el arma encantada (más con espacios superiores).', reglas: [R('ataque', 'plano', { valor: 1, cond: 'con el arma encantada' })] },
  { k: 'mantocruzado', dur: 10, conjuro: /^manto del cruzado$/i, nombre: 'Manto del cruzado', bueno: true, ico: 'radiante', texto: 'Tus ataques con arma hacen 1d4 de daño radiante adicional al impactar.', danoArma: '1d4', reglas: [] },
  { k: 'fuentelunar', dur: 100, conjuro: /^fuente de luz lunar$/i, nombre: 'Fuente de luz lunar', bueno: true, ico: 'radiante', texto: 'Resistencia al daño radiante y tus ataques cuerpo a cuerpo hacen 2d6 de daño radiante adicional. Reacción: ciegas a quien te dañe.', danoArma: '2d6', reglas: [] },
  { k: 'circulopoder', dur: 100, conjuro: /^c[ií]rculo de poder$/i, nombre: 'Círculo de poder', bueno: true, ico: 'esc_abj', texto: 'Ventaja en las salvaciones contra conjuros y efectos mágicos; si la superas contra uno que hace la mitad, no sufres daño.', reglas: [R('salvacion', 'ventaja', { cond: 'contra conjuros y efectos mágicos' })] },
  { k: 'armaelemental', dur: 600, conjuro: /^arma elemental$/i, nombre: 'Arma elemental', bueno: true, ico: 'fuego', texto: '+1 a las tiradas de ataque y 1d4 de daño adicional del tipo elegido con el arma encantada (más con espacios superiores).', danoArma: '1d4', reglas: [R('ataque', 'plano', { valor: 1, cond: 'con el arma encantada' })] },
  { k: 'presciencia', dur: 4800, conjuro: /^presciencia$/i, nombre: 'Presciencia', bueno: true, ico: 'ojo', texto: 'Ventaja en todas tus pruebas de d20, y los ataques contra ti tienen desventaja.', reglas: [R('ataque', 'ventaja'), R('prueba', 'ventaja'), R('salvacion', 'ventaja')] },
  { k: 'vinculo', dur: 600, conjuro: /^v[ií]nculo protector$/i, nombre: 'Vínculo protector', bueno: true, ico: 'esc_abj', texto: '+1 a la CA y a las salvaciones y resistencia a todo el daño; quien lo lanzó sufre el mismo daño que tú.', ca: 1, reglas: [R('salvacion', 'plano', { valor: 1 })] },
  { k: 'aurasagrada', dur: 10, conjuro: /^aura sagrada$/i, nombre: 'Aura sagrada', bueno: true, ico: 'radiante', texto: 'Ventaja en todas tus salvaciones y los ataques contra ti tienen desventaja.', reglas: [R('salvacion', 'ventaja')] },
  { k: 'guardiacuchillas', dur: 10, conjuro: /^guardia de cuchillas$/i, nombre: 'Guardia de cuchillas', bueno: true, ico: 'ca', texto: 'Quien te ataque resta 1d4 a su tirada de ataque.', reglas: [] },
  { k: 'protveneno', dur: 600, conjuro: /^protecci[oó]n contra (el )?veneno$/i, nombre: 'Protección contra veneno', bueno: true, ico: 'veneno', texto: 'Resistencia al daño de veneno y ventaja en las salvaciones para no quedar envenenado.', reglas: [R('salvacion', 'ventaja', { cond: 'contra el estado de envenenado' })] },
  { k: 'vision', dur: 4800, conjuro: /^visi[oó]n en la oscuridad$/i, nombre: 'Visión en la oscuridad', bueno: true, ico: 'ojo', texto: 'Visión en la oscuridad hasta 45 m.', reglas: [] },
  { k: 'temerario', dur: 1, rasgo: true, nombre: 'Ataque temerario', bueno: true, ico: 'fuerza', texto: 'Ventaja en tus ataques con Fuerza este turno; los ataques contra ti tienen ventaja hasta tu siguiente turno.', reglas: [R('ataque', 'ventaja', { cond: 'si el ataque usa la Fuerza' })] },
  { k: 'punteria', dur: 1, rasgo: true, nombre: 'Puntería certera', bueno: true, ico: 'ojo', texto: 'Ventaja en tu siguiente tirada de ataque este turno; tu velocidad es 0 hasta el final del turno.', reglas: [R('ataque', 'ventaja', { cond: 'solo en la siguiente' })], velX: 0 },
  { k: 'voto', dur: 10, rasgo: true, nombre: 'Voto de enemistad', bueno: true, ico: 'combate', texto: 'Ventaja en tus tiradas de ataque contra la criatura del voto durante 1 minuto.', reglas: [R('ataque', 'ventaja', { cond: 'contra la criatura del voto' })] },
  { k: 'armasagrada', dur: 100, rasgo: true, nombre: 'Arma sagrada', bueno: true, ico: 'radiante', texto: 'Sumas tu Carisma a las tiradas de ataque con el arma, que da luz y puede hacer daño radiante, durante 10 minutos.', reglas: [R('ataque', 'plano', { valorAb: 'car', cond: 'con el arma bendecida' })] },
  { k: 'atleta', dur: 600, rasgo: true, nombre: 'Atleta sin parangón', bueno: true, ico: 'velocidad', texto: 'Ventaja en Atletismo y Acrobacias, y tus saltos llegan 3 m más lejos, durante 1 hora.', reglas: [R('prueba', 'ventaja', { hab: 'atletismo' }), R('prueba', 'ventaja', { hab: 'acrobacias' })] },
  { k: 'parada', dur: 1, rasgo: true, nombre: 'Parada', bueno: true, ico: 'ca', texto: 'Sumas tu bonificador por competencia a la CA contra ataques cuerpo a cuerpo hasta el principio de tu siguiente turno.', caPb: true, reglas: [] },
  { k: 'innata', dur: 10, nombre: 'Hechicería innata', bueno: true, ico: 'esc_evo', texto: 'Durante 1 minuto, la CD de tus conjuros de hechicero sube 1 y tienes ventaja en tus tiradas de ataque de conjuro.', reglas: [R('ataque', 'ventaja', { cond: 'solo ataques de conjuro' })] },
  { k: 'revelacion', dur: 10, rasgo: true, nombre: 'Revelación celestial', bueno: true, ico: 'radiante', texto: 'Transformación de 1 minuto: una vez por turno, daño radiante o necrótico adicional igual a tu competencia.', reglas: [] },
  { k: 'formagrande', dur: 100, rasgo: true, nombre: 'Forma grande', bueno: true, ico: 'fuerza', texto: 'Eres Grande durante 10 minutos: ventaja en pruebas de Fuerza y +3 m de velocidad.', vel: 3, reglas: [R('prueba', 'ventaja', { ab: 'fue' })] },
  { k: 'vuelodraconico', dur: 100, rasgo: true, nombre: 'Vuelo dracónico', bueno: true, ico: 'velocidad', texto: 'Alas espectrales durante 10 minutos: velocidad volando igual a tu velocidad.', reglas: [] },
  { k: 'defensasup', dur: 10, rasgo: true, nombre: 'Defensa superior', bueno: true, ico: 'ca', texto: 'Resistencia a todo el daño salvo el de fuerza durante 1 minuto.', reglas: [] },
  { k: 'correr', dur: 1, accion: true, nombre: 'Correr', bueno: true, ico: 'velocidad', texto: 'Movimiento extra igual a tu velocidad este turno.', velX: 2, reglas: [] },
  { k: 'destrabarse', dur: 1, accion: true, nombre: 'Destrabarse', bueno: true, ico: 'iniciativa', texto: 'Tu movimiento no provoca ataques de oportunidad este turno.', reglas: [] },
  { k: 'esquivar', dur: 1, accion: true, nombre: 'Esquivando', bueno: true, ico: 'ca', texto: 'Quien te ataque tiene desventaja y tus salvaciones de Destreza, ventaja, hasta tu siguiente turno.', reglas: [R('salvacion', 'ventaja', { ab: 'des' })] },
  { k: 'perdicion', dur: 10, conjuro: /^perdici[oó]n$/i, nombre: 'Perdición', bueno: false, tiraObjetivo: true, ico: 'muerte', texto: '−1d4 a tus tiradas de ataque y de salvación.', reglas: [R('ataque', 'dado', { valor: '-1d4' }), R('salvacion', 'dado', { valor: '-1d4' })] },
  { k: 'ralentizar', dur: 10, conjuro: /^ralentizar$/i, nombre: 'Ralentizar', bueno: false, ico: 'md_tiempo', texto: '−2 a la CA y a las salvaciones de Destreza, velocidad a la mitad y sin reacciones.', ca: -2, velX: 0.5, reglas: [R('salvacion', 'plano', { valor: -2, ab: 'des' })] },
  { k: 'maleficio', dur: 600, conjuro: /^maleficio$/i, nombre: 'Maleficio', bueno: false, ico: 'esc_nig', texto: 'Desventaja en las pruebas de la característica que elija quien lo lanzó.', reglas: [R('prueba', 'desventaja', { cond: 'si es de la característica elegida' })] },
  { k: 'rayodebil', dur: 10, conjuro: /^rayo debilitador$/i, nombre: 'Rayo debilitador', bueno: false, ico: 'fuerza', texto: 'Desventaja en las pruebas de d20 de Fuerza y restas 1d8 a tus tiradas de daño.',
    reglas: [R('ataque', 'desventaja', { cond: 'si el ataque usa Fuerza' }), R('prueba', 'desventaja', { ab: 'fue' }), R('salvacion', 'desventaja', { ab: 'fue' })] },
  { k: 'fuegoferico', dur: 10, conjuro: /^fuego fe[eé]rico$/i, nombre: 'Fuego feérico', bueno: false, ico: 'fuego', texto: 'Brillas: quien te ataque y pueda verte tiene ventaja, y no te beneficias de ser invisible.', reglas: [] },
  { k: 'saetaguia', dur: 1, conjuro: /^saeta gu[ií]a$/i, nombre: 'Saeta guía', bueno: false, ico: 'radiante', texto: 'El siguiente ataque contra ti antes de que acabe el siguiente turno de quien la lanzó tiene ventaja.', reglas: [] },
  { k: 'burla', dur: 1, conjuro: /^burla (da[ñn]ina|cruel)$/i, nombre: 'Burla dañina', bueno: false, ico: 'psiquico', texto: 'Desventaja en tu siguiente tirada de ataque antes de que acabe tu siguiente turno.', reglas: [R('ataque', 'desventaja', { cond: 'solo en la siguiente' })] },
  { k: 'toquehelado', dur: 1, conjuro: /^toque helado$/i, nombre: 'Toque helado', bueno: false, ico: 'necrotico', texto: 'No puedes recuperar puntos de golpe hasta el final del siguiente turno de quien lo lanzó.', reglas: [] },
  { k: 'escarcha', dur: 1, conjuro: /^rayo de escarcha$/i, nombre: 'Rayo de escarcha', bueno: false, ico: 'frio', texto: 'Tu velocidad se reduce 3 m hasta el inicio del siguiente turno de quien lo lanzó.', vel: -3, reglas: [] },
  { k: 'maldicion', dur: 10, conjuro: /^imponer maldici[oó]n$/i, nombre: 'Imponer maldición', bueno: false, ico: 'esc_nig', texto: 'Según la maldición: desventaja en pruebas y salvaciones de una característica, en tus ataques contra quien la lanzó, o pierdes turnos.',
    reglas: [R('prueba', 'desventaja', { cond: 'si es de la característica elegida' }), R('salvacion', 'desventaja', { cond: 'si es de la característica elegida' })] },
  { k: 'calentar', dur: 10, conjuro: /^calentar metal$/i, nombre: 'Calentar metal', bueno: false, ico: 'fuego', texto: 'Mientras sigas sosteniendo o llevando el objeto ardiente tienes desventaja en ataques y pruebas de característica.',
    reglas: [R('ataque', 'desventaja', { cond: 'si sigues con el objeto' }), R('prueba', 'desventaja', { cond: 'si sigues con el objeto' })] },
  // Pociones (Guía del Dungeon Master de 2024)
  ...[21, 23, 25, 27, 29].map(f => ({ k: `pfg${f}`, dur: 600, pocion: true, nombre: `Fuerza de gigante (${f})`, bueno: true, ico: 'fuerza', texto: `Tu Fuerza es ${f} durante 1 hora (si no era ya igual o mayor).`, reglas: [] })),
  { k: 'invulnerable', dur: 10, pocion: true, nombre: 'Invulnerabilidad', bueno: true, ico: 'esc_abj', texto: 'Resistencia a todo el daño durante 1 minuto.', reglas: [] },
  { k: 'resistenciapocion', dur: 600, pocion: true, nombre: 'Poción de resistencia', bueno: true, ico: 'esc_abj', texto: 'Resistencia al tipo de daño de la poción durante 1 hora.', reglas: [] },
  { k: 'reducir', dur: 600, pocion: true, nombre: 'Reducir', bueno: true, ico: 'fuerza', texto: 'Eres una categoría de tamaño menor: desventaja en pruebas y salvaciones de Fuerza y −1d4 al daño con armas.',
    reglas: [R('prueba', 'desventaja', { ab: 'fue' }), R('salvacion', 'desventaja', { ab: 'fue' })] },
  { k: 'trepar', dur: 600, pocion: true, nombre: 'Trepar', bueno: true, ico: 'velocidad', texto: 'Velocidad trepando igual a tu velocidad y ventaja en Atletismo para trepar durante 1 hora.', reglas: [R('prueba', 'ventaja', { hab: 'atletismo', cond: 'para trepar' })] },
  { k: 'pugilismo', dur: 100, pocion: true, nombre: 'Pugilismo', bueno: true, ico: 'fuerza', texto: 'Tus golpes sin armas hacen 1d6 de daño de fuerza adicional durante 10 minutos.', reglas: [] },
  { k: 'confusion', dur: 10, conjuro: /^confusi[oó]n$/i, nombre: 'Confusión', bueno: false, ico: 'psiquico', texto: 'No puedes hacer reacciones y al empezar cada turno tiras 1d10 para ver qué haces. Repites la salvación al final de cada turno.', reglas: [] },
];
export const EFECTO = Object.fromEntries(EFECTOS.map(e => [e.k, e]));
// Rasgos con usos que, al gastarse, ponen un efecto sobre ti
export const EFECTO_DE_RECURSO = { 'tpl:barbaro.furia': 'furia', 'tpl:hojacantante.cancion': 'cancion', 'tpl:hechicero.innata': 'innata',
  'tpl:especie.revelacion': 'revelacion', 'tpl:especie.grande': 'formagrande', 'tpl:especie.vuelo': 'vuelodraconico', 'tpl:especie.adrenalina': 'correr' };
// Rasgos que se activan desde «En juego» y dejan un efecto sobre ti; gasta: el uso que consumen
export const EFECTO_DE_RASGO = {
  'ataque temerario': { k: 'temerario' }, 'punteria certera': { k: 'punteria' },
  'voto de enemistad': { k: 'voto', gasta: 'tpl:paladin.canalizar' }, 'arma sagrada': { k: 'armasagrada', gasta: 'tpl:paladin.canalizar' },
  'atleta sin parangon': { k: 'atleta', gasta: 'tpl:paladin.canalizar' }, 'duelista defensivo': { k: 'parada' }, 'defensa superior': { k: 'defensasup', gasta: 'tpl:monje.concentracion', n: 3 },
};

// Ventajas pasivas de clase y especie que se aplican solas a las tiradas
const INCAP_P = ['incapacitado', 'aturdido', 'inconsciente', 'paralizado', 'petrificado'];
export function pasivosDe(ch) {
  const out = [], incap = (ch.vida?.estados || []).some(k => INCAP_P.includes(k)), especie = norm(ch.especie || '').split(/[\s(]/)[0];
  for (const c of clasesDe(ch)) {
    if (c.clase === 'Bárbaro' && c.nivel >= 2 && !incap) out.push({ nombre: 'Sentir el peligro', reglas: [R('salvacion', 'ventaja', { ab: 'des' })] });
    if (c.clase === 'Bárbaro' && c.nivel >= 7) out.push({ nombre: 'Instinto salvaje', reglas: [R('iniciativa', 'ventaja')] });
    // Cazador preciso (explorador 17): ventaja contra la criatura marcada con Marca del cazador
    if (c.clase === 'Explorador' && c.nivel >= 17 && norm(ch.play?.conc || '') === 'marca del cazador') out.push({ nombre: 'Cazador preciso', reglas: [R('ataque', 'ventaja', { cond: 'contra la criatura marcada' })] });
    if (c.clase === 'Guerrero' && c.nivel >= 3 && /campe[oó]n/i.test(c.subclase || '')) out.push({ nombre: 'Atleta sobresaliente', reglas: [R('iniciativa', 'ventaja'), R('prueba', 'ventaja', { hab: 'atletismo' })] });
    if (c.clase === 'Pícaro' && c.nivel >= 3 && /asesin/i.test(c.subclase || '')) out.push({ nombre: 'Asesinar', reglas: [R('iniciativa', 'ventaja')] });
  }
  // Armadura sin entrenamiento: desventaja en lo que use Fuerza o Destreza y no puedes lanzar conjuros
  const puestas = (ch.equipo?.objetos || []).filter(o => o.equipado && o.armadura).map(o => o.armadura.tipo), sabe = armadurasDe(ch), sin = puestas.filter(t => !sabe.has(t));
  if (sin.length) out.push({ nombre: `Sin entrenamiento (${sin.map(t => t === 'escudo' ? 'escudo' : `armadura ${t}`).join(', ')})`, mal: true,
    reglas: [R('ataque', 'desventaja'), ...['fue', 'des'].flatMap(ab => [R('prueba', 'desventaja', { ab }), R('salvacion', 'desventaja', { ab })])] });
  // Armaduras ruidosas (acolchada, de escamas, media armadura y las pesadas): desventaja en Sigilo
  const pa = penalizacionArmadura(ch);
  if (pa.sigilo) out.push({ nombre: pa.armadura.nombre, mal: true, reglas: [R('prueba', 'desventaja', { hab: 'sigilo' })] });
  const dotes = (ch.dotes || []).map(d => norm(d).replace(/\s*\(.*$/, ''));
  if (dotes.includes('lanzador en combate')) out.push({ nombre: 'Lanzador en combate', reglas: [R('salvacion', 'ventaja', { ab: 'con', motivo: 'concentracion' })] });
  if (dotesDe(ch).some(d => norm(d.nombre) === 'comandante del dragon purpura') && maltrecho(ch)) out.push({ nombre: 'Último esfuerzo', reglas: [R('ataque', 'ventaja')] });
  if (dotes.includes('resistente')) out.push({ nombre: 'Resistente', reglas: [R('salvacion', 'ventaja', { motivo: 'muerte' })] });
  if (clasesDe(ch).some(c => c.clase === 'Guerrero' && /campe[oó]n/i.test(c.subclase || '') && c.nivel >= 18)) out.push({ nombre: 'Superviviente', reglas: [R('salvacion', 'ventaja', { motivo: 'muerte', cond: 'y de 18 a 20 cuenta como un 20' })] });
  if ((ch.vida?.efectos || []).some(e => e.k === 'cancion')) out.push({ nombre: 'Canción de la hoja', reglas: [R('salvacion', 'plano', { ab: 'con', motivo: 'concentracion', valor: Math.max(1, modOf(statsEfectivos(ch).int)) })] });
  if (clasesDe(ch).some(c => c.clase === 'Hechicero' && c.nivel >= 6 && /aberrant/i.test(c.subclase || ''))) out.push({ nombre: 'Defensas psíquicas', reglas: [R('salvacion', 'ventaja', { cond: 'contra asustado o hechizado' })] });
  if (clasesDe(ch).some(c => c.clase === 'Mago' && c.nivel >= 14 && /abjur/i.test(c.subclase || ''))) out.push({ nombre: 'Resistencia a conjuros', reglas: [R('salvacion', 'ventaja', { cond: 'contra conjuros' })] });
  if (especie === 'gnomo') out.push({ nombre: 'Astucia gnoma', reglas: ['int', 'sab', 'car'].map(ab => R('salvacion', 'ventaja', { ab })) });
  if (especie === 'enano') out.push({ nombre: 'Resistencia enana', reglas: [R('salvacion', 'ventaja', { cond: 'contra el estado de envenenado' })] });
  if (especie === 'mediano') out.push({ nombre: 'Valiente', reglas: [R('salvacion', 'ventaja', { cond: 'contra el estado de asustado' })] });
  if (especie === 'goliat') out.push({ nombre: 'Constitución poderosa', reglas: [R('prueba', 'ventaja', { cond: 'para poner fin al estado de agarrado' })] });
  if (especie === 'elfo') out.push({ nombre: 'Linaje feérico', reglas: [R('salvacion', 'ventaja', { cond: 'contra el estado de hechizado' })] });
  out.push(...pasivosObjetos(ch));
  return out.map(p => ({ bueno: !p.mal, ...p, pasivo: true }));
}
const sinTildes = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const efectoDeConjuro = nombre => { const n = sinTildes(nombre); return EFECTOS.find(e => e.conjuro && (e.conjuro.test(n) || e.conjuro.test(String(nombre || '').trim()))) || null; };
// Bendición, Guía, Resistencia, Perdición…: el dado lo tira cada objetivo al hacer su tirada, no quien lanza el conjuro
export function lanzadorTira(nombre, t) {
  if (!t) return false;
  if (t.ataque || t.danos?.length || t.curacion) return true;
  return !!t.extras?.length && !efectoDeConjuro(nombre)?.tiraObjetivo;
}
// Alcance «Lanzador» (Personal): el conjuro solo puede afectarte a ti
export const soloSobreTi = alcance => /^(lanzador|personal|uno mismo|self)\b/i.test(sinTildes(alcance));
export function fmtRondas(r) {
  if (r == null) return '';
  if (r <= 10) return r === 1 ? '1 ronda' : `${r} rondas`;
  if (r % 600 === 0) return r === 600 ? '1 hora' : `${r / 600} horas`;
  return `${Math.ceil(r / 10)} min`;
}

const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
export function normEfectos(lista) {
  return (Array.isArray(lista) ? lista : []).filter(e => e && (EFECTO[e.k] || e.propio)).map(e => ({ id: e.id || uid('ef'), k: e.k, nombre: String(e.nombre || EFECTO[e.k]?.nombre || 'Efecto'),
    rondas: Number.isFinite(+e.rondas) && e.rondas !== null && e.rondas !== '' && +e.rondas > 0 ? Math.round(+e.rondas) : null, conc: e.conc ? String(e.conc) : '',
    propio: e.propio ? { ca: num(e.propio.ca), vel: num(e.propio.vel), ataque: String(e.propio.ataque || ''), salvacion: String(e.propio.salvacion || ''), prueba: String(e.propio.prueba || '') } : null }));
}
const esDado = v => /^[+-]?\d*d\d+$/i.test(String(v).replace(/\s/g, ''));
function reglasPropias(p) {
  const out = [];
  for (const sobre of ['ataque', 'salvacion', 'prueba']) {
    const v = String(p[sobre] || '').replace(/\s/g, ''); if (!v) continue;
    if (esDado(v)) out.push(R(sobre, 'dado', { valor: v.replace(/^\+/, '') })); else if (num(v)) out.push(R(sobre, 'plano', { valor: num(v) }));
  }
  return out;
}
export function efectosDe(ch) {
  const v = ch.vida || {};
  return (v.efectos || []).map(e => { const d = EFECTO[e.k]; return d ? { ...d, nombre: e.nombre || d.nombre, id: e.id, rondas: e.rondas ?? null, conc: e.conc || '' } : { k: e.k || 'propio', id: e.id, nombre: e.nombre, bueno: true, ico: 'inspiracion', propio: e.propio, rondas: e.rondas ?? null, conc: e.conc || '',
    texto: [e.propio?.ca && `CA ${e.propio.ca > 0 ? '+' : ''}${e.propio.ca}`, e.propio?.ataque && `ataques ${e.propio.ataque}`, e.propio?.salvacion && `salvaciones ${e.propio.salvacion}`, e.propio?.prueba && `pruebas ${e.propio.prueba}`, e.propio?.vel && `velocidad ${e.propio.vel > 0 ? '+' : ''}${e.propio.vel} m`].filter(Boolean).join(', ') || 'Efecto propio.',
    ca: e.propio?.ca || 0, vel: e.propio?.vel || 0, reglas: reglasPropias(e.propio || {}) }; });
}
// Estados a los que eres inmune ahora mismo: Aura de coraje (paladín 10), Aura de entrega (entrega 7), Furia irracional (berserker 6, en furia),
// Heroísmo (asustado), Petrificado (envenenado)
export function inmunidadesEstado(ch) {
  const out = new Map(), efs = (ch.vida?.efectos || []).map(e => e.k), ests = ch.vida?.estados || [];
  const incap = ests.some(k => ['incapacitado', 'aturdido', 'inconsciente', 'paralizado', 'petrificado'].includes(k));
  for (const c of clasesDe(ch)) {
    if (c.clase === 'Paladín' && c.nivel >= 10 && !incap) out.set('asustado', 'Aura de coraje');
    if (c.clase === 'Paladín' && c.nivel >= 7 && /entrega|devoci/i.test(c.subclase || '') && !incap) out.set('encantado', 'Aura de entrega');
    if (c.clase === 'Bárbaro' && c.nivel >= 6 && /berserk/i.test(c.subclase || '') && efs.includes('furia')) { out.set('asustado', 'Furia irracional'); out.set('encantado', 'Furia irracional'); }
    if (c.clase === 'Brujo' && c.nivel >= 10 && /fe[eé]ric/i.test(c.subclase || '')) out.set('encantado', 'Defensas seductoras');
    if (c.clase === 'Guerrero' && c.nivel >= 18 && /abanderad/i.test(c.subclase || '')) { out.set('asustado', 'Comandante inspirador'); out.set('encantado', 'Comandante inspirador'); }
    if (c.clase === 'Druida' && c.nivel >= 10 && /tierra/i.test(c.subclase || '')) out.set('envenenado', 'Protección de la naturaleza');
  }
  if (efs.includes('heroismo')) out.set('asustado', 'Heroísmo');
  if (ests.includes('petrificado')) out.set('envenenado', 'Petrificado');
  for (const d of dotesDe(ch)) { const n = norm(d.nombre); if (n === 'don del terror') out.set('asustado', d.nombre); if (n === 'don del dominio de los venenos') out.set('envenenado', d.nombre); }
  return out;
}
const estadosActivos = ch => { const inm = inmunidadesEstado(ch); return (ch.vida?.estados || []).filter(k => REGLAS_ESTADO[k] && !inm.has(k)); };
export const incapacitado = ch => estadosActivos(ch).filter(k => REGLAS_ESTADO[k].incap);

// motivo: 'muerte' (salvación contra muerte) o 'concentracion' (mantener un conjuro); algunas reglas solo valen para eso
export function modsTirada(ch, { sobre, ab = '', hab = '', motivo = '' }) {
  const abEf = ab || (hab ? abDe(hab) : sobre === 'iniciativa' ? 'des' : '');
  const aplica = r => {
    if (r.motivo && r.motivo !== motivo) return false;
    if (r.hab && r.hab !== hab) return false;
    if (r.ab && r.ab !== abEf) return false;
    if (r.sobre === sobre) return true;
    return r.sobre === 'prueba' && sobre === 'iniciativa';
  };
  const out = [];
  // Aturdido, inconsciente, paralizado y petrificado incluyen el estado incapacitado (y su desventaja en la iniciativa)
  const activos = estadosActivos(ch), reglasDe = k => (REGLAS_ESTADO[k].incap && k !== 'incapacitado' && !activos.includes('incapacitado') ? [...REGLAS_ESTADO[k].reglas, ...REGLAS_ESTADO.incapacitado.reglas] : REGLAS_ESTADO[k].reglas);
  for (const k of activos) for (const r of reglasDe(k)) if (aplica(r)) out.push({ fuente: k.charAt(0).toUpperCase() + k.slice(1), mal: r.efecto !== 'ventaja', ...r });
  // Esquivar se pierde si quedas incapacitado o tu velocidad es 0
  const sinEsquivar = () => incapacitado(ch).length > 0 || velocidadEfectiva(ch).m === 0;
  const conAb = r => (r.valorAb ? { ...r, valor: Math.max(1, modOf(statsEfectivos(ch)[r.valorAb])) } : r);
  for (const e of efectosDe(ch)) { if (e.k === 'esquivar' && sinEsquivar()) continue; for (const r of e.reglas) if (aplica(r)) out.push({ fuente: e.nombre, mal: !e.bueno, ...conAb(r) }); }
  for (const p of pasivosDe(ch)) for (const r of p.reglas) if (aplica(r)) out.push({ fuente: p.nombre, mal: !p.bueno, pasivo: true, ...r });
  const ago = Math.max(0, Math.min(6, parseInt(ch.vida?.agotamiento, 10) || 0));
  if (ago && sobre !== 'dano') out.push({ fuente: `Agotamiento ${ago}`, efecto: 'plano', valor: -2 * ago, mal: true });
  return out.map((m, i) => ({ ...m, id: `${m.fuente}|${m.efecto}|${i}`, on: true }));
}
export function resolverModo(mods) {
  const act = mods.filter(m => m.on), v = act.some(m => m.efecto === 'ventaja'), d = act.some(m => m.efecto === 'desventaja');
  return v && d ? 'normal' : v ? 'ventaja' : d ? 'desventaja' : 'normal';
}
export const falloAutomatico = mods => mods.find(m => m.on && m.efecto === 'falla') || null;

export function caEfectiva(ch) {
  const efs = efectosDe(ch), base = { ...claseArmadura(ch) };
  // Armadura de mago: 13 + Des sin armadura (se queda con la mejor opción)
  const cb = Math.max(0, ...efs.map(e => e.caBase || 0)), objs = ch.equipo?.objetos || [];
  if (cb && !objs.some(o => o.equipado && o.armadura && o.armadura.tipo !== 'escudo')) {
    const esc = objs.find(o => o.equipado && o.armadura?.tipo === 'escudo'), alt = cb + modOf(statsEfectivos(ch).des) + (esc ? (esc.armadura.base || 2) + (esc.armadura.bono || 0) : 0);
    if (alt > base.ca) { base.ca = alt; base.detalle = `Armadura de mago (${cb} + Des)${esc ? ', escudo' : ''}`; }
  }
  const caDe = e => (e.ca || 0) + (e.caAb ? Math.max(1, modOf(statsEfectivos(ch)[e.caAb])) : 0) + (e.caPb ? competencia(nivelTotal(ch)) : 0);
  let ca = base.ca + efs.reduce((s, e) => s + caDe(e), 0);
  const min = Math.max(0, ...efs.map(e => e.caMin || 0));
  const extra = efs.filter(e => caDe(e) || e.caMin).map(e => e.caMin ? `${e.nombre} (mín. ${e.caMin})` : `${e.nombre} ${caDe(e) > 0 ? '+' : ''}${caDe(e)}`);
  if (min > ca) ca = min;
  return { ca, base: base.ca, detalle: [base.detalle, ...extra].filter(Boolean).join(', '), cambia: ca !== base.ca };
}
export function velocidadEfectiva(ch) {
  const base = velocidad(ch), efs = efectosDe(ch), cero = estadosActivos(ch).filter(k => REGLAS_ESTADO[k].vel0);
  if (cero.length) return { m: 0, base, motivo: cero.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', '), cambia: base !== 0 };
  let m = base + efs.reduce((s, e) => s + (e.vel || 0), 0);
  for (const e of efs) if (e.velX != null) m *= e.velX;
  const arrastra = estadosActivos(ch).includes('derribado');
  return { m: Math.max(0, Math.round(m * 10) / 10), base, arrastra, motivo: efs.filter(e => e.vel || e.velX != null).map(e => e.nombre).join(', '), cambia: Math.abs(m - base) > 0.01 };
}
export const danoArmaExtra = ch => efectosDe(ch).map(e => e.danoArma).filter(Boolean);

export function resumenMods(ch) {
  const lineas = [];
  for (const [sobre, t] of [['ataque', 'Ataques'], ['salvacion', 'Salvaciones'], ['prueba', 'Pruebas'], ['iniciativa', 'Iniciativa']]) {
    const ms = modsTirada(ch, { sobre }).filter(m => !m.hab);
    const conAb = [...new Set([...estadosActivos(ch).flatMap(k => REGLAS_ESTADO[k].reglas), ...efectosDe(ch).flatMap(e => e.reglas), ...pasivosDe(ch).flatMap(p => p.reglas)].filter(r => r.sobre === sobre && (r.ab || r.hab)).map(r => r.ab || r.hab))];
    for (const ab of conAb) for (const m of modsTirada(ch, { sobre, ab: ['fue', 'des', 'con', 'int', 'sab', 'car'].includes(ab) ? ab : '', hab: ['fue', 'des', 'con', 'int', 'sab', 'car'].includes(ab) ? '' : ab })) if ((m.ab || m.hab) && !ms.some(x => x.id === m.id)) ms.push(m);
    const piezas = ms.filter(m => !/^Agotamiento/.test(m.fuente)).map(m => ({ texto: fmtMod(m), mal: m.mal, fuente: m.fuente, cond: m.cond }));
    if (piezas.length) lineas.push({ sobre, titulo: t, piezas });
  }
  return lineas;
}
const AB = { fue: 'Fue', des: 'Des', con: 'Con', int: 'Int', sab: 'Sab', car: 'Car' };
export function fmtMod(m) {
  const que = m.efecto === 'ventaja' ? 'ventaja' : m.efecto === 'desventaja' ? 'desventaja' : m.efecto === 'falla' ? 'fallo automático' : m.efecto === 'dado' ? (String(m.valor).startsWith('-') ? `−${String(m.valor).slice(1)}` : `+${m.valor}`) : `${m.valor > 0 ? '+' : '−'}${Math.abs(m.valor)}`;
  return `${que}${m.ab ? ` (${AB[m.ab]})` : ''}${m.hab ? ` (${m.hab === 'sigilo' ? 'Sigilo' : m.hab})` : ''}`;
}

export function maxExtraTotal(ch) { return (ch.vida?.maxExtra || []).reduce((s, x) => s + (x.n || 0), 0); }
export function resumenTirada(ch, sobre, { ab = '', hab = '' } = {}, bono = 0) {
  const todos = modsTirada(ch, { sobre, ab, hab }), mods = todos.filter(m => !m.cond);
  const plano = mods.filter(m => m.efecto === 'plano').reduce((s, m) => s + (Number(m.valor) || 0), 0);
  return { total: bono + plano, modo: resolverModo(mods), dados: mods.filter(m => m.efecto === 'dado').map(m => (String(m.valor).startsWith('-') ? `−${String(m.valor).slice(1)}` : `+${m.valor}`)), falla: !!falloAutomatico(mods), cond: todos.some(m => m.cond),
    fuentes: [...new Set(todos.map(m => m.fuente))] };
}

// Resistencias al daño que tienes ahora mismo, con su origen (especie, clase, subclase, opciones elegidas y efectos)
const BPS = ['contundente', 'cortante', 'perforante'];
const TERRENO_RES = { 'Árido': 'fuego', Polar: 'frío', Templado: 'relámpago', Tropical: 'veneno' };
const LEALTAD_RES = { Bhaal: 'veneno', Myrkul: 'necrótico', 'Perdición': 'psíquico' };
export function resistenciasDe(ch) {
  const out = new Map(), add = (tipos, fuente) => [].concat(tipos).forEach(t => { if (!out.has(t)) out.set(t, fuente); });
  for (const [t, f] of resistenciasEspecie(ch)) add(t, f);
  const efs = (ch.vida?.efectos || []).map(e => e.k), furia = efs.includes('furia');
  for (const c of clasesDe(ch)) {
    const s = c.subclase || '', L = c.nivel;
    if (c.clase === 'Bárbaro' && furia) {
      add(BPS, 'Furia');
      if (/coraz/i.test(s) && opcionDe(ch, 'corazon.furia')?.nombre === 'Oso') add(['ácido', 'frío', 'fuego', 'relámpago', 'trueno', 'veneno'], 'Furia de lo salvaje (oso)');
    }
    if (c.clase === 'Brujo' && /celestial/i.test(s) && L >= 6) add('radiante', 'Alma radiante');
    if (c.clase === 'Brujo' && /primigenio/i.test(s) && L >= 10) add('psíquico', 'Escudo mental');
    if (c.clase === 'Brujo' && /infernal/i.test(s) && L >= 10) { const o = opcionDe(ch, 'infernal.resistencia'); if (o) add(norm(o.nombre) === 'acido' ? 'ácido' : o.nombre.toLowerCase(), 'Resistencia infernal'); }
    if (c.clase === 'Hechicero' && /dracon/i.test(s) && L >= 6) { const o = opcionDe(ch, 'draconica.afinidad'); if (o) add(o.tipo, 'Afinidad elemental'); }
    if (c.clase === 'Hechicero' && /aberrant/i.test(s) && L >= 6) add('psíquico', 'Defensas psíquicas');
    if (c.clase === 'Guerrero' && /psionic/i.test(s) && L >= 10) add('psíquico', 'Mente robusta');
    if (c.clase === 'Clérigo' && /guerra/i.test(s) && L >= 17) add(BPS, 'Avatar de la batalla');
    if (c.clase === 'Druida' && /tierra/i.test(s) && L >= 10) { const o = opcionDe(ch, 'tierra.terreno'); add(TERRENO_RES[o?.nombre || 'Árido'], 'Protección de la naturaleza'); }
    if (c.clase === 'Paladín' && /antiguos/i.test(s) && L >= 7) add(['necrótico', 'psíquico', 'radiante'], 'Aura de salvaguarda');
    if (c.clase === 'Pícaro' && /vastago|tres/i.test(s) && L >= 3) { const o = opcionDe(ch, 'vastago.lealtad'); if (o) add(LEALTAD_RES[o.nombre], 'Lealtad aterradora'); }
    if (c.clase === 'Explorador' && /invernal/i.test(s) && L >= 3) add('frío', 'Explorador gélido');
  }
  // Dotes: dones épicos y Dracoseñalado (tipos elegidos entre paréntesis: «Dracoseñalado (fuego)»)
  const TIPOS = ['ácido', 'contundente', 'cortante', 'frío', 'fuego', 'fuerza', 'necrótico', 'perforante', 'psíquico', 'radiante', 'relámpago', 'trueno', 'veneno'];
  for (const d of dotesDe(ch)) { const n = norm(d.nombre), det = norm(d.detalle || '');
    if (n === 'don de la absorcion de almas') add(['frío', 'necrótico'], d.nombre);
    if (n === 'don de la furia de la tormenta') add(['relámpago', 'trueno'], d.nombre);
    if (n === 'don del dominio de los venenos') add('veneno', `${d.nombre} (inmunidad)`);
    if ((n === 'dracosenalado' || n === 'don de la resistencia a energias') && det) add(TIPOS.filter(t => det.includes(norm(t))), d.nombre);
    if (n === 'don de la resistencia desesperada' && maltrecho(ch)) add(TIPOS.filter(t => t !== 'fuerza'), `${d.nombre} (maltrecho)`);
  }
  if (efs.includes('pielpetrea')) add(BPS, 'Piel pétrea');
  if (efs.includes('defensasup')) add(['ácido', 'contundente', 'cortante', 'frío', 'fuego', 'necrótico', 'perforante', 'psíquico', 'radiante', 'relámpago', 'trueno', 'veneno'], 'Defensa superior');
  if (efs.includes('vinculo')) add(['ácido', 'contundente', 'cortante', 'frío', 'fuego', 'fuerza', 'necrótico', 'perforante', 'psíquico', 'radiante', 'relámpago', 'trueno', 'veneno'], 'Vínculo protector');
  if (efs.includes('protveneno')) add('veneno', 'Protección contra veneno');
  if (efs.includes('fuentelunar')) add('radiante', 'Fuente de luz lunar');
  if (efs.includes('invulnerable')) add(TIPOS, 'Poción de invulnerabilidad');
  for (const e of (ch.vida?.efectos || []).filter(x => x.k === 'resistenciapocion')) add(TIPOS.filter(t => norm(e.nombre || '').includes(`(${norm(t)})`)), e.nombre);
  for (const r of resistenciasObjetos(ch)) add(r.tipo, r.fuente);
  return [...out].map(([tipo, fuente]) => ({ tipo, fuente }));
}

// Maltrecho: con la mitad de tus PG máximos o menos (y aún en pie)
function maltrecho(ch) { const max = pgMaximo(ch), pg = pgActuales(ch); return pg > 0 && pg <= Math.floor(max / 2); }
