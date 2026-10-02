import { uid, norm } from '../../core/util.js';
import { modOf, clasesDe, perfil, dotesDe, competencia, nivelTotal } from '../reglas/reglas2024.js';
import { competenteConArma, esMarcial as esMarcialArma } from '../reglas/competencias.js';
import { tieneEstilo } from '../clases/estilos.js';
import { tieneMaestria } from '../combate/maestria.js';
import { golpeExtra } from '../clases/variantes.js';
import { statsEfectivos, objetosActivos, efectoDe, bonoDeNombre } from './objetosEfecto.js';

export const MAX_SINTONIA = 3;
export const CATEGORIAS = [['arma', 'Armas', 'o_arma'], ['armadura', 'Armaduras y escudos', 'o_armadura'], ['equipo', 'Equipo', 'cofre'],
  ['herramienta', 'Herramientas', 'dote'], ['consumible', 'Consumibles', 'o_pocion'], ['magico', 'Objetos mágicos', 'o_maravilloso'],
  ['comida', 'Comida y agua', 'curacion'], ['tesoro', 'Tesoro', 'o_anillo'], ['otro', 'Otros', 'libro']];
export const NOMBRE_CAT = Object.fromEntries(CATEGORIAS.map(([k, t]) => [k, t]));
export const MONEDAS = [['ppt', 'Platino', 10], ['po', 'Oro', 1], ['pe', 'Electro', 0.5], ['pp', 'Plata', 0.1], ['pc', 'Cobre', 0.01]];
const CAT_TIPO = { Arma: 'arma', Armadura: 'armadura', Escudo: 'armadura', 'Poción': 'consumible', Pergamino: 'consumible', 'Munición': 'consumible' };
// Objetos maravillosos de un solo uso o con dosis: se gastan como las pociones
const CONSUMIBLE_MAGICO = /^(polvo|ficha de pluma|gema elemental|perfume|ungüento|unguento|canica de fuerza|bolsa de judias|disolvente universal|pegamento soberano|aceite)\b/;

