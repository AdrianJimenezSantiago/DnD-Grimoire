// Reglas de dependencia entre las capas de web/src (ver docs/arquitectura.md).
// Si una de estas pruebas falla, el import nuevo está en la capa equivocada: mueve la lógica, no relajes la regla.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SRC = new URL('../../web/src/', import.meta.url).pathname;

function modulos(dir = SRC) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? modulos(p) : e.name.endsWith('.js') ? [p] : [];
  });
}

// Imports de un módulo: { spec, destino } con destino relativo a web/src (o null si es un paquete de npm)
function importsDe(archivo) {
  const src = fs.readFileSync(archivo, 'utf8');
  return [...src.matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*|^import\s+)'([^']+)'/gm)].map(([, spec]) => ({
    spec,
    destino: spec.startsWith('.') ? path.relative(SRC, path.resolve(path.dirname(archivo), spec.split('?')[0])) : null,
  }));
}

const capa = rel => rel.split(path.sep)[0];
const TODOS = modulos().map(f => ({ rel: path.relative(SRC, f), imports: importsDe(f) }));
const infracciones = (filtro, permitido) => TODOS.filter(m => filtro(m.rel)).flatMap(m =>
  m.imports.filter(i => !permitido(i)).map(i => `${m.rel} → ${i.spec}`));

describe('capas de web/src', () => {
  test('core no depende de ninguna otra capa ni de paquetes externos', () => {
    assert.deepEqual(infracciones(r => capa(r) === 'core', i => i.destino && capa(i.destino) === 'core'), []);
  });

  test('domain solo usa domain y core: reglas puras, sin DOM ni plataforma', () => {
    assert.deepEqual(infracciones(r => capa(r) === 'domain', i => i.destino && ['domain', 'core'].includes(capa(i.destino))), []);
  });

  test('ui solo usa de app los casos de uso que la hoja dispara: acciones e importar un libro', () => {
    const permitidos = ['app/acciones.js', 'app/importarManual.js'];
    assert.deepEqual(infracciones(r => capa(r) === 'ui', i => !i.destino || capa(i.destino) !== 'app' || permitidos.includes(i.destino)), []);
  });

  test('solo platform importa Capacitor y pdf.js', () => {
    assert.deepEqual(TODOS.filter(m => capa(m.rel) !== 'platform').flatMap(m =>
      m.imports.filter(i => /^(@capacitor|pdfjs-dist)/.test(i.spec)).map(i => `${m.rel} → ${i.spec}`)), []);
  });

  test('todos los imports relativos apuntan a un archivo que existe', () => {
    const rotos = TODOS.flatMap(m => m.imports.filter(i => i.destino && !fs.existsSync(path.join(SRC, i.destino))).map(i => `${m.rel} → ${i.spec}`));
    assert.deepEqual(rotos, []);
  });
});
