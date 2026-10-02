import { norm } from '../../core/util.js';

// Especies del Manual del Jugador de 2024: atributos por nivel de personaje, linajes y legados que se eligen,
// conjuros de especie (siempre preparados; los de nivel 3 y 5 se lanzan una vez al día sin espacio) y resistencias.
export const especieBase = ch => norm(ch?.especie || '').split(/[\s(]/)[0];

// Atributos de cada especie (nombre del libro y nivel de personaje) para «En juego» aunque no se haya importado el manual
export const RASGOS_ESPECIE = {
  aasimar: [[1, 'Manos curativas'], [1, 'Portador de luz'], [1, 'Resistencia celestial'], [1, 'Visión en la oscuridad'], [3, 'Revelación celestial']],
  draconido: [[1, 'Linaje dracónico'], [1, 'Ataque de aliento'], [1, 'Resistencia al daño'], [1, 'Visión en la oscuridad'], [5, 'Vuelo dracónico']],
  elfo: [[1, 'Linaje élfico'], [1, 'Linaje feérico'], [1, 'Sentidos agudos'], [1, 'Trance'], [1, 'Visión en la oscuridad']],
  enano: [[1, 'Afinidad con la piedra'], [1, 'Aguante enano'], [1, 'Resistencia enana'], [1, 'Visión en la oscuridad']],
  gnomo: [[1, 'Astucia gnoma'], [1, 'Linaje gnomo'], [1, 'Visión en la oscuridad']],
  goliat: [[1, 'Constitución poderosa'], [5, 'Forma grande'], [1, 'Linaje gigante']],
  humano: [[1, 'Diestro'], [1, 'Ingenioso'], [1, 'Versátil']],
  mediano: [[1, 'Agilidad de mediano'], [1, 'Fortuna'], [1, 'Sigiloso por naturaleza'], [1, 'Valiente']],
  orco: [[1, 'Aguante incansable'], [1, 'Descarga de adrenalina'], [1, 'Visión en la oscuridad']],
  tiefling: [[1, 'Legado infernal'], [1, 'Presencia sobrenatural'], [1, 'Visión en la oscuridad']],
};

// Nivel de personaje al que se gana cada atributo (para corregir lo que lea el libro: «A partir del nivel 5»)
export const nivelRasgoEspecie = (ch, nombre) => (RASGOS_ESPECIE[especieBase(ch)] || []).find(([, n]) => norm(n) === norm(nombre))?.[0] || 1;

// Visión en la oscuridad: 36 m el enano, el orco y el drow; 18 m el resto de especies que la tienen
const VISION = { aasimar: 18, draconido: 18, elfo: 18, enano: 36, gnomo: 18, orco: 36, tiefling: 18 };
export const visionOscuridad = ch => (linajeActual(ch)?.vision || VISION[especieBase(ch)] || 0);

// Resumen de cada atributo (sin el manual importado, para que «En juego» no quede vacío)
const RESUMEN = {
  'manos curativas': 'Acción de magia: tocas a una criatura y recupera tantos d4 como tu bonificador por competencia. Una vez por descanso largo.',
  'portador de luz': 'Conoces el truco luz (aptitud mágica: Carisma).',
  'resistencia celestial': 'Resistencia al daño necrótico y radiante.',
  'revelacion celestial': 'Acción adicional, una vez por descanso largo: te transformas 1 minuto (Alas celestiales, Fulgor interior o Mortaja necrótica, a elegir cada vez). Una vez por turno sumas tu competencia como daño radiante (necrótico con Mortaja) a un ataque o conjuro.',
  'linaje draconico': 'Tu dragón progenitor fija el tipo de tu Ataque de aliento y de tu resistencia.',
  'ataque de aliento': 'Sustituye un ataque de la acción de Atacar: cono de 4,5 m o línea de 9 m, salvación de Destreza (CD 8 + Con + competencia), 1d10 (2d10 a nivel 5, 3d10 a 11, 4d10 a 17), mitad si la supera. Usos: competencia por descanso largo.',
  'resistencia al dano': 'Resistencia al tipo de daño de tu linaje dracónico.',
  'vuelo draconico': 'Acción adicional, una vez por descanso largo: alas espectrales 10 minutos con velocidad volando igual a tu velocidad. Terminan si quedas incapacitado.',
  'linaje elfico': 'Truco de tu linaje y, a niveles 3 y 5, un conjuro siempre preparado que lanzas una vez gratis por descanso largo.',
  'linaje feerico': 'Ventaja en las salvaciones para evitar o poner fin al estado de hechizado.',
  'sentidos agudos': 'Competencia en Percepción, Perspicacia o Supervivencia.',
  trance: 'No necesitas dormir y la magia no puede dormirte. Terminas un descanso largo en 4 horas de trance.',
  'afinidad con la piedra': 'Acción adicional: sentir vibraciones a 18 m durante 10 minutos, sobre piedra. Usos: competencia por descanso largo.',
  'aguante enano': 'Tus PG máximos suben 1 por nivel.',
  'resistencia enana': 'Resistencia al veneno y ventaja en las salvaciones para evitar o poner fin al estado de envenenado.',
  'astucia gnoma': 'Ventaja en las salvaciones de Inteligencia, Sabiduría y Carisma.',
  'linaje gnomo': 'Gnomo de las rocas: prestidigitación, reparar y dispositivos mecánicos. Gnomo de los bosques: ilusión menor y hablar con los animales gratis (competencia por descanso largo).',
  'constitucion poderosa': 'Ventaja en las pruebas para poner fin al estado de agarrado; tu capacidad de carga es la de un tamaño más.',
  'forma grande': 'Desde el nivel 5, acción adicional una vez por descanso largo: eres Grande 10 minutos, con ventaja en las pruebas de Fuerza y +3 m de velocidad.',
  'linaje gigante': 'Un beneficio de tu gigante ancestral; lo usas tantas veces como tu competencia por descanso largo.',
  diestro: 'Competencia en una habilidad a tu elección.',
  ingenioso: 'Ganas inspiración heroica al terminar un descanso largo.',
  versatil: 'Una dote de origen a tu elección.',
  'agilidad de mediano': 'Puedes atravesar el espacio de criaturas más grandes que tú, sin detenerte en él.',
  fortuna: 'Si sacas un 1 en una prueba con d20, repites la tirada y usas el nuevo resultado.',
  'sigiloso por naturaleza': 'Puedes esconderte tras una criatura al menos una categoría de tamaño mayor que tú.',
  valiente: 'Ventaja en las salvaciones para evitar o poner fin al estado de asustado.',
  'aguante incansable': 'Al caer a 0 PG sin morir, te quedas a 1 PG. Una vez por descanso largo.',
  'descarga de adrenalina': 'Correr como acción adicional y ganas PG temporales iguales a tu competencia. Usos: competencia por descanso corto o largo.',
  'legado infernal': 'Resistencia y truco de tu legado y, a niveles 3 y 5, un conjuro siempre preparado que lanzas una vez gratis por descanso largo.',
  'presencia sobrenatural': 'Conoces el truco taumaturgia, con la aptitud mágica de tu Legado infernal.',
};
export function resumenRasgoEspecie(ch, nombre) {
  const n = norm(nombre);
  if (n === 'vision en la oscuridad') { const m = visionOscuridad(ch); return m ? `Ves en la oscuridad hasta ${m} m (la luz tenue como brillante y la oscuridad como tenue, en tonos de gris).` : ''; }
  return RESUMEN[n] || '';
}

const O = (nombre, texto, extra = {}) => ({ nombre, texto, ...extra });
const DRAGONES = [['Azul', 'Relámpago'], ['Blanco', 'Frío'], ['Bronce', 'Relámpago'], ['Cobre', 'Ácido'], ['Negro', 'Ácido'], ['Oro', 'Fuego'], ['Oropel', 'Fuego'], ['Plata', 'Frío'], ['Rojo', 'Fuego'], ['Verde', 'Veneno']];
// Linajes y legados: se eligen al crear el personaje (re: cómo reconocerlos en el nombre de la especie, «Elfo (drow)»)
export const LINAJES = [
  { id: 'especie.elfo', especie: 'elfo', rasgo: 'Linaje élfico', cambia: 'fija', opciones: [
    O('Alto elfo', 'Truco prestidigitación (puedes cambiarlo por otro de mago tras un descanso largo); Detectar magia (nivel 3) y Paso brumoso (nivel 5).', { re: /alto|high/, trucos: ['Prestidigitación'], conjuros: { 3: 'Detectar magia', 5: 'Paso brumoso' } }),
    O('Drow', 'Visión en la oscuridad de 36 m y truco luces danzantes; Fuego feérico (nivel 3) y Oscuridad (nivel 5).', { re: /drow|oscur/, trucos: ['Luces danzantes'], conjuros: { 3: 'Fuego feérico', 5: 'Oscuridad' }, vision: 36 }),
    O('Elfo de los bosques', 'Velocidad de 10,5 m y truco saber druídico; Zancada prodigiosa (nivel 3) y Pasar sin rastro (nivel 5).', { re: /bosque|silvan|wood/, trucos: ['Saber druídico'], conjuros: { 3: 'Zancada prodigiosa', 5: 'Pasar sin rastro' }, vel: 10.5 }) ] },
  { id: 'especie.gnomo', especie: 'gnomo', rasgo: 'Linaje gnomo', cambia: 'fija', opciones: [
    O('Gnomo de las rocas', 'Trucos prestidigitación y reparar; puedes crear dispositivos mecánicos diminutos.', { re: /roca|rock/, trucos: ['Prestidigitación', 'Reparar'] }),
    O('Gnomo de los bosques', 'Truco ilusión menor y Hablar con los animales siempre preparado, gratis tantas veces como tu bonificador por competencia.', { re: /bosque|forest/, trucos: ['Ilusión menor'], conjuros: { 1: 'Hablar con los animales' }, gratisPb: true }) ] },
  { id: 'especie.tiefling', especie: 'tiefling', rasgo: 'Legado infernal', cambia: 'fija', opciones: [
    O('Abisal', 'Resistencia al veneno y truco rociada venenosa; Rayo nauseabundo (nivel 3) e Inmovilizar persona (nivel 5).', { re: /abis/, trucos: ['Rociada venenosa'], conjuros: { 3: 'Rayo nauseabundo', 5: 'Inmovilizar persona' }, resiste: 'veneno' }),
    O('Ctónico', 'Resistencia al daño necrótico y truco toque helado; Falsa vida (nivel 3) y Rayo debilitador (nivel 5).', { re: /cton/, trucos: ['Toque helado'], conjuros: { 3: 'Falsa vida', 5: 'Rayo debilitador' }, resiste: 'necrótico' }),
    O('Infernal', 'Resistencia al fuego y truco descarga de fuego; Reprensión infernal (nivel 3) y Oscuridad (nivel 5).', { re: /infern/, trucos: ['Descarga de fuego'], conjuros: { 3: 'Reprensión infernal', 5: 'Oscuridad' }, resiste: 'fuego' }) ] },
  { id: 'especie.goliat', especie: 'goliat', rasgo: 'Linaje gigante', cambia: 'fija', opciones: [
    O('Abrasión del fuego', 'Al acertar un ataque que cause daño, +1d10 de fuego (usos: bonificador por competencia).', { re: /fuego/, golpe: { dado: '1d10', tipo: 'fuego' } }),
    O('Caída de las colinas', 'Al acertar a una criatura Grande o menor, puedes derribarla.', { re: /colina/, golpe: { dado: '', tipo: 'derribada' } }),
    O('Excursión de las nubes', 'Acción adicional: te teletransportas hasta 9 m.', { re: /nube/ }),
    O('Frío de la escarcha', 'Al acertar un ataque que cause daño, +1d6 de frío y su velocidad baja 3 m.', { re: /escarcha|hielo/, golpe: { dado: '1d6', tipo: 'frío' } }),
    O('Resistencia de la piedra', 'Reacción al recibir daño: lo reduces en 1d12 + tu Constitución.', { re: /piedra/ }),
    O('Trueno de la tormenta', 'Reacción cuando alguien a 18 m te daña: le haces 1d8 de trueno.', { re: /tormenta/ }) ] },
  { id: 'especie.draconido', especie: 'draconido', rasgo: 'Linaje dracónico', cambia: 'fija', opciones: DRAGONES.map(([d, t]) =>
    O(`Dragón ${d.toLowerCase()}`, `Tu Ataque de aliento y tu resistencia son de ${t.toLowerCase()}.`, { re: new RegExp(`\\b${norm(d)}\\b`), dano: t.toLowerCase(), resiste: t.toLowerCase() })) },
  { id: 'especie.aasimar', especie: 'aasimar', rasgo: 'Revelación celestial', nivel: 3, cambia: 'uso', opciones: [
    O('Alas celestiales', 'Velocidad volando igual a tu velocidad; +competencia de daño radiante una vez por turno.', { tipo: 'radiante' }),
    O('Fulgor interior', 'Luz brillante de 3 m; al final de cada turno, daño radiante igual a tu competencia a las criaturas a 3 m; +competencia de daño radiante una vez por turno.', { tipo: 'radiante' }),
    O('Mortaja necrótica', 'Salvación de Carisma o asustadas las criaturas a 3 m; +competencia de daño necrótico una vez por turno.', { tipo: 'necrótico' }) ] },
];

// Opción de linaje: la elegida, o la que diga el nombre de la especie («Elfo (drow)», «Tiefling infernal»)
export function linajeDe(ch, id) {
  const d = LINAJES.find(x => x.id === id); if (!d || especieBase(ch) !== d.especie) return null;
  const elegido = d.opciones.find(o => o.nombre === ch.opciones?.[id]); if (elegido) return elegido;
  const resto = norm(ch.especie || '').slice(d.especie.length);
  return resto.trim() ? d.opciones.find(o => o.re?.test(resto)) || null : null;
}
export const linajeActual = ch => { const d = LINAJES.find(x => x.especie === especieBase(ch) && x.cambia !== 'uso'); return d ? linajeDe(ch, d.id) : null; };

// Aptitud mágica de los conjuros de especie (elfo, gnomo y tiefling): Inteligencia, Sabiduría o Carisma, a elegir.
// Sin elegir: la de tu clase si es una de esas tres; si no, la más alta.
export const ESPECIES_APTITUD = { elfo: 'Linaje élfico', gnomo: 'Linaje gnomo', tiefling: 'Legado infernal' };
export const APTITUD_ESPECIE = { id: 'especie.aptitud', rasgo: 'Aptitud mágica de especie', cambia: 'fija', opciones: [
  O('Inteligencia', 'Tus conjuros de especie usan la Inteligencia.', { ab: 'int' }), O('Sabiduría', 'Tus conjuros de especie usan la Sabiduría.', { ab: 'sab' }),
  O('Carisma', 'Tus conjuros de especie usan el Carisma.', { ab: 'car' })] };
export const FUENTES_APTITUD = ['Linaje élfico', 'Linaje gnomo', 'Legado infernal', 'Presencia sobrenatural'];
export function aptitudEspecie(ch, stats = ch.stats || {}, apClase = '') {
  if (!ESPECIES_APTITUD[especieBase(ch)]) return '';
  const elegida = APTITUD_ESPECIE.opciones.find(o => o.nombre === ch.opciones?.[APTITUD_ESPECIE.id]); if (elegida) return elegida.ab;
  if (['int', 'sab', 'car'].includes(apClase)) return apClase;
  return ['int', 'sab', 'car'].reduce((a, b) => ((parseInt(stats[b], 10) || 10) > (parseInt(stats[a], 10) || 10) ? b : a));
}

// Conjuros de especie: trucos y, a niveles 3 y 5, conjuros con un uso gratis al día
export function conjurosEspecie(ch, nivel) {
  const out = [], e = especieBase(ch), L = nivel ?? 1;
  const add = (nombre, n, fuente, gratis = '') => { if (L >= n) out.push({ nombre, nivel: n, fuente, gratis, ritual: false }); };
  if (e === 'aasimar') add('Luz', 1, 'Portador de luz');
  if (e === 'tiefling') add('Taumaturgia', 1, 'Presencia sobrenatural');
  const lin = linajeActual(ch), d = LINAJES.find(x => x.especie === e);
  if (lin && d) {
    for (const t of lin.trucos || []) add(t, 1, d.rasgo);
    for (const [n, c] of Object.entries(lin.conjuros || {})) add(c, +n, d.rasgo, lin.gratisPb ? '' : '1/DL');
  }
  return out;
}

// Resistencias al daño de la especie
export function resistenciasEspecie(ch) {
  const e = especieBase(ch), out = [], lin = linajeActual(ch);
  if (e === 'aasimar') out.push(['necrótico', 'Resistencia celestial'], ['radiante', 'Resistencia celestial']);
  if (e === 'enano') out.push(['veneno', 'Resistencia enana']);
  if (lin?.resiste) out.push([lin.resiste, e === 'draconido' ? 'Resistencia al daño' : 'Legado infernal']);
  return out;
}