const A = (nombre, dano, tipo, peso, valor, props = [], maestria = '', distancia = '') => ({ nombre, cat: 'arma', peso, valor, arma: { dano, tipo, props, maestria, distancia } });
// fue: Fuerza mínima (si no llega, −3 m de velocidad); sigilo: desventaja en Destreza (Sigilo) al llevarla
const R = (nombre, base, dex, tipo, peso, valor, fue = 0, sigilo = false) => ({ nombre, cat: 'armadura', peso, valor, armadura: { base, dex, tipo, bono: 0, fue, sigilo } });
const E = (nombre, cat, peso, valor = '', extra = {}) => ({ nombre, cat, peso, valor, ...extra });
export const PREDEFINIDOS = [
  A('Bastón', '1d6', 'contundente', 2, '2 pp', ['Versátil (1d8)'], 'Derribar'), A('Daga', '1d4', 'perforante', 0.5, '2 po', ['Sutil', 'Ligera', 'Arrojadiza'], 'Mella', '6/18 m'),
  A('Garrote', '1d4', 'contundente', 1, '1 pp', ['Ligera'], 'Ralentizar'), A('Hacha de mano', '1d6', 'cortante', 1, '5 po', ['Ligera', 'Arrojadiza'], 'Irritar', '6/18 m'),
  A('Jabalina', '1d6', 'perforante', 1, '5 pp', ['Arrojadiza'], 'Ralentizar', '9/36 m'), A('Lanza', '1d6', 'perforante', 1.5, '1 po', ['Arrojadiza', 'Versátil (1d8)'], 'Debilitar', '6/18 m'),
  A('Maza', '1d6', 'contundente', 2, '5 po', [], 'Debilitar'), A('Hoz', '1d4', 'cortante', 1, '1 po', ['Ligera'], 'Mella'),
  A('Arco corto', '1d6', 'perforante', 1, '25 po', ['Munición', 'Dos manos'], 'Irritar', '24/96 m'), A('Ballesta ligera', '1d8', 'perforante', 2.5, '25 po', ['Munición', 'Carga', 'Dos manos'], 'Ralentizar', '24/96 m'),
  A('Espada corta', '1d6', 'perforante', 1, '10 po', ['Sutil', 'Ligera'], 'Irritar'), A('Espada larga', '1d8', 'cortante', 1.5, '15 po', ['Versátil (1d10)'], 'Debilitar'),
  A('Espadón', '2d6', 'cortante', 3, '50 po', ['Pesada', 'Dos manos'], 'Rozar'), A('Estoque', '1d8', 'perforante', 1, '25 po', ['Sutil'], 'Irritar'),
  A('Cimitarra', '1d6', 'cortante', 1.5, '25 po', ['Sutil', 'Ligera'], 'Mella'), A('Hacha de batalla', '1d8', 'cortante', 2, '10 po', ['Versátil (1d10)'], 'Derribar'),
  A('Hacha a dos manos', '1d12', 'cortante', 3.5, '30 po', ['Pesada', 'Dos manos'], 'Hendir'), A('Martillo de guerra', '1d8', 'contundente', 2.5, '15 po', ['Versátil (1d10)'], 'Empujar'),
  A('Mazo', '2d6', 'contundente', 5, '10 po', ['Pesada', 'Dos manos'], 'Derribar'), A('Alabarda', '1d10', 'cortante', 3, '20 po', ['Pesada', 'Alcance', 'Dos manos'], 'Hendir'),
  A('Mayal', '1d8', 'contundente', 1, '10 po', [], 'Debilitar'), A('Lucero del alba', '1d8', 'perforante', 2, '15 po', [], 'Debilitar'), A('Tridente', '1d8', 'perforante', 2, '5 po', ['Arrojadiza', 'Versátil (1d10)'], 'Derribar', '6/18 m'),
  A('Látigo', '1d4', 'cortante', 1.5, '2 po', ['Sutil', 'Alcance'], 'Ralentizar'), A('Arco largo', '1d8', 'perforante', 1, '50 po', ['Munición', 'Pesada', 'Dos manos'], 'Ralentizar', '45/180 m'),
  A('Ballesta de mano', '1d6', 'perforante', 1.5, '75 po', ['Munición', 'Ligera', 'Carga'], 'Irritar', '9/36 m'), A('Ballesta pesada', '1d10', 'perforante', 9, '50 po', ['Munición', 'Pesada', 'Carga', 'Dos manos'], 'Empujar', '30/120 m'),
  A('Garrote grande', '1d8', 'contundente', 5, '2 pp', ['Dos manos'], 'Empujar'), A('Martillo ligero', '1d4', 'contundente', 1, '2 po', ['Ligera', 'Arrojadiza'], 'Mella', '6/18 m'),
  A('Dardo', '1d4', 'perforante', 0.125, '5 pc', ['Sutil', 'Arrojadiza'], 'Irritar', '6/18 m'), A('Honda', '1d4', 'contundente', 0, '1 pp', ['Munición'], 'Ralentizar', '9/36 m'),
  A('Guja', '1d10', 'cortante', 3, '20 po', ['Pesada', 'Alcance', 'Dos manos'], 'Rozar'), A('Pica', '1d10', 'perforante', 9, '5 po', ['Pesada', 'Alcance', 'Dos manos'], 'Empujar'),
  A('Lanza de caballería', '1d10', 'perforante', 3, '10 po', ['Pesada', 'Alcance', 'Dos manos'], 'Derribar'), A('Pico de guerra', '1d8', 'perforante', 1, '5 po', ['Versátil (1d10)'], 'Debilitar'),
  A('Mosquete', '1d12', 'perforante', 5, '500 po', ['Munición', 'Carga', 'Dos manos'], 'Ralentizar', '12/36 m'), A('Pistola', '1d10', 'perforante', 1.5, '250 po', ['Munición', 'Carga'], 'Irritar', '9/27 m'),
  A('Cerbatana', '1', 'perforante', 0.5, '10 po', ['Munición', 'Carga'], 'Irritar', '7,5/30 m'),
  R('Armadura acolchada', 11, 'todo', 'ligera', 4, '5 po', 0, true), R('Armadura de cuero', 11, 'todo', 'ligera', 5, '10 po'), R('Armadura de cuero tachonado', 12, 'todo', 'ligera', 6.5, '45 po'),
  R('Armadura de pieles', 12, 'max2', 'media', 6, '10 po'), R('Camisote de mallas', 13, 'max2', 'media', 10, '50 po'), R('Cota de escamas', 14, 'max2', 'media', 22.5, '50 po', 0, true),
  R('Coraza', 14, 'max2', 'media', 10, '400 po'), R('Media armadura', 15, 'max2', 'media', 20, '750 po', 0, true), R('Cota de anillas', 14, 'no', 'pesada', 20, '30 po', 0, true),
  R('Cota de mallas', 16, 'no', 'pesada', 27.5, '75 po', 13, true), R('Armadura de bandas', 17, 'no', 'pesada', 30, '200 po', 15, true), R('Armadura de placas', 18, 'no', 'pesada', 32.5, '1500 po', 15, true),
  R('Escudo', 2, 'todo', 'escudo', 3, '10 po'),
  E('Mochila', 'equipo', 2.5, '2 po'), E('Saco de dormir', 'equipo', 3.5, '1 po'), E('Cuerda de cáñamo (15 m)', 'equipo', 2.5, '1 po'), E('Antorcha', 'equipo', 0.5, '1 pc'),
  E('Yesquero', 'equipo', 0.5, '5 pp'), E('Odre', 'equipo', 2.5, '2 pp'), E('Palanca', 'equipo', 2.5, '2 po'), E('Linterna sorda', 'equipo', 1, '10 po'), E('Manta', 'equipo', 1.5, '5 pp'),
  E('Aceite (frasco)', 'consumible', 0.5, '1 pp'), E('Flechas', 'consumible', 0.05, '1 pc'), E('Virotes', 'consumible', 0.075, '1 pc'), E('Balas de honda', 'consumible', 0.035, '2 pc'), E('Agujas de cerbatana', 'consumible', 0.01, '2 pc'), E('Balas de arma de fuego', 'consumible', 0.1, '3 pc'), E('Poción de curación', 'consumible', 0.25, '50 po', { notas: 'Recuperas 2d4 + 2 puntos de golpe.' }),
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

// Arma o armadura mágica con nombre de una normal («Espada larga +1», «Escudo +2», «Cota de mallas +1»): toma sus datos y el bonificador
const BASES = [...PREDEFINIDOS].filter(p => p.arma || p.armadura).sort((a, b) => b.nombre.length - a.nombre.length);
export function baseMagica(nombre) {
  const n = norm(nombre || ''), p = BASES.find(x => n.includes(norm(x.nombre))); if (!p) return null;
  const bono = bonoDeNombre(nombre), c = JSON.parse(JSON.stringify(p));
  if (c.arma) { c.arma.bono = bono; c.arma.base = p.nombre; } if (c.armadura) c.armadura.bono = bono;
  return c;
}
const MAESTRIA_CORREGIDA = { maza: ['Irritar', 'Debilitar'], lanza: ['Derribar', 'Debilitar'] };
export function normObjeto(o) {
  const consumible = o.clave && (o.municion || /^municion/.test(norm(o.nombre || '')) || CONSUMIBLE_MAGICO.test(norm(o.nombre || '')));
  const cat = CATEGORIAS.some(([k]) => k === o.cat) ? o.cat : o.clave ? (consumible ? 'consumible' : CAT_TIPO[o.tipo] || 'magico') : 'otro';
  const out = { ...o, id: o.id || uid('ob'), nombre: String(o.nombre || 'Objeto').trim(), cat, cantidad: Math.max(0, Math.round(num(o.cantidad, 1))), peso: Math.max(0, num(o.peso)),
    valor: String(o.valor || ''), notas: String(o.notas || ''), equipado: !!o.equipado, guardado: !!o.guardado && !o.equipado, magico: !!(o.magico || o.clave || o.rareza), sintonia: !!o.sintonia || !!efectoDe(o.nombre)?.sintonia, sintonizado: !!o.sintonizado };
  if (!out.sintonia) out.sintonizado = false;
  if (out.sintoniaCon != null) out.sintoniaCon = String(out.sintoniaCon || '');
  if (out.usos != null && !Array.isArray(out.usos)) delete out.usos;
  if (!out.equipado) delete out.mano;
  // Maza y lanza llevaban una maestría que no es la del manual de 2024: se corrige en las que ya estaban en el inventario
  const mal = out.arma && MAESTRIA_CORREGIDA[norm(out.arma.base || out.nombre)];
  if (mal && out.arma.maestria === mal[0]) out.arma = { ...out.arma, maestria: mal[1] };
  // Las armas y armaduras mágicas del libro llegaban sin daño ni CA: se completan con la normal de su nombre
  if (out.magico && (cat === 'arma' || cat === 'armadura') && !out.arma && !out.armadura) {
    const b = baseMagica(out.nombre);
    if (b?.arma && cat === 'arma') { out.arma = b.arma; if (!out.peso) out.peso = b.peso; }
    if (b?.armadura && cat === 'armadura') { out.armadura = b.armadura; if (!out.peso) out.peso = b.peso; }
  }
  return out;
}
export function normEquipo(ch) {
  const eq = equipoDe(ch);
  eq.objetos = eq.objetos.filter(Boolean).map(normObjeto);
  // Partidas antiguas: los recursos de cargas no sabían de qué objeto eran
  for (const o of eq.objetos) for (const id of [o.rasgo, ...(o.usos || [])].filter(Boolean)) { const r = (ch.rasgos || []).find(x => x.id === id); if (r && !r.objetoId) r.objetoId = o.id; }
  for (const [k] of MONEDAS) eq.monedas[k] = Math.max(0, Math.round(num(eq.monedas[k])));
  ordenarManos(eq);
  return eq;
}

const tirarDado = caras => 1 + Math.floor(Math.random() * caras);
// «1d6+3», «2d4 + 2» o «5»: tira la expresión
export function tirarCantidad(expr, tirar = tirarDado) {
  const m = /^(\d+)d(\d+)(?:\s*\+\s*(\d+))?$/.exec(String(expr || '').replace(/\s+/g, ''));
  if (!m) return parseInt(expr, 10) || 0;
  let t = +(m[3] || 0); for (let i = 0; i < +m[1]; i++) t += tirar(+m[2]); return t;
}
// Cargas del objeto como recurso de la hoja. max puede venir ya tirado (cargas de «1d3», cuentas de «1d6 + 3»)
export function rasgoDeCargas(o, max = o.cargas?.max) {
  const c = o.cargas; if (!c || !max) return null;
  const m = /^(\d+d\d+)(?:\+(\d+))?$/.exec(c.recarga || '');
  const nota = [c.cuentas ? 'Cuentas del objeto mágico.' : 'Cargas del objeto mágico.', c.ultima || ''].filter(Boolean).join(' ');
  const base = { id: uid('r'), tipo: 'recurso', nombre: `${o.nombre} (${c.cuentas ? 'cuentas' : 'cargas'})`, nota, maxBase: 'fijo', maxN: max, maxAb: 'car', dado: 'd20', nivMax: 5, escuela: '', espacioMin: 0, soloEspacio: true, efecto: 'aviso', efectoN: 5, texto: '', objeto: o.clave };
  if (m) return { ...base, recarga: 'dado', recDado: m[1], recBono: +(m[2] || 0), recMomento: 'largo' };
  if (/todas/.test(c.recarga || '')) return { ...base, recarga: 'largo' };
  if (/^\d+$/.test(c.recarga || '')) return { ...base, recarga: 'dado', recDado: `${c.recarga}d1`, recBono: 0, recMomento: 'largo' };
  return { ...base, recarga: 'nunca' };
}
// Dosis o unidades con las que se encuentra: «1d4 + 1 dosis», «1d6 + 4 pizcas», «3d4 judías», «1d4 + 4 canicas de fuerza»
export function dosisDe(t) {
  const m = /(\d+d\d+(?:\s*\+\s*\d+)?|\d+)\s+(dosis|pizcas|jud[ií]as|canicas)\b/i.exec(String(t || ''));
  return m ? m[1].replace(/\s+/g, '') : '';
}
// Añade un objeto de la biblioteca (ya concretado si tenía variantes): sus cargas y sus usos diarios pasan a la hoja como recursos
export function anadirObjeto(ch, o, tirar = tirarDado) {
  const e = normObjeto({ clave: o.clave, nombre: o.nombre, tipo: o.tipo, rareza: o.rareza, sintonia: !!o.sintonia, sintoniaCon: o.sintoniaCon || '', magico: true, cantidad: 1, rasgo: null,
    ...(o.arma ? { arma: o.arma, cat: 'arma' } : {}), ...(o.armadura ? { armadura: o.armadura, cat: 'armadura' } : {}), ...(o.peso ? { peso: o.peso } : {}),
    ...(o.municion ? { municion: o.municion } : {}), ...(o.base ? { base: o.base } : {}) });
  // Los bastones y varas que se empuñan como arma siguen siendo objetos mágicos en el inventario
  if (o.arma && o.tipo && !['Arma', 'Armadura'].includes(o.tipo)) e.cat = 'magico';
  const dosis = dosisDe(o.texto);
  if (dosis && e.cat === 'consumible') e.cantidad = Math.max(1, tirarCantidad(dosis, tirar));
  const eq = equipoDe(ch);
  // Pociones y otros consumibles iguales se apilan
  const igual = e.cat === 'consumible' && !o.cargas && eq.objetos.find(x => x.clave === e.clave && norm(x.nombre) === norm(e.nombre) && !x.rasgo);
  if (igual) { igual.cantidad += e.cantidad; return igual; }
  const r = rasgoDeCargas(o, o.cargas?.dado ? tirarCantidad(o.cargas.dado, tirar) : o.cargas?.max);
  if (r) { r.objetoId = e.id; (ch.rasgos ||= []).push(r); e.rasgo = r.id; }
  for (const u of o.usos || []) {
    const x = { ...rasgoDeCargas({ ...o, cargas: { max: 1 } }, 1), nombre: u.nombre, nota: 'Propiedad del objeto mágico: una vez y se recupera.', recarga: u.recarga === 'corto' ? 'corto' : 'largo', objetoId: e.id };
    (ch.rasgos ||= []).push(x); (e.usos ||= []).push(x.id);
  }
  eq.objetos.push(e);
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
  for (const id of [e.rasgo, ...(e.usos || [])].filter(Boolean)) { ch.rasgos = (ch.rasgos || []).filter(r => r.id !== id); if (ch.play?.rec) delete ch.play.rec[id]; }
  return e;
}
// Requisitos de sintonización: «por parte de un brujo, hechicero o mago», «de un lanzador de conjuros», «de un enano»…
const CLASES_REQ = { bardo: 'Bardo', brujo: 'Brujo', clerigo: 'Clérigo', druida: 'Druida', explorador: 'Explorador', guerrero: 'Guerrero', hechicero: 'Hechicero', mago: 'Mago', monje: 'Monje', paladin: 'Paladín', picaro: 'Pícaro', barbaro: 'Bárbaro' };
export function requisitoSintonia(ch, o) {
  const req = norm(o?.sintoniaCon || ''); if (!req) return '';
  const clases = Object.entries(CLASES_REQ).filter(([k]) => new RegExp(`\\b${k}s?\\b`).test(req)).map(([, c]) => c);
  const lanzador = /lanzador/.test(req), especie = /\benan[oa]\b/.test(req) ? 'enano' : /\belf[oa]\b/.test(req) ? 'elfo' : '';
  if (!clases.length && !lanzador && !especie) return '';
  const tiene = clasesDe(ch).map(c => c.clase);
  if (clases.some(c => tiene.includes(c))) return '';
  if (lanzador && (perfil(ch).cds.length || (ch.book || []).length)) return '';
  if (especie && norm(ch.especie || '').startsWith(especie)) return '';
  return `Solo puede sintonizarlo ${o.sintoniaCon.replace(/^parte de /, '')}.`;
}
// Por qué no se puede sintonizar ahora ('' si se puede)
export function motivoSintonia(ch, id) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return 'No está en el inventario.';
  if (e.sintonizado) return '';
  if (!e.sintonia) return `${e.nombre} no necesita sintonización.`;
  if (e.guardado) return 'Está en el alijo: llévalo encima para sintonizarlo.';
  if (sintonizados(ch).length >= MAX_SINTONIA) return `Ya hay ${MAX_SINTONIA} objetos sintonizados. Deshaz una sintonía antes.`;
  return requisitoSintonia(ch, e);
}
export function alternarSintonia(ch, id) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return false;
  if (!e.sintonizado && motivoSintonia(ch, id)) return false;
  e.sintonizado = !e.sintonizado; return true;
}

