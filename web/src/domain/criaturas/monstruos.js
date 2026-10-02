// Lector de perfiles de criatura de los libros (Manual de Monstruos) y formas posibles de la Forma salvaje.
import { aplanar, esMayus, letras, limpiarRestos, tituloBonito } from '../libros/lector.js';
import { claveNombre } from '../libros/manual.js';
import { norm } from '../../core/util.js';
import { clasesDe } from '../reglas/reglas2024.js';

export const TIPOS_BASE = ['Aberración', 'Autómata', 'Bestia', 'Celestial', 'Cieno', 'Dragón', 'Elemental', 'Feérico', 'Gigante', 'Humanoide', 'Infernal', 'Monstruosidad', 'Muerto viviente', 'Planta'];
const TAMANOS = ['Diminut', 'Pequeñ', 'Median', 'Grande', 'Enorme', 'Gargantues'];
const TAM_TXT = ['Diminuto', 'Pequeño', 'Mediano', 'Grande', 'Enorme', 'Gargantuesco'];
const DANOS = ['ácido', 'contundente', 'cortante', 'frío', 'fuego', 'fuerza', 'necrótico', 'perforante', 'psíquico', 'radiante', 'relámpago', 'trueno', 'veneno'];
const ESTADOS = ['agarrado', 'apresado', 'asustado', 'aturdido', 'cegado', 'derribado', 'ensordecido', 'envenenado', 'hechizado', 'incapacitado', 'inconsciente', 'invisible', 'paralizado', 'petrificado', 'cansancio'];
export const PX_VD = { 0: 10, '1/8': 25, '1/4': 50, '1/2': 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900, 11: 7200, 12: 8400,
  13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000 };
export const vdNumero = vd => (String(vd).includes('/') ? (([a, b]) => a / b)(String(vd).split('/').map(Number)) : Number(vd));
const DADOS_OK = [4, 6, 8, 10, 12, 20];
const media = (n, c, b) => Math.floor(n * (c + 1) / 2) + b;
const digitos = s => String(s).replace(/[lI|]/g, '1').replace(/[Oo]/g, '0').replace(/S/g, '5').replace(/B/g, '8');

export function arreglarDadosCon(raw, med) {
  const s = String(raw).replace(/\s+/g, ' ').trim(), m = /^([\dlIO]{1,4})\s*([dD]?)\s*([\dlIO]{0,3})\s*(?:([+\-−–])\s*([\dlIO]{1,4}))?$/.exec(s);
  if (!m) return raw;
  const signo = m[4] && m[4] !== '+' ? -1 : 1, b = m[5] ? signo * +digitos(m[5]) : 0;
  const fmt = (n, c) => `${n}d${c}${b ? ` ${b > 0 ? '+' : '−'} ${Math.abs(b)}` : ''}`;
  if (m[2]) { const n = +digitos(m[1]), c = +digitos(m[3]); if (DADOS_OK.includes(c) && (med == null || media(n, c, b) === med)) return fmt(n, c); }
  const x = digitos(m[1] + m[3]);
  for (let i = 1; i < x.length; i++) {
    for (const salta of [0, 1]) {
      if (salta && x[i] !== '4') continue;
      const n = +x.slice(0, i), c = +x.slice(i + salta);
      if (n >= 1 && DADOS_OK.includes(c) && med != null && media(n, c, b) === med) return fmt(n, c);
    }
  }
  return raw;
}
export const arreglarDadosTexto = t => String(t).replace(/(\d{1,3})\s*\(([\dlIOdD+\-−–\s]{2,14})\)/g, (m, med, d) => `${med} (${arreglarDadosCon(d, +med)})`);

