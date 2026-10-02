import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { alcance, campo, componentes, duracion, escuelaOficial, material, usoGratis } from '../web/src/domain/conjuros/validar.js';
import { ESPIRITUS, PERFILES, caracteristicas, criaturasDe, perfilDe } from '../web/src/domain/criaturas/criaturas.js';
import { conObjetivos, empezarConc, objetivosNuevos, rasgosConObjetivo, terminarConc } from '../web/src/domain/combate/concentracion.js';
import { analizarTiradas, dadosPara, media } from '../web/src/domain/conjuros/tiradas.js';
import { blankChar, normDb } from '../web/src/domain/personaje/modelo.js';
import { SCHOOLS } from '../web/src/domain/reglas/reglas2024.js';

const { conjuros } = JSON.parse(fs.readFileSync(new URL('../web/public/data/compendio.json', import.meta.url)));

test('validación: un 0 no es un uso gratis, ni un alcance, ni una duración', () => {
  for (const v of ['0', ' 0 ', '0/DL', '00', 'no', '-', '']) assert.equal(usoGratis(v), '', JSON.stringify(v));
  assert.equal(usoGratis('1/DL'), '1/DL'); assert.equal(usoGratis('3/DL'), '3/DL');
  for (const v of ['0', '0 m', '0m', '0 metros', '']) assert.equal(alcance(v), 'Toque', v);
  assert.equal(alcance('9'), '9 m'); assert.equal(alcance('36m *'), '36 m'); assert.equal(alcance('18 m 3'), '18 m'); assert.equal(alcance('1,5 km'), '1,5 km');
  assert.equal(alcance('Propio'), 'Lanzador'); assert.equal(alcance('limitado'), 'Ilimitado');
  assert.equal(duracion('0'), 'Instantáneo'); assert.equal(duracion(''), 'Instantáneo'); assert.equal(duracion('Hasta 1 h ||'), 'Hasta 1 h');
  assert.equal(material('0 po'), ''); assert.equal(material('Incienso, 10 po'), 'Incienso, 10 po');
});
test('validación: componentes y escuelas siempre válidos', () => {
  assert.equal(componentes('m, v'), 'V M'); assert.equal(componentes('VSM'), null); assert.equal(componentes('V S M'), 'V S M'); assert.equal(componentes(''), null);
  assert.equal(campo('comp', '').valor, null); assert.match(campo('comp', '').aviso, /al menos un componente/);
  assert.equal(escuelaOficial('Ilusión'), 'Ilusionismo'); assert.equal(escuelaOficial('evoc.'), 'Evocación'); assert.equal(escuelaOficial('xyz'), '');
  assert.equal(campo('escuela', 'patata').valor, null);
  for (const x of conjuros) { assert.ok(SCHOOLS.includes(x.esc), x.es); assert.ok(componentes(x.co), x.es); }
});
test('validación: los datos guardados se corrigen al cargar', () => {
  const ch = blankChar({ id: 'c1', book: [{ sid: 's1', gratis: '0', used: true }] });
  const db = normDb({ catalog: { s1: { id: 's1', es: 'Guía', en: 'True Strike', level: 0, escuela: 'Ilusión', alcance: '0 m', duracion: '', comp: 'v s' } }, chars: [ch] });
  const s = db.catalog.s1, e = db.chars[0].book[0];
  assert.equal(s.escuela, 'Ilusionismo'); assert.equal(s.alcance, 'Toque'); assert.equal(s.comp, 'V S');
  assert.equal(s.en, 'Guidance'); assert.equal(s.srd, 'srd-2024_guidance');
  assert.equal(e.gratis, ''); assert.equal(e.used, false);
});
test('compendio: Guía es Guidance e Impacto certero es True Strike', () => {
  const es = en => conjuros.find(c => c.en === en)?.es;
  assert.equal(es('Guidance'), 'Guía'); assert.equal(es('True Strike'), 'Impacto certero');
});

