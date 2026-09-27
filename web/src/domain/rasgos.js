import { clamp, norm } from '../core/util.js';
import { statsEfectivos } from './objetosEfecto.js';
import { modOf, nivelDe, competencia, clasesDe, vistaClase, dotesDe, nivelTotal } from './reglas2024.js';
import { cdManiobras } from './maniobras.js';

export const TIPO_TXT = { recurso: 'Recurso con usos', dados: 'Dados que se anotan', recuperar: 'Recuperar espacios', al_lanzar: 'Efecto al lanzar un conjuro' };
export const RECARGA_TXT = { largo: 'se recuperan con un descanso largo', corto: 'se recuperan con un descanso corto o largo', corto1: 'recupera 1 con un descanso corto y todos con uno largo', nunca: 'no se recuperan (consumible)' };
export const RECARGA_CORTA = { largo: 'Descanso largo', corto: 'Descanso corto o largo', corto1: 'Recupera 1 con descanso corto', nunca: 'No se recarga' };
export const dadoRecarga = r => { const m = /^(\d*)d(\d+)$/i.exec(String(r.recDado || '').trim()); const n = +(m?.[1] || 1), caras = +(m?.[2] || 0);
  return m && n >= 1 && caras >= 1 ? { n, caras, bono: parseInt(r.recBono, 10) || 0 } : null; };
export function etiquetaRecarga(r, larga = false) {
  if (r.recarga === 'dado') { const d = dadoRecarga(r); const txt = d ? `${d.n}d${d.caras}${d.bono ? (d.bono > 0 ? '+' : '') + d.bono : ''}` : 'dados';
    return larga ? `recupera ${txt} ${r.recMomento === 'corto' ? 'con cada descanso corto o largo' : 'al amanecer (descanso largo)'}` : `Recupera ${txt} ${r.recMomento === 'corto' ? 'por descanso' : 'al amanecer'}`; }
  return (larga ? RECARGA_TXT : RECARGA_CORTA)[r.recarga] || (larga ? RECARGA_TXT.largo : RECARGA_CORTA.largo);
}
export function recuperarEnDescanso(r, usados, tipo, tirar = c => 1 + Math.floor(Math.random() * c)) {
  if (!usados) return { usados: 0, tirada: '' };
  switch (r.recarga) {
    case 'nunca': return { usados, tirada: '' };
    case 'corto': return { usados: 0, tirada: '' };
    case 'corto1': return { usados: tipo === 'largo' ? 0 : usados - 1, tirada: '' };
    case 'dado': {
      if (tipo === 'corto' && r.recMomento !== 'corto') return { usados, tirada: '' };
      const d = dadoRecarga(r); if (!d) return { usados: 0, tirada: '' };
      const vals = Array.from({ length: d.n }, () => tirar(d.caras)), total = Math.max(0, vals.reduce((a, b) => a + b, 0) + d.bono);
      return { usados: Math.max(0, usados - total), tirada: `${d.n}d${d.caras}${d.bono ? (d.bono > 0 ? '+' : '') + d.bono : ''} = ${total}` };
    }
    default: return { usados: tipo === 'largo' ? 0 : usados, tirada: '' };
  }
}
const byLvl = (L, pairs) => pairs.reduce((v, [from, val]) => (L >= from ? val : v), 0);

