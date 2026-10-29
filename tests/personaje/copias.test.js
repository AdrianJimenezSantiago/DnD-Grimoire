import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { recordatorioCopia, planAutomatica, leerIndice, diaDe, textoHace, formatoBytes, MAX_AUTOMATICAS } from '../../web/src/domain/personaje/copias.js';

const DIA = 864e5, AHORA = new Date(2026, 9, 29, 20).getTime();
const db = (...nombres) => ({ chars: nombres.map((n, i) => ({ id: 'c' + i, nombre: n })) });

describe('recordatorio de copia de seguridad', () => {
  test('sin personajes propios no molesta (los de prueba no cuentan)', () => {
    assert.equal(recordatorioCopia({ db: { chars: [{ prueba: true }] }, primerUso: AHORA - 90 * DIA, ahora: AHORA }), null);
  });
  test('avisa a las dos semanas sin copia, contando desde el primer uso si nunca hubo', () => {
    assert.equal(recordatorioCopia({ db: db('Theo'), primerUso: AHORA - 13 * DIA, ahora: AHORA }), null);
    assert.deepEqual(recordatorioCopia({ db: db('Theo'), primerUso: AHORA - 15 * DIA, ahora: AHORA }), { nunca: true, dias: 15 });
    assert.deepEqual(recordatorioCopia({ db: db('Theo'), ultima: AHORA - 20 * DIA, primerUso: AHORA - 99 * DIA, ahora: AHORA }), { nunca: false, dias: 20 });
    assert.equal(recordatorioCopia({ db: db('Theo'), ultima: AHORA - DIA, primerUso: AHORA - 99 * DIA, ahora: AHORA }), null);
  });
  test('«Más tarde» lo aplaza tres días', () => {
    const base = { db: db('Theo'), ultima: String(AHORA - 30 * DIA), ahora: AHORA };
    assert.equal(recordatorioCopia({ ...base, aplazado: String(AHORA - 2 * DIA) }), null);
    assert.ok(recordatorioCopia({ ...base, aplazado: String(AHORA - 4 * DIA) }));
  });
  test('valores guardados raros no rompen nada', () => {
    assert.equal(recordatorioCopia({ db: db('Theo'), ultima: 'basura', primerUso: null, ahora: AHORA }), null);
    assert.equal(recordatorioCopia({ db: null, ahora: AHORA }), null);
  });
});

describe('copias automáticas del dispositivo', () => {
  test('una por día, con quién va dentro', () => {
    const p = planAutomatica([], db('Theo', 'Mira'), AHORA);
    assert.equal(p.nueva.archivo, `copia-auto-${diaDe(AHORA)}.json`);
    assert.deepEqual(p.nueva.nombres, ['Theo', 'Mira']); assert.equal(p.nueva.personajes, 2);
    assert.equal(planAutomatica(p.indice, db('Theo'), AHORA + 3600e3), null, 'el mismo día no repite');
  });
  test(`guarda las ${MAX_AUTOMATICAS} más recientes y dice cuáles borrar`, () => {
    let indice = [];
    const borradas = [];
    for (let d = 0; d < 8; d++) { const p = planAutomatica(indice, db('Theo'), AHORA + d * DIA); indice = p.indice; borradas.push(...p.borrar); }
    assert.equal(indice.length, MAX_AUTOMATICAS);
    assert.equal(indice[0].dia, diaDe(AHORA + 7 * DIA));
    assert.deepEqual(borradas, [0, 1, 2].map(d => `copia-auto-${diaDe(AHORA + d * DIA)}.json`));
  });
  test('sin personajes propios no guarda nada', () => assert.equal(planAutomatica([], { chars: [] }, AHORA), null));
  test('el índice se lee con desconfianza: nombres de archivo ajenos fuera', () => {
    const L = leerIndice(JSON.stringify([{ archivo: '../grimorio-v2', t: 1 }, { archivo: 'copia-auto-2026-10-01.json', t: 5, personajes: '2' }, { archivo: 'copia-auto-2026-10-02.json', t: 9 }, 'x']));
    assert.deepEqual(L.map(e => e.t), [9, 5]); assert.equal(L[1].personajes, 2);
    assert.deepEqual(leerIndice('no es json'), []);
  });
});

describe('textos de la copia', () => {
  test('hace cuánto y tamaños legibles', () => {
    assert.equal(textoHace(0), 'hoy'); assert.equal(textoHace(1), 'ayer'); assert.equal(textoHace(9), 'hace 9 días');
    assert.equal(formatoBytes(512), '512 B'); assert.equal(formatoBytes(2048), '2 KB'); assert.equal(formatoBytes(5.5 * 1024 ** 2), '5,5 MB');
  });
});