// Manos: un arma a dos manos ocupa las dos; el escudo, la secundaria si no se dice otra; cada arma de una mano, una.
// La armadura se lleva puesta aparte, y solo una. Equipar algo que no cabe suelta lo que estorba y lo devuelve a la mochila.
export const MANOS = ['principal', 'secundaria'];
export const aDosManos = o => (o?.arma?.props || []).some(p => norm(p) === 'dos manos');
export const esEscudo = o => o?.armadura?.tipo === 'escudo';
export const vaEnMano = o => !!(o?.arma || esEscudo(o));
export function manos(ch) {
  const out = { principal: null, secundaria: null };
  for (const o of equipoDe(ch).objetos) {
    if (!o.equipado || !vaEnMano(o)) continue;
    if (o.mano === 'ambas') { out.principal ||= o; out.secundaria ||= o; } else if (MANOS.includes(o.mano)) out[o.mano] ||= o;
  }
  return out;
}
export const armaduraPuesta = ch => equipoDe(ch).objetos.find(o => o.equipado && o.armadura && !esEscudo(o)) || null;
// Las partidas guardadas antes de las manos (o con más cosas en la mano de las que caben) se reparten aquí
function ordenarManos(eq) {
  const libre = { principal: true, secundaria: true }, peso = o => (MANOS.includes(o.mano) || o.mano === 'ambas' ? 0 : esEscudo(o) ? 1 : aDosManos(o) ? 2 : 3);
  let cuerpo = false;
  for (const o of eq.objetos) if (o.equipado && o.armadura && !esEscudo(o)) { if (cuerpo) o.equipado = false; cuerpo = true; }
  for (const o of eq.objetos.filter(x => x.equipado && vaEnMano(x)).sort((a, b) => peso(a) - peso(b))) {
    if (aDosManos(o)) { if (libre.principal && libre.secundaria) { o.mano = 'ambas'; libre.principal = libre.secundaria = false; } else { o.equipado = false; delete o.mano; } continue; }
    const quiere = MANOS.includes(o.mano) ? o.mano : esEscudo(o) ? 'secundaria' : 'principal', m = libre[quiere] ? quiere : MANOS.find(k => libre[k]);
    if (m) { o.mano = m; libre[m] = false; } else { o.equipado = false; delete o.mano; }
  }
}
export function equipar(ch, id, mano = '') {
  const eq = equipoDe(ch), e = eq.objetos.find(x => x.id === id); if (!e) return null;
  const quitados = [], soltar = x => { if (x && x !== e && x.equipado) { x.equipado = false; delete x.mano; if (!quitados.includes(x)) quitados.push(x); } };
  e.guardado = false;
  if (e.armadura && !esEscudo(e)) eq.objetos.forEach(x => { if (x.armadura && !esEscudo(x)) soltar(x); });
  else if (vaEnMano(e)) {
    const m = manos(ch), donde = aDosManos(e) ? 'ambas' : MANOS.includes(mano) ? mano
      : esEscudo(e) ? 'secundaria' : !m.principal || m.principal === e ? 'principal' : !m.secundaria || m.secundaria === e ? 'secundaria' : 'principal';
    if (donde === 'ambas') { soltar(m.principal); soltar(m.secundaria); } else soltar(m[donde]);
    e.mano = donde;
  }
  e.equipado = true;
  return { o: e, quitados };
}
export function desequipar(ch, id) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return null;
  e.equipado = false; delete e.mano; return e;
}
export function alternarEquipado(ch, id) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return null;
  return e.equipado ? (desequipar(ch, id), { o: e, quitados: [] }) : equipar(ch, id);
}
// Dos armas ligeras, una en cada mano: el ataque adicional de la propiedad Ligera
export function dosArmasLigeras(ch) {
  const { principal: a, secundaria: b } = manos(ch), ligera = o => (o?.arma?.props || []).some(p => norm(p) === 'ligera');
  return !!(a && b && a !== b && ligera(a) && ligera(b));
}
// Fuerza mínima y desventaja en Sigilo (tabla de armaduras de 2024). Las de mithral no tienen ninguna de las dos.
export function requisitosArmadura(o) {
  const a = o?.armadura; if (!a || esEscudo(o) || /mithral/.test(norm(o.nombre || ''))) return { fue: 0, sigilo: false };
  const b = a.fue == null || a.sigilo == null ? baseMagica(o.nombre)?.armadura : null;
  return { fue: +(a.fue ?? b?.fue ?? 0) || 0, sigilo: !!(a.sigilo ?? b?.sigilo ?? false) };
}
export function penalizacionArmadura(ch) {
  const a = armaduraPuesta(ch); if (!a) return { armadura: null, fue: 0, lenta: 0, sigilo: false };
  const r = requisitosArmadura(a);
  return { armadura: a, fue: r.fue, lenta: r.fue && (statsEfectivos(ch).fue || 10) < r.fue ? 3 : 0, sigilo: r.sigilo };
}

