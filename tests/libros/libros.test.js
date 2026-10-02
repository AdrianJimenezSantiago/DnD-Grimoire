import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { compendioJson } from '../helpers/fixtures.js';
import { detectarSubclases, idLibro } from '../../web/src/domain/libros/libros.js';
import { loadSrd, setLibros, emparejarLibro, allSpellItems, subclasesDe, manualFor, srdFor, compendio } from '../../web/src/domain/conjuros/catalogo.js';

const L = (s, h = 16) => ({ x: 60, y: 0, h, s });

describe('detectarSubclases', () => {
  test('etiqueta partida, clase por capítulo o por familia del nombre', () => {
    const pags = [{ p: 1, cols: [[L('RASGOS DE BARDO'), L('SUBCLASE DEL', 13), L('COLEGIO DE LAS MAREAS', 15), L('Texto normal.')],
                                 [L('RASGOS DE MAGO'), L('SUBCLASE DE', 13), L('CRONURGO', 15), L('Más texto.')]] }];
    assert.deepEqual(detectarSubclases(pags), [{ clase: 'Bardo', nombre: 'Colegio de las mareas' }, { clase: 'Mago', nombre: 'Cronurgo' }]);
    assert.equal(idLibro('Guía del Aventurero: Costa de la Espada'), 'guia-del-aventurero-costa-de-la-espada');
  });
});

describe('libros importados en el catálogo', () => {
  test('conjuros nuevos entran en el compendio y las subclases en las sugerencias', async () => {
    await loadSrd(compendioJson());
    const base = compendio().length;
    const spells = [
      { nombre: 'Escudo', nivel: 1, escuela: 'Abjuración', clases: ['Mago'], tiempo: 'Reacción', ritual: false, alcance: 'Lanzador', comp: 'V S', material: '', duracion: '1 asalto', conc: false, desc: 'Texto de Escudo.', sup: '' },
      { nombre: 'Rayo de marea', nivel: 2, escuela: 'Evocación', clases: ['Mago', 'Druida'], tiempo: 'Acción', ritual: false, alcance: '18 m', comp: 'V S', material: '', duracion: 'Instantáneo', conc: false, desc: 'Sufre 3d8 de daño de frío.', sup: '' },
    ];
    const { textos, nuevos } = emparejarLibro(spells, 'expansion', 'Expansión de prueba');
    assert.equal(nuevos.length, 1); assert.equal(Object.keys(textos).length, 2);
    setLibros([{ id: 'expansion', titulo: 'Expansión de prueba', textos, nuevos, glosario: [], subclases: [{ clase: 'Mago', nombre: 'Cronurgo' }] }]);
    assert.equal(compendio().length, base + 1);
    const rayo = allSpellItems({ catalog: {} }).find(it => it.es === 'Rayo de marea');
    assert.ok(rayo); assert.equal(rayo.x.fuente, 'Expansión de prueba'); assert.equal(manualFor(rayo.x).d, 'Sufre 3d8 de daño de frío.');
    assert.ok(subclasesDe('Mago').includes('Cronurgo')); assert.ok(subclasesDe('Mago').includes('Adivino'));
    assert.equal(manualFor(srdFor({ en: 'Shield', level: 1 })).d, 'Texto de Escudo.');
    setLibros([]); assert.equal(compendio().length, base);
  });
});
