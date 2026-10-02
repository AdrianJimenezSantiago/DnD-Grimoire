import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { resumenTirada, modsTirada, resolverModo, falloAutomatico, caEfectiva, velocidadEfectiva, incapacitado, danoArmaExtra, lanzadorTira, soloSobreTi, efectoDeConjuro, EFECTOS, fmtRondas } from '../../web/src/domain/combate/efectos.js';
import { combateDe, empezarCombate, hacerAccionComun, deshacerAccionComun, siguienteTurno, accionesAdicionales } from '../../web/src/domain/combate/combate.js';
import { ponerEfecto, pasarRonda, pgMaximo, pgActuales, aumentarMax, quitarMax, aplicarDano, descansoLargoVida, esYo, sincronizarYo, cambiarConc } from '../../web/src/domain/combate/vida.js';
import { personajeVacio, normPersonaje } from '../../web/src/domain/personaje/modelo.js';

const pj = vida => normPersonaje(personajeVacio({ clase: 'Guerrero', nivel: 3, stats: { con: 14, des: 14 }, vida }));
const claseBase = ch => { const c = { ...ch, vida: { ...ch.vida, efectos: [] } }; return caEfectiva(c).ca; };
const guerrero = over => normPersonaje(personajeVacio({ clase: 'Guerrero', nivel: 3, stats: { con: 14, des: 14 }, ...over }));

describe('estados', () => {
  test('desventaja, ventaja y fallo automático donde toca', () => {
    const ch = pj({ estados: ['envenenado', 'invisible'] });
    assert.equal(resolverModo(modsTirada(ch, { sobre: 'ataque' })), 'normal');
    assert.equal(resolverModo(modsTirada(ch, { sobre: 'prueba', hab: 'sigilo' })), 'desventaja');
    assert.equal(resolverModo(modsTirada(ch, { sobre: 'iniciativa' })), 'normal');
    assert.equal(resolverModo(modsTirada(pj({ estados: ['envenenado'] }), { sobre: 'iniciativa' })), 'desventaja');
    const ap = pj({ estados: ['apresado'] });
    assert.equal(resolverModo(modsTirada(ap, { sobre: 'salvacion', ab: 'des' })), 'desventaja');
    assert.equal(resolverModo(modsTirada(ap, { sobre: 'salvacion', ab: 'sab' })), 'normal');
    assert.ok(falloAutomatico(modsTirada(pj({ estados: ['paralizado'] }), { sobre: 'salvacion', ab: 'fue' })));
    assert.deepEqual(incapacitado(pj({ estados: ['aturdido'] })), ['aturdido']);
  });

  test('velocidad 0 al estar apresado o agarrado', () => {
    assert.equal(velocidadEfectiva(pj({ estados: ['apresado'] })).m, 0);
    assert.equal(velocidadEfectiva(pj({ estados: ['agarrado'], efectos: [{ k: 'zancada' }] })).m, 0);
  });
});

