// Datos mecánicos de los conjuros del Manual del Jugador de 2024 que no están en el SRD 5.2 (el compendio no trae su texto).
// Sirven de respaldo para tirar ataque, salvación, daño y curación mientras no se importe el manual.
// Solo números y tipos: el texto de cada conjuro se lee del libro importado.
const D = (n, caras, tipo, via, extra = {}) => ({ n, caras, bono: 0, tipo, via, cond: '', frase: '', ...extra });
const T = o => ({ ataque: null, salvacion: null, danos: [], curacion: null, escala: null, mitad: false, falla: '', supera: '', extras: [], ...o });
const truco = caras => ({ tipo: 'truco', n: 1, caras, bono: 0 });
const esp = (n, caras, desde) => ({ tipo: 'espacio', n, caras, bono: 0, desde });

export const TIRADAS_BASE = {
  'mind sliver': T({ salvacion: 'Inteligencia', danos: [D(1, 6, 'psíquico', 'salvacion')], escala: truco(6), falla: 'Si falla, resta 1d4 a su siguiente tirada de salvación antes del final de tu siguiente turno.' }),
  'thorn whip': T({ ataque: 'cuerpo a cuerpo', danos: [D(1, 6, 'perforante', 'ataque')], escala: truco(6) }),
  'word of radiance': T({ salvacion: 'Constitución', danos: [D(1, 6, 'radiante', 'salvacion')], escala: truco(6) }),
  'toll the dead': T({ salvacion: 'Sabiduría', danos: [D(1, 8, 'necrótico', 'salvacion'), D(1, 12, 'necrótico', 'salvacion', { cond: 'al objetivo le faltan puntos de golpe' })], escala: { tipo: 'truco', unDado: true, n: 1, caras: 0 } }),
  'thunderclap': T({ salvacion: 'Constitución', danos: [D(1, 6, 'trueno', 'salvacion')], escala: truco(6) }),
  'friends': T({ salvacion: 'Sabiduría' }),
  'arms of hadar': T({ salvacion: 'Fuerza', mitad: true, danos: [D(2, 6, 'necrótico', 'salvacion')], escala: esp(1, 6, 1) }),
  'thunderous smite': T({ salvacion: 'Fuerza', danos: [D(2, 6, 'trueno', 'auto')], escala: esp(1, 6, 1), falla: 'Si falla, lo empujas 3 m y queda derribado.' }),
  'wrathful smite': T({ salvacion: 'Sabiduría', danos: [D(1, 6, 'necrótico', 'auto')], escala: esp(1, 6, 1), falla: 'Si falla, queda asustado de ti.' }),
  'compelled duel': T({ salvacion: 'Sabiduría' }),
  'witch bolt': T({ ataque: 'a distancia', danos: [D(2, 12, 'relámpago', 'ataque'), D(1, 12, 'relámpago', 'auto', { cond: 'en tus turnos siguientes, como acción adicional' })], escala: esp(1, 12, 1) }),
  'hail of thorns': T({ salvacion: 'Destreza', mitad: true, danos: [D(1, 10, 'perforante', 'salvacion')], escala: esp(1, 10, 1) }),
  'crown of madness': T({ salvacion: 'Sabiduría' }),
  'cordon of arrows': T({ salvacion: 'Destreza', danos: [D(2, 4, 'perforante', 'salvacion')] }),
  'cloud of daggers': T({ danos: [D(4, 4, 'cortante', 'auto')], escala: esp(2, 4, 2) }),
  'aura of vitality': T({ curacion: { n: 2, caras: 6, bono: 0, mod: false }, extras: [] }),
  'blinding smite': T({ salvacion: 'Constitución', danos: [D(3, 8, 'radiante', 'auto')], escala: esp(1, 8, 3), falla: 'Si falla, queda cegado.' }),
  'conjure barrage': T({ salvacion: 'Destreza', mitad: true, danos: [D(5, 8, 'a elegir', 'salvacion')], escala: esp(1, 8, 3) }),
  'lightning arrow': T({ ataque: 'a distancia', salvacion: 'Destreza', mitad: true, danos: [D(4, 8, 'relámpago', 'ataque'), D(2, 8, 'relámpago', 'salvacion', { cond: 'a cada criatura a 3 m del objetivo' })], escala: esp(1, 8, 3) }),
  'hunger of hadar': T({ salvacion: 'Destreza', danos: [D(2, 6, 'frío', 'auto', { cond: 'al empezar su turno en la esfera' }), D(2, 6, 'ácido', 'salvacion', { cond: 'al terminar su turno en la esfera' })], escala: esp(1, 6, 3) }),
  'staggering smite': T({ salvacion: 'Sabiduría', danos: [D(4, 6, 'psíquico', 'auto')], escala: esp(1, 6, 4), falla: 'Si falla, queda aturdido hasta el final de tu siguiente turno.' }),
  'grasping vine': T({ ataque: 'cuerpo a cuerpo', danos: [D(4, 8, 'contundente', 'ataque')] }),
  'banishing smite': T({ danos: [D(5, 10, 'fuerza', 'auto')] }),
  'conjure volley': T({ salvacion: 'Destreza', mitad: true, danos: [D(8, 8, 'a elegir', 'salvacion')] }),
  'synaptic static': T({ salvacion: 'Inteligencia', mitad: true, danos: [D(8, 6, 'psíquico', 'salvacion')], falla: 'Si falla, resta 1d6 a sus tiradas de ataque y pruebas de característica.' }),
  'steel wind strike': T({ ataque: 'cuerpo a cuerpo', danos: [D(6, 10, 'fuerza', 'ataque')] }),
  'destructive wave': T({ salvacion: 'Constitución', mitad: true, danos: [D(5, 6, 'trueno', 'salvacion'), D(5, 6, 'radiante', 'salvacion', { cond: 'o necrótico, a tu elección' })] }),
  "yolande's regal presence": T({ salvacion: 'Sabiduría', mitad: true, danos: [D(4, 6, 'psíquico', 'salvacion')] }),
  "jallarzi's storm of radiance": T({ salvacion: 'Constitución', mitad: true, danos: [D(2, 10, 'radiante', 'salvacion'), D(2, 10, 'trueno', 'salvacion')], escala: esp(1, 10, 5) }),
};
// Ajustes que el texto no deja leer: cuántos relámpagos lanza Relámpago en cadena, la curación fija de Curar
const AJUSTES = {
  'chain lightning': r => ({ ...r, veces: { base: 4, desde: 6 } }),
  heal: r => ({ ...r, curacion: r.curacion || { n: 0, caras: 0, bono: 70, mod: false }, escala: { tipo: 'espacio', n: 0, caras: 0, bono: 0, porNivel: 10, desde: 6 } }),
};
export const ajustarTiradas = (r, en) => { const f = AJUSTES[String(en || '').toLowerCase().trim()]; return f && r ? f(r) : r; };
export const tiradasBase = en => TIRADAS_BASE[String(en || '').toLowerCase().trim()] || null;
