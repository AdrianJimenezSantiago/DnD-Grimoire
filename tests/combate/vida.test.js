import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../../web/src/domain/personaje/modelo.js';
import { pgMaximo, pgActuales, aplicarDano, curar, ponerTemporales, dadosDeGolpe, gastarDadoGolpe, salvacionMuerte, estadoVital, descansoLargoVida, cdConcentracion, pgMaximoCalculado, revivir, ponerEfecto, pasarRonda, soltarConc, cambiarConc, rondasDeDuracion } from '../../web/src/domain/combate/vida.js';
import { efectosDe } from '../../web/src/domain/combate/efectos.js';

const pj = over => normChar(blankChar({ clase: 'Guerrero', nivel: 3, stats: { con: 14 }, ...over }));
const guerrero = over => normChar(blankChar({ clase: 'Guerrero', nivel: 3, stats: { con: 14, des: 14 }, ...over }));

describe('puntos de golpe', () => {
  test('PG máximos: primer nivel completo, después la media, dotes y especie', () => {
    assert.equal(pgMaximoCalculado(pj()), 12 + 8 + 8);
    assert.equal(pgMaximoCalculado(pj({ trasfondo: 'Campesino' })), 28 + 6);
    assert.equal(pgMaximoCalculado(pj({ especie: 'Enano' })), 28 + 3);
    assert.equal(pgMaximoCalculado(pj({ multiclase: [{ clase: 'Mago', nivel: 2 }] })), 28 + 2 * (4 + 2));
    assert.equal(pgMaximo(pj({ vida: { maxManual: 40 } })), 40);
  });

  test('daño: primero los temporales; concentración con su CD', () => {
    const ch = pj({ play: { conc: 'Bendición' } });
    ponerTemporales(ch, 5); ponerTemporales(ch, 3);
    assert.equal(ch.vida.temp, 5);
    const r = aplicarDano(ch, 9);
    assert.equal(r.absorbido, 5); assert.equal(pgActuales(ch), 24);
    assert.deepEqual(r.concentracion, { cd: 10, conjuro: 'Bendición' });
    assert.equal(cdConcentracion(44), 22); assert.equal(cdConcentracion(90), 30);
  });

  test('daño masivo: muerte instantánea', () => {
    const ch = pj(); const r = aplicarDano(ch, 60);
    assert.ok(r.muerte); assert.equal(estadoVital(ch), 'muerto');
  });

  test('dados de golpe por clase, gasto y descanso largo (2024: se recuperan todos)', () => {
    const ch = pj({ multiclase: [{ clase: 'Mago', nivel: 2 }] });
    assert.deepEqual(dadosDeGolpe(ch).map(d => [d.dado, d.total]), [['d10', 3], ['d6', 2]]);
    aplicarDano(ch, 20);
    const g = gastarDadoGolpe(ch, 'd10', 1); assert.equal(g.total, 3);
    assert.equal(dadosDeGolpe(ch)[0].quedan, 2);
    ch.vida.agotamiento = 2; descansoLargoVida(ch);
    assert.equal(dadosDeGolpe(ch)[0].quedan, 3); assert.equal(pgActuales(ch), pgMaximo(ch)); assert.equal(ch.vida.agotamiento, 1);
  });
});

