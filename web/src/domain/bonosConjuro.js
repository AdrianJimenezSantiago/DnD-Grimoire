import { norm } from '../core/util.js';
import { statsEfectivos } from './objetosEfecto.js';
import { clasesDe, modOf, competencia, nivelTotal } from './reglas2024.js';
import { trucoPotente } from './variantes.js';
import { opcionDe } from './opcionesRasgo.js';
import { linajeDe } from './especies.js';

// Lo que tus rasgos suman a las tiradas de daño y curación de un conjuro (Manual del Jugador de 2024).
// dados: las líneas de dados del conjuro (tipo 'curación' o de daño). Devuelve, por línea, { bono, notas }.
//   Lanzamiento potente (clérigo/druida 7): Sabiduría al daño de sus trucos
//   Discípulo de la vida (vida 3): +2 + nivel del espacio a la curación de un conjuro con espacio
//   Alma radiante (celestial 6): Carisma a una tirada de daño radiante o de fuego
//   Afinidad elemental (dracónica 6): Carisma a una tirada de daño del tipo elegido
//   Evocación potenciada (evocador 10): Inteligencia a una tirada de daño de un conjuro de evocación
// Truco potente (evocador 3): quien supera la salvación contra tu truco de daño sufre la mitad
export const trucoPotenteEvocador = ch => clasesDe(ch).some(c => c.clase === 'Mago' && /evoca/.test(norm(c.subclase || '')) && c.nivel >= 3);
export function bonosDeConjuro(ch, s, fuente, dados, nivelEspacio = null) {
  const out = dados.map(() => ({ bono: 0, notas: [] })), mod = k => modOf(statsEfectivos(ch)[k]);
  const sub = (clase, re, L) => clasesDe(ch).some(c => c.clase === clase && re.test(norm(c.subclase || '')) && c.nivel >= L);
  const dano = i => dados[i].tipo !== 'curación';
  const una = (pred, bono, nota) => { const i = dados.findIndex((d, k) => dano(k) && !d.mod && pred(d)); if (i >= 0 && bono) { out[i].bono += bono; out[i].notas.push(`${nota} ${bono > 0 ? '+' : ''}${bono}`); } };
  if (s.level === 0) {
    const pot = trucoPotente(ch, fuente);
    if (pot?.bono) dados.forEach((d, i) => { if (dano(i) && !d.mod) { out[i].bono += pot.bono; out[i].notas.push(`${pot.fuente} ${pot.bono > 0 ? '+' : ''}${pot.bono}`); } });
  }
  if (s.level > 0 && sub('Clérigo', /vida/, 3)) {
    const n = 2 + (nivelEspacio || s.level);
    dados.forEach((d, i) => { if (dano(i) || d.temp) return; out[i].bono += n; out[i].notas.push(`Discípulo de la vida +${n}`);
      // Sanación suprema (vida 17): los dados de curación dan su máximo
      if (sub('Clérigo', /vida/, 17)) { out[i].maximo = true; out[i].notas.push('Sanación suprema: dados al máximo'); }
      // Sanador bendito (vida 6): si curas a otro, tú recuperas 2 + nivel del espacio
      if (sub('Clérigo', /vida/, 6)) out[i].sanador = n; });
  }
  const tipo = t => norm(t || '');
  if (sub('Brujo', /celestial/, 6)) una(d => ['radiante', 'fuego'].includes(tipo(d.tipo)), Math.max(1, mod('car')), 'Alma radiante');
  const af = sub('Hechicero', /dracon/, 6) && opcionDe(ch, 'draconica.afinidad');
  if (af) una(d => tipo(d.tipo) === norm(af.tipo), mod('car'), 'Afinidad elemental');
  if (sub('Mago', /evoca/, 10) && /^evoca/.test(norm(s.escuela || ''))) una(() => true, mod('int'), 'Evocación potenciada');
  // Revelación celestial (aasimar 3): una vez por turno, +competencia de daño radiante o necrótico a un conjuro
  const rev = (ch.vida?.efectos || []).some(e => e.k === 'revelacion') && dados.findIndex((d, k) => dano(k));
  if (rev !== false && rev >= 0) out[rev].notas.push(`Revelación celestial: +${competencia(nivelTotal(ch))} de daño ${linajeDe(ch, 'especie.aasimar')?.tipo || 'radiante o necrótico'} a un objetivo, una vez por turno`);
  return out;
}
