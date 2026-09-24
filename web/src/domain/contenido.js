/**
 * Contenido de personaje de los libros: dotes, trasfondos, subclases (con sus rasgos) y apartados de reglas del DM.
 * Mismo formato de texto que los conjuros («### Apartado», «• viñeta», tablas «| a | b |»). Puro.
 */
import { aplanar, bloques, esMayus, letras, tituloBonito, sinTildes } from './lector.js';
import { claveNombre } from './manual.js';
import { CLASES } from './reglas2024.js';
import { SUBCLASES } from './clases2024.js';

const PROPIOS = ['Faerûn', 'Faerún', 'Mystra', 'Tymora', 'Arpistas', 'Zhentarim', 'Guantelete', 'Dragón Púrpura', 'Alianza de los Lores', 'Enclave Esmeralda',
  'Magos Rojos', 'Thay', 'Culto del Dragón', 'Calimshan', 'Aguasprofundas', 'Puerta de Baldur', 'Myth Drannor', 'Cormyr', 'Sembia', 'Luskan', 'Neverwinter',
  'Tres', 'Bhaal', 'Bane', 'Myrkul', 'Árbol del Mundo', 'Illefarn', 'Netheril', 'Shar', 'Selûne', 'Tiamat'];
const CLASE_RE = 'B[AÁ]RBARO|BARDO|BRUJO|CL[EÉ]RIGO|DRUIDA|EXPLORADOR|GUERRERO|HECHICERO|MAGO|MONJE|PALAD[IÍ]N|P[IÍ]CARO';
const CLASE_DE = s => Object.keys(CLASES).find(c => sinTildes(c).toUpperCase() === sinTildes(s).toUpperCase()) || '';
const nombreDe = s => tituloBonito(s, PROPIOS);

/* ------------------------------------ dotes ------------------------------------ */
// «Dot·e de don épico», «Dote genera/»: la etiqueta también llega con restos del OCR
const CAT_DOTE = /^Dot\W?e\s+(de origen|genera[l\/1I|]|de estilo de combate|de don [ée]pico)(?![\p{L}])\s*(.*)$/iu;
export const CATS_DOTE = { 'de origen': 'Origen', general: 'General', 'de estilo de combate': 'Estilo de combate', 'de don épico': 'Don épico', 'de don epico': 'Don épico' };
export function parseDotes(pages) {
  const L = aplanar(pages), cab = [];
  for (let i = 1; i < L.length; i++) {
    const m = CAT_DOTE.exec(L[i].s); if (!m) continue;
    const n = L[i - 1].s; if (n.length > 48 || /[.,:;]$/.test(n) || letras(n).length < 3 || CAT_DOTE.test(n)) continue;
    let req = m[2] || '', fin = i + 1;
    while (/\([^)]*$/.test(req) && L[fin] && fin < i + 3) { req += ' ' + L[fin].s; fin++; }
    cab.push({ ini: i - 1, fin, nombre: nombreDe(n), cat: CATS_DOTE[m[1].toLowerCase().replace(/^genera.$/, 'general')] || m[1], req: req.replace(/^\(|\)$/g, '').replace(/^requisitos?:\s*/i, '').trim() });
  }
  return cab.map((c, n) => {
    let hasta = n + 1 < cab.length ? cab[n + 1].ini : L.length;
    // la última dote del capítulo no se come lo que venga después
    for (let k = c.fin; k < hasta; k++) if (k - c.fin > 45 || (esMayus(L[k].s) && L[k].h >= (L[k].hTip || 16) * 1.5)) { hasta = k; break; }
    return { clave: claveNombre(c.nombre), nombre: c.nombre, cat: c.cat, req: c.req, texto: bloques(L, c.fin, hasta, { propios: PROPIOS, subtitulo: () => null }).join('\n\n') };
  }).filter(d => d.texto.length > 20);
}

/* ---------------------------------- trasfondos ---------------------------------- */
const CAMPOS_T = [['caracteristicas', /^Puntuaci[oó]n(?:es)? de caracter[ií]stic\.?a\s*:\s*(.*)$/i], ['dote', /^Dote\s*:\s*(.*)$/i],
  ['habilidades', /^Competencias? (?:en|con) habilidades\s*:\s*(.*)$/i], ['herramientas', /^Competencias? con herramientas\s*:\s*(.*)$/i], ['equipo', /^Equipo\s*:\s*(.*)$/i]];
