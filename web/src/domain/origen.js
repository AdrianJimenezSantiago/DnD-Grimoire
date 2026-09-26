import { norm } from '../core/util.js';
import { ABILS, CLASES, clasesDe, nivelTotal, perfil } from './reglas2024.js';
import { PREDEFINIDOS } from './equipo.js';

// Herramientas, idiomas y equipo inicial del Manual del Jugador de 2024
export const JUEGOS = ['Juego de dados', 'Juego de naipes', 'Ajedrez de dragones', 'Ante de los tres dragones'];
export const INSTRUMENTOS = ['Chirimía', 'Cuerno', 'Dulcémele', 'Flauta', 'Flauta de pan', 'Gaita', 'Laúd', 'Lira', 'Tambor', 'Viola'];
export const ARTESANO = ['Herramientas de albañil', 'Herramientas de alfarero', 'Herramientas de carpintero', 'Herramientas de cartógrafo', 'Herramientas de curtidor',
  'Herramientas de ebanista', 'Herramientas de herrero', 'Herramientas de joyero', 'Herramientas de manitas', 'Herramientas de soplador de vidrio', 'Herramientas de tejedor',
  'Herramientas de zapatero', 'Suministros de alquimista', 'Suministros de calígrafo', 'Suministros de cervecero', 'Suministros de pintor', 'Utensilios de cocinero'];
export const LISTAS_HERRAMIENTA = { juego: ['un juego', JUEGOS], instrumento: ['un instrumento musical', INSTRUMENTOS], artesano: ['unas herramientas de artesano', ARTESANO],
  artesanoOInstrumento: ['unas herramientas de artesano o un instrumento', [...ARTESANO, ...INSTRUMENTOS]] };
export const IDIOMAS = ['Común', 'Lenguaje de signos común', 'Dracónico', 'Enano', 'Élfico', 'Gigante', 'Gnomo', 'Goblin', 'Mediano', 'Orco'];
export const IDIOMAS_RAROS = ['Abisal', 'Celestial', 'Dialecto de las profundidades', 'Druídico', 'Germanía de ladrones', 'Infernal', 'Primordial', 'Silvano', 'Infracomún'];

