import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { leerConjuros, nombreBonito } from '../../web/src/domain/libros/manual.js';

const L = (x, y, s, h = 16) => ({ x, y, h, s });
const page = { p: 1, cols: [[
  L(60, 1300, 'CHISPA DE PRUEBA', 20), L(60, 1280, 'Evocación de nivel1 (hechicero, mago)'),
  L(60, 1260, 'Tiempo de lanzamiento: Acción o ritual'), L(60, 1240, 'Alcance: 18 m'),
  L(60, 1220, 'Componentes: V, S, M (una piedra que valga al menos'), L(60, 1200, '50 po)'),
  L(60, 1180, 'Duración: Concentración, hasta 1 minuto'),
  L(60, 1160, 'Primer párrafo inventado para la prueba.'), L(70, 1140, 'Segundo párrafo, con sangría.'),
  L(60, 1120, 'UN PIE DE FOTO EN MAYÚSCULAS.'),
  L(70, 1100, 'Con un espacio de conjuro de nivel superior. Sube el daño.'),
  L(60, 1060, 'Escupo', 20), L(60, 1040, 'Abjuración de nivel 1 (mago)'),
  L(60, 1020, 'Tiempo de lanzamiento: Reacción, que llevas a cabo cuando algo pasa'),
  L(60, 1000, 'Alcance: Lanzador'), L(60, 980, 'Componentes: V, S'), L(60, 960, 'Instantáneo'), L(60, 940, 'Duración:'),
  L(60, 920, 'Texto del segundo conjuro.'),
], []] };

describe('leerConjuros', () => {
  test('leerConjuros separa cabecera, campos, párrafos y nivel superior', () => {
    const [a, b] = leerConjuros([page]);
    assert.equal(a.nombre, 'Chispa de prueba'); assert.equal(a.nivel, 1); assert.equal(a.escuela, 'Evocación');
    assert.deepEqual(a.clases, ['Hechicero', 'Mago']);
    assert.equal(a.tiempo, 'Acción'); assert.equal(a.ritual, true); assert.equal(a.conc, true);
    assert.equal(a.comp, 'V S M'); assert.match(a.material, /50 po/);
    assert.equal(a.desc.split('\n\n').length, 2); assert.doesNotMatch(a.desc, /PIE DE FOTO/);
    assert.equal(a.sup, 'Sube el daño.');
    assert.equal(b.nombre, 'Escudo');
    assert.equal(b.duracion, 'Instantáneo');
    assert.equal(b.tiempo, 'Reacción, que llevas a cabo cuando algo pasa');
  });
});

describe('nombreBonito', () => {
  test('nombres propios y comillas decorativas', () => {
    assert.equal(nombreBonito('“TELEQUINESIS'), 'Telequinesis');
    assert.equal(nombreBonito('RISA HORRIBLE DE TASHA'), 'Risa horrible de Tasha');
  });
});
