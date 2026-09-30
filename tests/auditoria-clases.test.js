import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { conjurosAutomaticos, escalas } from '../web/src/domain/clases2024.js';
import { opcionesDe, opcionesPendientes, opcionesCambiables, normOpciones } from '../web/src/domain/opcionesRasgo.js';
import { opcionesIntercambio } from '../web/src/domain/intercambios.js';
import { alTirarIniciativa, alEmpezarTurno, curacionDeRecurso, aplicarCuracion, rangoCritico, minimoD20Habilidad, temporalesAlEnfurecer, totalMinimoFuerza } from '../web/src/domain/automatismos.js';
import { reglas, recState } from '../web/src/domain/rasgos.js';
import { vidaDe, aplicarDano, pgActuales, pgMaximo } from '../web/src/domain/vida.js';
import { opcionesAlImpactar, danoSiempre, gastarAlImpactar } from '../web/src/domain/alImpactar.js';
import { PREDEFINIDOS, golpeSinArmas } from '../web/src/domain/equipo.js';
import { ponerEfecto } from '../web/src/domain/vida.js';
import { modsTirada } from '../web/src/domain/efectos.js';
import { velocidad } from '../web/src/domain/habilidades.js';
import { rasgosEnJuego } from '../web/src/domain/enJuego.js';
import { sobrantesAutomaticos } from '../web/src/domain/progresion.js';
import { perfil, magiaPara } from '../web/src/domain/reglas2024.js';

const stats = { fue: 16, des: 16, con: 14, int: 12, sab: 14, car: 14 };
const ch = o => normChar(blankChar({ stats, ...o }));
const arma = n => JSON.parse(JSON.stringify(PREDEFINIDOS.find(p => p.nombre === n)));
const seis = () => 6;

test('Círculo de la tierra: los conjuros siguen al terreno elegido (Árido si no se ha elegido)', () => {
  const d = ch({ clase: 'Druida', subclase: 'Círculo de la tierra', nivel: 5 });
  assert.ok(conjurosAutomaticos(d).some(c => c.nombre === 'Bola de fuego'));
  d.opciones = { 'tierra.terreno': 'Polar' };
  const n = conjurosAutomaticos(d).map(c => c.nombre);
  assert.ok(n.includes('Tormenta de aguanieve') && n.includes('Rayo de escarcha') && !n.includes('Bola de fuego'));
  assert.deepEqual(opcionesPendientes(ch({ clase: 'Druida', subclase: 'Círculo de la tierra', nivel: 3 })).map(o => o.id), ['tierra.terreno']);
});
test('Círculo de la tierra: al cambiar de terreno, los del anterior dejan de estar siempre preparados', () => {
  const d = ch({ clase: 'Druida', subclase: 'Círculo de la tierra', nivel: 3, opciones: { 'tierra.terreno': 'Templado' } });
  const db = { catalog: { a: { es: 'Manos ardientes' }, b: { es: 'Dormir' } } };
  d.book = [{ sid: 'a', always: true, prep: true, fuente: 'Conjuros del círculo de la tierra' }, { sid: 'b', always: true, prep: true, fuente: 'Conjuros del círculo de la tierra' }];
  assert.deepEqual(sobrantesAutomaticos(db, d).map(e => db.catalog[e.sid].es), ['Manos ardientes']);
});
test('opciones de rasgo: se guardan normalizadas y avisan en el descanso adecuado', () => {
  assert.deepEqual(normOpciones({ 'cazador.presa': 'asesino de colosos', 'x': 'y', 'tierra.terreno': 'Lunar' }), { 'cazador.presa': 'Asesino de colosos' });
  const e = ch({ clase: 'Explorador', subclase: 'Cazador', nivel: 7 });
  assert.deepEqual(opcionesDe(e).map(d => d.id), ['cazador.presa', 'cazador.tacticas']);
  assert.equal(opcionesCambiables(e, 'corto').length, 2);
  assert.ok(opcionesIntercambio(e, 'corto').some(o => /El cazador y la presa/.test(o.titulo)));
  const b = ch({ clase: 'Bárbaro', subclase: 'Senda del corazón salvaje', nivel: 6 });
  assert.deepEqual(opcionesCambiables(b, 'corto').map(d => d.id), []);
  assert.deepEqual(opcionesCambiables(b, 'largo').map(d => d.id), ['corazon.aspecto']);
  assert.deepEqual(opcionesPendientes(b).map(d => d.id), ['corazon.aspecto'], 'Furia de lo salvaje se elige al enfurecerse');
});
test('En juego: el rasgo con opciones la muestra y deja elegirla', () => {
  const d = ch({ clase: 'Druida', subclase: 'Círculo de la tierra', nivel: 3, opciones: { 'tierra.terreno': 'Tropical' } });
  const r = rasgosEnJuego(d).find(x => x.nombre === 'Conjuros del círculo de la tierra');
  assert.equal(r.eleccion.actual, 'Tropical');
  assert.equal(r.eleccion.cambia, 'largo');
  assert.equal(r.numeros[0].valor, 'Tropical');
});
test('Asesino de colosos: +1d8 una vez por turno al impactar', () => {
  const e = ch({ clase: 'Explorador', subclase: 'Cazador', nivel: 3, opciones: { 'cazador.presa': 'Asesino de colosos' } });
  const op = opcionesAlImpactar(e, arma('Arco largo')).find(o => o.k === 'op:Asesino de colosos');
  assert.equal(op.dado, '1d8'); assert.ok(op.unaVez);
});

