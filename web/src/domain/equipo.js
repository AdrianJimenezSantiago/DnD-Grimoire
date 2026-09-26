import { uid, norm } from '../core/util.js';
import { modOf, clasesDe, perfil } from './reglas2024.js';
import { tieneEstilo } from './estilos.js';
import { tieneMaestria } from './maestria.js';

export const MAX_SINTONIA = 3;
export const CATEGORIAS = [['arma', 'Armas', 'o_arma'], ['armadura', 'Armaduras y escudos', 'o_armadura'], ['equipo', 'Equipo', 'cofre'],
  ['herramienta', 'Herramientas', 'dote'], ['consumible', 'Consumibles', 'o_pocion'], ['magico', 'Objetos mágicos', 'o_maravilloso'],
  ['comida', 'Comida y agua', 'curacion'], ['tesoro', 'Tesoro', 'o_anillo'], ['otro', 'Otros', 'libro']];
export const NOMBRE_CAT = Object.fromEntries(CATEGORIAS.map(([k, t]) => [k, t]));
export const MONEDAS = [['ppt', 'Platino', 10], ['po', 'Oro', 1], ['pe', 'Electro', 0.5], ['pp', 'Plata', 0.1], ['pc', 'Cobre', 0.01]];
const CAT_TIPO = { Arma: 'arma', Armadura: 'armadura', Escudo: 'armadura', 'Poción': 'consumible', Pergamino: 'consumible', 'Munición': 'consumible' };

