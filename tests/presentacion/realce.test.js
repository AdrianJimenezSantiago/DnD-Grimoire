import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { realzador } from '../../web/src/domain/presentacion/realce.js';

const r = realzador({ icono: k => `[${k}]`, conjuros: () => ['Bola de fuego', 'Luz', 'Curar heridas'] });
const tiene = (html, cls, txt) => assert.ok(html.includes(`class="${cls}">${txt}<`), `${cls} «${txt}» en: ${html}`);

describe('realzador', () => {
  test('tiradas: salvación, prueba, ataque, CD y CA', () => {
    const h = r('Haz una tirada de salvación de Sabiduría CD 15 o una prueba de Fuerza (Atletismo); con un ataque de conjuro a distancia contra CA 13.');
    tiene(h, 'k-save', 'tirada de salvación de Sabiduría');
    tiene(h, 'k-check', 'prueba de Fuerza (Atletismo)');
    tiene(h, 'k-atk', 'ataque de conjuro a distancia');
    tiene(h, 'k-cd', 'CD 15'); tiene(h, 'k-cd', 'CA 13');
  });

  test('daño, curación y PG temporales', () => {
    const h = r('Recibe 2d6 de daño de fuego. Recuperas 1d8 + 3 puntos de golpe y ganas 5 puntos de golpe temporales.');
    assert.match(h, /k-dmg dmg-fuego">\[fuego\]fuego</);
    assert.match(h, /k-heal"><span class="k-dice">1d8 \+ 3<\/span> puntos de golpe</); tiene(h, 'k-temp', '5 puntos de golpe temporales');
    assert.equal((h.match(/k-heal/g) || []).length, 1, 'los temporales no cuentan como curación');
  });

  test('ventaja, bonificadores, tiempos y economía del turno', () => {
    const h = r('Tienes ventaja y +1 a la CA durante 1 minuto, una vez por turno, como acción adicional hasta que termines un descanso largo.');
    tiene(h, 'k-adv', 'ventaja'); assert.match(h, /<b class="k-bono">\+1<\/b>/);
    assert.match(h, /<em class="k-time">1 minuto<\/em>/); assert.match(h, /<em class="k-time">una vez por turno<\/em>/);
    assert.match(h, /<em class="k-time">hasta que termines un descanso largo<\/em>/);
    tiene(h, 'k-eco', 'acción adicional');
  });

  test('nombres de conjuro en cursiva, solo los de varias palabras', () => {
    const h = r('Puedes lanzar Bola de fuego y Curar heridas. La Luz del alba te guía.');
    assert.match(h, /<i class="k-spell">Bola de fuego<\/i>/); assert.match(h, /<i class="k-spell">Curar heridas<\/i>/);
    assert.doesNotMatch(h, /k-spell">Luz/);
  });

  test('no toca el HTML ya escrito ni los números sueltos', () => {
    const h = r('<b class="lead">Nivel 5.</b> Un 15 en la tabla.');
    assert.ok(h.startsWith('<b class="lead">Nivel 5.</b>'));
    assert.doesNotMatch(h, /k-cd|k-bono/);
  });
});