test('iniciativa: Metabolismo asombroso recupera concentración y cura nivel + dado de artes marciales', () => {
  const m = ch({ clase: 'Monje', nivel: 6 });
  recState(m, 'tpl:monje.concentracion').used = 4; aplicarDano(m, 20);
  const antes = pgActuales(m), out = alTirarIniciativa(m, seis);
  assert.equal(out[0].nombre, 'Metabolismo asombroso');
  assert.equal(recState(m, 'tpl:monje.concentracion').used, 0);
  assert.equal(pgActuales(m), antes + 6 + 6);
  assert.equal(recState(m, 'tpl:monje.metabolismo').used, 1);
  recState(m, 'tpl:monje.concentracion').used = 2;
  assert.deepEqual(alTirarIniciativa(m, seis), [], 'solo una vez por descanso largo');
});
test('iniciativa: Concentración perfecta (monje 15) sube a 4 puntos si no usas Metabolismo', () => {
  const m = ch({ clase: 'Monje', nivel: 15 });
  recState(m, 'tpl:monje.metabolismo').used = 1; recState(m, 'tpl:monje.concentracion').used = 14;
  alTirarIniciativa(m);
  assert.equal(15 - recState(m, 'tpl:monje.concentracion').used, 4);
});
test('iniciativa: Furia persistente (bárbaro 15) e Inspiración superior (bardo 18)', () => {
  const b = ch({ clase: 'Bárbaro', nivel: 15 });
  assert.ok(reglas(b).some(r => r.id === 'tpl:barbaro.persistente'));
  recState(b, 'tpl:barbaro.furia').used = 3;
  assert.equal(alTirarIniciativa(b)[0].nombre, 'Furia persistente');
  assert.equal(recState(b, 'tpl:barbaro.furia').used, 0);
  recState(b, 'tpl:barbaro.furia').used = 1;
  assert.deepEqual(alTirarIniciativa(b), []);
  const bardo = ch({ clase: 'Bardo', nivel: 18, stats: { ...stats, car: 20 } });
  recState(bardo, 'tpl:bardo.inspiracion').used = 5;
  alTirarIniciativa(bardo);
  assert.equal(recState(bardo, 'tpl:bardo.inspiracion').used, 3);
});
test('inicio de turno: Guerrero heroico da inspiración y Superviviente cura si estás maltrecho', () => {
  const g = ch({ clase: 'Guerrero', subclase: 'Campeón', nivel: 18 });
  aplicarDano(g, pgMaximo(g) - 10);
  const antes = pgActuales(g), out = alEmpezarTurno(g);
  assert.deepEqual(out.map(x => x.nombre), ['Guerrero heroico', 'Superviviente']);
  assert.equal(vidaDe(g).inspiracion, true);
  assert.equal(pgActuales(g), antes + 5 + 2);
  assert.deepEqual(alEmpezarTurno(ch({ clase: 'Guerrero', subclase: 'Campeón', nivel: 9 })), []);
});
test('usos que curan: Tomar aliento se tira y se aplica solo; Luz sanadora se ofrece', () => {
  const g = ch({ clase: 'Guerrero', nivel: 4 });
  const c = curacionDeRecurso(g, 'tpl:guerrero.energias');
  assert.deepEqual(c, { tipo: 'cura', expr: '1d10+4', solo: true });
  aplicarDano(g, 20); const antes = pgActuales(g);
  assert.equal(aplicarCuracion(g, c, seis).aplicado, 10); assert.equal(pgActuales(g), antes + 10);
  assert.equal(curacionDeRecurso(ch({ clase: 'Brujo', subclase: 'Patrón celestial', nivel: 3 }), 'tpl:celestial.luz').solo, false);
  assert.equal(curacionDeRecurso(ch({ clase: 'Explorador', nivel: 10 }), 'tpl:explorador.infatigable').tipo, 'temp');
});
test('Campeón: crítico con 19 (nivel 3) y con 18 (nivel 15)', () => {
  assert.equal(rangoCritico(ch({ clase: 'Guerrero', nivel: 3 })), 20);
  assert.equal(rangoCritico(ch({ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 })), 19);
  assert.equal(rangoCritico(ch({ clase: 'Guerrero', subclase: 'Campeón', nivel: 15 })), 18);
});
test('Talentos fiables y Poderío indómito', () => {
  const p = ch({ clase: 'Pícaro', nivel: 7, habilidades: { sigilo: 1 } });
  assert.equal(minimoD20Habilidad(p, 'sigilo'), 10);
  assert.equal(minimoD20Habilidad(p, 'historia'), 0);
  assert.equal(minimoD20Habilidad(ch({ clase: 'Pícaro', nivel: 6, habilidades: { sigilo: 1 } }), 'sigilo'), 0);
  assert.equal(totalMinimoFuerza(ch({ clase: 'Bárbaro', nivel: 18 }), 'fue'), 16);
  assert.equal(totalMinimoFuerza(ch({ clase: 'Bárbaro', nivel: 18 }), 'des'), 0);
});
test('pasivos: Atleta sobresaliente y Asesinar dan ventaja en iniciativa', () => {
  assert.ok(modsTirada(ch({ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 }), { sobre: 'iniciativa' }).some(m => m.fuente === 'Atleta sobresaliente'));
  assert.ok(modsTirada(ch({ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 }), { sobre: 'prueba', hab: 'atletismo' }).some(m => m.efecto === 'ventaja'));
  assert.ok(modsTirada(ch({ clase: 'Pícaro', subclase: 'Asesino', nivel: 3 }), { sobre: 'iniciativa' }).some(m => m.fuente === 'Asesinar'));
});
test('Errante (explorador 6): +3 m salvo con armadura pesada', () => {
  const e = ch({ clase: 'Explorador', nivel: 6 });
  assert.equal(velocidad(e), 12);
  e.equipo.objetos.push({ ...JSON.parse(JSON.stringify(PREDEFINIDOS.find(p => p.nombre === 'Cota de mallas'))), equipado: true });
  assert.equal(velocidad(e), 9);
});
test('furia: Frenesí del berserker y Furia divina del fanático solo en furia; Vitalidad del árbol', () => {
  const b = ch({ clase: 'Bárbaro', subclase: 'Senda del berserker', nivel: 9 });
  assert.ok(!opcionesAlImpactar(b, arma('Hacha a dos manos')).some(o => o.k === 'frenesi'));
  ponerEfecto(b, 'furia');
  assert.equal(opcionesAlImpactar(b, arma('Hacha a dos manos')).find(o => o.k === 'frenesi').dado, '3d6');
  const f = ch({ clase: 'Bárbaro', subclase: 'Senda del fanático', nivel: 6 }); ponerEfecto(f, 'furia');
  assert.equal(opcionesAlImpactar(f, arma('Espada larga')).find(o => o.k === 'furiadivina').dado, '1d6+3');
  assert.equal(temporalesAlEnfurecer(ch({ clase: 'Bárbaro', subclase: 'Senda del Árbol del Mundo', nivel: 5 })), 5);
});
test('monje: Golpe aturdidor gasta 1 punto de concentración; Mano de aflicción solo sin armas', () => {
  const m = ch({ clase: 'Monje', subclase: 'Guerrero de la misericordia', nivel: 5 });
  const ops = opcionesAlImpactar(m, golpeSinArmas(m));
  const at = ops.find(o => o.k === 'aturdidor');
  assert.match(at.nota, /CD 13/); assert.equal(at.dado, '');
  assert.equal(ops.find(o => o.k === 'afliccion').dado, '1d8+2');
  assert.ok(!opcionesAlImpactar(m, arma('Espada larga')).some(o => o.k === 'aturdidor'), 'la espada larga no es arma de monje');
  gastarAlImpactar(m, [at]);
  assert.equal(recState(m, 'tpl:monje.concentracion').used, 1);
});
test('Golpe psiónico, Golpe pavoroso, Golpes pavorosos y conjuros de concentración que suman daño', () => {
  assert.equal(opcionesAlImpactar(ch({ clase: 'Guerrero', subclase: 'Guerrero psiónico', nivel: 5 }), arma('Espada larga')).find(o => o.k === 'psionico').dado, '1d8+1');
  assert.ok(opcionesAlImpactar(ch({ clase: 'Explorador', subclase: 'Acechador en la penumbra', nivel: 3 }), arma('Arco largo')).some(o => o.k === 'pavoroso'));
  assert.equal(opcionesAlImpactar(ch({ clase: 'Explorador', subclase: 'Errante feérico', nivel: 11 }), arma('Arco largo')).find(o => o.k === 'pavorosos').dado, '1d6');
  const e = ch({ clase: 'Explorador', nivel: 2 }); e.play.conc = 'Marca del cazador';
  assert.equal(opcionesAlImpactar(e, arma('Arco largo')).find(o => o.k === 'marca').dado, '1d6');
});
test('Golpes radiantes (paladín 11): +1d8 radiante cuerpo a cuerpo', () => {
  assert.deepEqual(danoSiempre(ch({ clase: 'Paladín', nivel: 11 }), arma('Espada larga')), [{ fuente: 'Golpes radiantes (radiante)', valor: '1d8' }]);
  assert.deepEqual(danoSiempre(ch({ clase: 'Paladín', nivel: 11 }), arma('Arco largo')), []);
  assert.deepEqual(danoSiempre(ch({ clase: 'Paladín', nivel: 10 }), arma('Espada larga')), []);
});
test('números de clase: CD de concentración del monje y de golpe astuto', () => {
  assert.equal(escalas(ch({ clase: 'Monje', nivel: 5 })).find(e => e.nombre === 'CD de concentración').valor, '13');
  assert.equal(escalas(ch({ clase: 'Pícaro', nivel: 5 })).find(e => e.nombre === 'CD de golpe astuto').valor, '14');
});
test('conjuros de subclases sin lanzamiento usan su característica (monje de la sombra: Sabiduría)', () => {
  const m = ch({ clase: 'Monje', subclase: 'Guerrero de la sombra', nivel: 3 });
  const P = magiaPara(perfil(m), 'Guerrero de la sombra');
  assert.equal(P.cd, 8 + 2 + 2);
  assert.ok(conjurosAutomaticos(ch({ clase: 'Guerrero', subclase: 'Guerrero psiónico', nivel: 18 })).some(c => c.nombre === 'Telequinesis'));
});

