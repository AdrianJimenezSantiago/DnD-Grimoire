import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';
import { parseObjetos, leerCargas, leerUsos, corregirNombre } from '../web/src/domain/libros/objetos.js';
import { anadirObjeto, quitarObjeto, alternarSintonia, alternarGuardado, motivoSintonia, equipar, claseArmadura, ataqueArma, armaCombate, golpeSinArmas, municionDe, anadirComun } from '../web/src/domain/equipo/equipo.js';
import { pasosVariante, concretar } from '../web/src/domain/equipo/variantesObjeto.js';
import { efectoDe, statsEfectivos, objetoActivo } from '../web/src/domain/equipo/objetosEfecto.js';
import { usoDe, usarObjeto } from '../web/src/domain/equipo/usarObjeto.js';
import { reglas, reglasVisibles, recuperarEnDescanso } from '../web/src/domain/clases/rasgos.js';
import { pasivosDe, resistenciasDe } from '../web/src/domain/combate/efectos.js';
import { bonoHabilidad, velocidad } from '../web/src/domain/reglas/habilidades.js';
import { perfil } from '../web/src/domain/reglas/reglas2024.js';
import { pgActuales, pgMaximo, vidaDe, aplicarDano } from '../web/src/domain/combate/vida.js';

const L = (x, y, s, h = 16) => ({ x, y, h, s, segs: [{ x, w: s.length * 7, s }], cells: [{ x, s }] });
const pag = cols => [{ p: 1, cols }];
const ch = (o = {}) => normChar(blankChar({ clase: 'Mago', nivel: 5, stats: { fue: 10, des: 14, con: 12, int: 16, sab: 10, car: 10 }, ...o }));
const uno = () => 1;
// Objeto como llega de la biblioteca
const lib = (nombre, tipo, extra = {}) => ({ clave: nombre.toLowerCase(), nombre, tipo, rareza: 'Raro', subtipo: '', linea: '', texto: '', cargas: null, sintonia: false, ...extra });

test('lector: cargas en plural, «de sus», «comienza con», en dados y cuentas', () => {
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

test('lector: usos diarios de las propiedades y erratas de los nombres', () => {
  const u = leerUsos('Paralizar. Puedes paralizar a alguien. Una vez utilizada, esta propiedad no puede volver a usarse hasta el siguiente amanecer.\n\nAterrorizar. Asustas. Una vez utilizada, esta propiedad no puede volver a usarse hasta el siguiente amanecer.', 'Cetro');
  assert.deepEqual(u.map(x => x.nombre), ['Cetro: Paralizar', 'Cetro: Aterrorizar']);
  assert.equal(leerUsos('Desviar ataque. Giras el arma. No podrás volver a usar esta propiedad hasta que finalices un descanso corto o largo.', 'Bastón')[0].recarga, 'corto');
  assert.deepEqual(leerUsos('Cuando uses el libro para lanzar un conjuro, no podrás volver a lanzarlo desde él hasta el siguiente amanecer.', 'Libro'), []);
  assert.equal(corregirNombre('Escupo +1, +2 o +3'), 'Escudo +1, +2 o +3');
  assert.equal(corregirNombre('Piedra loun'), 'Piedra ioun');
  assert.equal(corregirNombre('Pociones de curación'), 'Poción de curación');
});

test('lector: títulos en versalitas mal leídas, a la izquierda del margen y con un pie de ilustración en medio', () => {
  const o = parseObjetos(pag([[L(60, 900, 'TEXTO DE RELLENO', 14), L(60, 880, 'Un párrafo cualquiera que marca el margen.'), L(60, 860, 'Y otro más para el margen.'),
    L(60, 820, 'EscuDO ANIMADO', 21), L(60, 800, 'Armadura (escudo), muy rara (requiere sintonización)'), L(60, 780, 'Mientras lleves embrazado este escudo, puedes darle vida.'),
    L(60, 740, 'GORRO DE PRUEBA', 15), L(400, 730, 'GLoBo', 13), L(60, 720, 'Objeto maravilloso, infrecuente'), L(60, 700, 'Si estás bajo el agua y llevas este gorro, respiras.'),
    L(60, 660, 'VARA DEL PACTO', 20), L(60, 640, 'Vara, infrecuente (+1), rara (+2) o muy rara (+3)'), L(60, 620, '(requiere sintonización por parte de un brujo) Mientras sostienes esta vara, obtienes un bonificador.')], []]));
  const por = Object.fromEntries(o.map(x => [x.nombre, x]));
  assert.ok(por['Escudo animado']); assert.ok(por['Gorro de prueba']);
  assert.equal(por['Vara del pacto'].sintoniaCon, 'parte de un brujo');
  assert.doesNotMatch(por['Vara del pacto'].texto, /^\(requiere/);
});

test('variantes: arma de base y bonificador, con la rareza de cada uno', () => {
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

test('variantes: armaduras, escudos y mithral', () => {
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

test('variantes: tablas (curación, gigantes, piedras ioun) y la munición mágica', () => {
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

test('cargas: tiradas al conseguirlo, ocultas sin sintonía y su recarga', () => {
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

test('sintonía: requisitos de clase, de lanzador y el límite de tres', () => {
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

test('efectos: Piedra de la buena fortuna, Cinturón enano, Guantes de ladrón, Botas de zancadas, ventajas y resistencias', () => {
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

test('efectos: Vara del pacto +N, Vendas de poder sin armas, Martillo de rayos y Garrote grande atronador', () => {
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

test('consumibles: pociones con efecto, apiladas, veneno, manuales y dosis', () => {
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
