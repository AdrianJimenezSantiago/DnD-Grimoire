import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { gamaGpu, nivelPorEquipo, veredicto, ajustar, estadoInicial, BAJO, MEDIO, ALTO, PARA_SUBIR } from '../../web/src/domain/presentacion/rendimiento.js';

const fotogramas = (n, ms, malos = 0, msMalo = ms * 2) => [...Array(n - malos).fill(ms), ...Array(malos).fill(msMalo)];

describe('calidad de los efectos', () => {
  test('gama de la gráfica por su nombre', () => {
    assert.equal(gamaGpu('Mali-G52 MC2'), 'baja');
    assert.equal(gamaGpu('Adreno (TM) 610'), 'baja');
    assert.equal(gamaGpu('PowerVR Rogue GE8320'), 'baja');
    assert.equal(gamaGpu('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)'), 'baja');
    assert.equal(gamaGpu('Adreno (TM) 740'), 'alta');
    assert.equal(gamaGpu('Mali-G78 MP14'), 'alta');
    assert.equal(gamaGpu('Mali-G715-Immortalis MC11'), 'alta');
    assert.equal(gamaGpu('Apple GPU'), 'alta');
    assert.equal(gamaGpu('Mali-G68 MC4'), 'media');
    assert.equal(gamaGpu('Adreno (TM) 619'), 'baja');
    assert.equal(gamaGpu('Adreno (TM) 642L'), 'alta');
    assert.equal(gamaGpu(''), null);
  });

  test('nivel de partida según el equipo', () => {
    assert.equal(nivelPorEquipo({ memoria: 2, nucleos: 4, gpu: 'Mali-G52 MC2' }), BAJO, 'tableta de entrada');
    assert.equal(nivelPorEquipo({ memoria: 4, nucleos: 8, gpu: 'Adreno (TM) 610' }), MEDIO, 'gama media');
    assert.equal(nivelPorEquipo({ memoria: 8, nucleos: 8, gpu: 'Adreno (TM) 740' }), ALTO, 'gama alta');
    assert.equal(nivelPorEquipo({ nucleos: 6, gpu: 'Apple GPU' }), ALTO, 'iPad: Safari no da la memoria');
    assert.equal(nivelPorEquipo({ memoria: 4, nucleos: 8, gpu: 'Mali-G68', pixeles: 2560 * 1600 }), MEDIO, 'pantalla grande');
    assert.equal(nivelPorEquipo({ nucleos: 8, tactil: false }), ALTO, 'ordenador');
    assert.equal(nivelPorEquipo({}), MEDIO, 'sin datos: término medio');
    assert.equal(nivelPorEquipo({ memoria: 8, nucleos: 16, gpu: 'SwiftShader' }), BAJO, 'sin gráfica de verdad');
  });

  test('veredicto de una muestra de fotogramas', () => {
    assert.equal(veredicto(fotogramas(120, 16.7)), 'bien');
    assert.equal(veredicto(fotogramas(240, 8.3)), 'bien', '120 Hz');
    assert.equal(veredicto(fotogramas(60, 33.3)), 'bien', 'modo ahorro a 30 fps');
    assert.equal(veredicto(fotogramas(120, 16.7, 30)), 'mal', 'una cuarta parte perdidos');
    assert.equal(veredicto(fotogramas(120, 16.7, 8, 100)), 'mal', 'tirones largos');
    assert.equal(veredicto(fotogramas(120, 16.7, 10)), 'justo');
    assert.equal(veredicto(fotogramas(40, 60)), 'mal', 'va a menos de 20 fps');
    assert.equal(veredicto(fotogramas(10, 16.7)), null, 'muestra corta');
  });

  test('baja con dos muestras malas seguidas y sube despacio', () => {
    let e = estadoInicial(ALTO);
    e = ajustar(e, 'mal'); assert.equal(e.nivel, ALTO, 'una mala no basta (puede ser un momento puntual)');
    e = ajustar(e, 'mal'); assert.equal(e.nivel, MEDIO);
    assert.equal(e.fallos[ALTO], 1);
    for (let i = 0; i < PARA_SUBIR * 2 - 1; i++) e = ajustar(e, 'bien');
    assert.equal(e.nivel, MEDIO, 'un nivel que ya falló pide el doble de muestras buenas');
    e = ajustar(e, 'bien'); assert.equal(e.nivel, ALTO);
    e = ajustar(ajustar(e, 'mal'), 'mal'); assert.equal(e.nivel, MEDIO);
    for (let i = 0; i < 50; i++) e = ajustar(e, 'bien');
    assert.equal(e.nivel, MEDIO, 'tras fallar dos veces no se vuelve a intentar');
  });

  test('una muestra justa reinicia las cuentas y el techo manda', () => {
    let e = estadoInicial(MEDIO);
    for (let i = 0; i < PARA_SUBIR - 1; i++) e = ajustar(e, 'bien');
    e = ajustar(e, 'justo');
    e = ajustar(e, 'bien'); assert.equal(e.nivel, MEDIO);
    e = ajustar(estadoInicial(ALTO), 'bien', MEDIO); assert.equal(e.nivel, MEDIO, 'batería baja: no pasa de medio');
    e = ajustar(ajustar(estadoInicial(BAJO), 'mal'), 'mal'); assert.equal(e.nivel, BAJO, 'no baja de bajo');
  });
});