test('inmunidades a estados: Aura de coraje, Aura de entrega y Furia irracional', async () => {
  const { inmunidadesEstado } = await import('../web/src/domain/efectos.js');
  const p = ch({ clase: 'Paladín', subclase: 'Juramento de entrega', nivel: 10 });
  vidaDe(p).estados = ['asustado'];
  assert.deepEqual([...inmunidadesEstado(p).keys()].sort(), ['asustado', 'encantado']);
  assert.ok(!modsTirada(p, { sobre: 'ataque' }).some(m => m.fuente === 'Asustado'));
  const b = ch({ clase: 'Bárbaro', subclase: 'Senda del berserker', nivel: 6 });
  assert.equal(inmunidadesEstado(b).size, 0); ponerEfecto(b, 'furia');
  assert.equal(inmunidadesEstado(b).get('encantado'), 'Furia irracional');
});
test('efectos de rasgo: Arma sagrada suma el Carisma al ataque; Puntería certera deja la velocidad a 0', async () => {
  const { velocidadEfectiva, EFECTO_DE_RASGO } = await import('../web/src/domain/efectos.js');
  const p = ch({ clase: 'Paladín', subclase: 'Juramento de entrega', nivel: 3 }); ponerEfecto(p, 'armasagrada');
  assert.equal(modsTirada(p, { sobre: 'ataque' }).find(m => m.fuente === 'Arma sagrada').valor, 2);
  const r = ch({ clase: 'Pícaro', nivel: 3 }); ponerEfecto(r, 'punteria');
  assert.equal(velocidadEfectiva(r).m, 0);
  assert.equal(EFECTO_DE_RASGO['voto de enemistad'].gasta, 'tpl:paladin.canalizar');
});
test('explorador: Cazador implacable protege la Marca del cazador; acechador suma Sabiduría a la iniciativa', async () => {
  const { iniciativa, salvacionesCompetentes, bonoHabilidad } = await import('../web/src/domain/habilidades.js');
  const e = ch({ clase: 'Explorador', nivel: 13 }); e.play.conc = 'Marca del cazador';
  assert.equal(aplicarDano(e, 12).concentracion, null);
  const e2 = ch({ clase: 'Explorador', nivel: 12 }); e2.play.conc = 'Marca del cazador';
  assert.equal(aplicarDano(e2, 12).concentracion.cd, 10);
  const a = ch({ clase: 'Explorador', subclase: 'Acechador en la penumbra', nivel: 7 });
  assert.equal(iniciativa(a), 3 + 2);
  assert.ok(salvacionesCompetentes(a).has('sab'));
  const f = ch({ clase: 'Explorador', subclase: 'Errante feérico', nivel: 3 });
  assert.equal(bonoHabilidad(f, 'persuasion'), 2 + 2);
});
test('Aura de celeridad (gloria 7): +3 m de velocidad', () => {
  assert.equal(velocidad(ch({ clase: 'Paladín', subclase: 'Juramento de gloria', nivel: 7 })), 12);
  assert.equal(velocidad(ch({ clase: 'Paladín', subclase: 'Juramento de gloria', nivel: 6 })), 9);
});