// Cada trasfondo: herramienta (fija o «elige de una lista») y equipo A (objetos + oro) o B (50 po)
const T = (herramienta, objetos, po) => ({ herramienta, opciones: [{ k: 'A', objetos, po }, { k: 'B', objetos: [], po: 50 }] });
export const TRASFONDO_EXTRA = {
  'Acólito': T('Suministros de calígrafo', ['Suministros de calígrafo', 'Libro (oraciones)', 'Símbolo sagrado (amuleto)', ['Pergamino (hoja)', 10], 'Túnica'], 8),
  'Animador': T({ elige: 'instrumento' }, [{ elige: 'instrumento' }, ['Disfraz', 2], 'Espejo', 'Perfume', 'Ropa de viaje'], 11),
  'Artesano': T({ elige: 'artesano' }, [{ elige: 'artesano' }, ['Bolsa', 2], 'Ropa de viaje'], 32),
  'Campesino': T('Herramientas de carpintero', ['Hoz', 'Herramientas de carpintero', 'Kit de sanador', 'Olla de hierro', 'Pala', 'Ropa de viaje'], 30),
  'Charlatán': T('Kit de falsificación', ['Kit de falsificación', 'Disfraz', 'Ropa fina'], 15),
  'Comerciante': T('Herramientas de navegante', ['Herramientas de navegante', ['Bolsa', 2], 'Ropa de viaje'], 22),
  'Criminal': T('Herramientas de ladrón', [['Daga', 2], 'Herramientas de ladrón', 'Palanca', ['Bolsa', 2], 'Ropa de viaje'], 16),
  'Ermitaño': T('Kit de herborista', ['Bastón', 'Kit de herborista', 'Saco de dormir', 'Libro (filosofía)', 'Lámpara', ['Aceite (frasco)', 3], 'Ropa de viaje'], 16),
  'Erudito': T('Suministros de calígrafo', ['Bastón', 'Suministros de calígrafo', 'Libro (historia)', ['Pergamino (hoja)', 8], 'Túnica'], 8),
  'Escriba': T('Suministros de calígrafo', ['Suministros de calígrafo', 'Ropa fina', 'Lámpara', ['Aceite (frasco)', 3], ['Pergamino (hoja)', 12]], 23),
  'Guardia': T({ elige: 'juego' }, ['Lanza', 'Ballesta ligera', ['Virotes', 20], { elige: 'juego' }, 'Linterna sorda', 'Grilletes', 'Carcaj', 'Ropa de viaje'], 12),
  'Guía': T('Herramientas de cartógrafo', ['Arco corto', ['Flechas', 20], 'Herramientas de cartógrafo', 'Saco de dormir', 'Carcaj', 'Tienda de campaña', 'Ropa de viaje'], 3),
  'Marinero': T('Herramientas de navegante', ['Daga', 'Herramientas de navegante', 'Cuerda de cáñamo (15 m)', 'Ropa de viaje'], 20),
  'Noble': T({ elige: 'juego' }, [{ elige: 'juego' }, 'Ropa fina', 'Perfume'], 29),
  'Soldado': T({ elige: 'juego' }, ['Lanza', 'Arco corto', ['Flechas', 20], { elige: 'juego' }, 'Kit de sanador', 'Carcaj', 'Ropa de viaje'], 14),
  'Vagabundo': T('Herramientas de ladrón', [['Daga', 2], 'Herramientas de ladrón', { elige: 'juego' }, 'Saco de dormir', ['Bolsa', 2], 'Ropa de viaje'], 16),
};

