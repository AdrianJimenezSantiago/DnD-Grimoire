// Auditoría de reglas de 2024: clases, subclases, dotes, trasfondos de otros libros, armas, pasivos y conjuros
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/modelo.js';
import { perfil } from '../web/src/domain/reglas2024.js';
import { reglas } from '../web/src/domain/rasgos.js';
import { bonoSalvacion, salvacionesCompetentes, bonoHabilidad, velocidad } from '../web/src/domain/habilidades.js';
import { pgMaximo, ponerEfecto, rondasDeDuracion } from '../web/src/domain/vida.js';
import { caEfectiva, modsTirada, resolverModo, efectoDeConjuro } from '../web/src/domain/efectos.js';
import { PREDEFINIDOS, anadirComun, alternarEquipado, ataqueArma, armasCombate } from '../web/src/domain/equipo.js';
import { armadurasDe, competenteConArma } from '../web/src/domain/competencias.js';
import { faltaRequisito, aumentoDeDote, entrenamientoDe, extraTrasfondo, sinCortes } from '../web/src/domain/origen.js';
import { estiloDe, estadoEstilo } from '../web/src/domain/estilos.js';
import { caracteristicasTrasfondo, fuentesExtra } from '../web/src/domain/creacion.js';
import { habilidadesTrasfondo, periciasDisponibles } from '../web/src/domain/habilidades.js';
import { setLibros } from '../web/src/domain/catalogo.js';
import { analizarTiradas, dadosPara } from '../web/src/domain/tiradas.js';
import { separarRasgos } from '../web/src/domain/contenido.js';

const st = (v = 14, o = {}) => ({ fue: v, des: v, con: v, int: v, sab: v, car: v, ...o });
const pj = o => normChar(blankChar({ stats: st(), ...o }));
const nombres = ch => reglas(ch).map(r => `${r.nombre}:${r.max}`);
const arma = (ch, n, equipar = false) => { const o = anadirComun(ch, structuredClone(PREDEFINIDOS.find(x => x.nombre === n))); if (equipar) alternarEquipado(ch, o.id); return o; };

test('subclases: usos que faltaban, con su recarga', () => {
  const r = o => Object.fromEntries(reglas(pj(o)).map(x => [x.nombre, `${x.max}/${x.recarga}`]));
  assert.equal(r({ clase: 'Druida', subclase: 'Círculo de la luna', nivel: 10, stats: st(14, { sab: 18 }) })['Paso de la luz lunar'], '4/largo');
  const fe = r({ clase: 'Brujo', subclase: 'Patrón feérico', nivel: 10 });
  assert.equal(fe['Defensas seductoras'], '1/largo'); assert.ok(!('Escape brumoso' in fe));
  assert.ok(!('Defensas seductoras' in r({ clase: 'Brujo', subclase: 'Patrón feérico', nivel: 9 })));
  assert.equal(r({ clase: 'Guerrero', subclase: 'Maestro del combate', nivel: 7 })['Conoce a tu enemigo'], '1/largo');
  assert.equal(r({ clase: 'Paladín', subclase: 'Juramento de gloria', nivel: 15, stats: st(14, { car: 18 }) })['Defensa gloriosa'], '4/largo');
  assert.equal(r({ clase: 'Paladín', subclase: 'Juramento de los antiguos', nivel: 15 })['Centinela imperecedero'], '1/largo');
  assert.equal(r({ clase: 'Bardo', subclase: 'Colegio del glamour', nivel: 14 })['Majestad inquebrantable'], '1/corto');
  assert.equal(r({ clase: 'Bardo', subclase: 'Colegio del glamour', nivel: 6 })['Manto de majestad'], '1/largo');
  assert.equal(r({ clase: 'Monje', subclase: 'Guerrero de la misericordia', nivel: 11, stats: st(14, { sab: 16 }) })['Ráfaga de curación y aflicción'], '3/largo');
  assert.equal(r({ clase: 'Pícaro', subclase: 'Rebanaalmas', nivel: 13 })['Velo psíquico'], '1/largo');
  assert.equal(r({ clase: 'Pícaro', subclase: 'Embaucador arcano', nivel: 17 })['Ladrón de conjuros'], '1/largo');
  assert.equal(r({ clase: 'Hechicero', subclase: 'Hechicería dracónica', nivel: 18 })['Compañero dragón'], '1/largo');
  assert.equal(r({ clase: 'Hechicero', subclase: 'Hechicería mecánica', nivel: 18 })['Cabalgata mecánica'], '1/largo');
  assert.equal(r({ clase: 'Mago', subclase: 'Adivino', nivel: 10 })['El tercer ojo'], '1/corto');
  assert.equal(r({ clase: 'Mago', nivel: 20 })['Conjuros característicos'], '2/corto');
  assert.equal(r({ clase: 'Druida', nivel: 20 })['Archidruida (mago de la naturaleza)'], '1/largo');
  assert.equal(r({ clase: 'Mago', especie: 'Dracónido', nivel: 5 })['Vuelo dracónico'], '1/largo');
});

