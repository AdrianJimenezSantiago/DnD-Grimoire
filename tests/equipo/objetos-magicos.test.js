// Objetos mágicos de la Guía del DM de punta a punta: variantes, cargas, sintonía, efectos y consumibles.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../../web/src/domain/personaje/modelo.js';
import { anadirObjeto, quitarObjeto, alternarSintonia, alternarGuardado, motivoSintonia, equipar, claseArmadura, ataqueArma, armaCombate, golpeSinArmas, municionDe, anadirComun } from '../../web/src/domain/equipo/equipo.js';
import { pasosVariante, concretar } from '../../web/src/domain/equipo/variantesObjeto.js';
import { efectoDe, statsEfectivos, objetoActivo } from '../../web/src/domain/equipo/objetosEfecto.js';
import { usoDe, usarObjeto } from '../../web/src/domain/equipo/usarObjeto.js';
import { reglas, reglasVisibles, recuperarEnDescanso } from '../../web/src/domain/clases/rasgos.js';
import { pasivosDe, resistenciasDe } from '../../web/src/domain/combate/efectos.js';
import { bonoHabilidad, velocidad } from '../../web/src/domain/reglas/habilidades.js';
import { perfil } from '../../web/src/domain/reglas/reglas2024.js';
import { pgActuales, pgMaximo, vidaDe, aplicarDano } from '../../web/src/domain/combate/vida.js';

const ch = (o = {}) => normChar(blankChar({ clase: 'Mago', nivel: 5, stats: { fue: 10, des: 14, con: 12, int: 16, sab: 10, car: 10 }, ...o }));
const uno = () => 1;
// Objeto como llega de la biblioteca
const lib = (nombre, tipo, extra = {}) => ({ clave: nombre.toLowerCase(), nombre, tipo, rareza: 'Raro', subtipo: '', linea: '', texto: '', cargas: null, sintonia: false, ...extra });

