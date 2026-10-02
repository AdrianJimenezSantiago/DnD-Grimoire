import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';
import { fuentesExtra, repartoHabilidades } from '../web/src/domain/personaje/creacion.js';
import { periciasDisponibles } from '../web/src/domain/reglas/habilidades.js';
import { varianteDe, variantesPendientes, golpeExtra, trucoPotente } from '../web/src/domain/clases/variantes.js';
import { cupoManiobras, cdManiobras, maniobrasDe, alternarManiobra, MANIOBRAS } from '../web/src/domain/clases/maniobras.js';
import { escalas } from '../web/src/domain/clases/clases2024.js';
import { ataqueArma, golpeSinArmas } from '../web/src/domain/equipo/equipo.js';
import { rasgosEnJuego } from '../web/src/domain/clases/enJuego.js';
import { reglas } from '../web/src/domain/clases/rasgos.js';

const ch = (o = {}) => normChar(blankChar({ stats: { fue: 16, des: 14, con: 14, int: 10, sab: 16, car: 10 }, ...o }));

test('dominio del conocimiento: pide dos habilidades con pericia y cuenta esas pericias', () => {
  const c = ch({ clase: 'Clérigo', subclase: 'Dominio del conocimiento', nivel: 3 });
  const f = fuentesExtra(c).find(x => x.nombre === 'Bendiciones del conocimiento');
  assert.ok(f, 'sin fuente de habilidades');
  assert.equal(f.n, 2); assert.ok(f.pericia);
  assert.deepEqual(f.lista, ['arcanos', 'historia', 'naturaleza', 'religion']);
  assert.equal(periciasDisponibles(c), 2);
  assert.equal(fuentesExtra({ ...c, nivel: 2, subclase: '' }).length, 0);
});

test('subclases con competencias: Maestro del combate, Errante feérico y Misericordia (fijas)', () => {
  assert.ok(fuentesExtra(ch({ clase: 'Guerrero', subclase: 'Maestro del combate', nivel: 3 })).some(f => f.nombre === 'Estudioso de la guerra' && f.n === 1));
  assert.ok(fuentesExtra(ch({ clase: 'Explorador', subclase: 'Errante feérico', nivel: 3 })).some(f => f.nombre === 'Glamur sobrenatural'));
  const m = fuentesExtra(ch({ clase: 'Monje', subclase: 'Guerrero de la misericordia', nivel: 3 })).find(f => f.fijas);
  assert.deepEqual(m.lista, ['perspicacia', 'medicina']);
});

test('Habilidoso del trasfondo: tres habilidades por elegir que cuentan como extra', () => {
  const c = ch({ clase: 'Pícaro', trasfondo: 'Charlatán' });
  const f = fuentesExtra(c).find(x => /Habilidoso/.test(x.nombre));
  assert.equal(f.n, 3); assert.ok(f.herramientas);
  assert.equal(repartoHabilidades(c).extra.faltan, 3);
});

test('Golpes benditos: la variante se elige y cambia el daño de armas o de trucos', () => {
  const c = ch({ clase: 'Clérigo', nivel: 7 });
  assert.deepEqual(variantesPendientes(c), ['Clérigo']);
  assert.deepEqual(variantesPendientes({ ...c, nivel: 6 }), []);
  const golpe = ch({ clase: 'Clérigo', nivel: 7, variantes: { 'Clérigo': 'Golpe divino' } });
  assert.equal(varianteDe(golpe, 'Clérigo').nombre, 'Golpe divino');
  assert.deepEqual(golpeExtra(golpe).map(g => g.dado), ['1d8']);
  assert.deepEqual(golpeExtra({ ...golpe, nivel: 14 }).map(g => g.dado), ['2d8']);
  assert.ok(ataqueArma(golpe, golpeSinArmas(golpe)).estilos.some(t => /Golpe divino.*1d8/.test(t)));
  assert.equal(trucoPotente(golpe, 'Clérigo'), null);
  const pot = ch({ clase: 'Clérigo', nivel: 7, variantes: { 'Clérigo': 'Lanzamiento potente' } });
  assert.equal(trucoPotente(pot, 'Clérigo').bono, 3);
  assert.equal(trucoPotente(pot, 'Iniciado en la magia'), null, 'un truco de dote no es de clérigo');
  assert.equal(golpeExtra(pot).length, 0);
  assert.match(escalas(pot).find(e => e.nombre === 'Golpes benditos').valor, /\+3 a trucos/);
  assert.deepEqual(normChar({ ...pot, variantes: { 'Clérigo': 'Inventada' } }).variantes, {});
});

test('Furia elemental del druida: Golpe primigenio o Lanzamiento potente', () => {
  const d = ch({ clase: 'Druida', nivel: 15, variantes: { 'Druida': 'Golpe primigenio' } });
  assert.deepEqual(golpeExtra(d).map(g => g.dado), ['2d8']);
  assert.ok(escalas(d).some(e => e.nombre === 'Furia elemental'));
});

test('maniobras: 3/5/7/9 según el nivel de guerrero, CD con Fuerza o Destreza y en «En juego»', () => {
  const g = L => ch({ clase: 'Guerrero', subclase: 'Maestro del combate', nivel: L });
  assert.deepEqual([2, 3, 7, 10, 15, 20].map(L => cupoManiobras(g(L))), [0, 3, 5, 7, 9, 9]);
  assert.equal(cupoManiobras(ch({ clase: 'Guerrero', subclase: 'Campeón', nivel: 10 })), 0);
  assert.equal(cdManiobras(g(5)), 8 + 3 + 3);
  assert.equal(MANIOBRAS.length, 20);
  let sel = [];
  for (const m of MANIOBRAS.slice(0, 4)) sel = alternarManiobra(sel, m.nombre, 3);
  assert.equal(sel.length, 3);
  const c = { ...g(3), maniobras: ['Parada', 'Ataque de precisión', 'Ataque con finta'] };
  assert.equal(maniobrasDe(c).length, 3);
  const ej = rasgosEnJuego(c, {}, reglas(c));
  assert.equal(ej.find(r => r.nombre === 'Parada').grupo, 'reaccion');
  assert.equal(ej.find(r => r.nombre === 'Ataque con finta').grupo, 'adicional');
  assert.ok(ej.find(r => r.nombre === 'Parada').recurso, 'enlaza con los dados de supremacía');
  assert.deepEqual(normChar({ ...c, maniobras: ['Parada', 'Parada', ''] }).maniobras, ['Parada']);
});
