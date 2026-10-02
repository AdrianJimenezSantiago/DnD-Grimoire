import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { resumenClase, resumenSubclase, clasificar, resumen, rasgosEnJuego, agrupar, numerosMarciales } from '../../web/src/domain/clases/enJuego.js';
import { reglas } from '../../web/src/domain/clases/rasgos.js';

const pjMulticlase = (clase, nivel, multiclase = [], extra = {}) => ({ clase, subclase: '', nivel, multiclase, stats: { fue: 14, des: 14, con: 14, int: 14, sab: 14, car: 14 }, play: { rec: {} }, rasgos: [], ...extra });

describe('clasificar y resumen', () => {
  test('el tipo de acción sale del texto (manda la primera mención)', () => {
    assert.equal(clasificar('Puedes entrar en trance como acción adicional si no llevas armadura.'), 'adicional');
    assert.equal(clasificar('Cuando algo te golpee, puedes llevar a cabo una reacción para reducir el daño. Como acción adicional, además…'), 'reaccion');
    assert.equal(clasificar('Como acción de magia, invocas un destello.'), 'accion');
    assert.equal(clasificar('Cuando lleves a cabo la acción de atacar en tu turno, podrás hacer dos ataques.'), 'accion');
    assert.equal(clasificar('Tienes ventaja en las tiradas de iniciativa.'), 'pasivo');
    assert.equal(clasificar('Conoces un idioma secreto que solo entienden los tuyos.'), 'fuera');
  });

  test('sin libro, los rasgos de clase conocidos van a su grupo (Furia es acción adicional)', () => {
    assert.equal(clasificar('', 'Furia'), 'adicional');
    assert.equal(clasificar('', 'Acción súbita (un uso)'), 'accion');
    assert.equal(clasificar('', 'Esquiva asombrosa'), 'reaccion');
    assert.equal(clasificar('', 'Recuperación arcana'), 'fuera');
    assert.equal(clasificar('Tienes ventaja en las tiradas de iniciativa.', 'Furia'), 'pasivo');
    const rs = rasgosEnJuego({ clase: 'Bárbaro', nivel: 3, stats: { con: 14 } }, {});
    assert.equal(rs.find(r => r.nombre === 'Furia').grupo, 'adicional');
  });

  test('resumen con la frase de uso o la primera con reglas', () => {
    assert.equal(resumen('Un poder antiguo te recorre. Puedes invocarlo como acción adicional si no llevas armadura. Dura 10 minutos.'), 'Puedes invocarlo como acción adicional si no llevas armadura.');
    assert.equal(resumen('Percibes cuándo algo va mal. Tienes ventaja en las tiradas de salvación de Destreza.'), 'Tienes ventaja en las tiradas de salvación de Destreza.');
  });
});

describe('rasgosEnJuego', () => {
  test('rasgos del personaje con texto, números, recurso, grupo manual y fijados', () => {
    const lib = { rasgosClase: [{ clase: 'Bárbaro', fuente: 'Libro', rasgos: [
      { nivel: 1, nombre: 'Furia', texto: 'Puedes dejarte llevar por ella como acción adicional.' },
      { nivel: 2, nombre: 'Sentir el peligro', texto: 'Tienes ventaja en las tiradas de salvación de Destreza.' }] }] };
    const ch = { clase: 'Bárbaro', nivel: 4, stats: { con: 14 }, enJuego: { grupo: { 'clase:sentir el peligro': 'reaccion' } } };
    const rs = rasgosEnJuego(ch, lib, [{ tipo: 'recurso', id: 'furia', nombre: 'Furia', max: 3 }]);
    assert.ok(!rs.some(r => /Mejora|Subclase/.test(r.nombre)));
    const furia = rs.find(r => r.nombre === 'Furia');
    assert.equal(furia.grupo, 'adicional'); assert.equal(furia.recurso.id, 'furia'); assert.deepEqual(furia.numeros, [{ nombre: 'Daño por furia', valor: '+2' }]);
    assert.equal(rs.find(r => r.nombre === 'Sentir el peligro').grupo, 'reaccion');
    assert.equal(rs.find(r => r.nombre === 'Ataque temerario').texto, '');
    const g = agrupar(rs, ['clase:furia']);
    assert.equal(g[0].clave, 'fijados'); assert.deepEqual(g[0].rasgos.map(r => r.nombre), ['Furia']);
    assert.deepEqual(numerosMarciales(ch).map(n => n.nombre), ['Daño por furia', 'Maestría con armas', 'Competencia', 'Dado de golpe']);
  });

  test('con multiclase, el mismo rasgo de dos clases es una sola tarjeta y la cabecera suma los dados de golpe', () => {
    const ch = pjMulticlase('Bárbaro', 5, [{ clase: 'Guerrero', subclase: 'Campeón', nivel: 3 }]);
    const maestria = rasgosEnJuego(ch, {}, reglas(ch)).filter(r => r.nombre === 'Maestría con armas');
    assert.equal(maestria.length, 1); assert.equal(maestria[0].etiqueta, 'Nivel 1 · Bárbaro y Guerrero');
    assert.ok(rasgosEnJuego(ch, {}, reglas(ch)).some(r => r.origen === 'multiclase' && r.nombre === 'Tomar aliento' && r.recurso?.nombre === 'Tomar aliento'));
    const n = numerosMarciales(ch);
    assert.deepEqual(n.find(x => x.nombre === 'Dado de golpe'), { nombre: 'Dado de golpe', valor: '5d12 + 3d10' });
    assert.deepEqual(n.find(x => x.nombre === 'Competencia'), { nombre: 'Competencia', valor: '+3' });
  });
});

describe('resumenClase y resumenSubclase', () => {
  test('resumen de clase y subclase: datos clave, niveles 1 a 20 y conjuros de la subclase', () => {
    const lib = { rasgosClase: [{ clase: 'Pícaro', fuente: 'Libro', rasgos: [{ nivel: 1, nombre: 'Ataque furtivo', texto: 'Una vez por turno puedes infligir 1d6 de daño adicional con ventaja.' }] }] };
    const c = resumenClase('Pícaro', lib);
    assert.deepEqual(c.datos[0], ['Dado de golpe', 'd8']); assert.match(c.datos[3][1], /Embaucador arcano/);
    assert.equal(c.niveles[0].nivel, 1); assert.equal(c.niveles.at(-1).nivel, 20);
    assert.match(c.niveles[0].rasgos.find(r => r.nombre === 'Ataque furtivo').resumen, /1d6/);
    assert.ok(c.niveles.find(n => n.nivel === 9).rasgos.some(r => r.sub));
    const s = resumenSubclase('Clérigo', 'Dominio de la luz', {});
    assert.deepEqual(s.niveles.map(n => n.nivel), [3, 6, 17]); assert.equal(s.conjuros[0].nivel, 3); assert.equal(s.conTextos, false);
    assert.equal(resumenSubclase('Mago', 'Inventada', {}), null);
  });
});
