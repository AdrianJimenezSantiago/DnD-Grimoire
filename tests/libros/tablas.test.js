import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { leerTablaDado, leerTablaColumnas, tablaATexto, arreglarDados, normRotulo, intervalo } from '../../web/src/domain/libros/tablas.js';

const L = (x, y, s, h = 16, segs) => ({ x, y, h, s, segs: segs || [{ x, w: s.length * 7, s }], cells: segs ? segs.map(g => ({ x: g.x, s: g.s })) : [{ x, s }] });

describe('leerTabla', () => {
  test('tabla de dado: filas, continuaciones y un número que sigue el texto', () => {
    const Ls = [L(60, 900, '1d6 Resultado'), L(70, 880, '1 Pasa algo curioso y', 16, [{ x: 70, w: 8, s: '1' }, { x: 100, w: 120, s: 'Pasa algo curioso y' }]),
      L(100, 860, 'dura 1 hora.'), L(70, 840, '2-5 Nada.'), L(70, 820, '6 Todo a la vez.'), L(60, 790, 'Texto normal que ya no es tabla.')];
    const t = leerTablaDado(Ls, 0);
    assert.deepEqual(t.filas, [['1d6', 'Resultado'], ['1', 'Pasa algo curioso y dura 1 hora.'], ['2–5', 'Nada.'], ['6', 'Todo a la vez.']]);
    assert.equal(t.fin, 5);
    assert.match(tablaATexto(t.filas), /^\| 1d6 \| Resultado \|\n\| 1 \|/);
  });

  test('tabla de columnas: exige huecos reales y descarta prosa', () => {
    const fila = (y, a, b) => L(60, y, `${a} ${b}`, 16, [{ x: 60, w: 100, s: a }, { x: 260, w: 80, s: b }]);
    const t = leerTablaColumnas([fila(900, 'Material', 'Duración'), fila(880, 'Madera', '1 hora'), fila(860, 'Piedra', '1 día'), fila(840, 'Gemas', '1 minuto')], 0);
    assert.deepEqual(t.filas[2], ['Piedra', '1 día']);
    assert.equal(leerTablaColumnas([L(60, 900, 'Prosa normal sin columnas'), L(60, 880, 'que sigue y sigue.')], 0), null);
  });
});

describe('arreglos de OCR', () => {
  test('arreglos de OCR en dados y rótulos', () => {
    assert.equal(arreglarDados('recibe 1246 de daño de fuego y tira 1420.'), 'recibe 12d6 de daño de fuego y tira 1d20.');
    assert.equal(normRotulo('2130'), '21–30'); assert.deepEqual(intervalo('96–00'), [96, 100]);
  });
});
