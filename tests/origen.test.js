import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { faltaRequisito, aumentoDeDote, equipoInicial, herramientasDe, eleccionesHerramienta, datosObjeto, tirarOro } from '../web/src/domain/origen.js';
import { reglas } from '../web/src/domain/rasgos.js';

const pj = o => normChar(blankChar({ clase: 'Paladín', nivel: 1, stats: { fue: 15, des: 10, con: 13, int: 8, sab: 12, car: 14 }, ...o }));

test('requisitos de dotes: nivel, características y rasgos', () => {
  assert.match(faltaRequisito('nivel 4 o más, Destreza 13 o más', pj()), /nivel 4/);
  assert.match(faltaRequisito('Destreza 13 o más', pj({ nivel: 4 })), /Destreza 13/);
  assert.equal(faltaRequisito('Fuerza o Destreza 13 o más', pj({ nivel: 4 })), '');
  assert.match(faltaRequisito('rasgo Estilo de combate', pj()), /Estilo de combate/);
  assert.equal(faltaRequisito('rasgo Estilo de combate', pj({ nivel: 2 })), '');
  assert.match(faltaRequisito('Competencia con armaduras medias', pj({ clase: 'Mago' })), /media/);
});
test('aumento de característica de una dote', () => {
  assert.deepEqual(aumentoDeDote('Aumenta tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20.'), ['fue', 'des']);
  assert.equal(aumentoDeDote('Tienes ventaja en las tiradas de iniciativa.'), null);
});
test('herramientas y equipo inicial de clase y trasfondo', () => {
  const ch = pj({ trasfondo: 'Guardia' });
  assert.deepEqual(eleccionesHerramienta(ch).map(e => e.id), ['t']);
  assert.deepEqual(herramientasDe(ch, { t: ['Juego de dados'] }), ['Juego de dados']);
  const eq = equipoInicial(ch, { elecciones: { t: ['Juego de dados'] } });
  assert.equal(eq.po, 9 + 12);
  assert.ok(eq.items.some(([n]) => n === 'Juego de dados'));
  assert.equal(equipoInicial(ch, { claseOpcion: 'B', trasfondoOpcion: 'B' }).po, 200);
  assert.ok(datosObjeto('Cota de mallas').equipado);
  assert.equal(datosObjeto('Laúd').cat, 'herramienta');
  const t = tirarOro('Paladín', () => 0.99); assert.equal(t.total, 200);
  assert.deepEqual(herramientasDe(pj({ clase: 'Pícaro', trasfondo: 'Criminal' })), ['Herramientas de ladrón']);
});
test('recursos de especie y dotes, e Imponer las manos como reserva', () => {
  const r = reglas(pj({ especie: 'Dracónido', trasfondo: 'Comerciante' }));
  assert.equal(r.find(x => x.nombre === 'Arma de aliento').max, 2);
  assert.equal(r.find(x => x.nombre === 'Puntos de suerte').max, 2);
  const manos = r.find(x => x.nombre === 'Imponer las manos');
  assert.equal(manos.max, 5); assert.equal(manos.reserva, 'PG');
});
