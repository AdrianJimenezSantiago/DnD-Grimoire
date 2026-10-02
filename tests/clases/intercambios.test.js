import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../../web/src/domain/personaje/modelo.js';
import { opcionesIntercambio, nivelCambia, esHumano } from '../../web/src/domain/clases/intercambios.js';

const guerrero = over => normChar(blankChar({ clase: 'Guerrero', nivel: 3, stats: { con: 14, des: 14 }, ...over }));

describe('opcionesIntercambio', () => {
  test('qué conjuros y opciones puedes cambiar en cada descanso según tu clase', () => {
    const titulos = (ch, m, o) => opcionesIntercambio(ch, m, o).map(x => x.titulo);
    assert.deepEqual(titulos(guerrero({ clase: 'Mago', nivel: 5 }), 'largo'), ['Cambiar tus preparados', 'Cambiar un truco']);
    assert.deepEqual(titulos(guerrero({ clase: 'Mago', nivel: 5 }), 'corto'), ['Memorizar conjuro']);
    assert.deepEqual(titulos(guerrero({ clase: 'Mago', nivel: 4 }), 'corto'), []);
    assert.deepEqual(titulos(guerrero({ clase: 'Paladín', nivel: 2 }), 'largo'), ['Cambiar un conjuro preparado', 'Cambiar maestrías de armas']);
    assert.ok(titulos(guerrero({ clase: 'Druida', nivel: 2 }), 'largo').includes('Cambiar una forma conocida'));
    assert.deepEqual(titulos(guerrero({ clase: 'Bardo', nivel: 4 }), 'largo'), []);
    assert.deepEqual(titulos(guerrero({ clase: 'Brujo', nivel: 5 }), 'nivel'), ['Cambiar un conjuro', 'Cambiar un truco', 'Cambiar una invocación']);
    assert.ok(titulos(guerrero({ clase: 'Guerrero', nivel: 3, subclase: 'Caballero arcano' }), 'nivel').includes('Cambiar un conjuro'));
    assert.ok(titulos(guerrero({ clase: 'Guerrero', nivel: 3, subclase: 'Maestro del combate' }), 'nivel').includes('Cambiar una maniobra'));
    const ini = guerrero({ clase: 'Pícaro', nivel: 4, dotes: ['Iniciado en la magia (mago)'] });
    assert.ok(nivelCambia(ini, 'Pícaro').some(x => x.titulo === 'Cambiar un conjuro de la dote'));
    assert.ok(titulos(guerrero({ especie: 'Alto elfo' }), 'largo').includes('Cambiar tu truco élfico'));
    assert.ok(esHumano(guerrero({ especie: 'Humano' }))); assert.ok(!esHumano(guerrero({ especie: 'Mediano' })));
  });
});