export function plantillas(ch) {
  const L = nivelDe(ch), sub = ch.subclase || '', T = [];
  const mod = k => Math.max(1, modOf(statsEfectivos(ch)[k]));
  const has = re => re.test(sub);
  const R = (id, o) => T.push({ id: 'tpl:' + id, tpl: true, nota: '', recarga: 'largo', ...o });
  const uno = (id, nombre, nota = '', recarga = 'largo') => R(id, { tipo: 'recurso', nombre, max: 1, recarga, nota });
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
      if (has(/glamour/i)) {
        if (L >= 3) uno('glamour.cautivadora', 'Magia cautivadora', 'También puedes restablecerla gastando un uso de Inspiración bárdica.');
        if (L >= 6) uno('glamour.manto', 'Manto de majestad', 'Orden imperiosa como acción adicional sin gastar espacio durante 1 minuto. También puedes restablecerlo gastando un espacio de nivel 3 o superior.');
        if (L >= 14) uno('glamour.majestad', 'Majestad inquebrantable', 'Durante 1 minuto, quien te acierte por primera vez en un turno hace una salvación de Carisma o falla el ataque.', 'corto');
      }
      if (has(/luna/i) && L >= 6) uno('lunabardo.bendicion', 'Bendición de la luz lunar', 'Modifica un lanzamiento de Rayo de luna: brillas y curas 2d4 a otra criatura cada vez que alguien falle la salvación.');
      break;
    case 'Brujo':
      if (L >= 2) uno('brujo.astucia', 'Astucia mágica', 'Rito de 1 minuto: recuperas espacios de pacto gastados hasta la mitad de tu máximo, redondeando hacia arriba.');
      if (L >= 9) uno('brujo.contactar', 'Contactar patrón', 'Contactar con otro plano sin gastar espacio.');
      [6, 7, 8, 9].filter(n => L >= 2 * n - 1).forEach(n => uno('brujo.arcanum' + n, `Arcanum místico (nivel ${n})`, `Lanzas tu conjuro de nivel ${n} del arcanum sin gastar espacio.`));
      if (has(/celestial/i) && L >= 3) R('celestial.luz', { tipo: 'recurso', nombre: 'Luz sanadora', max: 1 + L, nota: `Reserva de d6 para curar; gastas como máximo ${mod('car')} a la vez.` });
      if (has(/celestial/i) && L >= 14) uno('celestial.venganza', 'Venganza ardiente', 'Cura a quien vaya a tirar salvación contra muerte y ciega a los enemigos cercanos.');
      if (has(/fe[ée]ric/i)) {
        if (L >= 3) R('feerico.pasos', { tipo: 'recurso', nombre: 'Pasos feéricos', max: mod('car'), nota: 'Paso brumoso sin gastar espacio.' });
        if (L >= 10) uno('feerico.escape', 'Defensas seductoras', 'Reacción al recibir un acierto: mitad de daño y el atacante hace una salvación de Sabiduría o sufre daño psíquico igual al que recibes. También puedes restablecerlo gastando un espacio de pacto.');
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
      if (has(/conocimiento/i) && L >= 17) uno('conocimiento.precognicion', 'Precognición divina', 'Ventaja en las pruebas con d20 durante 1 hora. También puedes restablecerla gastando un espacio de nivel 6 o superior.');
      break;
    case 'Druida':
      if (L >= 2) R('druida.forma', { tipo: 'recurso', nombre: 'Forma salvaje', max: byLvl(L, [[2, 2], [6, 3], [17, 4]]), recarga: 'corto1' });
      if (L >= 5) uno('druida.resurgimiento', 'Resurgimiento salvaje', 'Convierte un uso de Forma salvaje en un espacio de nivel 1.');
      if (L >= 20) uno('druida.archidruida', 'Archidruida (mago de la naturaleza)', 'Conviertes usos de Forma salvaje en un espacio de conjuro: cada uso aporta 2 niveles.');
      if (has(/luna/i) && L >= 10) R('luna.paso', { tipo: 'recurso', nombre: 'Paso de la luz lunar', max: mod('sab'), nota: 'Acción adicional: te teletransportas 9 m y tienes ventaja en tu siguiente ataque este turno. También recuperas un uso gastando un espacio de nivel 2 o superior.' });
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
      if (has(/invernal/i)) {
        if (L >= 7) uno('invernal.alma', 'Alma fortalecedora', `Hasta ${mod('sab')} criaturas recuperan 1d10 + ${L} puntos de golpe y tienen ventaja contra el miedo durante 1 hora.`);
        if (L >= 11) R('invernal.represalia', { tipo: 'recurso', nombre: 'Represalia escalofriante', max: mod('sab'), nota: 'Reacción: salvación de Sabiduría o queda aturdido y con velocidad 0.' });
        if (L >= 15) uno('invernal.espectro', 'Espectro congelado', 'Al lanzar Marca del cazador. También puedes restablecerlo gastando un espacio de nivel 4 o superior.');
      }
      break;
    case 'Guerrero':
      R('guerrero.energias', { tipo: 'recurso', nombre: 'Tomar aliento', max: byLvl(L, [[1, 2], [4, 3], [10, 4]]), recarga: 'corto1' });
      if (L >= 2) R('guerrero.oleada', { tipo: 'recurso', nombre: 'Acción súbita', max: L >= 17 ? 2 : 1, recarga: 'corto', nota: 'Solo una vez por turno.' });
      if (L >= 9) R('guerrero.indomito', { tipo: 'recurso', nombre: 'Indómito', max: byLvl(L, [[9, 1], [13, 2], [17, 3]]) });
      if (has(/maestro del combate|batalla/i) && L >= 7) uno('maestro.conoce', 'Conoce a tu enemigo', 'Acción adicional: sabes las inmunidades, resistencias y vulnerabilidades de una criatura a 9 m. También puedes recuperarlo gastando un dado de supremacía.');
      if (has(/maestro del combate|batalla/i) && L >= 3) R('maestro.supremacia', { tipo: 'recurso', nombre: 'Dados de supremacía', max: byLvl(L, [[3, 4], [7, 5], [15, 6]]), recarga: 'corto', nota: `Dado: ${L >= 18 ? 'd12' : L >= 10 ? 'd10' : 'd8'}. CD de las maniobras: ${cdManiobras(ch)}.${(ch.maniobras || []).length ? ` Maniobras: ${ch.maniobras.join(', ')}.` : ''}` });
      if (has(/psi[óo]nic/i)) {
        if (L >= 3) R('psionico.dados', { tipo: 'recurso', nombre: 'Dados de energía psiónica', ...dadosPsionicos(L), recarga: 'corto1' });
        if (L >= 7) uno('psionico.salto', 'Adepto telequinético (salto psiónico)', 'Velocidad volando doble hasta el final del turno. También puedes restablecerlo gastando un dado de energía psiónica.', 'corto');
        if (L >= 15) uno('psionico.bastion', 'Bastión de fuerza', 'También puedes restablecerlo gastando un dado de energía psiónica.');
        if (L >= 18) uno('psionico.maestro', 'Maestro telequinético', 'Telequinesis sin gastar espacio. También puedes restablecerlo gastando un dado de energía psiónica.');
      }
      if (has(/abanderad/i) && L >= 3) uno('abanderado.recuperacion', 'Recuperación grupal', `Al usar Tomar aliento, hasta ${mod('car')} aliados recuperan 1d4 + ${L} puntos de golpe.`, 'corto');
      break;
    case 'Hechicero':
      R('hechicero.innata', { tipo: 'recurso', nombre: 'Hechicería innata', max: 2 });
      if (L >= 2) R('hechicero.puntos', { tipo: 'recurso', nombre: 'Puntos de hechicería', max: L });
      if (L >= 5) uno('hechicero.recuperacion', 'Recuperación mágica', `Tras un descanso corto recuperas hasta ${Math.floor(L / 2)} puntos de hechicería.`);
      if (has(/salvaje/i) && L >= 3) uno('salvaje.mareas', 'Mareas del caos', 'Ventaja en una prueba de d20; se restablece tras una sobrecarga de magia salvaje.');
      if (has(/salvaje/i) && L >= 18) uno('salvaje.domada', 'Sobrecarga domada', 'Eliges el efecto de la tabla de sobrecarga en lugar de tirar.');
      if (has(/mec[áa]nic/i) && L >= 3) R('mecanica.equilibrio', { tipo: 'recurso', nombre: 'Restablecer equilibrio', max: mod('car'), nota: 'Reacción: anula la ventaja o la desventaja de una tirada de d20 a 18 m.' });
      if (has(/fuego m[áa]gico/i) && L >= 18) uno('fuegomagico.corona', 'Corona de fuego mágico', 'Al activar Hechicería innata. También puedes restablecerla gastando 5 puntos de hechicería.');
      if (has(/drac[óo]nic/i) && L >= 14) uno('draconica.alas', 'Alas de dragón', 'También puedes restablecerlas gastando 3 puntos de hechicería.');
      if (has(/drac[óo]nic/i) && L >= 18) uno('draconica.companero', 'Compañero dragón', 'Invocar dragón sin gastar espacio (y sin concentración si lo limitas a 1 minuto).');
      if (has(/mec[áa]nic/i) && L >= 18) uno('mecanica.cabalgata', 'Cabalgata mecánica', 'Cubo de 9 m: cura hasta 100 PG repartidos, repara objetos y disipa conjuros de nivel 6 o inferior. También puedes restablecerla gastando 7 puntos de hechicería.');
      if (has(/aberrant/i) && L >= 18) uno('aberrante.implosion', 'Implosión deformadora', 'También puedes restablecerla gastando 5 puntos de hechicería.');
      if (has(/mec[áa]nic/i) && L >= 14) uno('mecanica.trance', 'Trance de orden', 'También puedes restablecerlo gastando 5 puntos de hechicería.');
      break;
    case 'Mago':
      R('mago.recuperacion', { tipo: 'recuperar', nombre: 'Recuperación arcana', max: Math.ceil(L / 2), nivMax: 5, nota: 'Se usa al terminar un descanso corto.' });
      if (L >= 20) R('mago.caracteristicos', { tipo: 'recurso', nombre: 'Conjuros característicos', max: 2, recarga: 'corto', nota: 'Tus dos conjuros característicos de nivel 3, una vez cada uno a nivel 3 sin gastar espacio.' });
      if (has(/adivin|divin/i)) {
        if (L >= 3) R('adivino.presagio', { tipo: 'dados', nombre: 'Presagio', max: L >= 14 ? 3 : 2, dado: 'd20', nota: 'Sustituyen cualquier prueba de d20 tuya o de una criatura que veas; decídelo antes de tirar.' });
        if (L >= 10) uno('adivino.tercer', 'El tercer ojo', 'Acción adicional: lees cualquier idioma, ves invisibilidad sin gastar espacio o visión en la oscuridad de 36 m hasta tu siguiente descanso.', 'corto');
        if (L >= 6) R('adivino.avezado', { tipo: 'al_lanzar', nombre: 'Adivino avezado', escuela: 'Adivinación', espacioMin: 2, soloEspacio: true, efecto: 'recuperar', efectoN: 5 });
      }
      if (has(/hojacantante|cantante/i) && L >= 3) R('hojacantante.cancion', { tipo: 'recurso', nombre: 'Canción de la hoja', max: mod('int'), nota: `+${mod('int')} a la CA, +3 m de velocidad y ataques con Inteligencia durante 1 minuto. Recuperas un uso al usar Recuperación arcana.` });
      if (has(/abjur/i) && L >= 3) R('abjurador.salvaguarda', { tipo: 'recurso', nombre: 'Salvaguarda arcana', max: 2 * L + modOf(statsEfectivos(ch).int), nota: 'Puntos de golpe de la salvaguarda. Recupera el doble del nivel del espacio al lanzar abjuración.' });
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
      if (has(/misericordia/i) && L >= 11) R('misericordia.rafaga', { tipo: 'recurso', nombre: 'Ráfaga de curación y aflicción', max: mod('sab'), nota: 'Ráfaga de golpes con Mano de curación y Mano de aflicción sin gastar puntos de concentración.' });
      if (has(/misericordia/i) && L >= 17) uno('misericordia.suprema', 'Mano de misericordia suprema');
      break;
    case 'Paladín':
      R('paladin.manos', { tipo: 'recurso', nombre: 'Imponer las manos', max: 5 * L, reserva: 'PG', nota: 'Reserva de puntos de golpe para curar: gasta los que quieras con una acción adicional; 5 de ellos curan un veneno.' });
      if (L >= 2) uno('paladin.castigo', 'Castigo de paladín', 'Castigo divino sin gastar espacio.');
      if (L >= 3) R('paladin.canalizar', { tipo: 'recurso', nombre: 'Canalizar divinidad', max: L >= 11 ? 3 : 2, recarga: 'corto1' });
      if (L >= 5) uno('paladin.corcel', 'Corcel fiel', 'Hallar corcel sin gastar espacio.');
      if (has(/gloria/i) && L >= 15) R('gloria.defensa', { tipo: 'recurso', nombre: 'Defensa gloriosa', max: mod('car'), nota: `Reacción: +${mod('car')} a la CA de quien reciba un acierto a 3 m; si falla, atacas al atacante.` });
      if (has(/antiguos/i) && L >= 15) uno('antiguos.centinela', 'Centinela imperecedero', `Al caer a 0 PG sin morir, te quedas a 1 y recuperas ${3 * L} puntos de golpe.`);
      if (has(/genios/i) && L >= 15) R('genios.represalia', { tipo: 'recurso', nombre: 'Represalia elemental', max: mod('car'), nota: `Reacción: mitad de daño y el atacante sufre 2d10 + ${mod('car')} (salvación de Destreza, mitad).` });
      if (L >= 20) {
        const cap = has(/entrega|devoci/i) ? 'Halo sagrado' : has(/gloria/i) ? 'Leyenda viviente' : has(/antiguos/i) ? 'Campeón ancestral' : has(/venganza/i) ? 'Ángel vengador' : has(/genios/i) ? 'Vástago noble' : '';
        if (cap) uno('paladin.cumbre', cap, 'También puedes restablecerlo gastando un espacio de nivel 5.');
      }
      break;
    case 'Pícaro':
      if (has(/rebanaalmas|cuchilla|alma/i) && L >= 3) {
        R('rebanaalmas.dados', { tipo: 'recurso', nombre: 'Dados de energía psiónica', ...dadosPsionicos(L), recarga: 'corto1' });
        if (L >= 13) uno('rebanaalmas.velo', 'Velo psíquico', 'Acción de magia: invisible durante 1 hora. También puedes restablecerlo gastando un dado de energía psiónica.');
        if (L >= 17) uno('rebanaalmas.desgarro', 'Desgarro mental', 'También puedes restablecerlo gastando 3 dados de energía psiónica.');
      }
      if (has(/embaucador|arcan/i) && L >= 17) uno('embaucador.ladron', 'Ladrón de conjuros', 'Reacción: el lanzador hace una salvación de Inteligencia; si falla, anulas el conjuro sobre ti y lo tienes preparado 8 horas.');
      if (has(/v[áa]stago|tres/i) && L >= 3) R('vastago.sed', { tipo: 'recurso', nombre: 'Sed de sangre', max: mod('int'), recarga: L >= 17 ? 'corto1' : 'largo', nota: 'Reacción: te teletransportas junto a un enemigo que queda maltrecho y le atacas.' });
      if (L >= 20) uno('picaro.suerte', 'Golpe de suerte', '', 'corto');
      break;
  }
  return T;
}
function dadosPsionicos(L) {
  const [n, d] = L >= 17 ? [12, 'd12'] : L >= 13 ? [10, 'd10'] : L >= 11 ? [8, 'd10'] : L >= 9 ? [8, 'd8'] : L >= 5 ? [6, 'd8'] : [4, 'd6'];
  return { max: n, nota: `Dado: ${d}.` };
}