test('Orden divina y Orden primigenia: trucos, armaduras, armas y pruebas', () => {
  const tau = pj({ clase: 'Clérigo', nivel: 1, ordenes: { 'Clérigo': 'Taumaturgo' }, stats: st(10, { sab: 16 }) });
  const pro = pj({ clase: 'Clérigo', nivel: 1, ordenes: { 'Clérigo': 'Protector' } });
  assert.equal(perfil(tau).maxCant, perfil(pro).maxCant + 1);
  assert.ok(armadurasDe(pro).has('pesada')); assert.ok(!armadurasDe(tau).has('pesada'));
  assert.equal(bonoHabilidad(tau, 'religion'), 0 + 3); assert.equal(bonoHabilidad(tau, 'historia'), 0);
  assert.equal(entrenamientoDe(pro).armas, 'Armas sencillas y marciales');
  const guardian = pj({ clase: 'Druida', nivel: 1, ordenes: { 'Druida': 'Guardián' } });
  assert.ok(armadurasDe(guardian).has('media'));
  assert.equal(competenteConArma(guardian, PREDEFINIDOS.find(x => x.nombre === 'Espada larga')), true);
  assert.deepEqual(normChar({ ordenes: { 'Clérigo': 'protector', 'Mago': 'Nada' } }).ordenes, { 'Clérigo': 'Protector' });
});

test('armas: competencia por clase, Artes marciales, golpe sin armas y Furia', () => {
  const mago = pj({ clase: 'Mago', nivel: 5 }), esp = arma(mago, 'Espadón');
  assert.equal(ataqueArma(mago, esp).ataque, '+2'); assert.equal(ataqueArma(mago, esp).competente, false);
  assert.equal(ataqueArma(mago, arma(mago, 'Daga')).ataque, '+5');
  const bardo = pj({ clase: 'Bardo', nivel: 1 });
  assert.equal(ataqueArma(bardo, arma(bardo, 'Estoque')).competente, false);
  const picaro = pj({ clase: 'Pícaro', nivel: 1 });
  assert.equal(ataqueArma(picaro, arma(picaro, 'Estoque')).competente, true);
  assert.equal(ataqueArma(picaro, arma(picaro, 'Espadón')).competente, false);
  const monje = pj({ clase: 'Monje', nivel: 5, stats: st(10, { des: 18 }) });
  assert.equal(ataqueArma(monje, arma(monje, 'Daga')).expr, '1d8+4');
  const golpe = armasCombate(monje).find(o => o.sinArmas);
  assert.equal(ataqueArma(monje, golpe).expr, '1d8+4');
  const guerrero = pj({ clase: 'Guerrero', nivel: 1, stats: st(10, { fue: 16 }) });
  assert.equal(ataqueArma(guerrero, armasCombate(guerrero).find(o => o.sinArmas)).expr, '4');
  const barb = pj({ clase: 'Bárbaro', nivel: 9, stats: st(10, { fue: 18 }) }), hacha = arma(barb, 'Hacha a dos manos');
  assert.equal(ataqueArma(barb, hacha).expr, '1d12+4');
  ponerEfecto(barb, 'furia');
  assert.equal(ataqueArma(barb, hacha).expr, '1d12+7');
  assert.equal(resolverModo(modsTirada(barb, { sobre: 'salvacion', ab: 'fue' })), 'ventaja');
});

