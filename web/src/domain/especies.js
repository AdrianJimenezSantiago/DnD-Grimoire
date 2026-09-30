import { norm } from '../core/util.js';

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
  goliat: [[1, 'Constitución poderosa'], [1, 'Forma grande'], [1, 'Linaje gigante']],
  humano: [[1, 'Diestro'], [1, 'Ingenioso'], [1, 'Versátil']],
  mediano: [[1, 'Agilidad de mediano'], [1, 'Fortuna'], [1, 'Sigiloso por naturaleza'], [1, 'Valiente']],
  orco: [[1, 'Aguante incansable'], [1, 'Descarga de adrenalina'], [1, 'Visión en la oscuridad']],
  tiefling: [[1, 'Legado infernal'], [1, 'Presencia sobrenatural'], [1, 'Visión en la oscuridad']],
};

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
    O('Alas celestiales', 'Velocidad volando igual a tu velocidad; +competencia de daño radiante una vez por turno.'),
    O('Fulgor interior', 'Luz brillante de 3 m; al final de cada turno, daño radiante igual a tu competencia a las criaturas a 3 m; +competencia de daño radiante una vez por turno.'),
    O('Mortaja necrótica', 'Salvación de Carisma o asustadas las criaturas a 3 m; +competencia de daño necrótico una vez por turno.') ] },
];

// Opción de linaje: la elegida, o la que diga el nombre de la especie («Elfo (drow)», «Tiefling infernal»)
export function linajeDe(ch, id) {
  const d = LINAJES.find(x => x.id === id); if (!d || especieBase(ch) !== d.especie) return null;
  const elegido = d.opciones.find(o => o.nombre === ch.opciones?.[id]); if (elegido) return elegido;
  const resto = norm(ch.especie || '').slice(d.especie.length);
  return resto.trim() ? d.opciones.find(o => o.re?.test(resto)) || null : null;
}
export const linajeActual = ch => { const d = LINAJES.find(x => x.especie === especieBase(ch) && x.cambia !== 'uso'); return d ? linajeDe(ch, d.id) : null; };

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
