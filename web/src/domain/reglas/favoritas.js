// Tiradas favoritas de cada personaje («Bola de fuego 8d6»): guardarlas, quitarlas y leerlas con desconfianza.
import { parsear, texto } from './dados.js';

export const MAX_FAVORITAS = 12;
const nombreLimpio = x => String(x ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);

export function normFavorita(f) {
  if (!f || typeof f !== 'object') return null;
  const p = parsear(String(f.expr ?? '').slice(0, 60)); if (!p || !p.grupos.length) return null;
  const expr = texto(p).replace(/−/g, '-');
  return { nombre: nombreLimpio(f.nombre) || expr, expr };
}
export const normFavoritas = l => (Array.isArray(l) ? l : []).map(normFavorita).filter(Boolean)
  .filter((f, i, a) => a.findIndex(x => x.expr === f.expr && x.nombre === f.nombre) === i).slice(0, MAX_FAVORITAS);

export function anadirFavorita(ch, datos) {
  const f = normFavorita(datos); if (!f) return null;
  const L = normFavoritas(ch.tiradasFav).filter(x => x.nombre.toLowerCase() !== f.nombre.toLowerCase());
  if (L.length >= MAX_FAVORITAS) return null;
  ch.tiradasFav = [...L, f];
  return f;
}
export function quitarFavorita(ch, i) {
  const L = normFavoritas(ch.tiradasFav), [f] = L.splice(i, 1);
  ch.tiradasFav = L;
  return f || null;
}
