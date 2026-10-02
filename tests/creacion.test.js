import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';
import { dotesDe } from '../web/src/domain/reglas/reglas2024.js';
import { MATRIZ, PUNTOS, costeCompra, tirar4d6, repartoSugerido, caracteristicasTrasfondo, estadoBonos, bonosSugeridos, conBonos,
  repartoHabilidades, completarHabilidades, doteRepetida, esRepetible, versatilPendiente, mejorasHasta } from '../web/src/domain/personaje/creacion.js';

test('sin trasfondo no hay dote de origen, aunque un libro importado tenga trasfondos sin nombre', () => {
  const lib = [{ nombre: '', dote: 'Alerta' }, { nombre: 'Guardia', dote: 'Alerta' }];
  assert.deepEqual(dotesDe(blankChar(), lib), []);
  assert.deepEqual(dotesDe(blankChar({ trasfondo: '  ' }), lib), []);
  assert.equal(dotesDe(blankChar({ trasfondo: 'Guardia' }), lib)[0].nombre, 'Alerta');
  assert.equal(dotesDe(blankChar({ trasfondo: 'Erudito' }))[0].nombre, 'Iniciado en la magia');
});

test('una dote que no es repetible no se puede elegir dos veces', () => {
  const ch = blankChar({ trasfondo: 'Guardia' });
  assert.ok(doteRepetida(ch, 'Alerta'));
  assert.ok(doteRepetida(ch, 'alerta'));
  assert.ok(!doteRepetida(ch, 'Afortunado'));
  const mago = blankChar({ trasfondo: 'Erudito' });
  assert.ok(esRepetible('Iniciado en la magia (clérigo)'));
  assert.ok(!doteRepetida(mago, 'Iniciado en la magia (clérigo)'));
  assert.ok(doteRepetida(mago, 'Iniciado en la magia (mago)'));
  assert.ok(esRepetible('Adepto', [{ nombre: 'Adepto', texto: 'Repetible. Puedes elegir esta dote más de una vez.' }]));
});

test('matriz estándar y compra de puntos', () => {
  assert.equal(costeCompra(repartoSugerido('Mago')), PUNTOS);
  assert.deepEqual(repartoSugerido('Mago'), { int: 15, con: 14, des: 13, sab: 12, car: 10, fue: 8 });
  assert.equal(Object.values(repartoSugerido('Bárbaro')).sort((a, b) => b - a).join(), MATRIZ.join());
  assert.equal(costeCompra({ fue: 15, des: 15, con: 15, int: 8, sab: 8, car: 8 }), 27);
});

test('4d6 quitando el más bajo', () => {
  const seq = [0.99, 0.0, 0.5, 0.7], rnd = () => seq.shift();
  const t = tirar4d6(rnd);
  assert.deepEqual(t.dados, [6, 1, 4, 5]);
  assert.equal(t.quitado, 1);
  assert.equal(t.total, 15);
});

test('aumentos del trasfondo: +2/+1 o +1/+1/+1 entre sus tres características, sin pasar de 20', () => {
  assert.deepEqual(caracteristicasTrasfondo('Guardia'), ['fue', 'int', 'sab']);
  assert.deepEqual(caracteristicasTrasfondo(''), []);
  assert.deepEqual(caracteristicasTrasfondo('Pirata', [{ nombre: 'Pirata', caracteristicas: 'Fuerza, Destreza, Sabiduría' }]), ['fue', 'des', 'sab']);
  const perm = ['fue', 'int', 'sab'];
  assert.ok(estadoBonos({ int: 2, sab: 1 }, perm).completo);
  assert.ok(estadoBonos({ fue: 1, int: 1, sab: 1 }, perm).completo);
  assert.ok(!estadoBonos({ int: 2, car: 1 }, perm).completo);
  assert.ok(!estadoBonos({ int: 2 }, perm).completo);
  assert.deepEqual(bonosSugeridos('Mago', perm), { int: 2, sab: 1 });
  assert.equal(conBonos({ fue: 8, des: 10, con: 10, int: 19, sab: 10, car: 10 }, { int: 2 }).int, 20);
});

test('competencias: trasfondo, clase, especie y lo que falta', () => {
  const ch = blankChar({ clase: 'Mago', trasfondo: 'Guardia', especie: 'Humano', habilidades: { atletismo: 1, percepcion: 1, arcanos: 1 } });
  const r = repartoHabilidades(ch);
  assert.equal(r.fuente.atletismo, 'trasfondo');
  assert.equal(r.fuente.arcanos, 'clase');
  assert.equal(r.clase.faltan, 1);
  assert.equal(r.extra.faltan, 1);
  const hab = completarHabilidades(ch);
  const r2 = repartoHabilidades({ ...ch, habilidades: hab });
  assert.equal(r2.clase.faltan + r2.extra.faltan + r2.pericia.faltan, 0);
  const picaro = blankChar({ clase: 'Pícaro', trasfondo: 'Criminal', habilidades: {} }), rp = repartoHabilidades({ ...picaro, habilidades: completarHabilidades(picaro) });
  assert.equal(rp.clase.faltan + rp.pericia.faltan + rp.faltanTrasfondo.length, 0);
  assert.equal(repartoHabilidades(blankChar({ clase: 'Pícaro', nivel: 1, habilidades: {} })).pericia.faltan, 2);
});

test('dotes: Humano pide una de origen y las mejoras según el nivel', () => {
  assert.ok(versatilPendiente(blankChar({ especie: 'Humano' })));
  assert.ok(!versatilPendiente(blankChar({ especie: 'Humano', dotes: ['Duro'] })));
  assert.ok(!versatilPendiente(blankChar({ especie: 'Elfo' })));
  assert.equal(mejorasHasta(blankChar({ clase: 'Guerrero', nivel: 8 })).asi, 3);
});

test('la creación se guarda con el personaje', () => {
  const c = normChar(blankChar({ creacion: { metodo: 'compra', base: { fue: 8, des: 14, con: 14, int: 15, sab: 10, car: 8 }, bonos: { int: 2, sab: 1, car: 5 }, tiradas: [] } }));
  assert.equal(c.creacion.metodo, 'compra');
  assert.deepEqual(c.creacion.bonos, { int: 2, sab: 1 });
  assert.equal(normChar(blankChar()).creacion, null);
});
