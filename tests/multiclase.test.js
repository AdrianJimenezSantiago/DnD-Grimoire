import { test } from 'node:test';
import assert from 'node:assert/strict';
import { perfil, clasesDe, nivelTotal, requisitosMulticlase, dotesDe } from '../web/src/domain/reglas2024.js';
import { normChar } from '../web/src/domain/modelo.js';
import { reglas } from '../web/src/domain/rasgos.js';
import { limiteFormaSalvaje } from '../web/src/domain/monstruos.js';
import { rasgosEnJuego, agrupar, numerosMarciales } from '../web/src/domain/enJuego.js';
import { parseEspecies } from '../web/src/domain/contenido.js';

const pj = (clase, nivel, multiclase = [], extra = {}) => ({ clase, subclase: '', nivel, multiclase, stats: { fue: 14, des: 14, con: 14, int: 14, sab: 14, car: 14 }, play: { rec: {} }, rasgos: [], ...extra });

test('multiclase: nivel total, competencia y clases (sin repetir ni pasar de 20)', () => {
  const ch = pj('Bárbaro', 5, [{ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 }, { clase: 'Bárbaro', nivel: 2 }, { clase: 'Inventada', nivel: 1 }]);
  assert.deepEqual(clasesDe(ch).map(c => `${c.clase} ${c.nivel}`), ['Bárbaro 5', 'Guerrero 3']);
  assert.equal(nivelTotal(ch), 8); assert.equal(perfil(ch).pb, 3); assert.deepEqual(perfil(ch).slots, {});
  assert.equal(nivelTotal(pj('Mago', 15, [{ clase: 'Clérigo', nivel: 9 }])), 20);   // el resto no cabe
  // recursos de las dos clases
  assert.deepEqual(reglas(ch).map(r => r.nombre), ['Furia', 'Tomar aliento', 'Acción súbita']);
});
test('multiclase: espacios según el Manual del Jugador 2024', () => {
  // una sola clase lanzadora: su propia tabla a su nivel
  assert.deepEqual(perfil(pj('Mago', 5, [{ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 }])).slots, { 1: 4, 2: 3, 3: 2 });
  // varias: niveles de lanzador sumados (mitad hacia arriba, tercio hacia abajo) en la tabla completa
  assert.deepEqual(perfil(pj('Explorador', 5, [{ clase: 'Paladín', nivel: 4 }])).slots, { 1: 4, 2: 3, 3: 2 });          // 3 + 2 = 5
  assert.deepEqual(perfil(pj('Guerrero', 3, [{ clase: 'Mago', nivel: 1 }], { subclase: 'Caballero arcano' })).slots, { 1: 3 }); // 1 + 1 = 2
  // pacto aparte (y en el descanso corto solo vuelven los de pacto)
  const P = perfil(pj('Paladín', 5, [{ clase: 'Hechicero', nivel: 3 }, { clase: 'Brujo', nivel: 2 }]));
  assert.deepEqual(P.pact, { level: 1, n: 2 }); assert.deepEqual(P.slots, { 1: 6, 2: 3, 3: 3 });
  assert.equal(P.maxPrep, 6 + 6 + 3); assert.deepEqual(P.listas, ['Paladín', 'Hechicero', 'Brujo']);
  // si la principal no lanza, manda la aptitud de la que sí
  assert.equal(perfil(pj('Bárbaro', 3, [{ clase: 'Druida', nivel: 2 }])).apKey, 'sab');
});
test('multiclase: requisitos, modelo y nivel de druida para Forma salvaje', () => {
  const ch = pj('Bárbaro', 5, [{ clase: 'Mago', nivel: 1 }], { stats: { fue: 15, des: 12, con: 14, int: 10, sab: 10, car: 8 } });
  assert.deepEqual(requisitosMulticlase(ch), [{ clase: 'Mago', falta: 'Inteligencia 13' }]);
  const c = normChar({ nombre: 'X', clase: 'Druida', nivel: 4, multiclase: [{ clase: 'Druida', nivel: 2 }, { clase: 'Monje', nivel: 40 }, { clase: 'Monje', nivel: 1 }, null], dotes: ['Alerta', ' Alerta ', '', 'Duro'] });
  assert.deepEqual(c.multiclase, [{ clase: 'Monje', subclase: '', nivel: 19 }]); assert.deepEqual(c.dotes, ['Alerta', 'Duro']);
  assert.equal(limiteFormaSalvaje(pj('Monje', 10, [{ clase: 'Druida', nivel: 4 }])).vd, 0.5);   // nivel 4 de druida, no 14
});
test('dotes: la de origen sale del trasfondo (también de un libro importado) y se suman las elegidas', () => {
  assert.deepEqual(dotesDe({ trasfondo: 'Erudito', dotes: ['Alerta', 'Iniciado en la magia (mago)'] }),
    [{ nombre: 'Iniciado en la magia', detalle: 'mago', origen: 'trasfondo' }, { nombre: 'Alerta', detalle: '', origen: 'elegida' }]);
  assert.equal(dotesDe({ trasfondo: 'Pescador en hielo', dotes: [] }, [{ nombre: 'Pescador en hielo', dote: 'Alerta' }])[0].nombre, 'Alerta');
});
// Especie inventada con la forma del libro
const L = (s, y, h = 12) => ({ s, x: 50, y, h });
// cada entrada acaba en una línea corta, como en el libro: así se separan los párrafos
const ESPECIE = [{ p: 1, cols: [[
  L('ATRIBUTOS DE LOS ENANOS', 900, 16), L('Tipo de criatura: humanoide', 880), L('Tamaño: Mediano', 866), L('Velocidad: 9 m', 852),
  L('Como enano, tienes estos atributos especiales:', 838),
  L('Piel de roca. Tienes resistencia al daño de veneno y ventaja en las', 824), L('salvaciones.', 812),
  L('Sentido pétreo. Como acción adicional, percibes la piedra a tu alrededor', 800), L('durante 10 minutos.', 788),
  L('Legado de la forja. Cuando alcanzas el nivel 3 de personaje, elige una', 776), L('de las siguientes opciones para siempre.', 764),
  L('Yunque. Tus golpes con martillo hacen 1d4 de daño adicional al', 752), L('objetivo.', 740),
  L('Visión en la oscuridad. Tienes visión en la oscuridad hasta 36 m y', 728), L('ves colores.', 716)], []] }];
