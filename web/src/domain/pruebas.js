import { competenciasIniciales, periciasDisponibles, abDe } from './habilidades.js';
import { norm, uid } from '../core/util.js';
import { CLASES, ESPECIES, TRASFONDOS_2024, competencia, perfil } from './reglas2024.js';
import { CLASES_INFO, SUBCLASES, conjurosAutomaticos, progresion, subclaseDe } from './clases2024.js';
import { ASI_LVLS } from './progresion.js';
import { blankChar, normChar } from './modelo.js';
import { importSrd } from './catalogo.js';
import { anadirObjeto, anadirComun, alternarEquipado, equipoDe, PREDEFINIDOS } from './equipo.js';
import { nuevaNota } from './diario.js';
import { claveNombre } from './manual.js';

export const NIVEL_PRUEBA = 8;
const ABN = { fue: 'Fuerza', des: 'Destreza', con: 'Constitución', int: 'Inteligencia', sab: 'Sabiduría', car: 'Carisma' };
const MATRIZ = [15, 14, 13, 12, 10, 8];
const NOMBRES = ['Brunhild', 'Korgan', 'Yara', 'Tormund', 'Lirael', 'Odrin', 'Seraphine', 'Cassius', 'Nimue',
  'Auriel', 'Fenwick', 'Mordaine', 'Vessa', 'Gareth', 'Solenne', 'Elowen', 'Quillon', 'Aldous',
  'Rowan', 'Terrin', 'Astra', 'Maris', 'Umbra', 'Hale', 'Briar', 'Kestrel', 'Frida',
  'Elric', 'Bram', 'Ysolde', 'Darian', 'Leofric', 'Zephra', 'Pyrra', 'Ignatius', 'Cogsworth', 'Emberly',
  'Theodora', 'Orla', 'Ember', 'Mirage', 'Aerith', 'Jun', 'Mei', 'Kage', 'Tenzin',
  'Galahad', 'Aurelia', 'Sylvan', 'Vengar', 'Zahir', 'Silas', 'Wren', 'Nim', 'Vex', 'Mordecai'];

const ESPECIE_CONJUROS = {
  'Aasimar': [['Luz', 1, '']],
  'Elfo': [['Prestidigitación', 1, ''], ['Detectar magia', 3, '1/DL'], ['Paso brumoso', 5, '1/DL']],
  'Gnomo': [['Ilusión menor', 1, ''], ['Hablar con los animales', 1, 'BC/DL']],
  'Tiefling': [['Taumaturgia', 1, ''], ['Reprensión infernal', 3, '1/DL'], ['Oscuridad', 5, '1/DL']],
};
const ELECCIONES = {
  'Bardo': ['Pericia: Interpretación y Persuasión'],
  'Brujo': ['Invocaciones: Descarga agónica, Pacto del grimorio, Máscara de los mil rostros, Mente sobrenatural, Vista del diablo'],
  'Clérigo': ['Orden divina: Taumaturgo (un truco más)'],
  'Druida': ['Orden primigenia: Naturalista (un truco más)'],
  'Explorador': ['Estilo de combate: Tiro con arco', 'Pericia (Explorador hábil): Supervivencia'],
  'Guerrero': ['Estilo de combate: Defensa'],
  'Hechicero': ['Metamagia: Conjuro acelerado y Conjuro gemelo'],
  'Monje': [],
  'Paladín': ['Estilo de combate: Guerrero bendito (dos trucos de clérigo)'],
  'Pícaro': ['Pericia: Sigilo, Juego de manos, Percepción y Herramientas de ladrón'],
  'Mago': ['Académico: pericia en Conocimiento arcano'],
  'Bárbaro': [],
};
const EXTRA_SUB = {
  'Maestro del combate': 'Maniobras: Ataque con finta, Ataque de precisión, Ataque para derribar, Contraataque y Desarmar',
  'Campeón': 'Estilo de combate adicional: Tiro con arco',
  'Señor de las bestias': 'Compañero primigenio: bestia de la tierra',
  'Hechicería dracónica': 'Linaje: dragón rojo (fuego)',
  'Círculo de la tierra': 'Terreno: árido',
  'Vástago de los Tres': 'Lealtad aterradora: Bhaal (resistencia al veneno, Guardia de cuchillas)',
};
const TRUCOS_EXTRA = {
  'Clérigo': [[null, 'Taumaturgo', 'Clérigo']],
  'Druida': [[null, 'Naturalista', 'Druida']],
  'Paladín': [['Palabra de resplandor', 'Guerrero bendito'], ['Llama sagrada', 'Guerrero bendito']],
  'Brujo': [['Guía', 'Pacto del grimorio'], ['Mensaje', 'Pacto del grimorio'], ['Taumaturgia', 'Pacto del grimorio']],
};
const RITUALES_BRUJO = [['Encontrar familiar', 'Pacto del grimorio'], ['Detectar magia', 'Pacto del grimorio'], ['Disfrazarse', 'Máscara de los mil rostros']];

