import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { crearVocabulario } from '../../web/src/domain/libros/corrector.js';
import { fusionar } from '../../web/src/domain/libros/fusion.js';

const rep = (txt, n) => Array(n).fill(txt).join(' ');
const voc = crearVocabulario([
  rep('el de la que y a en un una los las del se por con no su al lo como más tu', 60),
  rep('conjuro objetivo criatura daño beneficio fuerza produzca catastrófico beneficios siguientes magos rojos inteligencia sabiduría tiene', 30)
]);

describe('fusionar', () => {
  test('la segunda lectura arregla las palabras que en la base no lo son', () => {
    assert.deepEqual(fusionar(['puede ser catastrófico si se prnduzca', 'el uhjetivo recibe daño de fuerza.'],
      'puede ser catastrófico si se produzca el objetivo recibe daño de fuerza.', voc),
    ['puede ser catastrófico si se produzca', 'el objetivo recibe daño de fuerza.']);
  });

  test('conserva líneas, puntuación y mayúsculas de la base', () => {
    assert.deepEqual(fusionar(['BAGATELAS DE LOS MACIOS ROJOS', '1nteligencía, sabiduría'], 'Bagatelas de los magos rojos inteligencia sabiduría', voc),
      ['BAGATELAS DE LOS MAGOS ROJOS', 'Inteligencia, sabiduría']);
    assert.deepEqual(fusionar(['un henefido:'], 'un beneficio', voc), ['un beneficio:']);
  });

  test('no toca la base si ya está bien o si la otra lectura es peor o es otro texto', () => {
    assert.deepEqual(fusionar(['la criatura tiene daño'], 'la criatnra tieue daño', voc), ['la criatura tiene daño']);
    assert.deepEqual(fusionar(['el uhjetivo'], 'el ubjetivo', voc), ['el uhjetivo']);
    assert.deepEqual(fusionar(['el xqzv recibe daño'], 'el conjuro recibe daño', voc), ['el xqzv recibe daño']);
    assert.deepEqual(fusionar(['el uhjetivo'], '', voc), ['el uhjetivo']);
  });

  test('nunca cambia cifras', () => {
    assert.deepEqual(fusionar(['VD: 1/8 (25 PX; BC+2)'], 'VD: 1/8 (25 PX; BC)', voc), ['VD: 1/8 (25 PX; BC+2)']);
    assert.deepEqual(fusionar(['la 1nteligencía'], 'la inteligencia', voc), ['la Inteligencia']);
  });
});