const ETIQ = { fue: /F[uúU][eEc]/, des: /D[eE][sS5]/, con: /C[oO0][nN]/, int: /(?:I|l|1)[nN][tTr]/, sab: /S[aA][bBmMn8]?/, car: /C[aA][rR]/ };
function gruposFila(s) {
  const t = ' ' + String(s).replace(/[−–—=~]/g, '-').replace(/(^|\s)4([\]}|!lI])(?=\s|$)/g, '$1+1').replace(/([+-])\s*[\]}|!lI]/g, '$11').replace(/([+-])\s*[Oo]/g, '$10') + ' ';
  const toks = t.match(/[+-]\s?\d{1,2}|(?<=[\sA-Za-z])[\dlIO]{1,2}(?=[\s+-]|$)/g) || [], gr = [];
  for (let x of toks) {
    x = x.replace(/\s/g, '');
    if (/^[+-]/.test(x)) { const g = gr[gr.length - 1]; const n = +x; if (!g || (g.mod != null && g.sv != null)) gr.push({ v: null, mod: n, sv: null }); else if (g.mod == null) g.mod = n; else g.sv = n; continue; }
    const n = +digitos(x);
    if (n > 30 && /^4\d$/.test(String(n))) {
      const g = gr[gr.length - 1], v = +String(n)[1];
      if (g && g.v != null && g.mod == null) { g.mod = v; continue; }
      if (g && g.mod != null && g.sv == null) { g.sv = v; continue; }
    }
    gr.push({ v: n, mod: null, sv: null });
  }
  return gr;
}
export function leerCaracteristicas(txt, filas = []) {
  const t = String(txt).replace(/[−–—=]/g, '-'), out = {}, avisos = [];
  const esperado = x => Math.floor((x - 10) / 2);
  const pos = [null, null];
  filas.forEach((f, i) => { const k = /(^|[^A-Za-z])(F[uúU][eE]|D[eE][sS5])/.test(f) ? 0 : /(^|[^A-Za-z])((?:I|l|1)[nN][tTr]|S[aA][bBmM]|C[aA][rR])/.test(f) ? 1 : (filas.length === 2 ? i : -1); if (k >= 0 && !pos[k]) pos[k] = gruposFila(f); });
  const orden = ['fue', 'des', 'con', 'int', 'sab', 'car'];
  for (const [k, re] of Object.entries(ETIQ)) {
    let v = null, mod = null, sv = null;
    const m = new RegExp(`(?:^|[^A-Za-z])${re.source}\\s*([0-9lIOoS]{1,2})\\s*([+-]\\s*[0-9lIOo]{1,2})?\\s*([+-]\\s*[0-9lIOo]{1,2})?`).exec(t);
    const fila = pos?.[Math.floor(orden.indexOf(k) / 3)], g = fila?.length === 3 ? fila[orden.indexOf(k) % 3] : null;
    if (g) ({ v, mod, sv } = g);
    else if (m) { v = +digitos(m[1]); mod = m[2] != null ? +digitos(m[2].replace(/\s/g, '')) : null; sv = m[3] != null ? +digitos(m[3].replace(/\s/g, '')) : null; }
    if (mod != null && (mod < -5 || mod > 10)) mod = null; // un modificador imposible es un resto del OCR («-30»)
    if (v != null && (v < 1 || v > 30)) v = null; // y una puntuación imposible también («Fue 0»)
    if (v == null && mod == null) { avisos.push(`sin ${k}`); continue; }
    if (v == null) { v = 10 + 2 * mod; avisos.push(`${k}: sin puntuación → ${v}`); }
    if (mod != null && esperado(v) !== mod) {
      const alt = [...new Set([v, ...['3', '8', '1', '7', '5', '6', '0', '9'].flatMap(d => [...String(v)].map((_, i) => +(String(v).slice(0, i) + d + String(v).slice(i + 1)))), 10 + 2 * mod, 11 + 2 * mod])]
        .filter(x => x >= 1 && x <= 30 && esperado(x) === mod);
      if (alt.length) { avisos.push(`${k}: ${v} → ${alt[0]}`); v = alt[0]; }
    }
    if (sv == null && mod != null && mod !== esperado(v)) sv = null;
    out[k] = { v, mod: esperado(v), salv: sv != null && Math.abs(sv - esperado(v)) <= 12 ? sv : esperado(v) };
  }
  return { car: out, avisos };
}