function indice(compendio) {
  const porNombre = new Map();
  for (const x of compendio) { const k = norm(x.es); if (!porNombre.has(k)) porNombre.set(k, []); porNombre.get(k).push(x); }
  return (nombre, nivel) => { const xs = porNombre.get(norm(nombre)) || []; return (nivel == null ? xs[0] : xs.find(x => x.l === nivel)) || xs[0] || null; };
}
const conDados = x => /\d+d\d+/.test(`${x.d || ''} ${x.h || ''}`) ? 0 : 1;
const orden = (a, b) => conDados(a) - conDados(b) || a.es.localeCompare(b.es, 'es');

export function statsPrueba(prio, trasfondo, clase, nivel) {
  const st = {}; prio.forEach((k, i) => { st[k] = MATRIZ[i]; });
  const [tr] = TRASFONDOS_2024[trasfondo] || [[prio[0], prio[1]]];
  const t1 = tr.includes(prio[0]) ? prio[0] : tr[0], t2 = tr.find(k => k !== t1 && k === prio[1]) || tr.find(k => k !== t1);
  st[t1] += 2; st[t2] += 1;
  const notas = [], asis = (ASI_LVLS[clase] || ASI_LVLS._).filter(L => L <= nivel);
  for (const L of asis) {
    const sube = {}; let pts = 2;
    for (const k of prio) { while (pts && st[k] < 20) { st[k]++; sube[k] = (sube[k] || 0) + 1; pts--; } if (!pts) break; }
    notas.push(`Nivel ${L}: mejora de característica (${Object.entries(sube).map(([k, n]) => `${ABN[k]} +${n}`).join(', ')})`);
  }
  return { stats: st, notas, trasfondoTxt: `${ABN[t1]} +2, ${ABN[t2]} +1` };
}

function trasfondoPara(prio, i) {
  const ok = Object.keys(TRASFONDOS_2024).filter(t => TRASFONDOS_2024[t][0].includes(prio[0]) && TRASFONDOS_2024[t][0].includes(prio[1]));
  const lista = ok.length ? ok : Object.keys(TRASFONDOS_2024).filter(t => TRASFONDOS_2024[t][0].includes(prio[0]));
  return lista[i % lista.length];
}

export const combinaciones = () => Object.entries(SUBCLASES).flatMap(([clase, subs]) => subs.map(sc => ({ clase, sc })));

