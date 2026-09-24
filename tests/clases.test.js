import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CLASES, perfil } from '../web/src/domain/reglas2024.js';
import { CLASES_INFO, SUBCLASES, TEMAS, conjurosAutomaticos, escalas, progresion, rasgosEnNivel, subclaseDe } from '../web/src/domain/clases2024.js';
import { featuresAt, conjurosPendientes, anadirPendientes } from '../web/src/domain/progresion.js';
import { reglas } from '../web/src/domain/rasgos.js';
import { blankChar } from '../web/src/domain/modelo.js';
import { combinaciones, sembrarPruebas, statsPrueba, NIVEL_PRUEBA } from '../web/src/domain/pruebas.js';

const { conjuros } = JSON.parse(fs.readFileSync(new URL('../web/public/data/compendio.json', import.meta.url)));
const GI = fs.readFileSync(new URL('../web/src/ui/gameIcons.js', import.meta.url), 'utf8');
const ESCENAS = fs.readFileSync(new URL('../web/src/ui/fondo.js', import.meta.url), 'utf8');
const ch = (clase, subclase = '', nivel = 8, stats = {}) => blankChar({ clase, subclase, nivel, stats: { fue: 14, des: 14, con: 14, int: 14, sab: 14, car: 14, ...stats } });

test('clases: las 12 clases tienen progresión de 1 a 20, con subclase a nivel 3 y don épico a 19', () => {
  assert.deepEqual(Object.keys(CLASES_INFO).sort(), Object.keys(CLASES).sort());
  for (const [clase, info] of Object.entries(CLASES_INFO)) {
    assert.ok(info.rasgos[1]?.length, `${clase}: sin rasgos de nivel 1`);
    assert.ok(info.rasgos[3].some(r => /^Subclase de /.test(r)), `${clase}: sin subclase a nivel 3`);
    assert.deepEqual(info.rasgos[19], ['Don épico'], clase);
    for (const L of [4, 8, 12, 16]) assert.ok(info.rasgos[L].includes('Mejora de característica'), `${clase} ${L}`);
  }
  assert.ok(CLASES_INFO['Guerrero'].rasgos[6].includes('Mejora de característica'));
  assert.ok(CLASES_INFO['Pícaro'].rasgos[10].includes('Mejora de característica'));
});

test('clases: cada subclase (Manual y Faerûn) tiene rasgos justo en los niveles de subclase de su clase', () => {
  let total = 0;
  for (const [clase, subs] of Object.entries(SUBCLASES)) {
    const niveles = Object.entries(CLASES_INFO[clase].rasgos).filter(([, rs]) => rs.includes('Rasgo de subclase')).map(([L]) => +L);
    for (const sc of subs) {
      total++;
      assert.deepEqual(Object.keys(sc.rasgos).map(Number).sort((a, b) => a - b), [3, ...niveles], `${sc.nombre}`);
      assert.ok(CLASES[clase].subs.includes(sc.nombre), `${sc.nombre} no está en la lista de subclases de ${clase}`);
      assert.equal(subclaseDe({ clase, subclase: sc.nombre }), sc, `patrón de ${sc.nombre}`);
    }
  }
  assert.equal(total, 56);   // 48 del Manual del Jugador + 8 de Héroes de Faerûn
  assert.equal(Object.values(SUBCLASES).flat().filter(s => s.libro === 'Héroes de Faerûn').length, 8);
});

test('clases: rasgos por nivel con subclase y marcas genéricas sin ella', () => {
  assert.deepEqual(rasgosEnNivel(ch('Mago', 'Adivino'), 6), ['Adivino avezado']);
  assert.deepEqual(rasgosEnNivel(ch('Mago', 'Adivino'), 3), ['Subclase de mago', 'Experto en adivinación', 'Presagio']);
  assert.deepEqual(rasgosEnNivel(ch('Mago', ''), 6), ['Rasgo de subclase']);
  assert.deepEqual(rasgosEnNivel(ch('Monje', 'Guerrero de la sombra'), 6), ['Golpes potenciados', 'Paso entre sombras']);
  assert.deepEqual(featuresAt(ch('Paladín', '', 2), { subclase: 'Juramento de venganza' }, 3), ['Canalizar divinidad', 'Subclase', 'Conjuros del juramento de venganza', 'Voto de enemistad']);
  assert.deepEqual(featuresAt(ch('Guerrero', 'Campeón', 5), {}, 6), ['Mejora de característica']);
  const p = progresion(ch('Pícaro', 'Asesino', 9));
  assert.deepEqual(p.filter(r => r.origen === 'subclase').map(r => r.nombre), ['Asesinar', 'Herramientas de asesino', 'Pericia en infiltrarse']);
  assert.equal(p.filter(r => r.nombre === 'Pericia').length, 2);
});

