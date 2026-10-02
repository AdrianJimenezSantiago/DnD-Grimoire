import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { leerDotes, leerTrasfondos, leerSubclases, separarRasgos, completarSubclases, nombrarTrasfondos, corregirConTabla, frecuencias } from '../../web/src/domain/libros/contenido.js';

const L = (x, y, s, h = 16, segs) => ({ x, y, h, s, segs: segs || [{ x, w: s.length * 7, s }], cells: segs ? segs.map(g => ({ x: g.x, s: g.s })) : [{ x, s }] });
const pag = cols => [{ p: 1, cols }];

describe('dotes, trasfondos y subclases', () => {
  test('dotes, trasfondos y subclases', () => {
    const d = leerDotes(pag([[L(60, 900, 'DOTE INVENTADA', 20), L(60, 880, 'Dote general (requisitos: nivel 4 o más)'), L(60, 860, 'Obtienes un beneficio de prueba bastante largo.')], []]));
    assert.equal(d[0].cat, 'General'); assert.equal(d[0].req, 'nivel 4 o más');
    const t = leerTrasfondos(pag([[L(60, 900, 'ARTESANO', 20), L(60, 880, 'Puntuaciones de característica: Fuerza, Destreza, Inteligencia'), L(60, 860, 'Dote: Fabricante (consulta el capítulo 5)'),
      L(60, 840, 'Competencias en habilidades: Investigación y Persuasión'), L(60, 820, 'Equipo: 50 po'), L(60, 790, 'Texto del trasfondo inventado.')], []]));
    assert.equal(t[0].nombre, 'Artesano'); assert.equal(t[0].dote, 'Fabricante');
    const s = leerSubclases(pag([[L(60, 900, 'CUSTODIO DE PRUEBA (MAGO)', 26), L(60, 880, 'Un lema breve.'), L(60, 870, 'Introducción de la subclase.'), L(60, 850, 'NIVEL 3: PRIMER RASGO', 20), L(60, 830, 'Texto del rasgo.'),
      L(60, 800, 'NIVEL 6: SEGUNDO RASGO', 20), L(60, 780, 'Más texto.')], []]));
    assert.equal(s[0].clase, 'Mago'); assert.deepEqual(s[0].rasgos.map(r => r.nivel), [3, 6]); assert.equal(s[0].lema, 'Un lema breve.');
  });

  test('trasfondos y dotes se nombran con las tablas del propio libro', () => {
    const nombres = ['Arpista', 'Sectario del Dragón', 'Peregrino de los manantiales lunares'];
    const t = nombrarTrasfondos([{ nombre: '', texto: 'Juraste defender el código de los Arpistas.', revisar: true }, { nombre: '~ eregrino de los manantiales l', texto: '' },
      { nombre: '', texto: 'Eres uno de los iniciados del Culto del Dragón.', revisar: true }], nombres);
    assert.deepEqual(t.map(x => x.nombre), ['Arpista', 'Peregrino de los manantiales lunares', 'Sectario del Dragón']);
    const frec = frecuencias(['el dragón púrpura', 'dragón', 'tocado por los mythales', 'tocado', 'resistencia', 'resistencia']);
    const d = corregirConTabla([{ nombre: 'Comandante del Dragón Púrpura' }, { nombre: 'Toca do por los mythales' }, { nombre: 'Don de la resistencla desesperada' }],
      ['Comandante del Dragó n Púrpura', 'Tocado por los mythales', 'Don de la resistencia desesperada'], frec);
    assert.deepEqual(d.map(x => x.nombre), ['Comandante del Dragón Púrpura', 'Tocado por los mythales', 'Don de la resistencia desesperada']);
  });
});

describe('leerSubclases', () => {
  test('títulos de rasgo con «NIVEL» mal leído, pegados al texto o en mitad de línea', () => {
    const ls = separarRasgos([L(60, 900, 'NrIveEL 10: REPRESALIA Cuando recibas daño de una criatura'), L(60, 880, 'NIveL 6: Foco FANÁTICO Una vez por furia, si fallas'),
      L(60, 860, 'del espacio gastado. NrveL 10: EL TERCER OJO Puedes aumentar'), L(60, 840, 'tres espacios de nivel 1. Cuando recuperes espacios')].map(l => ({ ...l, margin: 60, hTip: 16 })));
    assert.deepEqual(ls.map(l => l.s), ['NIVEL 10: REPRESALIA', 'Cuando recibas daño de una criatura', 'NIVEL 6: FOCO FANÁTICO', 'Una vez por furia, si fallas',
      'del espacio gastado.', 'NIVEL 10: EL TERCER OJO', 'Puedes aumentar', 'tres espacios de nivel 1. Cuando recuperes espacios']);
  });

  test('número de nivel mal leído, coma en vez de dos puntos y título en dos líneas', () => {
    const ls = separarRasgos([L(60, 900, 'NIVEL lL REPRESALIA'), L(60, 885, 'ESCALOFRIANTE'), L(60, 870, 'Cuando una criatura te acierte.'),
      L(60, 850, 'NIVEL IO : ARENGA SÚBITA'), L(60, 830, 'NIVEL 3, ENTRENARSE EN LA GUERRA Y LA CANCIÓN Ganas competencia'), L(60, 810, 'NIVEL 3: EXPLORADOR. GÉLIDO')].map(l => ({ ...l, p: 1, margin: 60, hTip: 16 })));
    assert.deepEqual(ls.map(l => l.s), ['NIVEL 11: REPRESALIA ESCALOFRIANTE', 'Cuando una criatura te acierte.', 'NIVEL 10: ARENGA SÚBITA',
      'NIVEL 3: ENTRENARSE EN LA GUERRA Y LA CANCIÓN', 'Ganas competencia', 'NIVEL 3: EXPLORADOR GÉLIDO']);
  });

  test('sin título se reconocen por sus rasgos; nombres de rasgo casi iguales se corrigen', () => {
    const sin = { clave: '', clase: 'Mago', nombre: '', lema: '', texto: '### Nivel 3: Experto en evocación\n\nTexto.\n\n### Nivel 3: Truco potente\n\nMás.', revisar: true,
      rasgos: [{ nivel: 3, nombre: 'Experto en evocación' }, { nivel: 3, nombre: 'Truco potente' }] };
    const emb = { clave: 'embaucador arcano', clase: 'Pícaro', nombre: 'Embaucador arcano', lema: '', texto: '### Nivel 17: Labrón de conjuros\n\nRobas un conjuro.', rasgos: [{ nivel: 17, nombre: 'Labrón de conjuros' }] };
    const [a, b] = completarSubclases([emb, sin]);
    assert.equal(a.rasgos[0].nombre, 'Ladrón de conjuros'); assert.match(a.texto, /^### Nivel 17: Ladrón de conjuros/);
    assert.equal(b.nombre, 'Evocador'); assert.equal(b.revisar, false);
  });
});
