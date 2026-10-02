// Corrector de los restos del OCR en el texto de los manuales.
// No conoce ningún libro en concreto: aprende el vocabulario del propio texto (las palabras frecuentes son correctas,
// las rarezas que se parecen mucho a una palabra frecuente son errores) y aplica reglas propias de D&D
// (dados, niveles, cabeceras en versalitas, cifras confundidas con letras).
//   const voc = crearVocabulario(textosDelLibro);  const limpias = corregirLineas(lineas, voc);

const L = '\\p{L}';
const sinTildes = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
// Nombres de D&D con signos que el OCR casi nunca acierta (Faerûn sale como Faerún, Faerün, Faerfin…)
const LEXICO = ['Faerûn', 'faerûnense', 'faerûnenses', 'Selûne', 'Lantan'];
const RE_LEXICO = LEXICO.map(w => [new RegExp(`^${sinTildes(w).toLowerCase().replace(/u/g, '(?:u|ú|ü|û|fi|íl|il|o|q|cm|ûn?)')}$`, 'i'), w]);

export function crearVocabulario(textos, base = []) {
  const f = new Map(), forma = new Map();
  const suma = (w, n) => { const k = w.toLowerCase(); f.set(k, (f.get(k) || 0) + n); const fm = forma.get(k); if (!fm) forma.set(k, new Map([[w, n]])); else fm.set(w, (fm.get(w) || 0) + n); };
  for (const t of textos) for (const w of String(t).match(new RegExp(`${L}+`, 'gu')) || []) suma(w, 1);
  for (const [w, n] of base) suma(w, n);
  for (const w of LEXICO) suma(w, 50);
  // Trigramas de letras de las palabras frecuentes: una palabra con un trigrama casi inexistente huele a error del OCR
  const tri = new Map();
  for (const [k, n] of f) if (n >= 3) { const w = `^${k}$`; for (let i = 0; i + 3 <= w.length; i++) tri.set(w.slice(i, i + 3), (tri.get(w.slice(i, i + 3)) || 0) + n); }
  // Formas frecuentes agrupadas sin tildes, para saber si «fallará» es otra forma de una palabra conocida
  const acc = new Map();
  for (const [k, n] of f) if (n >= 3) { const b = sinTildes(k), a = acc.get(b); if (a) a.push(k); else acc.set(b, [k]); }
  return { f, forma, tri, acc, n: k => f.get(k.toLowerCase()) || 0 };
}
// Respeta la forma de la palabra original: MAYÚSCULAS, Capitalizada o minúsculas
function comoOriginal(orig, nueva) {
  const letras = orig.replace(/[^\p{L}]/gu, '');
  if (letras.length > 1 && letras === letras.toUpperCase()) return nueva.toUpperCase();
  if (/^\p{Lu}/u.test(letras) || /^\d/.test(orig) && /^\p{Lu}/u.test(nueva)) return nueva.charAt(0).toUpperCase() + nueva.slice(1);
  return nueva.toLowerCase();
}

// Confusiones típicas del OCR (lo leído → lo escrito)
const CONF = [['rn', 'm'], ['m', 'rn'], ['u', 'n'], ['n', 'u'], ['ii', 'ñ'], ['fi', 'ñ'], ['11', 'ñ'], ['ri', 'n'], ['li', 'h'], ['h', 'b'], ['b', 'h'], ['l', 'i'], ['i', 'l'], ['í', 'i'], ['i', 'í'],
  ['1', 'l'], ['1', 'i'], ['l', 't'], ['t', 'l'], ['c', 'e'], ['e', 'c'], ['cl', 'd'], ['<l', 'd'], ['ele', 'de'], ['el', 'd'], ['ü', 'ú'], ['ó', 'o'], ['ii', 'ñ'], ['n.', 'ñ'], ['ñ.', 'ñ'],
  ['6', 'ó'], ['6', 'fi'], ['8', 's'], ['5', 's'], ['0', 'o'], ['n', 'ñ'], ['cí', 'ió'], ['ll', 'l'], ['f', 'ff'], ['1', 'i'], ['!', 'l'], ['!', 'i'], ['j', 'i'], ['f', 't'], ['rn', 'm']];
const ALFA = 'abcdefghijklmnopqrstuvwxyzáéíóúüñ';

