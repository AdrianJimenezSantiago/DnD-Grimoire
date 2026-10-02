import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';
import { RASGOS_ESPECIE, visionOscuridad, resumenRasgoEspecie, aptitudEspecie } from '../web/src/domain/origen/especies.js';
import { rasgosEnJuego } from '../web/src/domain/clases/enJuego.js';
import { parseEspecies } from '../web/src/domain/libros/contenido.js';
import { reaccionesDano, alCaerA0, alGastarRecurso } from '../web/src/domain/combate/automatismos.js';
import { reglas, recState } from '../web/src/domain/clases/rasgos.js';
import { aplicarDano, pgActuales, ponerEfecto } from '../web/src/domain/combate/vida.js';
import { modsTirada, EFECTO_DE_RECURSO } from '../web/src/domain/combate/efectos.js';
import { capacidadCarga, PREDEFINIDOS } from '../web/src/domain/equipo/equipo.js';
import { opcionesAlImpactar } from '../web/src/domain/combate/alImpactar.js';
import { bonosDeConjuro } from '../web/src/domain/conjuros/bonosConjuro.js';
import { perfil, magiaPara } from '../web/src/domain/reglas/reglas2024.js';
import { normOpciones } from '../web/src/domain/clases/opcionesRasgo.js';
import { fuentesExtra } from '../web/src/domain/personaje/creacion.js';

const stats = { fue: 16, des: 12, con: 14, int: 10, sab: 13, car: 16 };
const ch = o => normChar(blankChar({ stats, ...o }));
const libres = (c, id) => { const r = reglas(c).find(x => x.id === id); return r.max - (recState(c, id).used || 0); };

test('Forma grande del goliat: nivel 5, en la tabla y aunque el libro diga «A partir del nivel 5»', () => {
  assert.deepEqual(RASGOS_ESPECIE.goliat.find(r => r[1] === 'Forma grande'), [5, 'Forma grande']);
  const nombres = L => rasgosEnJuego(ch({ clase: 'Guerrero', nivel: L, especie: 'Goliat' })).filter(r => r.fuente === 'especie').map(r => r.nombre);
  assert.ok(!nombres(4).includes('Forma grande')); assert.ok(nombres(5).includes('Forma grande'));
  // Libro importado con el nivel mal leído (1): manda la tabla integrada
  const lib = { especies: [{ nombre: 'Goliat', rasgos: [{ nombre: 'Forma grande', nivel: 1, texto: 'A partir del nivel 5 de personaje, puedes…' }] }] };
  assert.ok(!rasgosEnJuego(ch({ clase: 'Guerrero', nivel: 3, especie: 'Goliat' }), lib).some(r => r.nombre === 'Forma grande'));
  // El lector reconoce «A partir del nivel N de personaje»
  const L = (s, y, h = 12) => ({ s, x: 50, y, h });
  const [e] = parseEspecies([{ p: 1, cols: [[L('ATRIBUTOS DE LOS GOLIATS', 900, 16), L('Tipo de criatura: humanoide', 880), L('Velocidad: 10,5 m', 866),
    L('Como goliat, tienes estos atributos especiales:', 852),
    L('Constitución poderosa. Tienes ventaja para poner fin al estado de', 838), L('agarrado.', 826),
    L('Forma grande. A partir del nivel 5 de personaje, puedes cambiar de tamaño', 814), L('a Grande como acción adicional.', 802)], []] }]);
  assert.deepEqual(e.rasgos.map(r => [r.nombre, r.nivel]), [['Constitución poderosa', 1], ['Forma grande', 5]]);
});

test('sin manual: cada atributo de especie tiene su resumen y la visión en la oscuridad su alcance', () => {
  for (const [esp, rs] of Object.entries(RASGOS_ESPECIE)) for (const [, n] of rs) assert.ok(resumenRasgoEspecie(ch({ especie: esp }), n), `${esp}: ${n}`);
  assert.equal(visionOscuridad(ch({ especie: 'Enano' })), 36); assert.equal(visionOscuridad(ch({ especie: 'Orco' })), 36);
  assert.equal(visionOscuridad(ch({ especie: 'Elfo (drow)' })), 36); assert.equal(visionOscuridad(ch({ especie: 'Elfo (alto elfo)' })), 18);
  assert.equal(visionOscuridad(ch({ especie: 'Goliat' })), 0);
  const v = rasgosEnJuego(ch({ clase: 'Mago', especie: 'Enano' })).find(r => r.nombre === 'Visión en la oscuridad');
  assert.deepEqual(v.numeros, [{ nombre: 'Alcance', valor: '36 m' }]); assert.ok(v.texto);
  assert.equal(fuentesExtra(ch({ especie: 'Humano' }))[0].nombre, 'Humano (Diestro)');
});