export function personajePrueba(db, compendio, clase, sc, i = 0, nivel = NIVEL_PRUEBA) {
  const buscar = indice(compendio), faltan = [];
  const info = CLASES_INFO[clase], prio = sc.prio || info.prio;
  const trasfondo = trasfondoPara(prio, i), especie = ESPECIES[i % ESPECIES.length];
  const { stats, notas: notasAsi, trasfondoTxt } = statsPrueba(prio, trasfondo, clase, nivel);
  const ch = blankChar({
    nombre: NOMBRES[i % NOMBRES.length], clase, subclase: sc.nombre, nivel, especie, trasfondo, stats, prueba: true,
    lema: `Personaje de prueba generado automáticamente (${sc.libro}).`, campana: 'Pruebas de la rama development',
  });
  ch.habilidades = competenciasIniciales(ch);
  const pericias = periciasDisponibles(ch), hab = Object.keys(ch.habilidades).sort((x, y) => prio.indexOf(abDe(x)) - prio.indexOf(abDe(y)));
  hab.slice(0, pericias).forEach(k => { ch.habilidades[k] = 2; });
  const P = perfil(ch), lista = P.lista, pb = competencia(nivel);
  const book = ch.book, enLibro = new Set(), claves = new Set();
  const add = (x, rel) => {
    if (!x) return false;
    if (claves.has(x.k)) return false; const sid = importSrd(db, x); if (enLibro.has(sid)) return false; enLibro.add(sid); claves.add(x.k);
    book.push({ sid, prep: false, always: false, fuente: '', gratis: '', used: false, ...rel }); return true;
  };
  const porNombre = (nombre, rel, nivelConj) => { const x = buscar(nombre, nivelConj); if (!x) { faltan.push(nombre); return false; } return add(x, rel); };
  const deLista = (l, cls) => compendio.filter(x => x.l === l && (x.cl || []).includes(cls)).sort(orden);

  for (const c of conjurosAutomaticos(ch)) porNombre(c.nombre, { always: true, prep: true, fuente: c.fuente, gratis: c.gratis, ritualSolo: c.ritual || undefined });
  if (sc.nombre === 'Colegio de la luna') { const x = deLista(0, 'Druida').find(y => !claves.has(y.k)); add(x, { always: true, fuente: 'Conocimientos primigenios' }); }

  for (const [nombre, desde, gratis] of ESPECIE_CONJUROS[especie] || []) if (nivel >= desde) porNombre(nombre, { always: true, prep: true, fuente: especie, gratis: gratis.replace('BC', pb) });
  const dote = TRASFONDOS_2024[trasfondo][1], mi = /Iniciado en la magia \((\w+)\)/.exec(dote);
  if (mi) {
    const cls = { 'clérigo': 'Clérigo', mago: 'Mago', druida: 'Druida' }[mi[1]];
    deLista(0, cls).filter(x => !claves.has(x.k)).slice(0, 2).forEach(x => add(x, { always: true, fuente: 'Iniciado en la magia' }));
    const x1 = deLista(1, cls).find(x => !claves.has(x.k)); add(x1, { always: true, prep: true, fuente: 'Iniciado en la magia', gratis: '1/DL' });
  }
  if (dote === 'Afortunado') ch.rasgos.push({ id: uid('r'), tipo: 'recurso', nombre: 'Puntos de suerte', nota: 'Dote Afortunado: ventaja en una prueba con d20 o desventaja a un ataque contra ti.', maxBase: 'comp', maxN: 1, maxAb: 'car', recarga: 'largo', dado: 'd20', nivMax: 5, escuela: '', espacioMin: 0, soloEspacio: true, efecto: 'aviso', efectoN: 5, texto: '' });

  if (P.maxCant && lista) {
    let n = 0; for (const x of deLista(0, lista)) { if (n >= P.maxCant) break; if (add(x, { fuente: P.listaNombre })) n++; }
  }
  for (const [nombre, fuente, cls] of TRUCOS_EXTRA[clase] || []) {
    if (nombre) porNombre(nombre, { always: true, fuente }, 0);
    else add(deLista(0, cls).find(x => !claves.has(x.k)), { fuente });
  }
  if (clase === 'Brujo') for (const [nombre, fuente] of RITUALES_BRUJO) porNombre(nombre, { always: true, fuente, gratis: fuente.startsWith('Máscara') ? 'a voluntad' : '' }, 1);

  const nuevosDe = l => deLista(l, lista).filter(x => !claves.has(x.k));
  const repartir = (total, rel) => {
    const pools = {}; for (let l = 1; l <= P.maxSlot; l++) pools[l] = nuevosDe(l);
    let n = 0, vuelta = true;
    while (n < total && vuelta) { vuelta = false; for (let l = 1; l <= P.maxSlot && n < total; l++) { const x = pools[l].shift(); if (x && add(x, rel)) { n++; vuelta = true; } } }
    return n;
  };
  if (clase === 'Mago') {
    const escuela = sc.escuela;
    if (escuela && nivel >= 3) {
      const gratis = []; const de = l => compendio.filter(x => x.l === l && x.esc === escuela && (x.cl || []).includes('Mago') && !claves.has(x.k)).sort(orden);
      gratis.push(...[...de(1), ...de(2)].slice(0, 2));
      for (let l = 3; l <= P.maxSlot; l++) { const x = de(l)[0]; if (x) gratis.push(x); }
      gratis.forEach(x => add(x, { fuente: `Experto en ${escuela.toLowerCase()}` }));
    }
    const libro = 6 + 2 * (nivel - 1);
    const antes = book.length; repartir(libro, { fuente: 'Libro' });
    book.slice(antes, antes + P.maxPrep).forEach(e => { e.prep = true; });
  } else if (P.maxPrep && lista) {
    repartir(P.maxPrep, { prep: true, fuente: P.listaNombre });
  }
  book.forEach(e => { if (e.ritualSolo) { e.fuente += ' (solo ritual)'; } delete e.ritualSolo; });

  const notas = [`Trasfondo ${trasfondo}: ${trasfondoTxt}; dote de origen ${dote}.`, ...(ELECCIONES[clase] || []), ...(EXTRA_SUB[sc.nombre] ? [EXTRA_SUB[sc.nombre]] : []), ...notasAsi];
  ch.notas = notas.map(t => t.replace(/\.?$/, '.')).join('\n');

  equipoInicial(ch);
  const obj = (nombre, tipo, rareza, extra = {}) => anadirObjeto(ch, { clave: claveNombre(nombre), nombre, tipo, rareza, sintonia: !!extra.sintonia, cargas: extra.cargas || null });
  obj('Poción de curación', 'Poción', 'Común');
  const capa = obj('Capa de protección', 'Objeto maravilloso', 'Infrecuente', { sintonia: true }); capa.sintonizado = true;
  if (P.c) obj('Varita de proyectiles mágicos', 'Varita', 'Infrecuente', { cargas: { max: 7, recarga: '1d6+1' } });
  else obj('Arma +1', 'Arma', 'Infrecuente');

  const hoy = new Date().toISOString().slice(0, 10);
  const nt = (tipo, texto, extra = {}) => ({ ...nuevaNota(tipo, texto), ...extra });
  ch.diario.sesiones.push({ id: uid('ses'), n: 1, fecha: hoy, titulo: 'Sesión de prueba', texto: `Primera sesión de ${ch.nombre}. Comprobar recursos, descansos y tiradas.`,
    notas: [nt('nombre', 'Maese Oren, posadero'), nt('suceso', 'Emboscada en el vado'), nt('pendiente', 'Entregar la carta sellada'), nt('nota', 'El trol teme al fuego', { fijada: true }), nt('suceso', 'Recuperado el amuleto', { hecho: true })] });
  const cr = { id: uid('bx'), nombre: 'Trol del vado', tipo: 'Gigante', amenaza: 'Peligrosa', estado: 'viva', ca: '15', pg: '94', danos: { fuego: 'vul', 'ácido': 'vul' }, estados: [], salv: { sab: 'debil' },
    conjuros: {}, tacticas: 'Regenera salvo con fuego o ácido.', notas: 'Aparece de noche.', sesiones: [ch.diario.sesiones[0].id], creada: Date.now() };
  ch.bestiario.criaturas.push(cr);
  ch.historia = `## Origen\n\n${ch.nombre} es ${especie.toLowerCase()} de trasfondo ${trasfondo.toLowerCase()}.\n\n### Rasgos hasta nivel ${nivel}\n\n${progresion(ch).map(r => `${r.nivel}. ${r.nombre}`).join(' · ')}\n\n---\n\n> Personaje generado para probar la app.`;
  return { ch: normChar(ch), faltan };
}