describe('efectos de conjuro', () => {
  test('bendición, perdición, acelerar, piel robliza y agotamiento', () => {
    const ch = pj({ efectos: [{ k: 'bendicion' }, { k: 'acelerar' }], agotamiento: 1 });
    const at = modsTirada(ch, { sobre: 'ataque' });
    assert.ok(at.some(m => m.efecto === 'dado' && m.valor === '1d4'));
    assert.ok(at.some(m => m.efecto === 'plano' && m.valor === -2));
    assert.equal(resolverModo(modsTirada(ch, { sobre: 'salvacion', ab: 'des' })), 'ventaja');
    assert.equal(caEfectiva(ch).ca, claseBase(ch) + 2);
    assert.equal(velocidadEfectiva(ch).m, (9 - 1.5) * 2);
    assert.equal(caEfectiva(pj({ efectos: [{ k: 'pielrobliza' }] })).ca, 17);
    assert.deepEqual(danoArmaExtra(pj({ efectos: [{ k: 'agrandar' }] })), ['1d4']);
    const propio = pj({ efectos: [{ propio: { ca: 1, ataque: '+2', salvacion: '1d6' }, nombre: 'Anillo' }] });
    assert.ok(modsTirada(propio, { sobre: 'salvacion', ab: 'con' }).some(m => m.valor === '1d6'));
  });

  test('conjuros que te afectan: se reconocen por su nombre', () => {
    assert.equal(efectoDeConjuro('Escudo').k, 'escudo');
    assert.equal(efectoDeConjuro('Escudo de la fe').k, 'escudofe');
    assert.equal(efectoDeConjuro('Bendición').k, 'bendicion');
    assert.equal(efectoDeConjuro('Heroismo').k, 'heroismo');
    assert.equal(efectoDeConjuro('Bola de fuego'), null);
    assert.equal(fmtRondas(1), '1 ronda'); assert.equal(fmtRondas(10), '10 rondas'); assert.equal(fmtRondas(100), '10 min'); assert.equal(fmtRondas(600), '1 hora');
  });

  test('Escudo: +5 a la CA durante una ronda y luego se va', () => {
    const ch = guerrero(), base = caEfectiva(ch).ca;
    ponerEfecto(ch, 'escudo');
    assert.equal(caEfectiva(ch).ca, base + 5);
    const fuera = pasarRonda(ch);
    assert.deepEqual(fuera.map(e => e.k), ['escudo']);
    assert.equal(caEfectiva(ch).ca, base);
  });

  test('PG máximos aumentados: suben máximo y actuales, y al terminar se ajustan', () => {
    const ch = pj(); const base = pgMaximo(ch);
    aplicarDano(ch, 10); aumentarMax(ch, { id: 'aux', nombre: 'Auxilio', n: 5 });
    assert.equal(pgMaximo(ch), base + 5); assert.equal(pgActuales(ch), base - 5);
    quitarMax(ch, 'aux'); assert.equal(pgMaximo(ch), base); assert.equal(pgActuales(ch), base - 5);
    const lleno = pj(); aumentarMax(lleno, { id: 'x', n: 5 }); assert.equal(pgActuales(lleno), base + 5); quitarMax(lleno, 'x'); assert.equal(pgActuales(lleno), base);
    aumentarMax(lleno, { id: 'y', n: 5 }); descansoLargoVida(lleno); assert.equal(pgMaximo(lleno), base);
  });

  test('Bendición y compañía: el dado lo tira quien está bajo el conjuro, no quien lo lanza', () => {
    const soloDado = { danos: [], extras: [{ n: 1, caras: 4 }] };
    for (const n of ['Bendición', 'Guía', 'Resistencia', 'Perdición']) assert.equal(lanzadorTira(n, soloDado), false, n);
    assert.equal(lanzadorTira('Nube de dagas', soloDado), true);
    assert.equal(lanzadorTira('Saeta guía', { ataque: 'a distancia', danos: [{ tipo: 'radiante' }] }), true);
    assert.equal(lanzadorTira('Bendición', null), false);
  });

  test('conjuros de alcance Lanzador se reconocen como solo sobre ti', () => {
    assert.ok(soloSobreTi('Lanzador'));
    assert.ok(soloSobreTi('Personal'));
    assert.ok(!soloSobreTi('9 m'));
    assert.ok(!soloSobreTi('Toque'));
  });

  test('perjuicios: se reconocen al lanzarlos y se aplican a las tiradas', () => {
    assert.equal(efectoDeConjuro('Perdición').k, 'perdicion');
    assert.equal(efectoDeConjuro('Rayo debilitador').k, 'rayodebil');
    assert.equal(resolverModo(modsTirada(pj({ efectos: [{ k: 'rayodebil' }] }), { sobre: 'salvacion', ab: 'fue' })), 'desventaja');
    assert.equal(velocidadEfectiva(pj({ efectos: [{ k: 'escarcha' }] })).m, 6);
    assert.deepEqual(danoArmaExtra(pj({ efectos: [{ k: 'favordivino' }] })), ['1d4']);
    const ks = EFECTOS.map(e => e.k);
    assert.equal(new Set(ks).size, ks.length, 'claves repetidas');
    assert.ok(EFECTOS.some(e => !e.bueno) && EFECTOS.filter(e => !e.bueno).length >= 10);
  });

  test('objetivos: si tu nombre está entre ellos, el efecto se te aplica y se quita contigo', () => {
    const ch = pj(); ch.nombre = 'Elowen la Sabia';
    assert.ok(esYo(ch, 'Elowen') && esYo(ch, 'elowen la sabia') && esYo(ch, 'Yo'));
    assert.ok(!esYo(ch, 'Gareth') && !esYo(ch, ''));
    cambiarConc(ch, 'Bendición', 10);
    ch.play.concObj.push('Gareth');
    assert.equal(sincronizarYo(ch, 'conc'), '');
    ch.play.concObj.push('Elowen');
    assert.equal(sincronizarYo(ch, 'conc'), 'pone');
    const e = ch.vida.efectos.find(x => x.k === 'bendicion');
    assert.equal(e.conc, 'Bendición');
    assert.ok(modsTirada(ch, { sobre: 'ataque' }).some(m => m.valor === '1d4'));
    ch.play.concObj = ['Gareth'];
    assert.equal(sincronizarYo(ch, 'conc'), 'quita');
    assert.ok(!ch.vida.efectos.some(x => x.k === 'bendicion'));
  });
});