const SECCIONES = { atributos: 'rasgos', acciones: 'acciones', 'acciones adicionales': 'adicionales', reacciones: 'reacciones', 'acciones legendarias': 'legendarias' };
const seccion = s => SECCIONES[norm(s).replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()] || null;
const TIPO_RE = new RegExp(`^\\W*(?:[lI1|!]{1,3}\\s+)?(?:(${TIPOS_BASE.join('|')})|(Enjambre))\\b.*\\b(${TAMANOS.join('|')})`, 'i');
const CAMPOS = [['hab', /^Habilidades?\s*[:;]/i], ['vul', /^Vulnerabilidad(?:es)?\s*[:;]/i], ['res', /^Resistencias?\s*[:;]/i], ['inm', /^Inmunidad(?:es)?\s*[:;]/i],
  ['equipo', /^Equipo\s*[:;]/i], ['sentidos', /^Sentidos\s*[:;]/i], ['idiomas', /^Idiomas\s*[:;]/i]];
const limpiaNombre = s => s.replace(/[.·]+$/, '').replace(/^\S{1,2}\s+(?=[A-ZÁÉÍÓÚÑ]{3,})/, '').replace(/^([AEIOU])[ÁÉÍÓÚáéíóú](?=\p{L})/u, '$1').trim();
const limpiaIni = s => s.replace(/^[^\p{L}\d¿(+\-−–]+/u, '').replace(/\s*[|]\s*$/, '').trim();

function repartir(txt) {
  const partes = String(txt || '').split(/[;,]/).map(x => norm(x).trim()).filter(Boolean);
  return { danos: DANOS.filter(d => partes.some(p => p.startsWith(norm(d).slice(0, 5)))), estados: ESTADOS.filter(e => partes.some(p => p.startsWith(norm(e).slice(0, 6)))) };
}

export function leerCriaturas(pages) {
  // «barra»: la línea empieza con el borde del recuadro del perfil (se mira en el texto antes de corregir el OCR)
  const L = aplanar(pages).map(l => ({ ...l, barra: /^\s*[^\p{L}\d¿(+\-−–\s]/u.test(l.raw ?? l.s), s: limpiaIni(l.s) })).filter(l => l.s);
  const inicios = [];
  for (let i = 1; i < L.length - 2; i++) {
    if (!TIPO_RE.test(L[i].s)) continue;
    const ca = L.slice(i + 1, i + 5).findIndex(l => /^(C\s?[Aa]\s*[:;.]|CA\s*\d|Iniciativa\s*[:;]|P\s?G\s*[:;])|\bIniciativa\s*[:;]\s*[+\-−]/.test(l.s));
    if (ca < 0) continue;
    let n = i - 1;
    const valeNombre = s => letras(s).length >= 3 && s.length <= 48 && !/[.:;,]$/.test(s) && !/[:\d]/.test(s) && /^[A-ZÁÉÍÓÚÑ]/.test(s) && !seccion(s) && !TIPO_RE.test(s);
    const nom = j => limpiaNombre(L[j].s);
    if (!valeNombre(nom(n)) || (L[n].ci !== L[i].ci && Math.abs(L[n].x - L[i].x) > 70)) {
      const k = [i - 2, i - 3].find(j => j >= 0 && L[j].p === L[i].p && esMayus(nom(j)) && valeNombre(nom(j)));
      if (k == null) { inicios.push({ nombreIni: i, tipoIni: i, nombre: null }); continue; }
      n = k;
    }
    let nombre = nom(n);
    if (n < i - 1 && esMayus(nom(n + 1)) && valeNombre(nom(n + 1)) && L[n + 1].p === L[n].p) nombre += ' ' + nom(n + 1);
    else if (n > 0 && esMayus(L[n - 1].s) && L[n - 1].p === L[n].p && L[n - 1].ci === L[n].ci && Math.abs(L[n - 1].h - L[n].h) < 3 && L[n - 1].y - L[n].y < L[n].h * 1.9 && !seccion(L[n - 1].s)) { nombre = L[n - 1].s + ' ' + nombre; n--; }
    inicios.push({ nombreIni: n, tipoIni: i, nombre });
  }
  const out = [];
  inicios.forEach((ini, k) => {
    const fin = k + 1 < inicios.length ? inicios[k + 1].nombreIni : L.length;
    const c = leerBloque(L, ini, fin);
    if (c) out.push(c);
  });
  const porClave = new Map();
  for (const c of out) { const v = porClave.get(c.clave); if (!v || c.acciones.length + c.rasgos.length > v.acciones.length + v.rasgos.length) porClave.set(c.clave, c); }
  return [...porClave.values()];
}

const NO_NOMBRE = /^(objetivo|criatura|tirada|salvaci[oó]n|acci[oó]n|ataque|da[nñ]o|turno|estado|jinete|primera|siguiente|misma|mitad|velocidad|carga|presa)$/i;
function nombreDelTexto(txt) {
  const re = /\b(?:El|La|el|la) ([a-záéíóúñ]{3,}(?: (?:gigante|terrible|venenosa|venenoso|negro|negra|pardo|parda|de [a-záéíóúñ]+))?) (?:tiene|realiza|puede|recibe|hace|obtiene|es|no|se|ataca|solo|muerde)\b/g;
  const cuenta = new Map();
  for (const m of txt.matchAll(re)) { const w = m[1]; if (NO_NOMBRE.test(w.split(' ')[0])) continue; cuenta.set(w, (cuenta.get(w) || 0) + 1); }
  const [mejor] = [...cuenta].sort((a, b) => b[1] - a[1]);
  return mejor ? mejor[0].toUpperCase() : null;
}

function leerBloque(L, ini, fin) {
  const revisar = [];
  let i = ini.tipoIni, tipo = L[i].s.replace(/^[lI1|!]{1,3}\s+/, '');
  if (!/,/.test(tipo) && L[i + 1] && !/^(C\s?[Aa]\b|Iniciativa|P\s?G\b)/.test(L[i + 1].s)) { tipo += ' ' + L[i + 1].s; i++; }
  i++;
  const mt = TIPO_RE.exec(tipo), tamIdx = TAMANOS.findIndex(t => new RegExp(t, 'i').test(tipo));
  const tipoBase = mt?.[1] ? TIPOS_BASE.find(t => norm(t) === norm(mt[1])) : (/enjambre/i.test(tipo) ? (TIPOS_BASE.find(t => new RegExp(norm(t).slice(0, 5), 'i').test(norm(tipo.split(/\bde\b/).slice(1).join(' ')))) || 'Bestia') : '');
  if (ini.nombre == null) {
    const d = nombreDelTexto(L.slice(i, fin).map(l => l.s).join(' ')); if (!d) return null;
    ini = { ...ini, nombre: d }; revisar.push('nombre deducido del texto');
  }
  const nombre = tituloBonito(ini.nombre.replace(/(\s+[\p{L}]{1,2})+$/u, (m) => (/^\s+(de|del|la|el|y)$/i.test(m) ? m : '')));
  if (!/[\p{L}]{4,}/u.test(nombre) || /^(\p{L}{1,2}\s)+/u.test(nombre.toLowerCase() + ' ') && !/[\p{L}]{4,}/u.test(nombre.split(/\s+/)[0])) return null;
  const r = { nombre, tipo: tipo.replace(/\s+/g, ' ').trim(), tipoBase, tamano: TAM_TXT[tamIdx] || '', alineamiento: (tipo.split(',').pop() || '').trim(),
    rasgos: [], acciones: [], adicionales: [], reacciones: [], legendarias: [] };
  const cab = [];
  for (; i < fin; i++) { if (seccion(L[i].s)) break; cab.push(L[i].s); }
  const C = cab.join('\n');
  const num = re => { const m = re.exec(C); return m ? +digitos(m[1]) : null; };
  r.ca = num(/(?:^|\n)\W*C\s?(?:A\s*[:;.]?|a\s*[:;.])\s*([0-9lIO]{1,2})\b/);
  if (r.ca == null) r.ca = num(/(?:^|\n)\W*A\s*[:;]\s*(\d{1,2})\s+Iniciativa/);
  const ini2 = /Iniciativa\s*[:;]?\s*([+\-−–]?)\s*([0-9lIO]{1,2})/.exec(C); r.ini = ini2 ? (ini2[1] && ini2[1] !== '+' ? -1 : 1) * +digitos(ini2[2]) : null;
  const pg = /P\s?G\s*[:;.]?\s*([0-9lIO]{1,4})\s*(?:\(([^)\n]*)\)?)?/.exec(C);
  if (pg) { r.pgMedia = +digitos(pg[1]); const d = pg[2] ? arreglarDadosCon(pg[2], r.pgMedia) : ''; r.pg = d ? `${r.pgMedia} (${d})` : String(r.pgMedia); if (d && !/d\d/.test(d)) revisar.push('dados de PG'); }
  const vel = /Velocidad\s*[:;]?\s*([^\n]+)/.exec(C); r.vel = vel ? vel[1].trim() : '';
  const etiquetas = s => Object.values(ETIQ).filter(re => new RegExp(`(^|[^A-Za-z])${re.source}\\s*[\\dlIO]`).test(s)).length;
  const filasCar = cab.filter(s => ((s.match(/[+\-−–=]\s?[\d\]lI]/g) || []).length >= 4 || etiquetas(s) >= 2) && !/^(CA|PG|VD|Iniciativa|Habilidades|Sentidos)\b/i.test(s));
  const { car, avisos } = leerCaracteristicas(filasCar.join(' '), filasCar.slice(0, 2));
  r.car = ['fue', 'des', 'con', 'int', 'sab', 'car'].map(k => car[k]?.v ?? 10);
  r.salv = Object.fromEntries(Object.entries(car).filter(([, v]) => v.salv !== v.mod).map(([k, v]) => [k, v.salv]));
  if (Object.keys(car).length < 6) revisar.push('características incompletas');
  revisar.push(...avisos.filter(a => /→/.test(a)).map(a => 'corregido ' + a));
  for (let j = 0; j < cab.length; j++) {
    const campo = CAMPOS.find(([, re]) => re.test(cab[j])); if (!campo) continue;
    let v = cab[j].replace(campo[1], '').trim();
    while (cab[j + 1] && !CAMPOS.some(([, re]) => re.test(cab[j + 1])) && !/^VD\b/.test(cab[j + 1]) && !/^\W*(F[uú]e|Des|Con|Int|Sab|Car)\s*\d/i.test(cab[j + 1])) { v += ' ' + cab[j + 1]; j++; }
    r[campo[0]] = v.replace(/\s+/g, ' ').replace(/\s*[|]\s*/g, ' ').trim();
  }
  if (/VD\s*[:;.]?\s*ninguno/i.test(C)) return null;
  const vd = /VD\s*[:;.]?\s*([0-9lIO/½]{1,5})\s*(?:\(([\d.\s]{1,9})\s*PX)?/.exec(C);
  if (vd) {
    let v = digitos(vd[1]).replace('½', '1/2'); const px = vd[2] ? +vd[2].replace(/[.\s]/g, '') : null;
    if (PX_VD[v] == null || (px && PX_VD[v] !== px)) { const porPx = Object.keys(PX_VD).find(x => PX_VD[x] === px); if (porPx != null) { revisar.push(`VD ${v} → ${porPx}`); v = porPx; } }
    r.vdNum = vdNumero(v); r.px = PX_VD[v] ?? px; r.bc = num(/BC\s*\+?\s*([0-9lIO])/);
    r.vd = `${v} (${(r.px ?? 0).toLocaleString('es-ES')} PX${r.bc ? `; BC +${r.bc}` : ''})`;
  } else if (/por cada nivel|solo [a-záéíóú]+\)/i.test(C)) return null;
  else revisar.push('sin VD');
  let sec = null, act = null, xRef = null;
  const cierra = () => { if (act && sec) { act[1] = arreglarDadosTexto(limpiarRestos(act[1].replace(/[ \t]+/g, ' ').trim())); if (act[1] || act[0]) r[sec].push(act); } act = null; };
  for (; i < fin; i++) {
    const l = L[i], s = l.s, nueva = seccion(s);
    if (nueva) { cierra(); sec = nueva; xRef = null; continue; }
    if (!sec) continue;
    if (!l.barra && (xRef == null || l.x < xRef - 4)) xRef = l.x;
    if (/^H[áa]bitat\s*:/i.test(s) || (esMayus(s) && letras(s).length >= 4 && l.h > (l.hTip || 10) * 1.25)) break;
    if (esMayus(s) && letras(s).length >= 4 && !/\.\s/.test(s)) continue;
    const s2 = s.replace(/^(?:[a-zA-Z]{1,3}\s){1,3}(?=[A-ZÁÉÍÓÚ][a-záéíóúñ]+(?: [\p{L}]+){0,4}[.,] [A-ZÁÉÍÓÚ])/u, '');
    const m = /^([A-ZÁÉÍÓÚÑ¿][^.:,]{1,70}?(?:\([^)]{1,40}\))?)(?:\.|,(?= [A-ZÁÉÍÓÚ]))\s+(.*)$/.exec(s2);
    const cerrado = !act || /[.:!?)]$/.test(act[1].trim());
    if (m && cerrado && !/^\d/.test(s) && m[1].split(/\s+/).length <= 8 && (xRef == null || l.barra || l.x <= xRef + 8)) { cierra(); act = [m[1].trim(), m[2]]; continue; }
    if (!act) { act = ['', s]; continue; }
    act[1] = /-$/.test(act[1]) && /^[a-záéíóúñ]/.test(s) ? act[1].slice(0, -1) + s : act[1] + (/^\d{1,2}\s*[:.]\s/.test(s) ? '\n' : ' ') + s;
  }
  cierra();
  const inm = repartir(r.inm), res = repartir(r.res), vul = repartir(r.vul);
  r.danos = {}; vul.danos.forEach(d => { r.danos[d] = 'vul'; }); res.danos.forEach(d => { r.danos[d] = 'res'; }); inm.danos.forEach(d => { r.danos[d] = 'inm'; });
  r.estadosInm = inm.estados;
  if (r.ca != null && r.ca < 5) revisar.push('CA dudosa');
  if (r.ca == null) revisar.push('sin CA'); if (r.pgMedia == null) revisar.push('sin PG');
  if (!r.acciones.length && !r.rasgos.length) revisar.push('sin acciones');
  r.clave = claveNombre(r.nombre); r.revisar = revisar;
  return r.ca == null && r.pgMedia == null ? null : r;
}