// Mochila o alijo: lo guardado (en la posada, en el carro, en casa) no se lleva encima y no pesa
export function alternarGuardado(ch, id) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return null;
  if (!e.guardado) { e.equipado = false; delete e.mano; if (e.sintonizado) e.sintonizado = false; }
  e.guardado = !e.guardado; return e;
}
export function cambiarCantidad(ch, id, d) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return null;
  e.cantidad = Math.max(0, e.cantidad + d); return e;
}

const pesoDe = os => os.reduce((s, o) => s + (o.peso || 0) * (o.cantidad || 0), 0);
export const pesoMonedas = ch => Object.values(equipoDe(ch).monedas).reduce((s, n) => s + (n || 0), 0) / 50 * 0.5;
export function pesoTotal(ch) {
  return Math.round((pesoDe(equipoDe(ch).objetos.filter(o => !o.guardado)) + pesoMonedas(ch)) * 10) / 10;
}
export const pesoGuardado = ch => Math.round(pesoDe(equipoDe(ch).objetos.filter(o => o.guardado)) * 10) / 10;
// Constitución poderosa (goliat): cuenta como un tamaño más (Grande, ×2); en Forma grande ya es Grande y cuenta como Enorme (×4)
export const capacidadCarga = ch => (statsEfectivos(ch).fue || 10) * 7.5 * (/goliat/i.test(ch.especie || '') ? ((ch.vida?.efectos || []).some(e => e.k === 'formagrande') ? 4 : 2) : 1);
// Empujar, arrastrar o levantar: hasta el doble de la capacidad de carga
export const capacidadArrastre = ch => capacidadCarga(ch) * 2;
export const valorMonedas = ch => Math.round(MONEDAS.reduce((s, [k, , v]) => s + (equipoDe(ch).monedas[k] || 0) * v, 0) * 100) / 100;