describe('variantesObjeto', () => {
  test('arma de base y bonificador, con la rareza de cada uno', () => {
    const o = lib('Arma +1, +2 o +3', 'Arma', { subtipo: 'cualquiera sencilla o marcial', linea: 'Arma (cualquiera sencilla o marcial), infrecuente (+1), rara (+2) o muy rara (+3)' });
    assert.deepEqual(pasosVariante(o).map(p => p.id), ['base', 'mas']);
    const x = concretar(o, { base: 'Espada larga', mas: 2 });
    assert.equal(x.nombre, 'Espada larga +2'); assert.equal(x.rareza, 'Raro'); assert.equal(x.arma.dano, '1d8'); assert.equal(x.arma.bono, 2);
    const c = ch({ clase: 'Guerrero' }), e = anadirObjeto(c, x); equipar(c, e.id);
    assert.match(ataqueArma(c, e).dano, /^1d8 \+ 2 cortante/);
    // Con nombre propio: base entre paréntesis y bonificador del texto
    const v = concretar(lib('Espada vorpal', 'Arma', { subtipo: 'cimitarra, espada larga, espadón o guja', texto: 'Recibes un bonificador de +3 a las tiradas de ataque y de daño que hagas con esta arma mágica.' }), { base: 'Guja' });
    assert.equal(v.nombre, 'Espada vorpal (guja)'); assert.equal(v.arma.bono, 3); assert.equal(v.arma.dano, '1d10');
    // «Hacha de guerra» de la Guía es el hacha de batalla del Manual; «arco corto o largo» da los dos arcos
    assert.deepEqual(pasosVariante(lib('Hacha berserker', 'Arma', { subtipo: 'alabarda, hacha a dos manos o hacha de guerra' }))[0].opciones.map(x => x.nombre), ['Alabarda', 'Hacha a dos manos', 'Hacha de batalla']);
    assert.deepEqual(pasosVariante(lib('Arco juramentado', 'Arma', { subtipo: 'arco corto o largo' }))[0].opciones.map(x => x.nombre), ['Arco corto', 'Arco largo']);
  });

  test('armaduras, escudos y mithral', () => {
    const m = concretar(lib('Armadura de mithral', 'Armadura', { subtipo: 'cualquier armadura media o pesada, salvo armadura de pieles' }), { base: 'Armadura de placas' });
    assert.equal(m.armadura.base, 18); assert.equal(m.armadura.fue, 0); assert.equal(m.armadura.sigilo, false);
    assert.ok(!pasosVariante(lib('Armadura de mithral', 'Armadura', { subtipo: 'cualquier armadura media o pesada, salvo armadura de pieles' }))[0].opciones.some(x => /pieles/i.test(x.nombre)));
    const enana = concretar(lib('Armadura de placas enana', 'Armadura', { subtipo: 'media armadura o armadura de placas', texto: 'Mientras lleves esta armadura, obtendrás un bonificador de +2 a la clase de armadura.' }), { base: 'Armadura de placas' });
    const c = ch({ clase: 'Guerrero' }); equipar(c, anadirObjeto(c, enana).id);
    assert.equal(claseArmadura(c).ca, 20);
    const esc = concretar(lib('Escudo +1, +2 o +3', 'Armadura', { subtipo: 'escudo', linea: 'Armadura (escudo), infrecuente (+1), rara (+2) o muy rara (+3)' }), { mas: 3 });
    assert.equal(esc.nombre, 'Escudo +3'); equipar(c, anadirObjeto(c, esc).id);
    assert.equal(claseArmadura(c).ca, 25);
    // El bonificador condicional del escudo atrapaflechas no cuenta siempre
    assert.equal(concretar(lib('Escudo atrapaflechas', 'Armadura', { subtipo: 'escudo', texto: 'obtienes un bonificador de +2 a la clase de armadura contra las tiradas de ataque a distancia.' })).armadura.bono, 0);
  });

  test('tablas (curación, gigantes, piedras ioun) y la munición mágica', () => {
    const p = concretar(lib('Poción de curación', 'Poción'), { var: 'Poción de curación (superior)' });
    assert.equal(p.nombre, 'Poción de curación (superior)'); assert.equal(p.rareza, 'Raro');
    const cint = concretar(lib('Cinturón de fuerza de gigante', 'Objeto maravilloso', { sintonia: true }), { var: 'Nubes' });
    assert.equal(cint.nombre, 'Cinturón de fuerza de gigante (nubes)'); assert.equal(cint.rareza, 'Legendario');
    const ioun = lib('Piedra ioun', 'Objeto maravilloso', { sintonia: true, texto: 'Comunes.\n\nAgilidad (muy rara). Tu Destreza aumenta en 2.\n\nPerspicacia (muy rara). Tu Sabiduría aumenta en 2.\n\nProtección (rara). +1 a la CA.' });
    assert.deepEqual(pasosVariante(ioun)[0].opciones.map(x => x.nombre), ['Agilidad', 'Perspicacia', 'Protección']);
    assert.equal(concretar(ioun, { var: 'Perspicacia' }).nombre, 'Piedra ioun de perspicacia');
    assert.deepEqual(efectoDe('Piedra ioun de perspicacia').suma, { sab: 2 }, 'perspicacia es Sabiduría, no Inteligencia');
    // Munición +2: se apila como consumible y suma al arco
    const c = ch({ clase: 'Guerrero' }), fl = anadirObjeto(c, concretar(lib('Munición +1, +2 o +3', 'Arma', { subtipo: 'cualquier munición', linea: 'Arma (cualquier munición), infrecuente (+1), rara (+2) o muy rara (+3)' }), { base: 'Flechas', mas: 2 }));
    assert.equal(fl.nombre, 'Flechas +2'); assert.equal(fl.cat, 'consumible');
    const arco = anadirComun(c, { nombre: 'Arco largo', cat: 'arma', arma: { dano: '1d8', tipo: 'perforante', props: ['Munición', 'Pesada', 'Dos manos'], distancia: '45/180 m' } });
    equipar(c, arco.id);
    assert.equal(municionDe(c, arco), fl);
    assert.equal(ataqueArma(c, arco).ataque, '+7', 'Des +2, competencia +3 y flechas +2');
  });
});

describe('cargas', () => {
  test('tiradas al conseguirlo, ocultas sin sintonía y su recarga', () => {
    const c = ch(), filo = anadirObjeto(c, concretar(lib('Filo de la fortuna', 'Arma', { subtipo: 'espada larga', sintonia: true, cargas: { max: 0, dado: '1d3', recarga: '', cuando: '' } })), () => 3);
    const r = reglas(c).find(x => x.id === filo.rasgo);
    assert.equal(r.max, 3); assert.equal(r.recarga, 'nunca');
    assert.ok(r.oculto, 'sin sintonizar no se pueden gastar');
    alternarSintonia(c, filo.id);
    assert.ok(reglasVisibles(c).some(x => x.id === filo.rasgo));
    alternarGuardado(c, filo.id);
    assert.ok(!reglasVisibles(c).some(x => x.id === filo.rasgo), 'en el alijo tampoco');
    const v = anadirObjeto(c, lib('Varita de proyectiles mágicos', 'Varita', { cargas: { max: 7, recarga: '1d6+1', cuando: 'amanecer', ultima: 'Al gastar la última carga, tira 1d20: con un 1, el objeto se destruye.' } }));
    const rv = reglas(c).find(x => x.id === v.rasgo);
    assert.match(rv.nota, /1d20/);
    assert.equal(recuperarEnDescanso(rv, 7, 'largo', uno).usados, 5, '1d6 + 1 al amanecer');
    // Usos diarios de las propiedades
    const cetro = anadirObjeto(c, lib('Cetro de poder señorial', 'Vara', { usos: [{ nombre: 'Cetro de poder señorial: Paralizar', recarga: 'largo' }, { nombre: 'Cetro de poder señorial: Drenar vida', recarga: 'largo' }] }));
    assert.equal(cetro.usos.length, 2);
    quitarObjeto(c, cetro.id);
    assert.ok(!(c.rasgos || []).some(x => /Cetro/.test(x.nombre)), 'al quitarlo se van sus usos');
  });
});