export function aBestiario(c) {
  const salv = {};
  ['fue', 'des', 'con', 'int', 'sab', 'car'].forEach((k, i) => {
    const mod = Math.floor((c.car[i] - 10) / 2), sv = c.salv?.[k] ?? mod;
    if (sv >= mod + 2 || sv >= 5) salv[k] = 'fuerte'; else if (sv <= -1) salv[k] = 'debil';
  });
  return { tipo: c.tipoBase || '', ca: c.ca != null ? String(c.ca) : '', pg: c.pgMedia != null ? String(c.pgMedia) : '', danos: { ...c.danos }, estados: [...c.estadosInm], salv, perfil: c.clave };
}
export const vdTexto = n => (n === 0.125 ? '1/8' : n === 0.25 ? '1/4' : n === 0.5 ? '1/2' : String(n));

const vuela = c => /\bvolar\b/i.test(c.vel || '');
export function limiteFormaSalvaje(ch) {
  const d = clasesDe(ch).find(c => c.clase === 'Druida') || { nivel: Math.max(1, Math.min(20, parseInt(ch.nivel, 10) || 1)), subclase: ch.subclase };
  const L = d.nivel, luna = /luna/i.test(d.subclase || '') && L >= 3;
  const base = L >= 8 ? 1 : L >= 4 ? 0.5 : 0.25;
  return { vd: luna ? Math.max(base, Math.floor(L / 3)) : base, vuelo: L >= 8, conocidas: L >= 8 ? 8 : L >= 4 ? 6 : 4, luna };
}
export function formasPosibles(criaturas, { vd = 0, vuelo = true, soloBestias = true } = {}) {
  return criaturas.filter(c => (!soloBestias || c.tipoBase === 'Bestia') && c.vdNum != null && c.vdNum <= vd && (vuelo || !vuela(c)))
    .sort((a, b) => a.vdNum - b.vdNum || a.nombre.localeCompare(b.nombre, 'es'));
}
