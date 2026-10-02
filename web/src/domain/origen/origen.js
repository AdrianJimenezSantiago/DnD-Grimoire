// Trasfondos y dotes de origen: herramientas, idiomas, equipo inicial, requisitos y aumentos de característica.
import { norm } from '../../core/util.js';
import { ABILS, CLASES, clasesDe, dotesDe, nivelTotal, perfil } from '../reglas/reglas2024.js';
import { PREDEFINIDOS } from '../equipo/equipo.js';
import { armadurasDe, marcialesDe } from '../reglas/competencias.js';
import { biblioteca } from '../conjuros/catalogo.js';

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
export const extraTrasfondo = t => TRASFONDO_EXTRA[clave(TRASFONDO_EXTRA, t)] || extraDeLibro(t);

// Trasfondos de otros libros (Héroes de Faerûn…): herramienta y equipo A/B leídos del texto importado
const OTRAS_HERR = ['Herramientas de ladrón', 'Herramientas de navegante', 'Kit de falsificación', 'Kit de disfraz', 'Kit de herborista', 'Kit de envenenador'];
const SINONIMOS = [[/^(utiles|kit) para disfrazarse$|^utiles de disfraz$/, 'Kit de disfraz'], [/^(utiles|kit) para falsificar$|^utiles de falsificacion$/, 'Kit de falsificación'],
  [/^(utiles|kit) de herborista$/, 'Kit de herborista'], [/^utiles de cocinero$/, 'Utensilios de cocinero'], [/^ropas? de viaje$/, 'Ropa de viaje'], [/^ropas? de calidad$|^ropa fina$/, 'Ropa fina'],
  [/^petate$/, 'Saco de dormir'], [/^linterna (de ojo de buey|sorda)$/, 'Linterna sorda'], [/^esposas$/, 'Grilletes'], [/^tienda$/, 'Tienda de campaña'], [/^cuerda$/, 'Cuerda de cáñamo (15 m)'], [/^aceite$/, 'Aceite (frasco)'], [/^pergaminos?$/, 'Pergamino (hoja)']];
const CORTAS = new Set(['a', 'o', 'y', 'e', 'u', 'de', 'la', 'el', 'en', 'un', 'al', 'lo', 'le', 'se', 'su', 'mi', 'tu', 'es', 'da', 'po', 'pp', 'pc', 'ya', 'no']);
let VOCAB = null;
const vocab = () => VOCAB ||= new Set([...PREDEFINIDOS.map(x => x.nombre), ...ARTESANO, ...INSTRUMENTOS, ...JUEGOS, ...OTRAS_HERR, 'herramientas útiles suministros mochila petate cantimplora bolsa garfio escalada yesquero frascos flechas virotes tienda ropas calidad disfrazarse falsificar herborista cartógrafo símbolo sagrado esposas linterna manta pergamino tinta pluma libro']
  .flatMap(t => norm(t).split(/[^a-z]+/)).filter(w => w.length > 2));
// Une palabras partidas por el OCR («herram ientas», «bo lsa», «d isfrazarse») si juntas forman una palabra conocida o un trozo es suelto
export function sinCortes(t) {
  const ws = String(t || '').split(/\s+/).filter(Boolean), out = [], letras = w => norm(w).replace(/[^a-z]/g, '');
  const trozo = w => /^[a-záéíóúñ]{1,2}$/i.test(w) && !CORTAS.has(norm(w));
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i], prev = out[out.length - 1], next = ws[i + 1];
    const pal = x => x && /^[a-záéíóúñ]+[,.]?$/i.test(x);
    if (pal(prev) && pal(w) && pal(next) && vocab().has(letras(prev) + letras(w) + letras(next).replace(/s$/, '')) || pal(prev) && pal(w) && pal(next) && vocab().has(letras(prev) + letras(w) + letras(next))) { out[out.length - 1] = prev + w + next; i++; continue; }
    const conSig = pal(w) && pal(next) && vocab().has(letras(w) + letras(next));
    const conAnt = pal(prev) && pal(w) && vocab().has(letras(prev) + letras(w));
    if (conSig || (trozo(w) && next && /^[a-záéíóúñ]/.test(next) && !conAnt && letras(w).length === 1)) { ws[i + 1] = w + next; continue; }
    if (conAnt || (prev && trozo(w) && /[a-záéíóúñ]$/i.test(prev))) { out[out.length - 1] = prev + w; continue; }
    out.push(w);
  }
  return out.join(' ');
}
const nombreHerr = t => { const n = norm(sinCortes(t)).trim(), syn = SINONIMOS.find(([re]) => re.test(n)), todos = [...ARTESANO, ...OTRAS_HERR, ...INSTRUMENTOS, ...PREDEFINIDOS.map(x => x.nombre)];
  const igual = v => todos.find(h => norm(h) === v);
  return syn ? syn[1] : igual(n) || igual(n.replace(/es$/, '')) || igual(n.replace(/s$/, '')) || sinCortes(t).trim().replace(/^./, c => c.toUpperCase()); };
