import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { leerNumero, leerBono, leerDano, leerTexto, motivoTirada, burla } from '../../web/src/domain/validacion.js';

describe('validación de lo que se escribe a mano', () => {
  test('números: acepta cifras limpias y rechaza letras, mezclas, decimales y rangos', () => {
    assert.deepEqual(leerNumero('12'), { ok: true, n: 12 });
    assert.deepEqual(leerNumero(' +7 '), { ok: true, n: 7 });
    assert.equal(leerNumero('').motivo, 'vacio');
    assert.deepEqual(leerNumero('', { obligatorio: false }), { ok: true, n: null });
    assert.equal(leerNumero('abc').motivo, 'letras');
    assert.equal(leerNumero('12 de daño').motivo, 'mezcla');
    assert.equal(leerNumero('1e9').motivo, 'mezcla');
    assert.equal(leerNumero('2,5').motivo, 'decimal');
    assert.deepEqual(leerNumero('2,5', { decimal: true }), { ok: true, n: 2.5 });
    assert.equal(leerNumero('-3', { min: 0 }).motivo, 'negativo');
    assert.equal(leerNumero('0', { min: 1 }).motivo, 'cero');
    assert.equal(leerNumero('5', { min: 8 }).motivo, 'bajo');
    assert.equal(leerNumero('21', { max: 20 }).motivo, 'alto');
    assert.equal(leerNumero('9'.repeat(400)).motivo, 'alto');
  });
  test('bonos: números con signo o dados normales', () => {
    assert.deepEqual(leerBono('2'), { ok: true, t: '+2' });
    assert.deepEqual(leerBono('-1'), { ok: true, t: '-1' });
    assert.deepEqual(leerBono('d4'), { ok: true, t: '1d4' });
    assert.deepEqual(leerBono(''), { ok: true, t: '' });
    assert.equal(leerBono('1d7').motivo, 'dado');
    assert.equal(leerBono('+50').motivo, 'alto');
    assert.equal(leerBono('mucho').motivo, 'letras');
    assert.equal(leerBono('2x3').motivo, 'formato');
  });
  test('daño de armas', () => {
    assert.deepEqual(leerDano('1d8'), { ok: true, t: '1d8' });
    assert.deepEqual(leerDano(' 2D6 + 1 '), { ok: true, t: '2d6+1' });
    assert.deepEqual(leerDano('1'), { ok: true, t: '1' });
    assert.equal(leerDano('1d9').motivo, 'dado');
    assert.equal(leerDano('mucho').motivo, 'letras');
    assert.equal(leerDano('99d6').motivo, 'alto');
    assert.equal(leerDano('1d8+1d6').motivo, 'formato');
  });
  test('textos: limpia espacios, rechaza vacío, larguísimo y solo símbolos', () => {
    assert.deepEqual(leerTexto('  Theo   el  Sabio '), { ok: true, t: 'Theo el Sabio' });
    assert.equal(leerTexto('   ', { obligatorio: true }).motivo, 'vacio');
    assert.equal(leerTexto('x'.repeat(61), { max: 60 }).motivo, 'largo');
    assert.equal(leerTexto('!!!???', { obligatorio: true }).motivo, 'simbolos');
    assert.deepEqual(leerTexto('Ñu 3', { obligatorio: true }), { ok: true, t: 'Ñu 3' });
  });
  test('tiradas: explica por qué no vale', () => {
    assert.equal(motivoTirada('2d6+3'), '');
    assert.equal(motivoTirada('4d6kh3'), '');
    assert.equal(motivoTirada(''), 'vacio');
    assert.equal(motivoTirada('hola'), 'letras');
    assert.equal(motivoTirada('2d6*3'), 'formato');
    assert.equal(motivoTirada('500d6'), 'alto');
    assert.equal(motivoTirada('1d20+99999'), 'alto');
    assert.equal(motivoTirada('0d6'), 'dado');
  });
  test('cada motivo tiene burla y no se repite dos veces seguidas', () => {
    for (const m of ['vacio', 'letras', 'mezcla', 'decimal', 'negativo', 'cero', 'bajo', 'alto', 'largo', 'simbolos', 'formato', 'dado', 'archivo', 'copia'])
      assert.ok(burla(m, { campo: 'Nivel', min: 1, max: 20 }).length > 10, m);
    const a = burla('alto', { max: 5 }, () => 0), b = burla('alto', { max: 5 }, () => 0);
    assert.notEqual(a, b);
    assert.match(burla('alto', { tema: 'dano', valor: 9999, max: 999 }), /999/);
  });
});
