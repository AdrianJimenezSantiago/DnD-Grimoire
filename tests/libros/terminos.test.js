import { describe, test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setGlosario, glosario, termino, estadosRegex, claveDeForma } from '../../web/src/domain/libros/terminos.js';

const GLOSARIO = [
  { clave: 'apresado', nombre: 'Apresado', cat: 'Estado', texto: 'Tu velocidad es 0 y no puede aumen- tar.' },
  { clave: 'cobertura', nombre: 'Cobertura', cat: 'Regla', texto: 'Media cobertura: +2 a la CA.' },
];

afterEach(() => setGlosario(null));

describe('setGlosario y termino', () => {
  test('guarda los términos por clave y limpia los cortes de línea del PDF', () => {
    setGlosario(GLOSARIO);
    assert.equal(glosario().length, 2);
    assert.equal(termino('apresado').texto, 'Tu velocidad es 0 y no puede aumentar.');
    assert.equal(termino('nada'), null);
  });

  test('sin glosario no hay términos ni expresión', () => {
    setGlosario([]);
    assert.deepEqual(glosario(), []);
    assert.equal(estadosRegex(), null);
  });
});

describe('estadosRegex y claveDeForma', () => {
  test('encuentra los estados en todas sus formas y los términos curados del manual', () => {
    setGlosario(GLOSARIO);
    const { re } = estadosRegex();
    const vistos = [...'Queda apresada tras la cobertura; los apresados no se mueven.'.matchAll(re)].map(m => m[2]);
    assert.deepEqual(vistos, ['apresada', 'cobertura', 'apresados']);
    assert.equal(claveDeForma('Apresadas'), 'apresado');
    assert.equal(claveDeForma('cobertura'), 'cobertura');
  });

  test('no marca palabras que solo contienen el término', () => {
    setGlosario(GLOSARIO);
    assert.equal([...'Las coberturas'.matchAll(estadosRegex().re)].length, 0);
  });
});