const KIT = {
  'Bárbaro': [['Hacha a dos manos', 1], ['Hacha de mano', 4]], 'Bardo': [['Estoque', 1], ['Armadura de cuero', 1], ['Laúd', 1]],
  'Brujo': [['Daga', 2], ['Armadura de cuero', 1], ['Foco arcano (orbe)', 1]], 'Clérigo': [['Maza', 1], ['Cota de escamas', 1], ['Escudo', 1], ['Símbolo sagrado (amuleto)', 1]],
  'Druida': [['Bastón', 1], ['Armadura de cuero', 1], ['Escudo', 1], ['Foco druídico (rama de muérdago)', 1], ['Kit de herborista', 1]],
  'Explorador': [['Cimitarra', 1], ['Arco largo', 1], ['Armadura de cuero tachonado', 1], ['Flechas', 20]], 'Guerrero': [['Espada larga', 1], ['Arco largo', 1], ['Cota de mallas', 1], ['Escudo', 1], ['Flechas', 20]],
  'Hechicero': [['Lanza', 1], ['Daga', 2], ['Foco arcano (orbe)', 1]], 'Mago': [['Bastón', 1], ['Daga', 1], ['Libro de conjuros', 1], ['Foco arcano (orbe)', 1]],
  'Monje': [['Lanza', 1], ['Daga', 5]], 'Paladín': [['Espada larga', 1], ['Jabalina', 6], ['Cota de mallas', 1], ['Escudo', 1], ['Símbolo sagrado (amuleto)', 1]],
  'Pícaro': [['Espada corta', 1], ['Arco corto', 1], ['Armadura de cuero', 1], ['Herramientas de ladrón', 1], ['Flechas', 20]],
};
const AVENTURERO = [['Mochila', 1], ['Saco de dormir', 1], ['Cuerda de cáñamo (15 m)', 1], ['Antorcha', 5], ['Yesquero', 1], ['Odre', 1], ['Raciones (1 día)', 5]];
export function equipoInicial(ch) {
  const puestos = new Set();
  for (const [nombre, cantidad] of [...(KIT[ch.clase] || []), ...AVENTURERO]) {
    const p = PREDEFINIDOS.find(x => x.nombre === nombre); if (!p) continue;
    const o = anadirComun(ch, { ...JSON.parse(JSON.stringify(p)), cantidad });
    const hueco = p.arma ? 'arma' : p.armadura ? p.armadura.tipo === 'escudo' ? 'escudo' : 'armadura' : '';
    if (hueco && !puestos.has(hueco)) { alternarEquipado(ch, o.id); puestos.add(hueco); }
  }
  Object.assign(equipoDe(ch).monedas, { po: 25, pp: 12, pc: 30 });
}