test('goliat: Constitución poderosa, carga en Forma grande y reacciones del linaje gigante', () => {
  const g = ch({ clase: 'Guerrero', nivel: 5, especie: 'Goliat', opciones: { 'especie.goliat': 'Resistencia de la piedra' } });
  assert.ok(modsTirada(g, { sobre: 'prueba', ab: 'fue', hab: 'atletismo' }).some(m => m.fuente === 'Constitución poderosa' && m.cond));
  assert.equal(capacidadCarga(g), 16 * 7.5 * 2); ponerEfecto(g, 'formagrande'); assert.equal(capacidadCarga(g), 16 * 7.5 * 4);
  const piedra = reaccionesDano(g, () => 7).find(r => r.k === 'piedra');
  assert.equal(piedra.aplica(g, 20), 20 - (7 + 2)); assert.equal(libres(g, 'tpl:especie.gigante'), 2);
  const t = ch({ clase: 'Guerrero', nivel: 1, especie: 'Goliat', opciones: { 'especie.goliat': 'Trueno de la tormenta' } });
  const trueno = reaccionesDano(t).find(r => r.k === 'trueno');
  assert.deepEqual(trueno.tirada, { titulo: 'Trueno de la tormenta', expr: '1d8', tipo: 'trueno' }); assert.equal(trueno.aplica(t, 9), 9);
  trueno.aplica(t, 9); assert.ok(!reaccionesDano(t).some(r => r.k === 'trueno'), 'sin usos no se ofrece');
  const nube = ch({ clase: 'Guerrero', nivel: 1, especie: 'Goliat', opciones: { 'especie.goliat': 'Excursión de las nubes' } });
  assert.match(alGastarRecurso(nube, 'tpl:especie.gigante').join(' '), /teletransportas hasta 9 m/);
});

test('orco: Aguante incansable al caer a 0 y Descarga de adrenalina con Correr', () => {
  const o = ch({ clase: 'Guerrero', nivel: 1, especie: 'Orco' });
  const r = aplicarDano(o, pgActuales(o) + 3); assert.ok(r.cayo && !r.muerte);
  const op = alCaerA0(o).find(x => x.k === 'aguante'); op.aplica(o);
  assert.equal(pgActuales(o), 1); assert.equal(libres(o, 'tpl:especie.aguante'), 0); assert.equal(alCaerA0(o).length, 0);
  assert.equal(alCaerA0(ch({ clase: 'Guerrero', especie: 'Humano' })).length, 0);
  assert.equal(EFECTO_DE_RECURSO['tpl:especie.adrenalina'], 'correr');
});

test('aasimar: Revelación celestial con el tipo de la transformación elegida', () => {
  const a = ch({ clase: 'Paladín', nivel: 3, especie: 'Aasimar', opciones: { 'especie.aasimar': 'Mortaja necrótica' } });
  assert.match(alGastarRecurso(a, 'tpl:especie.revelacion').join(' '), /Carisma CD 13/);
  ponerEfecto(a, 'revelacion');
  const espada = JSON.parse(JSON.stringify(PREDEFINIDOS.find(p => p.nombre === 'Espada larga')));
  assert.equal(opcionesAlImpactar(a, espada).find(o => o.k === 'revelacion').nombre, '+2 necrótico');
  const b = bonosDeConjuro(a, { level: 1, escuela: 'Evocación' }, 'Paladín', [{ tipo: 'radiante' }]);
  assert.match(b[0].notas.join(), /Revelación celestial: \+2 de daño necrótico/);
  a.opciones['especie.aasimar'] = 'Fulgor interior';
  assert.match(alGastarRecurso(a, 'tpl:especie.revelacion').join(' '), /2 de daño radiante a cada criatura/);
});

test('conjuros de especie con su propia aptitud mágica (Int, Sab o Car)', () => {
  // Guerrero tiefling: sin clase lanzadora, usa su mejor característica mental (Car 16)
  const t = ch({ clase: 'Guerrero', nivel: 3, especie: 'Tiefling', opciones: { 'especie.tiefling': 'Infernal' } });
  const P = perfil(t); assert.equal(P.apEspecie, 'car');
  assert.equal(magiaPara(P, 'Legado infernal').cd, 8 + 2 + 3); assert.equal(magiaPara(P, 'Presencia sobrenatural').atk, 2 + 3);
  // Mago elfo: por defecto la Inteligencia de su clase; si elige Carisma, sus conjuros de linaje usan el Carisma
  const e = ch({ clase: 'Mago', nivel: 3, especie: 'Elfo (drow)', stats: { ...stats, int: 16, car: 12 } });
  assert.equal(perfil(e).apEspecie, 'int'); assert.equal(perfil(e).cds.length, 1);
  e.opciones = normOpciones({ 'especie.elfo': 'Drow', 'especie.aptitud': 'Carisma' });
  assert.equal(e.opciones['especie.aptitud'], 'Carisma');
  const Pe = perfil(e); assert.equal(magiaPara(Pe, 'Linaje élfico').cd, 8 + 2 + 1); assert.equal(magiaPara(Pe, 'Mago').cd, 8 + 2 + 3);
  assert.equal(aptitudEspecie(ch({ especie: 'Humano' })), '');
  const r = rasgosEnJuego(e).find(x => x.nombre === 'Linaje élfico');
  assert.equal(r.eleccion2.id, 'especie.aptitud'); assert.ok(r.numeros.some(n => n.nombre === 'Aptitud mágica' && n.valor === 'Carisma'));
});
