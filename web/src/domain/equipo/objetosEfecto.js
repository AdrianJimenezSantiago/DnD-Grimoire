// Efectos pasivos de los objetos mágicos (CA, salvaciones, características fijadas, resistencias).
import { norm } from '../../core/util.js';

// Efectos de los objetos mágicos (Guía del Dungeon Master de 2024) que la hoja aplica sola.
// Se reconocen por el nombre, así que valen igual los importados del libro que los escritos a mano.
//   ca, salv, pruebas: bonificadores; fija: la característica pasa a ese valor si es menor;
//   suma: +n a una característica hasta un máximo (20); cd/atk: CD y ataque de conjuro;
//   sinArmadura: solo sin armadura ni escudo; caBase: CA base sin armadura (10 + Des pasa a caBase + Des);
//   habs: +n a las pruebas de una habilidad; reglas: ventajas que se aplican solas a las tiradas (como los rasgos pasivos);
//   res / inm: resistencias e inmunidades al daño; velMin: la velocidad pasa a ser al menos esa;
//   danoArcos: daño extra con arcos cortos y largos; sinArmas: bonificador a los golpes sin armas;
//   llevado: el arma da su efecto con solo llevarla y estar sintonizado, sin empuñarla.
const R = (sobre, efecto, extra = {}) => ({ sobre, efecto, ...extra });
const GIGANTE = [[/colinas?/, 21], [/escarcha|hielo/, 23], [/piedra/, 23], [/fuego/, 25], [/nubes?/, 27], [/tormentas?/, 29]];
const IONIANA = [[/^fuerza/, 'fue'], [/^(agilidad|destreza)/, 'des'], [/^(fortaleza|constitucion)/, 'con'], [/^(intelecto|inteligencia)/, 'int'], [/^(perspicacia|sabiduria|intuicion)/, 'sab'], [/^(liderazgo|carisma)/, 'car']];
const TIPOS = ['acido', 'frio', 'fuego', 'fuerza', 'necrotico', 'psiquico', 'radiante', 'relampago', 'trueno', 'veneno'];
const TIPO_TXT = { acido: 'ácido', frio: 'frío', fuego: 'fuego', fuerza: 'fuerza', necrotico: 'necrótico', psiquico: 'psíquico', radiante: 'radiante', relampago: 'relámpago', trueno: 'trueno', veneno: 'veneno' };
const DRAGON = { azul: 'relámpago', blanco: 'frío', bronce: 'relámpago', cobre: 'ácido', negro: 'ácido', oro: 'fuego', oropel: 'fuego', laton: 'fuego', plata: 'frío', rojo: 'fuego', verde: 'veneno' };
// «Anillo de resistencia (fuego)», «Armadura de resistencia (cota de mallas, frío)»: el tipo de daño entre paréntesis
const tipoEntre = n => { const p = /\(([^)]*)\)/.exec(n)?.[1] || ''; const t = TIPOS.find(x => new RegExp(`\\b${x}\\b`).test(p)); return t ? [TIPO_TXT[t]] : []; };
const BPS = ['contundente', 'cortante', 'perforante'];
const CONTRA_CONJUROS = R('salvacion', 'ventaja', { cond: 'contra conjuros' }), CONTRA_MAGIA = R('salvacion', 'ventaja', { cond: 'contra conjuros y otros efectos mágicos' });
const ALERTA = [R('iniciativa', 'ventaja'), R('prueba', 'ventaja', { hab: 'percepcion' })], VENENO = R('salvacion', 'ventaja', { cond: 'contra el estado de envenenado' });
const masN = n => { const m = /\+\s*(\d)\b/.exec(n); return m ? +m[1] : 0; };
export const OBJETOS_EFECTO = [
  { re: /^capa de proteccion/, sintonia: true, ca: 1, salv: 1 },
  { re: /^anillo de proteccion/, sintonia: true, ca: 1, salv: 1 },
  { re: /^piedra de la (buena )?(suerte|fortuna)/, sintonia: true, salv: 1, pruebas: 1 },
  { re: /^brazales de (la )?defensa/, sintonia: true, ca: 2, sinArmadura: true },
  { re: /^(ropajes?|tunicas?) (del|de los) archimagos?/, sintonia: true, caBase: 15, cd: 2, atk: 2, reglas: [CONTRA_MAGIA] },
  { re: /^baston de(l)? poder/, sintonia: true, ca: 2, salv: 2, atk: 2 },
  { re: /^baston de(l)? (los )?magos?\b/, sintonia: true, atk: 2, reglas: [CONTRA_CONJUROS] },
  { re: /^baston de los bosques/, sintonia: true, atk: 2 },
  { re: /^baston de escarcha/, sintonia: true, res: ['frío'] },
  { re: /^baston de fuego/, sintonia: true, res: ['fuego'] },
  { re: /^baston de(l)? acrobata/, sintonia: true, reglas: [R('prueba', 'ventaja', { hab: 'acrobacias' })] },
  { re: /^talisman del (bien puro|mal definitivo)/, sintonia: true, atk: 2 },
  { re: /^tunica de las estrellas/, sintonia: true, salv: 1 },
  { re: /^escarabajo protector/, sintonia: true, ca: 1, reglas: [CONTRA_CONJUROS] },
  { re: /^varita de orcus/, sintonia: true, ca: 3 },
  { re: /^filo de la fortuna/, sintonia: true, salv: 1, llevado: true },
  { re: /^guanteletes de (fuerza|poder) de ogro/, sintonia: true, fija: { fue: 19 } },
  { re: /^(diadema|cinta) de(l)? intelecto/, sintonia: true, fija: { int: 19 } },
  { re: /^amuleto de (la )?salud/, sintonia: true, fija: { con: 19 } },
  { re: /^cinturon de (la )?fuerza de(l)? gigante/, sintonia: true, fija: n => { const x = GIGANTE.find(([r]) => r.test(n)); return x ? { fue: x[1] } : null; } },
  { re: /^cinturon (enano|de los enanos)/, sintonia: true, suma: { con: 2 }, res: ['veneno'], reglas: [VENENO, R('prueba', 'ventaja', { hab: 'persuasion', cond: 'al tratar con enanos y duergars' })] },
  { re: /^hacha de los senores enanos/, sintonia: true, suma: { con: 2 }, res: ['fuego'], inm: ['veneno'], llevado: true },
  { re: /^piedra (ioniana|ioun) de(l)? proteccion/, sintonia: true, ca: 1 },
  { re: /^piedra (ioniana|ioun) de (la )?(consciencia|conciencia)/, sintonia: true, reglas: ALERTA },
  { re: /^piedra (ioniana|ioun)/, sintonia: true, suma: n => { const x = IONIANA.find(([r]) => r.test(n.replace(/^piedra (ioniana|ioun) de(l)? (la )?/, ''))); return x ? { [x[1]]: 2 } : null; } },
  // Focos de lanzamiento +1/+2/+3: ataque de conjuro y CD
  { re: /^(amuleto del devoto|grimorio arcano|vial de(l)? pozo de sangre|vial de sangre|hoz lunar|hoz de la luna|tambor del? (marca)?ritmos?|vara del pacto|vara del guardian del pacto|vara del guardian de pactos)\b/, sintonia: true, foco: true },
  { re: /^varita del mago de guerra/, sintonia: true, soloAtk: true },
  { re: /^vendas de poder sin armas/, sinArmasN: true },
  { re: /^guantes de ladron/, habs: { juegomanos: 5 } },
  { re: /^guantes de natacion y escalada/, sintonia: true, reglas: [R('prueba', 'plano', { valor: 5, hab: 'atletismo', cond: 'para nadar o trepar' })] },
  { re: /^botas de zancadas y brincos/, sintonia: true, velMin: 9 },
  { re: /^botas elficas/, reglas: [R('prueba', 'ventaja', { hab: 'sigilo' })] },
  { re: /^capa elfica/, sintonia: true, reglas: [R('prueba', 'ventaja', { hab: 'sigilo' })] },
  { re: /^capa de(l)? murcielago/, sintonia: true, reglas: [R('prueba', 'ventaja', { hab: 'sigilo' })] },
  { re: /^anteojos de vista de aguila/, reglas: [R('prueba', 'ventaja', { hab: 'percepcion', cond: 'si depende de la vista' })] },
  { re: /^anteojos de vision minuciosa/, reglas: [R('prueba', 'ventaja', { hab: 'investigacion', cond: 'si depende de la vista, a 30 cm o menos' })] },
  { re: /^manto de resistencia a conjuros/, sintonia: true, reglas: [CONTRA_CONJUROS] },
  { re: /^anillo de retorno de conjuros/, sintonia: true, reglas: [CONTRA_CONJUROS] },
  { re: /^escudo de guarda contra conjuros/, sintonia: true, reglas: [CONTRA_MAGIA] },
  { re: /^escudo centinela/, reglas: ALERTA },
  { re: /^vara de la alerta/, sintonia: true, reglas: ALERTA },
  { re: /^arma de advertencia/, sintonia: true, llevado: true, reglas: [R('iniciativa', 'ventaja')] },
  { re: /^collar de adaptacion/, sintonia: true, reglas: [VENENO] },
  { re: /^talisman de salud/, sintonia: true, reglas: [VENENO] },
  { re: /^brazales de arqueria/, sintonia: true, danoArcos: 2 },
  { re: /^cota de escamas de dragon/, sintonia: true, reglas: [R('salvacion', 'ventaja', { cond: 'contra los ataques de aliento de los dragones' })],
    res: n => { const c = Object.keys(DRAGON).find(k => new RegExp(`\\b${k}\\b`).test(/\(([^)]*)\)/.exec(n)?.[1] || '')); return c ? [DRAGON[c]] : []; } },
  { re: /^(anillo|armadura) de resistencia/, res: tipoEntre },
  { re: /^armadura de invulnerabilidad/, sintonia: true, res: BPS },
  { re: /^malla de ifrit/, sintonia: true, inm: ['fuego'] },
  { re: /^colgante de inmunidad al veneno/, sintonia: true, inm: ['veneno'] },
  { re: /^broche escudo/, sintonia: true, res: ['fuerza'] },
  { re: /^capa aracnida/, sintonia: true, res: ['veneno'] },
  { re: /^botas de las tierras invernales/, sintonia: true, res: ['frío'] },
  { re: /^yelmo de fulgor/, sintonia: true, res: ['fuego'] },
  { re: /^espada de kas/, sintonia: true, res: ['necrótico'], llevado: true },
  { re: /^martillo de rayos/, sintonia: true, martillo: true, llevado: true },
  { re: /^garrote grande atronador/, sintonia: true, fija: { fue: 20 }, llevado: true },
];