test('salvaciones: Aura de protección, Mente escurridiza, Superviviente disciplinado y Resiliente', () => {
  const pal = pj({ clase: 'Paladín', nivel: 6, stats: st(10, { car: 16 }) });
  assert.equal(bonoSalvacion(pal, 'fue'), 3);
  pal.vida.estados = ['aturdido']; assert.equal(bonoSalvacion(pal, 'fue'), 0);
  assert.ok(salvacionesCompetentes(pj({ clase: 'Pícaro', nivel: 15 })).has('car'));
  assert.equal(salvacionesCompetentes(pj({ clase: 'Monje', nivel: 14 })).size, 6);
  assert.ok(salvacionesCompetentes(pj({ clase: 'Mago', nivel: 4, dotes: ['Resiliente (Constitución)'] })).has('con'));
});

test('PG, CA y velocidad: dracónico, dones, armaduras medias, Armadura de mago, Veloz y monje con escudo', () => {
  const base = pj({ clase: 'Hechicero', nivel: 6 }), drac = pj({ clase: 'Hechicero', subclase: 'Hechicería dracónica', nivel: 6, stats: st(14, { des: 14, car: 18 }) });
  assert.equal(pgMaximo(drac) - pgMaximo(base), 6);
  assert.equal(caEfectiva(drac).ca, 16);
  assert.equal(pgMaximo(pj({ clase: 'Guerrero', nivel: 19, dotes: ['Don de la fortaleza'] })) - pgMaximo(pj({ clase: 'Guerrero', nivel: 19 })), 40);
  const med = pj({ clase: 'Guerrero', nivel: 4, stats: st(14, { des: 16 }), dotes: ['Maestro en armaduras medias'] }); arma(med, 'Media armadura', true);
  assert.equal(caEfectiva(med).ca, 18);
  const mago = pj({ clase: 'Mago', nivel: 1, stats: st(10, { des: 16 }) }); ponerEfecto(mago, 'armaduramago');
  assert.equal(caEfectiva(mago).ca, 16);
  assert.equal(efectoDeConjuro('Armadura de mago').k, 'armaduramago');
  assert.equal(velocidad(pj({ clase: 'Mago', nivel: 4, dotes: ['Veloz'] })), 12);
  assert.equal(velocidad(pj({ clase: 'Mago', especie: 'Elfo (silvano)' })), 10.5);
  const monje = pj({ clase: 'Monje', nivel: 2 }); assert.equal(velocidad(monje), 12); arma(monje, 'Escudo', true); assert.equal(velocidad(monje), 9);
});

test('pasivos: Sentir el peligro, Instinto salvaje, Astucia gnoma y armadura sin entrenamiento', () => {
  const b = pj({ clase: 'Bárbaro', nivel: 7 });
  assert.equal(resolverModo(modsTirada(b, { sobre: 'salvacion', ab: 'des' })), 'ventaja');
  assert.equal(resolverModo(modsTirada(b, { sobre: 'iniciativa' })), 'ventaja');
  b.vida.estados = ['incapacitado']; assert.ok(!modsTirada(b, { sobre: 'salvacion', ab: 'des' }).some(m => m.fuente === 'Sentir el peligro'));
  assert.equal(resolverModo(modsTirada(pj({ clase: 'Mago', especie: 'Gnomo' }), { sobre: 'salvacion', ab: 'int' })), 'ventaja');
  const mago = pj({ clase: 'Mago', nivel: 1 }); arma(mago, 'Cota de mallas', true);
  assert.equal(resolverModo(modsTirada(mago, { sobre: 'ataque' })), 'desventaja');
  const lc = pj({ clase: 'Mago', nivel: 4, dotes: ['Lanzador en combate'] });
  assert.equal(resolverModo(modsTirada(lc, { sobre: 'salvacion', ab: 'con', motivo: 'concentracion' })), 'ventaja');
  assert.equal(resolverModo(modsTirada(lc, { sobre: 'salvacion', ab: 'con' })), 'normal');
  assert.equal(resolverModo(modsTirada(pj({ clase: 'Mago', nivel: 4, dotes: ['Resistente'] }), { sobre: 'salvacion', motivo: 'muerte' })), 'ventaja');
});