/* Firmas de los trasfondos del Manual del Jugador (características + dote): dan el nombre aunque el título no se lea bien. */
const FIRMAS = { 'int sab car|iniciado en la magia clerigo': 'Acólito', 'fue des int|fabricante': 'Artesano', 'des con car|habilidoso': 'Charlatán',
  'des con int|alerta': 'Criminal', 'fue des car|musico': 'Animador', 'fue con sab|duro': 'Campesino', 'fue int sab|alerta': 'Guardia',
  'des con sab|iniciado en la magia druida': 'Guía', 'con sab car|sanador': 'Ermitaño', 'con int car|afortunado': 'Comerciante',
  'fue int car|habilidoso': 'Noble', 'con int sab|iniciado en la magia mago': 'Erudito', 'fue des sab|maton de taberna': 'Marinero',
  'des int sab|habilidoso': 'Escriba', 'fue des con|atacante salvaje': 'Soldado', 'des sab car|afortunado': 'Vagabundo' };
const firma = t => `${claveNombre(t.caracteristicas || '').split(' ').filter(w => w.length >= 5).map(w => w.slice(0, 3).replace('con', 'con')).join(' ')}|${claveNombre(t.dote || '')}`;
/**
 * Nombres de las tablas «TRASFONDOS REGIONALES / DE FACCIONES» (columna «Trasfondo»), para dar nombre a los trasfondos
 * cuyo título va dentro de una ilustración o se lee mal.
 */
export const nombresTablaTrasfondos = pages => nombresDeTabla(pages, /^Trasfondo\s+(Regi[oó]n|Facci[oó]n)$/i);
/** Primera columna de las tablas con esa cabecera («Dote Categoría», «Trasfondo Región»…): los nombres tal y como los da el libro. */
export function nombresDeTabla(pages, cabecera) {
  const L = aplanar(pages), out = [];
  for (let i = 0; i < L.length; i++) {
    if (!cabecera.test(L[i].s.trim())) continue;
    const cab = L[i].segs || [], x0 = cab[0]?.x ?? L[i].x, x1 = cab[1]?.x ?? Infinity;
    for (let j = i + 1; j < L.length && j < i + 60 && L[j].p === L[i].p; j++) {
      const segs = (L[j].segs || [{ x: L[j].x, s: L[j].s }]).filter(g => g.x < x1 - 5);
      if (esMayus(L[j].s) || cabecera.test(L[j].s.trim())) break;
      if (!segs.length) continue;                                     // solo la segunda columna («Púrpura»)
      if (Math.abs(segs[0].x - x0) > 8) break;
      const t = segs.map(g => g.s).join(' ').trim();
      // «Expulsado de los Amos de las» + «Sombras»: la línea sin segunda columna continúa el nombre
      if (out.length && j > i + 1 && (L[j].segs || []).length === segs.length && segs.length === 1 && (L[j - 1].segs || []).length >= 2 && !/\s/.test(t)) out[out.length - 1] += ' ' + t;
      else out.push(t);
    }
  }
  return [...new Set(out.map(n => n.replace(/\s+/g, ' ').trim()))];
}
const tokens = t => claveNombre(t).split(' ').filter(w => w.length >= 4);
const casiIgual = (a, b) => a === b || (a.length >= 5 && b.length >= 5 && distanciaCorta(a, b) <= 1);
function distanciaCorta(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let i = 0, j = 0, d = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++d > 1) return 2; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return d + (a.length - i) + (b.length - j);
}
/**
 * Nombres mal leídos («Toca do por los mythales», «Don deljolgorio», «resistencla») contra la tabla del libro, que también trae
 * errores («Dragó n», «Huidas»): entre las dos lecturas gana la de palabras más frecuentes en el libro (la bien escrita se repite).
 */