describe('salvaciones contra muerte', () => {
  test('caer a 0, salvaciones contra muerte y curación', () => {
    const ch = pj();
    const r = aplicarDano(ch, 30);
    assert.ok(r.cayo); assert.equal(estadoVital(ch), 'moribundo');
    aplicarDano(ch, 2); assert.equal(ch.vida.muerte.fallos, 1);
    assert.equal(salvacionMuerte(ch, 12), 'exito');
    assert.equal(salvacionMuerte(ch, 1), 'muere'); assert.equal(estadoVital(ch), 'muerto');
    const b = pj(); aplicarDano(b, 28); salvacionMuerte(b, 10); salvacionMuerte(b, 15); assert.equal(salvacionMuerte(b, 19), 'estable');
    assert.equal(estadoVital(b), 'estable'); curar(b, 4); assert.equal(pgActuales(b), 4); assert.deepEqual(b.vida.muerte, { exitos: 0, fallos: 0 });
  });

  test('un 20 en la salvación contra muerte devuelve 1 PG', () => {
    const ch = pj(); aplicarDano(ch, 28); assert.equal(salvacionMuerte(ch, 20), 'revive'); assert.equal(pgActuales(ch), 1);
  });

  test('muerte: tres fallos, crítico a 0 PG, agotamiento 6 y revivir', () => {
    const a = pj(); aplicarDano(a, 28); salvacionMuerte(a, 5); salvacionMuerte(a, 1);
    assert.equal(estadoVital(a), 'muerto'); assert.equal(a.vida.caida.causa, 'salvaciones');
    assert.equal(curar(a, 10), 0); assert.equal(aplicarDano(a, 5).recibido, 5); assert.equal(pgActuales(a), 0);
    assert.equal(salvacionMuerte(a, 20), 'muere');
    revivir(a); assert.equal(estadoVital(a), 'vivo'); assert.equal(pgActuales(a), 1); assert.equal(a.vida.caida, null);
    const b = pj(); aplicarDano(b, 28); aplicarDano(b, 1, { critico: true }); assert.equal(b.vida.muerte.fallos, 2);
    const c = pj({ vida: { agotamiento: 6 } }); assert.equal(estadoVital(c), 'muerto'); revivir(c); assert.equal(c.vida.agotamiento, 5);
  });

  test('estable: tres éxitos reinician la cuenta; el daño vuelve a ponerlo en peligro', () => {
    const ch = pj(); aplicarDano(ch, 28); salvacionMuerte(ch, 12); salvacionMuerte(ch, 15); salvacionMuerte(ch, 18);
    assert.equal(estadoVital(ch), 'estable'); assert.deepEqual(ch.vida.muerte, { exitos: 0, fallos: 0 });
    assert.equal(salvacionMuerte(ch, 3), 'nada');
    aplicarDano(ch, 2); assert.equal(estadoVital(ch), 'moribundo'); assert.equal(ch.vida.muerte.fallos, 1);
  });
});

describe('duraciones', () => {
  test('cada ronda descuenta y avisa solo de lo que termina', () => {
    const ch = guerrero();
    ponerEfecto(ch, 'bendicion'); ponerEfecto(ch, 'pielrobliza'); ponerEfecto(ch, 'perdicion', { rondas: 2 });
    assert.equal(efectosDe(ch).find(e => e.k === 'bendicion').rondas, 10);
    assert.deepEqual(pasarRonda(ch), []);
    assert.deepEqual(pasarRonda(ch).map(e => [e.k, e.bueno]), [['perdicion', false]]);
    for (let i = 0; i < 7; i++) assert.deepEqual(pasarRonda(ch), []);
    assert.deepEqual(pasarRonda(ch).map(e => e.k), ['bendicion']);
    assert.deepEqual(efectosDe(ch).map(e => e.k), ['pielrobliza']);
  });
});

describe('concentración', () => {
  test('al perderla terminan los efectos que dependían de ella', () => {
    const ch = guerrero({ play: { conc: '' } }), max = pgMaximo(ch);
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

  test('termina sola al agotarse la duración del conjuro', () => {
    assert.equal(rondasDeDuracion('Hasta 1 min'), 10); assert.equal(rondasDeDuracion('Concentración, hasta 10 minutos'), 100);
    assert.equal(rondasDeDuracion('Hasta 1 h'), 600); assert.equal(rondasDeDuracion('Hasta 6 asaltos'), 6); assert.equal(rondasDeDuracion('Hasta 1 día'), 14400);
    assert.equal(rondasDeDuracion('Instantáneo'), null); assert.equal(rondasDeDuracion('Hasta que se disipe'), null);
    const ch = guerrero({ play: { conc: '' } });
    cambiarConc(ch, 'Bendición', 10); ponerEfecto(ch, 'bendicion', { conc: 'Bendición' });
    for (let i = 0; i < 9; i++) assert.deepEqual(pasarRonda(ch), []);
    assert.equal(ch.play.concRondas, 1);
    const fuera = pasarRonda(ch);
    assert.deepEqual(fuera.map(e => [e.nombre, !!e.finConc]), [['Bendición', true], ['Bendición', false]]);
    assert.equal(ch.play.conc, ''); assert.equal(ch.play.concRondas, null); assert.deepEqual(efectosDe(ch), []);
    cambiarConc(ch, 'Nube de oscurecimiento');
    for (let i = 0; i < 50; i++) pasarRonda(ch);
    assert.equal(ch.play.conc, 'Nube de oscurecimiento');
  });

  test('CD por daño y salvación pedida al recibirlo', () => {
    assert.equal(cdConcentracion(1), 10); assert.equal(cdConcentracion(21), 10); assert.equal(cdConcentracion(23), 11); assert.equal(cdConcentracion(100), 30);
    const ch = guerrero({ play: { conc: 'Bendición' } });
    assert.deepEqual(aplicarDano(ch, 25).concentracion, { cd: 12, conjuro: 'Bendición' });
    assert.equal(aplicarDano(ch, 999).concentracion.perdida, true);
  });
});