// Una palabra rara pero bien escrita suele ser otra forma de una palabra frecuente: plural, femenino, tilde,
// pronombre pegado («crearlos») o tiempo verbal («fallarás», «detienes»). Esas no se tocan.
const CLITICO = /(?:lo|la|los|las|le|les|se|me|te|nos|selo|sela|selos|selas)$/;
const VERBAL = new RegExp(`(?:${'ar|er|ir|aba|abas|aban|ábamos|aré|arás|ará|aremos|arán|aría|arían|ado|ada|ados|adas|ando|iendo|ido|ida|idos|idas|ía|ías|ían|ió|aron|ieron|ase|ara|aras|aran|iera|ieran|iese|e|es|en|a|as|an|o|amos|emos|imos|áis|éis|ó|rá|rás|rán|ré|remos|ría|rías|rían'.split('|').sort((a, b) => b.length - a.length).join('|')})$`);
const TERMINACIONES = VERBAL.source.slice(3, -2).split('|');
export function plausible(k, voc) {
  if (voc.n(k) >= 3) return true;
  const base = sinTildes(k), vale = x => x && x.length >= 3 && x !== k && voc.n(x) >= 3;
  if ((voc.acc.get(base) || []).some(w => w !== k)) return true;
  const raices = new Set([k.replace(/es$/, ''), k.replace(/s$/, ''), k.replace(/[oa]s?$/, 'o'), k.replace(/[oa]s?$/, 'a'), k.replace(/[oa]s?$/, 'os'), k.replace(/[oa]s?$/, 'as'),
    k.replace(/[oa]s?$/, 'es'), k.replace(CLITICO, ''), sinTildes(k.replace(CLITICO, ''))]);
  for (const r of raices) if (vale(r)) return true;
  for (const ter of TERMINACIONES) {
    if (!k.endsWith(ter)) continue;
    const raiz = k.slice(0, -ter.length);
    if (raiz.length >= 3 || raiz.length === 2 && ter.length >= 3) for (const fin of ['ar', 'er', 'ir', 'r', 'a', 'e', 'o', 'an', 'en', 'es', 'as', 'ado', 'ido', 'ía']) if (vale(raiz + fin) || vale(sinTildes(raiz) + fin)) return true;
  }
  return false;
}
// Palabras cortas que el OCR destroza siempre igual (n↔u, d↔cl/el, e↔c)
export const CORTAS = { uu: 'un', uua: 'una', uuo: 'uno', uuas: 'unas', uuos: 'unos', eu: 'en', ele: 'de', '<le': 'de', qne: 'que', cn: 'en', clel: 'del', cle: 'de', lus: 'los', pur: 'por', ln: 'la' };

const sospechosa = (k, voc) => { const w = `^${k}$`; for (let i = 0; i + 3 <= w.length; i++) if ((voc.tri.get(w.slice(i, i + 3)) || 0) < 3) return true; return /[^\p{L}]/u.test(k); };

