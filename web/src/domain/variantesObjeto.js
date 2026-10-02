import { norm } from '../core/util.js';
import { PREDEFINIDOS } from './equipo.js';

// Objetos mágicos que la Guía del Dungeon Master describe con variantes: hay que concretarlos al añadirlos a la hoja.
//   · Arma, armadura o munición de base: «Arma (cualquiera sencilla o marcial)», «Espada vorpal (cimitarra, espada larga…)», «Malla élfica (camisa o cota de malla)».
//   · Bonificador +1, +2 o +3 según la rareza: «Arma +1, +2 o +3», «Vara del pacto», «Vendas de poder sin armas».
//   · Una tabla: potencia de la poción de curación, tipo de gigante, metal del cuerno del Valhalla, tipo de daño, nivel del conjuro…
const RAREZA = { comun: 'Común', infrecuente: 'Infrecuente', raro: 'Raro', 'muy raro': 'Muy raro', legendario: 'Legendario', artefacto: 'Artefacto' };
export const rarezaDe = s => RAREZA[norm(s).replace(/s$/, '').replace(/a$/, 'o')] || '';

const ARMAS = PREDEFINIDOS.filter(p => p.arma), ARMADURAS = PREDEFINIDOS.filter(p => p.armadura && p.armadura.tipo !== 'escudo');
const ESCUDO = PREDEFINIDOS.find(p => p.armadura?.tipo === 'escudo');
const MUNICIONES = PREDEFINIDOS.filter(p => /^(flechas|virotes|balas|agujas)/i.test(p.nombre));
const esMunicionArma = a => (a.arma.props || []).some(p => norm(p).startsWith('municion'));
// Nombres de la Guía que el Manual del Jugador llama de otra forma
const SINONIMOS = { 'hacha de guerra': 'hacha de batalla', 'maza a dos manos': 'mazo', 'camisa de malla': 'camisote de mallas', 'camisa de mallas': 'camisote de mallas',
  'cota de malla': 'cota de mallas', 'gran clava': 'garrote grande', 'armadura de cuero tachonado': 'armadura de cuero tachonado', 'cuero tachonado': 'armadura de cuero tachonado' };

function porNombre(sub, lista) {
  const partes = norm(sub).split(/\s*,\s*|\s+o\s+/).map(s => s.trim()).filter(Boolean), out = [];
  partes.forEach((p, i) => {
    let x = lista.find(b => norm(b.nombre) === (SINONIMOS[p] || p));
    // «arco corto o largo»: la segunda parte hereda el sustantivo de la primera
    if (!x && i && !/\s/.test(p)) { const s = `${partes[i - 1].split(/\s+/)[0]} ${p}`; x = lista.find(b => norm(b.nombre) === (SINONIMOS[s] || s)); }
    if (x && !out.includes(x)) out.push(x);
  });
  return out;
}
// Bases posibles según el subtipo de la línea de tipo
export function basesDe(o) {
  const st = norm(o?.subtipo || ''), n = norm(o?.nombre || '');
  if (o?.tipo === 'Arma') {
    if (/^municion/.test(n) || (/municion/.test(st) && !/cuerpo a cuerpo/.test(st))) return MUNICIONES;
    if (/cualquiera sencilla o marcial|^cualquier arma$/.test(st)) return ARMAS;
    if (/cuerpo a cuerpo/.test(st)) return [...ARMAS.filter(a => !esMunicionArma(a)), ...(/municion/.test(st) ? MUNICIONES : [])];
    return porNombre(st, ARMAS);
  }
  if (o?.tipo === 'Armadura') {
    if (st === 'escudo') return [ESCUDO];
    if (/ligera, media o pesada/.test(st)) return ARMADURAS;
    if (/media o pesada/.test(st)) return ARMADURAS.filter(a => a.armadura.tipo !== 'ligera' && !(/salvo/.test(st) && /pieles/.test(norm(a.nombre))));
    return porNombre(st, ARMADURAS);
  }
  return [];
}

// +1, +2 o +3 con su rareza: «infrecuente (+1), rara (+2) o muy rara (+3)»
export function masDe(o) {
  const linea = String(o?.linea || ''), out = [];
  for (const m of linea.matchAll(/(com[uú]n|infrecuente|muy rar[oa]|rar[oa]|legendari[oa])\s*\(\+(\d)\)/gi)) out.push({ n: +m[2], rareza: rarezaDe(m[1]) });
  if (!out.length && /\+1, \+2 o \+3/.test(o?.nombre || '')) [1, 2, 3].forEach((n, i) => out.push({ n, rareza: ['Infrecuente', 'Raro', 'Muy raro'][i] }));
  return out;
}