test('lanzadores: Astucia mágica, Recuperación mágica y Forma salvaje al gastarse', async () => {
  const { alGastarRecurso } = await import('../web/src/domain/automatismos.js');
  const b = ch({ clase: 'Brujo', nivel: 11 }); b.play.used = { 5: 3 };
  assert.match(alGastarRecurso(b, 'tpl:brujo.astucia')[0], /Recuperas 2 espacios/); assert.equal(b.play.used[5], 1);
  const b20 = ch({ clase: 'Brujo', nivel: 20 }); b20.play.used = { 5: 4 }; alGastarRecurso(b20, 'tpl:brujo.astucia'); assert.equal(b20.play.used[5], 0);
  const h = ch({ clase: 'Hechicero', nivel: 9 }); recState(h, 'tpl:hechicero.puntos').used = 9;
  alGastarRecurso(h, 'tpl:hechicero.recuperacion'); assert.equal(recState(h, 'tpl:hechicero.puntos').used, 5);
  const d = ch({ clase: 'Druida', subclase: 'Círculo de la luna', nivel: 4 }); alGastarRecurso(d, 'tpl:druida.forma');
  assert.equal(vidaDe(d).temp, 12);
  const d2 = ch({ clase: 'Druida', nivel: 4 }); alGastarRecurso(d2, 'tpl:druida.forma'); assert.equal(vidaDe(d2).temp, 4);
});
test('lanzadores: Archidruida recupera Forma salvaje al tirar iniciativa si no quedan', () => {
  const d = ch({ clase: 'Druida', nivel: 20 }); recState(d, 'tpl:druida.forma').used = 4;
  assert.equal(alTirarIniciativa(d).find(x => x.nombre === 'Archidruida').nombre, 'Archidruida');
  assert.equal(recState(d, 'tpl:druida.forma').used, 3);
});
test('lanzadores: Hechicería innata sube 1 la CD de hechicero', () => {
  const h = ch({ clase: 'Hechicero', nivel: 3 }); const cd = perfil(h).cd;
  ponerEfecto(h, 'innata'); assert.equal(perfil(h).cd, cd + 1);
});
test('bonos a conjuros: Discípulo de la vida, Alma radiante, Afinidad elemental, Evocación potenciada', async () => {
  const { bonosDeConjuro } = await import('../web/src/domain/bonosConjuro.js');
  const cura = [{ tipo: 'curación', n: 2, caras: 8, bono: 0 }];
  assert.equal(bonosDeConjuro(ch({ clase: 'Clérigo', subclase: 'Dominio de la vida', nivel: 3 }), { level: 1 }, 'Clérigo', cura, 2)[0].bono, 4);
  assert.equal(bonosDeConjuro(ch({ clase: 'Clérigo', subclase: 'Dominio de la vida', nivel: 3 }), { level: 0 }, 'Clérigo', cura)[0].bono, 0);
  const fuego = [{ tipo: 'fuego', n: 8, caras: 6, bono: 0 }, { tipo: 'fuego', n: 1, caras: 6, bono: 0 }];
  const al = bonosDeConjuro(ch({ clase: 'Brujo', subclase: 'Patrón celestial', nivel: 6 }), { level: 3 }, 'Brujo', fuego);
  assert.deepEqual(al.map(x => x.bono), [2, 0], 'solo a una tirada');
  const dr = ch({ clase: 'Hechicero', subclase: 'Hechicería dracónica', nivel: 6, opciones: { 'draconica.afinidad': 'Fuego' } });
  assert.equal(bonosDeConjuro(dr, { level: 3 }, 'Hechicero', fuego)[0].bono, 2);
  assert.equal(bonosDeConjuro(ch({ clase: 'Mago', subclase: 'Evocador', nivel: 10 }), { level: 3, escuela: 'Evocación' }, 'Mago', fuego)[0].bono, 1);
});
test('conjuros siempre preparados que faltaban: Contactar patrón, Maleficio primigenio, Rompeconjuros, Palabras de creación', () => {
  const n = c => conjurosAutomaticos(ch(c)).map(x => x.nombre);
  assert.ok(n({ clase: 'Brujo', nivel: 9 }).includes('Contactar con otro plano'));
  assert.ok(n({ clase: 'Brujo', subclase: 'Patrón primigenio', nivel: 10 }).includes('Maleficio'));
  assert.ok(n({ clase: 'Mago', subclase: 'Abjurador', nivel: 10 }).includes('Contrahechizo'));
  assert.ok(n({ clase: 'Bardo', nivel: 20 }).includes('Palabra de poder: matar'));
});
test('CA: Juego de pies deslumbrante del colegio de la danza', async () => {
  const { claseArmadura } = await import('../web/src/domain/equipo.js');
  assert.equal(claseArmadura(ch({ clase: 'Bardo', subclase: 'Colegio de la danza', nivel: 3 })).ca, 10 + 3 + 2);
});