// Clases: herramientas, armaduras y equipo inicial (A, B y a veces C), y el oro a tirar de las reglas de 2014 como variante
const C = (herramientas, armaduras, opciones, tirada) => ({ herramientas, armaduras, opciones, tirada });
const O = (k, objetos, po) => ({ k, objetos, po });
export const CLASE_EXTRA = {
  'Bárbaro': C([], ['ligera', 'media', 'escudo'], [O('A', ['Hacha a dos manos', ['Hacha de mano', 4], 'Paquete de explorador'], 15), O('B', [], 75)], [2, 4, 10]),
  'Bardo': C([{ elige: 'instrumento', n: 3 }], ['ligera'], [O('A', ['Armadura de cuero', ['Daga', 2], { elige: 'instrumento' }, 'Paquete de artista'], 19), O('B', [], 90)], [5, 4, 10]),
  'Brujo': C([], ['ligera'], [O('A', ['Armadura de cuero', 'Hoz', ['Daga', 2], 'Foco arcano (orbe)', 'Libro (saber oculto)', 'Paquete de erudito'], 15), O('B', [], 100)], [4, 4, 10]),
  'Clérigo': C([], ['ligera', 'media', 'escudo'], [O('A', ['Camisote de mallas', 'Escudo', 'Maza', 'Símbolo sagrado (amuleto)', 'Paquete de sacerdote'], 7), O('B', [], 110)], [5, 4, 10]),
  'Druida': C(['Kit de herborista'], ['ligera', 'escudo'], [O('A', ['Armadura de cuero', 'Escudo', 'Hoz', 'Foco druídico (bastón)', 'Paquete de explorador', 'Kit de herborista'], 9), O('B', [], 50)], [2, 4, 10]),
  'Explorador': C([], ['ligera', 'media', 'escudo'], [O('A', ['Armadura de cuero tachonado', 'Cimitarra', 'Espada corta', 'Arco largo', ['Flechas', 20], 'Carcaj', 'Foco druídico (rama de muérdago)', 'Paquete de explorador'], 7), O('B', [], 150)], [5, 4, 10]),
  'Guerrero': C([], ['ligera', 'media', 'pesada', 'escudo'], [O('A', ['Cota de mallas', 'Espadón', 'Mayal', ['Jabalina', 8], 'Paquete de explorador de mazmorras'], 4),
    O('B', ['Armadura de cuero tachonado', 'Cimitarra', 'Espada corta', 'Arco largo', ['Flechas', 20], 'Carcaj', 'Paquete de explorador de mazmorras'], 11), O('C', [], 155)], [5, 4, 10]),
  'Hechicero': C([], [], [O('A', ['Lanza', ['Daga', 2], 'Foco arcano (cristal)', 'Paquete de explorador de mazmorras'], 28), O('B', [], 50)], [3, 4, 10]),
  'Mago': C([], [], [O('A', [['Daga', 2], 'Foco arcano (bastón)', 'Túnica', 'Libro de conjuros', 'Paquete de erudito'], 5), O('B', [], 55)], [4, 4, 10]),
  'Monje': C([{ elige: 'artesanoOInstrumento' }], [], [O('A', ['Lanza', ['Daga', 5], { elige: 'artesanoOInstrumento' }, 'Paquete de explorador'], 11), O('B', [], 50)], [5, 4, 1]),
  'Paladín': C([], ['ligera', 'media', 'pesada', 'escudo'], [O('A', ['Cota de mallas', 'Escudo', 'Espada larga', ['Jabalina', 6], 'Símbolo sagrado (amuleto)', 'Paquete de sacerdote'], 9), O('B', [], 150)], [5, 4, 10]),
  'Pícaro': C(['Herramientas de ladrón'], ['ligera'], [O('A', ['Armadura de cuero', ['Daga', 2], 'Espada corta', 'Arco corto', ['Flechas', 20], 'Carcaj', 'Herramientas de ladrón', 'Paquete de ladrón'], 8), O('B', [], 100)], [4, 4, 10]),
};
const clave = (mapa, n) => Object.keys(mapa).find(k => norm(k) === norm(n));
export const extraTrasfondo = t => TRASFONDO_EXTRA[clave(TRASFONDO_EXTRA, t)] || null;
export const extraClase = c => CLASE_EXTRA[clase2(c)] || null;
const clase2 = c => clave(CLASE_EXTRA, c);

// Elecciones pendientes: cada { elige } en herramientas y equipo necesita un valor. Se guardan por clave estable.
export function eleccionesHerramienta(ch) {
  const out = [], t = extraTrasfondo(ch.trasfondo), c = extraClase(ch.clase);
  if (t && typeof t.herramienta === 'object') out.push({ id: 't', lista: t.herramienta.elige, n: 1, de: ch.trasfondo });
  else if (t) { const e = t.opciones[0].objetos.find(x => x && x.elige); if (e) out.push({ id: 't', lista: e.elige, n: 1, de: ch.trasfondo, soloEquipo: true }); }
  for (const [i, h] of (c?.herramientas || []).entries()) if (typeof h === 'object') out.push({ id: `c${i}`, lista: h.elige, n: h.n || 1, de: ch.clase });
  return out;
}
export function herramientasDe(ch, elecciones = {}) {
  const t = extraTrasfondo(ch.trasfondo), c = extraClase(ch.clase), out = [];
  const poner = (h, id) => { if (typeof h === 'string') out.push(h); else out.push(...(elecciones[id] || []).filter(Boolean)); };
  if (t) poner(t.herramienta, 't');
  (c?.herramientas || []).forEach((h, i) => poner(h, `c${i}`));
  return [...new Set(out)];
}
export function equipoInicial(ch, { claseOpcion = 'A', trasfondoOpcion = 'A', elecciones = {}, oroTirado = null } = {}) {
  const items = [], t = extraTrasfondo(ch.trasfondo), c = extraClase(ch.clase); let po = 0;
  const volcar = (lista, id) => { for (const x of lista) {
    if (typeof x === 'string') items.push([x, 1]); else if (Array.isArray(x)) items.push([x[0], x[1]]);
    else { const v = (elecciones[id] || [])[0]; if (v) items.push([v, 1]); } } };
  if (c) { if (claseOpcion === 'oro') po += oroTirado || 0; else { const o = c.opciones.find(x => x.k === claseOpcion) || c.opciones[0]; volcar(o.objetos, 'c0'); po += o.po; } }
  if (t) { const o = t.opciones.find(x => x.k === trasfondoOpcion) || t.opciones[0]; volcar(o.objetos, 't'); po += o.po; }
  return { items, po };
}
export const tirarOro = (clase, rnd = Math.random) => { const c = extraClase(clase); if (!c) return null;
  const [n, caras, x] = c.tirada, dados = Array.from({ length: n }, () => 1 + Math.floor(rnd() * caras)); return { dados, total: dados.reduce((a, b) => a + b, 0) * x, texto: `${n}d${caras}${x > 1 ? ` × ${x}` : ''}` }; };