test('dotes: requisitos del libro (entrenamiento, otra dote, alternativas y restos de OCR)', () => {
  const mago = pj({ clase: 'Mago', nivel: 4 }), guerrero = pj({ clase: 'Guerrero', nivel: 4 }), brujo = pj({ clase: 'Brujo', nivel: 4 });
  assert.match(faltaRequisito('nivel 4 o más, entrenamiento con armaduras medias', mago), /armaduras medias/);
  assert.equal(faltaRequisito('nivel 4 o más, entrenamiento con armaduras medias', guerrero), '');
  assert.match(faltaRequisito('nivel 4 o más, dote Agente de los Arpistas', guerrero), /dote/);
  assert.equal(faltaRequisito('nivel 4 o mús, dote Principiante del Endave Esmeralda', pj({ clase: 'Mago', nivel: 4, dotes: ['Principiante del Enclave Esmeralda'] })), '');
  assert.equal(faltaRequisito('nivel 4 o más, dote Aprendiz del Dragón Púrpura o competencia con armas marciales', guerrero), '');
  assert.notEqual(faltaRequisito('nivel 4 o más, dote Aprendiz del Dragón Púrpura o competencia con armas marciales', mago), '');
  assert.equal(faltaRequisito('nivel 4 o más, dote Chispa de/fuego mágico o rasgo Magia del pacto', brujo), '');
  assert.match(faltaRequisito('nivel 4 o más, Fuerza o Destreza 13 omás', pj({ clase: 'Mago', nivel: 4, stats: st(10) })), /Fuerza o Destreza 13/);
  assert.match(faltaRequisito('nivel 4 o más, rasgo Lanzamiento de conjuros o Magia del pacto', guerrero), /Lanzamiento/);
  assert.deepEqual(aumentoDeDote('Obtienes los siguientes beneficios: Mejora de característica. Elige una característica en la que no tengas competencia en tiradas de salvación. Aumenta la puntuación de característica en 1, hasta un máximo de 20.').length, 6);
  assert.deepEqual(aumentoDeDote('Aumenta tu puntuación de Destreza o Carisma en t. hasta uu máximo de 20.'), ['des', 'car']);
});

test('dotes: usos automáticos y estilos con el nombre del Manual', () => {
  const ch = pj({ clase: 'Mago', nivel: 20, dotes: ['Don de la recuperación', 'Influencia feérica', 'Azote de magos'] });
  assert.deepEqual(nombres(ch).filter(x => /Última|vitalidad|feérica|Mente robusta/.test(x)), ['Última defensa:1', 'Recuperar vitalidad:10', 'Influencia feérica:2', 'Mente robusta:1']);
  assert.equal(estiloDe('Tiro con arco').ef, 'arqueria');
  assert.equal(estiloDe('Combate con armas a dos manos').ef, 'grandes');
  const cam = pj({ clase: 'Guerrero', subclase: 'Campeón', nivel: 7, dotes: ['Defensa'] });
  assert.equal(estadoEstilo(cam).faltan, 1);
  assert.equal(estadoEstilo({ ...cam, dotes: ['Defensa', 'Tiro con arco'] }).faltan, 0);
});

test('trasfondos de otros libros: características, habilidades, herramienta y equipo con restos de OCR', () => {
  setLibros([{ id: 'hf', titulo: 'Héroes de Faerûn', trasfondos: [{ clave: 'errante rashemi', nombre: 'Errante rashemí', caracteristicas: 'Fu erza, Constitución, Carisma', dote: 'Duro',
    habilidades: 'Intim idación y Percepción', herramientas: 'herram ientas de ca rtógrafo',
    equipo: 'elige A o B: (A) herram ientas de cartógrafo, aceite (3 frascos), moch ila, petate, ropas de viaje, yesquero y 23 po, o (B) 50 po' }] }]);
  assert.deepEqual(caracteristicasTrasfondo('Errante rashemí', [{ nombre: 'Errante rashemí', caracteristicas: 'Fu erza, Constitución, 1nteligencia' }]), ['fue', 'con', 'int']);
  assert.deepEqual(habilidadesTrasfondo({ trasfondo: 'Errante rashemí' }), ['intimidacion', 'percepcion']);
  const x = extraTrasfondo('Errante rashemí');
  assert.equal(x.herramienta, 'Herramientas de cartógrafo');
  assert.deepEqual(x.opciones[0], { k: 'A', objetos: ['Herramientas de cartógrafo', ['Aceite (frasco)', 3], 'Mochila', 'Saco de dormir', 'Ropa de viaje', 'Yesquero'], po: 23 });
  assert.equal(sinCortes('útiles para d isfrazarse, bo lsa'), 'útiles para disfrazarse, bolsa');
  setLibros([]);
});

test('habilidades y pericias que dan dotes y subclases', () => {
  assert.ok(fuentesExtra(pj({ clase: 'Bardo', subclase: 'Colegio del conocimiento', nivel: 3 })).some(f => f.n === 3));
  assert.equal(periciasDisponibles(pj({ clase: 'Guerrero', nivel: 4, dotes: ['Experto en habilidades'] })), 1);
});