test('canjes: recuperar usos gastando espacios, Furia o puntos de hechicería', async () => {
  const { canjesDe, aplicarCanje, fuenteDeMagia, espacioAPuntos, puntosAEspacio } = await import('../web/src/domain/canjes.js');
  const b = ch({ clase: 'Bárbaro', subclase: 'Senda del berserker', nivel: 14 });
  assert.deepEqual(canjesDe(b, 'tpl:berserker.presencia'), [], 'sin gastar no hay nada que recuperar');
  recState(b, 'tpl:berserker.presencia').used = 1;
  const c = canjesDe(b, 'tpl:berserker.presencia')[0]; assert.equal(c.rec2, 'tpl:barbaro.furia');
  aplicarCanje(b, 'tpl:berserker.presencia', c);
  assert.equal(recState(b, 'tpl:berserker.presencia').used, 0); assert.equal(recState(b, 'tpl:barbaro.furia').used, 1);
  const bardo = ch({ clase: 'Bardo', nivel: 5 }); recState(bardo, 'tpl:bardo.inspiracion').used = 1;
  assert.deepEqual(canjesDe(bardo, 'tpl:bardo.inspiracion').map(x => x.espacio), [1, 2, 3]);
  const bardo4 = ch({ clase: 'Bardo', nivel: 4 }); recState(bardo4, 'tpl:bardo.inspiracion').used = 1;
  assert.deepEqual(canjesDe(bardo4, 'tpl:bardo.inspiracion'), [], 'Fuente de inspiración es de nivel 5');
  const d = ch({ clase: 'Druida', nivel: 5 }); recState(d, 'tpl:druida.forma').used = 1;
  assert.deepEqual(canjesDe(d, 'tpl:druida.forma'), [], 'Resurgimiento salvaje solo sin usos');
  recState(d, 'tpl:druida.forma').used = 2; assert.ok(canjesDe(d, 'tpl:druida.forma').length);
  const h = ch({ clase: 'Hechicero', nivel: 5 }); recState(h, 'tpl:hechicero.puntos').used = 4;
  assert.deepEqual(fuenteDeMagia(h).crear, [], 'solo recupera espacios gastados');
  assert.equal(espacioAPuntos(h, 3), 3); assert.equal(recState(h, 'tpl:hechicero.puntos').used, 1); assert.equal(h.play.used[3], 1);
  assert.deepEqual(fuenteDeMagia(h).crear, [], 'crear uno de nivel 3 cuesta 5 y quedan 4');
  recState(h, 'tpl:hechicero.puntos').used = 0;
  assert.deepEqual(fuenteDeMagia(h).crear.map(x => [x.L, x.coste]), [[3, 5]]);
  assert.equal(puntosAEspacio(h, 3), 5); assert.equal(h.play.used[3], 0); assert.equal(recState(h, 'tpl:hechicero.puntos').used, 5);
});