function extraDeLibro(nombre) {
  const x = norm(nombre || '') && biblioteca().trasfondos.find(t => t.nombre && norm(t.nombre) === norm(nombre)); if (!x) return null;
  const h = norm(sinCortes(x.herramientas || ''));
  const herramienta = /juego/.test(h) ? { elige: 'juego' } : /instrumento/.test(h) ? { elige: 'instrumento' } : /artesan/.test(h) ? { elige: 'artesano' } : h ? nombreHerr(x.herramientas) : null;
  const a = /[({]A[)}]\s*(.+?),?\s*o\s*[({](?:B|8)[)}]/i.exec(sinCortes(x.equipo || ''));
  const objetos = [], po = { n: 0 };
  if (a) for (const trozo of a[1].split(/\s*,\s*|\s+y\s+(?=\d+\s*po\b|[a-záéíóúñ])/i)) {
    const t = trozo.trim(); if (!t) continue;
    const oro = /^(?:(.+?)\s+y\s*)?([\dlI]+)\s*po$/.exec(t); if (oro && /\d/.test(oro[2].replace(/[lI]/g, '1'))) { po.n += +oro[2].replace(/[lI]/g, '1'); if (!oro[1]) continue; }
    const txt = oro ? oro[1] : t; if (/^po$/i.test(txt)) continue;
    if (/^juego\b.*mismo/i.test(txt) && herramienta?.elige) { objetos.push({ elige: herramienta.elige }); continue; }
    const rac = /^raciones\s*\(para (\d+) d/i.exec(txt); if (rac) { objetos.push(['Raciones (1 día)', +rac[1]]); continue; }
    const n1 = /^(\d+)\s+(.+)$/.exec(txt), n2 = /^(.+?)\s*\((\d+)\s+\w+\)$/.exec(txt);
    const [cant, nom] = n1 ? [+n1[1], n1[2]] : n2 ? [+n2[2], n2[1]] : [1, txt];
    const limpio = nombreHerr(nom), ok = norm(limpio) === norm(nombreHerr(x.herramientas || '')) && typeof herramienta === 'string' ? herramienta : limpio;
    objetos.push(cant > 1 ? [ok, cant] : ok);
  }
  return { herramienta, opciones: [{ k: 'A', objetos, po: po.n }, { k: 'B', objetos: [], po: 50 }], libro: true };
}
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
// El OCR de los manuales deja restos: «13 omás», «nivel4», «1nteligencia», «de/fuego», «Endave»
export const limpiarRequisito = req => norm(req || '').replace(/^requ\W*i\W*\w*itos?\W*/, '').replace(/\b1(?=nteligen)/g, 'i').replace(/\/(?=\S)/g, ' ').replace(/(\d)\s*o\s*m[aáu]s/g, '$1 o mas')
  .replace(/nivel(\d)/g, 'nivel $1').replace(/!os\b/g, 'los').replace(/\s+/g, ' ').trim();
const ARM = { ligera: 'ligera', ligeras: 'ligera', media: 'media', medias: 'media', pesada: 'pesada', pesadas: 'pesada', escudo: 'escudo', escudos: 'escudo' };
function parecida(a, b) {
  a = a.replace(/[^a-z]/g, ''); b = b.replace(/[^a-z]/g, ''); if (a === b) return true; if (Math.abs(a.length - b.length) > 2 || Math.min(a.length, b.length) < 6) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[b.length] <= 2;
}
// Un requisito suelto («dote X», «competencia con armas marciales», «rasgo Magia del pacto»…): devuelve qué falta o ''
function faltaUno(r, ch) {
  if (/^dote /.test(r)) { const x = r.slice(5).trim(); return dotesDe(ch).some(d => parecida(norm(d.nombre), x) || parecida(norm(d.detalle ? `${d.nombre} ${d.detalle}` : d.nombre), x)) ? '' : `Pide la dote ${x}.`; }
  if (/armas marciales/.test(r)) return marcialesDe(ch).some(f => f([], true) && f(['dos manos', 'pesada'], true)) ? '' : 'Pide competencia con armas marciales.';
  if (/lanzamiento de conjuros|magia del pacto/.test(r)) { const P = perfil(ch), vale = /lanzamiento/.test(r) && P.c || /pacto/.test(r) && P.pact; return vale ? '' : `Pide el rasgo ${/lanzamiento/.test(r) && /pacto/.test(r) ? 'Lanzamiento de conjuros o Magia del pacto' : /pacto/.test(r) ? 'Magia del pacto' : 'Lanzamiento de conjuros'}.`; }
  if (/estilo de combate/.test(r)) return clasesDe(ch).some(c => ESTILO[c.clase] && c.nivel >= ESTILO[c.clase]) ? '' : 'Pide el rasgo Estilo de combate (guerrero, o paladín y explorador desde nivel 2).';
  const arm = /(?:competencia|entrenamiento) con (?:armaduras? |escudos?)?(ligeras?|medias?|pesadas?|escudos?)/.exec(r);
  if (arm) { const k = ARM[arm[1]]; return armadurasDe(ch).has(k) ? '' : `Pide entrenamiento con ${k === 'escudo' ? 'escudos' : `armaduras ${k}s`}.`; }
  const tr = /trasfondo\s+(?:de\s+)?([a-z ]+)/.exec(r);
  if (tr) return norm(ch.trasfondo || '').includes(tr[1].trim()) ? '' : `Pide el trasfondo ${tr[1].trim()}.`;
  const es = /especie\s+(?:de\s+)?([a-z ]+)/.exec(r);
  if (es) return norm(ch.especie || '').includes(es[1].trim()) ? '' : `Pide ser de la especie ${es[1].trim()}.`;
  return '';
}
export function faltaRequisito(req, ch) {
  const r = limpiarRequisito(req); if (!r) return '';
  const L = nivelTotal(ch), n = /nivel\s*(\d+)/.exec(r);
  if (n && L < +n[1]) return `Pide nivel ${n[1]}; tu personaje es de nivel ${L}.`;
  const car = /((?:fuerza|destreza|constitucion|inteligencia|sabiduria|carisma)(?:\s*(?:,|o|y)\s*(?:fuerza|destreza|constitucion|inteligencia|sabiduria|carisma))*)\s*(\d+)\s*o\s*mas/.exec(r);
  if (car) { const ks = car[1].split(/\s*(?:,|\so\s|\sy\s)\s*/).map(x => AB[x.trim()]).filter(Boolean), min = +car[2];
    if (ks.length && !ks.some(k => (ch.stats?.[k] || 0) >= min)) return `Pide ${car[1].replace(/\b(?!o\b|y\b)\w/g, m => m.toUpperCase())} ${min} o más.`; }
  // El resto, por partes: «A o B» se cumple con cualquiera de las dos
  const resto = r.replace(/nivel\s*\d+\s*o\s*mas/g, '').replace(car ? car[0] : '\u0000', '');
  for (const parte of resto.split(/\s*[,;]\s*/).map(x => x.trim()).filter(Boolean)) {
    const alts = parte.split(/\s+o\s+(?=dote |rasgo |competencia |entrenamiento |especie |trasfondo )/).map(x => x.replace(/^rasgo\s+/, '').trim());
    const fallos = alts.map(x => faltaUno(x, ch));
    if (fallos.every(Boolean)) return fallos.length > 1 ? `Pide ${fallos.map(f => f.replace(/^Pide (?:la |el )?/, '').replace(/\.$/, '')).join(' o ')}.` : fallos[0];
  }
  return '';
}

// Aumento de característica que da una dote («Aumenta tu Fuerza o Destreza en 1…»)
const NOM = Object.fromEntries(ABILS.map(([k, n]) => [norm(n), k]));
export function aumentoDeDote(texto) {
  const t = norm(texto || '').replace(/\b1nteligencia/g, 'inteligencia').replace(/\ben\s*[t\\|l!i]\s*[.,]?\s*(?=h?asta)/, 'en 1, '), m = /aumenta (?:en 1 )?(?:tu |una |la )?(?:puntuacion(?:es)? de )?(.{0,120}?)\s*(?:en 1\b|, hasta|hasta un maximo)/.exec(t);
  if (!m) return null;
  if (/^caracteristica$/.test(m[1].trim()) && /elige una caracteristica/.test(t)) return ABILS.map(([k]) => k);
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
  const c = clasesDe(ch)[0]?.clase, arm = [...armadurasDe(ch)], todas = marcialesDe(ch).some(f => f([], true) && f(['dos manos', 'pesada'], true));
  const tipos = arm.filter(a => a !== 'escudo').map(a => NOM_ARM[a]), esc = arm.includes('escudo');
  const armaduras = tipos.length ? `Armaduras ${tipos.join(', ')}${esc ? ' y escudos' : ''}` : esc ? 'Escudos' : '';
  return { armas: `Armas ${todas ? 'sencillas y marciales' : ARMAS[c] || 'sencillas'}`, armaduras };
}
