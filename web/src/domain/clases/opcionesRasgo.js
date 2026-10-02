import { norm } from '../../core/util.js';
import { clasesDe, nivelTotal } from '../reglas/reglas2024.js';
import { LINAJES, linajeDe, especieBase, APTITUD_ESPECIE } from '../origen/especies.js';

// Rasgos de subclase que obligan a escoger una opción entre varias (Manual del Jugador de 2024 y Héroes de Faerûn).
// cambia: cuándo se puede cambiar la elección
//   'largo'  al terminar un descanso largo           'corto' al terminar un descanso corto o largo
//   'uso'    cada vez que usas el rasgo (Furia, Forma estelar): la elección es la de esta vez
//   'fija'   se elige al aprender el rasgo
const TIPOS_DANO = ['Ácido', 'Contundente', 'Cortante', 'Frío', 'Fuego', 'Necrótico', 'Perforante', 'Psíquico', 'Radiante', 'Relámpago', 'Trueno', 'Veneno'];
const O = (nombre, texto, extra = {}) => ({ nombre, texto, ...extra });
export const OPCIONES_RASGO = [
  { id: 'corazon.furia', clase: 'Bárbaro', sub: /corazon/, nivel: 3, rasgo: 'Furia de lo salvaje', cambia: 'uso', opciones: [
    O('Oso', 'Mientras dure la furia tienes resistencia a todo el daño salvo el de fuerza, necrótico, psíquico y radiante.'),
    O('Águila', 'Al entrar en furia puedes Correr y Destrabarte como parte de esa acción adicional. Mientras dure, puedes hacer ambas como acción adicional.'),
    O('Lobo', 'Mientras dure la furia, tus aliados tienen ventaja en las tiradas de ataque contra cualquier enemigo a 1,5 m o menos de ti.') ] },
  { id: 'corazon.aspecto', clase: 'Bárbaro', sub: /corazon/, nivel: 6, rasgo: 'Aspecto de lo salvaje', cambia: 'largo', opciones: [
    O('Búho', 'Visión en la oscuridad de 18 m (o 18 m más si ya la tenías).'),
    O('Pantera', 'Velocidad trepando igual a tu velocidad.'),
    O('Salmón', 'Velocidad nadando igual a tu velocidad.') ] },
  { id: 'corazon.poder', clase: 'Bárbaro', sub: /corazon/, nivel: 14, rasgo: 'Poder de lo salvaje', cambia: 'uso', opciones: [
    O('Halcón', 'Mientras dure la furia, velocidad volando igual a tu velocidad si no llevas armadura.'),
    O('León', 'Mientras dure la furia, tus enemigos a 1,5 m tienen desventaja en los ataques contra cualquiera que no seas tú o otro bárbaro con esta opción.'),
    O('Carnero', 'Mientras dure la furia, cuando impactes con un ataque cuerpo a cuerpo a una criatura Grande o menor, puedes derribarla.') ] },
  { id: 'tierra.terreno', clase: 'Druida', sub: /tierra/, nivel: 3, rasgo: 'Conjuros del círculo de la tierra', cambia: 'largo', opciones: [
    O('Árido', 'Contorno borroso, Descarga de fuego y Manos ardientes; Bola de fuego (5), Marchitar (7) y Muro de piedra (9).'),
    O('Polar', 'Inmovilizar persona, Nube de oscurecimiento y Rayo de escarcha; Tormenta de aguanieve (5), Tormenta de hielo (7) y Cono de frío (9).'),
    O('Templado', 'Agarre electrizante, Dormir y Paso brumoso; Relámpago (5), Libertad de movimiento (7) y Paso arbóreo (9).'),
    O('Tropical', 'Rayo nauseabundo, Salpicadura ácida y Telaraña; Nube apestosa (5), Polimorfar (7) y Plaga de insectos (9).') ] },
  { id: 'estrellas.forma', clase: 'Druida', sub: /estrella/, nivel: 3, rasgo: 'Forma estelar', cambia: 'uso', opciones: [
    O('Arquero', 'Al activarla y como acción adicional en tus turnos: ataque de conjuro a distancia (18 m) que hace 1d8 + tu Sabiduría de daño radiante.'),
    O('Cáliz', 'Cuando lances un conjuro con espacio que cure, tú u otra criatura a 9 m recupera 1d8 + tu Sabiduría puntos de golpe.'),
    O('Dragón', 'En las pruebas de Inteligencia o Sabiduría y en las salvaciones de Constitución para mantener la concentración, un 9 o menos en el d20 cuenta como 10.') ] },
  { id: 'cazador.presa', clase: 'Explorador', sub: /cazador/, nivel: 3, rasgo: 'El cazador y la presa', cambia: 'corto', opciones: [
    O('Azote de colosos', 'Una vez por turno, al impactar con un arma a una criatura a la que le falten puntos de golpe, le haces 1d8 de daño adicional.', { golpe: { dado: '1d8', tipos: 'del tipo del arma', cond: 'si al objetivo le faltan puntos de golpe' } }),
    O('Destructor de hordas', 'Una vez en cada uno de tus turnos, al atacar con un arma, puedes hacer otro ataque con esa arma contra otra criatura a 1,5 m del objetivo original y a tu alcance.') ] },
  { id: 'cazador.tacticas', clase: 'Explorador', sub: /cazador/, nivel: 7, rasgo: 'Tácticas defensivas', cambia: 'corto', opciones: [
    O('Escapar de la horda', 'Los ataques de oportunidad contra ti tienen desventaja.'),
    O('Defensa contra ataques múltiples', 'Cuando una criatura te impacte, las demás tiradas de ataque que haga contra ti este turno tienen desventaja.') ] },
  { id: 'infernal.resistencia', clase: 'Brujo', sub: /infernal/, nivel: 10, rasgo: 'Resistencia infernal', cambia: 'corto',
    opciones: TIPOS_DANO.map(t => O(t, `Tienes resistencia al daño de tipo ${t.toLowerCase()} (no puede ser de fuerza).`)) },
  { id: 'vastago.lealtad', clase: 'Pícaro', sub: /vastago|tres/, nivel: 3, rasgo: 'Lealtad aterradora', cambia: 'largo', opciones: [
    O('Bhaal', 'Resistencia al daño de veneno y el truco Guardia de cuchillas (Inteligencia).', { truco: 'Guardia de cuchillas' }),
    O('Myrkul', 'Resistencia al daño necrótico y el truco Toque helado (Inteligencia).', { truco: 'Toque helado' }),
    O('Perdición', 'Resistencia al daño psíquico y el truco Ilusión menor (Inteligencia).', { truco: 'Ilusión menor' }) ] },
  { id: 'genios.aura', clase: 'Paladín', sub: /genios/, nivel: 7, rasgo: 'Aura de escudo elemental', cambia: 'uso', opciones: ['Ácido', 'Frío', 'Fuego', 'Relámpago', 'Trueno'].map(t =>
    O(t, `Tus aliados y tú tenéis resistencia al daño de ${t.toLowerCase()} dentro de tu Aura de protección. Puedes cambiarlo al principio de cada uno de tus turnos.`)) },
  { id: 'draconica.afinidad', clase: 'Hechicero', sub: /dracon/, nivel: 6, rasgo: 'Afinidad elemental', cambia: 'fija', opciones: ['Ácido', 'Frío', 'Fuego', 'Relámpago', 'Veneno'].map(t =>
    O(t, `Resistencia al daño de ${t.toLowerCase()} y sumas tu Carisma a una tirada de daño de ${t.toLowerCase()} de cada conjuro.`, { tipo: t.toLowerCase() })) },
];
export const OPCION_RASGO = Object.fromEntries([...OPCIONES_RASGO, ...LINAJES, APTITUD_ESPECIE].map(d => [d.id, d]));
export const CAMBIA_TXT = { largo: 'Puedes cambiarla al terminar un descanso largo.', corto: 'Puedes cambiarla al terminar un descanso corto o largo.', uso: 'Se elige cada vez que usas el rasgo.', fija: 'Se elige al aprender el rasgo.' };

