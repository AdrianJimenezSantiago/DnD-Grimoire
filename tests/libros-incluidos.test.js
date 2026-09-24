import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tituloLibro, propuestasSubclase, componerLibro, aceptarPropuestas, hayContenido } from '../web/src/domain/componerLibro.js';

// Lo que devolvería analizarLibro, vacío salvo lo que cada prueba necesita
const leido = extra => ({ titulo: 'archivo', spells: [], glosario: [], subclases: [], objetos: [], dotes: [], trasfondos: [], subTextos: [], rasgosClase: [], especies: [], criaturas: [], ...extra });

test('libros: el título oficial sale del contenido o del nombre del archivo', () => {
  const objetos = Array.from({ length: 200 }, (_, i) => ({ clave: `o${i}`, nombre: `Objeto ${i}` }));
  assert.equal(tituloLibro(leido({ objetos, glosario: [{ clave: 'x', cat: 'Herramientas del DM' }] })), 'Guía del Dungeon Master (2024)');
  assert.equal(tituloLibro(leido({ titulo: 'D&D 5.5 - Reinos Olvidados, Heroes de Faerun' })), 'Reinos Olvidados: Héroes de Faerûn');
  assert.equal(tituloLibro(leido({ titulo: 'Mi suplemento' })), 'Mi suplemento');
  assert.equal(hayContenido(leido()), false);
});
test('libros: sin nadie que confirme solo entran las subclases nuevas con nombre fiable', () => {
  const props = propuestasSubclase([{ clase: 'Mago', nombre: 'Evocador' }, { clase: 'Mago', nombre: 'Escuela de cronurgia' }, { clase: '', nombre: 'Orden rara' }, { clase: 'Bardo', nombre: 'X y Z' }]);
  assert.deepEqual(props.map(p => [p.nombre, p.ok]), [['Escuela de cronurgia', true], ['Orden rara', false], ['X y Z', false]]);   // Evocador ya se conoce
  const { lb } = componerLibro(leido({ titulo: 'Mi suplemento', dotes: [{ clave: 'd', nombre: 'D' }] }), 5);
  assert.equal(lb.id, 'mi-suplemento'); assert.equal(lb.fecha, 5);
  assert.deepEqual(aceptarPropuestas(lb, props).subclases, [{ clase: 'Mago', nombre: 'Escuela de cronurgia' }]);
});
