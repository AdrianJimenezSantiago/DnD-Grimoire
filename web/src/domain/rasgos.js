/**
 * Rasgos y recursos como reglas configurables.
 * Tipos: recurso (usos) · dados (anotados) · recuperar (espacios) · al_lanzar (disparador).
 * Las plantillas de clase se calculan con el nivel; los rasgos propios los define el jugador.
 */
import { clamp, norm } from '../core/util.js';
import { modOf, nivelDe, competencia } from './reglas2024.js';

export const TIPO_TXT = { recurso: 'Recurso con usos', dados: 'Dados que se anotan', recuperar: 'Recuperar espacios', al_lanzar: 'Efecto al lanzar un conjuro' };
export const RECARGA_TXT = { largo: 'se recuperan con un descanso largo', corto: 'se recuperan con un descanso corto o largo', corto1: 'recupera 1 con un descanso corto y todos con uno largo' };
export const RECARGA_CORTA = { largo: 'Descanso largo', corto: 'Descanso corto o largo', corto1: 'Recupera 1 con descanso corto' };
const byLvl = (L, pairs) => pairs.reduce((v, [from, val]) => (L >= from ? val : v), 0);

export function plantillas(ch) {
  const L = nivelDe(ch), sub = ch.subclase || '', T = [];
  const mod = k => Math.max(1, modOf(ch.stats[k]));
  const has = re => re.test(sub);
  const R = (id, o) => T.push({ id: 'tpl:' + id, tpl: true, nota: '', recarga: 'largo', ...o });
  const uno = (id, nombre, nota, recarga = 'largo') => R(id, { tipo: 'recurso', nombre, max: 1, recarga, nota });
  switch (ch.clase) {
    case 'Bárbaro':
      R('barbaro.furia', { tipo: 'recurso', nombre: 'Furia', max: byLvl(L, [[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]]), recarga: 'corto1' });
      if (has(/berserk/i) && L >= 14) uno('berserker.presencia', 'Presencia intimidante', 'También puedes restablecerla gastando un uso de Furia.');
      if (has(/fan[áa]tic/i)) {
        if (L >= 3) R('fanatico.dioses', { tipo: 'recurso', nombre: 'Guerrero de los dioses', max: byLvl(L, [[3, 4], [6, 5], [12, 6], [17, 7]]), nota: 'Reserva de d12 para curarte con una acción adicional.' });
        if (L >= 10) uno('fanatico.presencia', 'Presencia ferviente', 'También puedes restablecerla gastando un uso de Furia.');
        if (L >= 14) uno('fanatico.furia', 'Furia de los dioses');
      }
      break;
    case 'Bardo':
      R('bardo.inspiracion', { tipo: 'recurso', nombre: 'Inspiración bárdica', max: mod('car'), recarga: L >= 5 ? 'corto' : 'largo',
        nota: `Dado de inspiración: ${L >= 15 ? 'd12' : L >= 10 ? 'd10' : L >= 5 ? 'd8' : 'd6'}.${L >= 5 ? ' También recuperas un uso gastando un espacio de conjuro.' : ''}` });
      if (has(/glamour/i) && L >= 3) uno('glamour.cautivadora', 'Magia cautivadora', 'También puedes restablecerla gastando un uso de Inspiración bárdica.');
      break;
    case 'Brujo':
      if (L >= 2) uno('brujo.astucia', 'Astucia mágica', 'Rito de 1 minuto: recuperas espacios de pacto gastados hasta la mitad de tu máximo, redondeando hacia arriba.');
      if (L >= 9) uno('brujo.contactar', 'Contactar patrón', 'Contactar con otro plano sin gastar espacio.');
      if (has(/celestial/i) && L >= 3) R('celestial.luz', { tipo: 'recurso', nombre: 'Luz sanadora', max: 1 + L, nota: `Reserva de d6 para curar; gastas como máximo ${mod('car')} a la vez.` });
      if (has(/fe[ée]ric/i)) {
        if (L >= 3) R('feerico.pasos', { tipo: 'recurso', nombre: 'Pasos feéricos', max: mod('car'), nota: 'Paso brumoso sin gastar espacio.' });
        if (L >= 6) uno('feerico.escape', 'Escape brumoso', 'También puedes restablecerlo gastando un espacio de pacto.');
      }
      if (has(/infernal/i)) {
        if (L >= 6) R('infernal.suerte', { tipo: 'recurso', nombre: 'Suerte del Oscuro', max: mod('car'), nota: 'Suma 1d10 a una prueba de característica o tirada de salvación.' });
        if (L >= 14) uno('infernal.arrastrar', 'Arrastrar por el infierno', 'También puedes restablecerlo gastando un espacio de pacto.');
      }
      if (has(/primigenio/i) && L >= 6) uno('primigenio.combatiente', 'Combatiente clarividente', 'También puedes restablecerlo gastando un espacio de pacto.', 'corto');
      break;
    case 'Clérigo':
      if (L >= 2) R('clerigo.canalizar', { tipo: 'recurso', nombre: 'Canalizar divinidad', max: byLvl(L, [[2, 2], [6, 3], [18, 4]]), recarga: 'corto1' });
      if (L >= 10) uno('clerigo.intervencion', 'Intercesión divina');
      if (has(/guerra/i) && L >= 3) R('guerra.sacerdote', { tipo: 'recurso', nombre: 'Sacerdote guerrero', max: mod('sab'), recarga: 'corto' });
      if (has(/\bluz\b/i)) {
        if (L >= 3) R('luz.fulgor', { tipo: 'recurso', nombre: 'Fulgor protector', max: mod('sab'), recarga: L >= 6 ? 'corto' : 'largo' });
        if (L >= 17) R('luz.halo', { tipo: 'recurso', nombre: 'Halo de luz', max: mod('sab') });
      }
      break;
    case 'Druida':
      if (L >= 2) R('druida.forma', { tipo: 'recurso', nombre: 'Forma salvaje', max: byLvl(L, [[2, 2], [6, 3], [17, 4]]), recarga: 'corto1' });
      if (L >= 5) uno('druida.resurgimiento', 'Resurgimiento salvaje', 'Convierte un uso de Forma salvaje en un espacio de nivel 1.');
      if (has(/tierra/i) && L >= 6) R('druida.recuperacion', { tipo: 'recuperar', nombre: 'Recuperación natural', max: Math.ceil(L / 2), nivMax: 5, nota: 'Se usa al terminar un descanso corto.' });
      if (has(/estrella/i)) {
        if (L >= 3) R('estrellas.mapa', { tipo: 'recurso', nombre: 'Mapa estelar', max: mod('sab'), nota: 'Saeta guía sin gastar espacio.' });
        if (L >= 6) R('estrellas.presagio', { tipo: 'recurso', nombre: 'Presagio cósmico', max: mod('sab'), nota: 'Tira un dado tras el descanso largo: par, Bienaventuranza; impar, Desdicha.' });
      }
      break;
    case 'Explorador':
      R('explorador.enemigo', { tipo: 'recurso', nombre: 'Enemigo predilecto', max: byLvl(L, [[1, 2], [5, 3], [9, 4], [13, 5], [17, 6]]), nota: 'Marca del cazador sin gastar espacio.' });
      if (L >= 10) R('explorador.infatigable', { tipo: 'recurso', nombre: 'Infatigable', max: mod('sab'), nota: 'Puntos de golpe temporales como acción de magia.' });
      if (L >= 14) R('explorador.velo', { tipo: 'recurso', nombre: 'Velo de la naturaleza', max: mod('sab') });
      if (has(/acechador|penumbra/i) && L >= 3) R('acechador.emboscador', { tipo: 'recurso', nombre: 'Emboscador pavoroso', max: mod('sab') });
      if (has(/errante/i)) {
        if (L >= 11) uno('errante.refuerzos', 'Refuerzos feéricos', 'Invocar feérico sin gastar espacio.');
        if (L >= 15) R('errante.brumoso', { tipo: 'recurso', nombre: 'Errante brumoso', max: mod('sab'), nota: 'Paso brumoso sin gastar espacio.' });
      }
      break;
    case 'Guerrero':
      R('guerrero.energias', { tipo: 'recurso', nombre: 'Tomar aliento', max: byLvl(L, [[1, 2], [4, 3], [10, 4]]), recarga: 'corto1' });
      if (L >= 2) R('guerrero.oleada', { tipo: 'recurso', nombre: 'Acción súbita', max: L >= 17 ? 2 : 1, recarga: 'corto', nota: 'Solo una vez por turno.' });
      if (L >= 9) R('guerrero.indomito', { tipo: 'recurso', nombre: 'Indómito', max: byLvl(L, [[9, 1], [13, 2], [17, 3]]) });
      if (has(/maestro del combate|batalla/i) && L >= 3) R('maestro.supremacia', { tipo: 'recurso', nombre: 'Dados de supremacía', max: byLvl(L, [[3, 4], [7, 5], [15, 6]]), recarga: 'corto', nota: `Dado: ${L >= 18 ? 'd12' : L >= 10 ? 'd10' : 'd8'}.` });
      if (has(/psi[óo]nic/i) && L >= 3) R('psionico.dados', { tipo: 'recurso', nombre: 'Dados de energía psiónica', ...dadosPsionicos(L), recarga: 'corto1' });
      break;
    case 'Hechicero':
      R('hechicero.innata', { tipo: 'recurso', nombre: 'Hechicería innata', max: 2 });
      if (L >= 2) R('hechicero.puntos', { tipo: 'recurso', nombre: 'Puntos de hechicería', max: L });
      if (L >= 5) uno('hechicero.recuperacion', 'Recuperación mágica', `Tras un descanso corto recuperas hasta ${Math.floor(L / 2)} puntos de hechicería.`);
      if (has(/salvaje/i) && L >= 3) uno('salvaje.mareas', 'Mareas del caos', 'Ventaja en una prueba de d20; se restablece tras una sobrecarga de magia salvaje.');
      if (has(/drac[óo]nic/i) && L >= 14) uno('draconica.alas', 'Alas de dragón', 'También puedes restablecerlas gastando 3 puntos de hechicería.');
      if (has(/aberrant/i) && L >= 18) uno('aberrante.implosion', 'Implosión deformadora', 'También puedes restablecerla gastando 5 puntos de hechicería.');
      if (has(/mec[áa]nic/i) && L >= 14) uno('mecanica.trance', 'Trance de orden', 'También puedes restablecerlo gastando 5 puntos de hechicería.');
      break;
    case 'Mago':
      R('mago.recuperacion', { tipo: 'recuperar', nombre: 'Recuperación arcana', max: Math.ceil(L / 2), nivMax: 5, nota: 'Se usa al terminar un descanso corto.' });
      if (has(/adivin|divin/i)) {
        if (L >= 3) R('adivino.presagio', { tipo: 'dados', nombre: 'Presagio', max: L >= 14 ? 3 : 2, dado: 'd20', nota: 'Sustituyen cualquier prueba de d20 tuya o de una criatura que veas; decídelo antes de tirar.' });
        if (L >= 6) R('adivino.avezado', { tipo: 'al_lanzar', nombre: 'Adivino avezado', escuela: 'Adivinación', espacioMin: 2, soloEspacio: true, efecto: 'recuperar', efectoN: 5 });
      }
      if (has(/abjur/i) && L >= 3) R('abjurador.salvaguarda', { tipo: 'recurso', nombre: 'Salvaguarda arcana', max: 2 * L + modOf(ch.stats.int), nota: 'Puntos de golpe de la salvaguarda. Recupera el doble del nivel del espacio al lanzar abjuración.' });
      if (has(/evoca/i)) {
        if (L >= 10) R('evocador.potenciada', { tipo: 'al_lanzar', nombre: 'Evocación potenciada', escuela: 'Evocación', espacioMin: 0, soloEspacio: false, efecto: 'aviso', texto: 'Suma tu modificador de Inteligencia a una tirada de daño del conjuro.' });
        if (L >= 14) uno('evocador.sobrecanalizar', 'Sobrecanalizar', 'Repetirlo antes de un descanso largo causa daño necrótico creciente.');
      }
      if (has(/ilusion/i)) {
        if (L >= 6) R('ilusionista.criaturas', { tipo: 'recurso', nombre: 'Criaturas fantasmales', max: 2, nota: 'Invocar bestia e Invocar feérico, una vez cada uno sin gastar espacio.' });
        if (L >= 10) uno('ilusionista.yo', 'Yo ilusorio', 'También puedes restablecerlo gastando un espacio de nivel 2 o superior.', 'corto');
      }
      break;
    case 'Monje':
      if (L >= 2) R('monje.concentracion', { tipo: 'recurso', nombre: 'Puntos de concentración', max: L, recarga: 'corto' });
      if (L >= 2) uno('monje.metabolismo', 'Metabolismo asombroso', 'Al tirar iniciativa: recuperas los puntos de concentración y te curas.');
      if (has(/mano abierta/i) && L >= 6) R('manoabierta.plenitud', { tipo: 'recurso', nombre: 'Plenitud de cuerpo', max: mod('sab') });
      if (has(/misericordia/i) && L >= 17) uno('misericordia.suprema', 'Mano de misericordia suprema');
      break;
    case 'Paladín':
      R('paladin.manos', { tipo: 'recurso', nombre: 'Imposición de manos', max: 5 * L, nota: 'Reserva de puntos de golpe para curar.' });
      if (L >= 2) uno('paladin.castigo', 'Castigo de paladín', 'Castigo divino sin gastar espacio.');
      if (L >= 3) R('paladin.canalizar', { tipo: 'recurso', nombre: 'Canalizar divinidad', max: L >= 11 ? 3 : 2, recarga: 'corto1' });
      if (L >= 5) uno('paladin.corcel', 'Corcel fiel', 'Hallar corcel sin gastar espacio.');
      if (L >= 20) {
        const cap = has(/entrega|devoci/i) ? 'Halo sagrado' : has(/gloria/i) ? 'Leyenda viviente' : has(/antiguos/i) ? 'Campeón ancestral' : has(/venganza/i) ? 'Ángel vengador' : '';
        if (cap) uno('paladin.cumbre', cap, 'También puedes restablecerlo gastando un espacio de nivel 5.');
      }
      break;
    case 'Pícaro':
      if (has(/rebanaalmas|cuchilla|alma/i) && L >= 3) {
        R('rebanaalmas.dados', { tipo: 'recurso', nombre: 'Dados de energía psiónica', ...dadosPsionicos(L), recarga: 'corto1' });
        if (L >= 17) uno('rebanaalmas.desgarro', 'Desgarro mental', 'También puedes restablecerlo gastando 3 dados de energía psiónica.');
      }
      if (L >= 20) uno('picaro.suerte', 'Golpe de suerte', '', 'corto');
      break;
  }
  return T;
}
/** Guerrero psiónico y rebanaalmas comparten tabla de dados de energía. */
function dadosPsionicos(L) {
  const [n, d] = L >= 17 ? [12, 'd12'] : L >= 13 ? [10, 'd10'] : L >= 11 ? [8, 'd10'] : L >= 9 ? [8, 'd8'] : L >= 5 ? [6, 'd8'] : [4, 'd6'];
  return { max: n, nota: `Dado: ${d}.` };
}

