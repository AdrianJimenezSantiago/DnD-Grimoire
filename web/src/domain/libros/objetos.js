// Lector de objetos mágicos de la Guía del Dungeon Master: tipo, rareza, sintonía, cargas y usos.
import { aplanar, bloques, esMayus, letras, tituloBonito, sinTildes } from './lector.js';
import { claveNombre } from './manual.js';

export const RAREZAS = ['Común', 'Infrecuente', 'Raro', 'Muy raro', 'Legendario', 'Artefacto', 'Varía'];
export const TIPOS_OBJ = ['Arma', 'Armadura', 'Anillo', 'Bastón', 'Objeto maravilloso', 'Pergamino', 'Poción', 'Vara', 'Varita'];
const TIPO = /^(Objeto maravilloso|Armadura|Arma|Poci[oó]n|Anillo|Vara|Varita|Bast[oó]n|Pergamino|Escudo|Munici[oó]n)\b\s*(\([^)]*\)?)?\s*,?\s*(.*)$/i;
const RAR = [[/muy rar[oa]/i, 'Muy raro'], [/legendari[oa]/i, 'Legendario'], [/artefacto/i, 'Artefacto'], [/infrecuente/i, 'Infrecuente'],
  [/rar[oa]/i, 'Raro'], [/com[uú]n/i, 'Común'], [/rareza (variable|seg[uú]n|var[ií]a)/i, 'Varía']];
const PROPIOS = ['Heward', 'Quaal', 'Nolzur', 'Keoghtom', 'Murlynd', 'Bigby', 'Mordenkainen', 'Tenser', 'Leomund', 'Vecna', 'Kas', 'Orcus', 'Tiamat', 'Bahamut',
  'Daern', 'Kwalish', 'Halaster', 'Waterdeep', 'Aguasprofundas', 'Baba Yaga', 'Wyrmesqueleto', 'Mystra', 'Tymora', 'Moradin', 'Corellon', 'Blackstaff', 'Báculo Negro',
  'Gruumsh', 'Lolth', 'Baphomet', 'Zuggtmoy', 'Demogorgon', 'Tharizdun', 'Iggwilv', 'Rary', 'Otiluke', 'Evard', 'Drawmij', 'Jallarzi', 'Tasha', 'Wyrmesqueleto', 'Acererak',
  'Ehlonna', 'Valhalla', 'Ysgard', 'Anstruth', 'Ollamh', 'Fochlucan', 'Mac-Fuirmidh', 'Doss', 'Cli', 'Canaith', 'Bilarro'];
// Erratas del texto escaneado en los nombres de la Guía (versalitas leídas como minúsculas, «I» como «l»…)
const ERRATAS = [[/^Escupo\b/, 'Escudo'], [/\b[lJ]oun\b/g, 'ioun'], [/lanzac onjuro/, 'lanzaconjuro'], [/Iggwwilv|iggwwilv/, 'Iggwilv'], [/^Úril\b/, 'Útil'], [/^Unguento\b/, 'Ungüento'],
  [/rayos x$/, 'rayos X'], [/^Pociones de curación$/, 'Poción de curación'], [/^Piedra de la buena fortuna \(piedra de la suerte\)$/, 'Piedra de la buena fortuna']];
export const corregirNombre = n => ERRATAS.reduce((s, [re, t]) => s.replace(re, t), n);

