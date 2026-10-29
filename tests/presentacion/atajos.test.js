import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ordenDeTecla, ATAJOS, textoAtajos } from '../../web/src/domain/presentacion/atajos.js';

const hoja = { enHoja: true };
describe('atajos de teclado', () => {
  test('cada letra abre su parte de la hoja, en mayúscula o minúscula', () => {
    assert.equal(ordenDeTecla({ key: 'd' }, hoja), 'dados');
    assert.equal(ordenDeTecla({ key: 'C' }, hoja), 'combate');
    assert.equal(ordenDeTecla({ key: 'x' }, hoja), null);
  });
  test('nunca se disparan al escribir, con un diálogo abierto o en la portada', () => {
    assert.equal(ordenDeTecla({ key: 'd' }, { ...hoja, escribiendo: true }), null);
    assert.equal(ordenDeTecla({ key: 'd' }, { ...hoja, dialogo: true }), null);
    assert.equal(ordenDeTecla({ key: 'd' }, {}), null);
    assert.equal(ordenDeTecla({ key: 'z', ctrl: true }, { ...hoja, dialogo: true }), null);
  });
  test('Ctrl+Z (o Cmd+Z) deshace; con Alt o Mayúsculas no, y Ctrl+letra se deja al navegador', () => {
    assert.equal(ordenDeTecla({ key: 'z', ctrl: true }, hoja), 'deshacer');
    assert.equal(ordenDeTecla({ key: 'z', meta: true }, hoja), 'deshacer');
    assert.equal(ordenDeTecla({ key: 'z', ctrl: true, shift: true }, hoja), null);
    assert.equal(ordenDeTecla({ key: 'd', ctrl: true }, hoja), null);
    assert.equal(ordenDeTecla({ key: 'd', alt: true }, hoja), null);
  });
  test('? enseña la ayuda, también desde la portada', () => {
    assert.equal(ordenDeTecla({ key: '?' }, {}), 'atajos');
  });
  test('no hay dos atajos con la misma tecla y la ayuda los lista todos', () => {
    assert.equal(new Set(ATAJOS.map(a => a[0])).size, ATAJOS.length);
    for (const [k] of ATAJOS) assert.match(textoAtajos(), new RegExp(`^${k.toUpperCase()}:`, 'm'));
  });
});