// Monedas, contadas en piezas de cobre para no arrastrar decimales
const PC = { ppt: 1000, po: 100, pe: 50, pp: 10, pc: 1 }, DE_MENOR = ['pc', 'pp', 'pe', 'po', 'ppt'];
export const enCobre = ch => DE_MENOR.reduce((s, k) => s + (equipoDe(ch).monedas[k] || 0) * PC[k], 0);
// El cambio se da en oro, plata y cobre, sin electro ni platino
const desglose = pc => { const out = { po: 0, pp: 0, pc: 0 }; for (const k of ['po', 'pp', 'pc']) { out[k] = Math.floor(pc / PC[k]); pc -= out[k] * PC[k]; } return out; };
// Paga primero con las monedas pequeñas; si no llega justo, rompe la más pequeña que quede y recibe el cambio
export function pagar(ch, po) {
  const m = equipoDe(ch).monedas; let falta = Math.round(num(po) * 100);
  if (!(falta > 0) || enCobre(ch) < falta) return null;
  const antes = { ...m };
  for (const k of DE_MENOR) { const n = Math.min(m[k] || 0, Math.floor(falta / PC[k])); m[k] -= n; falta -= n * PC[k]; }
  let cambio = 0;
  if (falta > 0) { const k = DE_MENOR.find(x => m[x] > 0); m[k]--; cambio = PC[k] - falta; for (const [c, n] of Object.entries(desglose(cambio))) m[c] += n; }
  return { cambio: cambio / 100, gasto: Object.fromEntries(DE_MENOR.map(k => [k, antes[k] - m[k]]).filter(([, n]) => n)) };
}
export function cobrar(ch, po) {
  const pc = Math.round(num(po) * 100); if (!(pc > 0)) return null;
  const m = equipoDe(ch).monedas, d = desglose(pc);
  for (const [k, n] of Object.entries(d)) m[k] = (m[k] || 0) + n;
  return d;
}
// Junta el cobre, la plata y el electro en las monedas más grandes (sin tocar el platino): pesa menos y se cuenta mejor
export function juntarMonedas(ch) {
  const m = equipoDe(ch).monedas, antes = DE_MENOR.reduce((s, k) => s + (m[k] || 0), 0);
  const d = desglose(['pc', 'pp', 'pe', 'po'].reduce((s, k) => s + (m[k] || 0) * PC[k], 0));
  Object.assign(m, d, { pe: 0 });
  return antes - DE_MENOR.reduce((s, k) => s + (m[k] || 0), 0);
}

