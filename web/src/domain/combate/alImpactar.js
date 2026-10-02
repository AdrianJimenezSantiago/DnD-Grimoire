// Lo que se puede añadir al daño de un ataque que impacta y lo que gasta (maniobras, Castigo divino, Ataque furtivo…).
import { norm } from '../../core/util.js';
import { clasesDe, perfil, dotesDe, modOf, competencia, nivelTotal } from '../reglas/reglas2024.js';
import { reglas, usosGastados } from '../clases/rasgos.js';
import { maniobrasDe, dadoSupremacia, cdManiobras } from '../clases/maniobras.js';
import { golpeExtra } from '../clases/variantes.js';
import { combateDe } from './combate.js';
import { statsEfectivos } from '../equipo/objetosEfecto.js';
import { golpesDeOpciones } from '../clases/opcionesRasgo.js';
import { DADO_ARTES, DANO_FURIA } from '../equipo/equipo.js';
import { esMarcial } from '../reglas/competencias.js';
import { linajeDe } from '../origen/especies.js';

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
  const sub = (clase, re, L = 3) => clasesDe(ch).find(x => x.clase === clase && re.test(norm(x.subclase || '')) && x.nivel >= L);
  const enFuria = (ch.vida?.efectos || []).some(e => e.k === 'furia'), mod = k => modOf(statsEfectivos(ch)[k]), una = k => !hechas.includes(k);
  // Bárbaro berserker: Frenesí (furia y Ataque temerario), al primer objetivo que impactes en tu turno con un ataque de Fuerza
  const bers = sub('Bárbaro', /berserk/);
  if (bers && enFuria && una('frenesi')) { const n = DANO_FURIA(bers.nivel);
    out.push({ k: 'frenesi', grupo: '', titulo: 'Frenesí', nombre: `+${n}d6`, dado: `${n}d6`, unaVez: true, nota: 'Solo si usaste Ataque temerario este turno y el ataque usa la Fuerza. Una vez por turno.' }); }
  // Bárbaro fanático: Furia divina, a la primera criatura que impactes con un arma en cada uno de tus turnos mientras estés en furia
  const fan = sub('Bárbaro', /fanatic/);
  if (fan && enFuria && una('furiadivina')) { const d = `1d6+${Math.floor(fan.nivel / 2)}`;
    out.push({ k: 'furiadivina', grupo: '', titulo: 'Furia divina', nombre: `+${d} necrótico o radiante`, dado: d, unaVez: true, nota: 'Una vez en cada uno de tus turnos, mientras estés en furia.' }); }
  // Opciones elegidas que suman daño (Asesino de colosos)
  for (const g of golpesDeOpciones(ch)) if (una(`op:${g.nombre}`))
    out.push({ k: `op:${g.nombre}`, grupo: '', titulo: g.nombre, nombre: `+${g.dado}`, dado: g.dado, unaVez: true, nota: `Una vez por turno, ${g.cond}.` });
  // Monje: Golpe aturdidor (5) y Mano de aflicción (misericordia 3), con 1 punto de concentración, una vez por turno cada uno
  const monje = clasesDe(ch).find(x => x.clase === 'Monje'), foco = libres(ch, 'tpl:monje.concentracion');
  const armaMonje = o?.sinArmas || (cuerpo && (!esMarcial(o) || props.includes('ligera')));
  if (monje && foco > 0 && armaMonje) {
    const cd = 8 + mod('sab') + competencia(nivelTotal(ch));
    if (monje.nivel >= 5 && una('aturdidor')) out.push({ k: 'aturdidor', grupo: '', titulo: 'Golpe aturdidor', nombre: 'Aturdir', dado: '', unaVez: true, gasta: { rec: 'tpl:monje.concentracion' },
      nota: `Salvación de Constitución CD ${cd}: si falla, aturdido hasta el inicio de tu siguiente turno; si la supera, su velocidad se reduce a la mitad y el siguiente ataque contra él tiene ventaja. 1 punto de concentración (te quedan ${foco}).` });
    if (o?.sinArmas && sub('Monje', /misericordia/) && una('afliccion')) { const d = `${DADO_ARTES(monje.nivel)}+${Math.max(0, mod('sab'))}`;
      out.push({ k: 'afliccion', grupo: '', titulo: 'Mano de aflicción', nombre: `+${d} necrótico`, dado: d, unaVez: true, gasta: { rec: 'tpl:monje.concentracion' }, nota: `Una vez por turno con un golpe sin armas. 1 punto de concentración (te quedan ${foco}).` }); }
  }
  // Guerrero psiónico: Golpe psiónico, un dado de energía psiónica + Inteligencia de fuerza, una vez en cada uno de tus turnos
  const psi = sub('Guerrero', /psionic/), dpsi = libres(ch, 'tpl:psionico.dados');
  if (psi && dpsi > 0 && una('psionico')) { const d = `1${psi.nivel >= 17 ? 'd12' : psi.nivel >= 11 ? 'd10' : psi.nivel >= 5 ? 'd8' : 'd6'}+${Math.max(0, mod('int'))}`;
    out.push({ k: 'psionico', grupo: '', titulo: 'Golpe psiónico', nombre: `+${d} de fuerza`, dado: d, unaVez: true, gasta: { rec: 'tpl:psionico.dados' }, nota: `Objetivo a 9 m o menos. Gasta un dado de energía psiónica (te quedan ${dpsi}).` }); }
  // Explorador: Golpe pavoroso (acechador en la penumbra) y Golpes pavorosos (errante feérico), una vez por turno
  const pav = libres(ch, 'tpl:acechador.emboscador');
  if (sub('Explorador', /acechador|penumbra/) && pav > 0 && una('pavoroso'))
    out.push({ k: 'pavoroso', grupo: '', titulo: 'Golpe pavoroso', nombre: '+2d6 psíquico', dado: '2d6', unaVez: true, gasta: { rec: 'tpl:acechador.emboscador' }, nota: `Una vez por turno (te quedan ${pav} usos).` });
  const errante = sub('Explorador', /errante/);
  if (errante && una('pavorosos')) { const d = errante.nivel >= 11 ? '1d6' : '1d4';
    out.push({ k: 'pavorosos', grupo: '', titulo: 'Golpes pavorosos', nombre: `+${d} psíquico`, dado: d, unaVez: true, nota: 'Una vez por turno a cada criatura.' }); }
  // Caminante invernal: Golpes polares, +1d4 de frío (1d6 a nivel 11) una vez por turno con un arma
  const inv = sub('Explorador', /invernal/);
  if (inv && una('polares')) { const d = inv.nivel >= 11 ? '1d6' : '1d4'; out.push({ k: 'polares', grupo: '', titulo: 'Golpes polares', nombre: `+${d} de frío`, dado: d, unaVez: true, nota: 'Una vez por turno.' }); }
  // Genios nobles: Castigo elemental (Furia del ifrit), justo después de Castigo divino, gasta Canalizar divinidad
  const cdiv = libres(ch, 'tpl:paladin.canalizar');
  if (sub('Paladín', /genios/) && cuerpo && cdiv > 0) out.push({ k: 'ifrit', grupo: '', titulo: 'Castigo elemental', nombre: 'Furia del ifrit: +2d4 de fuego', dado: '2d4', gasta: { rec: 'tpl:paladin.canalizar' },
    nota: `Solo junto a Castigo divino; otra criatura a 9 m también sufre 2d4 de fuego. Gasta Canalizar divinidad (te quedan ${cdiv}).` });
  // Especie: Linaje gigante del goliat (usos = competencia) y Revelación celestial del aasimar (una vez por turno)
  const gig = linajeDe(ch, 'especie.goliat'), usosGig = libres(ch, 'tpl:especie.gigante');
  if (gig?.golpe && usosGig > 0) out.push({ k: 'gigante', grupo: '', titulo: gig.nombre, nombre: gig.golpe.dado ? `+${gig.golpe.dado} de ${gig.golpe.tipo}` : 'Derribar', dado: gig.golpe.dado, gasta: { rec: 'tpl:especie.gigante' },
    nota: `${gig.texto} Te quedan ${usosGig} usos.` });
  if ((ch.vida?.efectos || []).some(e => e.k === 'revelacion') && una('revelacion')) { const pb = competencia(nivelTotal(ch)), tipo = linajeDe(ch, 'especie.aasimar')?.tipo || 'radiante o necrótico';
    out.push({ k: 'revelacion', grupo: '', titulo: 'Revelación celestial', nombre: `+${pb} ${tipo}`, dado: String(pb), unaVez: true, nota: 'Una vez en cada uno de tus turnos mientras dure la transformación.' }); }
  // Atacante a la carga: tras moverte 3 m en línea recta, +1d8 una vez en cada uno de tus turnos
  if (cuerpo && dotesDe(ch).some(d => norm(d.nombre) === 'atacante a la carga') && una('carga'))
    out.push({ k: 'carga', grupo: '', titulo: 'Atacante a la carga', nombre: '+1d8', dado: '1d8', unaVez: true, nota: 'Si te moviste al menos 3 m en línea recta hacia el objetivo justo antes (o empújalo 3 m en su lugar).' });
  // Conjuros en marcha que suman daño a cada impacto: Marca del cazador y Maleficio
  const conc = norm(ch.play?.conc || '');
  if (conc === 'marca del cazador') { const d = clasesDe(ch).some(x => x.clase === 'Explorador' && x.nivel >= 20) ? '1d10' : '1d6';
    out.push({ k: 'marca', grupo: '', titulo: 'Marca del cazador', nombre: `+${d} de fuerza`, dado: d, nota: 'Si el objetivo es la criatura marcada.' }); }
  if (conc === 'maleficio') out.push({ k: 'maleficio', grupo: '', titulo: 'Maleficio', nombre: '+1d6 necrótico', dado: '1d6', nota: 'Si el objetivo es la criatura maldita.' });
  // Asesino: Golpes sorprendentes, en el primer asalto el Ataque furtivo hace además tu nivel de pícaro
  const ases = sub('Pícaro', /asesin/);
  if (ases && c.activo && c.ronda === 1 && (props.includes('sutil') || distancia) && una('sorprendentes'))
    out.push({ k: 'sorprendentes', grupo: '', titulo: 'Golpes sorprendentes', nombre: `+${ases.nivel} del tipo del arma`, dado: String(ases.nivel), unaVez: true, nota: 'Primer asalto: si el Ataque furtivo acierta. Ventaja contra quien aún no haya jugado su turno.' });
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

// Daño que se suma siempre al impactar, sin elegir: Golpes radiantes (paladín 11) con armas cuerpo a cuerpo y golpes sin armas
export function danoSiempre(ch, o) {
  const props = (o?.arma?.props || []).map(norm), cuerpo = !props.some(p => p.startsWith('municion'));
  const out = [];
  if (cuerpo && clasesDe(ch).some(x => x.clase === 'Paladín' && x.nivel >= 11)) out.push({ fuente: 'Golpes radiantes (radiante)', valor: '1d8' });
  return out;
}
