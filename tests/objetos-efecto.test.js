import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { claseArmadura, anadirObjeto, alternarSintonia, alternarEquipado, ataqueArma } from '../web/src/domain/equipo.js';
import { bonoSalvacion, bonoHabilidad, tablaCaracteristicas } from '../web/src/domain/habilidades.js';
import { perfil } from '../web/src/domain/reglas2024.js';
import { efectoDe, statsEfectivos } from '../web/src/domain/objetosEfecto.js';

const ch = (o = {}) => normChar(blankChar({ clase: 'Mago', nivel: 5, stats: { fue: 8, des: 14, con: 12, int: 16, sab: 10, car: 10 }, ...o }));
const poner = (c, nombre, extra = {}) => { const o = anadirObjeto(c, { nombre, tipo: extra.tipo || 'Objeto maravilloso', clave: nombre.toLowerCase(), sintonia: extra.sintonia ?? true }); return o; };

test('Capa y Anillo de protección: +1 CA y +1 a salvaciones solo sintonizados', () => {
  const c = ch(), ca0 = claseArmadura(c).ca, s0 = bonoSalvacion(c, 'des');
  const capa = poner(c, 'Capa de protección'), anillo = poner(c, 'Anillo de protección', { tipo: 'Anillo' });
  assert.equal(claseArmadura(c).ca, ca0, 'sin sintonizar no cuenta');
  alternarSintonia(c, capa.id); alternarSintonia(c, anillo.id);
  assert.equal(claseArmadura(c).ca, ca0 + 2);
  assert.equal(bonoSalvacion(c, 'des'), s0 + 2);
  assert.match(claseArmadura(c).detalle, /Capa de protección \+1/);
});

test('un objeto escrito a mano con nombre conocido pide sintonía', () => {
  const c = ch({ equipo: { objetos: [{ nombre: 'Anillo de protección', cat: 'magico' }] } });
  assert.equal(c.equipo.objetos[0].sintonia, true);
});

test('Brazales de defensa solo sin armadura ni escudo', () => {
  const c = ch(), b = poner(c, 'Brazales de defensa'); alternarSintonia(c, b.id);
  const ca = claseArmadura(c).ca;
  const esc = anadirObjeto(c, { nombre: 'Escudo +1', tipo: 'Armadura', clave: 'escudo+1' }); alternarEquipado(c, esc.id);
  assert.equal(claseArmadura(c).ca, ca - 2 + 3, 'el escudo +1 da 3 y los brazales dejan de contar');
});

test('características fijadas por objetos: Guanteletes, Cinturón, Diadema, Amuleto de salud', () => {
  const c = ch(); for (const n of ['Guanteletes de poder de ogro', 'Diadema de intelecto', 'Cinturón de fuerza de gigante de las nubes']) alternarSintonia(c, poner(c, n).id);
  const st = statsEfectivos(c);
  assert.equal(st.fue, 27); assert.equal(st.int, 19);
  assert.equal(perfil(c).cd, 8 + 3 + 4);
  assert.equal(tablaCaracteristicas(c).find(x => x.k === 'int').valor, 19);
  assert.equal(c.stats.int, 16, 'no se toca la puntuación guardada');
});

test('Piedra de la suerte y focos +N', () => {
  const c = ch(), h0 = bonoHabilidad(c, 'arcanos'), cd0 = perfil(c).cd;
  alternarSintonia(c, poner(c, 'Piedra de la suerte').id); alternarSintonia(c, poner(c, 'Grimorio arcano +2').id);
  assert.equal(bonoHabilidad(c, 'arcanos'), h0 + 1);
  assert.equal(perfil(c).cd, cd0 + 2);
  assert.deepEqual(efectoDe('Varita del mago de guerra +3'), { ...efectoDe('Varita del mago de guerra +3'), atk: 3, cd: 0 });
});

test('armas y armaduras mágicas del libro toman los datos de la normal', () => {
  const c = ch(), e = anadirObjeto(c, { nombre: 'Espada larga +2', tipo: 'Arma', clave: 'espada-larga-2' });
  assert.equal(e.arma.dano, '1d8'); assert.equal(e.arma.bono, 2);
  alternarEquipado(c, e.id);
  assert.match(ataqueArma(c, e).dano, /1d8 \+ 1 cortante/);
  const a = anadirObjeto(c, { nombre: 'Armadura de placas +1', tipo: 'Armadura', clave: 'placas-1' }); alternarEquipado(c, a.id);
  assert.equal(claseArmadura(c).ca, 19);
});