const DANO = ['Ácido', 'Frío', 'Fuego', 'Fuerza', 'Necrótico', 'Psíquico', 'Radiante', 'Relámpago', 'Trueno', 'Veneno'];
const GEMA = { 'Ácido': 'perla', 'Frío': 'turmalina', Fuego: 'granate', Fuerza: 'zafiro', 'Necrótico': 'azabache', 'Psíquico': 'jade', Radiante: 'topacio', 'Relámpago': 'citrino', Trueno: 'espinela', Veneno: 'amatista' };
const NIVELES = (rar, cd) => ['Truco', ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `Nivel ${n}`)].slice(0, rar.length).map((t, i) => [t, rar[i], `CD ${cd[i][0]}, ataque +${cd[i][1]}`]);
// [nombre del objeto, título del paso, opciones [nombre, rareza, detalle], nombre completo (la opción ya es el nombre del objeto)]
const TABLAS = [
  [/^pocion(es)? de curacion$/, 'Potencia', [['Poción de curación', 'Común', '2d4 + 2 PG'], ['Poción de curación (mayor)', 'Infrecuente', '4d4 + 4 PG'],
    ['Poción de curación (superior)', 'Raro', '8d4 + 8 PG'], ['Poción de curación (suprema)', 'Muy raro', '10d4 + 20 PG']], true],
  [/^pocion de fuerza de gigante$/, 'Gigante', [['Colinas', 'Infrecuente', 'Fuerza 21'], ['Escarcha', 'Raro', 'Fuerza 23'], ['Piedra', 'Raro', 'Fuerza 23'], ['Fuego', 'Raro', 'Fuerza 25'],
    ['Nubes', 'Muy raro', 'Fuerza 27'], ['Tormentas', 'Legendario', 'Fuerza 29']]],
  [/^cinturon de fuerza de gigante$/, 'Gigante', [['Colinas', 'Raro', 'Fuerza 21'], ['Escarcha', 'Muy raro', 'Fuerza 23'], ['Piedra', 'Muy raro', 'Fuerza 23'], ['Fuego', 'Muy raro', 'Fuerza 25'],
    ['Nubes', 'Legendario', 'Fuerza 27'], ['Tormentas', 'Legendario', 'Fuerza 29']]],
  [/^cuerno del valhalla$/, 'Metal', [['Plata', 'Raro', '2 espíritus; sin requisito'], ['Latón', 'Raro', '3 espíritus; competencia con las armas sencillas'],
    ['Bronce', 'Muy raro', '4 espíritus; entrenamiento con las armaduras medias'], ['Hierro', 'Legendario', '5 espíritus; competencia con las armas marciales']]],
  [/^instrumento de los bardos$/, 'Instrumento', [['Arpa de Anstruth', 'Muy raro'], ['Arpa de Ollamh', 'Legendario'], ['Bandora de Fochlucan', 'Infrecuente'], ['Cistro de Mac-Fuirmidh', 'Infrecuente'],
    ['Laúd de Doss', 'Infrecuente'], ['Lira de Cli', 'Raro'], ['Mandolina de Canaith', 'Raro']], true],
  [/^gema elemental$/, 'Gema', [['Corindón rojo', '', 'Elemental de fuego'], ['Diamante amarillo', '', 'Elemental de tierra'], ['Esmeralda', '', 'Elemental de agua'], ['Zafiro azul', '', 'Elemental de aire']]],
  [/^bolsa de trucos$/, 'Color', [['Gris'], ['Rojiza'], ['Marrón']]],
  [/^pergamino de conjuro$/, 'Nivel del conjuro', NIVELES(['Común', 'Común', 'Infrecuente', 'Infrecuente', 'Raro', 'Raro', 'Muy raro', 'Muy raro', 'Muy raro', 'Legendario'],
    [[13, 5], [13, 5], [13, 5], [15, 7], [15, 7], [17, 9], [17, 9], [18, 10], [18, 10], [19, 11]])],
  [/lanzaconjuro$/, 'Nivel del conjuro', NIVELES(['Infrecuente', 'Infrecuente', 'Raro', 'Raro', 'Muy raro', 'Muy raro', 'Legendario', 'Legendario', 'Legendario'],
    [[13, 5], [13, 5], [13, 5], [15, 7], [15, 7], [17, 9], [17, 9], [18, 10], [18, 10]])],
  [/^(armadura|pocion) de resistencia$/, 'Tipo de daño', DANO.map(d => [d])],
  [/^anillo de resistencia$/, 'Tipo de daño', DANO.map(d => [d, '', `Piedra: ${GEMA[d]}`])],
  [/^cota de escamas de dragon$/, 'Dragón', [['Azul', '', 'Resistencia al relámpago'], ['Blanco', '', 'Resistencia al frío'], ['Bronce', '', 'Resistencia al relámpago'], ['Cobre', '', 'Resistencia al ácido'],
    ['Negro', '', 'Resistencia al ácido'], ['Oro', '', 'Resistencia al fuego'], ['Oropel', '', 'Resistencia al fuego'], ['Plata', '', 'Resistencia al frío'], ['Rojo', '', 'Resistencia al fuego'], ['Verde', '', 'Resistencia al veneno']]],
];
// Variantes que el propio texto enumera: «Agilidad (muy rara). Mientras esta esfera…», «Búho de serpentina (raro).»
const VAR_TEXTO = /(?:^|\n|\. )([A-ZÁÉÍÓÚÑ][^.()\n]{2,45}?) \((comunes?|infrecuentes?|rar[oa]s?|muy rar[oa]s?|legendari[oa]s?)\)\./g;
const limpiar = v => { const w = v.split(/\s+/), i = w.findLastIndex((p, k) => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+$/.test(p) && w.slice(k + 1).every(x => /^[a-záéíóúñü]+$/.test(x))); return i >= 0 ? w.slice(i).join(' ') : v; };
export function variantesTexto(o) {
  if (!/^(piedra ioun|estatuilla de poder maravilloso|ficha de pluma)/.test(norm(o?.nombre || ''))) return [];
  const out = [];
  for (const m of String(o.texto || '').matchAll(VAR_TEXTO)) { const nombre = limpiar(m[1].trim()); if (!out.some(x => x.nombre === nombre)) out.push({ nombre, rareza: rarezaDe(m[2]) }); }
  return out;
}