test('clases: conjuros siempre preparados de subclase y de clase, por nivel', () => {
  const nombres = c => conjurosAutomaticos(c).map(x => x.nombre);
  assert.deepEqual(nombres(ch('Clérigo', 'Dominio de la vida', 5)), ['Auxilio', 'Bendición', 'Curar heridas', 'Restablecimiento menor', 'Palabra de curación en masa', 'Revivir']);
  assert.deepEqual(nombres(ch('Paladín', 'Juramento de venganza', 5)), ['Castigo divino', 'Hallar corcel', 'Marca del cazador', 'Perdición', 'Inmovilizar persona', 'Paso brumoso']);
  assert.deepEqual(nombres(ch('Explorador', 'Caminante invernal', 5)), ['Marca del cazador', 'Cuchillo de hielo', 'Inmovilizar persona']);
  assert.deepEqual(nombres(ch('Hechicero', 'Hechicería del fuego mágico', 6)).slice(-1), ['Contrahechizo']);
  assert.ok(conjurosAutomaticos(ch('Bárbaro', 'Senda del corazón salvaje', 3)).every(c => c.ritual));
  // todos los conjuros de todas las tablas existen en el compendio
  const hay = new Set(conjuros.map(x => x.es.toLowerCase()));
  for (const { clase, sc } of combinaciones()) for (const c of conjurosAutomaticos(ch(clase, sc.nombre, 20))) assert.ok(hay.has(c.nombre.toLowerCase()), `${sc.nombre}: ${c.nombre}`);
  for (const t of Object.values(SUBCLASES['Druida'][1].terrenos)) for (const n of Object.values(t).flat()) assert.ok(hay.has(n.toLowerCase()), n);
});

test('clases: añadir los conjuros pendientes al subir de nivel', () => {
  const db = { catalog: {}, chars: [] }, c = ch('Clérigo', 'Dominio de la luz', 5);
  const p = conjurosPendientes(db, c, conjuros);
  assert.equal(p.length, 6);
  assert.deepEqual(anadirPendientes(db, c, p), ['Fuego feérico', 'Manos ardientes', 'Rayo abrasador', 'Ver invisibilidad', 'Bola de fuego', 'Luz del día']);
  assert.ok(c.book.every(e => e.always && e.prep));
  assert.equal(conjurosPendientes(db, c, conjuros).length, 0);
});

test('clases: valores que escalan con el nivel', () => {
  const v = c => Object.fromEntries(escalas(c).map(x => [x.nombre, x.valor]));
  assert.equal(v(ch('Pícaro', '', 7))['Ataque furtivo'], '4d6');
  assert.equal(v(ch('Monje', '', 11))['Artes marciales'], 'd10');
  assert.equal(v(ch('Bárbaro', '', 9))['Daño por furia'], '+3');
  assert.equal(v(ch('Brujo', '', 13))['Arcanum místico'], 'nivel 6, nivel 7');
  assert.equal(v(ch('Guerrero', '', 11))['Ataques por acción'], '3');
  // PG: máximo en nivel 1 y la media después (mago con CON 14: 6+2 + 7×(4+2) = 50)
  assert.equal(v(ch('Mago', '', 8))['Puntos de golpe (media)'], '50');
  assert.equal(v(ch('Bárbaro', '', 1, { con: 16 }))['Puntos de golpe (media)'], '15');
});

test('clases: recursos nuevos de subclase y del Faerûn', () => {
  const r = c => Object.fromEntries(reglas(c).map(x => [x.nombre, x.max]));
  assert.equal(r(ch('Brujo', 'Patrón infernal', 17))['Arcanum místico (nivel 9)'], 1);
  assert.equal(r(ch('Brujo', 'Patrón infernal', 12))['Arcanum místico (nivel 7)'], undefined);
  assert.equal(r(ch('Mago', 'Hojacantante', 3, { int: 18 }))['Canción de la hoja'], 4);
  assert.equal(r(ch('Pícaro', 'Vástago de los Tres', 3, { int: 16 }))['Sed de sangre'], 3);
  assert.equal(reglas(ch('Pícaro', 'Vástago de los Tres', 17)).find(x => x.nombre === 'Sed de sangre').recarga, 'corto1');
  assert.equal(r(ch('Guerrero', 'Abanderado', 3))['Recuperación grupal'], 1);
  assert.equal(r(ch('Explorador', 'Caminante invernal', 11, { sab: 18 }))['Represalia escalofriante'], 4);
  assert.equal(r(ch('Paladín', 'Juramento de los genios nobles', 20))['Vástago noble'], 1);
  assert.equal(r(ch('Hechicero', 'Hechicería mecánica', 3, { car: 16 }))['Restablecer equilibrio'], 3);
  assert.equal(r(ch('Paladín', '', 4))['Imponer las manos'], 20);
});

