import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capitulos, textoAMarkdown, pdfAMarkdown, slug } from '../web/src/domain/personaje/historia.js';
import { nuevaSesion, nuevaNota, paraRecordar, buscarDiario } from '../web/src/domain/personaje/diario.js';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';

test('capítulos con anclas únicas', () => {
  const c = capitulos('# Ana\n\n## La noche\n\ntexto\n\n### Detalle\n\n## La noche');
  assert.deepEqual(c.map(x => [x.nivel, x.id]), [[1, 'ana'], [2, 'la-noche'], [3, 'detalle'], [2, 'la-noche-2']]);
  assert.equal(slug('El precio de la sangre'), 'el-precio-de-la-sangre');
});
test('texto plano con líneas partidas → párrafos, capítulos, subtítulo y citas', () => {
  const txt = ['✦ ✧ ☾ ✧ ✦', 'LA TORMENTA', 'Un puerto, al caer la tarde.', 'La barca llegó tarde y nadie la esperaba en el muelle, salvo', 'una niña con un farol.', 'Dijo entonces:', '«No vuelvas.»', 'Nadie volvió.', '✦ ☾ ✦', 'Al día siguiente.'].join('\n');
  const md = textoAMarkdown(txt);
  assert.match(md, /^## La tormenta$/m); assert.match(md, /^\*Un puerto, al caer la tarde\.\*$/m);
  assert.match(md, /esperaba en el muelle, salvo una niña con un farol\./);
  assert.match(md, /\n\n«No vuelvas\.»\n\n/); assert.match(md, /^---$/m);
});
test('PDF: quita cabeceras repetidas y detecta títulos por tamaño', () => {
  const pag = n => ({ items: [
    { s: `CABECERA DEL LIBRO · ${n}`, x: 50, y: 800, h: 9 },
    ...(n === 1 ? [{ s: 'EL PRINCIPIO', x: 50, y: 740, h: 22 }] : []),
    { s: 'Una línea de texto del cuerpo que sigue', x: 50, y: 700, h: 12 }, { s: 'y termina aquí.', x: 50, y: 686, h: 12 },
    { s: 'Otro párrafo tras un hueco.', x: 50, y: 640, h: 12 }] });
  const md = pdfAMarkdown([pag(1), pag(2), pag(3)]);
  assert.doesNotMatch(md, /CABECERA/); assert.match(md, /^##+ El principio$/m);
  assert.match(md, /cuerpo que sigue y termina aquí\./);
});
test('diario: sesiones numeradas, notas y «para recordar»', () => {
  const c = normChar(blankChar({ nombre: 'Ana' }));
  const s1 = nuevaSesion(c), s2 = nuevaSesion(c);
  assert.deepEqual([s1.n, s2.n], [1, 2]); assert.equal(c.diario.sesiones[0], s2);
  s1.notas.push(nuevaNota('pendiente', 'Preguntar por el sello'), nuevaNota('nombre', 'Maese Orrin'));
  const orrin = s1.notas[1]; orrin.fijada = true;
  assert.deepEqual(paraRecordar(c).map(n => n.texto), ['Preguntar por el sello', 'Maese Orrin']);
  s1.notas[0].hecho = true;
  assert.deepEqual(paraRecordar(c).map(n => n.texto), ['Maese Orrin']);
  assert.equal(buscarDiario(c, 'orrín').length, 1);
});
test('modelo: campos nuevos con valores por defecto', () => {
  const c = normChar({ nombre: 'X', retrato: { x: 1 } });
  assert.equal(c.retrato, null); assert.equal(c.historia, ''); assert.deepEqual(c.diario, { sesiones: [] });
});