test('especies: atributos del libro (opciones dentro del atributo que las ofrece) y en juego por nivel', () => {
  const [e] = parseEspecies(ESPECIE);
  assert.equal(e.nombre, 'Enano'); assert.equal(e.velocidad, '9 m');
  assert.deepEqual(e.rasgos.map(r => [r.nombre, r.nivel]), [['Piel de roca', 1], ['Sentido pétreo', 1], ['Legado de la forja', 3], ['Visión en la oscuridad', 1]]);
  assert.match(e.rasgos[2].texto, /\*\*Yunque\.\*\*/);
  const lib = { especies: [e], dotes: [{ nombre: 'Alerta', cat: 'Origen', texto: 'Tienes ventaja en las tiradas de iniciativa.' }] };
  const ch = pj('Guerrero', 2, [], { especie: 'Enano', trasfondo: 'Criminal' });
  const rs = rasgosEnJuego(ch, lib, []);
  assert.deepEqual(rs.filter(r => r.fuente === 'especie').map(r => `${r.nombre}/${r.grupo}`), ['Piel de roca/pasivo', 'Sentido pétreo/adicional', 'Visión en la oscuridad/fuera']);
  const alerta = rs.find(r => r.fuente === 'dote');
  assert.equal(alerta.nombre, 'Alerta'); assert.equal(alerta.etiqueta, 'Dote de origen · Criminal'); assert.equal(alerta.grupo, 'pasivo');
  assert.deepEqual(agrupar(rs, [], 'especie').flatMap(g => g.rasgos).map(r => r.fuente), ['especie', 'especie', 'especie']);
  // a nivel 3 llega Legado de la forja
  assert.ok(rasgosEnJuego({ ...ch, multiclase: [{ clase: 'Pícaro', nivel: 1 }] }, lib, []).some(r => r.nombre === 'Legado de la forja'));
});
test('en juego: con multiclase, el mismo rasgo de dos clases es una sola tarjeta y la cabecera suma los dados de golpe', () => {
  const ch = pj('Bárbaro', 5, [{ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 }]);
  const maestria = rasgosEnJuego(ch, {}, reglas(ch)).filter(r => r.nombre === 'Maestría con armas');
  assert.equal(maestria.length, 1); assert.equal(maestria[0].etiqueta, 'Nivel 1 · Bárbaro y Guerrero');
  assert.ok(rasgosEnJuego(ch, {}, reglas(ch)).some(r => r.origen === 'multiclase' && r.nombre === 'Tomar aliento' && r.recurso?.nombre === 'Tomar aliento'));
  const n = numerosMarciales(ch);
  assert.deepEqual(n.find(x => x.nombre === 'Dado de golpe'), { nombre: 'Dado de golpe', valor: '5d12 + 3d10' });
  assert.deepEqual(n.find(x => x.nombre === 'Competencia'), { nombre: 'Competencia', valor: '+3' });
});