test('temas: cada clase y subclase tiene tono y emblema propios, con icono y escena', () => {
  const todos = [...Object.values(TEMAS.clase), ...Object.values(TEMAS.sub)];
  assert.equal(Object.keys(TEMAS.sub).length, 56);
  assert.equal(new Set(todos.map(([h, s]) => `${h}|${s}`)).size, todos.length, 'tono repetido');
  assert.equal(new Set(todos.map(t => t[2])).size, todos.length, 'emblema repetido');
  const svg = k => new RegExp(`"${k}":"([^"\\\\]|\\\\.)*"`).exec(GI)?.[0].split(':').slice(1).join(':');
  const cuerpos = todos.map(t => svg(t[2]));
  cuerpos.forEach((b, i) => assert.ok(b, `falta el icono ${todos[i][2]}`));
  assert.equal(new Set(cuerpos).size, todos.length, 'dos emblemas con el mismo dibujo');
  for (const t of todos) assert.match(ESCENAS, new RegExp(`\\b${t[2]}: '`), `sin escena: ${t[2]}`);
  for (const nombre of Object.keys(TEMAS.sub)) assert.ok(Object.values(SUBCLASES).flat().some(s => s.nombre === nombre), nombre);
});

test('pruebas: características con matriz estándar, trasfondo y mejoras', () => {
  const { stats, notas } = statsPrueba(['int', 'con', 'des', 'sab', 'car', 'fue'], 'Erudito', 'Mago', 8);
  assert.deepEqual(stats, { int: 20, con: 16, des: 13, sab: 12, car: 10, fue: 8 });
  assert.equal(notas.length, 2);
  assert.equal(statsPrueba(['fue', 'con', 'des', 'sab', 'int', 'car'], 'Soldado', 'Guerrero', 8).notas.length, 3);
});

test('pruebas: un personaje de nivel 8 por subclase, completos y coherentes con las reglas', () => {
  const db = { schema: 2, catalog: {}, chars: [{ id: 'mio', nombre: 'Theo', clase: 'Mago', nivel: 6, book: [] }], activeId: 'mio' };
  const r = sembrarPruebas(db, conjuros);
  assert.deepEqual(r.faltan, []);
  assert.equal(r.creados, 56);
  assert.equal(db.chars.length, 57); assert.equal(db.activeId, 'mio');
  const pruebas = db.chars.filter(c => c.prueba);
  for (const c of pruebas) {
    const P = perfil(c), libro = c.book.map(e => db.catalog[e.sid]);
    assert.equal(c.nivel, NIVEL_PRUEBA);
    assert.ok(subclaseDe(c), c.subclase);
    assert.ok(Object.values(c.stats).every(v => v >= 8 && v <= 20), c.nombre);
    assert.ok(libro.every(Boolean), `${c.nombre}: conjuro fuera del catálogo`);
    assert.ok(libro.every(s => s.level <= Math.max(P.maxSlot, 2)), `${c.nombre}: conjuro de nivel demasiado alto`);
    if (P.maxPrep) {
      const prep = c.book.filter(e => e.prep && !e.always).length;
      assert.equal(prep, P.maxPrep, `${c.nombre}: preparados`);
      assert.ok(libro.filter(s => s.level === 0).length >= P.maxCant, `${c.nombre}: trucos`);
    }
    for (const a of conjurosAutomaticos(c)) assert.ok(libro.some(s => s.es === a.nombre), `${c.nombre}: falta ${a.nombre}`);
    assert.ok(c.equipo.objetos.some(o => o.sintonizado));
    assert.equal(c.diario.sesiones.length, 1); assert.equal(c.bestiario.criaturas.length, 1);
    assert.match(c.historia, /## Origen/);
    assert.match(c.notas, /Nivel 8/);
  }
  const mago = pruebas.find(c => c.subclase === 'Adivino');
  assert.equal(mago.book.filter(e => e.fuente === 'Libro').length, 20);   // 6 + 2 por nivel
  assert.equal(mago.book.filter(e => /^Experto/.test(e.fuente)).length, 4);
  assert.ok(reglas(mago).some(x => x.nombre === 'Presagio'));
  // regenerar sustituye la tanda sin duplicar ni tocar los personajes propios
  sembrarPruebas(db, conjuros);
  assert.equal(db.chars.length, 57); assert.ok(db.chars.some(c => c.id === 'mio'));
});
