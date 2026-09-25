import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { caEfectiva, efectoDeConjuro, fmtRondas, efectosDe } from '../web/src/domain/efectos.js';
import { pgMaximo, ponerEfecto, pasarRonda, soltarConc, cambiarConc } from '../web/src/domain/vida.js';
import { opcionesIntercambio, nivelCambia, esHumano } from '../web/src/domain/intercambios.js';

const pj = over => normChar(blankChar({ clase: 'Guerrero', nivel: 3, stats: { con: 14, des: 14 }, ...over }));

test('conjuros que te afectan: se reconocen por su nombre', () => {
  assert.equal(efectoDeConjuro('Escudo').k, 'escudo');
  assert.equal(efectoDeConjuro('Escudo de la fe').k, 'escudofe');
  assert.equal(efectoDeConjuro('Bendición').k, 'bendicion');
  assert.equal(efectoDeConjuro('Heroismo').k, 'heroismo');
  assert.equal(efectoDeConjuro('Bola de fuego'), null);
  assert.equal(fmtRondas(1), '1 ronda'); assert.equal(fmtRondas(10), '10 rondas'); assert.equal(fmtRondas(100), '10 min'); assert.equal(fmtRondas(600), '1 hora');
});
test('Escudo: +5 a la CA durante una ronda y luego se va', () => {
  const ch = pj(), base = caEfectiva(ch).ca;
  ponerEfecto(ch, 'escudo');
  assert.equal(caEfectiva(ch).ca, base + 5);
  const fuera = pasarRonda(ch);
  assert.deepEqual(fuera.map(e => e.k), ['escudo']);
  assert.equal(caEfectiva(ch).ca, base);
});
test('duraciones: cada ronda descuenta y avisa solo de lo que termina', () => {
  const ch = pj();
  ponerEfecto(ch, 'bendicion'); ponerEfecto(ch, 'pielrobliza'); ponerEfecto(ch, 'perdicion', { rondas: 2 });
  assert.equal(efectosDe(ch).find(e => e.k === 'bendicion').rondas, 10);
  assert.deepEqual(pasarRonda(ch), []);
  assert.deepEqual(pasarRonda(ch).map(e => [e.k, e.bueno]), [['perdicion', false]]);
  for (let i = 0; i < 7; i++) assert.deepEqual(pasarRonda(ch), []);
  assert.deepEqual(pasarRonda(ch).map(e => e.k), ['bendicion']);
  assert.deepEqual(efectosDe(ch).map(e => e.k), ['pielrobliza']);
});
test('concentración: al perderla terminan los efectos que dependían de ella', () => {
  const ch = pj({ play: { conc: '' } }), max = pgMaximo(ch);
  cambiarConc(ch, 'Bendición'); ponerEfecto(ch, 'bendicion', { conc: 'Bendición' });
  ponerEfecto(ch, 'auxilio', { n: 5 });
  assert.equal(pgMaximo(ch), max + 5);
  assert.deepEqual(cambiarConc(ch, 'Acelerar').map(e => e.k), ['bendicion']);
  ponerEfecto(ch, 'acelerar', { conc: 'Acelerar' });
  assert.deepEqual(soltarConc(ch).map(e => e.k), ['acelerar']);
  assert.equal(ch.play.conc, '');
  assert.deepEqual(efectosDe(ch).map(e => e.k), ['auxilio']);
  assert.equal(pgMaximo(ch), max + 5);
});
test('descansos: qué conjuros y opciones puedes cambiar según tu clase', () => {
  const titulos = (ch, m, o) => opcionesIntercambio(ch, m, o).map(x => x.titulo);
  assert.deepEqual(titulos(pj({ clase: 'Mago', nivel: 5 }), 'largo'), ['Cambiar tus preparados', 'Cambiar un truco']);
  assert.deepEqual(titulos(pj({ clase: 'Mago', nivel: 5 }), 'corto'), ['Memorizar conjuro']);
  assert.deepEqual(titulos(pj({ clase: 'Mago', nivel: 4 }), 'corto'), []);
  assert.deepEqual(titulos(pj({ clase: 'Paladín', nivel: 2 }), 'largo'), ['Cambiar un conjuro preparado', 'Cambiar maestrías de armas']);
  assert.ok(titulos(pj({ clase: 'Druida', nivel: 2 }), 'largo').includes('Cambiar una forma conocida'));
  assert.deepEqual(titulos(pj({ clase: 'Bardo', nivel: 4 }), 'largo'), []);
  assert.deepEqual(titulos(pj({ clase: 'Brujo', nivel: 5 }), 'nivel'), ['Cambiar un conjuro', 'Cambiar un truco', 'Cambiar una invocación']);
  assert.ok(titulos(pj({ clase: 'Guerrero', nivel: 3, subclase: 'Caballero arcano' }), 'nivel').includes('Cambiar un conjuro'));
  assert.ok(titulos(pj({ clase: 'Guerrero', nivel: 3, subclase: 'Maestro del combate' }), 'nivel').includes('Cambiar una maniobra'));
  const ini = pj({ clase: 'Pícaro', nivel: 4, dotes: ['Iniciado en la magia (mago)'] });
  assert.ok(nivelCambia(ini, 'Pícaro').some(x => x.titulo === 'Cambiar un conjuro de la dote'));
  assert.ok(titulos(pj({ especie: 'Alto elfo' }), 'largo').includes('Cambiar tu truco élfico'));
  assert.ok(esHumano(pj({ especie: 'Humano' }))); assert.ok(!esHumano(pj({ especie: 'Mediano' })));
});
test('combate: la iniciativa escrita a mano se recuerda y se limpia al empezar otro', async () => {
  const { normCombate, empezarCombate, combateDe } = await import('../web/src/domain/combate.js');
  assert.equal(normCombate({ iniciativa: '17', iniManual: true }).iniManual, true);
  assert.equal(normCombate({ iniciativa: null, iniManual: true }).iniManual, false);
  const ch = pj({ combate: { activo: true, iniciativa: 19, iniManual: true } });
  empezarCombate(ch); assert.equal(combateDe(ch).iniciativa, null); assert.equal(combateDe(ch).iniManual, false);
});
