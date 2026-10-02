import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { PREDEFINIDOS } from '../web/src/domain/equipo.js';
import { modsTirada, inmunidadesEstado, REGLAS_ESTADO } from '../web/src/domain/efectos.js';
import { ESTADOS, RESUMEN_ESTADO } from '../web/src/domain/vida.js';
import { ACCION_COMUN } from '../web/src/domain/combate.js';
import { ECONOMIA_INFO, PROPIEDADES, textoPropiedad, textoMaestria, salto } from '../web/src/domain/referencia.js';

const pj = o => normChar(blankChar({ clase: 'Guerrero', nivel: 1, stats: { fue: 16, des: 14, con: 14, int: 8, sab: 10, car: 10 }, ...o }));
const conEstados = (...estados) => { const ch = pj(); ch.vida.estados = estados; return ch; };

// Manual del Jugador 2024, tabla de armas
test('maestrías de las armas sencillas según el manual de 2024', () => {
  const m = n => PREDEFINIDOS.find(p => p.nombre === n).arma.maestria;
  assert.equal(m('Maza'), 'Debilitar');
  assert.equal(m('Lanza'), 'Debilitar');
  assert.equal(m('Bastón'), 'Derribar');
  assert.equal(m('Garrote grande'), 'Empujar');
});

test('acción adicional: la regla de 2024 es un solo espacio de conjuro por turno, no «solo un truco»', () => {
  const conj = ECONOMIA_INFO.adicional.lista.find(([t]) => t === 'Conjuros')[1];
  assert.match(conj, /un espacio de conjuro/);
  assert.doesNotMatch(conj, /solo puedes lanzar además un truco/);
  assert.ok(ECONOMIA_INFO.adicional.lista.some(([t]) => /poci[oó]n/i.test(t)), 'beber una poción es acción adicional');
});

test('usar un objeto: las pociones y los objetos mágicos no van por esta acción', () => {
  assert.match(ACCION_COMUN.objeto.texto, /no mágico/);
  assert.match(ACCION_COMUN.objeto.texto, /acción adicional/);
  assert.deepEqual(ACCION_COMUN.objeto.alias, ['Utilizar']);
});

test('ayudar y esconderse con las condiciones de 2024', () => {
  assert.match(ACCION_COMUN.ayudar.texto, /competencia/);
  assert.match(ACCION_COMUN.esconderse.texto, /tres cuartos o total/);
  assert.match(ACCION_COMUN.esconderse.texto, /CD 15/);
});

test('resúmenes de estados completos', () => {
  assert.equal(ESTADOS.length, 14);
  assert.match(RESUMEN_ESTADO.incapacitado, /no puedes hablar/);
  assert.match(RESUMEN_ESTADO.petrificado, /estado envenenado/);
  for (const k of ['paralizado', 'inconsciente', 'petrificado', 'aturdido']) assert.match(RESUMEN_ESTADO[k], /ventaja/, k);
  for (const [k] of ESTADOS) assert.ok(REGLAS_ESTADO[k], `${k} tiene reglas en la hoja`);
});

test('los estados que incluyen incapacitado dan desventaja en la iniciativa', () => {
  for (const k of ['aturdido', 'paralizado', 'inconsciente', 'petrificado']) {
    const mods = modsTirada(conEstados(k), { sobre: 'iniciativa' });
    assert.ok(mods.some(x => x.efecto === 'desventaja'), k);
  }
  // Sin duplicar el modificador si además está marcado incapacitado
  assert.equal(modsTirada(conEstados('aturdido', 'incapacitado'), { sobre: 'iniciativa' }).filter(x => x.efecto === 'desventaja').length, 1);
});

test('petrificado: inmune al estado envenenado', () => {
  const ch = conEstados('petrificado', 'envenenado');
  assert.equal(inmunidadesEstado(ch).get('envenenado'), 'Petrificado');
  assert.ok(!modsTirada(ch, { sobre: 'ataque' }).some(x => x.fuente === 'Envenenado'));
});

test('propiedades y maestrías: distancia y la CD de Derribar', () => {
  assert.ok(PROPIEDADES.distancia);
  assert.match(textoPropiedad('Distancia (24/96 m)'), /desventaja/);
  assert.match(textoMaestria('Derribar'), /modificador de característica/);
});

test('saltos en metros', () => {
  assert.deepEqual(salto(15), { largo: 4.5, alto: 1.5 });
  const s = salto(10); assert.equal(s.largo, 3); assert.ok(Math.abs(s.alto - 0.9) < 1e-9);
});

test('las mazas y lanzas ya guardadas pasan a Debilitar', async () => {
  const { normObjeto } = await import('../web/src/domain/equipo.js');
  const vieja = { nombre: 'Maza', cat: 'arma', arma: { dano: '1d6', tipo: 'contundente', props: [], maestria: 'Irritar' } };
  assert.equal(normObjeto(vieja).arma.maestria, 'Debilitar');
  assert.equal(normObjeto({ nombre: 'Lanza +1', cat: 'arma', arma: { base: 'Lanza', maestria: 'Derribar' } }).arma.maestria, 'Debilitar');
  assert.equal(normObjeto({ nombre: 'Martillo', cat: 'arma', arma: { maestria: 'Irritar' } }).arma.maestria, 'Irritar');
});

test('glosario: las palabras partidas con guion al final de línea se unen', async () => {
  const { juntar, sinCortes } = await import('../web/src/domain/glosario.js');
  assert.equal(juntar('puede arrastrarte o trans-', 'portarte al moverse'), 'puede arrastrarte o transportarte al moverse');
  assert.equal(juntar('Velocidad 0 -', 'Tu velocidad'), 'Velocidad 0 - Tu velocidad');
  assert.equal(sinCortes('arrastrarte o trans- portarte'), 'arrastrarte o transportarte');
  assert.equal(sinCortes('fuego y frío - en ambos'), 'fuego y frío - en ambos');
});