// Pasos para concretar un objeto: [{ id: 'base' | 'mas' | 'var', titulo, opciones: [{ nombre, valor, rareza, sub }] }]
export function pasosVariante(o) {
  const n = norm(o?.nombre || ''), pasos = [];
  const bases = basesDe(o);
  if (bases.length > 1) pasos.push({ id: 'base', titulo: o.tipo === 'Armadura' ? 'Armadura de base' : /^municion/.test(n) || bases === MUNICIONES ? 'Munición' : 'Arma de base',
    opciones: bases.map(b => ({ nombre: b.nombre, valor: b.nombre, sub: b.arma ? `${b.arma.dano} ${b.arma.tipo}${(b.arma.props || []).length ? ` · ${b.arma.props.join(', ')}` : ''}` : b.armadura ? `CA ${b.armadura.base} · ${b.armadura.tipo}` : '' })) });
  const mas = masDe(o);
  if (mas.length > 1) pasos.push({ id: 'mas', titulo: 'Bonificador', opciones: mas.map(m => ({ nombre: `+${m.n}`, valor: m.n, rareza: m.rareza, sub: m.rareza })) });
  const t = TABLAS.find(([re]) => re.test(n));
  if (t) pasos.push({ id: 'var', titulo: t[1], completo: !!t[3], opciones: t[2].map(([nombre, rareza = '', sub = '']) => ({ nombre, valor: nombre, rareza, sub: [rareza, sub].filter(Boolean).join(' · ') })) });
  else { const v = variantesTexto(o); if (v.length > 1) pasos.push({ id: 'var', titulo: 'Tipo', opciones: v.map(x => ({ ...x, valor: x.nombre, sub: x.rareza })) }); }
  return pasos;
}