describe('resumenTirada', () => {
  test('suma agotamiento y efectos, y marca ventaja o desventaja', () => {
    const ch = guerrero({ vida: { agotamiento: 1, estados: ['envenenado'] } });
    ponerEfecto(ch, 'bendicion'); ponerEfecto(ch, 'agrandar');
    const r = resumenTirada(ch, 'prueba', { ab: 'fue' }, 3);
    assert.equal(r.total, 1); assert.equal(r.modo, 'normal');
    assert.equal(resumenTirada(ch, 'prueba', { ab: 'int' }, 0).modo, 'desventaja');
    assert.deepEqual(resumenTirada(ch, 'salvacion', { ab: 'sab' }, 2).dados, ['+1d4']);
  });
});

describe('acciones comunes de combate', () => {
  test('gastan la parte del turno, dejan su efecto y se deshacen', () => {
    const ch = pj(); empezarCombate(ch);
    assert.ok(hacerAccionComun(ch, 'esquivar'));
    ponerEfecto(ch, 'esquivar');
    assert.equal(combateDe(ch).turno.accion, true);
    assert.equal(resolverModo(modsTirada(ch, { sobre: 'salvacion', ab: 'des' })), 'ventaja');
    const tumbado = pj({ estados: ['apresado'], efectos: [{ k: 'esquivar' }] });
    assert.ok(!modsTirada(tumbado, { sobre: 'salvacion', ab: 'des' }).some(m => m.fuente === 'Esquivando'), 'con velocidad 0 no esquivas');
    assert.ok(deshacerAccionComun(ch, 'esquivar', 'accion'));
    assert.equal(combateDe(ch).turno.accion, false);
    hacerAccionComun(ch, 'correr'); ponerEfecto(ch, 'correr');
    assert.equal(velocidadEfectiva(ch).m, 18);
    siguienteTurno(ch); pasarRonda(ch);
    assert.deepEqual(combateDe(ch).hechas, []);
    assert.equal(velocidadEfectiva(ch).m, 9);
    assert.equal(hacerAccionComun(ch, 'oportunidad'), true);
    assert.equal(combateDe(ch).turno.reaccion, true);
    assert.deepEqual(accionesAdicionales(pj()).map(x => x.k), []);
  });
});