// Valor y venta. Lo normal se vende por la mitad de su precio; gemas, joyas y obras de arte, por su valor entero.
export function valorEnPo(v) {
  const m = /(\d[\d.]*(?:,\d+)?)\s*(ppt|po|pe|pp|pc)\b/i.exec(String(v || '')); if (!m) return 0;
  return num(m[1].replace(/\.(?=\d{3}\b)/g, '')) * PC[m[2].toLowerCase()] / 100;
}
export const valorObjetos = ch => Math.round(equipoDe(ch).objetos.reduce((s, o) => s + valorEnPo(o.valor) * (o.cantidad || 0), 0) * 100) / 100;
export const precioVenta = o => Math.floor(valorEnPo(o.valor) * (o.cat === 'tesoro' ? 100 : 50)) / 100;
export function venderObjeto(ch, id, n = 1) {
  const e = equipoDe(ch).objetos.find(x => x.id === id); if (!e) return null;
  n = Math.max(1, Math.min(n, e.cantidad || 1));
  const precio = Math.round(precioVenta(e) * n * 100) / 100;
  if (precio) cobrar(ch, precio);
  if (n >= (e.cantidad || 1)) quitarObjeto(ch, id); else e.cantidad -= n;
  return { o: e, n, precio };
}

// La munición de cada arma: flechas para los arcos, virotes para las ballestas…
const MUNICION = [[/\barco/, /flecha/], [/ballesta/, /virote/], [/honda/, /balas? de honda|^balas?$/], [/cerbatana/, /aguja/], [/mosquete|pistola/, /balas? de (arma de )?fuego|cartucho/]];
export function municionDe(ch, o) {
  if (!(o?.arma?.props || []).some(p => norm(p).startsWith('municion'))) return null;
  const r = MUNICION.find(([a]) => a.test(norm(o.nombre))); if (!r) return null;
  const c = equipoDe(ch).objetos.filter(x => x !== o && !x.arma && !x.guardado && r[1].test(norm(x.nombre)));
  // La munición mágica que se haya elegido para disparar va primero
  return c.find(x => x.cantidad > 0 && x.id === o.municionId) || c.find(x => x.cantidad > 0) || c[0] || null;
}
// Pociones de curación (Guía del Dungeon Master de 2024)
const POCIONES = [[/suprema/, '10d4+20'], [/superior/, '8d4+8'], [/mayor/, '4d4+4'], [/./, '2d4+2']];
export const curacionDe = o => { const n = norm(o?.nombre || ''); return /^pocion(es)? de curacion/.test(n) ? POCIONES.find(([r]) => r.test(n))[1] : /^ung(u|ü)ento de keoghtom/.test(n) ? '2d8+2' : ''; };

