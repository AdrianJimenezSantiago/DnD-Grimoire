/**
 * Lee el capítulo de descripciones de conjuros del Manual del Jugador (2024, en español)
 * a partir de las líneas de cada columna. Puro: no depende de pdf.js ni del DOM.
 *
 * Entrada: [{p, cols:[[línea…],[línea…]]}] con línea = {x, y, h, s}
 * Salida:  [{nombre, nivel, escuela, clases[], tiempo, ritual, alcance, comp, material, duracion, conc, desc, sup}]
 */
const LV = /^(?:Truco de ([a-záéíóúñ]+)|([A-ZÁÉÍÓÚH][a-záéíóúñ]+) de nivel ?[.,]? ?([\dBlI]))\s*(\(.*)?$/;
const DIGITO_OCR = { B: 8, l: 1, I: 1 };
const FIELD = /^(Tiempo de lanza\S*|Alcance|Componentes|Duraci\S*)\s*:\s*(.*)$/;
const canon = k => (k.startsWith('Tiempo') ? 'Tiempo de lanzamiento' : k.startsWith('Duraci') ? 'Duración' : k);
const DUR_VAL = /^(Instantáne[oa]|Concentración|Hasta |Especial|\d+ (asalto|minuto|hora|día))/i;
const SUP = /^(Con un espacio de conjuro de nivel superior|Usar un espacio de conjuro de nivel superior|Mejora de truco)\.\s*/;
const isFooter = s => /^CAP[ÍI]TULO\s*\d/i.test(s) || /^\d{1,3}$/.test(s) || /^DESCRIPCIONES DE CONJUROS$/.test(s);
const letters = s => s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
const isCaps = s => { const l = letters(s); return l.length >= 3 && l === l.toUpperCase(); };
/** Pie de foto: casi todo en mayúsculas aunque empiece por «Una…». */
const casiMayus = s => { const l = letters(s); if (l.length < 8) return false; const m = l.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length; return m / l.length >= 0.75; };
const lev = (a, b) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i;
  for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return d[b.length]; };
const escuelaDe = w => { w = (w || '').toLowerCase(); return ESCUELA[w] || Object.entries(ESCUELA).find(([k]) => lev(k, w) <= 2)?.[1] || ''; };
const ESCUELA = { abjuración: 'Abjuración', adivinación: 'Adivinación', conjuración: 'Conjuración', encantamiento: 'Encantamiento', evocación: 'Evocación', ilusionismo: 'Ilusionismo', nigromancia: 'Nigromancia', transmutación: 'Transmutación' };
const CLASE = { bardo: 'Bardo', brujo: 'Brujo', clérigo: 'Clérigo', druida: 'Druida', explorador: 'Explorador', hechicero: 'Hechicero', mago: 'Mago', paladín: 'Paladín' };
const PROPIOS = ['Alustriel', 'Elminster', 'Songal', 'Laeral', 'Simbul', 'Mystra', 'Deryan', 'Sylune', 'Syluné', 'Aganazzar', 'Snilloc', 'Agathys', 'Hadar', 'Yolande', 'Bigby', 'Drawmij', 'Evard', 'Leomund', 'Melf', 'Mordenkainen', 'Nystul', 'Otiluke', 'Otto', 'Rary', 'Tasha', 'Tenser', 'Jallarzi', 'Vitriolo'];

import { leerTabla, tablaATexto, arreglarDados } from './tablas.js';