describe('sintonía', () => {
  test('requisitos de clase, de lanzador y el límite de tres', () => {
    const mago = ch(), guerrero = ch({ clase: 'Guerrero' });
    const vara = o => anadirObjeto(o, lib('Bastón de curación', 'Bastón', { sintonia: true, sintoniaCon: 'parte de un bardo, clérigo o druida' }));
    assert.match(motivoSintonia(mago, vara(mago).id), /bardo, clérigo o druida/);
    const varita = o => anadirObjeto(o, lib('Varita de bolas de fuego', 'Varita', { sintonia: true, sintoniaCon: 'parte de un lanzador de conjuros' }));
    assert.equal(motivoSintonia(mago, varita(mago).id), '');
    const vg = varita(guerrero);
    assert.match(motivoSintonia(guerrero, vg.id), /lanzador/);
    assert.equal(alternarSintonia(guerrero, vg.id), false);
    for (const n of ['Capa de protección', 'Anillo de protección', 'Piedra de la buena fortuna']) alternarSintonia(mago, anadirObjeto(mago, lib(n, 'Objeto maravilloso', { sintonia: true })).id);
    assert.match(motivoSintonia(mago, varita(mago).id), /Ya hay 3/);
  });
});

describe('efectos', () => {
  test('Piedra de la buena fortuna, Cinturón enano, Guantes de ladrón, Botas de zancadas, ventajas y resistencias', () => {
    const c = ch(), s0 = bonoHabilidad(c, 'juegomanos');
    alternarSintonia(c, anadirObjeto(c, lib('Piedra de la buena fortuna', 'Objeto maravilloso', { sintonia: true })).id);
    assert.equal(bonoHabilidad(c, 'juegomanos'), s0 + 1);
    anadirObjeto(c, lib('Guantes de ladrón', 'Objeto maravilloso'));
    assert.equal(bonoHabilidad(c, 'juegomanos'), s0 + 6);
    alternarSintonia(c, anadirObjeto(c, lib('Cinturón enano', 'Objeto maravilloso', { sintonia: true })).id);
    assert.equal(statsEfectivos(c).con, 14);
    assert.ok(resistenciasDe(c).some(r => r.tipo === 'veneno' && r.fuente === 'Cinturón enano'));
    assert.ok(pasivosDe(c).some(p => p.nombre === 'Cinturón enano'));
    const g = ch({ especie: 'Enano' }); alternarSintonia(g, anadirObjeto(g, lib('Botas de zancadas y brincos', 'Objeto maravilloso', { sintonia: true })).id);
    assert.equal(velocidad(g), 9);
    // Lo que se deja en el alijo deja de funcionar
    const guantes = c.equipo.objetos.find(o => o.nombre === 'Guantes de ladrón'); alternarGuardado(c, guantes.id);
    assert.equal(objetoActivo(guantes), false);
    assert.equal(bonoHabilidad(c, 'juegomanos'), s0 + 1);
  });

  test('Vara del pacto +N, Vendas de poder sin armas, Martillo de rayos y Garrote grande atronador', () => {
    const b = ch({ clase: 'Brujo', stats: { fue: 10, des: 14, con: 12, int: 10, sab: 10, car: 16 } }), cd0 = perfil(b).cd;
    alternarSintonia(b, anadirObjeto(b, concretar(lib('Vara del pacto', 'Vara', { sintonia: true, sintoniaCon: 'parte de un brujo', linea: 'Vara, infrecuente (+1), rara (+2) o muy rara (+3)' }), { mas: 2 })).id);
    assert.equal(perfil(b).cd, cd0 + 2);
    const m = ch({ clase: 'Monje' }); anadirObjeto(m, concretar(lib('Vendas de poder sin armas', 'Objeto maravilloso', { linea: 'Objeto maravilloso, infrecuente (+1), raro (+2) o muy raro (+3)' }), { mas: 3 }));
    assert.equal(golpeSinArmas(m).arma.bono, 3);
    const g = ch({ clase: 'Guerrero' });
    alternarSintonia(g, anadirObjeto(g, lib('Guanteletes de fuerza de ogro', 'Objeto maravilloso', { sintonia: true })).id);
    alternarSintonia(g, anadirObjeto(g, concretar(lib('Martillo de rayos', 'Arma', { subtipo: 'martillo de guerra o maza a dos manos', sintonia: true }), { base: 'Martillo de guerra' })).id);
    assert.equal(statsEfectivos(g).fue, 23, 'los guanteletes dan 19 y el martillo suma 4');
    const a = ch({ clase: 'Guerrero' }); alternarSintonia(a, anadirObjeto(a, concretar(lib('Garrote grande atronador', 'Arma', { subtipo: 'garrote grande', sintonia: true }))).id);
    assert.equal(statsEfectivos(a).fue, 20);
  });

  test('bastones y cetros que se empuñan como arma', () => {
    const c = ch();
    const b = anadirObjeto(c, concretar(lib('Bastón de poder', 'Bastón', { sintonia: true, texto: 'Este bastón tiene 20 cargas y se puede usar a modo de bastón mágico que otorga un bonificador de +2 a las tiradas de ataque y de daño realizadas con él.' })));
    assert.equal(b.cat, 'magico'); assert.equal(b.arma.bono, 2);
    alternarSintonia(c, b.id);
    const ca = claseArmadura(c).ca;
    equipar(c, b.id);
    assert.equal(claseArmadura(c).ca, ca + 2, 'el +2 a la CA es mientras lo empuñas');
    assert.ok(armaCombate(c, b.id));
  });
});

