/**
 * Análisis de un libro completo a partir de los fragmentos de texto de cada página ({p, w, items}).
 * Decide qué páginas lee cada lector y devuelve todo lo reconocido. Puro: se prueba en Node con los volcados de pdf.js.
 */
import { pageToColumns } from './manualLineas.js';
import { parseSpells } from './manual.js';
import { parseGlosario } from './glosario.js';
import { detectarSubclases } from './libros.js';
import { parseObjetos } from './objetos.js';
import { parseDotes, parseTrasfondos, parseSubclases, completarSubclases, parseSecciones } from './contenido.js';
import { parseCriaturas } from './monstruos.js';

const TIPO_OBJ = /(Objeto maravilloso|Anillo|Varita|Vara|Poci[oó]n|Arma|Armadura|Bast[oó]n|Pergamino)\b[^,]{0,70},\s*(com[uú]n|infrecuente|rar[oa]|muy rar[oa]|legendari[oa]|artefacto|rareza)/;
/** Bloques de páginas consecutivas (con huecos de hasta `hueco` páginas: ilustraciones, tablas). */
function bloquesDe(nums, hueco = 3) { const b = []; for (const p of nums) { const u = b[b.length - 1]; if (u && p - u[1] <= hueco) u[1] = p; else b.push([p, p]); } return b; }

export function analizarLibro(paginas, aviso = () => {}) {
  const N = paginas.length;
  const texto = paginas.map(pg => pg.items.map(i => i.str).join(' '));
  const colsMemo = new Map();
  const cols = p => { if (!colsMemo.has(p)) { const pg = paginas[p - 1]; colsMemo.set(p, { p, cols: pageToColumns(pg.items, pg.w) }); } return colsMemo.get(p); };
  const rango = (a, b) => { const out = []; for (let p = Math.max(1, a); p <= Math.min(N, b); p++) out.push(cols(p)); return out; };
  const grande = (p, re, min = 36) => paginas[p - 1].items.some(it => Math.abs(it.transform[3]) >= min && re.test(it.str));

  // Conjuros
  const spells = [];
  for (const [a, b] of bloquesDe(texto.map((t, i) => (/Tiempo de lanza/.test(t) ? i + 1 : 0)).filter(Boolean))) spells.push(...parseSpells(rango(a, b)));

  // Glosario de reglas (apéndice del Manual del Jugador)
  aviso('glosario');
  let glosario = [];
  const gi = texto.findIndex(t => /DEFINICIONES DE LAS REGLAS/.test(t));
  if (gi >= 0) { const pags = []; for (let p = gi + 1; p <= N; p++) { if (/ÍNDICE DE TÉRMINOS/.test(texto[p - 1]) && pags.length) break; pags.push(cols(p)); } glosario = parseGlosario(pags); }

  // Objetos mágicos
  aviso('objetos');
  let objetos = [];
  const conTipo = texto.map((t, i) => ((t.match(new RegExp(TIPO_OBJ.source, 'g')) || []).length >= 1 ? i + 1 : 0)).filter(Boolean);
  for (const [a, b] of bloquesDe(conTipo, 2)) { if (b - a < 2) continue; const o = parseObjetos(rango(a, b)); if (o.length >= 5) objetos.push(...o); }

  // Dotes, trasfondos y subclases
  aviso('personaje');
  const dotes = [], trasfondos = [];
  for (const [a, b] of bloquesDe(texto.map((t, i) => (/Dote (de origen|general|de estilo de combate|de don [ée]pico)/.test(t) ? i + 1 : 0)).filter(Boolean), 2)) dotes.push(...parseDotes(rango(a - 1, b)));
  for (const [a, b] of bloquesDe(texto.map((t, i) => (/Puntuaciones de caracter[ií]stica\s*:/.test(t) ? i + 1 : 0)).filter(Boolean), 2)) trasfondos.push(...parseTrasfondos(rango(a - 1, b)));
  const conRasgo = texto.map((t, i) => (/NIVEL\s*\d{1,2}\s*:/i.test(t) ? i + 1 : 0)).filter(Boolean);
  let subTextos = [];
  for (const [a, b] of bloquesDe(conRasgo, 2)) subTextos.push(...parseSubclases(rango(a - 1, b)));
  subTextos = completarSubclases(subTextos);
  // nombres de subclase (etiquetas «SUBCLASE DE…»), como antes
  const subPags = texto.map((t, i) => (/SUBCLASE DE|RASGOS DE/i.test(t) ? i + 1 : 0)).filter(Boolean).map(cols);
  const subclases = detectarSubclases(subPags);
  for (const s of subTextos) if (s.nombre && !subclases.some(x => x.nombre.toLowerCase() === s.nombre.toLowerCase())) subclases.push({ clase: s.clase, nombre: s.nombre });

  // Reglas del DM: «Herramientas de DM» y las reglas generales de objetos mágicos
  aviso('reglas');
  const reglas = [];
  const ini = paginas.findIndex((pg, i) => /HERRAMIENTAS DE DM/.test(texto[i]) && grande(i + 1, /HERRAMIENTAS/));
  if (ini >= 0) {
    let fin = ini + 1; while (fin < N && !(/CREAR AVENTURAS/.test(texto[fin]) && grande(fin + 1, /CREAR AVENTURAS/))) fin++;
    reglas.push(...parseSecciones(rango(ini + 1, fin), 'Herramientas del DM'));
  }
  const cat = texto.findIndex(t => /CATEGOR[ÍI]AS DE OBJETOS M[ÁA]GICOS/.test(t));
  const az = texto.findIndex((t, i) => i > cat && /DE\s*LA\s*A\s*A\s*LA\s*Z|DELAAALAZ/.test(t));
  if (cat >= 0 && az > cat) reglas.push(...parseSecciones(rango(cat, az + 1), 'Objetos mágicos').filter(e => !/de la a a la z|delaaalaz|registro|obras de arte|piedras preciosas/i.test(e.nombre)));

  // Perfiles de criaturas (Manual de Monstruos, apéndice B del Manual del Jugador): páginas con CA, PG y VD
  aviso('criaturas');
  const criaturas = [];
  const conPerfil = texto.map((t, i) => (/\bC\s?[Aa]\s*[:;]/.test(t) && /\bP\s?G\s*[:;]\s*\d/.test(t) && /\bVD\s*[:;]/.test(t) ? i + 1 : 0)).filter(Boolean);
  for (const [a, b] of bloquesDe(conPerfil, 2)) criaturas.push(...parseCriaturas(rango(a - 1, b)));
  const unicas = [...new Map(criaturas.map(c => [c.clave, c])).values()];

  return { spells, glosario: [...glosario, ...reglas], objetos, dotes, trasfondos, subclases, subTextos, criaturas: unicas };
}
