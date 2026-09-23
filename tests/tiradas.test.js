import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizarTiradas, dadosPara, tiradasDe, tieneTiradas } from '../web/src/domain/tiradas.js';
import { formasDeEstado } from '../web/src/domain/glosario.js';

// Textos inventados con la misma forma que las descripciones.
test('truco con ataque que escala con el nivel del personaje', () => {
  const r = analizarTiradas('Haz un ataque de conjuro a distancia. Si impacta, sufre 1d10 de daño de fuego.', 'El daño aumenta en 1d10 cuando alcanzas los niveles 5 (2d10), 11 y 17.');
  assert.equal(r.ataque, 'a distancia'); assert.deepEqual(r.danos.map(d => `${d.n}d${d.caras} ${d.tipo}`), ['1d10 fuego']);
  assert.deepEqual([1, 5, 11, 17].map(n => dadosPara(r, { nivelPj: n })[0].n), [1, 2, 3, 4]);
});
test('conjuro con salvación que escala con el espacio', () => {
  const r = analizarTiradas('Cada criatura hace una tirada de salvación de Destreza y sufre 8d6 de daño de fuego si falla.', 'El daño aumenta en 1d6 por cada nivel por encima de 3.');
  assert.equal(r.salvacion, 'Destreza');
  assert.equal(dadosPara(r, { nivelEspacio: 5, nivelConjuro: 3 })[0].n, 10);
});
test('curación con modificador y texto en inglés de respaldo', () => {
  const cu = analizarTiradas('La criatura recupera una cantidad de puntos de golpe igual a 2d8 + tu modificador por aptitud mágica.', '');
  assert.equal(cu.curacion.n, 2); assert.equal(cu.curacion.mod, true);
  const r = tiradasDe([['Texto sin dados.', ''], ['Each dart deals 1d4 + 1 Force damage.', '']]);
  assert.deepEqual(r.danos.map(d => `${d.n}d${d.caras}+${d.bono} ${d.tipo}`), ['1d4+1 fuerza']);
  assert.equal(tieneTiradas(analizarTiradas('Sin nada que tirar.')), false);
});
test('formas de los estados para enlazarlos', () => {
  assert.deepEqual(formasDeEstado('Apresado'), ['apresado', 'apresada', 'apresados', 'apresadas']);
  assert.deepEqual(formasDeEstado('Invisible'), ['invisible', 'invisibles']);
});

test('salvación: mitad al superar, daño automático al empezar el turno y alternativa condicional', () => {
  const bola = analizarTiradas('Cada criatura hace una tirada de salvación de Destreza. Si la falla, sufre 8d6 de daño de fuego; si la supera, sufre la mitad del daño.', '');
  assert.equal(bola.mitad, true); assert.equal(bola.danos[0].via, 'salvacion'); assert.match(bola.falla, /Si la falla/); assert.match(bola.supera, /si la supera/);
  const red = analizarTiradas('Cada criatura hace una tirada de salvación de Destreza o queda apresada. La red arde: una criatura que comience su turno en el fuego sufre 2d4 de daño de fuego.', '');
  assert.equal(red.danos[0].via, 'auto'); assert.equal(red.mitad, false);
  const campana = analizarTiradas('El objetivo debe superar una tirada de salvación de Sabiduría o sufrirá 1d8 de daño necrótico. Si el objetivo no tiene todos sus puntos de golpe, el daño necrótico aumenta a 1d12.', 'El daño aumenta en un dado cuando alcanzas los niveles 5, 11 y 17.');
  assert.deepEqual(campana.danos.map(d => `${d.n}d${d.caras}`), ['1d8', '1d12']);
  assert.match(campana.danos[1].cond, /no tiene todos sus puntos de golpe/);
  assert.deepEqual(dadosPara(campana, { nivelPj: 5 }).map(d => `${d.n}d${d.caras}`), ['2d8', '2d12']);
  assert.match(campana.falla, /debe superar/);
  const astilla = analizarTiradas('El objetivo debe superar una tirada de salvación de Inteligencia o sufrirá 1d6 de daño psíquico y restará 1d4 a la siguiente tirada de salvación que haga.', '');
  assert.deepEqual(astilla.extras.map(x => `${x.n}d${x.caras}`), ['1d4']);
  const flecha = analizarTiradas('Haz un ataque de conjuro a distancia. Si impacta, el objetivo sufre 1d10 de daño de fuego.', '');
  assert.equal(flecha.danos[0].via, 'ataque');
});