const A = (nombre, dano, tipo, peso, valor, props = [], maestria = '', distancia = '') => ({ nombre, cat: 'arma', peso, valor, arma: { dano, tipo, props, maestria, distancia } });
const R = (nombre, base, dex, tipo, peso, valor) => ({ nombre, cat: 'armadura', peso, valor, armadura: { base, dex, tipo, bono: 0 } });
const E = (nombre, cat, peso, valor = '', extra = {}) => ({ nombre, cat, peso, valor, ...extra });
export const PREDEFINIDOS = [
  A('Bastón', '1d6', 'contundente', 2, '2 pp', ['Versátil (1d8)'], 'Derribar'), A('Daga', '1d4', 'perforante', 0.5, '2 po', ['Sutil', 'Ligera', 'Arrojadiza'], 'Mella', '6/18 m'),
  A('Garrote', '1d4', 'contundente', 1, '1 pp', ['Ligera'], 'Ralentizar'), A('Hacha de mano', '1d6', 'cortante', 1, '5 po', ['Ligera', 'Arrojadiza'], 'Irritar', '6/18 m'),
  A('Jabalina', '1d6', 'perforante', 1, '5 pp', ['Arrojadiza'], 'Ralentizar', '9/36 m'), A('Lanza', '1d6', 'perforante', 1.5, '1 po', ['Arrojadiza', 'Versátil (1d8)'], 'Derribar', '6/18 m'),
  A('Maza', '1d6', 'contundente', 2, '5 po', [], 'Irritar'), A('Hoz', '1d4', 'cortante', 1, '1 po', ['Ligera'], 'Mella'),
  A('Arco corto', '1d6', 'perforante', 1, '25 po', ['Munición', 'Dos manos'], 'Irritar', '24/96 m'), A('Ballesta ligera', '1d8', 'perforante', 2.5, '25 po', ['Munición', 'Carga', 'Dos manos'], 'Ralentizar', '24/96 m'),
  A('Espada corta', '1d6', 'perforante', 1, '10 po', ['Sutil', 'Ligera'], 'Irritar'), A('Espada larga', '1d8', 'cortante', 1.5, '15 po', ['Versátil (1d10)'], 'Debilitar'),
  A('Espadón', '2d6', 'cortante', 3, '50 po', ['Pesada', 'Dos manos'], 'Rozar'), A('Estoque', '1d8', 'perforante', 1, '25 po', ['Sutil'], 'Irritar'),
  A('Cimitarra', '1d6', 'cortante', 1.5, '25 po', ['Sutil', 'Ligera'], 'Mella'), A('Hacha de batalla', '1d8', 'cortante', 2, '10 po', ['Versátil (1d10)'], 'Derribar'),
  A('Hacha a dos manos', '1d12', 'cortante', 3.5, '30 po', ['Pesada', 'Dos manos'], 'Hendir'), A('Martillo de guerra', '1d8', 'contundente', 2.5, '15 po', ['Versátil (1d10)'], 'Empujar'),
  A('Mazo', '2d6', 'contundente', 5, '10 po', ['Pesada', 'Dos manos'], 'Derribar'), A('Alabarda', '1d10', 'cortante', 3, '20 po', ['Pesada', 'Alcance', 'Dos manos'], 'Hendir'),
  A('Mayal', '1d8', 'contundente', 1, '10 po', [], 'Debilitar'), A('Lucero del alba', '1d8', 'perforante', 2, '15 po', [], 'Debilitar'), A('Tridente', '1d8', 'perforante', 2, '5 po', ['Arrojadiza', 'Versátil (1d10)'], 'Derribar', '6/18 m'),
  A('Látigo', '1d4', 'cortante', 1.5, '2 po', ['Sutil', 'Alcance'], 'Ralentizar'), A('Arco largo', '1d8', 'perforante', 1, '50 po', ['Munición', 'Pesada', 'Dos manos'], 'Ralentizar', '45/180 m'),
  A('Ballesta de mano', '1d6', 'perforante', 1.5, '75 po', ['Munición', 'Ligera', 'Carga'], 'Irritar', '9/36 m'), A('Ballesta pesada', '1d10', 'perforante', 9, '50 po', ['Munición', 'Pesada', 'Carga', 'Dos manos'], 'Empujar', '30/120 m'),
  R('Armadura acolchada', 11, 'todo', 'ligera', 4, '5 po'), R('Armadura de cuero', 11, 'todo', 'ligera', 5, '10 po'), R('Armadura de cuero tachonado', 12, 'todo', 'ligera', 6.5, '45 po'),
  R('Armadura de pieles', 12, 'max2', 'media', 6, '10 po'), R('Camisote de mallas', 13, 'max2', 'media', 10, '50 po'), R('Cota de escamas', 14, 'max2', 'media', 22.5, '50 po'),
  R('Coraza', 14, 'max2', 'media', 10, '400 po'), R('Media armadura', 15, 'max2', 'media', 20, '750 po'), R('Cota de anillas', 14, 'no', 'pesada', 20, '30 po'),
  R('Cota de mallas', 16, 'no', 'pesada', 27.5, '75 po'), R('Armadura de bandas', 17, 'no', 'pesada', 30, '200 po'), R('Armadura de placas', 18, 'no', 'pesada', 32.5, '1500 po'),
  R('Escudo', 2, 'todo', 'escudo', 3, '10 po'),
  E('Mochila', 'equipo', 2.5, '2 po'), E('Saco de dormir', 'equipo', 3.5, '1 po'), E('Cuerda de cáñamo (15 m)', 'equipo', 2.5, '1 po'), E('Antorcha', 'equipo', 0.5, '1 pc'),
  E('Yesquero', 'equipo', 0.5, '5 pp'), E('Odre', 'equipo', 2.5, '2 pp'), E('Palanca', 'equipo', 2.5, '2 po'), E('Linterna sorda', 'equipo', 1, '10 po'), E('Manta', 'equipo', 1.5, '5 pp'),
  E('Aceite (frasco)', 'consumible', 0.5, '1 pp'), E('Flechas', 'consumible', 0.05, '1 pc'), E('Virotes', 'consumible', 0.075, '1 pc'), E('Poción de curación', 'consumible', 0.25, '50 po', { notas: 'Recuperas 2d4 + 2 puntos de golpe.' }),
  E('Kit de sanador', 'consumible', 1.5, '5 po', { notas: '10 usos.' }), E('Agua bendita (frasco)', 'consumible', 0.5, '25 po'), E('Fuego de alquimista (frasco)', 'consumible', 0.5, '50 po'),
  E('Raciones (1 día)', 'comida', 1, '5 pp'), E('Agua (odre lleno, 1 día)', 'comida', 2.5, ''), E('Pan', 'comida', 0.25, '2 pc'), E('Queso', 'comida', 0.5, '1 pp'), E('Vino (botella)', 'comida', 0.75, '2 po'),
  E('Herramientas de ladrón', 'herramienta', 0.5, '25 po'), E('Kit de herborista', 'herramienta', 1.5, '5 po'), E('Útiles de herrero', 'herramienta', 4, '20 po'),
  E('Suministros de caligrafía', 'herramienta', 2.5, '10 po'), E('Laúd', 'herramienta', 1, '35 po'), E('Kit de disfraz', 'herramienta', 1.5, '25 po'),
  E('Foco arcano (orbe)', 'equipo', 1.5, '20 po'), E('Símbolo sagrado (amuleto)', 'equipo', 0.5, '5 po'), E('Foco druídico (rama de muérdago)', 'equipo', 0, '1 po'), E('Libro de conjuros', 'equipo', 1.5, '50 po'),
  E('Carcaj', 'equipo', 0.5, '1 po'), E('Ropa de viaje', 'equipo', 2, '2 po'), E('Ropa fina', 'equipo', 3, '15 po'), E('Túnica', 'equipo', 2, '1 po'), E('Bolsa', 'equipo', 0.5, '5 pp'),
  E('Lámpara', 'equipo', 0.5, '5 pp'), E('Tienda de campaña', 'equipo', 10, '2 po'), E('Grilletes', 'equipo', 3, '2 po'), E('Pala', 'equipo', 2.5, '2 po'), E('Olla de hierro', 'equipo', 5, '2 po'),
  E('Pergamino (hoja)', 'equipo', 0, '2 pp'), E('Espejo', 'equipo', 0.25, '5 po'), E('Perfume', 'equipo', 0, '5 po'), E('Disfraz', 'equipo', 2, '5 po'),
  E('Foco arcano (cristal)', 'equipo', 0.5, '10 po'), E('Foco arcano (bastón)', 'equipo', 2, '5 po'), E('Foco druídico (bastón)', 'equipo', 2, '5 po'),
  E('Gema', 'tesoro', 0, '50 po'), E('Objeto de arte', 'tesoro', 0.5, '25 po'),
];

