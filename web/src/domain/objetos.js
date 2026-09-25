import { aplanar, bloques, esMayus, letras, tituloBonito, sinTildes } from './lector.js';
import { claveNombre } from './manual.js';

export const RAREZAS = ['Común', 'Infrecuente', 'Raro', 'Muy raro', 'Legendario', 'Artefacto', 'Varía'];
export const TIPOS_OBJ = ['Arma', 'Armadura', 'Anillo', 'Bastón', 'Objeto maravilloso', 'Pergamino', 'Poción', 'Vara', 'Varita'];
const TIPO = /^(Objeto maravilloso|Armadura|Arma|Poci[oó]n|Anillo|Vara|Varita|Bast[oó]n|Pergamino|Escudo|Munici[oó]n)\b\s*(\([^)]*\)?)?\s*,?\s*(.*)$/i;
const RAR = [[/muy rar[oa]/i, 'Muy raro'], [/legendari[oa]/i, 'Legendario'], [/artefacto/i, 'Artefacto'], [/infrecuente/i, 'Infrecuente'],
  [/rar[oa]/i, 'Raro'], [/com[uú]n/i, 'Común'], [/rareza (variable|seg[uú]n|var[ií]a)/i, 'Varía']];
const PROPIOS = ['Heward', 'Quaal', 'Nolzur', 'Keoghtom', 'Murlynd', 'Bigby', 'Mordenkainen', 'Tenser', 'Leomund', 'Vecna', 'Kas', 'Orcus', 'Tiamat', 'Bahamut',
  'Daern', 'Kwalish', 'Halaster', 'Waterdeep', 'Aguasprofundas', 'Baba Yaga', 'Wyrmesqueleto', 'Mystra', 'Tymora', 'Moradin', 'Corellon', 'Blackstaff', 'Báculo Negro',
  'Gruumsh', 'Lolth', 'Baphomet', 'Zuggtmoy', 'Demogorgon', 'Tharizdun', 'Iggwilv', 'Rary', 'Otiluke', 'Evard', 'Drawmij', 'Jallarzi', 'Tasha', 'Wyrmesqueleto', 'Acererak'];

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

export function leerCargas(t) {
  const m = /tiene\s+(\d+)\s+cargas/i.exec(t); if (!m) return null;
  const r = /recupera\s+(\d+d\d+(?:\s*\+\s*\d+)?|\d+|todas las|todas sus)\s+cargas\s+(?:gastadas|empleadas|consumidas)?[^.]*?(amanecer|anochecer|descanso largo|mediod[ií]a)/i.exec(t);
  return { max: +m[1], recarga: r ? r[1].replace(/\s+/g, '') : '', cuando: r ? r[2] : '' };
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
    const s = L[i].s; if (!esMayus(s) || s.length > 70 || /\.$/.test(s) || letras(s).length < 4) continue;
    if (Math.abs(L[i].x - L[i].margin) > 10) continue;
    let t = leerTipo(L[i + 1].s), fin = i + 2;
    if (!t && L[i + 2] && TIPO.test(L[i + 1].s)) { t = leerTipo(L[i + 1].s + ' ' + L[i + 2].s); fin = i + 3; }
    let ini = i, nombre = s;
    const junto = (a, b) => !b.colStart && a.p === b.p && a.ci === b.ci && a.y - b.y < Math.max(a.h, b.h) * 1.9 && (Math.abs(a.h - b.h) < 7 || /^\(/.test(b.s));
    if (!t && L[i + 2] && esMayus(L[i + 1].s) && L[i + 1].s.length < 50 && junto(L[i], L[i + 1]) && Math.abs(L[i + 1].x - L[i].x) < 10) {
      t = leerTipo(L[i + 2].s); fin = i + 3; nombre = s + ' ' + L[i + 1].s;
      if (!t && L[i + 3]) { t = leerTipo(L[i + 2].s + ' ' + L[i + 3].s); fin = i + 4; }
    }
    if (!t) continue;
    if (L[fin] && ((/\([^)]*$/.test(t.linea) && L[fin].s.length < 50) || (/^(o|y) (muy )?(rar|legend|infrec|com)/.test(L[fin].s) && L[fin].s.length < 60))) { const t2 = leerTipo(t.linea + ' ' + L[fin].s); if (t2) { t = t2; fin++; } }
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
    const nombre = tituloBonito(c.nombre.replace(/\+l\b/g, '+1').replace(/(\+\d)\s+0\s+(\+\d)/g, '$1 o $2'), PROPIOS).replace(/\s*\+\s*(\d)/g, ' +$1');
    const txt = bs.join('\n\n');
    out.push({ clave: claveNombre(nombre), nombre, ...c.t, texto: txt, cargas: leerCargas(txt) });
  });
  const porClave = new Map();
  for (const o of out) { const v = porClave.get(o.clave); if (!v || o.texto.length > v.texto.length) porClave.set(o.clave, o); }
  return [...porClave.values()].filter(o => o.texto.length >= 20);
}

export const ordenRareza = r => { const i = RAREZAS.indexOf(r); return i < 0 ? 99 : i; };
