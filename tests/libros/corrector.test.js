import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { crearVocabulario, corregirLinea, corregirLineas, plausible } from '../../web/src/domain/libros/corrector.js';

// Vocabulario de juguete: cada palabra repetida tantas veces como «aparece en el libro»
const rep = (txt, n) => Array(n).fill(txt).join(' ');
const voc = crearVocabulario([
  rep('el de la que y a en un una los las del se por con no su al lo como más', 60),
  rep('conjuro tirada salvación daño fuego objetivo criatura nivel puntos golpe inteligencia siguientes beneficios inmunidad', 40),
  rep('alas hora hagas desaparecer permanecen tormenta envenenado moderada recompensa menos terreno herramientas durante fusiona caballero mochila cercano', 20),
  rep('competente entrenado redondeado fallará describir proporciona crear detiene reparar cuerda práctica', 20),
  rep('NIVEL FURIA DEFENSA ARMADURA ESCUDO PERSONAJE', 20)
]);
const c = s => corregirLinea(s, voc);

describe('corregirLinea', () => {
  test('dados, también comprobando la media de los perfiles', () => {
    assert.equal(c('recibe ld6 de daño de fuego'), 'recibe 1d6 de daño de fuego');
    assert.equal(c('sufrirá 4dl0 de daño'), 'sufrirá 4d10 de daño');
    assert.equal(c('5-10 11 (2410) 14'), '5-10 11 (2d10) 14');
    assert.equal(c('17-20 55 (10410) 18'), '17-20 55 (10d10) 18');
    assert.equal(c('igual a 148 más tu modificador'), 'igual a 1d8 más tu modificador');
    assert.equal(c('Tira 1420 y consulta la tabla'), 'Tira 1d20 y consulta la tabla');
    // Una media que no cuadra no se toca: puede ser un número de verdad
    assert.equal(c('cuesta 12 (2410) piezas'), 'cuesta 12 (2410) piezas');
  });

  test('cabeceras de rasgos y versalitas', () => {
    assert.equal(c('NIvEL l: FURIA'), 'NIVEL 1: FURIA');
    assert.equal(c('NrIveEL 10: DEFENSA'), 'NIVEL 10: DEFENSA');
    assert.equal(c('NIVEL lL REPRESALIA'), 'NIVEL 11: REPRESALIA');
    assert.equal(c('NIVEL 15, ESPECTRO'), 'NIVEL 15: ESPECTRO');
    assert.equal(c('Como PERSONAJE MULTICLASE'), 'COMO PERSONAJE MULTICLASE');
    // «Nivel» en una tabla normal se queda como está
    assert.equal(c('Nivel de clérigo Conjuros preparados'), 'Nivel de clérigo Conjuros preparados');
  });

  test('cifras confundidas con letras', () => {
    assert.equal(c('reduce tus puntos de golpe a O, la espada'), 'reduce tus puntos de golpe a 0, la espada');
    assert.equal(c('VD: ninguno (O PX; BC +2)'), 'VD: ninguno (0 PX; BC +2)');
    assert.equal(c('Si estás a l,S m o menos'), 'Si estás a 1,5 m o menos');
    assert.equal(c('estará activa durante l O días'), 'estará activa durante 10 días');
    assert.equal(c('suma l nivel de cansancio'), 'suma 1 nivel de cansancio');
    assert.equal(c('caben hasta 2 1 de líquido'), 'caben hasta 2 l de líquido');
    assert.equal(c('Evocación de nivel1 (paladín)'), 'Evocación de nivel 1 (paladín)');
    assert.equal(c('se tardan 1d10 x 10 horas'), 'se tardan 1d10 × 10 horas');
  });

  test('palabras rotas, pegadas y partidas', () => {
    assert.equal(c('tiene inmunidad al daño'), 'tiene inmunidad al daño');
    assert.equal(c('Tienes iumunidad al fuego'), 'Tienes inmunidad al fuego');
    assert.equal(c('los siguieutes beneficios'), 'los siguientes beneficios');
    assert.equal(c('la agitación de una tormentay la calma'), 'la agitación de una tormenta y la calma');
    assert.equal(c('Eres inmune al estado de envenenadoy tienes'), 'Eres inmune al estado de envenenado y tienes');
    assert.equal(c('en al menos lo.s puntos'), 'en al menos los puntos');
    assert.equal(c('las herram ientas de ladrón'), 'las herramientas de ladrón');
    assert.equal(c('cuesta uu conjuro de eu una tirada'), 'cuesta un conjuro de en una tirada');
    assert.equal(c('el conjuro <le fuego'), 'el conjuro de fuego');
    assert.equal(c('ÜABALLERO del dragón'), 'CABALLERO del dragón');
  });

  test('no toca palabras raras pero correctas', () => {
    for (const s of ['son competentes con ella', 'está entrenada para ello', 'la mitad (redondeada hacia abajo)', 'fallarás la tirada',
      'describirá lo que ve', 'les proporcionó cobijo', 'puedes crearlos', 'detienes el tiempo', 'repara el objeto', 'una práctica habitual'])
      assert.equal(c(s), s, s);
    assert.equal(plausible('competentes', voc), true);
    assert.equal(plausible('crearlos', voc), true);
    assert.equal(plausible('iumunidad', voc), false);
    // Nombres propios de D&D con signos raros
    assert.equal(c('todo Faerün y Faerfin'), 'todo Faerûn y Faerûn');
  });

  test('viñetas, restos de marcos y ruido de las ilustraciones', () => {
    assert.equal(c('+ Obtienes los rasgos de nivel 1'), '• Obtienes los rasgos de nivel 1');
    assert.equal(c('| CA: 13 Iniciativa: +3 (13)'), 'CA: 13 Iniciativa: +3 (13)');
    assert.equal(c('acción , lanzas'), 'acción, lanzas');
    assert.deepEqual(corregirLineas(['AAA AAA AAA.', 'E', 'cercano.', 'CHEF'], voc), ['', '', 'cercano.', 'CHEF']);
    // «O» al principio de línea en mitad de una frase es la conjunción
    assert.deepEqual(corregirLineas(['las alas permanecen 1 hora', 'O hasta que las hagas desaparecer'], voc), ['las alas permanecen 1 hora', 'o hasta que las hagas desaparecer']);
  });

  test('líneas de perfil, abreviaturas y detalles de formato', () => {
    assert.equal(c('FuE 15 +2 +2 Des 14 +2 +2 CoN12'), 'Fue 15 +2 +2 Des 14 +2 +2 Con 12');
    assert.equal(c('Fue 14 +2 +2 Des16 +3 +3 Conl2 +1 +l'), 'Fue 14 +2 +2 Des 16 +3 +3 Con 12 +1 +1');
    assert.equal(c('InTr 2-4 -4 Sap 10+0 +0 Car'), 'Int 2 -4 -4 Sab 10 +0 +0 Car');
    assert.equal(c('Le da a Con 13 puntos'), 'Le da a Con 13 puntos');
    assert.equal(c('con cD 15 y 2 Pp)'), 'con CD 15 y 2 PP)');
    assert.equal(c('MOD SALV MOD SALV'), 'MOD. SALV. MOD. SALV.');
    assert.equal(c('a -18 *C o menos'), 'a -18 °C o menos');
    assert.equal(c('“TIRADAS DE ATAQUE'), 'TIRADAS DE ATAQUE');
    assert.equal(c('Obtienes los siguientes beneficios;'), 'Obtienes los siguientes beneficios:');
    assert.equal(c('en campañas de Dé:D. En esta'), 'en campañas de D&D. En esta');
  });
});