export function efectoDe(nombre) {
  const n = norm(nombre || '').replace(/\s+/g, ' ').trim(); if (!n) return null;
  const x = OBJETOS_EFECTO.find(e => e.re.test(n)); if (!x) return null;
  const N = masN(n), val = v => (typeof v === 'function' ? v(n) : v);
  const out = { sintonia: !!x.sintonia, ca: x.ca || 0, salv: x.salv || 0, pruebas: x.pruebas || 0, cd: x.cd || 0, atk: x.atk || 0, sinArmadura: !!x.sinArmadura, caBase: x.caBase || 0 };
  if (x.foco) { out.cd += N; out.atk += N; }
  if (x.soloAtk) out.atk += N;
  if (x.sinArmasN && N) out.sinArmas = N;
  const fija = val(x.fija), suma = val(x.suma), res = val(x.res);
  if (fija) out.fija = fija;
  if (suma) out.suma = suma;
  if (res?.length) out.res = res;
  if (x.inm) out.inm = x.inm;
  if (x.habs) out.habs = x.habs;
  if (x.reglas) out.reglas = x.reglas;
  if (x.velMin) out.velMin = x.velMin;
  if (x.danoArcos) out.danoArcos = x.danoArcos;
  if (x.llevado) out.llevado = true;
  if (x.martillo) out.martillo = true;
  return out;
}
// Qué hace el efecto, en una lista corta para enseñarlo en el inventario
const AB_N = { fue: 'Fuerza', des: 'Destreza', con: 'Constitución', int: 'Inteligencia', sab: 'Sabiduría', car: 'Carisma' };
const HAB_N = { juegomanos: 'Juego de manos', atletismo: 'Atletismo', sigilo: 'Sigilo', percepcion: 'Percepción', investigacion: 'Investigación', acrobacias: 'Acrobacias', persuasion: 'Persuasión' };
export function describirEfecto(e) {
  if (!e) return [];
  const b = [], s = n => (n > 0 ? `+${n}` : String(n));
  if (e.ca) b.push(`${s(e.ca)} CA${e.sinArmadura ? ' sin armadura ni escudo' : ''}`);
  if (e.caBase) b.push(`CA ${e.caBase} + Des sin armadura`);
  if (e.salv) b.push(`${s(e.salv)} a salvaciones`);
  if (e.pruebas) b.push(`${s(e.pruebas)} a pruebas`);
  if (e.cd && e.cd === e.atk) b.push(`${s(e.cd)} a CD y ataque de conjuro`); else { if (e.cd) b.push(`${s(e.cd)} a CD de conjuro`); if (e.atk) b.push(`${s(e.atk)} a ataque de conjuro`); }
  for (const [k, v] of Object.entries(e.fija || {})) b.push(`${AB_N[k]} ${v}`);
  for (const [k, v] of Object.entries(e.suma || {})) b.push(`${s(v)} ${AB_N[k]} (máx. 20)`);
  for (const [k, v] of Object.entries(e.habs || {})) b.push(`${s(v)} a ${HAB_N[k] || k}`);
  for (const r of e.reglas || []) b.push(`${r.efecto === 'plano' ? s(r.valor) : r.efecto} en ${r.sobre === 'salvacion' ? 'salvaciones' : r.sobre === 'prueba' ? HAB_N[r.hab] || 'pruebas' : r.sobre}${r.cond ? ` ${r.cond}` : ''}`);
  if (e.res?.length) b.push(`resistencia: ${e.res.join(', ')}`);
  if (e.inm?.length) b.push(`inmunidad: ${e.inm.join(', ')}`);
  if (e.velMin) b.push(`velocidad mínima ${e.velMin} m`);
  if (e.danoArcos) b.push(`+${e.danoArcos} al daño con arcos`);
  if (e.sinArmas) b.push(`+${e.sinArmas} al ataque y daño sin armas`);
  if (e.martillo) b.push('+4 a la Fuerza del cinturón o los guanteletes (máx. 30)');
  return b;
}