test('conjuros: el analizador lee dardos, rayos, PG temporales, modificador de curación y tipos a elegir', async () => {
  const { analizarTiradas, dadosPara } = await import('../web/src/domain/tiradas.js');
  const mm = analizarTiradas('You create three glowing darts of magical force. A dart deals 1d4 + 1 Force damage to its target.', 'The spell creates one more dart for each spell slot level above 1.');
  assert.equal(dadosPara(mm, { nivelEspacio: 3, nivelConjuro: 1 })[0].veces, 5);
  const fl = analizarTiradas('You gain 2d4 + 4 Temporary Hit Points.', 'You gain 5 additional Temporary Hit Points for each spell slot level above 1.');
  assert.ok(fl.curacion.temp); assert.equal(dadosPara(fl, { nivelEspacio: 2, nivelConjuro: 1 })[0].bono, 9);
  assert.equal(analizarTiradas('A creature you touch regains a number of Hit Points equal to 2d8 plus your spellcasting ability modifier.', '').curacion.mod, true);
  assert.equal(analizarTiradas('On a hit, the target takes 3d8 damage of the chosen type.', '').danos[0].tipo, 'a elegir');
  assert.equal(analizarTiradas('On a hit, the target takes Force damage equal to 1d8 plus your spellcasting ability modifier.', '').danos[0].tipo, 'fuerza');
  const sw = analizarTiradas('damage 1d8', 'The damage increases by 1d8 for every slot level above 2.'); assert.equal(sw.escala.desde, 2);
});
test('conjuros sin texto del SRD tienen sus datos mecánicos de respaldo', async () => {
  const { tiradasBase } = await import('../web/src/domain/tiradasBase.js');
  assert.equal(tiradasBase('Mind Sliver').salvacion, 'Inteligencia');
  assert.equal(tiradasBase('Toll the Dead').danos[1].caras, 12);
});
test('conjuros con efecto sobre ti: Manto del cruzado, Presciencia, Vínculo protector', async () => {
  const { efectoDeConjuro, caEfectiva } = await import('../web/src/domain/efectos.js');
  assert.equal(efectoDeConjuro('Manto del cruzado').danoArma, '1d4');
  assert.equal(efectoDeConjuro('Agrandar/reducir').k, 'agrandar');
  const p = ch({ clase: 'Mago', nivel: 17 }); ponerEfecto(p, 'presciencia');
  assert.ok(modsTirada(p, { sobre: 'iniciativa' }).some(m => m.fuente === 'Presciencia'));
  const v = ch({ clase: 'Clérigo', nivel: 3 }); const ca = caEfectiva(v).ca; ponerEfecto(v, 'vinculo'); assert.equal(caEfectiva(v).ca, ca + 1);
});
test('Armadura de Agathys y Heroísmo dan PG temporales', async () => {
  const { temporalesDeConjuro } = await import('../web/src/domain/automatismos.js');
  assert.equal(temporalesDeConjuro('Armadura de Agathys', 3), 15);
  const b = ch({ clase: 'Bardo', nivel: 3 }); b.play.conc = 'Heroísmo'; ponerEfecto(b, 'heroismo', { conc: 'Heroísmo' });
  alEmpezarTurno(b); assert.equal(vidaDe(b).temp, 2);
});

test('vida 6/17: Sanador bendito y Sanación suprema; evocador: Truco potente', async () => {
  const { bonosDeConjuro, trucoPotenteEvocador } = await import('../web/src/domain/bonosConjuro.js');
  const cura = [{ tipo: 'curación', n: 2, caras: 8, bono: 0 }];
  const [x] = bonosDeConjuro(ch({ clase: 'Clérigo', subclase: 'Dominio de la vida', nivel: 17 }), { level: 1 }, 'Clérigo', cura, 1);
  assert.equal(x.maximo, true); assert.equal(x.sanador, 3); assert.equal(x.bono, 3);
  assert.equal(bonosDeConjuro(ch({ clase: 'Clérigo', subclase: 'Dominio de la vida', nivel: 5 }), { level: 1 }, 'Clérigo', cura, 1)[0].sanador, undefined);
  assert.ok(trucoPotenteEvocador(ch({ clase: 'Mago', subclase: 'Evocador', nivel: 3 })));
});
