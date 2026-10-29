import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { bdDeEjemplo } from '../../web/src/domain/personaje/modelo.js';
import { datosFicha } from '../../web/src/domain/presentacion/fichaImpresa.js';
import { anadirObjeto, PREDEFINIDOS, equipar } from '../../web/src/domain/equipo/equipo.js';

describe('ficha impresa', () => {
  const db = bdDeEjemplo(), theo = db.chars[0];

  test('lleva lo de la hoja ya calculado: CA, PG, salvaciones, habilidades y magia', () => {
    const f = datosFicha(theo, db.catalog);
    assert.equal(f.nombre, 'Theo');
    assert.match(f.linea, /Mago, nivel 6 · Adivino/);
    assert.deepEqual(f.vitales.find(v => v[0] === 'Clase de armadura').slice(0, 2), ['Clase de armadura', '12']);
    assert.equal(f.vitales.find(v => v[0] === 'Puntos de golpe')[1], '38 / 38');
    const int = f.caracteristicas.find(c => c.corto === 'Int');
    assert.deepEqual([int.valor, int.mod, int.salvacion, int.salvComp], [18, '+4', '+7', true]);
    assert.ok(int.habilidades.some(h => h.nombre === 'Arcanos' && h.bono === '+7'));
    assert.deepEqual(f.magia, [{ aptitud: 'Inteligencia', cd: 15, ataque: '+7' }]);
    assert.deepEqual(f.espacios, [{ nivel: 1, n: 4 }, { nivel: 2, n: 3 }, { nivel: 3, n: 3 }]);
  });

  test('conjuros agrupados por nivel y ordenados, con preparados y espacios', () => {
    const f = datosFicha(theo, db.catalog);
    assert.deepEqual(f.conjuros.map(g => g.titulo), ['Trucos', 'Nivel 1', 'Nivel 2', 'Nivel 3']);
    assert.equal(f.conjuros[1].espacios, 4);
    const nombres = f.conjuros[1].conjuros.map(c => c.nombre);
    assert.deepEqual(nombres, [...nombres].sort((a, b) => a.localeCompare(b, 'es')));
    assert.ok(f.conjuros.flatMap(g => g.conjuros).some(c => c.preparado));
  });

  test('las armas equipadas salen con su ataque y daño', () => {
    const ch = structuredClone(theo), daga = PREDEFINIDOS.find(o => o.nombre === 'Daga');
    const o = anadirObjeto(ch, daga); equipar(ch, o.id, 'principal');
    const a = datosFicha(ch, db.catalog).ataques.find(x => x.nombre === 'Daga');
    assert.equal(a.ataque, '+5'); assert.match(a.dano, /^1d4 \+ 2 perforante$/);
  });

  test('un personaje vacío no rompe la ficha', () => {
    const f = datosFicha({ nombre: '', clase: 'Guerrero', nivel: 1, stats: {} }, {});
    assert.equal(f.nombre, 'Sin nombre'); assert.deepEqual(f.conjuros, []);
  });
});