export function leerTipo(s) {
  const m = TIPO.exec(s.replace(/\s+/g, ' ').trim()); if (!m) return null;
  if (m[1] === m[1].toUpperCase()) return null;
  const resto = m[3] || '';
  const r2 = resto.replace(/\(requiere[^)]*\)?/i, '').replace(/muy rar[oa]s?/gi, ' §MR§ ');
  const rarezas = RAR.filter(([re], k) => (k === 0 ? /§MR§/.test(r2) : re.test(r2))).map(([, r]) => r);
  if (!rarezas.length) return null;
  let tipo = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  tipo = { Pocion: 'Poción', Baston: 'Bastón', Municion: 'Arma', Munición: 'Arma', Escudo: 'Armadura' }[tipo] || tipo;
  const sin = /requiere sintonizaci[oó]n(?:\s+(?:por|con|de)\s+([^)]*))?/i.exec(resto);
  const orden = r => RAREZAS.indexOf(r);
  const rs = [...new Set(rarezas)].sort((a, b) => orden(a) - orden(b));
  return { tipo, subtipo: (m[2] || '').replace(/^\(|\)$/g, '').trim(), rareza: /rareza (variable|seg[uú]n)/i.test(resto) || rs.length > 1 ? 'Varía' : rs[0],
    rarezas: rs.filter(r => r !== 'Varía'), sintonia: !!sin, sintoniaCon: (sin?.[1] || '').replace(/\)+$/, '').trim(), linea: s.trim() };
}

// Cargas: «tiene 7 cargas», «tienen 4 cargas», «1 de sus 3 cargas», «comienza con 10 cargas», «tiene 1d3 cargas» (se tira al conseguirlo),
// y también las cuentas de un collar («cuelgan 1d6 + 3 cuentas»). Solo se mira el texto común, no el de cada variante («Cabra de viaje… Tiene 24 cargas»).
const DADO_MAX = '(\\d+d\\d+(?:\\s*\\+\\s*\\d+)?|\\d+)';
export function leerCargas(t) {
  t = String(t || '').split(/\n\n(?=[A-ZÁÉÍÓÚÑ][^.()\n]{2,45} \((?:comunes?|infrecuentes?|rar[oa]s?|muy rar[oa]s?|legendari[oa]s?)\)\.)/)[0];
  const m = new RegExp(`(?:tienen?|comienza con|de sus)\\s+${DADO_MAX}\\s+cargas?\\b`, 'i').exec(t) || new RegExp(`(?:cuelgan|tiene)\\s+${DADO_MAX}\\s+cuentas\\b`, 'i').exec(t);
  if (!m) return null;
  const max = m[1].replace(/\s+/g, ''), cuentas = /cuentas/i.test(m[0]);
  const r = /recupera(?:n)?\s+(\d+d\d+(?:\s*\+\s*\d+)?|\d+|todas las|todas sus|la)\s+cargas?\s+(?:gastadas?|empleadas?|consumidas?)?[^.]*?(amanecer|anochecer|descanso largo|mediod[ií]a)/i.exec(t);
  const out = { max: /d/.test(max) ? 0 : +max, recarga: r ? (r[1] === 'la' ? 'todas' : r[1].replace(/\s+/g, '')) : '', cuando: r ? r[2] : '' };
  if (/d/.test(max)) out.dado = max;
  if (cuentas) out.cuentas = true;
  // Collar de plegarias: cada cuenta se recupera al amanecer
  if (cuentas && !r && /cuenta no puede volver a usarse hasta el siguiente amanecer/i.test(t)) { out.recarga = 'todas'; out.cuando = 'amanecer'; }
  // Qué pasa al gastar la última carga
  const fr = t.split(/(?<=\.)\s+/), i = fr.findIndex(f => /última carga/i.test(f)), ult = i >= 0 ? fr.slice(i, i + 3).join(' ') : '';
  if (/tira 1d20|tira 120/i.test(ult)) out.ultima = 'Al gastar la última carga, tira 1d20: con un 1, el objeto se destruye.';
  else if (/destru|polvo|disemin|disolver/i.test(ult)) out.ultima = 'Al gastar la última carga, el objeto se destruye.';
  else if (/no mágico/i.test(ult)) out.ultima = 'Al gastar la última carga, el objeto deja de ser mágico.';
  return out;
}

