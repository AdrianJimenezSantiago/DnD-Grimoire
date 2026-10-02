import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { compendioJson } from '../helpers/fixtures.js';
import { alcance, campo, componentes, duracion, escuelaOficial, material, usoGratis } from '../../web/src/domain/conjuros/validar.js';
import { blankChar, normDb } from '../../web/src/domain/personaje/modelo.js';
import { SCHOOLS } from '../../web/src/domain/reglas/reglas2024.js';

const { conjuros } = compendioJson();

describe('limpiarConjuro y campos', () => {
  test('un 0 no es un uso gratis, ni un alcance, ni una duración', () => {
    for (const v of ['0', ' 0 ', '0/DL', '00', 'no', '-', '']) assert.equal(usoGratis(v), '', JSON.stringify(v));
    assert.equal(usoGratis('1/DL'), '1/DL'); assert.equal(usoGratis('3/DL'), '3/DL');
    for (const v of ['0', '0 m', '0m', '0 metros', '']) assert.equal(alcance(v), 'Toque', v);
    assert.equal(alcance('9'), '9 m'); assert.equal(alcance('36m *'), '36 m'); assert.equal(alcance('18 m 3'), '18 m'); assert.equal(alcance('1,5 km'), '1,5 km');
    assert.equal(alcance('Propio'), 'Lanzador'); assert.equal(alcance('limitado'), 'Ilimitado');
    assert.equal(duracion('0'), 'Instantáneo'); assert.equal(duracion(''), 'Instantáneo'); assert.equal(duracion('Hasta 1 h ||'), 'Hasta 1 h');
    assert.equal(material('0 po'), ''); assert.equal(material('Incienso, 10 po'), 'Incienso, 10 po');
  });

  test('componentes y escuelas siempre válidos', () => {
    assert.equal(componentes('m, v'), 'V M'); assert.equal(componentes('VSM'), null); assert.equal(componentes('V S M'), 'V S M'); assert.equal(componentes(''), null);
    assert.equal(campo('comp', '').valor, null); assert.match(campo('comp', '').aviso, /al menos un componente/);
    assert.equal(escuelaOficial('Ilusión'), 'Ilusionismo'); assert.equal(escuelaOficial('evoc.'), 'Evocación'); assert.equal(escuelaOficial('xyz'), '');
    assert.equal(campo('escuela', 'patata').valor, null);
    for (const x of conjuros) { assert.ok(SCHOOLS.includes(x.esc), x.es); assert.ok(componentes(x.co), x.es); }
  });

  test('los datos guardados se corrigen al cargar', () => {
    const ch = blankChar({ id: 'c1', book: [{ sid: 's1', gratis: '0', used: true }] });
    const db = normDb({ catalog: { s1: { id: 's1', es: 'Guía', en: 'True Strike', level: 0, escuela: 'Ilusión', alcance: '0 m', duracion: '', comp: 'v s' } }, chars: [ch] });
    const s = db.catalog.s1, e = db.chars[0].book[0];
    assert.equal(s.escuela, 'Ilusionismo'); assert.equal(s.alcance, 'Toque'); assert.equal(s.comp, 'V S');
    assert.equal(s.en, 'Guidance'); assert.equal(s.srd, 'srd-2024_guidance');
    assert.equal(e.gratis, ''); assert.equal(e.used, false);
  });
});
