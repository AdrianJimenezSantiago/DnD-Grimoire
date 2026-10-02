import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { anadirObjeto, alternarSintonia, alternarGuardado } from '../web/src/domain/equipo.js';
import { ACCIONES, accionesDe, motivoAccion, usarAccion, opcionesEscala, espaciosRecuperables, recursoDe } from '../web/src/domain/accionesObjeto.js';
import { reglas, usosGastados, recState } from '../web/src/domain/rasgos.js';
import { perfil } from '../web/src/domain/reglas2024.js';
import { pgActuales, aplicarDano } from '../web/src/domain/vida.js';
import { loadSrd, compendio } from '../web/src/domain/catalogo.js';
import { norm } from '../web/src/core/util.js';

const ch = (o = {}) => normChar(blankChar({ clase: 'Mago', nivel: 7, stats: { fue: 10, des: 14, con: 12, int: 16, sab: 10, car: 10 }, ...o }));
const lib = (nombre, tipo, extra = {}) => ({ clave: norm(nombre), nombre, tipo, rareza: 'Raro', texto: '', cargas: null, sintonia: false, ...extra });
const accion = (o, re) => accionesDe(o).find(a => re.test(a.titulo));

test('Perla de poder: recupera un espacio de nivel 3 o inferior, una vez hasta el amanecer y solo sintonizada', () => {
  const c = ch(); c.play.used = { 1: 1, 3: 2, 4: 1 };
  const p = anadirObjeto(c, lib('Perla de poder', 'Objeto maravilloso', { sintonia: true, sintoniaCon: 'parte de un lanzador de conjuros', usos: [{ nombre: 'Perla de poder', recarga: 'largo' }] }));
  const a = accionesDe(p)[0];
  assert.equal(a.tipo, 'recuperar');
  assert.match(motivoAccion(c, p, a), /sintonizado/);
  alternarSintonia(c, p.id);
  assert.deepEqual(espaciosRecuperables(c, a.nivMax).map(([L]) => L), [1, 3], 'el de nivel 4 no se puede');
  const r = usarAccion(c, p, a, { L: 3 });
  assert.ok(r.ok); assert.equal(r.nivel, 3); assert.equal(c.play.used[3], 1);
  assert.equal(recursoDe(c, p, a).id, p.usos[0], 'gasta el uso que ya tenía, no crea otro');
  assert.match(motivoAccion(c, p, a), /amanecer/);
  assert.equal(usarAccion(c, p, a, { L: 1 }).ok, false);
  // Al amanecer (descanso largo) el uso vuelve
  c.play.rec = {};
  assert.equal(motivoAccion(c, p, a), '');
  c.play.used = {};
  assert.match(motivoAccion(c, p, a), /No tienes espacios/);
  c.play.used = { 2: 1 }; alternarGuardado(c, p.id);
  assert.match(motivoAccion(c, p, a), /encima/);
});

test('Vara del pacto: recupera un espacio de pacto, una vez por descanso largo; sin uso previo lo crea', () => {
  const b = ch({ clase: 'Brujo', stats: { fue: 10, des: 14, con: 12, int: 10, sab: 10, car: 16 } }), P = perfil(b);
  b.play.used = { [P.pact.level]: P.pact.n };
  const v = anadirObjeto(b, lib('Vara del pacto +1', 'Vara', { sintonia: true, sintoniaCon: 'parte de un brujo' }));
  alternarSintonia(b, v.id);
  const a = accionesDe(v)[0];
  assert.ok(usarAccion(b, v, a).ok);
  assert.equal(b.play.used[P.pact.level], P.pact.n - 1);
  assert.equal(v.usos.length, 1, 'el uso se crea al usarlo');
  assert.ok(reglas(b).some(r => r.id === v.usos[0] && r.objetoId === v.id));
});

test('bastones y varitas: conjuros con su coste en cargas, nivel y CD', () => {
  const c = ch(), f = anadirObjeto(c, lib('Bastón de fuego', 'Bastón', { sintonia: true, cargas: { max: 10, recarga: '1d6+4', cuando: 'amanecer' } }));
  alternarSintonia(c, f.id);
  const bola = accion(f, /^Bola de fuego/);
  assert.equal(bola.coste, 3);
  usarAccion(c, f, bola);
  assert.equal(usosGastados(c, reglas(c).find(r => r.id === f.rasgo)), 3);
  const muro = accion(f, /^Muro de fuego/); recState(c, f.rasgo).used = 8;
  assert.match(motivoAccion(c, f, muro), /No le quedan 4 cargas/);
  const v = anadirObjeto(c, lib('Varita de bolas de fuego', 'Varita', { sintonia: true, cargas: { max: 7, recarga: '1d6+1', cuando: 'amanecer' } }));
  const b2 = accionesDe(v)[0];
  assert.deepEqual(opcionesEscala(b2), [{ cargas: 1, nivel: 3 }, { cargas: 2, nivel: 4 }, { cargas: 3, nivel: 5 }]);
  assert.equal(b2.cd, 15);
  const cur = accion(anadirObjeto(c, lib('Bastón de curación', 'Bastón', { cargas: { max: 10, recarga: '1d6+4' } })), /^Curar heridas$/);
  assert.deepEqual(opcionesEscala(cur).map(x => x.cargas), [1, 2, 3, 4]);
  assert.equal(accion(anadirObjeto(c, lib('Bastón de poder', 'Bastón')), /^Relámpago/).nivel, 5);
});

test('curación y tiradas desde el objeto', () => {
  const c = ch(), t = anadirObjeto(c, lib('Talismán de salud', 'Objeto maravilloso', { sintonia: true }));
  alternarSintonia(c, t.id); aplicarDano(c, 20);
  const antes = pgActuales(c), r = usarAccion(c, t, accionesDe(t)[0], { tirar: () => 1 });
  assert.equal(r.curado, 4); assert.equal(pgActuales(c), antes + 4);
  assert.match(motivoAccion(c, t, accionesDe(t)[0]), /amanecer/);
  const im = anadirObjeto(c, lib('Bastón de impacto', 'Bastón', { sintonia: true, cargas: { max: 10, recarga: '1d6+4' } })); alternarSintonia(c, im.id);
  assert.equal(usarAccion(c, im, accionesDe(im)[0], { cargas: 3, tirar: () => 2 }).tirada.total, 6, '3d6 con tres cargas');
});

test('todos los conjuros de la tabla existen en el compendio', async () => {
  await loadSrd(Promise.resolve(JSON.parse(fs.readFileSync('web/public/data/compendio.json', 'utf8'))));
  const hay = new Set(compendio().map(x => norm(x.es))), faltan = new Set();
  for (const [, acs] of ACCIONES) for (const a of acs) if (a.tipo === 'conjuro' && !hay.has(norm(a.nombre))) faltan.add(a.nombre);
  assert.deepEqual([...faltan], []);
});
