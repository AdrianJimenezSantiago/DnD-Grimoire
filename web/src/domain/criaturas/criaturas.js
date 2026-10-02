import { norm } from '../../core/util.js';

export const CARS = ['fue', 'des', 'con', 'int', 'sab', 'car'];
export const CAR_TXT = { fue: 'FUE', des: 'DES', con: 'CON', int: 'INT', sab: 'SAB', car: 'CAR' };
export const modDe = v => Math.floor((v - 10) / 2);
const ATQ = (bono, alc, dano) => `Tirada de ataque cuerpo a cuerpo: +${bono}, alcance ${alc}. Acierto: ${dano}.`;
const DIST = (bono, alc, dano) => `Tirada de ataque a distancia: +${bono}, alcance ${alc}. Acierto: ${dano}.`;
const TREPAR = ['Trepar cual arácnido', 'Puede trepar por superficies difíciles e incluso recorrer techos sin hacer pruebas de característica.'];
const RES_MAGICA = n => ['Resistencia mágica', `${n} tiene ventaja en las tiradas de salvación contra conjuros y otros efectos mágicos.`];
const INVIS = n => ['Invisibilidad', `${n} lanza invisibilidad sobre sí mismo sin necesidad de componentes; usa el Carisma como aptitud mágica.`];

export const PERFILES = {
  arana: { nombre: 'Araña', tipo: 'Bestia Diminuta, sin alineamiento', ca: 12, pg: '1 (1d4 − 1)', vel: '6 m, trepar 6 m', car: [2, 14, 8, 1, 10, 2],
    hab: 'Sigilo +4', sentidos: 'visión en la oscuridad 9 m, Percepción pasiva 10', vd: '0 (10 PX)',
    rasgos: [['Caminar por telarañas', 'Ignora las restricciones de movimiento de las telarañas y sabe dónde está cualquier otra criatura en contacto con la misma telaraña.'], TREPAR],
    acciones: [['Mordisco', ATQ(4, '1,5 m', '1 de daño perforante más 2 (1d4) de daño de veneno')]] },
  buho: { nombre: 'Búho', tipo: 'Bestia Diminuta, sin alineamiento', ca: 11, pg: '1 (1d4 − 1)', vel: '1,5 m, volar 18 m', car: [3, 13, 8, 2, 12, 7],
    hab: 'Percepción +5, Sigilo +5', sentidos: 'visión en la oscuridad 36 m, Percepción pasiva 15', vd: '0 (10 PX)',
    rasgos: [['Pasar volando', 'No provoca ataques de oportunidad cuando vuela para salir del alcance de un enemigo.']],
    acciones: [['Garras', ATQ(3, '1,5 m', '1 de daño cortante')]] },
  comadreja: { nombre: 'Comadreja', tipo: 'Bestia Diminuta, sin alineamiento', ca: 13, pg: '1 (1d4 − 1)', vel: '9 m, trepar 9 m', car: [3, 16, 8, 2, 12, 3],
    hab: 'Acrobacias +5, Percepción +3, Sigilo +5', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 13', vd: '0 (10 PX)',
    acciones: [['Mordisco', ATQ(5, '1,5 m', '1 de daño perforante')]] },
  cuervo: { nombre: 'Cuervo', tipo: 'Bestia Diminuta, sin alineamiento', ca: 12, pg: '2 (1d4)', vel: '3 m, volar 15 m', car: [2, 14, 10, 5, 13, 6],
    hab: 'Percepción +3', sentidos: 'Percepción pasiva 13', vd: '0 (10 PX)',
    rasgos: [['Imitación', 'Imita sonidos sencillos que haya oído, como un susurro o un trino. Quien lo oiga lo descubre con una prueba de Sabiduría (Perspicacia) CD 10.']],
    acciones: [['Pico', ATQ(4, '1,5 m', '1 de daño perforante')]] },
  gato: { nombre: 'Gato', tipo: 'Bestia Diminuta, sin alineamiento', ca: 12, pg: '2 (1d4)', vel: '12 m, trepar 12 m', car: [3, 15, 10, 3, 12, 7], salv: { des: 4 },
    hab: 'Percepción +3, Sigilo +4', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 13', vd: '0 (10 PX)',
    rasgos: [['Saltador', 'Su distancia de salto se calcula con la Destreza en lugar de la Fuerza.']],
    acciones: [['Arañazo', ATQ(4, '1,5 m', '1 de daño cortante')]] },
  halcon: { nombre: 'Halcón', tipo: 'Bestia Diminuta, sin alineamiento', ca: 13, pg: '1 (1d4 − 1)', vel: '3 m, volar 18 m', car: [5, 16, 8, 2, 14, 6],
    hab: 'Percepción +6', sentidos: 'Percepción pasiva 16', vd: '0 (10 PX)',
    acciones: [['Garras', ATQ(5, '1,5 m', '1 de daño cortante')]] },
  lagarto: { nombre: 'Lagarto', tipo: 'Bestia Diminuta, sin alineamiento', ca: 10, pg: '2 (1d4)', vel: '6 m, trepar 6 m', car: [2, 11, 10, 1, 8, 3],
    sentidos: 'visión en la oscuridad 9 m, Percepción pasiva 9', vd: '0 (10 PX)', rasgos: [TREPAR],
    acciones: [['Mordisco', ATQ(2, '1,5 m', '1 de daño perforante')]] },
  murcielago: { nombre: 'Murciélago', tipo: 'Bestia Diminuta, sin alineamiento', ca: 12, pg: '1 (1d4 − 1)', vel: '1,5 m, volar 9 m', car: [2, 15, 8, 2, 12, 4],
    sentidos: 'visión ciega 18 m, Percepción pasiva 11', vd: '0 (10 PX)',
    acciones: [['Mordisco', ATQ(4, '1,5 m', '1 de daño perforante')]] },
  pulpo: { nombre: 'Pulpo', tipo: 'Bestia Pequeña, sin alineamiento', ca: 12, pg: '3 (1d6)', vel: '1,5 m, nadar 9 m', car: [4, 15, 11, 3, 10, 4],
    hab: 'Percepción +2, Sigilo +6', sentidos: 'visión en la oscuridad 9 m, Percepción pasiva 12', vd: '0 (10 PX)',
    rasgos: [['Compresión', 'Pasa por un espacio de solo 2,5 cm de ancho sin gastar movimiento adicional.'], ['Respirar en el agua', 'Solo puede respirar bajo el agua.']],
    acciones: [['Tentáculos', ATQ(4, '1,5 m', '1 de daño contundente')]],
    reacciones: [['Nube de tinta (1/día)', 'Cuando una criatura termina su turno a 1,5 m o menos del pulpo bajo el agua, suelta tinta en un cubo de 1,5 m (muy oscuro durante 1 minuto) y se mueve hasta su velocidad nadando.']] },
  rana: { nombre: 'Rana', tipo: 'Bestia Diminuta, sin alineamiento', ca: 11, pg: '1 (1d4 − 1)', vel: '6 m, nadar 6 m', car: [1, 13, 8, 1, 8, 3],
    hab: 'Percepción +1, Sigilo +3', sentidos: 'visión en la oscuridad 9 m, Percepción pasiva 11', vd: '0 (10 PX)',
    rasgos: [['Anfibia', 'Respira dentro y fuera del agua.'], ['Saltar sin carrera', 'Salta hasta 3 m de longitud o 1,5 m de altura, con o sin carrerilla.']],
    acciones: [['Mordisco', ATQ(3, '1,5 m', '1 de daño perforante')]] },
  rata: { nombre: 'Rata', tipo: 'Bestia Diminuta, sin alineamiento', ca: 10, pg: '1 (1d4 − 1)', vel: '6 m, trepar 6 m', car: [2, 11, 9, 2, 10, 4],
    hab: 'Percepción +2', sentidos: 'visión en la oscuridad 9 m, Percepción pasiva 12', vd: '0 (10 PX)',
    rasgos: [['Ágil', 'No provoca ataques de oportunidad cuando se mueve para salir del alcance de un enemigo.']],
    acciones: [['Mordisco', ATQ(2, '1,5 m', '1 de daño perforante')]] },
  diablillo: { nombre: 'Diablillo', tipo: 'Infernal Diminuto (diablo), legal malvado', ca: 13, pg: '21 (6d4 + 6)', vel: '6 m, volar 12 m', car: [6, 17, 13, 11, 12, 14],
    hab: 'Engaño +4, Perspicacia +3, Sigilo +5', res: 'frío', inm: 'fuego, veneno; envenenado',
    sentidos: 'visión en la oscuridad 36 m (no la afecta la oscuridad mágica), Percepción pasiva 11', idiomas: 'común, infernal', vd: '1 (200 PX)',
    rasgos: [RES_MAGICA('El diablillo')],
    acciones: [['Aguijón', ATQ(5, '1,5 m', '6 (1d6 + 3) de daño perforante más 7 (2d6) de daño de veneno')],
      ['Cambio de forma', 'Adopta la forma de una araña (6 m, trepar 6 m), un cuervo (6 m, volar 18 m) o una rata (6 m), o vuelve a la suya. El perfil no cambia salvo la velocidad.'], INVIS('El diablillo')] },
  duende: { nombre: 'Duende', tipo: 'Feérico Diminuto, neutral bueno', ca: 15, pg: '10 (4d4)', vel: '3 m, volar 12 m', car: [3, 18, 10, 14, 13, 11],
    hab: 'Percepción +3, Sigilo +8', sentidos: 'Percepción pasiva 13', idiomas: 'común, élfico, silvano', vd: '1/4 (50 PX)',
    acciones: [['Espada aguja', ATQ(6, '1,5 m', '6 (1d4 + 4) de daño perforante')],
      ['Arco encantador', DIST(6, '12/48 m', '1 de daño perforante y el objetivo queda hechizado hasta el principio del siguiente turno del duende')],
      ['Visión del corazón', 'Salvación de Carisma CD 10, una criatura a 1,5 m (celestiales, infernales y muertos vivientes fallan siempre). Fallo: conoce sus emociones y su alineamiento.'],
      INVIS('El duende')] },
  esfinge: { nombre: 'Esfinge de las maravillas', tipo: 'Celestial Diminuto, legal bueno', ca: 13, pg: '24 (7d4 + 7)', vel: '6 m, volar 12 m', car: [6, 17, 13, 15, 12, 11],
    hab: 'Conocimiento arcano +4, Religión +4, Sigilo +5', res: 'necrótico, psíquico, radiante', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 11',
    idiomas: 'celestial, común', vd: '1 (200 PX)', rasgos: [RES_MAGICA('La esfinge')],
    acciones: [['Desgarro', ATQ(5, '1,5 m', '5 (1d4 + 3) de daño cortante más 7 (2d6) de daño radiante')]],
    reacciones: [['Arranque de ingenio (2/día)', 'Cuando ella u otra criatura a 9 m hace una prueba de característica o una salvación, suma 2 a la tirada.']] },
  esqueleto: { nombre: 'Esqueleto', tipo: 'Muerto viviente Mediano, legal malvado', ca: 14, pg: '13 (2d8 + 4)', vel: '9 m', car: [10, 16, 15, 6, 8, 5],
    vul: 'contundente', inm: 'veneno; cansancio, envenenado', equipo: 'arco corto, espada corta', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 9',
    idiomas: 'entiende los que conocía en vida, pero no habla', vd: '1/4 (50 PX)',
    acciones: [['Espada corta', ATQ(5, '1,5 m', '6 (1d6 + 3) de daño perforante')], ['Arco corto', DIST(5, '24/96 m', '6 (1d6 + 3) de daño perforante')]] },
  pseudodragon: { nombre: 'Pseudodragón', tipo: 'Dragón Diminuto, neutral bueno', ca: 14, pg: '10 (3d4 + 3)', vel: '4,5 m, volar 18 m', car: [6, 15, 13, 10, 12, 10],
    hab: 'Percepción +5, Sigilo +4', sentidos: 'visión ciega 3 m, visión en la oscuridad 18 m, Percepción pasiva 15', idiomas: 'entiende común y dracónico, pero no habla',
    vd: '1/4 (50 PX)', rasgos: [RES_MAGICA('El pseudodragón')],
    acciones: [['Ataque múltiple', 'Hace dos ataques de mordisco.'], ['Mordisco', ATQ(4, '1,5 m', '4 (1d4 + 2) de daño perforante')],
      ['Aguijón', 'Salvación de Constitución CD 12, una criatura a 1,5 m. Fallo: 5 (2d4) de daño de veneno y envenenado durante 1 hora; si falla por 5 o más, también inconsciente hasta que reciba daño o alguien lo despierte con una acción.']] },
  quasit: { nombre: 'Quasit', tipo: 'Infernal Diminuto (demonio), caótico malvado', ca: 13, pg: '25 (10d4)', vel: '12 m', car: [5, 17, 10, 7, 10, 10],
    hab: 'Sigilo +5', res: 'frío, fuego, relámpago', inm: 'veneno; envenenado', sentidos: 'visión en la oscuridad 36 m, Percepción pasiva 10', idiomas: 'abisal, común',
    vd: '1 (200 PX)', rasgos: [RES_MAGICA('El quasit')],
    acciones: [['Desgarro', ATQ(5, '1,5 m', '5 (1d4 + 3) de daño cortante y el objetivo queda envenenado hasta el principio del siguiente turno del quasit')],
      ['Asustar (1/día)', 'Salvación de Sabiduría CD 10, una criatura a 6 m. Fallo: asustada; repite la salvación al final de cada turno y a los 10 minutos la supera sola.'],
      ['Cambio de forma', 'Adopta la forma de un ciempiés (12 m, trepar 12 m), un murciélago (3 m, volar 12 m) o un sapo (12 m, nadar 12 m), o vuelve a la suya.'], INVIS('El quasit')] },
  renacuajo: { nombre: 'Renacuajo slaad', tipo: 'Aberración Diminuta, caótica neutral', ca: 12, pg: '7 (3d4)', vel: '9 m, excavar 3 m', car: [7, 15, 10, 3, 5, 3],
    hab: 'Sigilo +4', res: 'ácido, frío, fuego, relámpago, trueno', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 7', idiomas: 'entiende slaad, pero no habla',
    vd: '1/8 (25 PX)', rasgos: [RES_MAGICA('El slaad')], acciones: [['Mordisco', ATQ(4, '1,5 m', '5 (1d6 + 2) de daño perforante')]] },
  serpiente: { nombre: 'Serpiente venenosa', tipo: 'Bestia Diminuta, sin alineamiento', ca: 12, pg: '5 (2d4)', vel: '9 m, nadar 9 m', car: [2, 15, 11, 1, 10, 3],
    sentidos: 'visión ciega 3 m, Percepción pasiva 10', vd: '1/8 (25 PX)',
    acciones: [['Mordisco', ATQ(4, '1,5 m', '4 (1d4 + 2) de daño perforante más 3 (1d6) de daño de veneno')]] },
  caballo: { nombre: 'Caballo de monta', tipo: 'Bestia Grande, sin alineamiento', ca: 11, pg: '13 (2d10 + 2)', vel: '18 m', car: [16, 13, 12, 2, 11, 7],
    sentidos: 'Percepción pasiva 10', vd: '1/4 (50 PX)', acciones: [['Cascos', ATQ(5, '1,5 m', '7 (1d8 + 3) de daño contundente')]] },
  zombi: { nombre: 'Zombi', tipo: 'Muerto viviente Mediano, neutral malvado', ca: 8, pg: '15 (2d8 + 6)', vel: '6 m', car: [13, 6, 16, 3, 6, 5], salv: { sab: 0 },
    inm: 'veneno; cansancio, envenenado', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 8', idiomas: 'entiende los que conocía en vida, pero no habla', vd: '1/4 (50 PX)',
    rasgos: [['Fortaleza de muerto viviente', 'Si el daño lo deja a 0 PG, hace una salvación de Constitución (CD 5 + el daño). Si la supera se queda con 1 PG, salvo que el daño sea radiante o de un crítico.']],
    acciones: [['Golpe', ATQ(3, '1,5 m', '5 (1d8 + 1) de daño contundente')]] },
};

