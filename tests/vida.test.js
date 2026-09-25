import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { pgMaximo, pgActuales, aplicarDano, curar, ponerTemporales, dadosDeGolpe, gastarDadoGolpe, salvacionMuerte, estadoVital, descansoLargoVida, cdConcentracion, pgMaximoCalculado, revivir } from '../web/src/domain/vida.js';

const pj = over => normChar(blankChar({ clase: 'Guerrero', nivel: 3, stats: { con: 14 }, ...over }));

test('PG máximos: primer nivel completo, después la media, dotes y especie', () => {
  assert.equal(pgMaximoCalculado(pj()), 12 + 8 + 8);
  assert.equal(pgMaximoCalculado(pj({ trasfondo: 'Campesino' })), 28 + 6);
  assert.equal(pgMaximoCalculado(pj({ especie: 'Enano' })), 28 + 3);
  assert.equal(pgMaximoCalculado(pj({ multiclase: [{ clase: 'Mago', nivel: 2 }] })), 28 + 2 * (4 + 2));
  assert.equal(pgMaximo(pj({ vida: { maxManual: 40 } })), 40);
});
test('daño: primero los temporales; concentración con su CD', () => {
  const ch = pj({ play: { conc: 'Bendición' } });
  ponerTemporales(ch, 5); ponerTemporales(ch, 3);
  assert.equal(ch.vida.temp, 5);
  const r = aplicarDano(ch, 9);
  assert.equal(r.absorbido, 5); assert.equal(pgActuales(ch), 24);
  assert.deepEqual(r.concentracion, { cd: 10, conjuro: 'Bendición' });
  assert.equal(cdConcentracion(44), 22); assert.equal(cdConcentracion(90), 30);
});
test('caer a 0, salvaciones contra muerte y curación', () => {
  const ch = pj();
  const r = aplicarDano(ch, 30);
  assert.ok(r.cayo); assert.equal(estadoVital(ch), 'moribundo');
  aplicarDano(ch, 2); assert.equal(ch.vida.muerte.fallos, 1);
  assert.equal(salvacionMuerte(ch, 12), 'exito');
  assert.equal(salvacionMuerte(ch, 1), 'muere'); assert.equal(estadoVital(ch), 'muerto');
  const b = pj(); aplicarDano(b, 28); salvacionMuerte(b, 10); salvacionMuerte(b, 15); assert.equal(salvacionMuerte(b, 19), 'estable');
  assert.equal(estadoVital(b), 'estable'); curar(b, 4); assert.equal(pgActuales(b), 4); assert.deepEqual(b.vida.muerte, { exitos: 0, fallos: 0 });
});
test('daño masivo: muerte instantánea', () => {
  const ch = pj(); const r = aplicarDano(ch, 60);
  assert.ok(r.muerte); assert.equal(estadoVital(ch), 'muerto');
});
test('un 20 en la salvación contra muerte devuelve 1 PG', () => {
  const ch = pj(); aplicarDano(ch, 28); assert.equal(salvacionMuerte(ch, 20), 'revive'); assert.equal(pgActuales(ch), 1);
});
test('dados de golpe por clase, gasto y descanso largo (2024: se recuperan todos)', () => {
  const ch = pj({ multiclase: [{ clase: 'Mago', nivel: 2 }] });
  assert.deepEqual(dadosDeGolpe(ch).map(d => [d.dado, d.total]), [['d10', 3], ['d6', 2]]);
  aplicarDano(ch, 20);
  const g = gastarDadoGolpe(ch, 'd10', 1); assert.equal(g.total, 3);
  assert.equal(dadosDeGolpe(ch)[0].quedan, 2);
  ch.vida.agotamiento = 2; descansoLargoVida(ch);
  assert.equal(dadosDeGolpe(ch)[0].quedan, 3); assert.equal(pgActuales(ch), pgMaximo(ch)); assert.equal(ch.vida.agotamiento, 1);
});
test('muerte: tres fallos, crítico a 0 PG, agotamiento 6 y revivir', () => {
  const a = pj(); aplicarDano(a, 28); salvacionMuerte(a, 5); salvacionMuerte(a, 1);
  assert.equal(estadoVital(a), 'muerto'); assert.equal(a.vida.caida.causa, 'salvaciones');
  assert.equal(curar(a, 10), 0); assert.equal(aplicarDano(a, 5).recibido, 5); assert.equal(pgActuales(a), 0);
  assert.equal(salvacionMuerte(a, 20), 'muere');
  revivir(a); assert.equal(estadoVital(a), 'vivo'); assert.equal(pgActuales(a), 1); assert.equal(a.vida.caida, null);
  const b = pj(); aplicarDano(b, 28); aplicarDano(b, 1, { critico: true }); assert.equal(b.vida.muerte.fallos, 2);
  const c = pj({ vida: { agotamiento: 6 } }); assert.equal(estadoVital(c), 'muerto'); revivir(c); assert.equal(c.vida.agotamiento, 5);
});
test('estable: tres éxitos reinician la cuenta; el daño vuelve a ponerlo en peligro', () => {
  const ch = pj(); aplicarDano(ch, 28); salvacionMuerte(ch, 12); salvacionMuerte(ch, 15); salvacionMuerte(ch, 18);
  assert.equal(estadoVital(ch), 'estable'); assert.deepEqual(ch.vida.muerte, { exitos: 0, fallos: 0 });
  assert.equal(salvacionMuerte(ch, 3), 'nada');
  aplicarDano(ch, 2); assert.equal(estadoVital(ch), 'moribundo'); assert.equal(ch.vida.muerte.fallos, 1);
});
