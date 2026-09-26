// Un combate por rondas con un grupo de cuatro (marciales y lanzadores) usando solo las reglas del dominio
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { perfil } from '../web/src/domain/reglas2024.js';
import { reglas, recState, recuperarEnDescanso, usosGastados } from '../web/src/domain/rasgos.js';
import { empezarCombate, registrarAtaque, siguienteTurno, combateDe } from '../web/src/domain/combate.js';
import { ataquesPorAccion } from '../web/src/domain/maestria.js';
import { PREDEFINIDOS, anadirComun, alternarEquipado, ataqueArma } from '../web/src/domain/equipo.js';
import { aplicarDano, curar, pasarRonda, cambiarConc, ponerEfecto, pgActuales, pgMaximo, salvacionMuerte, estadoVital, descansoLargoVida, gastarDadoGolpe, dadosDeGolpe, ponerTemporales } from '../web/src/domain/vida.js';
import { caEfectiva, modsTirada, resolverModo } from '../web/src/domain/efectos.js';
import { bonoSalvacion } from '../web/src/domain/habilidades.js';

const st = o => ({ fue: 10, des: 10, con: 14, int: 10, sab: 10, car: 10, ...o });
const pj = o => normChar(blankChar(o));
const equipar = (ch, n) => { const o = anadirComun(ch, structuredClone(PREDEFINIDOS.find(x => x.nombre === n))); alternarEquipado(ch, o.id); return o; };
const usar = (ch, id, n = 1) => { recState(ch, id).used = (recState(ch, id).used || 0) + n; };
const descansoCorto = ch => reglas(ch).forEach(r => { if (r.tipo === 'recurso') recState(ch, r.id).used = recuperarEnDescanso(r, usosGastados(ch, r), 'corto').usados; });