export function corregirConTabla(lista, nombres, frec = new Map()) {
  if (!nombres.length) return lista;
  const junto = t => clave(t).replace(/ /g, '');
  const palabras = t => String(t).toLowerCase().match(/\p{L}+/gu) || [];
  // solo cuentan las palabras en que difieren las dos lecturas («resistencla» frente a «resistencia»)
  const mejorQue = (a, b) => { const pa = palabras(a), pb = palabras(b), da = pa.filter(w => !pb.includes(w)), db = pb.filter(w => !pa.includes(w));
    const f = ws => (ws.length ? Math.min(...ws.map(w => frec.get(w) || 0)) : 0); return f(da) > f(db); };
  return lista.map(x => {
    const k = junto(x.nombre); if (!k) return x;
    let mejor = null, d = 3; for (const n of nombres) { const e = distancia(k, junto(n)); if (e < d) { d = e; mejor = n; } }
    return mejor && mejor !== x.nombre && mejorQue(mejor, x.nombre) ? { ...x, nombre: mejor, clave: claveNombre(mejor) } : x;
  });
}
/** Frecuencia de cada palabra en el libro (para elegir la lectura buena de un nombre). */
export function frecuencias(textos) {
  const m = new Map(); for (const t of textos) for (const w of String(t).toLowerCase().match(/\p{L}+/gu) || []) m.set(w, (m.get(w) || 0) + 1); return m;
}
/** Nombra los trasfondos con la tabla del libro: los mal leídos por parecido y los que no tienen título por su texto. */
export function nombrarTrasfondos(lista, nombres) {
  if (!nombres.length) return lista;
  const usados = new Set();
  const parecidoA = n => { const tn = tokens(n); if (!tn.length) return null;
    let mejor = null, pm = 0; for (const c of nombres) { const tc = tokens(c), comunes = tn.filter(w => tc.some(v => casiIgual(w, v))).length; const p = comunes / Math.max(tc.length, tn.length); if (comunes >= Math.min(2, tc.length) && p > pm) { pm = p; mejor = c; } } return pm >= 0.5 ? mejor : null; };
  const out = lista.map(t => { if (!t.nombre) return t; const n = parecidoA(t.nombre); if (!n) return t; usados.add(n); return n === t.nombre ? t : { ...t, nombre: n, clave: claveNombre(n), revisar: false }; });
  return out.map(t => {
    if (t.nombre) return t;
    // sin título: el nombre libre cuyas palabras más aparecen en su descripción («unirte a los Arpistas» → Arpista)
    const txt = claveNombre(t.texto || '');
    const pts = nombres.filter(n => !usados.has(n)).map(n => ({ n, p: tokens(n).filter(w => txt.includes(w.slice(0, Math.max(5, w.length - 2)))).length })).sort((a, b) => b.p - a.p);
    if (!pts[0] || pts[0].p < 1 || (pts[1] && pts[1].p === pts[0].p)) return t;
    usados.add(pts[0].n); return { ...t, nombre: pts[0].n, clave: claveNombre(pts[0].n), revisar: false };
  });
}
export function parseTrasfondos(pages) {
  return leerTrasfondos(pages).map(t => { const n = FIRMAS[firma(t)]; return n ? { ...t, nombre: n, clave: claveNombre(n), revisar: false } : t; });
}
function leerTrasfondos(pages) {
  const L = aplanar(pages).map(l => ({ ...l, s: l.s.replace(/^[|>\s]+/, '') })), cab = [];
  const esCampo = s => CAMPOS_T.some(([, re]) => re.test(s));
  for (let i = 0; i < L.length; i++) {
    if (!CAMPOS_T[0][1].test(L[i].s)) continue;
    // nombre: el título en mayúsculas justo encima, en la misma columna (el OCR a veces no lo lee: queda para revisar)
    let k = i - 1; while (k >= 0 && i - k <= 4 && L[k].p === L[i].p && L[k].ci === L[i].ci && !(esMayus(L[k].s) && letras(L[k].s).length >= 4 && L[k].s.length < 45)) k--;
    const ok = k >= 0 && i - k <= 4 && L[k].p === L[i].p && L[k].ci === L[i].ci && esMayus(L[k].s);
    cab.push({ campos: i, nombre: ok ? nombreDe(L[k].s) : '', ini: ok ? k : i, top: ok ? L[k].y : L[i].y + L[i].h * 2 });
  }
  return cab.map((c, n) => {
    const f = {}; let cur = null, k = c.campos;
    for (; k < L.length && k < c.campos + 16; k++) {
      const s = L[k].s, m = CAMPOS_T.find(([, re]) => re.test(s));
      if (m && f[m[0]] != null) break;                                  // empieza el siguiente trasfondo
      if (m) { cur = m[0]; f[cur] = m[1].exec(s)[1]; continue; }
      if (cur && (/[,:(]$|\by$|\bo$|\bde$/.test(f[cur]) || /^[a-záéíóúñ(]/.test(s)) && s.length < 70 && !/\.$/.test(f[cur])) { f[cur] += ' ' + s; continue; }
      if (cur) break;
    }
    const finCampos = k;
    Object.keys(f).forEach(key => { f[key] = f[key].replace(/\s+/g, ' ').replace(/\s*\(consu\s?lta[^)]*\)?/i, '').replace(/\s+,/g, ',').replace(/^1(?=[a-záéíóú])/i, 'I').trim(); });
    // descripción: en la misma página, entre este trasfondo y el siguiente (el texto puede ir en la otra columna, junto al recuadro)
    const sig = cab[n + 1], mismaSig = sig && L[sig.campos].p === L[c.campos].p;
    const sel = [];
    L.forEach((l, j) => {
      if (j >= c.campos && j < finCampos) return;
      if (l.p !== L[c.campos].p || esCampo(l.s) || esMayus(l.s)) return;
      if (l.y > c.top + 2 || (mismaSig && l.y <= sig.top + 2)) return;
      if (cab.some(o => o !== c && j >= o.campos && j < o.campos + 8)) return;
      sel.push(j);
    });
    const tramos = []; sel.forEach(j => { const t = tramos[tramos.length - 1]; if (t && t[1] === j) t[1] = j + 1; else tramos.push([j, j + 1]); });
    const texto = tramos.flatMap(([a, b]) => bloques(L, a, b, { propios: PROPIOS, subtitulo: () => null })).filter(p => !p.startsWith('|')).join('\n\n');
    const nombre = c.nombre;
    return { clave: claveNombre(nombre || f.dote || 'trasfondo'), nombre, revisar: !nombre, ...f, texto };
  }).filter(t => t.caracteristicas && t.dote);
}

/* ---------------------------------- subclases ---------------------------------- */
/** Distancia de edición (para títulos con una o dos letras mal leídas: «pracónica», «LABRÓN»). */
function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const clave = t => sinTildes(String(t)).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
/** El nombre conocido más parecido (hasta 2 letras de diferencia en nombres largos), o null. */
function parecido(texto, nombres) {
  const t = clave(texto); if (t.length < 6) return null;
  let mejor = null, d = 3;
  for (const n of nombres) { const x = distancia(t, clave(n)); if (x < d) { d = x; mejor = n; } }
  return mejor;
}
const rasgosConocidos = (clase, nombre) => {
  const sc = (SUBCLASES[clase] || []).find(x => clave(x.nombre) === clave(nombre));
  return sc ? Object.entries(sc.rasgos).flatMap(([nv, rs]) => rs.map(r => ({ nivel: +nv, nombre: r }))) : [];
};
const RASGO = /^NIVEL\s*(\d{1,2})\s*[:.]\s*(.+)$/i;
// «NIVEL» leído con OCR: «NrIveEL», «Niveel», «NrveL», «NIvEL»…
// el número también llega mal leído («lL» = 11, «IO» = 10) y los dos puntos como coma o sin ellos («NIVEL 15, ESPECTRO»)
const NIVEL_OCR = /(^|[.!?»)]\s+|^\W+)N[rRiIl1]{0,2}[vV][eE]{1,2}[lL]\s*([\dlIOL]{1,2})\s*(?:[:;.,]\s*|\s+(?=[A-ZÁÉÍÓÚÑ]{2}))/;
const numOcr = t => +t.replace(/[lIL]/g, '1').replace(/O/g, '0');
const MENOR = /^(DE|DEL|LA|LAS|LOS|EL|Y|A|EN|CON|SIN|AL|POR)$/;
const esMay = w => /^[A-ZÁÉÍÓÚÜÑ0-9'’-]+$/.test(w) && /[A-ZÁÉÍÓÚÜÑ]/.test(w);
const esCap = w => /^[A-ZÁÉÍÓÚÑ][a-záéíóúüñ]+$/.test(w);
/**
 * Los títulos de rasgo a veces llegan con «NIVEL» mal leído, pegados al texto («NIVEL 10: REPRESALIA Cuando recibas…»)
 * o en mitad de una línea («…gastado. NIVEL 10: EL TERCER OJO Puedes…»). Se separan en título («NIVEL 10: REPRESALIA») y texto.
 */
export function separarRasgos(L) {
  const out = [];
  for (let i = 0; i < L.length; i++) {
    const l = L[i], m = NIVEL_OCR.exec(l.s), nv = m && numOcr(m[2]);
    if (!m || !(nv >= 1 && nv <= 20)) { out.push(l); continue; }
    const antes = l.s.slice(0, m.index + m[1].length).replace(/^\W+$/, '').trim(), resto = l.s.slice(m.index + m[0].length).trim().split(/\s+/);
    // el nombre: palabras en versalitas («Foco FANÁTICO», «Paso VELOZ»); el texto empieza en la primera palabra normal
    let n = 0;
    while (n < resto.length) {
      const w = resto[n].replace(/[.,:;]$/, ''), sig = resto[n + 1] || '';
      if (esMay(w) || (MENOR.test(w.toUpperCase()) && n > 0 && esMay(sig)) || (esCap(w) && esMay(sig.replace(/[.,:;]$/, '')))) n++; else break;
    }
    if (!n) { out.push(l); continue; }
    let nombre = resto.slice(0, n).join(' ');
    // título en dos líneas («NIVEL 3: CONJUROS DE» + «CAMINANTE INVERNAL»)
    const sig = L[i + 1];
    if (n === resto.length && sig && sig.p === l.p && esMayus(sig.s) && sig.s.length < 40 && !NIVEL_OCR.test(sig.s)) { nombre += ' ' + sig.s.trim(); i++; }
    if (antes) out.push({ ...l, s: antes });
    // «EXPLORADOR. GÉLIDO»: puntos sueltos dentro del nombre
    out.push({ ...l, s: `NIVEL ${nv}: ${nombre.replace(/\.(?=\s)/g, '').toUpperCase()}`, x: l.margin ?? l.x, h: Math.max(l.h, (l.hTip || 16) * 1.12) });
    if (n < resto.length) out.push({ ...l, s: resto.slice(n).join(' '), x: l.margin ?? l.x });
  }
  return out;
}
/**
 * Subclases con su texto: título conocido («ADIVINO») o con la clase entre paréntesis («HOJACANTANTE (MAGO)»),
 * seguido de rasgos «NIVEL 3: …». Devuelve [{clave, clase, nombre, lema, texto, rasgos:[{nivel, nombre}]}].
 */
export function parseSubclases(pages, extras = []) {
  const L = separarRasgos(aplanar(pages));
  const conocidas = new Map();
  for (const [clase, v] of Object.entries(CLASES)) for (const s of v.subs || []) conocidas.set(claveNombre(s), { clase, nombre: s });
  for (const s of extras) if (s.clase) conocidas.set(claveNombre(s.nombre), s);
  const cab = [];
  for (let i = 0; i < L.length; i++) {
    let s = L[i].s.replace(/^[|>\s]+|[|<\s]+$/g, ''); if (!esMayus(s) || s.length > 60 || RASGO.test(s)) continue;
    // título de verdad: en el margen de la columna y más grande que el texto (las etiquetas de las ilustraciones no)
    // (a la izquierda del margen estimado vale: una tabla sangrada en la misma columna lo desplaza)
    if (L[i].x - L[i].margin > 12 || L[i].h < (L[i].hTip || 16) * 1.12) continue;
    // título en dos líneas («SENDA DEL» + «BERSERKER»)
    const sig = L[i + 1];
    if (sig && esMayus(sig.s) && !RASGO.test(sig.s) && sig.p === L[i].p && L[i].y - sig.y < L[i].h * 2 && !conocidas.get(claveNombre(s))) {
      const dos = s + ' ' + sig.s; if (conocidas.get(claveNombre(dos)) || /\)$/.test(sig.s)) s = dos;
    }
    let clase = '', nombre = '';
    const p = new RegExp(`^(.+?)\\s*\\((${CLASE_RE})\\)$`, 'i').exec(sinTildes(s).toUpperCase() === sinTildes(s) ? s : s);
    if (p) { clase = CLASE_DE(p[2]); nombre = p[1]; }
    else { const k = conocidas.get(claveNombre(s)); if (k) { clase = k.clase; nombre = k.nombre; } }
    // título con una letra mal leída, a veces en dos líneas y la segunda sin mayúsculas («HECHICERÍA» + «pracónica»)
    if (!clase) {
      const sig2 = L[i + 1], opciones = [s, sig2 && sig2.p === L[i].p && L[i].y - sig2.y < L[i].h * 2 ? s + ' ' + sig2.s.replace(/^[|>\s]+/, '') : null].filter(Boolean);
      for (const o of opciones) { const n = parecido(o, [...conocidas.values()].map(v => v.nombre)); if (n) { const k = conocidas.get(claveNombre(n)); clase = k.clase; nombre = k.nombre; break; } }
    }
    if (!clase) continue;
    // tiene que haber un rasgo de subclase poco después
    const rasgo = L.slice(i + 1, i + 40).findIndex(l => RASGO.test(l.s) && +RASGO.exec(l.s)[1] >= 3);
    if (rasgo < 0) continue;
    cab.push({ ini: i, clase, nombre: nombreDe(nombre) });
    i += rasgo;
  }
  return cab.map((c, n) => {
    let hasta = n + 1 < cab.length ? cab[n + 1].ini : L.length;
    for (let k = c.ini + 1; k < hasta; k++) {
      const s = L[k].s, r = RASGO.exec(s);
      if ((r && +r[1] < 3 && esMayus(s)) || /^(RASGOS DE|SUBCLASES DE)\b/i.test(sinTildes(s).toUpperCase()) || k - c.ini > 280) { hasta = k; break; }
    }
    const rasgos = [];
    const bs = bloques(L, c.ini + 1, hasta, { propios: PROPIOS, subtitulo: (l, s) => {
      const r = RASGO.exec(s); if (r) { const nm = nombreDe(r[2]); rasgos.push({ nivel: +r[1], nombre: nm }); return `Nivel ${r[1]}: ${nm}`; }
      return l.h >= (l.hTip || 16) * 1.12 && letras(s).length >= 4 && s.length < 50 ? nombreDe(s) : null; } });
    // primera frase en cursiva del libro: el lema de la subclase
    const lema = bs[0] && !bs[0].startsWith('#') && bs[0].length < 110 ? bs.shift() : '';
    return { clave: claveNombre(c.nombre), clase: c.clase, nombre: c.nombre, lema, texto: bs.join('\n\n'), rasgos };
  }).filter(s => s.rasgos.length).flatMap(sc => partirPorReinicio(sc, conocidas));
}
/* Si el título de una subclase no se leyó, sus rasgos quedan pegados a la anterior: vuelven a empezar por el nivel 3. */
function partirPorReinicio(sc, conocidas) {
  const bs = sc.texto.split('\n\n'); let max = 0, corte = -1;
  bs.forEach((b, k) => { const m = /^### Nivel (\d+):/.exec(b); if (!m) return; const n = +m[1]; if (corte < 0 && n === 3 && max > 3) corte = k; max = Math.max(max, n); });
  if (corte < 0) return [sc];
  const faltan = [...conocidas.values()].filter(c => c.clase === sc.clase && c.nombre !== sc.nombre);
  const resto = bs.slice(corte).join('\n\n'), rasgos = [...resto.matchAll(/^### Nivel (\d+): (.+)$/gm)].map(m => ({ nivel: +m[1], nombre: m[2] }));
  const a = { ...sc, texto: bs.slice(0, corte).join('\n\n'), rasgos: sc.rasgos.slice(0, sc.rasgos.length - rasgos.length) };
  return [a, { clave: '', clase: sc.clase, nombre: '', lema: '', texto: resto, rasgos, revisar: true, candidatas: faltan.map(f => f.nombre) }];
}
/** Nombres de rasgo con alguna letra mal leída («Labrón de conjuros») → el nombre oficial de esa subclase. */
function corregirRasgos(sc, nombre) {
  const oficiales = rasgosConocidos(sc.clase, nombre); if (!oficiales.length) return sc;
  let texto = sc.texto;
  const rasgos = sc.rasgos.map(r => {
    const n = oficiales.some(o => clave(o.nombre) === clave(r.nombre)) ? null : parecido(r.nombre, oficiales.filter(o => o.nivel === r.nivel).map(o => o.nombre));
    if (!n) return r;
    texto = texto.replace(`### Nivel ${r.nivel}: ${r.nombre}`, `### Nivel ${r.nivel}: ${n}`);
    return { ...r, nombre: n };
  });
  return { ...sc, texto, rasgos };
}
/** Una subclase sin título (el nombre va dentro de una ilustración) se reconoce por sus rasgos: al menos dos que coincidan. */
function nombrarPorRasgos(sc) {
  const propios = new Set(sc.rasgos.map(r => clave(r.nombre)));
  const cand = (SUBCLASES[sc.clase] || []).map(x => ({ x, n: rasgosConocidos(sc.clase, x.nombre).filter(r => propios.has(clave(r.nombre))).length })).sort((a, b) => b.n - a.n);
  if (!cand[0] || cand[0].n < 2 || (cand[1] && cand[1].n === cand[0].n)) return sc;
  const nombre = cand[0].x.nombre;
  return corregirRasgos({ ...sc, nombre, clave: claveNombre(nombre), revisar: false }, nombre);
}
/** Quita duplicados y pone nombre a las partes sin título cuando solo falta una subclase de esa clase. */
export function completarSubclases(lista) {
  lista = lista.map(sc => (sc.nombre ? corregirRasgos(sc, sc.nombre) : nombrarPorRasgos(sc)));
  const vistas = new Map();
  for (const sc of lista) if (sc.nombre) { const v = vistas.get(sc.clave); if (!v || sc.texto.length > v.texto.length) vistas.set(sc.clave, sc); }
  const out = [...vistas.values()];
  for (const sc of lista.filter(x => !x.nombre)) {
    const libres = (sc.candidatas || []).filter(n => !vistas.has(claveNombre(n)));
    if (libres.length === 1) { const n = libres[0]; const x = { ...sc, nombre: n, clave: claveNombre(n), revisar: false }; vistas.set(x.clave, x); out.push(x); }
    else out.push(sc);
  }
  return out;
}

/* ------------------------------- reglas del DM ------------------------------- */
/**
 * Apartados de reglas (capítulo «Herramientas de DM» y reglas de objetos mágicos): cada título grande es una entrada
 * del glosario, con sus subapartados y tablas. cat: categoría con la que aparecen en el glosario.
 */
export function parseSecciones(pages, cat) {
  const L = aplanar(pages);
  const grande = l => esMayus(l.s) && l.h >= (l.hTip || 16) * 1.55 && letras(l.s).length >= 4 && l.s.length < 50 && !/^CAP[ÍI]TULO/.test(l.s);
  const cab = [];
  for (let i = 0; i < L.length; i++) {
    if (!grande(L[i])) continue;
    let nombre = L[i].s, j = i + 1;
    while (L[j] && grande(L[j]) && L[i].y - L[j].y < L[i].h * 2.4 && L[j].p === L[i].p) { nombre += ' ' + L[j].s; j++; }   // título en dos líneas
    if (/HERRAMIENTAS DE DM|TESOROS$/.test(nombre)) { i = j - 1; continue; }
    cab.push({ ini: i, fin: j, nombre: nombreDe(nombre) }); i = j - 1;
  }
  return cab.map((c, n) => {
    const hasta = n + 1 < cab.length ? cab[n + 1].ini : L.length;
    const texto = bloques(L, c.fin, hasta, { propios: PROPIOS }).join('\n\n');
    return { clave: claveNombre(c.nombre), nombre: c.nombre, cat, texto };
  }).filter(e => e.texto.length > 200 && !/^Registro|^Hoja/i.test(e.nombre));
}