describe('usarObjeto: consumibles', () => {
  test('pociones con efecto, apiladas, veneno, manuales y dosis', () => {
    const c = ch();
    const pf = anadirObjeto(c, concretar(lib('Poción de fuerza de gigante', 'Poción'), { var: 'Fuego' }));
    anadirObjeto(c, concretar(lib('Poción de fuerza de gigante', 'Poción'), { var: 'Fuego' }));
    assert.equal(pf.cantidad, 2, 'las pociones iguales se apilan');
    assert.equal(usoDe(pf).accion, 'beber');
    usarObjeto(c, pf.id, uno);
    assert.equal(statsEfectivos(c).fue, 25); assert.equal(pf.cantidad, 1);
    const h = anadirObjeto(c, lib('Poción de heroísmo', 'Poción')); usarObjeto(c, h.id, uno);
    assert.equal(vidaDe(c).temp, 10); assert.ok(vidaDe(c).efectos.some(e => e.k === 'bendicion' && e.rondas === 600));
    const r = anadirObjeto(c, concretar(lib('Poción de resistencia', 'Poción'), { var: 'Fuego' })); usarObjeto(c, r.id, uno);
    assert.ok(resistenciasDe(c).some(x => x.tipo === 'fuego'));
    const pv = pgActuales(c), v = anadirObjeto(c, lib('Poción de veneno', 'Poción')); const u = usarObjeto(c, v.id, uno);
    assert.equal(u.dano, 4); assert.equal(pgActuales(c), pv - Math.max(0, 4 - 10), 'los temporales absorben primero');
    aplicarDano(c, 30);
    const cur = anadirObjeto(c, concretar(lib('Poción de curación', 'Poción'), { var: 'Poción de curación (mayor)' })), antes = pgActuales(c);
    assert.equal(usarObjeto(c, cur.id, uno).curado, Math.min(8, pgMaximo(c) - antes), '4d4 + 4 con todo unos');
    const man = anadirObjeto(c, lib('Manual del ejercicio beneficioso', 'Objeto maravilloso'));
    assert.equal(usoDe(man).accion, 'leer'); usarObjeto(c, man.id);
    assert.equal(c.stats.fue, 12); assert.equal(usoDe(man), null, 'después de leerlo pierde su magia');
    const ung = anadirObjeto(c, lib('Ungüento de Keoghtom', 'Objeto maravilloso', { texto: 'Este frasco contiene 1d4 + 1 dosis de una mezcla espesa.' }), () => 2);
    assert.equal(ung.cat, 'consumible'); assert.equal(ung.cantidad, 3);
  });
});
