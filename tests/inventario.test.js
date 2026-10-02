import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normObjeto, normEquipo, anadirComun, alternarEquipado, cambiarCantidad, claseArmadura, ataqueArma, pesoTotal, capacidadCarga, valorMonedas, equipoDe, PREDEFINIDOS,
  equipar, manos, dosArmasLigeras, requisitosArmadura, penalizacionArmadura, alternarGuardado, pesoGuardado, pagar, cobrar, juntarMonedas, enCobre, valorEnPo, precioVenta, venderObjeto,
  municionDe, curacionDe, alternarSintonia } from '../web/src/domain/equipo/equipo.js';
import { velocidad } from '../web/src/domain/reglas/habilidades.js';
import { modsTirada } from '../web/src/domain/combate/efectos.js';
import { normChar } from '../web/src/domain/personaje/modelo.js';

const pj = (extra = {}) => normChar({ nombre: 'X', clase: 'Guerrero', nivel: 5, stats: { fue: 16, des: 14, con: 14, int: 10, sab: 12, car: 8 }, ...extra });
const basico = ({ expr, tipo, ataque, dano, estilos }) => ({ expr, tipo, ataque, dano, estilos });
const de = n => JSON.parse(JSON.stringify(PREDEFINIDOS.find(p => p.nombre === n)));

test('inventario: los objetos mágicos antiguos pasan a su categoría con cantidad, y las monedas se sanean', () => {
  const ch = pj({ equipo: { objetos: [{ id: 'a', clave: 'arma +1', nombre: 'Arma +1', tipo: 'Arma', rareza: 'Infrecuente' }, { id: 'b', clave: 'varita', nombre: 'Varita', tipo: 'Varita', rareza: 'Rara', sintonia: true }] } });
  const [a, b] = ch.equipo.objetos;
  assert.deepEqual([a.cat, a.cantidad, a.magico, b.cat, b.sintonia], ['arma', 1, true, 'magico', true]);
  assert.deepEqual(ch.equipo.monedas, { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 });
  assert.equal(normObjeto({ nombre: ' Cuerda ', cantidad: '-3', peso: '2,5' }).peso, 2.5);
  assert.equal(normObjeto({ nombre: 'Cuerda', cantidad: '-3' }).cantidad, 0);
});
test('inventario: lo repetido se apila, las armaduras se equipan de una en una y los consumibles se gastan', () => {
  const ch = pj();
  anadirComun(ch, { ...de('Raciones (1 día)'), cantidad: 3 }); anadirComun(ch, { ...de('Raciones (1 día)'), cantidad: 2 });
  assert.equal(equipoDe(ch).objetos.find(o => o.nombre === 'Raciones (1 día)').cantidad, 5);
  const cota = anadirComun(ch, de('Cota de mallas')), cuero = anadirComun(ch, de('Armadura de cuero')), escudo = anadirComun(ch, de('Escudo'));
  alternarEquipado(ch, cota.id); alternarEquipado(ch, escudo.id); alternarEquipado(ch, cuero.id);
  assert.deepEqual([cota.equipado, cuero.equipado, escudo.equipado], [false, true, true]);
  const r = equipoDe(ch).objetos.find(o => o.nombre === 'Raciones (1 día)');
  for (let i = 0; i < 7; i++) cambiarCantidad(ch, r.id, -1);
  assert.equal(r.cantidad, 0);
});
test('inventario: CA con armadura, escudo y defensa sin armadura', () => {
  const ch = pj(); const cota = anadirComun(ch, de('Cota de mallas')), esc = anadirComun(ch, de('Escudo'));
  assert.equal(claseArmadura(ch).ca, 12);
  alternarEquipado(ch, cota.id); assert.equal(claseArmadura(ch).ca, 16);
  alternarEquipado(ch, esc.id); assert.equal(claseArmadura(ch).ca, 18);
  const media = pj({ stats: { des: 18 } }); alternarEquipado(media, anadirComun(media, de('Coraza')).id); assert.equal(claseArmadura(media).ca, 16);
  const barb = pj({ clase: 'Bárbaro', stats: { des: 14, con: 16 } }); assert.equal(claseArmadura(barb).ca, 15);
  const monje = pj({ clase: 'Monje', stats: { des: 16, sab: 16 } }); assert.equal(claseArmadura(monje).ca, 16);
  alternarEquipado(monje, anadirComun(monje, de('Escudo')).id); assert.equal(claseArmadura(monje).ca, 15);
});
test('inventario: ataque y daño de cada arma, peso, carga y monedas', () => {
  const ch = pj({ stats: { fue: 16, des: 18 } });
  assert.deepEqual(basico(ataqueArma(ch, anadirComun(ch, de('Espada larga')))), { expr: '1d8+3', tipo: 'cortante', ataque: '+6', dano: '1d8 + 3 cortante', estilos: [] });
  assert.deepEqual(basico(ataqueArma(ch, anadirComun(ch, de('Estoque')))), { expr: '1d8+4', tipo: 'perforante', ataque: '+7', dano: '1d8 + 4 perforante', estilos: [] });
  assert.deepEqual(basico(ataqueArma(ch, anadirComun(ch, { ...de('Arco largo'), arma: { ...de('Arco largo').arma, bono: 1 } }))), { expr: '1d8+5', tipo: 'perforante', ataque: '+8', dano: '1d8 + 5 perforante', estilos: [] });
  const p = pj(); anadirComun(p, { ...de('Antorcha'), cantidad: 4 }); equipoDe(p).monedas.po = 100;
  assert.equal(pesoTotal(p), 3);
  assert.equal(valorMonedas({ equipo: { objetos: [], monedas: { ppt: 1, po: 2, pp: 5, pc: 30 } } }), 12.8);
  assert.equal(capacidadCarga(pj()), 120); assert.equal(capacidadCarga(pj({ especie: 'Goliat' })), 240);
  normEquipo(p); assert.equal(p.equipo.objetos.length, 1);
});

