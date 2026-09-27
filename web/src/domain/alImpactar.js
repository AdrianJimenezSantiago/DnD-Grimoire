import { norm } from '../core/util.js';
import { clasesDe, perfil } from './reglas2024.js';
import { reglas, usosGastados } from './rasgos.js';
import { maniobrasDe, dadoSupremacia, cdManiobras } from './maniobras.js';
import { golpeExtra } from './variantes.js';
import { combateDe } from './combate.js';

// Lo que se puede añadir al daño de un ataque con arma que impacta, según las reglas de 2024:
// maniobras del Maestro del combate (gastan un dado de supremacía), Castigo divino del paladín (gasta un espacio o el uso
// gratis de Castigo de paladín), Golpe divino/primigenio y Ataque furtivo (una vez por turno).
// grupo: solo se elige una opción de cada grupo (una maniobra por ataque, un castigo).
const MANIOBRA_DANO = ['Ataque amenazador', 'Ataque con finta', 'Ataque de maniobra', 'Ataque en estocada', 'Ataque para derribar', 'Ataque para desarmar',
  'Ataque para empujar', 'Ataque provocador', 'Golpe de distracción'];
const SALVA = { 'Ataque amenazador': 'Sabiduría: asustado', 'Ataque para derribar': 'Fuerza: derribado', 'Ataque para desarmar': 'Fuerza: suelta un objeto',
  'Ataque para empujar': 'Fuerza: empujado 4,5 m', 'Ataque provocador': 'Sabiduría: desventaja contra otros' };
const libres = (ch, id) => { const r = reglas(ch).find(x => x.id === id); return r ? r.max - usosGastados(ch, r) : 0; };

export function opcionesAlImpactar(ch, o) {
  const props = (o?.arma?.props || []).map(norm), distancia = props.some(p => p.startsWith('municion')), cuerpo = !distancia;
  const c = combateDe(ch), hechas = c.activo ? c.unaVez || [] : [], out = [];
  // Maestro del combate
  const man = maniobrasDe(ch).filter(m => MANIOBRA_DANO.includes(m.nombre) && !(m.nombre === 'Ataque en estocada' && !cuerpo));
  const dados = libres(ch, 'tpl:maestro.supremacia');
  if (man.length && dados > 0) {
    const g = clasesDe(ch).find(x => x.clase === 'Guerrero'), d = dadoSupremacia(g.nivel), cd = cdManiobras(ch);
    for (const m of man) out.push({ k: `man:${m.nombre}`, grupo: 'maniobra', titulo: 'Maniobra', nombre: m.nombre, dado: `1${d}`, gasta: { rec: 'tpl:maestro.supremacia' },
      nota: `${SALVA[m.nombre] ? `Salvación de ${SALVA[m.nombre]} (CD ${cd}). ` : ''}Te quedan ${dados} ${dados === 1 ? 'dado' : 'dados'}.` });
  }
  // Paladín: Castigo divino con un ataque cuerpo a cuerpo (arma o golpe sin armas)
  const pal = clasesDe(ch).find(x => x.clase === 'Paladín' && x.nivel >= 2);
  if (pal && cuerpo) {
    const P = perfil(ch), uso = libres(ch, 'tpl:paladin.castigo'), espacioUsado = c.activo && !!c.espacio;
    const nota = '2d8 radiante +1d8 por nivel de espacio por encima de 1; +1d8 si es infernal o muerto viviente. Gasta tu acción adicional.';
    if (uso > 0) out.push({ k: 'castigo:gratis', grupo: 'castigo', titulo: 'Castigo divino', nombre: 'Castigo de paladín (sin gastar espacio)', dado: '2d8', gasta: { rec: 'tpl:paladin.castigo' }, nota, adicional: true });
    for (let L = 1; L <= Math.min(5, P.maxSlot); L++) {
      const tot = P.slots[L] || 0, lib = tot - Math.min(ch.play?.used?.[L] || 0, tot); if (!lib) continue;
      out.push({ k: `castigo:${L}`, grupo: 'castigo', titulo: 'Castigo divino', nombre: `Espacio de nivel ${L}`, dado: `${1 + L}d8`, gasta: { espacio: L }, adicional: true,
        nota: `${nota} Te quedan ${lib}.${espacioUsado ? ' Ojo: este turno ya gastaste un espacio en otro conjuro.' : ''}` });
    }
  }
  // Clérigo y druida 7: una vez por turno
  for (const g of golpeExtra(ch)) if (!hechas.includes(`golpe:${g.nombre}`))
    out.push({ k: `golpe:${g.nombre}`, grupo: '', titulo: g.nombre, nombre: `+${g.dado} ${g.tipos}`, dado: g.dado, unaVez: true, nota: 'Una vez en cada uno de tus turnos.' });
  // Pícaro: Ataque furtivo con arma sutil o a distancia, una vez por turno
  const pic = clasesDe(ch).find(x => x.clase === 'Pícaro');
  if (pic && (props.includes('sutil') || distancia) && !hechas.includes('furtivo'))
    out.push({ k: 'furtivo', grupo: '', titulo: 'Ataque furtivo', nombre: `${Math.ceil(pic.nivel / 2)}d6`, dado: `${Math.ceil(pic.nivel / 2)}d6`, unaVez: true,
      nota: 'Una vez por turno: si tienes ventaja, o un aliado está a 1,5 m del objetivo y no tienes desventaja.' });
  return out;
}

// Aplica lo elegido: gasta dados, usos, espacios y la acción adicional, y marca lo de una vez por turno
export function gastarAlImpactar(ch, elegidas) {
  const c = combateDe(ch);
  for (const x of elegidas) {
    if (x.gasta?.rec) { ch.play.rec ||= {}; const st = (ch.play.rec[x.gasta.rec] ||= { used: 0, dice: [] }); st.used = (st.used || 0) + 1; }
    if (x.gasta?.espacio) { ch.play.used ||= {}; ch.play.used[x.gasta.espacio] = (ch.play.used[x.gasta.espacio] || 0) + 1; if (c.activo) c.espacio ||= 'Castigo divino'; }
    if (c.activo && x.adicional) c.turno.adicional = true;
    if (c.activo && x.unaVez) c.unaVez = [...(c.unaVez || []), x.k];
  }
}
