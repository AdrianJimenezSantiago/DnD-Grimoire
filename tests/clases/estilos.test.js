import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { arma } from '../helpers/fixtures.js';
import { blankChar, normChar } from '../../web/src/domain/personaje/modelo.js';
import { estadoEstilo, estiloDe, opcionesEstilo, trucosAlternativa } from '../../web/src/domain/clases/estilos.js';
import { anadirComun, claseArmadura, ataqueArma } from '../../web/src/domain/equipo/equipo.js';
import { opcionesIntercambio } from '../../web/src/domain/clases/intercambios.js';

const pj = o => normChar(blankChar({ clase: 'Guerrero', nivel: 1, stats: { fue: 16, des: 14, con: 14, int: 8, sab: 10, car: 10 }, ...o }));

describe('estilos de combate', () => {
  test('estilo de combate: cuándo toca elegirlo', () => {
    assert.equal(estadoEstilo(pj()).faltan, 1);
    assert.equal(estadoEstilo(pj({ dotes: ['Defensa'] })).faltan, 0);
    assert.equal(estadoEstilo(pj({ clase: 'Paladín' })).puede, false);
    assert.equal(estadoEstilo(pj({ clase: 'Paladín', nivel: 2, dotes: ['Guerrero bendito'] })).faltan, 0);
    assert.equal(trucosAlternativa(pj({ clase: 'Explorador', dotes: ['Guerrero druídico'] }))[0].lista, 'Druida');
    assert.ok(opcionesEstilo(pj({ dotes: ['Duelo'] }), [], 'Paladín').find(e => e.nombre === 'Duelo').ya);
    assert.ok(opcionesEstilo(pj(), [], 'Paladín').some(e => e.alternativa));
    assert.equal(estiloDe('Alerta'), null);
    assert.equal(estiloDe('Combate con armas grandes').ef, 'grandes');
  });

  test('Defensa suma 1 a la CA con armadura', () => {
    const ch = pj({ dotes: ['Defensa'] }); const a = anadirComun(ch, arma('Cota de mallas')); a.equipado = true;
    assert.equal(claseArmadura(ch).ca, 17);
    assert.equal(claseArmadura(pj({ dotes: ['Defensa'] })).ca, 12);
  });

  test('Arquería y Duelo en los ataques', () => {
    const ar = pj({ dotes: ['Arquería'] }), arco = anadirComun(ar, arma('Arco largo'));
    assert.equal(ataqueArma(ar, arco).ataque, '+6');
    const du = pj({ dotes: ['Duelo'] });
    assert.equal(ataqueArma(du, anadirComun(du, arma('Espada larga'))).expr, '1d8+5');
    assert.equal(ataqueArma(du, anadirComun(du, arma('Espadón'))).expr, '2d6+3');
  });

  test('el cambio de estilo ya no sale como aviso suelto al subir de nivel', () => {
    assert.ok(!opcionesIntercambio(pj({ dotes: ['Defensa'] }), 'nivel').some(o => /estilo/i.test(o.titulo)));
  });
});
