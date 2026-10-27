import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { tapaTeclado, tecladoAbierto, desplazamiento, repartir, UMBRAL_TECLADO } from '../../web/src/domain/presentacion/teclado.js';

describe('teclado en pantalla', () => {
  test('lo que tapa el teclado sale de la zona visible frente a la ventana', () => {
    assert.equal(tapaTeclado({ alto: 1180, vvAlto: 780 }), 400);
    assert.equal(tapaTeclado({ alto: 1180, vvAlto: 780, vvTop: 120 }), 280);
    assert.equal(tapaTeclado({ alto: 800, vvAlto: 800 }), 0);
    assert.equal(tapaTeclado({ alto: 1180, vvAlto: 590, escala: 2 }), 0);
    assert.equal(tapaTeclado({ alto: 1180, vvAlto: 0 }), 0);
    assert.equal(tapaTeclado({ alto: 1180, vvAlto: 1200 }), 0);
  });

  test('abierto solo con un campo enfocado y una pérdida de alto de teclado', () => {
    assert.equal(tecladoAbierto({ foco: true, tapa: 400, alto: 1180 }), true);
    assert.equal(tecladoAbierto({ foco: true, tapa: 0, alto: 780, altoBase: 1180 }), true);
    assert.equal(tecladoAbierto({ foco: false, tapa: 400, alto: 1180 }), false, 'sin campo enfocado es otra cosa (pantalla dividida, barras)');
    assert.equal(tecladoAbierto({ foco: true, tapa: 44, alto: 1180 }), false, 'la barra de un teclado físico no es un teclado');
    assert.equal(tecladoAbierto({ foco: true, tapa: 0, alto: 1180 - UMBRAL_TECLADO, altoBase: 1180 }), false);
  });

  test('desplazamiento: nada si se ve, lo justo si está debajo y el principio si no cabe', () => {
    const zona = { arriba: 0, abajo: 600 };
    assert.equal(desplazamiento({ arriba: 100, abajo: 150 }, zona), 0);
    assert.equal(desplazamiento({ arriba: 700, abajo: 750 }, zona), 166, 'sube hasta quedar 16 px por encima del teclado');
    assert.equal(desplazamiento({ arriba: -80, abajo: -30 }, zona), -92, 'baja hasta quedar 12 px por debajo del borde');
    assert.equal(desplazamiento({ arriba: 300, abajo: 1100 }, zona), 288, 'más alto que la zona: se alinea por arriba');
    assert.equal(desplazamiento({ arriba: 590, abajo: 640 }, { arriba: 80, abajo: 600 }, { arriba: 0, abajo: 0 }), 40);
  });

  test('repartir pone primero el contenedor interior y el resto en los de fuera', () => {
    assert.deepEqual(repartir(300, [{ pos: 0, max: 1000 }, { pos: 0, max: 1000 }]), [300, 0]);
    assert.deepEqual(repartir(300, [{ pos: 900, max: 1000 }, { pos: 0, max: 1000 }]), [100, 200]);
    assert.deepEqual(repartir(-50, [{ pos: 20, max: 100 }, { pos: 500, max: 900 }]), [-20, -30]);
    assert.deepEqual(repartir(100, [{ pos: 0, max: 0 }]), [0], 'un contenedor sin recorrido no se mueve');
  });
});
