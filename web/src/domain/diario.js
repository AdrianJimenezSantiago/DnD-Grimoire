/**
 * Diario de sesión de un personaje. Cada sesión tiene texto libre y notas rápidas
 * (nombre, suceso, pendiente, nota). Como en el cuaderno de Theo: lo tachado queda cumplido
 * y lo subrayado se destaca para recordarlo en la siguiente sesión. Puro.
 */
import { uid } from '../core/util.js';

export const TIPOS = { nombre: 'Nombre', suceso: 'Suceso', pendiente: 'Pendiente', nota: 'Nota' };
export const diarioDe = ch => (ch.diario ||= { sesiones: [] });
const hoy = () => new Date().toISOString().slice(0, 10);

export function nuevaSesion(ch) {
  const d = diarioDe(ch), n = d.sesiones.reduce((m, s) => Math.max(m, s.n || 0), 0) + 1;
  const s = { id: uid('ses'), n, fecha: hoy(), titulo: '', texto: '', notas: [] };
  d.sesiones.unshift(s); return s;
}
export const nuevaNota = (tipo, texto) => ({ id: uid('nt'), tipo: TIPOS[tipo] ? tipo : 'nota', texto: String(texto).trim(), hecho: false, fijada: tipo === 'pendiente' });
/** Lo que conviene tener presente al empezar: subrayado o pendiente sin tachar, de cualquier sesión. */
export function paraRecordar(ch) {
  const out = [];
  for (const s of diarioDe(ch).sesiones) for (const nt of s.notas) if (!nt.hecho && (nt.fijada || nt.tipo === 'pendiente')) out.push({ ...nt, sesion: s });
  return out;
}
export function buscarDiario(ch, q) {
  const t = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); if (!t) return null;
  const n = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return diarioDe(ch).sesiones.filter(s => n(s.titulo + ' ' + s.texto + ' ' + s.notas.map(x => x.texto).join(' ')).includes(t));
}
export const fechaLarga = iso => { try { return new Date(iso + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; } };