// Requisitos de las dotes: nivel, características, rasgos, armaduras, especie y trasfondo
const AB = { fuerza: 'fue', destreza: 'des', constitucion: 'con', inteligencia: 'int', sabiduria: 'sab', carisma: 'car' };
const ESTILO = { 'Guerrero': 1, 'Paladín': 2, 'Explorador': 2 };
const armadurasDe = ch => new Set(clasesDe(ch).flatMap((c, i) => (i === 0 ? CLASE_EXTRA[c.clase]?.armaduras : (CLASE_EXTRA[c.clase]?.armaduras || []).filter(a => a !== 'pesada')) || []));
export function faltaRequisito(req, ch) {
  const r = norm(req || ''); if (!r) return '';
  const L = nivelTotal(ch), n = /nivel\s*(\d+)/.exec(r);
  if (n && L < +n[1]) return `Pide nivel ${n[1]}; tu personaje es de nivel ${L}.`;
  const car = /((?:fuerza|destreza|constitucion|inteligencia|sabiduria|carisma)(?:\s*(?:,|o|y)\s*(?:fuerza|destreza|constitucion|inteligencia|sabiduria|carisma))*)\s*(\d+)\s*o\s*mas/.exec(r);
  if (car) { const ks = car[1].split(/\s*(?:,|\so\s|\sy\s)\s*/).map(x => AB[x.trim()]).filter(Boolean), min = +car[2];
    if (ks.length && !ks.some(k => (ch.stats?.[k] || 0) >= min)) return `Pide ${car[1].replace(/\b\w/g, m => m.toUpperCase())} ${min} o más.`; }
  if (/lanzamiento de conjuros|magia del pacto/.test(r)) { const P = perfil(ch); if (!P.c && !P.pact && !(ch.book || []).length) return 'Pide poder lanzar conjuros (Lanzamiento de conjuros o Magia del pacto).'; }
  if (/estilo de combate/.test(r) && !clasesDe(ch).some(c => ESTILO[c.clase] && c.nivel >= ESTILO[c.clase])) return 'Pide el rasgo Estilo de combate (guerrero, o paladín y explorador desde nivel 2).';
  const arm = /competencia con (?:armaduras? |escudos?)?(ligeras?|medias?|pesadas?|escudos?)/.exec(r);
  if (arm) { const k = { ligera: 'ligera', ligeras: 'ligera', media: 'media', medias: 'media', pesada: 'pesada', pesadas: 'pesada', escudo: 'escudo', escudos: 'escudo' }[arm[1]];
    if (!armadurasDe(ch).has(k)) return `Pide competencia con ${k === 'escudo' ? 'escudos' : `armadura ${k}`}.`; }
  const tr = /trasfondo\s+(?:de\s+)?([a-z ]+?)(?:[,.;)]|$)/.exec(r);
  if (tr && !norm(ch.trasfondo || '').includes(tr[1].trim())) return `Pide el trasfondo ${tr[1].trim()}.`;
  const es = /especie\s+(?:de\s+)?([a-z ]+?)(?:[,.;)]|$)/.exec(r);
  if (es && !norm(ch.especie || '').includes(es[1].trim())) return `Pide ser de la especie ${es[1].trim()}.`;
  return '';
}