export const equipoDe = ch => {
  const eq = (ch.equipo ||= { objetos: [] });
  if (!Array.isArray(eq.objetos)) eq.objetos = [];
  eq.monedas ||= { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 };
  return eq;
};
export const sintonizados = ch => equipoDe(ch).objetos.filter(o => o.sintonizado);
export const tieneObjeto = (ch, clave) => equipoDe(ch).objetos.some(o => o.clave === clave);
const num = (v, def = 0) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : def; };

export function normObjeto(o) {
  const cat = CATEGORIAS.some(([k]) => k === o.cat) ? o.cat : o.clave ? (CAT_TIPO[o.tipo] || 'magico') : 'otro';
  return { ...o, id: o.id || uid('ob'), nombre: String(o.nombre || 'Objeto').trim(), cat, cantidad: Math.max(0, Math.round(num(o.cantidad, 1))), peso: Math.max(0, num(o.peso)),
    valor: String(o.valor || ''), notas: String(o.notas || ''), equipado: !!o.equipado, magico: !!(o.magico || o.clave || o.rareza), sintonia: !!o.sintonia, sintonizado: !!o.sintonizado };
}
export function normEquipo(ch) {
  const eq = equipoDe(ch);
  eq.objetos = eq.objetos.filter(Boolean).map(normObjeto);
  for (const [k] of MONEDAS) eq.monedas[k] = Math.max(0, Math.round(num(eq.monedas[k])));
  return eq;
}

