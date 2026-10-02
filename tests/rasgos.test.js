import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reglas, reglasVisibles, maxFrom, hasShortRest } from '../web/src/domain/clases/rasgos.js';
import { perfil } from '../web/src/domain/reglas/reglas2024.js';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';
import { levelDiff } from '../web/src/domain/clases/progresion.js';

const names = ch => reglas(ch).map(r => `${r.nombre}:${r.max}`);

test('adivino 6: Recuperación arcana 3, Presagio 2d20 y Adivino avezado', () => {
  assert.deepEqual(names(blankChar({ clase: 'Mago', subclase: 'Adivino', nivel: 6 })), ['Recuperación arcana:3', 'Presagio:2', 'Adivino avezado:undefined']);
});
test('adivino 14: Gran presagio (3 dados)', () => {
  assert.equal(reglas(blankChar({ clase: 'Mago', subclase: 'Adivino', nivel: 14 })).find(r => r.tipo === 'dados').max, 3);
});
test('plantillas de otras clases escalan con el nivel', () => {
  assert.deepEqual(names(blankChar({ clase: 'Bárbaro', nivel: 6 })), ['Furia:4']);
  assert.deepEqual(names(blankChar({ clase: 'Paladín', nivel: 5 })), ['Imponer las manos:25', 'Castigo de paladín:1', 'Canalizar divinidad:2', 'Corcel fiel:1']);
  assert.deepEqual(names(blankChar({ clase: 'Bardo', nivel: 5, stats: { car: 16 } })), ['Inspiración bárdica:3']);
});
test('plantillas desactivables y rasgos propios', () => {
  const ch = blankChar({ clase: 'Mago', nivel: 2, rasgosOff: ['tpl:mago.recuperacion'],
    rasgos: [{ id: 'r1', tipo: 'recurso', nombre: 'Varita', maxBase: 'fijo', maxN: 7, recarga: 'largo' }] });
  assert.deepEqual(names(ch), ['Varita:7']);
  assert.equal(reglas(ch, true).length, 2);
});
test('ocultar un rasgo solo lo quita de la hoja: sigue funcionando', () => {
  const ch = blankChar({ clase: 'Mago', nivel: 2, rasgosOcultos: ['tpl:mago.recuperacion'],
    rasgos: [{ id: 'r1', tipo: 'recurso', nombre: 'Varita', maxBase: 'fijo', maxN: 7, recarga: 'largo', off: true }] });
  assert.deepEqual(reglas(ch).map(r => r.nombre).sort(), ['Recuperación arcana', 'Varita']);
  assert.deepEqual(reglasVisibles(ch), []);
});
test('datos antiguos: lo desactivado pasa a oculto; lo personalizado sigue sustituido', () => {
  const ch = normChar({ clase: 'Mago', nivel: 6, subclase: 'Adivino', rasgosOff: ['tpl:mago.recuperacion', 'tpl:adivino.presagio'],
    rasgos: [{ id: 'r1', tipo: 'dados', nombre: 'Mi presagio', maxN: 2, dado: 'd20', desde: 'tpl:adivino.presagio' }] });
  assert.deepEqual(ch.rasgosOcultos, ['tpl:mago.recuperacion']);
  assert.deepEqual(ch.rasgosOff, ['tpl:adivino.presagio']);
  assert.ok(reglas(ch).some(r => r.id === 'tpl:mago.recuperacion' && r.oculto));
  assert.ok(!reglas(ch).some(r => r.id === 'tpl:adivino.presagio'));
});
test('máximos de rasgos propios', () => {
  const ch = blankChar({ nivel: 9, stats: { sab: 16 } });
  assert.equal(maxFrom(ch, { maxBase: 'nivelx', maxN: 5 }), 45);
  assert.equal(maxFrom(ch, { maxBase: 'mod', maxAb: 'sab' }), 3);
  assert.equal(maxFrom(ch, { maxBase: 'comp' }), 4);
  assert.equal(maxFrom(ch, { maxBase: 'mitad' }), 5);
});
test('descanso corto disponible solo cuando algo lo usa', () => {
  const guer = blankChar({ clase: 'Guerrero', nivel: 3 }), barb = blankChar({ clase: 'Bárbaro', nivel: 1 }), exp = blankChar({ clase: 'Explorador', nivel: 3 });
  assert.equal(hasShortRest(guer, perfil(guer)), true);
  assert.equal(hasShortRest(barb, perfil(barb)), true);
  assert.equal(hasShortRest(exp, perfil(exp)), false);
});
test('migración: Presagio y Recuperación arcana antiguos pasan a las plantillas', () => {
  const c = normChar({ clase: 'Mago', play: { presagio: [{ v: '17', used: false }], recupUsed: true } });
  assert.equal(c.play.rec['tpl:adivino.presagio'].dice[0].v, '17');
  assert.equal(c.play.rec['tpl:mago.recuperacion'].used, 1);
  assert.equal('presagio' in c.play, false);
});
test('levelDiff describe lo que se gana', () => {
  const a = blankChar({ clase: 'Mago', subclase: 'Adivino', nivel: 6 }), b = { ...a, nivel: 7 };
  assert.match(levelDiff(perfil(a), perfil(b), a, b), /prepara 1 conjuro más.*espacios de nivel 4.*Recuperación arcana sube a 4/);
});

test('guerrero: nombres oficiales, Indómito y subclases con dados', () => {
  assert.deepEqual(names(blankChar({ clase: 'Guerrero', nivel: 13 })), ['Tomar aliento:4', 'Acción súbita:1', 'Indómito:2']);
  const mc = reglas(blankChar({ clase: 'Guerrero', subclase: 'Maestro del combate', nivel: 15 })).find(r => r.nombre === 'Dados de supremacía');
  assert.equal(mc.max, 6); assert.match(mc.nota, /d10/);
  const psi = reglas(blankChar({ clase: 'Guerrero', subclase: 'Guerrero psiónico', nivel: 11 })).find(r => r.nombre.startsWith('Dados de energía'));
  assert.equal(psi.max, 8); assert.match(psi.nota, /d10/); assert.equal(psi.recarga, 'corto1');
});
test('subclases con recursos: brujo, clérigo, druida, monje, pícaro', () => {
  const car16 = { fue: 10, des: 10, con: 10, int: 10, sab: 16, car: 16 };
  assert.ok(names(blankChar({ clase: 'Brujo', subclase: 'Patrón celestial', nivel: 5, stats: car16 })).includes('Luz sanadora:6'));
  assert.ok(names(blankChar({ clase: 'Brujo', subclase: 'Patrón infernal', nivel: 6, stats: car16 })).includes('La suerte del Oscuro:3'));
  assert.ok(names(blankChar({ clase: 'Clérigo', subclase: 'Dominio de la guerra', nivel: 3, stats: car16 })).includes('Sacerdote guerrero:3'));
  assert.ok(names(blankChar({ clase: 'Druida', subclase: 'Círculo de las estrellas', nivel: 6, stats: car16 })).includes('Presagio cósmico:3'));
  assert.ok(names(blankChar({ clase: 'Monje', nivel: 2 })).includes('Metabolismo asombroso:1'));
  assert.ok(names(blankChar({ clase: 'Pícaro', subclase: 'Rebanaalmas', nivel: 17 })).includes('Desgarro mental:1'));
  assert.ok(names(blankChar({ clase: 'Mago', subclase: 'Abjurador', nivel: 6, stats: { ...car16, int: 18 } })).includes('Salvaguarda arcana:16'));
});