// Aumento de característica que da una dote («Aumenta tu Fuerza o Destreza en 1…»)
const NOM = Object.fromEntries(ABILS.map(([k, n]) => [norm(n), k]));
export function aumentoDeDote(texto) {
  const t = norm(texto || ''), m = /aumenta (?:en 1 )?(?:tu |una )?(?:puntuacion(?:es)? de )?(.{0,120}?)\s*(?:en 1\b|, hasta|hasta un maximo)/.exec(t);
  if (!m) return null;
  if (/de tu eleccion|una caracteristica|cualquier/.test(m[1])) return ABILS.map(([k]) => k);
  const ks = Object.entries(NOM).filter(([n]) => m[1].includes(n)).map(([, k]) => k);
  return ks.length ? ks : null;
}
export const claseTieneLista = c => !!CLASES[c]?.cast;

const PAQUETES = {
  'Paquete de explorador': 'Mochila, saco de dormir, 2 frascos de aceite, raciones para 10 días, cuerda, yesquero, 10 antorchas y odre.',
  'Paquete de explorador de mazmorras': 'Mochila, abrojos, palanca, 2 frascos de aceite, raciones para 10 días, cuerda, yesquero, 10 antorchas y odre.',
  'Paquete de sacerdote': 'Mochila, manta, agua bendita, lámpara, raciones para 7 días, túnica y yesquero.',
  'Paquete de erudito': 'Mochila, libro, tintero, pluma, lámpara, 10 hojas de pergamino, 10 frascos de aceite y yesquero.',
  'Paquete de artista': 'Mochila, saco de dormir, campana, lámpara, 3 frascos de aceite, raciones para 9 días, yesquero y odre.',
  'Paquete de ladrón': 'Mochila, bolsa de bolas metálicas, campana, 10 velas, palanca, linterna sorda, 7 frascos de aceite, raciones para 5 días, cuerda, yesquero y odre.',
};
const HERR = new Set([...JUEGOS, ...INSTRUMENTOS, ...ARTESANO].map(norm));
export function datosObjeto(nombre, cantidad = 1) {
  const p = PREDEFINIDOS.find(x => norm(x.nombre) === norm(nombre));
  if (p) return { ...structuredClone(p), cantidad, equipado: !!p.armadura };
  const cat = HERR.has(norm(nombre)) || /^(herramientas|suministros|kit|utensilios)\b/i.test(nombre) ? 'herramienta' : 'equipo';
  return { nombre, cat, cantidad, notas: PAQUETES[nombre] || '' };
}

const ARMAS = { 'Bárbaro': 'sencillas y marciales', 'Guerrero': 'sencillas y marciales', 'Paladín': 'sencillas y marciales', 'Explorador': 'sencillas y marciales',
  'Pícaro': 'sencillas y marciales con Sutil o Ligera', 'Monje': 'sencillas y marciales con Ligera' };
const NOM_ARM = { ligera: 'ligeras', media: 'medias', pesada: 'pesadas', escudo: 'escudos' };
export function entrenamientoDe(ch) {
  const c = clasesDe(ch)[0]?.clase, arm = [...armadurasDe(ch)];
  return { armas: `Armas ${ARMAS[c] || 'sencillas'}`, armaduras: arm.length ? `Armaduras ${arm.filter(a => a !== 'escudo').map(a => NOM_ARM[a]).join(', ')}${arm.includes('escudo') ? `${arm.length > 1 ? ' y ' : ''}escudos` : ''}`.replace('Armaduras  y escudos', 'Escudos') : '' };
}