export function maxFrom(ch, r) {
  const L = nivelDe(ch), n = parseInt(r.maxN, 10);
  switch (r.maxBase) {
    case 'nivel': return L;
    case 'nivelx': return L * (n || 1);
    case 'mitad': return Math.ceil(L / 2);
    case 'mod': return Math.max(1, modOf(statsEfectivos(ch)[r.maxAb || 'car']));
    case 'comp': return competencia(L);
    default: return Math.max(0, n || 0);
  }
}

// Usos que dan la especie y las dotes (Manual del Jugador de 2024 y Héroes de Faerûn)
export function plantillasOrigen(ch) {
  const L = nivelTotal(ch), pb = competencia(L), T = [], especie = norm(ch.especie || '').split(/[\s(]/)[0];
  const R = (id, nombre, max, recarga = 'largo', nota = '') => T.push({ id: 'tpl:' + id, tpl: true, tipo: 'recurso', nombre, max, recarga, nota });
  const ESP = {
    draconido: () => { R('especie.aliento', 'Arma de aliento', pb, 'largo', 'Sustituye un ataque: cono de 4,5 m o línea de 9 m, salvación de Destreza.'); if (L >= 5) R('especie.vuelo', 'Vuelo dracónico', 1, 'largo', 'Acción adicional: velocidad volando igual a tu velocidad durante 10 minutos.'); },
    aasimar: () => { R('especie.manos', 'Manos curativas', 1, 'largo', `Curas ${pb}d4 a una criatura que toques.`); if (L >= 3) R('especie.revelacion', 'Revelación celestial', 1, 'largo', 'Te transformas durante 1 minuto.'); },
    enano: () => R('especie.piedra', 'Sentido de la piedra', pb, 'largo', 'Sentido de temblores 18 m durante 10 minutos.'),
    goliat: () => { R('especie.gigante', 'Ascendencia de gigante', pb, 'largo'); if (L >= 5) R('especie.grande', 'Forma grande', 1, 'largo', 'Te vuelves Grande durante 10 minutos.'); },
    orco: () => { R('especie.adrenalina', 'Descarga de adrenalina', pb, 'corto', 'Correr como acción adicional y ganas PG temporales.'); R('especie.aguante', 'Aguante incansable', 1, 'largo', 'Al caer a 0 PG, te quedas a 1.'); },
  };
  ESP[especie]?.();
  const vistos = new Set();
  for (const d of dotesDe(ch)) {
    const n = norm(d.nombre), D = (id, nombre, max, recarga, nota, extra = {}) => { if (vistos.has(id)) return; vistos.add(id); T.push({ id: 'tpl:' + id, tpl: true, tipo: 'recurso', nombre, max, recarga, nota, dote: n, ...extra }); };
    if (n === 'iniciado en la magia') D(`dote.iniciado.${norm(d.detalle || '')}`, `Iniciado en la magia${d.detalle ? ` (${d.detalle})` : ''}`, 1, 'largo', 'Lanzas su conjuro de nivel 1 sin gastar espacio.');
    for (const [id, nombre, max, recarga, nota, extra] of (USOS_DOTE[n] || [])) D(`dote.${id}`, nombre, max === 'pb' ? pb : max, recarga, nota, extra);
  }
  return T;
}
// Dotes con usos (Manual del Jugador y Héroes de Faerûn): [id, nombre, máximo ('pb' = bonificador por competencia), recarga, nota]
const USOS_DOTE = {
  afortunado: [['afortunado', 'Puntos de suerte', 'pb', 'largo', 'Gasta 1 para tener ventaja en una prueba con d20, o para imponer desventaja a un ataque contra ti.']],
  'azote de magos': [['azote', 'Mente robusta', 1, 'corto', 'Superas una salvación de Inteligencia, Sabiduría o Carisma que hayas fallado.']],
  'influencia feerica': [['feerica', 'Influencia feérica', 2, 'largo', 'Paso brumoso y tu conjuro de nivel 1, una vez cada uno sin gastar espacio.']],
  'influencia sombria': [['sombria', 'Influencia sombría', 2, 'largo', 'Invisibilidad y tu conjuro de nivel 1, una vez cada uno sin gastar espacio.']],
  telepatico: [['telepatico', 'Telepático (detectar pensamientos)', 1, 'largo', 'Detectar pensamientos sin gastar espacio ni componentes.']],
  'lanzador ritual': [['ritual', 'Ritual rápido', 1, 'largo', 'Lanzas uno de tus rituales con su tiempo normal sin gastar espacio.']],
  'aprendiz del dragon purpura': [['dragon', 'Aprendiz del Dragón Púrpura', 1, 'largo', 'Das inspiración heroica a tantas criaturas a 9 m como tu bonificador por competencia.']],
  'chispa del fuego magico': [['chispa', 'Chispa del fuego mágico', 'pb', 'largo', 'Lanzas su truco como acción adicional.']],
  'iniciado del culto del dragon': [['culto', 'Terror del dragón', 1, 'corto', 'Ganas inspiración heroica al asustar a una criatura.']],
  'comandante del dragon purpura': [['comandante', 'Alentar a aliado', 'pb', 'largo', 'Acción adicional: un aliado a 9 m gana 2d6 + tu modificador de puntos de golpe temporales.']],
  'determinacion senorial': [['senorial', 'Determinación señorial', 1, 'largo', '']],
  'embaucador feerico': [['embaucador', 'Golpe desquiciador', 'pb', 'largo', 'Al acertar: salvación de Sabiduría o desventaja en sus salvaciones hasta el final de tu siguiente turno.']],
  'magia de genio': [['genio', 'Magia de genio', 1, 'largo', 'Un conjuro de hechicero de nivel 1 sin gastar espacio.']],
  'magia del enclave': [['enclave', 'Magia del enclave', 1, 'largo', 'Sentidos de la bestia sin gastar espacio.']],
  'tocado por los mythales': [['mythales', 'Tocado por los mythales', 'pb', 'largo', '']],
  'don de la absorcion de almas': [['almas', 'Absorción de almas', 1, 'corto', 'Reacción: recuperas 50 PG cuando un enemigo a 36 m cae a 0.']],
  'don de las formas fluidas': [['formas', 'Formas fluidas', 1, 'largo', '']],
  'don del fulgor exquisito': [['fulgor', 'Fulgor poderoso', 1, 'largo', 'El daño radiante de una tirada usa el máximo de cada dado.']],
  'don del jolgorio': [['jolgorio', 'A bailar', 1, 'largo', 'Baile irresistible de Otto sin gastar espacio.']],
  'don del terror': [['terror', '¡Huid, mentecatos!', 1, 'corto', 'Reacción: una criatura asustada hace una salvación de Sabiduría o huye.']],
  'don del destino': [['destino', 'Don del destino', 1, 'corto', 'Suma o resta 2d4 a una prueba con d20. También se recupera al tirar iniciativa.']],
  'don de la recuperacion': [['ultima', 'Última defensa', 1, 'largo', 'Al caer a 0 PG te quedas a 1 y recuperas la mitad de tus PG máximos.'],
    ['vitalidad', 'Recuperar vitalidad', 10, 'largo', 'Reserva de d10: acción adicional para gastar dados y curarte lo que saques.']],
};
export function reglas(ch, todas = false) {
  const sust = new Set(ch.rasgosOff || []), ocultos = new Set(ch.rasgosOcultos || []);
  const list = [
    ...[...clasesDe(ch).flatMap(c => plantillas(vistaClase(ch, c))), ...plantillasOrigen(ch)].map(r => ({ ...r, sustituida: sust.has(r.id), oculto: ocultos.has(r.id) })),
    ...(ch.rasgos || []).map(r => ({ ...r, tpl: false, oculto: !!r.off, max: maxFrom(ch, r.tipo === 'dados' ? { ...r, maxBase: 'fijo' } : r) })),
  ];
  return todas ? list : list.filter(r => !r.sustituida);
}
export const reglasVisibles = ch => reglas(ch).filter(r => !r.oculto);

export function castTriggerDesc(r) {
  const cond = `Al lanzar ${r.escuela ? `un conjuro de ${r.escuela.toLowerCase()}` : 'un conjuro'}${r.espacioMin ? ` con un espacio de nivel ${r.espacioMin} o superior` : ''}`;
  const ef = r.efecto === 'recuperar' ? `recuperas un espacio gastado de nivel inferior al usado (máx. ${r.efectoN || 5})` : (r.texto || 'aviso sin texto');
  return `${cond}: ${ef}.`;
}
export function ruleSummary(r) {
  const nota = r.nota ? ' ' + r.nota : '';
  switch (r.tipo) {
    case 'recurso': return `${r.max} ${r.max === 1 ? 'uso' : 'usos'}; ${etiquetaRecarga(r, true)}.${nota}`;
    case 'dados': return `${r.max}${r.dado || 'd20'} anotados tras un descanso largo.${nota}`;
    case 'recuperar': return `Hasta ${r.max} niveles de espacios (ninguno de nivel ${(r.nivMax || 5) + 1}+), una vez por descanso largo.${nota}`;
    case 'al_lanzar': return castTriggerDesc(r);
    default: return '';
  }
}
export const schoolMatch = (s, escuela) => !escuela || norm(s.escuela || '').slice(0, 5) === norm(escuela).slice(0, 5);
export const castSchools = ch => reglas(ch).filter(r => r.tipo === 'al_lanzar' && r.escuela).map(r => norm(r.escuela).slice(0, 5));
export const hasShortRest = (ch, P) => !!P.pact || (ch.clase === 'Brujo' && ch.espaciosManuales)
  || reglas(ch).some(r => (r.tipo === 'recurso' && ['corto', 'corto1'].includes(r.recarga)) || (r.recarga === 'dado' && r.recMomento === 'corto') || r.tipo === 'recuperar');

// Conjuros que un rasgo o una dote deja lanzar sin gastar espacio: al tocarlos se gasta ese uso antes que un espacio
export const RECURSO_DE_CONJURO = {
  'marca del cazador': ['tpl:explorador.enemigo'], 'castigo divino': ['tpl:paladin.castigo'], 'hallar corcel': ['tpl:paladin.corcel'],
  'paso brumoso': ['tpl:feerico.pasos', 'tpl:errante.brumoso'], 'saeta guia': ['tpl:estrellas.mapa'], 'invocar feerico': ['tpl:errante.refuerzos', 'tpl:ilusionista.criaturas'],
  'invocar bestia': ['tpl:ilusionista.criaturas'], 'contactar con otro plano': ['tpl:brujo.contactar'], 'telequinesis': ['tpl:psionico.maestro'], 'invocar dragon': ['tpl:draconica.companero'],
  'sentidos de la bestia': ['tpl:dote.enclave'], 'baile irresistible de otto': ['tpl:dote.jolgorio'],
};
// Los conjuros que da una dote llevan su nombre como fuente: su uso gratis sale del contador de la dote
const RECURSO_DE_FUENTE = [[/^iniciado en la magia(?: \((.+)\))?/, m => `tpl:dote.iniciado.${norm(m[1] || '')}`], [/^influencia feerica/, () => 'tpl:dote.feerica'],
  [/^influencia sombria/, () => 'tpl:dote.sombria'], [/^telepatico/, () => 'tpl:dote.telepatico']];
export function recursoParaConjuro(ch, nombre, fuente = '') {
  const f = norm(fuente), porFuente = RECURSO_DE_FUENTE.map(([re, id]) => { const m = re.exec(f); return m ? id(m) : null; }).filter(Boolean);
  const ids = [...porFuente, ...(RECURSO_DE_CONJURO[norm(nombre)] || [])]; if (!ids.length) return null;
  return reglas(ch).find(r => ids.includes(r.id) && r.tipo === 'recurso' && usosGastados(ch, r) < r.max) || null;
}
export function recState(ch, id) {
  ch.play.rec = ch.play.rec || {};
  return (ch.play.rec[id] = ch.play.rec[id] || { used: 0, dice: [] });
}
export const usosGastados = (ch, r) => clamp(recState(ch, r.id).used || 0, 0, r.max);