function candidatoDe(w, voc) {
  const k = w.toLowerCase(), n0 = voc.n(k);
  if (n0 >= 3 || plausible(k, voc) && !/[^\p{L}]/u.test(k)) return null;
  const mejor = (lista, min, fac) => {
    let best = null, bn = 0, segundo = 0;
    for (const c of new Set(lista)) { if (c === k) continue; const n = voc.n(c); if (n > bn) { segundo = bn; bn = n; best = c; } else if (n > segundo) segundo = n; }
    return best && bn >= min && bn >= fac * (n0 + 1) && bn >= 4 * segundo ? best : null;
  };
  // 1) Restos de puntuación dentro de la palabra: «lo.s», «Caída.s», «versa.do», «anima.Les», «la!>»
  const sinPunt = k.replace(/[.'·!:<>"]/g, '');
  if (sinPunt !== k && sinPunt.length >= 3 && /\p{Ll}/u.test(w) && voc.n(sinPunt) >= 3) { voc.regla = 'puntuación'; return sinPunt; }
  // 2) Confusiones típicas (una o dos)
  const conf1 = [];
  for (const [a, b] of CONF) { let i = k.indexOf(a); while (i >= 0) { conf1.push(k.slice(0, i) + b + k.slice(i + a.length)); i = k.indexOf(a, i + 1); } }
  if (k.length >= 6) for (const ch of ALFA) conf1.push(k + ch);
  const conf2 = [];
  if (k.length >= 4) for (const x of conf1) for (const [a, b] of CONF) { let i = x.indexOf(a); while (i >= 0) { conf2.push(x.slice(0, i) + b + x.slice(i + a.length)); i = x.indexOf(a, i + 1); } }
  // Las de dos cambios necesitan diez veces más apoyo, y en nombres propios mucho más
  const propio = /^\p{Lu}/u.test(w) && /\p{Ll}/u.test(w), c1 = mejor(conf1, 3, 3), c2 = mejor(conf2, propio ? 100 : 5, propio ? 100 : 5);
  let c = c1 && (!c2 || voc.n(c1) * 10 >= voc.n(c2)) ? c1 : c2;
  voc.regla = c === c1 ? 'confusión' : 'confusión×2';
  if (c) return c;
  // 3) Cualquier cambio de una letra en palabras largas
  if (partir(w, voc)) return null;
  if (k.length >= 6 && !/\d/.test(k) && sospechosa(k, voc)) {
    const ed1 = [];
    for (let i = 0; i <= k.length; i++) {
      if (i < k.length) ed1.push(k.slice(0, i) + k.slice(i + 1));
      for (const ch of ALFA) { ed1.push(k.slice(0, i) + ch + k.slice(i)); if (i < k.length) ed1.push(k.slice(0, i) + ch + k.slice(i + 1)); }
    }
    voc.regla = 'una letra'; if ((c = mejor(ed1, propio ? 40 : 20, propio ? 40 : 20))) return c;
  }
  return null;
}

// Una palabra desconocida que son dos conocidas pegadas: «tormentay», «almenos», «deterreno», «recompensaa», «alos»
function partir(w, voc) {
  const k = w.toLowerCase();
  if (voc.n(k) >= 3 || k.length < 4 || !/^\p{L}+$/u.test(k)) return null;
  let best = null, bs = 0;
  for (let i = 1; i < k.length; i++) {
    const a = k.slice(0, i), b = k.slice(i), na = voc.n(a), nb = voc.n(b);
    // Solo se separa una palabra de enlace al principio («almenos», «deterreno», «alos») o una «y»/«a» al final («tormentay», «cercanoa»)
    if (!(/^(?:a|al|de|del|y|o|la|el|los|las)$/.test(a) && (b.length >= 4 || /^(?:los|las|les|una|uno|más)$/.test(b)) && nb >= 20 || (b === 'y' || b === 'a' && /[aon]$/.test(a)) && a.length >= 4 && na >= 5) || na < 5) continue;
    if (plausible(k, voc)) return null;
    const s = Math.min(na, nb);
    if (s > bs) { bs = s; best = [w.slice(0, i), w.slice(i)]; }
  }
  return best && bs >= 5 ? best.join(' ') : null;
}

// Media de una tirada «NdC + M» (como en los perfiles: «11 (2d10)»)
const media = (n, c, m = 0) => Math.floor(n * (c + 1) / 2) + m;
function dadosConMedia(s) {
  return s.replace(/\b(\d{1,3}) \((\d{1,2})[4O0dl<]{1,2}(4|6|8|10|12|20)((?: ?[+-] ?\d+)?)\)/g, (m, avg, n, c, mod) => {
    const md = +(mod.replace(/\s/g, '') || 0);
    return media(+n, +c, md) === +avg ? `${avg} (${n}d${c}${mod})` : m;
  });
}

const esMayusc = t => { const l = t.replace(/[^\p{L}]/gu, ''); return l.length >= 2 && l === l.toUpperCase(); };

export function corregirLinea(s, voc, anterior = '') {
  if (!s) return s;
  let t = s;
  // Restos de marcos y columnas al principio o al final de la línea: «| », «[| », «l Fue 6», «ll alcance»
  t = t.replace(/(^|\s)<l[ae]\b/g, (m, a) => a + 'de');
  t = t.replace(/^(?:[|[\]{}]+\s*|(?:ll?|Il|I|il)\s+(?=[\p{Lu}¿(+\d]))+/u, '').replace(/^(?:[|[\]]+\s*)+/, '').replace(/\s+[|[\]]+\s*$/, '');
  t = t.replace(/^(?:ll?|Il|il)\s+(?=\p{Ll})/u, '');
  // Viñetas leídas como «+», «-» o «+»»
  t = t.replace(/^(?:\+»?|-)\s+(?=\p{Lu}|\d+ \p{L})/u, '• ');
  // Dados y daño: «ld6», «4dl0», «2<l4», «(Id6)», «daiio»
  t = t.replace(/\b([l1I]|\d+)\s*(?:d|<l|<i)\s*([l1I]?\d+|l0|lO)\b/g, (m, a, b) => `${a.replace(/[lI]/g, '1')}d${b.replace(/[lI]/g, '1').replace(/O/g, '0')}`)
    .replace(/(^|[\s(])[lI]d(\d+)/g, '$11d$2').replace(/\bda(?:iio|ii o|n\.o|ñ\.o|fio)(?=[\s.,;:]|$)/g, 'daño');
  t = dadosConMedia(t);
  t = t.replace(/\(([l1I]|\d)d(\d+) \+ [lI]\)/g, '($1d$2 + 1)').replace(/\b(\d{1,2})[4O0](4|6|8|10|12|20)(?= (?:de daño|más tu|\+ ))/g, '$1d$2')
    .replace(/\b(tira|tiras|tirar|tirada de|lanza|en un|en el) (\d)[4O0](4|6|8|10|12|20|100)\b/gi, '$1 $2d$3');
  // «NIVEL l:», «NIVEL lL», «NIVEL 15,», «NIvEL 3:» (cabeceras de rasgos de clase)
  t = t.replace(/^(?!Nivel )N[iIr]{1,2}[vV][eE]{0,2}[lL](?= [\dlI|])/u, 'NIVEL').replace(/^NIVEL ([lIL1|]{1,2}|\d{1,2})\s*[:;,.]?\s+/u, (m, n) => `NIVEL ${n.replace(/[lIL|]/g, '1')}: `);
  // «D&D» en sus muchas lecturas
  t = t.replace(/\bD[EÉ&][:.,]?D\b|\bDÉD\b|\bDE\.D\b/g, 'D&D');
  // Cifras con letras: «l,S m», «l O días», «a SO,», «(O PX», «a O los»
  t = t.replace(/(^|[\s(])([\dlIOS]+,[\dlIOS]+)(?= ?(?:m|km|kg|cm)\b)/g, (m, a, n) => /\d/.test(n) || /,/.test(n) ? a + n.replace(/[lI]/g, '1').replace(/O/g, '0').replace(/S/g, '5') : m)
    .replace(/\b[lI] ?[O0](?= (?:días|minutos|horas|m|kg|po)\b)/g, '10').replace(/\bl(?= ?\d)/g, '1').replace(/(\d)l\b/g, '$11')
    .replace(/\(O PX/g, '(0 PX').replace(/\b(a|de|en|reduce a|reduzca a) O(?=[ ,.)]|$)(?! (?:o|y)\b)/gu, '$1 0').replace(/(?<=[\s(])O(?= (?:m|PX|po)\b)/g, '0');
  // Una «l» suelta es casi siempre un 1 («en l, hasta», «suma l nivel»); tras una cifra es un litro
  t = t.replace(/(?<![\d,]\s?)(?<=^|[\s(])l(?=[\s,.:;)]|$)/g, (m, i) => (i === 0 && /^l\s+\p{Lu}/u.test(t) ? m : '1'));
  t = t.replace(/(\d(?:,\d+)?) 1(?= de (?:líquido|agua|aceite|vino)\b)/g, '$1 l');
  // «x» entre cifras
  t = t.replace(/(\d) x (\d)/g, '$1 × $2').replace(/(^|\s)([+-])[lI](?=\s|$)/g, '$1$21');
  // Espacios antes de la puntuación y puntos dobles
  t = t.replace(/(\p{L}|\)) ([,;:.])(?=\s|$)/gu, '$1$2').replace(/(\p{L})\.\.(?=\s|$)/gu, '$1.');
  // «O» al principio de línea en mitad de una frase es la conjunción
  if (anterior && !/[.!?:»”")]$/.test(anterior.trim())) t = t.replace(/^O(?= \p{Ll})/u, 'o');

  // Palabras partidas por un espacio: «herram ientas», «d urante», «ter roríficos», «s í», «fus iona»
  {
    const ws = t.split(' '), out = [];
    for (let i = 0; i < ws.length; i++) {
      const x = ws[i], y = ws[i + 1], m = y && /^(\p{L}{1,10})([,.;:)]?)$/u.exec(y);
      if (m && /^\p{L}{1,9}$/u.test(x)) {
        const j = (x + m[1]).toLowerCase(), nx = voc.n(x), ny = voc.n(m[1]);
        if (voc.n(j) >= 5 && (nx < 3 || ny < 3) || voc.n(j) >= 2 && nx < 3 && ny < 3 && !/^\p{Lu}+$/u.test(x + m[1])) { out.push(x + y); i++; continue; }
      }
      out.push(x);
    }
    t = out.join(' ');
  }
  // Palabra a palabra
  const toks = t.split(' ');
  const enMayus = toks.filter(x => x.replace(/[^\p{L}]/gu, '').length >= 3 && esMayusc(x)).length, enMinus = toks.filter(x => /\p{Ll}{2}/u.test(x) && !/^\p{Lu}\p{Ll}+[\p{P}]*$/u.test(x)).length;
  const cabecera = enMayus >= 2 && enMinus === 0;
  const partidaAntes = /-$/.test(anterior.trim());
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    if (i === 0 && partidaAntes) continue;
    const m = /^([^\p{L}\d]*)(.*?)([^\p{L}\d]*)$/u.exec(tok);
    let [, pre, core, suf] = m;
    if (!core || /-$/.test(tok) || /&/.test(core)) continue;
    // Versalitas mal leídas en cabeceras: «NIvEL», «DoN», «LucHA», «MACiOS», «Como PERSONAJE»
    const letras = core.replace(/[^\p{L}]/gu, '');
    if (letras.length >= 2 && /\p{Lu}/u.test(letras.slice(1)) && /\p{Ll}/u.test(letras) || cabecera && /^\p{Lu}\p{Ll}+$/u.test(core) && voc.n(core) >= 3) {
      const nMay = letras.replace(/[^\p{Lu}]/gu, '').length;
      if (nMay >= 2 && nMay >= letras.length - nMay || cabecera) core = core.toUpperCase().replace(/^Ü(?=[RT])/, 'O');
    }
    const enLex = RE_LEXICO.find(([re]) => re.test(core));
    if (enLex) { core = comoOriginal(core, enLex[1]); toks[i] = pre + core + suf; continue; }
    // Cifras pegadas a una palabra conocida: «nivel1», «Con13», «10po», «1kg»
    const pegada = /^(\p{L}{2,})(\d+)$/u.exec(core) || /^(\d+)(\p{L}{2,})$/u.exec(core);
    if (pegada) { if (voc.n(/\d/.test(pegada[1]) ? pegada[2] : pegada[1]) >= 3) core = `${pegada[1]} ${pegada[2]}`; toks[i] = pre + core + suf; continue; }
    if (/\d/.test(core) && !/^[\d\p{L}]*\p{L}{3,}[\d\p{L}]*$/u.test(core)) { toks[i] = pre + core + suf; continue; }
    const k = core.toLowerCase();
    if (CORTAS[k]) { core = comoOriginal(core, CORTAS[k]); if (voc.traza) voc.traza.push(['corta', tok, core]); }
    else if (voc.n(k) < 3 && core.length >= 2) {
      const c = candidatoDe(core, voc);
      const antes = core;
      if (c) core = comoOriginal(core, voc.forma.get(c) ? [...voc.forma.get(c)].sort((a, b) => b[1] - a[1])[0][0] : c);
      else { const p = partir(core, voc); if (p) core = p; }
      if (voc.traza && core !== antes) voc.traza.push([c ? voc.regla : 'partir', antes, core]);
    }
    toks[i] = pre + core + suf;
  }
  t = toks.join(' ');
  return t.replace(/\s+/g, ' ').trim();
}

// Una línea sin ninguna palabra conocida ni cifras es ruido de las ilustraciones («MPAA», «AT AAA AAA.», «E Dn»)
export function esRuido(s, voc) {
  if (/\d/.test(s)) return false;
  const ws = s.match(/\p{L}+/gu) || [];
  if (!ws.length) return s.replace(/[\s•]/g, '').length <= 3;
  if (ws.some(w => w.length >= 4 && w === w.toUpperCase())) return false; // cabeceras de una palabra: «CHEF», «ALCE»
  const creible = w => w.length >= 2 && voc.n(w) >= 5 && !/^(\p{Lu})\1+$/u.test(w)
    || w.length >= 4 && /\p{Ll}/u.test(w) && /[aeiouáéíóú]/i.test(w) && !sospechosa(w.toLowerCase(), voc)
    || w.length >= 6 && !sospechosa(w.toLowerCase(), voc);
  return !ws.some(creible);
}

export function corregirLineas(lineas, voc) {
  const out = [];
  let prev = '';
  for (const l of lineas) {
    const c = corregirLinea(l, voc, prev);
    out.push(esRuido(c, voc) ? '' : c);
    prev = l;
  }
  return out;
}
