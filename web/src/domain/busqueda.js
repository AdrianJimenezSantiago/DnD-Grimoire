import { norm } from '../core/util.js';

export function puntuar(q, nombre, texto = '') {
  const n = norm(nombre), t = norm(q);
  if (!t) return 0;
  if (n === t) return 100;
  if (n.startsWith(t)) return 80;
  if (n.split(/[\s(,/-]+/).some(p => p.startsWith(t))) return 65;
  if (n.includes(t)) return 50;
  const palabras = t.split(/\s+/).filter(Boolean);
  if (palabras.length > 1 && palabras.every(p => n.includes(p))) return 45;
  if (texto && norm(texto).includes(t)) return 20;
  return 0;
}
export function buscar(q, fuentes, { porGrupo = 6, total = 40 } = {}) {
  if (norm(q).trim().length < 2) return [];
  const out = [];
  for (const f of fuentes) {
    const hits = [];
    for (const it of f.items) { const p = puntuar(q, it.nombre, it.texto); if (p) hits.push({ ...it, p: p + (f.peso || 0) }); }
    hits.sort((a, b) => b.p - a.p || a.nombre.localeCompare(b.nombre, 'es'));
    if (hits.length) out.push({ clave: f.clave, titulo: f.titulo, ico: f.ico, items: hits.slice(0, porGrupo), mas: Math.max(0, hits.length - porGrupo), mejor: hits[0].p });
  }
  out.sort((a, b) => b.mejor - a.mejor);
  let n = 0;
  return out.filter(g => (n += g.items.length) - g.items.length < total);
}