// CA con los objetos mágicos puestos: Capa y Anillo de protección, Brazales de defensa, Ropajes del archimago…
export function claseArmadura(ch) {
  const base = claseArmaduraBase(ch), eq = equipoDe(ch), act = objetosActivos(ch);
  const armadura = eq.objetos.some(o => o.equipado && o.armadura && o.armadura.tipo !== 'escudo'), escudo = eq.objetos.some(o => o.equipado && o.armadura?.tipo === 'escudo');
  let { ca, detalle } = base;
  const cb = act.find(({ e }) => e.caBase);
  if (cb && !armadura) {
    const esc = eq.objetos.find(o => o.equipado && o.armadura?.tipo === 'escudo'), alt = cb.e.caBase + modOf(statsEfectivos(ch).des) + (esc ? (esc.armadura.base || 2) + (esc.armadura.bono || 0) : 0);
    if (alt > ca) { ca = alt; detalle = `${cb.o.nombre} (${cb.e.caBase} + Des)${esc ? ', escudo' : ''}`; }
  }
  const extra = [];
  for (const { o, e } of act) { if (!e.ca || (e.sinArmadura && (armadura || escudo))) continue; ca += e.ca; extra.push(`${o.nombre} +${e.ca}`); }
  return { ca, detalle: [detalle, ...extra].filter(Boolean).join(', ') };
}
function claseArmaduraBase(ch) {
  const eq = equipoDe(ch), st = statsEfectivos(ch), des = modOf(st.des), clases = clasesDe(ch).map(c => c.clase);
  const arm = eq.objetos.find(o => o.equipado && o.armadura && o.armadura.tipo !== 'escudo'), esc = eq.objetos.find(o => o.equipado && o.armadura?.tipo === 'escudo');
  const bonoEsc = esc ? (esc.armadura.base || 2) + (esc.armadura.bono || 0) : 0;
  if (arm) {
    const a = arm.armadura, maxDes = a.dex === 'max2' && a.tipo === 'media' && (st.des || 10) >= 16 && dotesDe(ch).some(x => norm(x.nombre) === 'maestro en armaduras medias') ? 3 : 2;
    const d = a.dex === 'no' ? 0 : a.dex === 'max2' ? Math.min(maxDes, des) : des;
    const def = tieneEstilo(ch, 'defensa') ? 1 : 0;
    return { ca: (a.base || 10) + (a.bono || 0) + d + bonoEsc + def, detalle: [`${arm.nombre} ${a.base + (a.bono || 0)}`, a.dex !== 'no' ? `Des ${d >= 0 ? '+' : ''}${d}` : '', esc ? `escudo +${bonoEsc}` : '', def ? 'Defensa +1' : ''].filter(Boolean).join(', ') };
  }
  const opciones = [{ ca: 10 + des + bonoEsc, detalle: `10 + Des${esc ? ', escudo' : ''}` }];
  if (clases.includes('Bárbaro')) opciones.push({ ca: 10 + des + modOf(st.con) + bonoEsc, detalle: `Defensa sin armadura (10 + Des + Con)${esc ? ', escudo' : ''}` });
  if (clases.includes('Monje') && !esc) opciones.push({ ca: 10 + des + modOf(st.sab), detalle: 'Defensa sin armadura (10 + Des + Sab)' });
  // Esplendor del genio (juramento de los genios nobles 3): 10 + Des + Con sin armadura, con escudo
  if (clasesDe(ch).some(c => c.clase === 'Paladín' && /genios/i.test(c.subclase || '') && c.nivel >= 3)) opciones.push({ ca: 10 + des + modOf(st.con) + bonoEsc, detalle: `Esplendor del genio (10 + Des + Con)${esc ? ', escudo' : ''}` });
  // Juego de pies deslumbrante (colegio de la danza 3): 10 + Des + Car sin armadura ni escudo
  if (!esc && clasesDe(ch).some(c => c.clase === 'Bardo' && /danza/i.test(c.subclase || '') && c.nivel >= 3)) opciones.push({ ca: 10 + des + modOf(st.car), detalle: 'Juego de pies deslumbrante (10 + Des + Car)' });
  if (clasesDe(ch).some(c => c.clase === 'Hechicero' && /drac[oó]n/i.test(c.subclase || '') && c.nivel >= 3)) opciones.push({ ca: 10 + des + modOf(st.car) + bonoEsc, detalle: `Resistencia dracónica (10 + Des + Car)${esc ? ', escudo' : ''}` });
  return opciones.sort((a, b) => b.ca - a.ca)[0];
}
const MEDIA = d => { const m = /^(\d+)d(\d+)$/.exec(String(d || '').trim()); return m ? +m[1] * (+m[2] + 1) / 2 : parseFloat(d) || 0; };
export const DADO_ARTES = L => (L >= 17 ? '1d12' : L >= 11 ? '1d10' : L >= 5 ? '1d8' : '1d6');
export const DANO_FURIA = L => (L >= 16 ? 4 : L >= 9 ? 3 : 2);
const efectoActivo = (ch, k) => (ch.vida?.efectos || []).some(e => e.k === k);
const conArmadura = ch => equipoDe(ch).objetos.some(o => o.equipado && o.armadura && o.armadura.tipo !== 'escudo');
const conEscudo = ch => equipoDe(ch).objetos.some(o => o.equipado && o.armadura?.tipo === 'escudo');
// Artes marciales: armas sencillas cuerpo a cuerpo y marciales ligeras, sin armadura ni escudo
function artesMarciales(ch, o, props, distancia) {
  const m = clasesDe(ch).find(c => c.clase === 'Monje'); if (!m || conArmadura(ch) || conEscudo(ch)) return null;
  if (!o.sinArmas && (distancia || (esMarcialArma(o) && !props.includes('ligera')))) return null;
  return DADO_ARTES(m.nivel);
}

// El golpe sin armas: 1 + Fuerza, o mejor con Artes marciales, Matón de taberna o el estilo Combate sin armas
export const GOLPE_SIN_ARMAS = 'sinarmas';
export function golpeSinArmas(ch) {
  const dotes = dotesDe(ch).map(d => norm(d.nombre));
  let dano = tieneEstilo(ch, 'sinarmas') ? '1d6' : dotes.includes('maton de taberna') ? '1d4' : '1', props = [];
  // Daño bárdico (colegio de la danza 3): sin armadura ni escudo, dado de inspiración + Destreza
  const danza = clasesDe(ch).find(c => c.clase === 'Bardo' && c.nivel >= 3 && /danza/i.test(c.subclase || ''));
  if (danza && !conArmadura(ch) && !conEscudo(ch)) { const d = danza.nivel >= 15 ? '1d12' : danza.nivel >= 10 ? '1d10' : danza.nivel >= 5 ? '1d8' : '1d6'; if (MEDIA(d) > MEDIA(dano)) dano = d; props = ['Sutil']; }
  // Armadura demoníaca: garras de 1d8 cortante con +1; Vendas de poder sin armas: +1, +2 o +3
  let tipo = 'contundente', bono = 0;
  const demonio = equipoDe(ch).objetos.find(o => o.equipado && o.armadura && /^armadura demoniaca/.test(norm(o.nombre)) && (!o.sintonia || o.sintonizado));
  if (demonio) { if (MEDIA('1d8') > MEDIA(dano)) dano = '1d8'; tipo = 'cortante'; bono += 1; }
  bono += Math.max(0, ...objetosActivos(ch).map(({ e }) => e.sinArmas || 0));
  return { id: GOLPE_SIN_ARMAS, nombre: 'Golpe sin armas', cat: 'arma', sinArmas: true, cantidad: 1, equipado: false, arma: { dano, tipo, props, maestria: '', distancia: '', bono } };
}
export const armasCombate = ch => [...equipoDe(ch).objetos.filter(x => x.arma), golpeSinArmas(ch)];
export const armaCombate = (ch, id) => armasCombate(ch).find(x => x.id === id) || null;

