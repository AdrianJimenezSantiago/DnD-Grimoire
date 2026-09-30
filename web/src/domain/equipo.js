import { uid, norm } from '../core/util.js';
import { modOf, clasesDe, perfil, dotesDe, competencia, nivelTotal } from './reglas2024.js';
import { competenteConArma, esMarcial as esMarcialArma } from './competencias.js';
import { tieneEstilo } from './estilos.js';
import { tieneMaestria } from './maestria.js';
import { golpeExtra } from './variantes.js';
import { statsEfectivos, objetosActivos, efectoDe, bonoDeNombre } from './objetosEfecto.js';

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

// Arma o armadura mágica con nombre de una normal («Espada larga +1», «Escudo +2», «Cota de mallas +1»): toma sus datos y el bonificador
const BASES = [...PREDEFINIDOS].filter(p => p.arma || p.armadura).sort((a, b) => b.nombre.length - a.nombre.length);
export function baseMagica(nombre) {
  const n = norm(nombre || ''), p = BASES.find(x => n.includes(norm(x.nombre))); if (!p) return null;
  const bono = bonoDeNombre(nombre), c = JSON.parse(JSON.stringify(p));
  if (c.arma) c.arma.bono = bono; if (c.armadura) c.armadura.bono = bono;
  return c;
}
export function normObjeto(o) {
  const cat = CATEGORIAS.some(([k]) => k === o.cat) ? o.cat : o.clave ? (CAT_TIPO[o.tipo] || 'magico') : 'otro';
  const out = { ...o, id: o.id || uid('ob'), nombre: String(o.nombre || 'Objeto').trim(), cat, cantidad: Math.max(0, Math.round(num(o.cantidad, 1))), peso: Math.max(0, num(o.peso)),
    valor: String(o.valor || ''), notas: String(o.notas || ''), equipado: !!o.equipado, magico: !!(o.magico || o.clave || o.rareza), sintonia: !!o.sintonia || !!efectoDe(o.nombre)?.sintonia, sintonizado: !!o.sintonizado };
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
export const capacidadCarga = ch => (statsEfectivos(ch).fue || 10) * 7.5 * (/goliat/i.test(ch.especie || '') ? 2 : 1);
export const valorMonedas = ch => Math.round(MONEDAS.reduce((s, [k, , v]) => s + (equipoDe(ch).monedas[k] || 0) * v, 0) * 100) / 100;

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
  return { id: GOLPE_SIN_ARMAS, nombre: 'Golpe sin armas', cat: 'arma', sinArmas: true, cantidad: 1, equipado: false, arma: { dano, tipo: 'contundente', props, maestria: '', distancia: '' } };
}
export const armasCombate = ch => [...equipoDe(ch).objetos.filter(x => x.arma), golpeSinArmas(ch)];
export const armaCombate = (ch, id) => armasCombate(ch).find(x => x.id === id) || null;

export function ataqueArma(ch, o) {
  const a = o.arma; if (!a) return null;
  const st = statsEfectivos(ch), fue = modOf(st.fue), des = modOf(st.des), props = (a.props || []).map(norm);
  const distancia = props.some(p => p.startsWith('municion')), sutil = props.includes('sutil');
  const artes = artesMarciales(ch, o, props, distancia), cancion = efectoActivo(ch, 'cancion') && clasesDe(ch).some(c => c.clase === 'Mago' && /hojacantante|cantante/i.test(c.subclase || ''));
  let mod = distancia ? des : sutil || artes ? Math.max(fue, des) : fue;
  const competente = !!o.sinArmas || competenteConArma(ch, o);
  if (cancion && competente && modOf(st.int) > mod) mod = modOf(st.int);
  const pb = competencia(nivelTotal(ch)), bono = parseInt(a.bono, 10) || 0;
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
  for (const g of golpeExtra(ch)) estilos.push(`${g.nombre}: una vez por turno, +${g.dado} ${g.tipos} al impactar`);
  const notas = [];
  if (artes) notas.push(`Artes marciales (${artes})`);
  if (cancion && mod === modOf(st.int)) notas.push('Canción de la hoja: usa tu Inteligencia');
  if (!competente) notas.push('Sin competencia: no sumas tu bonificador');
  let dado = a.dano || '1d4';
  if (artes && MEDIA(artes) > MEDIA(dado)) dado = artes;
  const md = mod + bono + dmg + furia;
  const plano = !/d/.test(dado), total = plano ? Math.max(0, (parseInt(dado, 10) || 0) + md) : 0;
  const expr = plano ? String(total) : `${dado}${md ? s(md) : ''}`;
  return { mod: mod + bono, maestria: a.maestria || '', domina: tieneMaestria(ch, o.nombre) && !!a.maestria, ligera: props.includes('ligera'), expr, tipo: a.tipo || '', competente, notas,
    ataque: s(mod + (competente ? pb : 0) + bono + atk), dano: `${plano ? total : `${dado}${md ? ` ${s(md).replace(/^([+-])/, '$1 ')}` : ''}`} ${a.tipo || ''}`.trim(), estilos };
}
