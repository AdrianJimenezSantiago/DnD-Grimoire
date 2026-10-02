// Historia del personaje: capítulos y conversión de texto plano o PDF a Markdown.
const sinTildes = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const slug = s => sinTildes(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'capitulo';

export function capitulos(md) {
  const out = [], vistos = new Map();
  for (const l of String(md || '').split('\n')) {
    const m = /^(#{1,3})\s+(.+?)\s*$/.exec(l); if (!m) continue;
    let id = slug(m[2]); const n = vistos.get(id) || 0; vistos.set(id, n + 1); if (n) id += '-' + (n + 1);
    out.push({ id, nivel: m[1].length, titulo: m[2].replace(/[*_]/g, '') });
  }
  return out;
}

const FIN = /[.!?»”…:)]$/;
const esMayus = s => { const l = s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, ''); return l.length >= 3 && l === l.toUpperCase(); };
const titular = s => { const t = s.toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };

export function textoAMarkdown(texto) {
  const lineas = String(texto).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, ''));
  const ancho = Math.max(40, ...lineas.map(l => l.length).sort((a, b) => b - a).slice(0, Math.max(1, lineas.length >> 3)));
  const out = []; let par = '', siguienteEsSub = false;
  const cerrar = () => { if (par) { out.push(par.trim()); par = ''; } };
  for (const raw of lineas) {
    const l = raw.trim();
    if (!l) { cerrar(); continue; }
    if (/^[✦✧☾★·\s*]+$/.test(l)) { cerrar(); if (!/✧/.test(l) && out.length && out[out.length - 1] !== '---') out.push('---'); siguienteEsSub = /✧/.test(l); continue; }
    if (esMayus(l) && l.length < 60 && !FIN.test(l.replace(/[.]$/, 'x'))) {
      cerrar(); const limpio = l.replace(/^[✦✧☾\s]+/, '');
      out.push(`${siguienteEsSub || /^AP[ÉE]NDICE/i.test(limpio) ? '##' : '###'} ${titular(limpio)}`); siguienteEsSub = false;
      continue;
    }
    if (out.length && /^##\s/.test(out[out.length - 1]) && !par && l.length < 70 && FIN.test(l)) { out.push(`*${l}*`); continue; }
    if (par && /:$/.test(par) && /^[«"“]/.test(l)) cerrar();
    par = par ? (par.endsWith('-') ? par.slice(0, -1) + l : par + ' ' + l) : l;
    if (/^[«“]/.test(par) && /[»”][.,]?$/.test(l)) { cerrar(); continue; }
    if (FIN.test(l) && l.length < ancho * 0.85) cerrar();
  }
  cerrar();
  while (out[0] === '---') out.shift();
  return out.join('\n\n').replace(/\n\n---\n\n(##)/g, '\n\n$1');
}

export function pdfAMarkdown(paginas) {
  const clave = s => s.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const lineasDe = pg => {
    const it = pg.items.filter(i => i.s.trim()).sort((a, b) => b.y - a.y || a.x - b.x), L = [];
    for (const i of it) { const u = L[L.length - 1]; if (u && Math.abs(u.y - i.y) < Math.max(2, i.h * 0.45)) { u.s += (i.x > u.fin + 1 ? ' ' : '') + i.s; u.fin = i.x + (i.w || 0); u.h = Math.max(u.h, i.h); } else L.push({ s: i.s, x: i.x, y: i.y, h: i.h, fin: i.x + (i.w || 0) }); }
    return L.map(l => ({ ...l, s: l.s.replace(/\s+/g, ' ').trim() }));
  };
  const pags = paginas.map(lineasDe);
  const borde = L => { if (!L.length) return new Set(); const ys = L.map(l => l.y), top = Math.max(...ys), bot = Math.min(...ys), m = (top - bot) * 0.07 + 1;
    return new Set(L.filter(l => l.y >= top - m || l.y <= bot + m)); };
  const bordes = pags.map(borde), rep = new Map();
  bordes.forEach(B => new Set([...B].map(l => clave(l.s))).forEach(k => rep.set(k, (rep.get(k) || 0) + 1)));
  const repetida = (l, i) => bordes[i].has(l) && (rep.get(clave(l.s)) || 0) >= Math.max(3, Math.ceil(pags.length * 0.4)) && l.s.length < 90;
  const alturas = pags.flat().map(l => Math.round(l.h)).sort((a, b) => a - b), cuerpo = alturas[alturas.length >> 1] || 12;
  let texto = '';
  pags.forEach((L, pi) => {
    const U = L.filter(l => !repetida(l, pi) && !/^\d{1,3}$/.test(l.s));
    U.forEach((l, i) => {
      const prev = U[i - 1], salto = prev ? prev.y - l.y : 0;
      if (l.h >= cuerpo * 1.35 && l.s.length < 70) { texto += `\n\n${l.h >= cuerpo * 1.8 ? '##' : '###'} ${esMayus(l.s) ? titular(l.s) : l.s}\n\n`; return; }
      if (prev && salto > Math.max(prev.h, l.h) * 1.75) texto += '\n\n';
      texto += (texto && !texto.endsWith('\n') ? '\n' : '') + l.s;
    });
    texto += '\n';
  });
  return textoAMarkdown(texto).replace(/\n{3,}/g, '\n\n');
}