// Usos diarios de las propiedades que no gastan cargas: «Una vez utilizada, esta propiedad no puede volver a usarse hasta el siguiente amanecer»
const NO_TITULO = /^(Este|Esta|Estos|Estas|Si|Cuando|Mientras|Una|Un|El|La|Los|Las|Puedes|Existen|Como|Cada|Tu|Tus|Al|En|Por|Con|Aparte|Además)\b/;
const VUELVE = /(?:no (?:puede|podrá|podrán|podrás)|no se puede)[^.]{0,60}?(?:volver a (?:usar|utilizar|emplear)|de nuevo)[^.]{0,80}?hasta (?:el siguiente (amanecer)|que (?:finalices|termines) un descanso (corto o largo|largo))/i;
export function leerUsos(t, nombre = '') {
  const out = [];
  for (const par of String(t || '').split(/\n\n/)) {
    for (const fr of par.split(/(?<=\.)\s+/)) {
      const m = VUELVE.exec(fr); if (!m) continue;
      // Los conjuros que se lanzan desde el objeto una vez al día cada uno, las cuentas del collar o los tres objetos de la bolsa no son un único uso
      if (/lanzar(?:lo)? desde|lanzar ese conjuro|lanzar sugestión|una de ellas|esa cuenta|tres objetos|conjuro desde/i.test(fr)) continue;
      const h = /^([A-ZÁÉÍÓÚÑ][^.]{2,45})\.\s/.exec(par)?.[1]?.replace(/\s*\([^)]*\)/g, '').trim() || '';
      const titulo = h && h.split(/\s+/).length <= 5 && !NO_TITULO.test(h) ? h : '';
      const recarga = m[2] === 'corto o largo' ? 'corto' : 'largo';
      if (!out.some(u => u.titulo === titulo)) out.push({ titulo, recarga });
    }
  }
  return out.map(u => ({ nombre: u.titulo ? `${nombre}: ${u.titulo}` : nombre, recarga: u.recarga }));
}