export function rasgoDeCargas(o) {
  const c = o.cargas; if (!c || !c.max) return null;
  const m = /^(\d+d\d+)(?:\+(\d+))?$/.exec(c.recarga || '');
  const base = { id: uid('r'), tipo: 'recurso', nombre: `${o.nombre} (cargas)`, nota: 'Cargas del objeto mágico.', maxBase: 'fijo', maxN: c.max, maxAb: 'car', dado: 'd20', nivMax: 5, escuela: '', espacioMin: 0, soloEspacio: true, efecto: 'aviso', efectoN: 5, texto: '', objeto: o.clave };
  if (m) return { ...base, recarga: 'dado', recDado: m[1], recBono: +(m[2] || 0), recMomento: 'largo' };
  if (/todas/.test(c.recarga || '')) return { ...base, recarga: 'largo' };
  if (/^\d+$/.test(c.recarga || '')) return { ...base, recarga: 'dado', recDado: `${c.recarga}d1`, recBono: 0, recMomento: 'largo' };
  return { ...base, recarga: 'nunca' };
}
export function anadirObjeto(ch, o) {
  const e = normObjeto({ clave: o.clave, nombre: o.nombre, tipo: o.tipo, rareza: o.rareza, sintonia: !!o.sintonia, magico: true, cantidad: 1, rasgo: null });
  const r = rasgoDeCargas(o);
  if (r) { (ch.rasgos ||= []).push(r); e.rasgo = r.id; }
  equipoDe(ch).objetos.push(e);
  return e;
}
export function anadirComun(ch, datos) {
  const eq = equipoDe(ch), nuevo = normObjeto({ ...datos, id: undefined });
  const igual = eq.objetos.find(x => !x.clave && !x.equipado && norm(x.nombre) === norm(nuevo.nombre) && x.cat === nuevo.cat && !x.arma === !nuevo.arma);
  if (igual && !nuevo.arma && !nuevo.armadura) { igual.cantidad += nuevo.cantidad; return igual; }
  eq.objetos.push(nuevo); return nuevo;
}
export function quitarObjeto(ch, id) {
  const eq = equipoDe(ch), e = eq.objetos.find(x => x.id === id); if (!e) return null;
  eq.objetos = eq.objetos.filter(x => x !== e);
  if (e.rasgo) { ch.rasgos = (ch.rasgos || []).filter(r => r.id !== e.rasgo); if (ch.play?.rec) delete ch.play.rec[e.rasgo]; }
  return e;
}
export function alternarSintonia(ch, id) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return false;
  if (!e.sintonizado && sintonizados(ch).length >= MAX_SINTONIA) return false;
  e.sintonizado = !e.sintonizado; return true;
}
export function alternarEquipado(ch, id) {
  const eq = equipoDe(ch), e = eq.objetos.find(x => x.id === id); if (!e) return;
  if (!e.equipado && e.armadura) {
    const escudo = e.armadura.tipo === 'escudo';
    eq.objetos.forEach(x => { if (x !== e && x.equipado && x.armadura && (x.armadura.tipo === 'escudo') === escudo) x.equipado = false; });
  }
  e.equipado = !e.equipado;
}
export function cambiarCantidad(ch, id, d) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return null;
  e.cantidad = Math.max(0, e.cantidad + d); return e;
}

export function pesoTotal(ch) {
  const eq = equipoDe(ch), monedas = Object.values(eq.monedas).reduce((s, n) => s + (n || 0), 0);
  return Math.round((eq.objetos.reduce((s, o) => s + (o.peso || 0) * (o.cantidad || 0), 0) + monedas / 50 * 0.5) * 10) / 10;
}
export const capacidadCarga = ch => (ch.stats?.fue || 10) * 7.5 * (/goliat/i.test(ch.especie || '') ? 2 : 1);
export const valorMonedas = ch => Math.round(MONEDAS.reduce((s, [k, , v]) => s + (equipoDe(ch).monedas[k] || 0) * v, 0) * 100) / 100;