// Bonificador fijo que el texto da al arma o a la armadura («Recibes un bonificador de +3 a las tiradas de ataque y de daño…»)
export function bonoDeTexto(o) {
  const t = String(o?.texto || '');
  if (o?.tipo === 'Armadura') return +(/bonificador de \+(\d) a la clase de armadura(?! contra)/i.exec(t)?.[1] || 0);
  return +(/bonificador de \+(\d) a las tiradas de ataque y (?:a las tiradas )?de daño/i.exec(t)?.[1] || 0);
}
// Bastones y varas que se empuñan como arma: «se puede usar a modo de bastón mágico que otorga un bonificador de +2…», «funciona como una maza mágica…»
export function armaImplicita(o) {
  const m = /(?:a modo de|como) (?:un |una )?(bast[oó]n|maza) m[aá]gic[oa] que otorga un bonificador de \+(\d)/i.exec(String(o?.texto || '')); if (!m) return null;
  const b = ARMAS.find(a => norm(a.nombre) === norm(m[1])); return b ? { base: b, bono: +m[2] } : null;
}

const minus = s => s.charAt(0).toLowerCase() + s.slice(1);
const clonar = x => JSON.parse(JSON.stringify(x));
// Devuelve el objeto concretado: nombre definitivo, rareza, y los datos de arma o armadura de su base
export function concretar(o, eleccion = {}) {
  const pasos = pasosVariante(o), out = { ...o }, n = norm(o.nombre);
  const bases = basesDe(o), base = bases.length === 1 ? bases[0] : bases.find(b => b.nombre === eleccion.base) || null;
  const mas = masDe(o), m = mas.length === 1 ? mas[0] : mas.find(x => x.n === +eleccion.mas) || null;
  const pv = pasos.find(p => p.id === 'var'), v = pv?.opciones.find(x => x.valor === eleccion.var) || null;
  const generico = /^(arma|armadura|escudo|municion) \+1, \+2 o \+3$/.test(n);
  let nombre = o.nombre;
  if (generico) nombre = `${base ? base.nombre : o.nombre.replace(/ \+1, \+2 o \+3$/, '')}${m ? ` +${m.n}` : ''}`;
  else {
    if (m) nombre = /\+1, \+2 o \+3/.test(nombre) ? nombre.replace(/\+1, \+2 o \+3/, `+${m.n}`) : `${nombre} +${m.n}`;
    if (v && pv.completo) nombre = v.nombre;
    else {
      const extra = [base && bases.length > 1 ? minus(base.nombre) : '', v ? minus(v.nombre) : ''].filter(Boolean);
      if (/^piedra ioun$/.test(n) && v) nombre = `Piedra ioun de ${minus(v.nombre)}`;
      else if (extra.length) nombre = `${nombre} (${extra.join(', ')})`;
    }
  }
  out.nombre = nombre;
  const rar = v?.rareza || m?.rareza; if (rar) out.rareza = rar;
  if (base) out.base = base.nombre;
  const bono = m?.n || bonoDeTexto(o);
  if (base?.arma) { out.arma = { ...clonar(base.arma), bono, base: base.nombre }; out.peso = base.peso; }
  else if (base?.armadura) {
    out.armadura = { ...clonar(base.armadura), bono }; out.peso = base.peso;
    if (/mithral/.test(n)) { out.armadura.fue = 0; out.armadura.sigilo = false; }
  } else if (base && !base.arma && !base.armadura) { out.municion = base.nombre; out.peso = base.peso; }
  const imp = !base && armaImplicita(o);
  if (imp) { out.arma = { ...clonar(imp.base.arma), bono: imp.bono, base: imp.base.nombre }; out.base = imp.base.nombre; }
  if (out.arma) {
    const t = String(o.texto || '');
    // Espada solar: daño radiante y propiedad sutil
    const tipo = /que causa daño (\w+) en vez de daño/i.exec(t)?.[1]; if (tipo) out.arma.tipo = tipo.toLowerCase();
    if (/con la propiedad “sutil”|con la propiedad "sutil"/i.test(t) && !out.arma.props.includes('Sutil')) out.arma.props = [...out.arma.props, 'Sutil'];
    // Daño adicional al acertar (Lengua de fuego, Hierro de escarcha, Matadragones…): se recuerda junto al ataque
    const extra = t.split(/(?<=\.)\s+/).find(f => /\d+d\d+ de daño (?:de )?\w+ adicional/i.test(f));
    if (extra) out.arma.alImpactar = extra.trim().slice(0, 220);
  }
  out.concretado = true;
  return out;
}