test('combate simulado: guerrero, bárbaro, maga y clérigo durante tres rondas y los descansos', () => {
  const guerrero = pj({ nombre: 'Guerrera', clase: 'Guerrero', subclase: 'Campeón', nivel: 11, stats: st({ fue: 20 }), dotes: ['Defensa'] });
  const barbaro = pj({ nombre: 'Bárbaro', clase: 'Bárbaro', subclase: 'Senda del berserker', nivel: 9, stats: st({ fue: 18, des: 14, con: 16 }) });
  const maga = pj({ nombre: 'Maga', clase: 'Mago', subclase: 'Evocador', nivel: 9, stats: st({ int: 20, des: 14 }) });
  const clerigo = pj({ nombre: 'Clérigo', clase: 'Clérigo', subclase: 'Dominio de la vida', nivel: 9, stats: st({ sab: 18 }), ordenes: { 'Clérigo': 'Protector' } });
  const espada = equipar(guerrero, 'Espadón'); equipar(guerrero, 'Cota de mallas');
  const hacha = equipar(barbaro, 'Hacha a dos manos');
  equipar(clerigo, 'Armadura de placas'); equipar(clerigo, 'Escudo');
  const grupo = [guerrero, barbaro, maga, clerigo];
  grupo.forEach(empezarCombate);

  // Números de partida
  assert.equal(caEfectiva(guerrero).ca, 17);                 // cota de mallas 16 + Defensa
  assert.equal(caEfectiva(barbaro).ca, 15);                  // 10 + Des 2 + Con 3
  assert.equal(caEfectiva(clerigo).ca, 20);                  // placas (Protector) + escudo
  assert.equal(resolverModo(modsTirada(clerigo, { sobre: 'ataque' })), 'normal');
  assert.equal(ataquesPorAccion(guerrero), 3);
  assert.equal(ataqueArma(guerrero, espada).ataque, '+9');

  // Ronda 1: la guerrera ataca tres veces y usa Acción súbita para otra acción de Ataque
  for (let i = 0; i < 3; i++) assert.equal(registrarAtaque(guerrero, { max: 3 }).tipo, 'accion');
  assert.equal(registrarAtaque(guerrero, { max: 3 }).tipo, 'agotado');
  usar(guerrero, 'tpl:guerrero.oleada');
  assert.equal(reglas(guerrero).find(r => r.id === 'tpl:guerrero.oleada').max - usosGastados(guerrero, reglas(guerrero).find(r => r.id === 'tpl:guerrero.oleada')), 0);
  // El bárbaro entra en furia: ventaja en Fuerza y +3 al daño
  usar(barbaro, 'tpl:barbaro.furia'); ponerEfecto(barbaro, 'furia');
  assert.equal(ataqueArma(barbaro, hacha).expr, '1d12+7');
  assert.equal(registrarAtaque(barbaro, { max: ataquesPorAccion(barbaro) }).max, 2);
  // La maga se concentra en Acelerar sobre sí misma: +2 CA y ventaja en salvaciones de Destreza
  const P = perfil(maga); assert.deepEqual(P.slots, { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 });
  maga.play.used[3] = 1; cambiarConc(maga, 'Acelerar', 10); ponerEfecto(maga, 'acelerar', { conc: 'Acelerar' });
  assert.equal(caEfectiva(maga).ca, 14);
  // El clérigo bendice al grupo (su propia Bendición) y gasta Canalizar divinidad en Preservar vida
  clerigo.play.used[1] = 1; cambiarConc(clerigo, 'Bendición', 10); ponerEfecto(clerigo, 'bendicion', { conc: 'Bendición' });
  usar(clerigo, 'tpl:clerigo.canalizar');
  assert.ok(modsTirada(clerigo, { sobre: 'salvacion', ab: 'con' }).some(m => m.fuente === 'Bendición'));

  // Los enemigos golpean: la maga pierde PG y debe salvar la concentración (CD 10 por 14 de daño)
  const r1 = aplicarDano(maga, 14);
  assert.equal(r1.concentracion.cd, 10); assert.equal(pgActuales(maga), pgMaximo(maga) - 14);
  grupo.forEach(ch => { pasarRonda(ch); siguienteTurno(ch); });
  assert.equal(combateDe(guerrero).ronda, 2); assert.equal(combateDe(guerrero).turno.accion, false);

  // Ronda 2: un crítico brutal deja a la maga a 0; el clérigo la cura
  aplicarDano(maga, 200);
  assert.equal(estadoVital(maga), 'muerto');                 // daño masivo: el sobrante supera sus PG máximos
  const maga2 = pj({ nombre: 'Maga', clase: 'Mago', nivel: 9, stats: st({ int: 20 }) });
  const r2 = aplicarDano(maga2, pgMaximo(maga2) + 5);
  assert.equal(r2.cayo, true); assert.equal(estadoVital(maga2), 'moribundo');
  assert.equal(salvacionMuerte(maga2, 12), 'exito'); assert.equal(salvacionMuerte(maga2, 1), 'fallo');
  assert.deepEqual(maga2.vida.muerte, { exitos: 1, fallos: 2 });
  assert.equal(curar(maga2, 9), 9); assert.equal(estadoVital(maga2), 'vivo'); assert.deepEqual(maga2.vida.muerte, { exitos: 0, fallos: 0 });
  // Temporales primero
  ponerTemporales(barbaro, 8); aplicarDano(barbaro, 10);
  assert.equal(barbaro.vida.temp, 0); assert.equal(pgActuales(barbaro), pgMaximo(barbaro) - 2);

  // Ronda 3: el aura del tiempo; Acelerar dura 10 rondas y la Bendición también
  for (let i = 0; i < 8; i++) pasarRonda(clerigo);            // ya pasó una ronda arriba
  const fin = pasarRonda(clerigo);
  assert.ok(fin.some(e => e.nombre === 'Bendición')); assert.equal(clerigo.play.conc, '');

  // Descanso corto: la guerrera recupera Acción súbita, el bárbaro un uso de Furia; dados de golpe
  descansoCorto(guerrero); descansoCorto(barbaro); descansoCorto(clerigo);
  assert.equal(usosGastados(guerrero, reglas(guerrero).find(r => r.id === 'tpl:guerrero.oleada')), 0);
  assert.equal(usosGastados(barbaro, reglas(barbaro).find(r => r.id === 'tpl:barbaro.furia')), 0);
  assert.equal(usosGastados(clerigo, reglas(clerigo).find(r => r.id === 'tpl:clerigo.canalizar')), 0);
  const antes = pgActuales(barbaro), g = gastarDadoGolpe(barbaro, 'd12', 7);
  assert.equal(g.total, 10); assert.equal(pgActuales(barbaro), Math.min(pgMaximo(barbaro), antes + 10));
  assert.equal(dadosDeGolpe(barbaro)[0].quedan, 8);
  // Descanso largo: todo vuelve
  descansoLargoVida(barbaro);
  assert.equal(pgActuales(barbaro), pgMaximo(barbaro)); assert.equal(barbaro.vida.efectos.length, 0); assert.equal(dadosDeGolpe(barbaro)[0].quedan, 9);
  // El Aura de protección aparece a nivel 6 de paladín y suma el Carisma a sus salvaciones
  const pal = pj({ clase: 'Paladín', nivel: 6, stats: st({ car: 16 }) });
  assert.equal(bonoSalvacion(pal, 'sab') - bonoSalvacion(pj({ clase: 'Paladín', nivel: 5, stats: st({ car: 16 }) }), 'sab'), 3);
});
