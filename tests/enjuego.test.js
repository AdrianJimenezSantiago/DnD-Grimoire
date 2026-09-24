import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clasificar, resumen, rasgosEnJuego, agrupar, numerosMarciales } from '../web/src/domain/enJuego.js';

// Textos inventados con la forma de los del libro
test('en juego: el tipo de acción sale del texto (manda la primera mención)', () => {
  assert.equal(clasificar('Puedes entrar en trance como acción adicional si no llevas armadura.'), 'adicional');
  assert.equal(clasificar('Cuando algo te golpee, puedes llevar a cabo una reacción para reducir el daño. Como acción adicional, además…'), 'reaccion');
  assert.equal(clasificar('Como acción de magia, invocas un destello.'), 'accion');
  assert.equal(clasificar('Cuando lleves a cabo la acción de atacar en tu turno, podrás hacer dos ataques.'), 'accion');
  assert.equal(clasificar('Tienes ventaja en las tiradas de iniciativa.'), 'pasivo');
  assert.equal(clasificar('Conoces un idioma secreto que solo entienden los tuyos.'), 'fuera');
});
test('en juego: resumen con la frase de uso o la primera con reglas', () => {
  assert.equal(resumen('Un poder antiguo te recorre. Puedes invocarlo como acción adicional si no llevas armadura. Dura 10 minutos.'), 'Puedes invocarlo como acción adicional si no llevas armadura.');
  assert.equal(resumen('Percibes cuándo algo va mal. Tienes ventaja en las tiradas de salvación de Destreza.'), 'Tienes ventaja en las tiradas de salvación de Destreza.');
});
test('en juego: rasgos del personaje con texto, números, recurso, grupo manual y fijados', () => {
  const lib = { rasgosClase: [{ clase: 'Bárbaro', fuente: 'Libro', rasgos: [
    { nivel: 1, nombre: 'Furia', texto: 'Puedes dejarte llevar por ella como acción adicional.' },
    { nivel: 2, nombre: 'Sentir el peligro', texto: 'Tienes ventaja en las tiradas de salvación de Destreza.' }] }] };
  const ch = { clase: 'Bárbaro', nivel: 4, stats: { con: 14 }, enJuego: { grupo: { 'clase:sentir el peligro': 'reaccion' } } };
  const rs = rasgosEnJuego(ch, lib, [{ tipo: 'recurso', id: 'furia', nombre: 'Furia', max: 3 }]);
  // la mejora de característica y la elección de subclase no son rasgos de juego
  assert.ok(!rs.some(r => /Mejora|Subclase/.test(r.nombre)));
  const furia = rs.find(r => r.nombre === 'Furia');
  assert.equal(furia.grupo, 'adicional'); assert.equal(furia.recurso.id, 'furia'); assert.deepEqual(furia.numeros, [{ nombre: 'Daño por furia', valor: '+2' }]);
  assert.equal(rs.find(r => r.nombre === 'Sentir el peligro').grupo, 'reaccion');           // movido a mano
  assert.equal(rs.find(r => r.nombre === 'Ataque temerario').texto, '');                   // sin libro importado: solo el nombre
  const g = agrupar(rs, ['clase:furia']);
  assert.equal(g[0].clave, 'fijados'); assert.deepEqual(g[0].rasgos.map(r => r.nombre), ['Furia']);
  assert.deepEqual(numerosMarciales(ch).map(n => n.nombre), ['Daño por furia', 'Maestría con armas', 'Competencia', 'Dado de golpe']);
});