// Disponible: se puede usar (sus cargas, por ejemplo): lo llevas encima, quedan y, si pide sintonía, estás sintonizado
export const objetoDisponible = o => !!o && o.cantidad !== 0 && !o.guardado && (!o.sintonia || o.sintonizado);
// Un objeto cuenta si está disponible y, si es arma o armadura, equipado (salvo los que actúan con solo llevarlos)
export const objetoActivo = o => objetoDisponible(o) && (!(o.arma || o.armadura) || o.equipado || !!efectoDe(o.nombre)?.llevado);
export function objetosActivos(ch) {
  const out = [];
  for (const o of ch?.equipo?.objetos || []) { if (!objetoActivo(o)) continue; const e = efectoDe(o.nombre); if (e) out.push({ o, e }); }
  return out;
}
// Pociones de fuerza de gigante bebidas: su efecto dura 1 hora
export const POCION_FUERZA = { pfg21: 21, pfg23: 23, pfg25: 25, pfg27: 27, pfg29: 29 };
// Características con los objetos puestos: Guanteletes de fuerza de ogro, Diadema de intelecto, Piedras ioun, Cinturón enano…
export function statsEfectivos(ch) {
  const st = { ...(ch?.stats || {}) }, act = objetosActivos(ch);
  for (const { e } of act) for (const [k, v] of Object.entries(e.suma || {})) st[k] = Math.max(st[k] || 10, Math.min(20, (st[k] || 10) + v));
  let fijaFue = 0;
  for (const { e } of act) for (const [k, v] of Object.entries(e.fija || {})) { if (k === 'fue') fijaFue = Math.max(fijaFue, v); st[k] = Math.max(st[k] || 10, v); }
  // Martillo de rayos: la Fuerza del cinturón de fuerza de gigante o de los guanteletes sube 4, hasta 30
  if (fijaFue && act.some(({ e }) => e.martillo)) st.fue = Math.max(st.fue, Math.min(30, fijaFue + 4));
  for (const ef of ch?.vida?.efectos || []) if (POCION_FUERZA[ef.k]) st.fue = Math.max(st.fue || 10, POCION_FUERZA[ef.k]);
  return st;
}
// De dónde sale cada característica cambiada, para enseñarlo en la hoja
export function statsPorObjeto(ch) {
  const out = {};
  for (const { o, e } of objetosActivos(ch)) for (const k of Object.keys({ ...(e.fija || {}), ...(e.suma || {}), ...(e.martillo ? { fue: 1 } : {}) })) (out[k] ||= []).push(o.nombre);
  for (const ef of ch?.vida?.efectos || []) if (POCION_FUERZA[ef.k]) (out.fue ||= []).push(`Poción de fuerza de gigante (${POCION_FUERZA[ef.k]})`);
  return out;
}
const suma = (ch, k) => objetosActivos(ch).reduce((s, { e }) => s + (e[k] || 0), 0);
export const bonoSalvObjetos = ch => suma(ch, 'salv');
export const bonoPruebasObjetos = ch => suma(ch, 'pruebas');
export const bonoHabilidadObjetos = (ch, k) => objetosActivos(ch).reduce((s, { e }) => s + (e.habs?.[k] || 0), 0);
export const bonoMagiaObjetos = ch => ({ cd: suma(ch, 'cd'), atk: suma(ch, 'atk') });
export const fuentesDe = (ch, k) => objetosActivos(ch).filter(({ e }) => e[k]).map(({ o, e }) => `${o.nombre} ${e[k] > 0 ? '+' : ''}${e[k]}`);
// Ventajas que dan los objetos, con el mismo formato que los rasgos pasivos
export const pasivosObjetos = ch => objetosActivos(ch).filter(({ e }) => e.reglas?.length).map(({ o, e }) => ({ nombre: o.nombre, reglas: e.reglas }));
export const resistenciasObjetos = ch => objetosActivos(ch).flatMap(({ o, e }) => [...(e.res || []).map(tipo => ({ tipo, fuente: o.nombre })), ...(e.inm || []).map(tipo => ({ tipo, fuente: `${o.nombre} (inmunidad)` }))]);
export const velocidadMinimaObjetos = ch => Math.max(0, ...objetosActivos(ch).map(({ e }) => e.velMin || 0));

// Armas y armaduras mágicas: «Espada larga +1», «Escudo +2», «Armadura de placas +3»…
export const bonoDeNombre = nombre => masN(norm(nombre || ''));
