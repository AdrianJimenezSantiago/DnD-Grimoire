// Diario de campaña en Markdown para compartirlo con el grupo: lo pendiente, cada sesión con sus notas y el bestiario.
import { TIPOS, diarioDe, paraRecordar, fechaLarga } from './diario.js';
import { bestiarioDe, ESTADO_CRIATURA, REL_DANO, SALVACIONES } from '../criaturas/bestiario.js';

const linea = t => String(t ?? '').replace(/\r/g, '').trim();
const PLURAL = { nombre: 'Nombres', suceso: 'Sucesos', pendiente: 'Pendientes', nota: 'Notas' };

export function diarioMarkdown(ch, { bestiario = true } = {}) {
  const out = [`# Diario de campaña de ${linea(ch.nombre) || 'mi personaje'}`];
  if (linea(ch.campana)) out.push('', `*${linea(ch.campana)}*`);
  const pend = paraRecordar(ch);
  if (pend.length) out.push('', '## Para recordar', '', ...pend.map(p => `- ${linea(p.texto)} *(sesión ${p.sesion.n})*`));
  const sesiones = [...diarioDe(ch).sesiones].sort((a, b) => a.n - b.n);
  for (const s of sesiones) {
    out.push('', `## Sesión ${s.n}${linea(s.titulo) ? `: ${linea(s.titulo)}` : ''}`, '', `*${fechaLarga(s.fecha)}*`);
    if (linea(s.texto)) out.push('', linea(s.texto));
    for (const tipo of Object.keys(TIPOS)) {
      const notas = s.notas.filter(n => n.tipo === tipo && linea(n.texto));
      if (notas.length) out.push('', `**${PLURAL[tipo]}**`, '', ...notas.map(n => `- ${tipo === 'pendiente' ? (n.hecho ? '[x] ' : '[ ] ') : ''}${linea(n.texto)}`));
    }
  }
  const criaturas = bestiario ? bestiarioDe(ch).criaturas.filter(c => linea(c.nombre)) : [];
  if (criaturas.length) {
    out.push('', '## Bestiario');
    for (const c of criaturas) {
      const datos = [c.tipo, c.amenaza && `amenaza ${c.amenaza.toLowerCase()}`, ESTADO_CRIATURA[c.estado], c.ca && `CA ${c.ca}`, c.pg && `PG ${c.pg}`].map(linea).filter(Boolean);
      out.push('', `### ${linea(c.nombre)}`, ...(datos.length ? ['', datos.join(' · ')] : []));
      const danos = Object.entries(REL_DANO).map(([k, t]) => [t, Object.entries(c.danos || {}).filter(([, v]) => v === k).map(([d]) => d)]).filter(([, l]) => l.length);
      for (const [t, l] of danos) out.push(`- ${t} a: ${l.join(', ')}`);
      if (c.estados?.length) out.push(`- Inmune a: ${c.estados.join(', ')}`);
      const salv = SALVACIONES.filter(([k]) => c.salv?.[k]).map(([k, n]) => `${n} ${c.salv[k] === 'debil' ? 'débil' : 'fuerte'}`);
      if (salv.length) out.push(`- Salvaciones: ${salv.join(', ')}`);
      if (linea(c.tacticas)) out.push('', linea(c.tacticas));
      if (linea(c.notas)) out.push('', linea(c.notas));
    }
  }
  return out.join('\n') + '\n';
}