export function sembrarPruebas(db, compendio, nivel = NIVEL_PRUEBA) {
  if (!compendio || !compendio.length) return { creados: 0, faltan: [] };
  db.chars = db.chars.filter(c => !c.prueba);
  const faltan = new Set(); let creados = 0;
  combinaciones().forEach(({ clase, sc }, i) => {
    if (!CLASES[clase]) return;
    const { ch, faltan: f } = personajePrueba(db, compendio, clase, sc, i, nivel);
    f.forEach(x => faltan.add(x)); db.chars.push(ch); creados++;
  });
  const berserker = combinaciones().find(x => x.clase === 'Bárbaro' && /berserk/i.test(x.sc.nombre));
  if (berserker) {
    const { ch } = personajePrueba(db, compendio, 'Bárbaro', berserker.sc, creados, Math.max(1, nivel - 3));
    Object.assign(ch, { nombre: 'Sigrun', especie: 'Enano', trasfondo: 'Soldado', dotes: ['Alerta'],
      multiclase: [{ clase: 'Guerrero', subclase: 'Campeón', nivel: Math.min(3, nivel - 1) }],
      lema: `Personaje de prueba con multiclase (Bárbaro ${Math.max(1, nivel - 3)} / Guerrero ${Math.min(3, nivel - 1)}), especie y dotes.` });
    db.chars.push(ch); creados++;
  }
  if (!db.chars.some(c => c.id === db.activeId)) db.activeId = db.chars[0]?.id ?? null;
  return { creados, faltan: [...faltan] };
}
export const hayPruebas = db => db.chars.some(c => c.prueba);
export { subclaseDe };
