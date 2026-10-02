import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { arma } from '../helpers/fixtures.js';
import { parseObjetos, leerTipo, leerCargas, leerUsos, corregirNombre } from '../../web/src/domain/libros/objetos.js';

const L = (x, y, s, h = 16, segs) => ({ x, y, h, s, segs: segs || [{ x, w: s.length * 7, s }], cells: segs ? segs.map(g => ({ x: g.x, s: g.s })) : [{ x, s }] });
const pag = cols => [{ p: 1, cols }];

describe('parseObjetos', () => {
  test('tipo, rareza variable, sintonización y cargas', () => {
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

  test('cargas en plural, «de sus», «comienza con», en dados y cuentas', () => {
    assert.deepEqual(leerCargas('Estas botas tienen 4 cargas y recuperan 1d4 cargas empleadas cada día, al amanecer.'), { max: 4, recarga: '1d4', cuando: 'amanecer' });
    assert.equal(leerCargas('Puedes gastar 1 de sus 3 cargas para lanzar deseo. El anillo se volverá no mágico cuando utilices la última carga.').ultima, 'Al gastar la última carga, el objeto deja de ser mágico.');
    assert.equal(leerCargas('El cubo comienza con 10 cargas y recupera 1d6 cargas empleadas cada día, al amanecer.').max, 10);
    assert.deepEqual(leerCargas('La moneda tiene 1 carga y recupera la carga empleada cada día, al amanecer.'), { max: 1, recarga: 'todas', cuando: 'amanecer' });
    assert.equal(leerCargas('La vara tiene 5 cargas. La vara recupera 1 carga empleada cada día, al amanecer.').recarga, '1');
    assert.equal(leerCargas('El arma tiene 1d3 cargas.').dado, '1d3');
    const c = leerCargas('De este collar cuelgan 1d6 + 3 cuentas.');
    assert.equal(c.dado, '1d6+3'); assert.ok(c.cuentas);
    assert.match(leerCargas('Esta varita tiene 7 cargas. Si gastas la última carga de la varita, tira 1d20. Con un 1, se convierte en cenizas.').ultima, /1d20/);
    // Lo que dice una variante («Cabra de viaje… Tiene 24 cargas») no es del objeto común
    assert.equal(leerCargas('Texto común de la estatuilla.\n\nCabras de marfil (raras). Cabra de viaje. Tiene 24 cargas.'), null);
  });

  test('usos diarios de las propiedades y erratas de los nombres', () => {
    const u = leerUsos('Paralizar. Puedes paralizar a alguien. Una vez utilizada, esta propiedad no puede volver a usarse hasta el siguiente amanecer.\n\nAterrorizar. Asustas. Una vez utilizada, esta propiedad no puede volver a usarse hasta el siguiente amanecer.', 'Cetro');
    assert.deepEqual(u.map(x => x.nombre), ['Cetro: Paralizar', 'Cetro: Aterrorizar']);
    assert.equal(leerUsos('Desviar ataque. Giras el arma. No podrás volver a usar esta propiedad hasta que finalices un descanso corto o largo.', 'Bastón')[0].recarga, 'corto');
    assert.deepEqual(leerUsos('Cuando uses el libro para lanzar un conjuro, no podrás volver a lanzarlo desde él hasta el siguiente amanecer.', 'Libro'), []);
    assert.equal(corregirNombre('Escupo +1, +2 o +3'), 'Escudo +1, +2 o +3');
    assert.equal(corregirNombre('Piedra loun'), 'Piedra ioun');
    assert.equal(corregirNombre('Pociones de curación'), 'Poción de curación');
  });

  test('títulos en versalitas mal leídas, a la izquierda del margen y con un pie de ilustración en medio', () => {
    const o = parseObjetos(pag([[L(60, 900, 'TEXTO DE RELLENO', 14), L(60, 880, 'Un párrafo cualquiera que marca el margen.'), L(60, 860, 'Y otro más para el margen.'),
      L(60, 820, 'EscuDO ANIMADO', 21), L(60, 800, 'Armadura (escudo), muy rara (requiere sintonización)'), L(60, 780, 'Mientras lleves embrazado este escudo, puedes darle vida.'),
      L(60, 740, 'GORRO DE PRUEBA', 15), L(400, 730, 'GLoBo', 13), L(60, 720, 'Objeto maravilloso, infrecuente'), L(60, 700, 'Si estás bajo el agua y llevas este gorro, respiras.'),
      L(60, 660, 'VARA DEL PACTO', 20), L(60, 640, 'Vara, infrecuente (+1), rara (+2) o muy rara (+3)'), L(60, 620, '(requiere sintonización por parte de un brujo) Mientras sostienes esta vara, obtienes un bonificador.')], []]));
    const por = Object.fromEntries(o.map(x => [x.nombre, x]));
    assert.ok(por['Escudo animado']); assert.ok(por['Gorro de prueba']);
    assert.equal(por['Vara del pacto'].sintoniaCon, 'parte de un brujo');
    assert.doesNotMatch(por['Vara del pacto'].texto, /^\(requiere/);
  });
});