export function ataqueArma(ch, o) {
  const a = o.arma; if (!a) return null;
  const st = statsEfectivos(ch), fue = modOf(st.fue), des = modOf(st.des), props = (a.props || []).map(norm);
  const distancia = props.some(p => p.startsWith('municion')), sutil = props.includes('sutil');
  const artes = artesMarciales(ch, o, props, distancia), cancion = efectoActivo(ch, 'cancion') && clasesDe(ch).some(c => c.clase === 'Mago' && /hojacantante|cantante/i.test(c.subclase || ''));
  let mod = distancia ? des : sutil || artes ? Math.max(fue, des) : fue;
  // Brazales de arquería: competencia y +2 al daño con arcos cortos y largos
  const nombreBase = a.base || o.base || String(o.nombre || '').replace(/\s*\+\d+\s*$/, '').replace(/\s*\(.*\)\s*$/, ''), act = objetosActivos(ch);
  const arco = /^arco (corto|largo)$/.test(norm(nombreBase)), brazales = arco ? Math.max(0, ...act.map(({ e }) => e.danoArcos || 0)) : 0;
  const competente = !!o.sinArmas || !!brazales || competenteConArma(ch, o);
  if (cancion && competente && modOf(st.int) > mod) mod = modOf(st.int);
  // Munición mágica (Flechas +1…): su bonificador se suma al del arma
  const mun = distancia ? municionDe(ch, o) : null, bonoMun = mun ? bonoDeNombre(mun.nombre) : 0;
  const pb = competencia(nivelTotal(ch)), bono = (parseInt(a.bono, 10) || 0) + bonoMun;
  const s = n => (n >= 0 ? `+${n}` : String(n)), dosManos = props.includes('dos manos'), estilos = [];
  const atk = distancia && tieneEstilo(ch, 'arqueria') ? (estilos.push('Tiro con arco +2 al ataque'), 2) : 0;
  const dmg = !distancia && !dosManos && !o.sinArmas && tieneEstilo(ch, 'duelo') ? (estilos.push('Duelo +2 al daño (en una mano, sin otra arma)'), 2) : 0;
  if (props.includes('arrojadiza') && tieneEstilo(ch, 'arrojadizas')) estilos.push('+2 al daño al lanzarla (Combate con armas arrojadizas)');
  if (!distancia && (dosManos || props.some(p => p.startsWith('versatil'))) && tieneEstilo(ch, 'grandes')) estilos.push('a dos manos, los 1 y 2 del daño cuentan como 3');
  if (props.includes('ligera') && tieneEstilo(ch, 'dosarmas')) estilos.push('el ataque adicional con arma ligera suma el modificador al daño');
  if (o.sinArmas && tieneEstilo(ch, 'sinarmas')) estilos.push('1d8 si no empuñas armas ni escudo');
  // Furia: suma su daño a los ataques que usan la Fuerza
  const barb = clasesDe(ch).find(c => c.clase === 'Bárbaro'), furia = barb && efectoActivo(ch, 'furia') && mod === fue && !distancia ? DANO_FURIA(barb.nivel) : 0;
  if (furia) estilos.push(`Furia +${furia} al daño`);
  // Maestro en armas pesadas: +competencia al daño con armas pesadas en la acción de Ataque
  const pesadas = props.includes('pesada') && dotesDe(ch).some(d => norm(d.nombre) === 'maestro en armas pesadas') ? pb : 0;
  if (pesadas) estilos.push(`Maestro en armas pesadas +${pesadas} al daño`);
  for (const g of golpeExtra(ch)) estilos.push(`${g.nombre}: una vez por turno, +${g.dado} ${g.tipos} al impactar`);
  if (a.alImpactar) estilos.push(a.alImpactar);
  if (brazales) estilos.push(`Brazales de arquería +${brazales} al daño`);
  if (bonoMun) estilos.push(`${mun.nombre}: +${bonoMun} al ataque y al daño`);
  if (o.sinArmas && efectoActivo(ch, 'pugilismo')) estilos.push('Poción de pugilismo: +1d6 de daño de fuerza al impactar');
  const notas = [];
  if (artes) notas.push(`Artes marciales (${artes})`);
  if (cancion && mod === modOf(st.int)) notas.push('Canción de la hoja: usa tu Inteligencia');
  if (!competente) notas.push('Sin competencia: no sumas tu bonificador');
  let dado = a.dano || '1d4';
  if (artes && MEDIA(artes) > MEDIA(dado)) dado = artes;
  const md = mod + bono + dmg + furia + pesadas + brazales;
  const plano = !/d/.test(dado), total = plano ? Math.max(0, (parseInt(dado, 10) || 0) + md) : 0;
  const expr = plano ? String(total) : `${dado}${md ? s(md) : ''}`;
  // Versátil: empuñada a dos manos usa el dado mayor, y ya no cuenta para Duelo
  const dv = props.map(p => /^versatil \((\d+d\d+)\)/.exec(p)?.[1]).find(Boolean), mv = md - dmg;
  const versatil = dv && MEDIA(dv) > MEDIA(dado) ? { expr: `${dv}${mv ? s(mv) : ''}`, dano: `${dv}${mv ? ` ${s(mv).replace(/^([+-])/, '$1 ')}` : ''} ${a.tipo || ''}`.trim() } : null;
  return { mod: mod + bono, maestria: a.maestria || '', domina: (tieneMaestria(ch, o.nombre) || tieneMaestria(ch, nombreBase)) && !!a.maestria, ligera: props.includes('ligera'), expr, tipo: a.tipo || '', competente, notas, versatil,
    ataque: s(mod + (competente ? pb : 0) + bono + atk), dano: `${plano ? total : `${dado}${md ? ` ${s(md).replace(/^([+-])/, '$1 ')}` : ''}`} ${a.tipo || ''}`.trim(), estilos };
}
