import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paleta, luminancia, contraste, tinteDe } from '../web/src/domain/paleta.js';
import { TEMAS } from '../web/src/domain/clases2024.js';

const hex = h => { const f = c => { c = parseInt(c, 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(h.slice(1, 3)) + 0.7152 * f(h.slice(3, 5)) + 0.0722 * f(h.slice(5, 7)); };
const todos = [...Object.entries(TEMAS.clase), ...Object.entries(TEMAS.sub)].map(([n, [h, s]]) => ({ n, h, s }));

test('paleta: el acento de cada clase y subclase se lee en los dos temas', () => {
  const vitela = hex('#EFE6D3');   // lo más oscuro sobre lo que va texto de acento de día
  for (const t of todos) {
    const p = paleta(t), sg = parseFloat(p['--acc-sg']), k = +p['--acc-k'];
    const noche = luminancia(t.h, 22 * k, 10.5);   // --raised de noche
    assert.ok(contraste(luminancia(t.h, sg, parseFloat(p['--gl-d'])), noche) >= 4.5, `${t.n}: acento de noche`);
    assert.ok(contraste(luminancia(t.h, sg, parseFloat(p['--gl-l'])), vitela) >= 4.5, `${t.n}: acento de día`);
    assert.ok(contraste(luminancia(t.h, sg, parseFloat(p['--gl2-l'])), vitela) >= 3, `${t.n}: acento claro de día`);
  }
});
test('paleta: los tonos intensos tiñen menos la estructura y el neutro casi nada', () => {
  assert.ok(tinteDe(0) < tinteDe(50) && tinteDe(320) < tinteDe(120));
  assert.equal(paleta({ h: 220, s: 8 }, true)['--acc-k'], '0.15');
  // el mismo tinte de estructura se percibe parecido: la saturación efectiva de un rojo no pasa de la de un amarillo
  assert.ok(78 * tinteDe(12) <= 80 * tinteDe(44));
});
