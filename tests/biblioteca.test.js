import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerTablaDado, leerTablaColumnas, tablaATexto, arreglarDados, normRotulo, intervalo } from '../web/src/domain/libros/tablas.js';
import { parseObjetos, leerTipo, leerCargas } from '../web/src/domain/libros/objetos.js';
import { parseDotes, parseTrasfondos, parseSubclases, separarRasgos, completarSubclases, nombrarTrasfondos, corregirConTabla, frecuencias } from '../web/src/domain/libros/contenido.js';
import { anadirObjeto, quitarObjeto, alternarSintonia, rasgoDeCargas } from '../web/src/domain/equipo/equipo.js';
import { nuevaCriatura, notasConjuro, resumenCriatura } from '../web/src/domain/criaturas/bestiario.js';

const L = (x, y, s, h = 16, segs) => ({ x, y, h, s, segs: segs || [{ x, w: s.length * 7, s }], cells: segs ? segs.map(g => ({ x: g.x, s: g.s })) : [{ x, s }] });
const pag = cols => [{ p: 1, cols }];

test('tabla de dado: filas, continuaciones y un número que sigue el texto', () => {
  const Ls = [L(60, 900, '1d6 Resultado'), L(70, 880, '1 Pasa algo curioso y', 16, [{ x: 70, w: 8, s: '1' }, { x: 100, w: 120, s: 'Pasa algo curioso y' }]),
    L(100, 860, 'dura 1 hora.'), L(70, 840, '2-5 Nada.'), L(70, 820, '6 Todo a la vez.'), L(60, 790, 'Texto normal que ya no es tabla.')];
  const t = leerTablaDado(Ls, 0);
  assert.deepEqual(t.filas, [['1d6', 'Resultado'], ['1', 'Pasa algo curioso y dura 1 hora.'], ['2–5', 'Nada.'], ['6', 'Todo a la vez.']]);
  assert.equal(t.fin, 5);
  assert.match(tablaATexto(t.filas), /^\| 1d6 \| Resultado \|\n\| 1 \|/);
});
test('tabla de columnas: exige huecos reales y descarta prosa', () => {
  const fila = (y, a, b) => L(60, y, `${a} ${b}`, 16, [{ x: 60, w: 100, s: a }, { x: 260, w: 80, s: b }]);
  const t = leerTablaColumnas([fila(900, 'Material', 'Duración'), fila(880, 'Madera', '1 hora'), fila(860, 'Piedra', '1 día'), fila(840, 'Gemas', '1 minuto')], 0);
  assert.deepEqual(t.filas[2], ['Piedra', '1 día']);
  assert.equal(leerTablaColumnas([L(60, 900, 'Prosa normal sin columnas'), L(60, 880, 'que sigue y sigue.')], 0), null);
});
test('arreglos de OCR en dados y rótulos', () => {
  assert.equal(arreglarDados('recibe 1246 de daño de fuego y tira 1420.'), 'recibe 12d6 de daño de fuego y tira 1d20.');
  assert.equal(normRotulo('2130'), '21–30'); assert.deepEqual(intervalo('96–00'), [96, 100]);
});
test('objetos mágicos: tipo, rareza variable, sintonización y cargas', () => {
  const t = leerTipo('Arma (cualquier arma sencilla), infrecuente (+1), rara (+2) o muy rara (+3)');
  assert.equal(t.tipo, 'Arma'); assert.equal(t.rareza, 'Varía'); assert.deepEqual(t.rarezas, ['Infrecuente', 'Raro', 'Muy raro']);
  const v = leerTipo('Varita, rara (requiere sintonización por parte de un lanzador de conjuros)');
  assert.equal(v.rareza, 'Raro'); assert.ok(v.sintonia); assert.equal(leerTipo('POCIÓN DE PRUEBA Poción, rara'), null);
  assert.deepEqual(leerCargas('Tiene 7 cargas. Recupera 1d6 + 1 cargas empleadas cada día, al amanecer.'), { max: 7, recarga: '1d6+1', cuando: 'amanecer' });
  const o = parseObjetos(pag([[L(60, 900, 'VARA DE PRUEBA', 20), L(60, 880, 'Vara, muy rara (requiere sintonización)'), L(60, 860, 'Esta vara inventada tiene 3 cargas y recupera 1d3 cargas gastadas al amanecer.'),
    L(60, 820, 'OTRO OBJETO', 20), L(60, 800, 'Objeto maravilloso, común'), L(60, 780, 'Un objeto de prueba sin más.')], []]));
  assert.deepEqual(o.map(x => [x.nombre, x.rareza]), [['Vara de prueba', 'Muy raro'], ['Otro objeto', 'Común']]);
  assert.equal(o[0].cargas.max, 3);
});
test('dotes, trasfondos y subclases', () => {
  const d = parseDotes(pag([[L(60, 900, 'DOTE INVENTADA', 20), L(60, 880, 'Dote general (requisitos: nivel 4 o más)'), L(60, 860, 'Obtienes un beneficio de prueba bastante largo.')], []]));
  assert.equal(d[0].cat, 'General'); assert.equal(d[0].req, 'nivel 4 o más');
  const t = parseTrasfondos(pag([[L(60, 900, 'ARTESANO', 20), L(60, 880, 'Puntuaciones de característica: Fuerza, Destreza, Inteligencia'), L(60, 860, 'Dote: Fabricante (consulta el capítulo 5)'),
    L(60, 840, 'Competencias en habilidades: Investigación y Persuasión'), L(60, 820, 'Equipo: 50 po'), L(60, 790, 'Texto del trasfondo inventado.')], []]));
  assert.equal(t[0].nombre, 'Artesano'); assert.equal(t[0].dote, 'Fabricante');
  const s = parseSubclases(pag([[L(60, 900, 'CUSTODIO DE PRUEBA (MAGO)', 26), L(60, 880, 'Un lema breve.'), L(60, 870, 'Introducción de la subclase.'), L(60, 850, 'NIVEL 3: PRIMER RASGO', 20), L(60, 830, 'Texto del rasgo.'),
    L(60, 800, 'NIVEL 6: SEGUNDO RASGO', 20), L(60, 780, 'Más texto.')], []]));
  assert.equal(s[0].clase, 'Mago'); assert.deepEqual(s[0].rasgos.map(r => r.nivel), [3, 6]); assert.equal(s[0].lema, 'Un lema breve.');
});
test('subclases: títulos de rasgo con «NIVEL» mal leído, pegados al texto o en mitad de línea', () => {
  const ls = separarRasgos([L(60, 900, 'NrIveEL 10: REPRESALIA Cuando recibas daño de una criatura'), L(60, 880, 'NIveL 6: Foco FANÁTICO Una vez por furia, si fallas'),
    L(60, 860, 'del espacio gastado. NrveL 10: EL TERCER OJO Puedes aumentar'), L(60, 840, 'tres espacios de nivel 1. Cuando recuperes espacios')].map(l => ({ ...l, margin: 60, hTip: 16 })));
  assert.deepEqual(ls.map(l => l.s), ['NIVEL 10: REPRESALIA', 'Cuando recibas daño de una criatura', 'NIVEL 6: FOCO FANÁTICO', 'Una vez por furia, si fallas',
    'del espacio gastado.', 'NIVEL 10: EL TERCER OJO', 'Puedes aumentar', 'tres espacios de nivel 1. Cuando recuperes espacios']);
});
test('subclases: número de nivel mal leído, coma en vez de dos puntos y título en dos líneas', () => {
  const ls = separarRasgos([L(60, 900, 'NIVEL lL REPRESALIA'), L(60, 885, 'ESCALOFRIANTE'), L(60, 870, 'Cuando una criatura te acierte.'),
    L(60, 850, 'NIVEL IO : ARENGA SÚBITA'), L(60, 830, 'NIVEL 3, ENTRENARSE EN LA GUERRA Y LA CANCIÓN Ganas competencia'), L(60, 810, 'NIVEL 3: EXPLORADOR. GÉLIDO')].map(l => ({ ...l, p: 1, margin: 60, hTip: 16 })));
  assert.deepEqual(ls.map(l => l.s), ['NIVEL 11: REPRESALIA ESCALOFRIANTE', 'Cuando una criatura te acierte.', 'NIVEL 10: ARENGA SÚBITA',
    'NIVEL 3: ENTRENARSE EN LA GUERRA Y LA CANCIÓN', 'Ganas competencia', 'NIVEL 3: EXPLORADOR GÉLIDO']);
});
test('libros: trasfondos y dotes se nombran con las tablas del propio libro', () => {
  const nombres = ['Arpista', 'Sectario del Dragón', 'Peregrino de los manantiales lunares'];
  const t = nombrarTrasfondos([{ nombre: '', texto: 'Juraste defender el código de los Arpistas.', revisar: true }, { nombre: '~ eregrino de los manantiales l', texto: '' },
    { nombre: '', texto: 'Eres uno de los iniciados del Culto del Dragón.', revisar: true }], nombres);
  assert.deepEqual(t.map(x => x.nombre), ['Arpista', 'Peregrino de los manantiales lunares', 'Sectario del Dragón']);
  const frec = frecuencias(['el dragón púrpura', 'dragón', 'tocado por los mythales', 'tocado', 'resistencia', 'resistencia']);
  const d = corregirConTabla([{ nombre: 'Comandante del Dragón Púrpura' }, { nombre: 'Toca do por los mythales' }, { nombre: 'Don de la resistencla desesperada' }],
    ['Comandante del Dragó n Púrpura', 'Tocado por los mythales', 'Don de la resistencia desesperada'], frec);
  assert.deepEqual(d.map(x => x.nombre), ['Comandante del Dragón Púrpura', 'Tocado por los mythales', 'Don de la resistencia desesperada']);
});
test('subclases: sin título se reconocen por sus rasgos; nombres de rasgo casi iguales se corrigen', () => {
  const sin = { clave: '', clase: 'Mago', nombre: '', lema: '', texto: '### Nivel 3: Experto en evocación\n\nTexto.\n\n### Nivel 3: Truco potente\n\nMás.', revisar: true,
    rasgos: [{ nivel: 3, nombre: 'Experto en evocación' }, { nivel: 3, nombre: 'Truco potente' }] };
  const emb = { clave: 'embaucador arcano', clase: 'Pícaro', nombre: 'Embaucador arcano', lema: '', texto: '### Nivel 17: Labrón de conjuros\n\nRobas un conjuro.', rasgos: [{ nivel: 17, nombre: 'Labrón de conjuros' }] };
  const [a, b] = completarSubclases([emb, sin]);
  assert.equal(a.rasgos[0].nombre, 'Ladrón de conjuros'); assert.match(a.texto, /^### Nivel 17: Ladrón de conjuros/);
  assert.equal(b.nombre, 'Evocador'); assert.equal(b.revisar, false);
});
test('equipo: cargas como recurso y tres huecos de sintonización', () => {
  const ch = { rasgos: [], play: { rec: {} } };
  const r = rasgoDeCargas({ nombre: 'Varita', cargas: { max: 7, recarga: '1d6+1' } });
  assert.equal(r.recarga, 'dado'); assert.equal(r.recDado, '1d6'); assert.equal(r.recBono, 1);
  const a = ['a', 'b', 'c', 'd'].map(k => anadirObjeto(ch, { clave: k, nombre: k, sintonia: true, cargas: k === 'a' ? { max: 3 } : null }));
  assert.equal(ch.rasgos.length, 1);
  assert.ok(alternarSintonia(ch, a[0].id)); alternarSintonia(ch, a[1].id); alternarSintonia(ch, a[2].id);
  assert.equal(alternarSintonia(ch, a[3].id), false);
  quitarObjeto(ch, a[0].id); assert.equal(ch.rasgos.length, 0);
});
test('bestiario: notas al pie del conjuro por tipo de daño o anotadas a mano', () => {
  const ch = {}, c = nuevaCriatura(ch, 'Trol'); c.danos = { fuego: 'vul', 'frío': 'res' };
  assert.equal(resumenCriatura(c), 'vulnerable a fuego · resiste frío');
  assert.equal(notasConjuro(ch, { tipos: ['fuego'] })[0].rel, 'vul');
  c.conjuros.s1 = 'ineficaz'; assert.equal(notasConjuro(ch, { sid: 's1', tipos: ['fuego'] })[0].rel, 'ineficaz');
  assert.equal(notasConjuro(ch, { tipos: ['trueno'] }).length, 0);
});