const ARREGLOS = { escupo: 'Escudo' };   // mayúsculas pequeñas que el PDF codifica mal
const SUFIJOS = ['guardián de la fe'];     // nombres pegados a un pie de foto
export function nombreBonito(caps) {
  let s = caps.replace(/^[“”"]/, '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (ARREGLOS[s]) return ARREGLOS[s];
  const suf = SUFIJOS.find(x => (s.endsWith(x) || s.startsWith(x)) && s !== x); if (suf) s = suf;
  s = s.replace(/(\p{L}{2,}) ([áéíóú])(?=\s|$)/gu, '$1$2');   // «sylun é»: tilde suelta del OCR
  s = s.charAt(0).toUpperCase() + s.slice(1);
  // (sin \b: no sirve con letras acentuadas como la «é» final de Syluné)
  PROPIOS.forEach(p => { s = s.replace(new RegExp(`(?<!\\p{L})${p.toLowerCase()}(?!\\p{L})`, 'gu'), p); });
  return s;
}
export const claveNombre = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export function parseSpells(pages) {
  // Flujo lineal: página a página, columna izquierda y luego derecha. Se guarda el margen de cada columna.
  const L = [];
  for (const pg of pages) pg.cols.forEach(col => {
    const body = col.filter(l => !isFooter(l.s));
    // margen = la x más repetida de la columna (el mínimo falla con cajas de perfil o texto que rodea imágenes)
    const cuenta = new Map(); body.forEach(l => { const k = Math.round(l.x / 3); cuenta.set(k, (cuenta.get(k) || 0) + 1); });
    const moda = [...cuenta].sort((a, b) => b[1] - a[1])[0];
    const margin = moda ? moda[0] * 3 : Math.min(...body.map(l => l.x));
    const largos = body.map(l => l.s.length).sort((a, b) => a - b), tipico = largos[Math.floor(largos.length * 0.7)] || 50;
    body.forEach((l, i) => L.push({ ...l, margin, tipico, colStart: i === 0 }));
  });
  // Cabeceras: línea de escuela/nivel precedida del nombre en mayúsculas
  const heads = [];
  L.forEach((l, i) => {
    const m = LV.exec(l.s); if (!m) return;
    let j = i + 1, par = m[4] || '';
    while (par && !par.includes(')') && j < L.length && j < i + 3) { par += ' ' + L[j].s; j++; }
    // nombre: una o dos líneas en mayúsculas justo encima, sin punto final (los pies de foto acaban en punto)
    const nameLines = [];
    for (let k = i - 1; k >= 0 && nameLines.length < 2; k--) {
      const s = L[k].s, big = L[k].h >= 18.5 && letters(s).length >= 3 && s.length < 60;
      if (!(isCaps(s) || big) || /\.$/.test(s)) break;
      if (nameLines.length && Math.abs(L[k].y - L[k + 1].y) > L[k].h * 2.2) break;
      nameLines.unshift(k);
      if (L[k].colStart) break;
    }
    if (!nameLines.length) {
      const tail = /([A-ZÁÉÍÓÚÑ]{2,}(?:\s+(?:DE|DEL|LA|LAS|LOS|EL|Y|[A-ZÁÉÍÓÚÑ]{2,}))+)\s*$/.exec((L[i - 1]?.s || '').replace(/^.*[a-z.]\s*/, m => m.replace(/[A-ZÁÉÍÓÚÑ]+$/, '')));
      let raw = null, at = -1;
      for (let k = i - 1; k >= Math.max(0, i - 3) && !raw; k--) {
        const s = L[k].s; if (/\.$/.test(s) && isCaps(s)) continue;          // pie de foto: seguir subiendo
        raw = s.match(/(?:[a-záéíóúñ.]|^)([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]{4,})$/) || s.match(/^([A-ZÁÉÍÓÚÑ ]{5,})$/); at = k;
      }
      if (!raw) return;
      heads.push({ i, nameStart: at, nameEnd: at, nameText: raw[1].trim(), fieldsFrom: j, m, par });
      return;
    }
    heads.push({ i, nameStart: nameLines[0], nameEnd: nameLines[nameLines.length - 1], fieldsFrom: j, m, par });
  });
  const out = [];
  heads.forEach((h, n) => {
    const end = n + 1 < heads.length ? heads[n + 1].nameStart : L.length;
    const nombre = nombreBonito(h.nameText || (h.nameStart === h.nameEnd ? L[h.nameStart].s : L.slice(h.nameStart, h.nameEnd + 1).map(l => l.s).join(' ')));
    const escuela = escuelaDe(h.m[1] || h.m[2]);
    const nivel = h.m[1] ? 0 : (DIGITO_OCR[h.m[3]] ?? parseInt(h.m[3], 10));
    const clases = (h.par.match(/\(([^)]*)\)?/)?.[1] || '').split(',').map(c => CLASE[c.trim().toLowerCase()]).filter(Boolean);
    // Campos técnicos (cada uno puede ocupar varias líneas)
    const F = {}; let k = h.fieldsFrom, cur = null;
    for (; k < end; k++) {
      const s = L[k].s.replace(/^\|\s*/, ''), fm = FIELD.exec(s);
      if (fm) { const c = canon(fm[1]); if (!(fm[2] === '' && F[c])) { cur = c; F[cur] = fm[2]; } continue; }
      if (s.length <= 2 && !/\d/.test(s)) continue;                       // glifos sueltos del PDF
      if (cur === 'Componentes' && !F['Duración'] && DUR_VAL.test(s) && s.length < 45 && !/\($/.test(F[cur])) { cur = 'Duración'; F[cur] = s; continue; }
      if (!cur) continue;
      const open = (F[cur].match(/\(/g) || []).length > (F[cur].match(/\)/g) || []).length;
      if (open || /[,:]$|\bhasta$|\bo$|\by$/.test(F[cur])) { F[cur] += ' ' + s; continue; }
      if (cur === 'Duración') break;
      if (cur !== 'Duración' && !FIELD.test(s)) { F[cur] += ' ' + s; continue; }
    }
    // Descripción: párrafos por sangría; se omiten pies de foto en mayúsculas
    const paras = []; let para = '';
    const ETIQ = /^(?:[A-ZÁÉÍÓÚ][\p{L}.]{1,24}(?: [\p{L}.]{1,14}){0,2}:\s|(?:Fue|Des|Con|Int|Sab|Car)\s?\d)/u;
    for (; k < end; k++) {
      const l = L[k], s = l.s.replace(/^[|\[\]]\s*/, '').replace(/\s*[|\[\]]$/, '').replace(/\s[|\[\]]\s/g, ' ').trim();
      if (!s || FIELD.test(s)) continue;
      // tablas (de dado o de columnas alineadas): se guardan como filas «| a | b |»
      if (/^\S+\s/.test(s) || (l.cells || []).length > 1) {
        const t = leerTabla(L.slice(0, end), k, { margen: l.margin });
        if (t) { if (para) { paras.push(para); para = ''; } paras.push(tablaATexto(t.filas)); k = t.fin - 1; continue; }
      }
      // títulos dentro del texto (perfil de criatura: «Espíritu aberrante», «Atributos», «Acciones»): letra grande en mayúsculas
      if ((isCaps(s) || casiMayus(s)) && l.h >= 19.5 && letters(s).length >= 4) {
        if (para) { paras.push(para); para = ''; }
        paras.push(`**${nombreBonito(s.replace(/^\d+\s+/, ''))}**`); continue;
      }
      if ((isCaps(s) || casiMayus(s)) && (!/\d/.test(s) || letters(s).length >= 12)) continue;   // pies de foto
      if (s.length <= 2 && !/\d/.test(s)) continue;
      // restos de ilustraciones: mayoría de símbolos y siglas sin sentido («> ARA a >», «EEN Sab ION [Cars EAS»)
      const toks = s.split(/\s+/), raros = toks.filter(w => /^[^\p{L}\d]+$/u.test(w) || /^[[(]?[A-Z]{2,4}[\])]?$/.test(w) && !/^(CD|CA|PG|PX|BC|VD|DJ)$/.test(w)).length;
      if (!ETIQ.test(s) && toks.length <= 10 && raros >= 2 && raros / toks.length >= 0.45) continue;
      if (para && ETIQ.test(s)) { paras.push(para); para = ''; }                                  // líneas de perfil: CA:, PG:, Velocidad:…
      // nuevo párrafo solo si el anterior cerró la frase y esta línea está sangrada o la anterior era corta
      const prev = L[k - 1], cierra = /[.:!?»)”…]$/.test(para);
      const indent = l.x - l.margin > 4 && l.x - l.margin < 60, corta = prev && prev.s.length < prev.tipico * 0.75;
      if (para && (SUP.test(s) || (cierra && (indent || corta)))) { paras.push(para); para = ''; }
      para = para ? (para.endsWith('-') && /^[a-záéíóúñ]/.test(s) ? para.slice(0, -1) + s : para + ' ' + s) : s;
    }
    if (para) paras.push(para);
    for (let q = 0; q < paras.length; q++) paras[q] = paras[q].replace(/\s*CAP[ÍI]TULO\s*\d+\s*\|?\s*[A-ZÁÉÍÓÚ ]+\s*\d*\s*/g, ' ').trim();
    // Nivel superior / mejora de truco: solo su párrafo. Lo que venga después (p. ej. el perfil de la criatura) es descripción.
    let desc = [], sup = [];
    paras.forEach(p => { if (SUP.test(p) && !sup.length) sup.push(p.replace(SUP, '')); else desc.push(p); });
    // restos de ilustraciones al final de un párrafo («…arder. mE», «…fuego. |»)
    desc = desc.map(p => p.startsWith('|') ? p : p.replace(/([.:!?»)])(?:\s+(?:[|\[\]]|[A-Za-z]{1,2}|[a-z][A-Z]\w?|\[?\s?\w{1,4}\s?\w?\]?)){1,3}$/, '$1'));
    sup = sup.map(p => p.replace(/([.:!?»)])(?:\s+(?:[|\[\]]|[A-Za-z]{1,2}|[a-z][A-Z]\w?)){1,3}$/, '$1'));
    const tiempoRaw = (F['Tiempo de lanzamiento'] || '').trim(), durRaw = (F['Duración'] || '').trim();
    const compRaw = (F['Componentes'] || '').trim();
    out.push({
      nombre, nivel, escuela, clases,
      tiempo: tiempoRaw.replace(/\s*o\s+(un\s+)?ritual\b/i, '').replace(/\s*\|\s*$/, '').trim(), ritual: /\britual\b/i.test(tiempoRaw),
      alcance: (F['Alcance'] || '').trim(),
      comp: (compRaw.match(/^[VSM,\s]+/)?.[0] || compRaw).replace(/[,\s]+/g, ' ').trim(),
      material: compRaw.match(/M\s*\((.*)\)\s*$/)?.[1]?.trim() || '',
      duracion: durRaw, conc: /^Concentración/i.test(durRaw),
      desc: arreglarDados(desc.join('\n\n').trim()), sup: arreglarDados(sup.join('\n\n').trim()),
    });
  });
  return out;
}