export function parseObjetos(pages) {
  const L = aplanar(pages);
  const cab = [];
  for (let i = 0; i < L.length; i++) {
    L[i] = { ...L[i], s: L[i].s.replace(/\+[lI]\b/g, '+1').replace(/(\+\d,?)\s+[0O]\s+(\+\d)/g, '$1 O $2') };
    const m = /^([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ +\d,()'-]{3,}?)\s+((?:Objeto maravilloso|Armadura|Arma|Poci[oó]n|Anillo|Vara|Varita|Bast[oó]n|Pergamino)\b.*)$/.exec(L[i].s);
    if (m && esMayus(m[1]) && leerTipo(m[2])) L.splice(i, 1, { ...L[i], s: m[1].trim() }, { ...L[i], s: m[2], colStart: false });
  }
  for (let i = 0; i < L.length - 1; i++) {
    const s = L[i].s;
    // Las versalitas a veces se leen como minúsculas («EscuDO ANIMADO», «Escupo +l»): vale si la letra es más grande que la del texto
    const cabecera = esMayus(s) || (L[i].h >= (L[i].hTip || 16) * 1.15 && /^[A-ZÁÉÍÓÚÑ]/.test(s) && letras(s).replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length >= 2);
    if (!cabecera || s.length > 70 || /\.$/.test(s) || letras(s).length < 4) continue;
    // El título puede quedar a la izquierda del margen más común de la columna (cuando esta lleva una tabla o una ilustración), nunca muy a su derecha
    if (L[i].x - L[i].margin > 10) continue;
    let t = leerTipo(L[i + 1].s), fin = i + 2;
    if (!t && L[i + 2] && TIPO.test(L[i + 1].s)) { t = leerTipo(L[i + 1].s + ' ' + L[i + 2].s); fin = i + 3; }
    // Entre el título y el tipo se cuela a veces el pie de una ilustración, lejos del margen («GORRO DE RESPIRAR BAJO EL AGUA», «GLoBo», «Objeto maravilloso…»)
    if (!t && L[i + 2] && !L[i + 1].colStart && L[i + 1].p === L[i].p && L[i + 1].ci === L[i].ci && Math.abs(L[i + 1].x - L[i].x) > 40 && L[i + 1].s.length < 30) { t = leerTipo(L[i + 2].s); fin = i + 3; }
    if (!t && !esMayus(s)) continue;
    let ini = i, nombre = s;
    const junto = (a, b) => !b.colStart && a.p === b.p && a.ci === b.ci && a.y - b.y < Math.max(a.h, b.h) * 1.9 && (Math.abs(a.h - b.h) < 7 || /^\(/.test(b.s));
    if (!t && L[i + 2] && esMayus(L[i + 1].s) && L[i + 1].s.length < 50 && junto(L[i], L[i + 1]) && Math.abs(L[i + 1].x - L[i].x) < 10) {
      t = leerTipo(L[i + 2].s); fin = i + 3; nombre = s + ' ' + L[i + 1].s;
      if (!t && L[i + 3]) { t = leerTipo(L[i + 2].s + ' ' + L[i + 3].s); fin = i + 4; }
    }
    if (!t) continue;
    if (L[fin] && ((/\([^)]*$/.test(t.linea) && L[fin].s.length < 50) || (/^(o|y) (muy )?(rar|legend|infrec|com)/.test(L[fin].s) && L[fin].s.length < 60))) { const t2 = leerTipo(t.linea + ' ' + L[fin].s); if (t2) { t = t2; fin++; } }
    // «(requiere sintonización por parte de un brujo)» en la línea siguiente al tipo
    if (L[fin] && !t.sintonia && /^\(requiere sintonizaci[oó]n/i.test(L[fin].s)) {
      let req = L[fin].s, k = fin + 1;
      while (!/\)/.test(req) && L[k] && k < fin + 3) req += ' ' + L[k++].s;
      const cierra = req.indexOf(')'), t2 = leerTipo(t.linea + ' ' + (cierra >= 0 ? req.slice(0, cierra + 1) : req));
      if (t2?.sintonia) { t = t2; const resto = cierra >= 0 ? req.slice(cierra + 1).trim() : ''; if (resto) { L[k - 1] = { ...L[k - 1], s: resto }; fin = k - 1; } else fin = k; }
    }
    t = { ...t, linea: t.linea.replace(/\s+[A-ZÁÉÍÓÚÑ]{4,}$/, '') };
    cab.push({ ini, fin, nombre, t });
    i = fin - 1;
  }
  const nombres = new Set(cab.map(c => sinTildes(c.nombre).toUpperCase()));
  const out = [];
  cab.forEach((c, n) => {
    const hasta = n + 1 < cab.length ? cab[n + 1].ini : L.length;
    const bs = bloques(L, c.fin, hasta, {
      propios: PROPIOS,
      subtitulo: (l, s) => (l.h >= (l.hTip || 16) * 1.12 && !nombres.has(sinTildes(s).toUpperCase()) && letras(s).length >= 4 && s.length < 50 ? tituloBonito(s, PROPIOS) : null),
    });
    const nombre = corregirNombre(tituloBonito(c.nombre.replace(/\+l\b/g, '+1').replace(/(\+\d)\s+0\s+(\+\d)/g, '$1 o $2'), PROPIOS).replace(/\s*\+\s*(\d)/g, ' +$1'));
    const txt = bs.join('\n\n').replace(/\bpiedras? [lJ]oun\b/gi, m => m.replace(/[lJ]oun/, 'ioun'));
    const usos = leerUsos(txt, nombre);
    out.push({ clave: claveNombre(nombre), nombre, ...c.t, texto: txt, cargas: leerCargas(txt), ...(usos.length ? { usos } : {}) });
  });
  const porClave = new Map();
  for (const o of out) { const v = porClave.get(o.clave); if (!v || o.texto.length > v.texto.length) porClave.set(o.clave, o); }
  return [...porClave.values()].filter(o => o.texto.length >= 20);
}

export const ordenRareza = r => { const i = RAREZAS.indexOf(r); return i < 0 ? 99 : i; };