test('conjuros: daño a elegir, rayos y dardos, escalado en plural, modificador y restos de OCR', () => {
  const orbe = analizarTiradas('Haz un ataque de conjuro a distancia contra el objetivo. Si acierta, el objetivo recibe 3d8 de daño del tipo elegido.', 'El daño aumenta en 1d8 por cada nivel por encima de 1 que tenga el espacio.');
  assert.equal(orbe.danos[0].tipo, 'a elegir'); assert.equal(dadosPara(orbe, { nivelEspacio: 3, nivelConjuro: 1 })[0].n, 5);
  const desc = analizarTiradas('Haz un ataque de conjuro a distancia contra una criatura. Si acierta, el objetivo recibe 1d10 de daño de fuerza.', 'El conjuro crea dos rayos a nivel 5, tres rayos a nivel 11 y cuatro rayos a nivel 17.');
  assert.equal(dadosPara(desc, { nivelPj: 11 })[0].veces, 3);
  const pm = analizarTiradas('Creas tres dardos brillantes de fuerza mágica. Cada dardo inflige 1d4 +1 de daño de fuerza al objetivo.', 'El conjuro crea un dardo adicional por cada nivel por encima de 1 que tenga el espacio.');
  assert.equal(dadosPara(pm, { nivelEspacio: 3, nivelConjuro: 1 })[0].veces, 5);
  const gf = analizarTiradas('Hacen una tirada de salvación de Destreza; sufrirán 5d6 de daño de fuego y 5d6 de daño radiante si la fallan o la mitad de daño si la superan.', 'El daño de fuego y radiante aumentan en 1d6 por cada nivel por encima de 5 que tenga el espacio.');
  assert.equal(gf.escala.tipo, 'espacio');
  const ae = analizarTiradas('Haz un ataque de conjuro cuerpo a cuerpo. Si acierta, el objetivo recibe una cantidad de daño de fuerza igual a 148 más tu modificador por aptitud mágica.', '');
  assert.deepEqual([ae.danos[0].n, ae.danos[0].caras, ae.danos[0].mod], [1, 8, true]);
  assert.equal(analizarTiradas('Si la fallan, sufrirán 3d10 de daiio de fuerza.', '').danos[0].n, 3);
  assert.equal(analizarTiradas('Hace una tirada de salvación de Constitución. Si la falla, sufre 14d6 de daño necrótico y sus puntos de golpe máximos se reducen en una cantidad igual al daño.', '').curacion, null);
  assert.equal(analizarTiradas('Si la fallan, recibirán 12d6 daño radiante.', '').danos[0].tipo, 'radiante');
  assert.equal(rondasDeDuracion('Concentración , hasta l minuto'), 10);
});

test('lector de libros: encabezados de rasgo con mayúsculas mezcladas por el OCR', () => {
  const l = s => ({ s, x: 60, y: 0, h: 16, p: 1 });
  const out = separarRasgos([l('NiveEL 1: Druípico'), l('Sabes druídico.'), l('NiveL 1: EsTILO DE COMBATE'), l('NIVEL 3: CONJUROS DEL "F UEGO MÁGICO')]).map(x => x.s);
  assert.deepEqual(out.filter(s => /^NIVEL/.test(s)), ['NIVEL 1: DRUÍPICO', 'NIVEL 1: ESTILO DE COMBATE', 'NIVEL 3: CONJUROS DEL F UEGO MÁGICO']);
});

test('conjuros gratis por rasgo: Marca del cazador gasta Enemigo predilecto antes que un espacio', async () => {
  const { recursoParaConjuro, recState } = await import('../web/src/domain/rasgos.js');
  const ex = pj({ clase: 'Explorador', nivel: 1 });
  assert.equal(recursoParaConjuro(ex, 'Marca del cazador').nombre, 'Enemigo predilecto');
  recState(ex, 'tpl:explorador.enemigo').used = 2;
  assert.equal(recursoParaConjuro(ex, 'Marca del cazador'), null);
  assert.equal(recursoParaConjuro(pj({ clase: 'Paladín', nivel: 2 }), 'Castigo divino').nombre, 'Castigo de paladín');
  assert.equal(recursoParaConjuro(pj({ clase: 'Mago', nivel: 5 }), 'Bola de fuego'), null);
});