export function claseArmadura(ch) {
  const eq = equipoDe(ch), st = ch.stats || {}, des = modOf(st.des), clases = clasesDe(ch).map(c => c.clase);
  const arm = eq.objetos.find(o => o.equipado && o.armadura && o.armadura.tipo !== 'escudo'), esc = eq.objetos.find(o => o.equipado && o.armadura?.tipo === 'escudo');
  const bonoEsc = esc ? (esc.armadura.base || 2) + (esc.armadura.bono || 0) : 0;
  if (arm) {
    const a = arm.armadura, d = a.dex === 'no' ? 0 : a.dex === 'max2' ? Math.min(2, des) : des;
    const def = tieneEstilo(ch, 'defensa') ? 1 : 0;
    return { ca: (a.base || 10) + (a.bono || 0) + d + bonoEsc + def, detalle: [`${arm.nombre} ${a.base + (a.bono || 0)}`, a.dex !== 'no' ? `Des ${d >= 0 ? '+' : ''}${d}` : '', esc ? `escudo +${bonoEsc}` : '', def ? 'Defensa +1' : ''].filter(Boolean).join(', ') };
  }
  const opciones = [{ ca: 10 + des + bonoEsc, detalle: `10 + Des${esc ? ', escudo' : ''}` }];
  if (clases.includes('Bárbaro')) opciones.push({ ca: 10 + des + modOf(st.con) + bonoEsc, detalle: `Defensa sin armadura (10 + Des + Con)${esc ? ', escudo' : ''}` });
  if (clases.includes('Monje') && !esc) opciones.push({ ca: 10 + des + modOf(st.sab), detalle: 'Defensa sin armadura (10 + Des + Sab)' });
  return opciones.sort((a, b) => b.ca - a.ca)[0];
}
export function ataqueArma(ch, o) {
  const a = o.arma; if (!a) return null;
  const st = ch.stats || {}, fue = modOf(st.fue), des = modOf(st.des), props = (a.props || []).map(norm);
  const distancia = props.some(p => p.startsWith('municion')), sutil = props.includes('sutil');
  const mod = distancia ? des : sutil ? Math.max(fue, des) : fue, pb = perfil(ch).pb, bono = parseInt(a.bono, 10) || 0;
  const s = n => (n >= 0 ? `+${n}` : String(n)), dosManos = props.includes('dos manos'), estilos = [];
  const atk = distancia && tieneEstilo(ch, 'arqueria') ? (estilos.push('Arquería +2 al ataque'), 2) : 0;
  const dmg = !distancia && !dosManos && tieneEstilo(ch, 'duelo') ? (estilos.push('Duelo +2 al daño (en una mano, sin otra arma)'), 2) : 0;
  if (props.includes('arrojadiza') && tieneEstilo(ch, 'arrojadizas')) estilos.push('+2 al daño al lanzarla (Combate con armas arrojadizas)');
  if (!distancia && (dosManos || props.some(p => p.startsWith('versatil'))) && tieneEstilo(ch, 'grandes')) estilos.push('a dos manos, los 1 y 2 del daño cuentan como 3');
  if (props.includes('ligera') && tieneEstilo(ch, 'dosarmas')) estilos.push('el ataque adicional con arma ligera suma el modificador al daño');
  const md = mod + bono + dmg;
  return { mod: mod + bono, maestria: a.maestria || '', domina: tieneMaestria(ch, o.nombre) && !!a.maestria, ligera: props.includes('ligera'), expr: `${a.dano || '1d4'}${md ? s(md) : ''}`, tipo: a.tipo || '', ataque: s(mod + pb + bono + atk), dano: `${a.dano || '1d4'}${md ? ` ${s(md).replace(/^([+-])/, '$1 ')}` : ''} ${a.tipo || ''}`.trim(), estilos };
}