export function normOpciones(x) {
  const out = {};
  for (const [id, v] of Object.entries(x && typeof x === 'object' ? x : {})) {
    const o = OPCION_RASGO[id]?.opciones.find(op => norm(op.nombre) === norm(v));
    if (o) out[id] = o.nombre;
  }
  return out;
}
// Definiciones que el personaje ya tiene por clase, subclase y nivel
export const opcionesDe = ch => [...OPCIONES_RASGO.filter(d => clasesDe(ch).some(c => c.clase === d.clase && d.sub.test(norm(c.subclase || '')) && c.nivel >= d.nivel)),
  // Linajes y legados de la especie
  ...LINAJES.filter(d => especieBase(ch) === d.especie && nivelTotal(ch) >= (d.nivel || 1))];
export const opcionDe = (ch, id) => { const d = OPCION_RASGO[id]; if (d?.especie) return linajeDe(ch, id); return d?.opciones.find(o => o.nombre === ch.opciones?.[id]) || null; };
export const opcionDeRasgo = (ch, rasgo) => opcionesDe(ch).find(d => norm(d.rasgo) === norm(rasgo)) || null;
// Las que faltan por elegir (las de «uso» se eligen al usarlas y no cuentan)
export const opcionesPendientes = ch => opcionesDe(ch).filter(d => d.cambia !== 'uso' && !opcionDe(ch, d.id));
// Lo que se puede cambiar al terminar un descanso
export const opcionesCambiables = (ch, momento) => opcionesDe(ch).filter(d => d.cambia === 'corto' || (d.cambia === 'largo' && momento === 'largo'));
// Dados extra al impactar que da una opción elegida (Asesino de colosos)
export const golpesDeOpciones = ch => opcionesDe(ch).map(d => ({ d, o: opcionDe(ch, d.id) })).filter(x => x.o?.golpe).map(({ d, o }) => ({ nombre: o.nombre, rasgo: d.rasgo, ...o.golpe }));
