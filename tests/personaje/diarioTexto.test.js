import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { diarioMarkdown } from '../../web/src/domain/personaje/diarioTexto.js';
import { nuevaSesion, nuevaNota } from '../../web/src/domain/personaje/diario.js';
import { nuevaCriatura } from '../../web/src/domain/criaturas/bestiario.js';

describe('diario en Markdown', () => {
  const ch = { nombre: 'Theo', campana: 'La Costa de la Espada', diario: { sesiones: [] }, bestiario: { criaturas: [] } };
  const s1 = nuevaSesion(ch); Object.assign(s1, { titulo: 'El puerto', texto: 'Llegamos a Luskan.', fecha: '2026-10-02' });
  s1.notas.push(nuevaNota('nombre', 'Maese Orrin'), nuevaNota('pendiente', 'Preguntar por el sello'));
  const s2 = nuevaSesion(ch); s2.fecha = '2026-10-09';
  const cr = nuevaCriatura(ch, 'Trol del puente'); Object.assign(cr, { tipo: 'Gigante', amenaza: 'Letal', danos: { fuego: 'vul', cortante: 'res' }, salv: { des: 'debil' }, tacticas: 'Regenera si no hay fuego.' });
  nuevaCriatura(ch, '');
  const md = diarioMarkdown(ch);

  test('título, campaña y pendientes arriba', () => {
    assert.match(md, /^# Diario de campaña de Theo\n\n\*La Costa de la Espada\*/);
    assert.match(md, /## Para recordar\n\n- Preguntar por el sello \*\(sesión 1\)\*/);
  });
  test('sesiones en orden, con fecha, crónica y notas por tipo', () => {
    assert.ok(md.indexOf('## Sesión 1: El puerto') < md.indexOf('## Sesión 2'));
    assert.match(md, /Llegamos a Luskan\./);
    assert.match(md, /\*\*Nombres\*\*\n\n- Maese Orrin/);
    assert.match(md, /\*\*Pendientes\*\*\n\n- \[ \] Preguntar por el sello/);
  });
  test('bestiario con lo que se sabe; las criaturas sin nombre no salen', () => {
    assert.match(md, /### Trol del puente\n\nGigante · amenaza letal · Sigue ahí fuera/);
    assert.match(md, /- Vulnerable a: fuego/); assert.match(md, /- Resistente a: cortante/); assert.match(md, /- Salvaciones: Destreza débil/);
    assert.equal((md.match(/^### /gm) || []).length, 1);
    assert.doesNotMatch(diarioMarkdown(ch, { bestiario: false }), /Bestiario/);
  });
});
