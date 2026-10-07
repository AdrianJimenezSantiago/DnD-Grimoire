import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { FRASES, TRAMOS, categoriaTirada, tramoD20, tramoDano, elegirFrase } from '../../web/src/domain/presentacion/frases.js';
import { HABILIDADES } from '../../web/src/domain/reglas/habilidades.js';
import { parsear, distribucion } from '../../web/src/domain/reglas/dados.js';

const CARS = ['fue', 'des', 'con', 'int', 'sab', 'car'];
const DANOS = ['cortante', 'contundente', 'perforante', 'fuego', 'frio', 'relampago', 'trueno', 'acido', 'veneno', 'necrotico', 'radiante', 'psiquico', 'fuerza', 'curacion'];

describe('frases de las tiradas', () => {
  test('cada habilidad, característica, salvación, tirada de combate y tipo de daño tiene su juego de frases', () => {
    const esperadas = [...HABILIDADES.map(([k]) => `hab:${k}`), ...CARS.map(a => `prueba:${a}`), ...CARS.map(a => `salvacion:${a}`),
      'iniciativa', 'ataque', 'ataqueConjuro', 'muerte', 'concentracion', ...DANOS.map(d => `dano:${d}`)];
    for (const k of esperadas) assert.ok(FRASES[k], `faltan las frases de ${k}`);
  });

  test('al menos 20 frases por tipo de tirada, repartidas en los cinco tramos y sin repetirse', () => {
    for (const [k, t] of Object.entries(FRASES)) {
      const todas = TRAMOS.flatMap(tr => t[tr] || []);
      assert.ok(todas.length >= 20, `${k}: ${todas.length} frases`);
      for (const tr of TRAMOS) assert.ok(t[tr]?.length >= 4, `${k}: pocas frases en ${tr}`);
      assert.equal(new Set(todas).size, todas.length, `${k}: frases repetidas`);
      for (const f of todas) assert.ok(f.length > 8 && f.length <= 130 && /[.!?…]$/.test(f), `${k}: «${f}»`);
    }
  });

  test('la categoría sale del tipo de tirada', () => {
    assert.equal(categoriaTirada({ tipo: 'prueba', hab: 'sigilo', ab: 'des' }), 'hab:sigilo');
    assert.equal(categoriaTirada({ tipo: 'prueba', ab: 'fue' }), 'prueba:fue');
    assert.equal(categoriaTirada({ tipo: 'salvacion', ab: 'sab' }), 'salvacion:sab');
    assert.equal(categoriaTirada({ tipo: 'salvacion', ab: 'con', motivo: 'concentracion' }), 'concentracion');
    assert.equal(categoriaTirada({ tipo: 'iniciativa' }), 'iniciativa');
    assert.equal(categoriaTirada({ tipo: 'ataque', conjuro: true }), 'ataqueConjuro');
    assert.equal(categoriaTirada({ tipo: 'dano', clave: 'fuego' }), 'dano:fuego');
    assert.equal(categoriaTirada({ tipo: 'dano', clave: 'fuego', cura: true }), 'dano:curacion');
    assert.equal(categoriaTirada({ tipo: 'libre' }), '');
    assert.equal(categoriaTirada({ tipo: 'dano', clave: 'inventado' }), '');
  });

  test('tramo de un d20: los naturales mandan; con CD, cuenta el margen', () => {
    assert.equal(tramoD20({ nat: 1, total: 25 }), 'muyMal');
    assert.equal(tramoD20({ nat: 20, total: 3 }), 'muyBien');
    assert.equal(tramoD20({ total: 14, cd: 15 }), 'mal');
    assert.equal(tramoD20({ total: 16, cd: 15 }), 'normal');
    assert.equal(tramoD20({ total: 20, cd: 15 }), 'bien');
    assert.equal(tramoD20({ total: 8 }), 'mal');
    assert.equal(tramoD20({ total: 12 }), 'normal');
    assert.equal(tramoD20({ total: 17 }), 'bien');
    assert.equal(tramoD20({ total: 16, tipo: 'ataque' }), 'normal');
  });

  test('tramo del daño: mínimo y máximo en los extremos, el resto por percentil', () => {
    const d = distribucion(parsear('2d6'));
    assert.equal(tramoDano(2, d), 'muyMal');
    assert.equal(tramoDano(12, d), 'muyBien');
    assert.equal(tramoDano(4, d), 'mal');
    assert.equal(tramoDano(7, d), 'normal');
    assert.equal(tramoDano(10, d), 'bien');
    assert.equal(tramoDano(5, null), 'normal');
  });

  test('elige una frase del tramo y no repite la anterior', () => {
    const f = elegirFrase('hab:sigilo', 'muyBien', { rng: () => 0 });
    assert.ok(FRASES['hab:sigilo'].muyBien.includes(f));
    for (let i = 0; i < 20; i++) assert.notEqual(elegirFrase('hab:sigilo', 'muyBien', { evitar: f }), f);
    assert.equal(elegirFrase('nada', 'bien'), '');
  });
});