const mitad = n => Math.floor(n / 2);
const VD_NINGUNO = 'ninguno (BC igual al tuyo)';
export const ESPIRITUS = {
  bestia: { nombre: 'Espíritu bestial', base: 2, variantes: ['tierra', 'mar', 'aire'], perfil: ({ n, v, atk }) => ({
    tipo: 'Bestia Pequeña, neutral', ca: 11 + n, pg: String((v === 'aire' ? 20 : 30) + 5 * (n - 2)),
    vel: { tierra: '9 m, trepar 9 m', mar: '9 m, nadar 9 m', aire: '9 m, volar 18 m' }[v], car: [18, 11, 16, 4, 14, 5],
    sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 12', idiomas: 'entiende los idiomas que conozcas', vd: VD_NINGUNO,
    rasgos: v === 'aire' ? [['Pasar volando', 'No provoca ataques de oportunidad cuando vuela para salir del alcance de un enemigo.']]
      : [['Atacar en manada', 'Ventaja en un ataque contra una criatura si un aliado suyo no incapacitado está a 1,5 m de ella.'], ...(v === 'mar' ? [['Respirar en el agua', 'Solo puede respirar bajo el agua.']] : [])],
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'} de desgarro.`], ['Desgarro', ATQ(atk, '1,5 m', `1d8 + ${4 + n} de daño perforante`)]] }) },
  feerico: { nombre: 'Espíritu feérico', base: 3, variantes: ['alegre', 'burlón', 'enfurecido'], perfil: ({ n, v, atk, cd }) => ({
    tipo: 'Feérico Pequeño, neutral', ca: 12 + n, pg: String(30 + 10 * (n - 3)), vel: '9 m, volar 9 m', car: [13, 16, 14, 14, 11, 16],
    inm: 'hechizado', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 10', idiomas: 'silvano, entiende los idiomas que conozcas', vd: VD_NINGUNO,
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'} con su filo feérico.`], ['Filo feérico', ATQ(atk, '1,5 m', `2d6 + ${3 + n} de daño de fuerza`)]],
    adicionales: [['Paso feérico', `Se teletransporta hasta 9 m a un espacio que vea. ${{ alegre: `Luego, salvación de Sabiduría CD ${cd} de una criatura a 3 m; si falla, queda hechizada por ti y el espíritu 1 minuto o hasta que sufra daño.`,
      'burlón': 'Luego llena de oscuridad mágica un cubo de 3 m a 1,5 m de él hasta el final de su siguiente turno.', enfurecido: 'Luego tiene ventaja en su siguiente ataque de este turno.' }[v]}`]] }) },
  muerto: { nombre: 'Espíritu muerto viviente', base: 3, variantes: ['esquelético', 'fantasmal', 'pútrido'], perfil: ({ n, v, atk, cd }) => ({
    tipo: 'Muerto viviente Mediano, neutral', ca: 11 + n, pg: String((v === 'esquelético' ? 20 : 30) + 10 * (n - 3)), vel: v === 'fantasmal' ? '9 m, volar 12 m (levitar)' : '9 m',
    car: [12, 16, 15, 4, 10, 9], inm: 'necrótico, veneno; asustado, cansancio, envenenado, paralizado', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 10',
    idiomas: 'entiende los idiomas que conozcas', vd: VD_NINGUNO,
    rasgos: v === 'pútrido' ? [['Aura purulenta', `Salvación de Constitución CD ${cd} para cualquier criatura (salvo tú) que empiece su turno a 1,5 m. Fallo: envenenada hasta el principio de su siguiente turno.`]]
      : v === 'fantasmal' ? [['Pasaje incorpóreo', 'Atraviesa criaturas y objetos como terreno difícil; si acaba su turno dentro de un objeto, sale al espacio libre más cercano y sufre 1d10 de fuerza por cada 1,5 m.']] : [],
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'}.`],
      v === 'pútrido' ? ['Garra purulenta', ATQ(atk, '1,5 m', `1d6 + ${3 + n} de daño cortante; si el objetivo está envenenado, queda paralizado hasta el final de su siguiente turno`)]
        : v === 'fantasmal' ? ['Toque mortal', ATQ(atk, '1,5 m', `1d8 + ${3 + n} de daño necrótico y el objetivo queda asustado hasta el final de su siguiente turno`)]
          : ['Rayo sepulcral', DIST(atk, '45 m', `2d4 + ${3 + n} de daño necrótico`)]] }) },
  aberracion: { nombre: 'Espíritu aberrante', base: 4, variantes: ['azotamentes', 'contemplador', 'slaad'], perfil: ({ n, v, atk, cd }) => ({
    tipo: 'Aberración Mediana, neutral', ca: 11 + n, pg: String(40 + 10 * (n - 4)), vel: v === 'contemplador' ? '9 m, volar 9 m (levitar)' : '9 m', car: [16, 10, 15, 16, 10, 6],
    inm: 'psíquico', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 10', idiomas: 'habla de las profundidades, entiende los idiomas que conozcas', vd: VD_NINGUNO,
    rasgos: v === 'azotamentes' ? [['Aura susurrante', `Al comienzo de cada turno del espíritu, salvación de Sabiduría CD ${cd} para todas las criaturas (salvo tú) a 1,5 m. Fallo: 2d6 de daño psíquico.`]]
      : v === 'slaad' ? [['Regeneración', 'Recupera 5 PG al principio de su turno si tiene al menos 1.']] : [],
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'}.`],
      v === 'slaad' ? ['Garra', ATQ(atk, '1,5 m', `1d10 + ${3 + n} de daño cortante y el objetivo no puede recuperar PG hasta el principio del siguiente turno del espíritu`)]
        : v === 'azotamentes' ? ['Golpe psíquico', ATQ(atk, '1,5 m', `1d8 + ${3 + n} de daño psíquico`)]
          : ['Rayo ocular', DIST(atk, '45 m', `1d8 + ${3 + n} de daño psíquico`)]] }) },
  automata: { nombre: 'Espíritu autómata', base: 4, variantes: ['arcilla', 'metal', 'piedra'], perfil: ({ n, v, atk, cd }) => ({
    tipo: 'Autómata Mediano, neutral', ca: 13 + n, pg: String(40 + 15 * (n - 4)), vel: '9 m', car: [18, 10, 18, 14, 11, 5],
    res: 'veneno', inm: 'asustado, cansancio, envenenado, hechizado, paralizado', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 10', idiomas: 'entiende los idiomas que conozcas', vd: VD_NINGUNO,
    rasgos: v === 'metal' ? [['Cuerpo abrasador', 'Quien le acierte cuerpo a cuerpo o empiece su turno agarrado por él sufre 1d10 de daño de fuego.']]
      : v === 'piedra' ? [['Letargo pétreo', `Cuando una criatura que vea empieza su turno a 3 m, salvación de Sabiduría CD ${cd}. Fallo: hasta su siguiente turno no hace ataques de oportunidad y su velocidad se reduce a la mitad.`]] : [],
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'} con su golpe.`], ['Golpe', ATQ(atk, '1,5 m', `1d8 + ${4 + n} de daño contundente`)]],
    reacciones: v === 'arcilla' ? [['Azote berserk', 'Cuando una criatura le causa daño, la ataca con su golpe si puede o se mueve hasta la mitad de su velocidad hacia ella sin provocar ataques de oportunidad.']] : [] }) },
  elemental: { nombre: 'Espíritu elemental', base: 4, variantes: ['agua', 'aire', 'fuego', 'tierra'], perfil: ({ n, v, atk }) => ({
    tipo: 'Elemental Mediano, neutral', ca: 11 + n, pg: String(50 + 10 * (n - 4)),
    vel: { tierra: '12 m, excavar 12 m', agua: '12 m, nadar 12 m', aire: '12 m, volar 12 m (levitar)', fuego: '12 m' }[v], car: [18, 15, 17, 4, 10, 16],
    res: { agua: 'ácido', tierra: 'cortante, perforante', aire: 'relámpago, trueno', fuego: '' }[v], inm: `${v === 'fuego' ? 'fuego, ' : ''}veneno; cansancio, envenenado, paralizado, petrificado`,
    sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 10', idiomas: 'primordial, entiende los idiomas que conozcas', vd: VD_NINGUNO,
    rasgos: v === 'tierra' ? [] : [['Forma amorfa', 'Pasa por un espacio de solo 2,5 cm de ancho sin que cuente como terreno difícil.']],
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'} con su golpe.`],
      ['Golpe', ATQ(atk, '1,5 m', `1d10 + ${4 + n} de daño ${{ tierra: 'contundente', agua: 'de frío', fuego: 'de fuego', aire: 'de relámpago' }[v]}`)]] }) },
  celestial: { nombre: 'Espíritu celestial', base: 5, variantes: ['defensor', 'vengador'], perfil: ({ n, v, atk }) => ({
    tipo: 'Celestial Grande, neutral', ca: 11 + n + (v === 'defensor' ? 2 : 0), pg: String(40 + 10 * (n - 5)), vel: '9 m, volar 12 m', car: [16, 14, 16, 10, 14, 16],
    res: 'radiante', inm: 'asustado, hechizado', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 12', idiomas: 'celestial, entiende los idiomas que conozcas', vd: VD_NINGUNO,
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'}.`],
      v === 'defensor' ? ['Maza radiante', ATQ(atk, '1,5 m', `1d10 + ${3 + n} de daño radiante; el espíritu u otra criatura a 3 m del objetivo gana 1d10 PG temporales`)]
        : ['Arco radiante', DIST(atk, '180 m', `2d6 + ${2 + n} de daño radiante`)],
      ['Toque sanador (1/día)', `Toca a otra criatura, que recupera 2d8 + ${n} PG.`]] }) },
  dragon: { nombre: 'Espíritu dracónico', base: 5, variantes: [], perfil: ({ n, atk, cd }) => ({
    tipo: 'Dragón Grande, neutral', ca: 14 + n, pg: String(50 + 10 * (n - 5)), vel: '9 m, nadar 9 m, volar 18 m', car: [19, 14, 17, 10, 14, 14],
    res: 'ácido, frío, fuego, relámpago, veneno', inm: 'asustado, envenenado, hechizado', sentidos: 'visión ciega 9 m, visión en la oscuridad 18 m, Percepción pasiva 12',
    idiomas: 'dracónico, entiende los idiomas que conozcas', vd: VD_NINGUNO,
    rasgos: [['Resistencias compartidas', 'Al invocarlo, elige una de sus resistencias: tú también la tienes mientras dure el conjuro.']],
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'} de desgarro y usa su aliento.`], ['Desgarro', ATQ(atk, '3 m', `1d6 + ${4 + n} de daño perforante`)],
      ['Ataque de aliento', `Salvación de Destreza CD ${cd}, todas las criaturas en un cono de 9 m. Fallo: 2d6 de daño de un tipo al que resista (lo eliges al lanzar). Éxito: la mitad.`]] }) },
  infernal: { nombre: 'Espíritu infernal', base: 6, variantes: ['demonio', 'diablo', 'yugoloth'], perfil: ({ n, v, atk, cd }) => ({
    tipo: 'Infernal Grande, neutral', ca: 12 + n, pg: String({ demonio: 50, diablo: 40, yugoloth: 60 }[v] + 15 * (n - 6)),
    vel: { demonio: '12 m, trepar 12 m', diablo: '12 m, volar 18 m', yugoloth: '12 m' }[v], car: [13, 16, 15, 10, 10, 16],
    res: 'fuego', inm: 'veneno; envenenado', sentidos: 'visión en la oscuridad 18 m, Percepción pasiva 10', idiomas: 'abisal, infernal; telepatía 18 m', vd: VD_NINGUNO,
    rasgos: [RES_MAGICA('El espíritu'), ...(v === 'demonio' ? [['Últimos estertores', `Cuando llega a 0 PG o el conjuro termina, explota: salvación de Destreza CD ${cd} en una emanación de 3 m; 2d10 + ${n} de daño de fuego, la mitad si la supera.`]]
      : v === 'diablo' ? [['Vista del diablo', 'La oscuridad mágica no le impide ver en la oscuridad.']] : [])],
    acciones: [['Ataque múltiple', `Hace ${mitad(n)} ${mitad(n) === 1 ? 'ataque' : 'ataques'}.`],
      v === 'demonio' ? ['Mordisco', ATQ(atk, '1,5 m', `1d12 + ${3 + n} de daño necrótico`)]
        : v === 'diablo' ? ['Golpe ardiente', `Tirada de ataque cuerpo a cuerpo o a distancia: +${atk}, alcance 1,5 m o 45 m. Acierto: 2d6 + ${3 + n} de daño de fuego.`]
          : ['Garras', `${ATQ(atk, '1,5 m', `1d8 + ${3 + n} de daño cortante`)} Justo después puede teletransportarse hasta 9 m.`]] }) },
  corcel: { nombre: 'Corcel sobrenatural', base: 2, variantes: ['celestial', 'feérico', 'infernal'], perfil: ({ n, v, atk, cd }) => ({
    tipo: `${v.charAt(0).toUpperCase() + v.slice(1)} Grande, neutral`, ca: 10 + n, pg: `${5 + 10 * n} (${n}d10)`, vel: n >= 4 ? '18 m, volar 18 m' : '18 m', car: [18, 12, 14, 6, 12, 8],
    sentidos: 'Percepción pasiva 11', idiomas: 'telepatía 1,5 km (solo contigo)', vd: VD_NINGUNO,
    rasgos: [['Vínculo vital', 'Cuando recuperas PG con un conjuro de nivel 1 o superior, el corcel recupera los mismos si está a 1,5 m de ti.']],
    acciones: [['Golpetazo sobrenatural', ATQ(atk, '1,5 m', `1d8 + ${n} de daño ${{ celestial: 'radiante', 'feérico': 'psíquico', infernal: 'necrótico' }[v]}`)]],
    adicionales: [v === 'celestial' ? ['Toque sanador (1/descanso largo)', `Una criatura a 1,5 m recupera 2d8 + ${n} PG.`]
      : v === 'feérico' ? ['Paso feérico (1/descanso largo)', 'Se teletransporta con su jinete a un espacio libre a 18 m.']
        : ['Mirada siniestra (1/descanso largo)', `Salvación de Sabiduría CD ${cd}, una criatura a 18 m que vea. Fallo: asustada hasta el final de tu siguiente turno.`]] }) },
};