test('manos: dos manos, escudo y dos armas ligeras se reparten sin pisarse', () => {
  const ch = pj(), esp = anadirComun(ch, de('Espada larga')), esc = anadirComun(ch, de('Escudo')), gran = anadirComun(ch, de('Espadón'));
  const daga = anadirComun(ch, de('Daga')), corta = anadirComun(ch, de('Espada corta'));
  equipar(ch, esp.id); equipar(ch, esc.id);
  assert.deepEqual([manos(ch).principal, manos(ch).secundaria], [esp, esc]);
  const r = equipar(ch, gran.id);
  assert.deepEqual(r.quitados.map(o => o.nombre).sort(), ['Escudo', 'Espada larga']);
  assert.equal(gran.mano, 'ambas'); assert.equal(claseArmadura(ch).ca, 12);
  equipar(ch, esc.id); assert.equal(gran.equipado, false); assert.equal(esc.mano, 'secundaria');
  equipar(ch, daga.id); equipar(ch, corta.id, 'secundaria');
  assert.equal(esc.equipado, false); assert.equal(dosArmasLigeras(ch), true);
  equipar(ch, esp.id, 'principal'); assert.equal(daga.equipado, false); assert.equal(dosArmasLigeras(ch), false);
});
test('manos: las partidas antiguas con demasiado en la mano se ordenan al cargar', () => {
  const ch = pj(), arco = anadirComun(ch, de('Arco largo')), esp = anadirComun(ch, de('Espada larga')), esc = anadirComun(ch, de('Escudo'));
  const cota = anadirComun(ch, de('Cota de mallas')), cuero = anadirComun(ch, de('Armadura de cuero'));
  for (const o of [arco, esp, esc, cota, cuero]) o.equipado = true;
  normEquipo(ch); const v = o => equipoDe(ch).objetos.find(x => x.id === o.id);
  assert.deepEqual([v(arco).equipado, v(esp).mano, v(esc).mano, v(cota).equipado, v(cuero).equipado], [false, 'principal', 'secundaria', true, false]);
});
test('armaduras: Fuerza mínima, Sigilo y mithral', () => {
  assert.deepEqual(requisitosArmadura(de('Armadura de placas')), { fue: 15, sigilo: true });
  assert.deepEqual(requisitosArmadura({ nombre: 'Cota de mallas +1', armadura: { base: 16, dex: 'no', tipo: 'pesada' } }), { fue: 13, sigilo: true });
  assert.deepEqual(requisitosArmadura({ nombre: 'Cota de mallas de mithral', armadura: { base: 16, dex: 'no', tipo: 'pesada' } }), { fue: 0, sigilo: false });
  assert.deepEqual(requisitosArmadura(de('Armadura de cuero')), { fue: 0, sigilo: false });
  const debil = pj({ stats: { fue: 12, des: 14 } }); equipar(debil, anadirComun(debil, de('Armadura de placas')).id);
  assert.equal(penalizacionArmadura(debil).lenta, 3); assert.equal(velocidad(debil), 6);
  assert.ok(modsTirada(debil, { sobre: 'prueba', ab: 'des', hab: 'sigilo' }).some(m => m.efecto === 'desventaja'));
  assert.ok(!modsTirada(debil, { sobre: 'prueba', ab: 'des', hab: 'acrobacias' }).some(m => m.efecto === 'desventaja'));
  const fuerte = pj(); equipar(fuerte, anadirComun(fuerte, de('Armadura de placas')).id); assert.equal(velocidad(fuerte), 9);
});
test('mochila y alijo: lo guardado no pesa y deja de estar equipado o sintonizado', () => {
  const ch = pj(), tienda = anadirComun(ch, de('Tienda de campaña')), cota = anadirComun(ch, de('Cota de mallas'));
  const capa = anadirComun(ch, { nombre: 'Capa de protección', cat: 'magico', sintonia: true });
  equipar(ch, cota.id); alternarSintonia(ch, capa.id);
  assert.equal(pesoTotal(ch), 37.5);
  alternarGuardado(ch, tienda.id); alternarGuardado(ch, cota.id); alternarGuardado(ch, capa.id);
  assert.equal(pesoTotal(ch), 0); assert.equal(pesoGuardado(ch), 37.5);
  assert.deepEqual([cota.equipado, capa.sintonizado], [false, false]);
  equipar(ch, cota.id); assert.equal(cota.guardado, false);
  assert.equal(normObjeto({ nombre: 'X', guardado: true, equipado: true }).guardado, false);
});
test('monedas: pagar con cambio, cobrar y juntar', () => {
  const ch = pj(), m = equipoDe(ch).monedas;
  Object.assign(m, { pc: 5, pp: 3, pe: 0, po: 2, ppt: 1 });
  assert.equal(pagar(ch, 100), null);
  const r = pagar(ch, 0.27);
  assert.deepEqual(m, { pc: 8, pp: 0, pe: 0, po: 2, ppt: 1 }); assert.equal(r.cambio, 0.08);
  pagar(ch, 3); assert.deepEqual(m, { pc: 8, pp: 0, pe: 0, po: 9, ppt: 0 });
  const total = enCobre(ch); cobrar(ch, 1.25); assert.equal(enCobre(ch), total + 125);
  Object.assign(m, { pc: 230, pp: 15, pe: 3, po: 0, ppt: 2 });
  const antes = enCobre(ch); assert.ok(juntarMonedas(ch) > 0);
  assert.deepEqual(m, { pc: 0, pp: 3, pe: 0, po: 5, ppt: 2 }); assert.equal(enCobre(ch), antes);
});
test('valor y venta: la mitad del precio, el tesoro entero', () => {
  assert.deepEqual([valorEnPo('15 po'), valorEnPo('5 pp'), valorEnPo('1.500 po'), valorEnPo('2,5 po'), valorEnPo('')], [15, 0.5, 1500, 2.5, 0]);
  assert.equal(precioVenta(de('Espada larga')), 7.5); assert.equal(precioVenta(de('Gema')), 50);
  const ch = pj(); anadirComun(ch, { ...de('Antorcha'), cantidad: 3 }); const esp = anadirComun(ch, de('Espada larga'));
  const v = venderObjeto(ch, esp.id); assert.equal(v.precio, 7.5);
  assert.deepEqual(equipoDe(ch).monedas, { pc: 0, pp: 5, pe: 0, po: 7, ppt: 0 });
  assert.equal(equipoDe(ch).objetos.length, 1);
});
test('munición de cada arma, pociones y daño a dos manos', () => {
  const ch = pj(), arco = anadirComun(ch, de('Arco largo')), ball = anadirComun(ch, de('Ballesta ligera'));
  const fl = anadirComun(ch, { ...de('Flechas'), cantidad: 20 });
  assert.equal(municionDe(ch, arco), fl); assert.equal(municionDe(ch, ball), null);
  assert.equal(municionDe(ch, anadirComun(ch, de('Daga'))), null);
  assert.equal(curacionDe({ nombre: 'Poción de curación' }), '2d4+2'); assert.equal(curacionDe({ nombre: 'Poción de curación superior' }), '8d4+8');
  assert.equal(curacionDe({ nombre: 'Poción de escalada' }), '');
  const esp = anadirComun(ch, de('Espada larga'));
  assert.deepEqual(ataqueArma(ch, esp).versatil, { expr: '1d10+3', dano: '1d10 + 3 cortante' });
  assert.equal(ataqueArma(ch, anadirComun(ch, de('Daga'))).versatil, null);
});