/** Máximo de un rasgo propio según su base (número fijo, nivel, modificador…). */
export function maxFrom(ch, r) {
  const L = nivelDe(ch), n = parseInt(r.maxN, 10);
  switch (r.maxBase) {
    case 'nivel': return L;
    case 'nivelx': return L * (n || 1);
    case 'mitad': return Math.ceil(L / 2);
    case 'mod': return Math.max(1, modOf(ch.stats[r.maxAb || 'car']));
    case 'comp': return competencia(L);
    default: return Math.max(0, n || 0);
  }
}

/** Plantillas + rasgos propios, ya resueltos. Por defecto solo los activos. */
export function reglas(ch, todas = false) {
  const off = new Set(ch.rasgosOff || []);
  const list = [
    ...plantillas(ch).map(r => ({ ...r, off: off.has(r.id) })),
    ...(ch.rasgos || []).map(r => ({ ...r, tpl: false, off: !!r.off, max: maxFrom(ch, r.tipo === 'dados' ? { ...r, maxBase: 'fijo' } : r) })),
  ];
  return todas ? list : list.filter(r => !r.off);
}

export function castTriggerDesc(r) {
  const cond = `Al lanzar ${r.escuela ? `un conjuro de ${r.escuela.toLowerCase()}` : 'un conjuro'}${r.espacioMin ? ` con un espacio de nivel ${r.espacioMin} o superior` : ''}`;
  const ef = r.efecto === 'recuperar' ? `recuperas un espacio gastado de nivel inferior al usado (máx. ${r.efectoN || 5})` : (r.texto || 'aviso sin texto');
  return `${cond}: ${ef}.`;
}
export function ruleSummary(r) {
  const nota = r.nota ? ' ' + r.nota : '';
  switch (r.tipo) {
    case 'recurso': return `${r.max} ${r.max === 1 ? 'uso' : 'usos'}; ${RECARGA_TXT[r.recarga] || RECARGA_TXT.largo}.${nota}`;
    case 'dados': return `${r.max}${r.dado || 'd20'} anotados tras un descanso largo.${nota}`;
    case 'recuperar': return `Hasta ${r.max} niveles de espacios (ninguno de nivel ${(r.nivMax || 5) + 1}+), una vez por descanso largo.${nota}`;
    case 'al_lanzar': return castTriggerDesc(r);
    default: return '';
  }
}
export const schoolMatch = (s, escuela) => !escuela || norm(s.escuela || '').slice(0, 5) === norm(escuela).slice(0, 5);
export const castSchools = ch => reglas(ch).filter(r => r.tipo === 'al_lanzar' && r.escuela).map(r => norm(r.escuela).slice(0, 5));
export const hasShortRest = (ch, P) => !!P.pact || (ch.clase === 'Brujo' && ch.espaciosManuales)
  || reglas(ch).some(r => (r.tipo === 'recurso' && r.recarga !== 'largo') || r.tipo === 'recuperar');

/** Estado de juego de un rasgo (se crea al vuelo). */
export function recState(ch, id) {
  ch.play.rec = ch.play.rec || {};
  return (ch.play.rec[id] = ch.play.rec[id] || { used: 0, dice: [] });
}
export const usosGastados = (ch, r) => clamp(recState(ch, r.id).used || 0, 0, r.max);