const POR_CONJURO = {
  'encontrar familiar': { otrasVd0: true, familiar: ['arana', 'buho', 'comadreja', 'cuervo', 'gato', 'halcon', 'lagarto', 'murcielago', 'pulpo', 'rana', 'rata'],
    cadena: ['diablillo', 'duende', 'esfinge', 'esqueleto', 'pseudodragon', 'quasit', 'renacuajo', 'serpiente'] },
  'corcel fantasma': { fijos: ['caballo'], nota: 'El corcel es un caballo de monta cuasirreal que usa este perfil.' },
  'animar a los muertos': { fijos: ['esqueleto', 'zombi'], nota: 'Un montón de huesos se levanta como esqueleto y un cadáver, como zombi.' },
  'crear muerto viviente': { importadas: ['Necrófago', 'Ghast', 'Tumulario', 'Momia'], nota: 'Nivel 6: necrófagos. Con espacios superiores, ghasts o tumularios (nivel 8) y momias (nivel 9).' },
  'polimorfar': { formas: 'polimorfar' }, 'polimorfar verdadero': { formas: 'verdadero' }, 'cambiar de forma': { formas: 'verdadero' },
  'hallar corcel': { espiritu: 'corcel' },
  'invocar bestia': { espiritu: 'bestia' }, 'invocar feerico': { espiritu: 'feerico' }, 'invocar muerto viviente': { espiritu: 'muerto' },
  'invocar aberracion': { espiritu: 'aberracion' }, 'invocar automata': { espiritu: 'automata' }, 'invocar elemental': { espiritu: 'elemental' },
  'invocar celestial': { espiritu: 'celestial' }, 'invocar dragon': { espiritu: 'dragon' }, 'invocar infernal': { espiritu: 'infernal' },
};
export const criaturasDe = nombre => POR_CONJURO[norm(nombre).trim()] || null;

export function perfilDe(id, ctx = {}) {
  if (PERFILES[id]) return { id, ...PERFILES[id] };
  const e = ESPIRITUS[id]; if (!e) return null;
  const n = Math.max(e.base, Math.min(9, ctx.n || e.base)), v = e.variantes.includes(ctx.v) ? ctx.v : e.variantes[0];
  return { id, nombre: e.nombre + (v ? ` (${v})` : ''), n, v, ...e.perfil({ n, v, atk: ctx.atk ?? 0, cd: ctx.cd ?? 10 }) };
}
export const caracteristicas = p => CARS.map((k, i) => ({ k, v: p.car[i], mod: modDe(p.car[i]), salv: p.salv?.[k] ?? modDe(p.car[i]) }));
