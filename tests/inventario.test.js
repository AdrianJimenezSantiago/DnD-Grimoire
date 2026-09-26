import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normObjeto, normEquipo, anadirComun, alternarEquipado, cambiarCantidad, claseArmadura, ataqueArma, pesoTotal, capacidadCarga, valorMonedas, equipoDe, PREDEFINIDOS } from '../web/src/domain/equipo.js';
import { normChar } from '../web/src/domain/modelo.js';

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