test('criaturas: familiares, Pacto de la cadena y monturas con perfil completo', () => {
  const f = criaturasDe('Encontrar familiar');
  assert.equal(f.familiar.length, 11); assert.equal(f.cadena.length, 8);
  for (const id of [...f.familiar, ...f.cadena, 'caballo', 'zombi']) {
    const p = perfilDe(id);
    assert.ok(p.nombre && p.tipo && p.ca > 0 && p.pg && p.vel && p.car.length === 6 && p.vd, id);
    assert.ok(p.acciones?.length, `${id} sin acciones`);
  }
  assert.deepEqual(caracteristicas(PERFILES.gato).find(c => c.k === 'des'), { k: 'des', v: 15, mod: 2, salv: 4 });
  assert.deepEqual(criaturasDe('Animar a los muertos').fijos, ['esqueleto', 'zombi']);
  assert.equal(criaturasDe('Bola de fuego'), null);
});
test('criaturas: los espíritus escalan con el espacio y usan tu ataque y tu CD', () => {
  const b = perfilDe('bestia', { n: 4, v: 'aire', atk: 8, cd: 16 });
  assert.equal(b.ca, 15); assert.equal(b.pg, '30'); assert.match(b.vel, /volar 18 m/);
  assert.match(b.acciones[0][1], /2 ataques/); assert.match(b.acciones[1][1], /\+8/); assert.match(b.acciones[1][1], /1d8 \+ 8/);
  assert.equal(perfilDe('bestia', { n: 2, v: 'tierra' }).pg, '30');
  assert.equal(perfilDe('infernal', { n: 7, v: 'yugoloth' }).pg, '75');
  assert.match(perfilDe('dragon', { n: 5, cd: 15 }).acciones[2][1], /CD 15/);
  assert.equal(perfilDe('celestial', { n: 5, v: 'defensor' }).ca, 18);
  assert.equal(perfilDe('corcel', { n: 4, v: 'feérico' }).vel, '18 m, volar 18 m');
  assert.equal(perfilDe('elemental', { n: 1 }).n, 4);
  for (const [id, e] of Object.entries(ESPIRITUS)) for (const v of e.variantes.length ? e.variantes : [undefined]) assert.ok(perfilDe(id, { n: 9, v }).acciones.length, `${id} ${v}`);
  for (const n of ['Encontrar familiar', 'Hallar corcel', 'Corcel fantasma', 'Animar a los muertos', 'Invocar bestia', 'Invocar feérico', 'Invocar muerto viviente', 'Invocar aberración',
    'Invocar autómata', 'Invocar elemental', 'Invocar celestial', 'Invocar dragón', 'Invocar infernal']) { assert.ok(conjuros.some(c => c.es === n), n); assert.ok(criaturasDe(n), n); }
});

test('concentración: objetivos solo en conjuros sin área, y se olvidan al cambiar', () => {
  const bend = { conc: true, alcance: '9 m' }, dormir = { conc: true, alcance: '27 m' };
  assert.equal(conObjetivos(bend, ['Hasta tres criaturas que elijas dentro del alcance.']), true);
  assert.equal(conObjetivos(dormir, ['Cada criatura en una esfera de 1,5 m de radio.']), false);
  assert.equal(conObjetivos({ conc: false }, []), false);
  const play = { conc: '', concObj: [] };
  empezarConc(play, 'Bendición'); play.concObj.push('Ana');
  empezarConc(play, 'Bendición'); assert.deepEqual(play.concObj, ['Ana']);
  empezarConc(play, 'Acelerar'); assert.deepEqual(play.concObj, []);
  terminarConc(play); assert.equal(play.conc, '');
  assert.deepEqual(objetivosNuevos('Ana, el trol y Bram; ana', ['Bram']), ['Ana', 'el trol']);
});
test('concentración: rasgos con objetivo según la clase y el nivel', () => {
  assert.deepEqual(rasgosConObjetivo(blankChar({ clase: 'Paladín', subclase: 'Juramento de venganza', nivel: 3 })), ['Voto de enemistad']);
  assert.deepEqual(rasgosConObjetivo(blankChar({ clase: 'Monje', nivel: 4 })), []);
  assert.deepEqual(rasgosConObjetivo(blankChar({ clase: 'Monje', nivel: 5 })), ['Golpe aturdidor']);
  assert.ok(rasgosConObjetivo(blankChar({ clase: 'Bardo', nivel: 1 })).includes('Inspiración bárdica'));
});

test('tiradas: media esperada, también al potenciar el conjuro', () => {
  assert.equal(media(2, 6, 3), 10); assert.equal(media(1, 20), 10.5);
  const nube = analizarTiradas('Una criatura que entre en el cubo sufre 4d4 de daño cortante.', 'El daño aumenta en 2d4 por cada nivel por encima de 2 que tenga el espacio.');
  const [d2] = dadosPara(nube, { nivelEspacio: 2, nivelConjuro: 2 }), [d4] = dadosPara(nube, { nivelEspacio: 4, nivelConjuro: 2 });
  assert.equal(media(d2.n, d2.caras, d2.bono), 10); assert.equal(media(d4.n, d4.caras, d4.bono), 20);
});
